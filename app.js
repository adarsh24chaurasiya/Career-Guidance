const S=JSON.parse(localStorage.getItem("cg")||"{}");
const $=q=>document.querySelector(q);
const save=()=>localStorage.setItem("cg",JSON.stringify(S));
const STEPS=["Profile","Assessment","Results","Roadmap","Certificate"];
const IDX={home:-1,profile:0,test:1,results:2,roadmap:3,cert:4};
const VW=["profile","test","results","roadmap","cert"];
const NEED=()=>({profile:1,test:S.profile,results:S.ans&&S.ans.filter(Boolean).length==9,roadmap:S.pick,cert:S.cert});
let note="";
function fix(k){const n=NEED(),j=VW.findIndex(v=>!n[v]);if(j<0||k<j)return VW[k];note=`Complete "${STEPS[j-1]}" first to open ${STEPS[k]}.`;return VW[j-1]}
function nav(k){go(fix(k))}
function menu(o){document.body.classList.toggle("open",o)}
function stage(k){S.stSel=k;S.skSel=null;delete S.draft;go("profile")}
const GOV=["gov","gvt","civ","ssc","def"];
let view=S.view||"home";

function hash(s){let h=2166136261;for(const c of s){h^=c.charCodeAt(0);h=Math.imul(h,16777619)}return h>>>0}
function cur(){return D[S.profile.st].p.find(x=>x.id==S.pick)}
function go(v){view=v;S.view=v;save();draw();window.scrollTo(0,0)}
function reset(){if(confirm("Clear your profile and progress?")){const c=localStorage.getItem("cgc");localStorage.clear();if(c)localStorage.setItem("cgc",c);location.reload()}}

function chg(r){
S.draft={nm:$("#nm").value,em:$("#em").value,bd:$("#bd").value};
S.stSel=$("#st").value;S.skSel=r?null:$("#sk").value;draw()
}
function saveProfile(){
const nm=$("#nm").value.trim(),em=$("#em").value.trim(),st=$("#st").value,bd=$("#bd").value.trim(),sk=$("#sk")?$("#sk").value:Object.keys(SUBJ[st])[0];
const m=[0,1,2].map(i=>parseFloat($("#m"+i).value));
if(!nm||!/^\S+@\S+\.\S+$/.test(em)||!bd||m.some(v=>isNaN(v)||v<0||v>100)){$("#er").textContent="Fill every field. Use a valid email and marks between 0 and 100.";return}
if(S.profile&&(S.profile.st!=st||S.profile.sk!=sk)){S.ans=[];S.pick=null;S.tasks={};S.cert=null}
S.profile={nm,em,st,sk,bd,m};delete S.stSel;delete S.skSel;delete S.draft;save();go("test")
}
function ans(i,n){S.ans=S.ans||[];S.ans[i]=n;save();draw()}
function submitTest(){
if(!S.ans||Array.from({length:9}).some((_,i)=>!S.ans[i])){$("#er").textContent="Answer all 9 statements to continue.";return}
go("results")
}
function rank(){
const pr=S.profile,d=D[pr.st],u=Array(9).fill(0),m=pr.m.slice(0,3),g=subs(pr.st,pr.sk).s,ks=Object.keys(SUBJ[pr.st]),sk=ks.includes(pr.sk)?pr.sk:ks[0];
d.q.forEach((x,i)=>u[x[0]]=(S.ans[i]-1)*25);
return d.p.map(p=>{
const df=(a,b)=>100-p.p.slice(a,b).reduce((s,v,i)=>s+Math.abs(v-u[a+i]),0)/(b-a);
const w=pr.st=="c10"?p.s.slice(0,3):[1,1,1],bad=p.f&&!p.f.includes(sk);
const ac=w.reduce((s,x,i)=>s+x*m[i],0)/w.reduce((s,x)=>s+x,0)*(bad?.55:1);
const sc=Math.round((.5*df(0,6)+.3*df(6,9)+.2*ac)*(bad?.8:1));
const top=p.p.slice(0,6).map((v,i)=>[v*u[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,2).map(x=>TR[x[1]]);
const sb=w.map((x,i)=>[x*m[i],i]).sort((a,b)=>b[0]-a[0])[0][1];
return{...p,sc,why:`Your ${top.join(" and ")} interests match this path, and your ${g[sb]} marks support it.${bad?" This path usually needs a different stream.":""}`}
}).sort((a,b)=>b.sc-a.sc)
}
function pick(id){S.pick=id;S.tasks={};S.cert=null;go("roadmap")}

function tasksFor(p){
const o=D[S.profile.st].p.filter(x=>x.id!=p.id).slice(0,3).map(x=>x.e),r=R[S.profile.st+"."+p.id]||[];
return[
{t:"Explore the field",k:"read",d:p.d},
{t:"Your full route",k:"read",d:"Follow these steps in order. Check every exam notice on the official website before applying.",h:`<ol class="steps">${r.map(x=>`<li>${x}</li>`).join("")}</ol>`},
{t:"Knowledge check",k:"quiz",d:`Which exam or entry route is most linked with ${p.n}?`,o:[p.e,...o].sort()},
{t:"Try a mini-activity",k:"text",min:40,d:p.a},
{t:"Reflect on the fit",k:"text",min:60,d:`Why does ${p.n} suit you, or why not? Write honestly.`},
{t:"Plan your preparation",k:"text",min:60,d:`Write a month-wise plan covering subjects, ${p.e} and your study habits.`},
{t:"Shortlist your options",k:"text",min:30,d:"List at least 3 colleges, institutes or recruitment bodies with one reason for each."},
{t:"Prepare a backup plan",k:"text",min:40,d:"Write what you will do if you are not selected the first time."}
]
}
function body(t,i){
const b=t.k=="read"?`<button class="btn" onclick="mark(${i})">I have read this</button>`:
`${t.k=="quiz"?`<div class="opts">${t.o.map(x=>`<label><input type="radio" name="qz" value="${x}">${x}</label>`).join("")}</div>`:`<textarea id="tx" rows="4" placeholder="Write at least ${t.min} characters"></textarea>`}<button class="btn" onclick="check(${i})">Submit task</button><p class="err" id="er2"></p>`;
return`<p>${t.d}</p>${t.h||""}${b}`
}
function mark(i){S.tasks[i]=1;save();draw()}
function check(i){
const t=tasksFor(cur())[i];let ok;
if(t.k=="quiz"){const r=document.querySelector("input[name=qz]:checked");ok=r&&r.value==cur().e}
else ok=$("#tx").value.trim().length>=t.min;
if(ok)mark(i);else $("#er2").textContent=t.k=="quiz"?"That is not the right answer. Pick again.":`Write at least ${t.min} characters to pass this task.`
}
function finish(){
if(!S.cert){
const p=cur(),pr=S.profile,seed=hash(pr.nm+pr.em+p.id+Date.now()+Math.random());
S.cert={id:"CG-"+new Date().getFullYear()+"-"+seed.toString(16).toUpperCase().padStart(8,"0"),seed,nm:pr.nm,path:p.n,stage:D[pr.st].l,sc:rank().find(x=>x.id==p.id).sc,date:new Date().toLocaleDateString("en-IN",{day:"numeric",month:"long",year:"numeric"})};
const all=JSON.parse(localStorage.getItem("cgc")||"[]");all.push(S.cert);localStorage.setItem("cgc",JSON.stringify(all))
}
go("cert")
}
function verify(){
const id=$("#vid").value.trim().toUpperCase(),c=JSON.parse(localStorage.getItem("cgc")||"[]").find(x=>x.id==id);
$("#vres").innerHTML=c?`Valid certificate. ${c.nm} completed ${c.path} (${c.stage}) on ${c.date}.`:"No certificate found with this ID."
}
function dl(){const a=document.createElement("a");a.download=S.cert.id+".png";a.href=$("#cv").toDataURL("image/png");a.click()}

function paint(){
const c=S.cert,cv=$("#cv"),x=cv.getContext("2d"),W=1200,H=850;let s=c.seed;
const r=()=>{s=s+0x6D2B79F5|0;let t=Math.imul(s^s>>>15,1|s);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296};
const h=Math.floor(r()*360),g=x.createLinearGradient(0,0,W,H);
g.addColorStop(0,"#fffaf0");g.addColorStop(1,`hsl(${h},55%,90%)`);x.fillStyle=g;x.fillRect(0,0,W,H);
for(let k=0;k<16;k++){
const a=r()*40+15,f=r()*5+2,ph=r()*6.28,y0=r()*H;
x.beginPath();x.strokeStyle=`hsla(${(h+k*12)%360},70%,50%,.2)`;x.lineWidth=1.6;
for(let i=0;i<=W;i+=6){const y=y0+Math.sin(i/W*f*6.28+ph)*a*3;i?x.lineTo(i,y):x.moveTo(i,y)}
x.stroke()
}
x.strokeStyle="#14102b";x.lineWidth=10;x.strokeRect(30,30,W-60,H-60);
x.strokeStyle=`hsl(${h},70%,45%)`;x.lineWidth=3;x.strokeRect(52,52,W-104,H-104);
x.textAlign="center";x.fillStyle="#14102b";
x.font="700 26px 'DM Sans',sans-serif";x.fillText("CAREER GUIDANCE PLATFORM",W/2,140);
x.font="800 66px 'Bricolage Grotesque',sans-serif";x.fillText("Certificate of Completion",W/2,230);
x.font="400 24px 'DM Sans',sans-serif";x.fillText("This certificate is proudly presented to",W/2,300);
x.fillStyle=`hsl(${h},70%,36%)`;x.font="800 72px 'Bricolage Grotesque',sans-serif";x.fillText(c.nm,W/2,400);
x.fillStyle="#14102b";x.font="400 26px 'DM Sans',sans-serif";x.fillText("for successfully completing the guidance roadmap in",W/2,465);
x.font="700 42px 'Bricolage Grotesque',sans-serif";x.fillText(c.path,W/2,530);
x.font="400 24px 'DM Sans',sans-serif";x.fillText(`${c.stage}  |  Match score ${c.sc}%`,W/2,580);
const n=8+Math.floor(r()*8),cx=W-230,cy=H-210;
x.beginPath();
for(let i=0;i<n*2;i++){const a=i*Math.PI/n,rad=i%2?62:88;i?x.lineTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad):x.moveTo(cx+Math.cos(a)*rad,cy+Math.sin(a)*rad)}
x.closePath();x.fillStyle=`hsl(${h},70%,42%)`;x.fill();
x.fillStyle="#fff";x.font="800 34px 'Bricolage Grotesque',sans-serif";x.fillText("CG",cx,cy+12);
x.fillStyle="#14102b";x.textAlign="left";x.font="500 22px 'DM Sans',sans-serif";
x.fillText("Date: "+c.date,110,H-170);x.fillText("Certificate ID: "+c.id,110,H-130);
x.font="400 18px 'DM Sans',sans-serif";x.fillText("A record of participation and learning. Not an academic qualification.",110,H-90)
}

const V={
home:()=>`<section class="hero"><h1>Know what to do after your exams</h1><p>Tell us about yourself, take a short assessment, get your best-fit pathways, complete a step-by-step roadmap and earn your own certificate.</p><button class="btn" onclick="go('${S.profile?"test":"profile"}')">${S.profile?"Continue your journey":"Start now"}</button></section>
<section class="grid3">${Object.entries(D).map(([k,v])=>`<button class="card stage" onclick="stage('${k}')"><h3>${v.l}</h3><p>${v.t}</p><span>Start here</span></button>`).join("")}</section>
<section class="card"><h3>Verify a certificate</h3><div class="row"><input id="vid" placeholder="CG-2026-XXXXXXXX"><button class="btn ghost" onclick="verify()">Verify</button></div><p id="vres" class="muted"></p></section>`,
profile:()=>{
const p={...S.profile,...S.draft},st=S.stSel||p.st||"c10",g=SUBJ[st],ks=Object.keys(g),sk=g[S.skSel||p.sk]?(S.skSel||p.sk):ks[0],su=g[sk].s,keep=p.m&&p.st==st&&p.sk==sk;
return`<section class="panel"><h2>Your profile</h2><p class="muted">${D[st].t}</p><div class="form"><label>Full name<input id="nm" value="${p.nm||""}"></label><label>Email<input id="em" type="email" value="${p.em||""}"></label><label>Education level<select id="st" onchange="chg(1)">${Object.entries(D).map(([k,v])=>`<option value="${k}" ${st==k?"selected":""}>${v.l}</option>`).join("")}</select></label>${ks.length>1?`<label>${st=="c12"?"Stream studied":"Degree completed"}<select id="sk" onchange="chg(0)">${ks.map(k=>`<option value="${k}" ${sk==k?"selected":""}>${g[k].l}</option>`).join("")}</select></label>`:""}<label>${st=="gr"?"University or college":"Board"}<input id="bd" value="${p.bd||""}"></label>${su.map((s,i)=>`<label>${s} marks (%)<input id="m${i}" type="number" min="0" max="100" value="${keep?p.m[i]:""}"></label>`).join("")}</div><p class="err" id="er"></p><button class="btn" onclick="saveProfile()">Save and continue</button></section>`},
test:()=>{const d=D[S.profile.st];return`<section class="panel"><h2>${d.l} assessment</h2><p class="muted">Rate each statement from 1 (not like me) to 5 (just like me).</p>${d.q.map((x,i)=>`<div class="q"><p>${i+1}. ${x[1]}</p><div class="scale">${[1,2,3,4,5].map(n=>`<button class="${(S.ans||[])[i]==n?"on":""}" onclick="ans(${i},${n})">${n}</button>`).join("")}</div></div>`).join("")}<p class="err" id="er"></p><button class="btn" onclick="submitTest()">Show my best paths</button></section>`},
results:()=>{
const all=rank(),g=(p,i)=>i<3?0:p.sc>=60?1:2,H=["Best matches for you","Also a good fit","Other options to explore"];
return`<section class="panel"><h2>${all.length} possibilities ${D[S.profile.st].l.toLowerCase()}</h2><p class="muted">Ranked by interest (50%), aptitude (30%) and marks (20%). Open any route and select the one you want to follow.</p><div class="chips">${all.map(p=>`<span>${p.n} ${p.sc}%</span>`).join("")}</div>${all.map((p,i)=>`${i==0||g(p,i)!=g(all[i-1],i-1)?`<h3 class="grp">${H[g(p,i)]}</h3>`:""}<div class="card res ${i<3?"top":""}"><div class="ring" style="--p:${p.sc}"><span>${p.sc}</span></div><div><h3>${p.n}</h3><p class="muted">${p.d}</p><p>${p.why}</p><details><summary>See full route</summary><ol class="steps">${(R[S.profile.st+"."+p.id]||[]).map(x=>`<li>${x}</li>`).join("")}</ol></details><button class="btn" onclick="pick('${p.id}')">Select this path</button></div></div>`).join("")}</section>`},
roadmap:()=>{const p=cur(),T=tasksFor(p),n=T.filter((_,i)=>S.tasks[i]).length,pc=Math.round(n/T.length*100);return`<section class="panel"><h2>${p.n} roadmap</h2><div class="bar"><i style="width:${pc}%"></i></div><p class="muted">${pc}% complete</p>${T.map((t,i)=>`<div class="task ${i<n?"done":i==n?"act":"lock"}"><div class="th"><b>${i+1}</b><h4>${t.t}</h4></div>${i==n?body(t,i):i<n?`<p class="muted">Completed</p>`:""}</div>`).join("")}${n==T.length?`<button class="btn" onclick="finish()">Get my certificate</button>`:""}</section>`},
cert:()=>`<section class="panel"><h2>Congratulations, ${S.cert.nm}</h2><p class="muted">Your certificate is unique to you. Keep its ID safe for verification.</p><canvas id="cv" width="1200" height="850"></canvas><div class="row"><button class="btn" onclick="dl()">Download certificate</button><button class="btn ghost" onclick="go('home')">Back to home</button></div></section>`
};

function draw(){
if(view!="home")view=fix(VW.indexOf(view));
const i=IDX[view];
const items=STEPS.map((s,k)=>`<button class="${k<i?"d":k==i?"a":NEED()[VW[k]]?"":"l"}" onclick="nav(${k})">${s}</button>`).join("");
$("#steps").innerHTML=items;
$("#drawer").innerHTML=`<button class="x" aria-label="Close menu" onclick="menu(0)">&#10005;</button><button class="${view=="home"?"a":""}" onclick="go('home')">Home</button>`+items;
$("#app").innerHTML=(note?`<p class="note">${note}</p>`:"")+V[view]();note="";
menu(0);
if(view=="cert")paint()
}
addEventListener("scroll",()=>menu(0),{passive:true});
addEventListener("keydown",e=>{if(e.key=="Escape")menu(0)});
draw();