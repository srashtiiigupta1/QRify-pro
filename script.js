const $=s=>document.querySelector(s),$$=s=>document.querySelectorAll(s);
const fields=$("#dynamicFields");let type="url",currentContent="",qrInstance=null;

const templates={
url:`<div class="field"><label>Website URL</label><input class="input" id="url" type="url" placeholder="https://example.com" autocomplete="url"></div>`,
text:`<div class="field"><label>Your text</label><textarea class="textarea" id="text" placeholder="Type any text, message or note..."></textarea></div>`,
email:`<div class="field"><label>Email address</label><input class="input" id="email" type="email" placeholder="hello@example.com" autocomplete="email"></div><div class="field"><label>Subject (optional)</label><input class="input" id="subject" placeholder="Hello from QRify"></div><div class="field"><label>Message (optional)</label><textarea class="textarea" id="message" placeholder="Write your message..."></textarea></div>`,
phone:`<div class="field"><label>Phone number</label><input class="input" id="phone" type="tel" placeholder="+91 98765 43210" autocomplete="tel"></div>`,
wifi:`<div class="field"><label>Wi-Fi network name (SSID)</label><input class="input" id="ssid" placeholder="My Wi-Fi" autocomplete="off"></div><div class="field"><label>Password</label><input class="input" id="password" type="text" placeholder="Your Wi-Fi password" autocomplete="off"></div><div class="field"><label>Security</label><select class="input" id="security"><option value="WPA">WPA / WPA2 / WPA3</option><option value="WEP">WEP</option><option value="nopass">No password</option></select></div><label class="check wifi-hidden"><input type="checkbox" id="hidden"> Hidden network</label>`
};

function renderFields(){fields.innerHTML=templates[type]}
renderFields();

$$(".type").forEach(b=>b.onclick=()=>{
  $$(".type").forEach(x=>x.classList.remove("active"));
  b.classList.add("active");type=b.dataset.type;renderFields();
});

function wifiEscape(v){
  // Wi-Fi QR standard: escape backslash, semicolon, comma and colon.
  return String(v).replace(/([\\;,:])/g,"\\$1");
}
function content(){
  if(type==="url"){
    let v=$("#url").value.trim(); if(!v)return "";
    if(!/^[a-z][a-z0-9+.-]*:\/\//i.test(v))v="https://"+v;
    try{new URL(v)}catch{return null}
    return v;
  }
  if(type==="text")return $("#text").value.trim();
  if(type==="email"){
    let e=$("#email").value.trim();if(!e||!e.includes("@"))return null;
    let p=new URLSearchParams();
    if($("#subject").value)p.set("subject",$("#subject").value);
    if($("#message").value)p.set("body",$("#message").value);
    return "mailto:"+e+(p.toString()?"?"+p.toString():"");
  }
  if(type==="phone"){
    let p=$("#phone").value.trim();return p?"tel:"+p:null;
  }
  let s=$("#ssid").value,p=$("#password").value,sec=$("#security").value;
  if(!s.trim())return null;
  let hidden=$("#hidden")?.checked?"true":"false";
  return `WIFI:T:${sec};S:${wifiEscape(s)};P:${wifiEscape(p)};H:${hidden};;`;
}

function compatibilityMode(){
  return $("#compatibility")?.checked;
}

function qrOptions(){
  const compat=compatibilityMode();
  return {
    text:currentContent,
    width:+$("#size").value,
    height:+$("#size").value,
    colorDark:compat?"#000000":$("#darkColor").value,
    colorLight:compat?"#ffffff":$("#lightColor").value,
    correctLevel:compat?QRCode.CorrectLevel.H:{
      L:QRCode.CorrectLevel.L,M:QRCode.CorrectLevel.M,Q:QRCode.CorrectLevel.Q,H:QRCode.CorrectLevel.H
    }[$("#ecc").value]
  };
}

function generate(){
  let c=content();
  if(!c){toast("Please enter valid content.");return}
  currentContent=c;
  $("#qr").innerHTML="";
  $("#placeholder").style.display="none";
  try{
    qrInstance=new QRCode($("#qr"),qrOptions());
    $("#badge").textContent=compatibilityMode()?"Scan-safe":"Generated";
    ["download","copy","share"].forEach(x=>$("#"+x).disabled=false);
    toast("QR code generated");
    saveHistory(c);
  }catch(e){
    console.error(e);
    toast("This content is too long for a QR code.");
  }
}

$("#generate").onclick=generate;
["size","ecc"].forEach(id=>$("#"+id).onchange=()=>currentContent&&generate());
$("#darkColor").oninput=()=>currentContent&&!compatibilityMode()&&generate();
$("#lightColor").oninput=()=>currentContent&&!compatibilityMode()&&generate();
$("#advancedBtn").onclick=()=>$("#advancedBtn").parentElement.classList.toggle("open");
$("#compatibility").onchange=()=>currentContent&&generate();

function renderedCanvas(){
  const raw=$("#qr").querySelector("canvas");
  if(!raw)return null;
  const addMargin=$("#quietZone")?.checked!==false;
  if(!addMargin)return raw;

  // Export a QR with an ISO/IEC-style quiet zone of at least 4 modules.
  // QRCode.js has no reliable export-margin option, so we add a clean white border
  // to the actual QR bitmap. This substantially improves camera/Lens detection.
  const margin=Math.max(24,Math.ceil(raw.width*0.12));
  const out=document.createElement("canvas");
  out.width=raw.width+margin*2;out.height=raw.height+margin*2;
  const ctx=out.getContext("2d");
  ctx.fillStyle=compatibilityMode()?"#ffffff":$("#lightColor").value;
  ctx.fillRect(0,0,out.width,out.height);
  ctx.imageSmoothingEnabled=false;
  ctx.drawImage(raw,margin,margin);
  return out;
}
function src(){return renderedCanvas()||$("#qr").querySelector("img")}

$("#download").onclick=()=>{
  let e=src();if(!e)return;
  let a=document.createElement("a");
  a.download=(($("#fileName").value.trim()||"qrify-code").replace(/[^\w-]/g,"-"))+".png";
  a.href=e.tagName==="CANVAS"?e.toDataURL("image/png"):e.src;a.click();toast("PNG downloaded with scan-safe margin");
};
$("#copy").onclick=async()=>{try{await navigator.clipboard.writeText(currentContent);toast("Encoded content copied")}catch{toast("Copy unavailable")}};
$("#share").onclick=async()=>{
  if(navigator.share){try{await navigator.share({title:"QRify QR Code",text:currentContent})}catch{}}
  else toast("Sharing isn't supported here");
};
$("#clear").onclick=()=>{
  currentContent="";$("#qr").innerHTML="";$("#placeholder").style.display="grid";$("#badge").textContent="Ready";
  ["download","copy","share"].forEach(x=>$("#"+x).disabled=true);toast("Preview cleared");
};

function saveHistory(c){
  let a=JSON.parse(localStorage.getItem("qrifyHistory")||"[]");
  a=[{content:c,date:new Date().toLocaleString(),type},...a.filter(x=>x.content!==c)].slice(0,8);
  localStorage.setItem("qrifyHistory",JSON.stringify(a));renderHistory();
}
function renderHistory(){
  let a=JSON.parse(localStorage.getItem("qrifyHistory")||"[]"),box=$("#history");
  if(!a.length){box.innerHTML='<div class="empty-history">Your recent QR codes will appear here.</div>';return}
  box.innerHTML="";
  a.forEach(x=>{
    let d=document.createElement("div");d.className="history-item";
    let t=document.createElement("div");t.className="history-thumb";new QRCode(t,{text:x.content,width:65,height:65,correctLevel:QRCode.CorrectLevel.H});
    let i=document.createElement("div");i.className="history-info";
    let b=document.createElement("b");b.textContent=x.content;
    let s=document.createElement("span");s.textContent=x.type.toUpperCase()+" · "+x.date;i.append(b,s);
    let u=document.createElement("button");u.textContent="↗";u.onclick=()=>reuse(x);d.append(t,i,u);box.append(d);
  });
}
function wifiUnescape(v){return v.replace(/\\([\\;,:])/g,"$1")}
function reuse(x){
  type=x.type;$$(".type").forEach(b=>b.classList.toggle("active",b.dataset.type===type));renderFields();
  if(type==="url")$("#url").value=x.content.replace(/^[a-z][a-z0-9+.-]*:\/\//i,"");
  else if(type==="text")$("#text").value=x.content;
  else if(type==="phone")$("#phone").value=x.content.replace(/^tel:/,"");
  else if(type==="email"){
    let u=new URL(x.content);$("#email").value=u.pathname;$("#subject").value=u.searchParams.get("subject")||"";$("#message").value=u.searchParams.get("body")||"";
  }else{
    let m=x.content.match(/S:((?:\\.|[^;])*)/);let pw=x.content.match(/P:((?:\\.|[^;])*)/);let sec=x.content.match(/T:([^;]*)/);let hid=x.content.match(/H:([^;]*)/);
    $("#ssid").value=wifiUnescape(m?.[1]||"");$("#password").value=wifiUnescape(pw?.[1]||"");$("#security").value=sec?.[1]||"WPA";if($("#hidden"))$("#hidden").checked=hid?.[1]==="true";
  }
  window.scrollTo({top:document.querySelector(".workspace").offsetTop-80,behavior:"smooth"});setTimeout(generate,100);
}
renderHistory();
$("#clearHistory").onclick=()=>{localStorage.removeItem("qrifyHistory");renderHistory();toast("History cleared")};
function toast(m){let t=$("#toast");t.textContent=m;t.classList.add("show");clearTimeout(window.__t);window.__t=setTimeout(()=>t.classList.remove("show"),2400)}
$("#helpBtn").onclick=()=>$("#guide").showModal();$("#closeGuide").onclick=()=>$("#guide").close();
$("#themeBtn").onclick=()=>{let d=document.documentElement.dataset.theme==="dark";document.documentElement.dataset.theme=d?"":"dark";localStorage.setItem("qrifyTheme",d?"light":"dark");$("#themeBtn").textContent=d?"☾":"☀"};
if(localStorage.getItem("qrifyTheme")==="dark"){document.documentElement.dataset.theme="dark";$("#themeBtn").textContent="☀"}
