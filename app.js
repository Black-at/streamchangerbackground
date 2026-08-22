
const $ = s => document.querySelector(s);
const state = { file:null };
const supabaseUrl = $('#supabaseUrl');
const room = $('#room');
const anonKey = $('#anonKey');
const statusPill = $('#statusPill');
const fileInput = $('#fileInput');
const dropZone = $('#dropZone');

supabaseUrl.value = localStorage.getItem('sd_supabase_url') || '';
room.value = localStorage.getItem('sd_room') || '';
anonKey.value = localStorage.getItem('sd_supabase_key') || '';

const base = () => supabaseUrl.value.trim().replace(/\/+$/,'');
const roomValue = () => room.value.trim().toLowerCase();
const key = () => anonKey.value.trim();
const headers = (extra={}) => ({apikey:key(),Authorization:`Bearer ${key()}`,...extra});

function setStatus(ok,text){
  statusPill.textContent=text;
  statusPill.classList.toggle('online',ok);
  statusPill.classList.toggle('offline',!ok);
}
function saveConfig(){
  localStorage.setItem('sd_supabase_url',base());
  localStorage.setItem('sd_room',roomValue());
  localStorage.setItem('sd_supabase_key',key());
}
$('#saveBtn').onclick=()=>{saveConfig();setStatus(true,'Config enregistrée')};

async function testConnection(){
  if(!base()||!key())return setStatus(false,'Config manquante');
  try{
    const r=await fetch(`${base()}/rest/v1/current_media?select=room&limit=1`,{headers:headers()});
    if(!r.ok)throw 0;
    setStatus(true,'Connecté');
  }catch{setStatus(false,'Connexion impossible')}
}
$('#testBtn').onclick=testConnection;

function chooseFile(file){
  if(!file)return;
  state.file=file;
  $('#fileName').textContent=file.name;
  $('#fileInfo').textContent=`${(file.size/1024/1024).toFixed(2)} Mo · ${file.type||'fichier'}`;
  $('#previewPanel').classList.remove('hidden');
  const u=URL.createObjectURL(file);
  if(file.type.startsWith('video/')){
    $('#imgPreview').classList.add('hidden');
    $('#videoPreview').classList.remove('hidden');
    $('#videoPreview').src=u;
  }else{
    $('#videoPreview').classList.add('hidden');
    $('#imgPreview').classList.remove('hidden');
    $('#imgPreview').src=u;
  }
}
$('#chooseBtn').onclick=()=>fileInput.click();
fileInput.onchange=()=>chooseFile(fileInput.files[0]);
['dragenter','dragover'].forEach(e=>dropZone.addEventListener(e,ev=>{ev.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(e=>dropZone.addEventListener(e,ev=>{ev.preventDefault();dropZone.classList.remove('drag')}));
dropZone.addEventListener('drop',e=>chooseFile(e.dataTransfer.files[0]));

async function upload(){
  if(!state.file)return;
  if(!base()||!key()||!roomValue())return alert('Configure Supabase + la room.');
  if(state.file.size>40*1024*1024)return alert('40 Mo maximum.');

  saveConfig();
  $('#sendBtn').disabled=true;
  $('#progressWrap').classList.remove('hidden');
  $('#progressBar').style.width='20%';
  $('#progressText').textContent='Envoi…';

  const ext=(state.file.name.split('.').pop()||'bin').toLowerCase();
  const version=Date.now().toString();
  const objectPath=`${roomValue()}/${version}.${ext}`;
  const encodedPath=objectPath.split('/').map(encodeURIComponent).join('/');

  try{
    const up=await fetch(`${base()}/storage/v1/object/streamdock-media/${encodedPath}`,{
      method:'POST',
      headers:headers({'Content-Type':state.file.type||'application/octet-stream','x-upsert':'true'}),
      body:state.file
    });
    if(!up.ok)throw new Error(await up.text());

    $('#progressBar').style.width='70%';
    const publicUrl=`${base()}/storage/v1/object/public/streamdock-media/${encodedPath}`;
    const row={room:roomValue(),version,name:state.file.name,type:state.file.type||'application/octet-stream',media_url:publicUrl,updated_at:new Date().toISOString()};

    const db=await fetch(`${base()}/rest/v1/current_media?on_conflict=room`,{
      method:'POST',
      headers:headers({'Content-Type':'application/json','Prefer':'resolution=merge-duplicates,return=minimal'}),
      body:JSON.stringify(row)
    });
    if(!db.ok)throw new Error(await db.text());

    $('#progressBar').style.width='100%';
    $('#progressText').textContent='Terminé';
    setStatus(true,'Média envoyé');
    await loadCurrent();
  }catch(e){
    setStatus(false,'Erreur');
    alert('Erreur : '+e.message);
  }finally{
    $('#sendBtn').disabled=false;
    setTimeout(()=>$('#progressWrap').classList.add('hidden'),1200);
  }
}
$('#sendBtn').onclick=upload;

async function loadCurrent(){
  if(!base()||!key()||!roomValue())return;
  try{
    const r=await fetch(`${base()}/rest/v1/current_media?room=eq.${encodeURIComponent(roomValue())}&select=*&limit=1&t=${Date.now()}`,{headers:headers({'Cache-Control':'no-cache'})});
    if(!r.ok)throw 0;
    const rows=await r.json();
    if(!rows.length){
      $('#currentEmpty').classList.remove('hidden');
      $('#currentMedia').classList.add('hidden');
      return;
    }
    const d=rows[0];
    $('#currentEmpty').classList.add('hidden');
    $('#currentMedia').classList.remove('hidden');
    $('#currentName').textContent=d.name||'Média';
    $('#currentDate').textContent=new Date(d.updated_at).toLocaleString();
    if((d.type||'').startsWith('video/')){
      $('#currentImg').classList.add('hidden');
      $('#currentVideo').classList.remove('hidden');
      $('#currentVideo').src=d.media_url;
    }else{
      $('#currentVideo').classList.add('hidden');
      $('#currentImg').classList.remove('hidden');
      $('#currentImg').src=d.media_url;
    }
    setStatus(true,'Connecté');
  }catch{setStatus(false,'Connexion impossible')}
}
$('#refreshBtn').onclick=loadCurrent;
testConnection().then(loadCurrent);
