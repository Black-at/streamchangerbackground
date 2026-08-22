
const $ = s => document.querySelector(s);
const state = { file:null };

const apiBase = $('#apiBase');
const room = $('#room');
const statusPill = $('#statusPill');
const fileInput = $('#fileInput');
const dropZone = $('#dropZone');
const previewPanel = $('#previewPanel');
const imgPreview = $('#imgPreview');
const videoPreview = $('#videoPreview');

apiBase.value = localStorage.getItem('sd_api') || '';
room.value = localStorage.getItem('sd_room') || '';

function normalizedBase(){
  return apiBase.value.trim().replace(/\/+$/,'');
}
function roomValue(){ return room.value.trim(); }
function mediaUrl(path){
  return path.startsWith('http') ? path : normalizedBase() + path;
}
function setStatus(ok, text){
  statusPill.textContent = text;
  statusPill.classList.toggle('online', ok);
  statusPill.classList.toggle('offline', !ok);
}
function saveConfig(){
  localStorage.setItem('sd_api', normalizedBase());
  localStorage.setItem('sd_room', roomValue());
}
$('#saveBtn').onclick = () => { saveConfig(); setStatus(true,'Config enregistrée'); };

async function testConnection(){
  if(!normalizedBase()) return setStatus(false,'API manquante');
  try{
    const r = await fetch(normalizedBase() + '/health', {cache:'no-store'});
    if(!r.ok) throw 0;
    setStatus(true,'Connecté');
  }catch{ setStatus(false,'Connexion impossible'); }
}
$('#testBtn').onclick = testConnection;

function chooseFile(file){
  if(!file) return;
  state.file=file;
  $('#fileName').textContent=file.name;
  $('#fileInfo').textContent=`${(file.size/1024/1024).toFixed(2)} Mo · ${file.type || 'fichier'}`;
  previewPanel.classList.remove('hidden');
  const url=URL.createObjectURL(file);
  if(file.type.startsWith('video/')){
    imgPreview.classList.add('hidden');
    videoPreview.classList.remove('hidden');
    videoPreview.src=url;
  }else{
    videoPreview.classList.add('hidden');
    imgPreview.classList.remove('hidden');
    imgPreview.src=url;
  }
}
$('#chooseBtn').onclick=()=>fileInput.click();
fileInput.onchange=()=>chooseFile(fileInput.files[0]);
['dragenter','dragover'].forEach(e=>dropZone.addEventListener(e,ev=>{ev.preventDefault();dropZone.classList.add('drag')}));
['dragleave','drop'].forEach(e=>dropZone.addEventListener(e,ev=>{ev.preventDefault();dropZone.classList.remove('drag')}));
dropZone.addEventListener('drop',e=>chooseFile(e.dataTransfer.files[0]));

async function upload(){
  if(!state.file) return;
  if(!normalizedBase() || !roomValue()) return alert('Configure l’API et la room.');
  saveConfig();

  const btn=$('#sendBtn');
  btn.disabled=true;
  $('#progressWrap').classList.remove('hidden');
  $('#progressBar').style.width='15%';
  $('#progressText').textContent='Envoi…';

  const fd=new FormData();
  fd.append('file',state.file);
  fd.append('room',roomValue());

  try{
    const r=await fetch(normalizedBase()+'/upload',{method:'POST',body:fd});
    const data=await r.json().catch(()=>({}));
    if(!r.ok) throw new Error(data.error || 'Erreur upload');
    $('#progressBar').style.width='100%';
    $('#progressText').textContent='Terminé';
    setStatus(true,'Média envoyé');
    await loadCurrent();
  }catch(e){
    setStatus(false,'Erreur');
    alert(e.message);
  }finally{
    btn.disabled=false;
    setTimeout(()=>$('#progressWrap').classList.add('hidden'),1400);
  }
}
$('#sendBtn').onclick=upload;

async function loadCurrent(){
  if(!normalizedBase() || !roomValue()) return;
  try{
    const r=await fetch(`${normalizedBase()}/latest?room=${encodeURIComponent(roomValue())}&t=${Date.now()}`,{cache:'no-store'});
    if(r.status===404){
      $('#currentEmpty').classList.remove('hidden');
      $('#currentMedia').classList.add('hidden');
      return;
    }
    if(!r.ok) throw 0;
    const d=await r.json();
    $('#currentEmpty').classList.add('hidden');
    $('#currentMedia').classList.remove('hidden');
    $('#currentName').textContent=d.name || 'Média';
    $('#currentDate').textContent=new Date(d.updatedAt).toLocaleString();
    const u=mediaUrl(d.mediaUrl);
    if((d.type||'').startsWith('video/')){
      $('#currentImg').classList.add('hidden');
      $('#currentVideo').classList.remove('hidden');
      $('#currentVideo').src=u;
    }else{
      $('#currentVideo').classList.add('hidden');
      $('#currentImg').classList.remove('hidden');
      $('#currentImg').src=u;
    }
    setStatus(true,'Connecté');
  }catch{ setStatus(false,'Connexion impossible'); }
}
$('#refreshBtn').onclick=loadCurrent;

testConnection().then(loadCurrent);
