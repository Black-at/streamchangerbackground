const $=s=>document.querySelector(s);
let file=null, base=localStorage.getItem("bridge")||"";
$("#bridge").value=base;
function B(){return $("#bridge").value.trim().replace(/\/+$/,"")}
async function refresh(){
 try{
  let r=await fetch(B()+"/api/current?t="+Date.now());
  if(!r.ok)throw 0; let d=await r.json();
  $("#state").textContent="Connecté";$("#state").style.color="#64df9d";
  if(!d.exists){$("#current").innerHTML="Aucun média";return}
  let u=B()+"/api/media?t="+Date.now();
  $("#current").innerHTML=d.type.startsWith("video/")?`<video src="${u}" autoplay muted loop controls></video>`:`<img src="${u}">`;
 }catch(e){$("#state").textContent="Hors ligne";$("#state").style.color="#ff7777"}
}
$("#connect").onclick=()=>{localStorage.setItem("bridge",B());refresh()};
$("#pick").onclick=()=>$("#file").click();
$("#file").onchange=e=>{file=e.target.files[0];if(!file)return;let u=URL.createObjectURL(file);
 $("#preview").innerHTML=file.type.startsWith("video/")?`<video src="${u}" controls muted loop></video>`:`<img src="${u}">`;$("#send").disabled=false};
$("#send").onclick=async()=>{if(!file)return;$("#send").disabled=true;$("#send").textContent="Envoi...";
 try{let r=await fetch(B()+"/api/upload",{method:"POST",headers:{"Content-Type":file.type||"application/octet-stream","X-Filename":encodeURIComponent(file.name)},body:file});
 if(!r.ok)throw new Error(await r.text());$("#send").textContent="Envoyé ✓";await refresh()}
 catch(e){alert("Erreur : "+e.message);$("#send").textContent="Réessayer"}finally{$("#send").disabled=false}};
if(base)refresh();
