import * as THREE from './vendor/three.module.js';
import { GAS_URL } from './config.js';
const $=id=>document.getElementById(id);
const state={playing:false,mode:'touch',goals:0,shots:0,name:'',klass:'',difficulty:'medium',busy:false,aim:0,sound:true,camera:false,lastKick:0,poseReady:false};
let renderer,scene,camera,ball,keeper,keeperParts={},goal,aimPosition=new THREE.Vector3(),poseLandmarker,videoStream,previousAnkle=null,poseClock=0,shotAnim=null,keeperMove=null,celebrateUntil=0,lastFrame=performance.now(),lastPose=0;
const clock=new THREE.Clock();
const stadium=document.querySelector('#scene');
const scene3=new THREE.Scene(); scene=scene3;scene.background=new THREE.Color(0x0c2638);scene.fog=new THREE.FogExp2(0x0c2638,.008);
camera=new THREE.PerspectiveCamera(50,innerWidth/innerHeight,.1,300);camera.position.set(0,3.8,15.3);camera.lookAt(0,2.65,-8.0);
renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'high-performance'});renderer.setPixelRatio(Math.min(devicePixelRatio,1.7));renderer.setSize(innerWidth,innerHeight);renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.35;stadium.appendChild(renderer.domElement);
scene.add(new THREE.HemisphereLight(0x99ccff,0x233c20,2.1));const sun=new THREE.DirectionalLight(0xf6f8ed,3);sun.position.set(-17,32,9);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);Object.assign(sun.shadow.camera,{left:-32,right:32,top:35,bottom:-35});scene.add(sun);
const mat=(color,roughness=.8,metalness=0)=>new THREE.MeshStandardMaterial({color,roughness,metalness});const white=mat(0xe6f4ee),grass=[mat(0x21683d),mat(0x277848)],dark=mat(0x102936),stand=mat(0x293c50),gold=mat(0xc9f547),glove=mat(0xecf3ff),keeperMat=mat(0xffa12a),skin=mat(0xe7b08b),black=mat(0x121a24);
function box(w,h,d,m,x,y,z,parent=scene){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.receiveShadow=true;o.castShadow=true;parent.add(o);return o}
for(let i=0;i<20;i++)box(70,.03,2.1,grass[i%2],0,-.03,-20+i*2.1);
function line(points){const geometry=new THREE.BufferGeometry().setFromPoints(points.map(p=>new THREE.Vector3(...p)));const m=new THREE.LineBasicMaterial({color:0xedf4e9,transparent:true,opacity:.88});scene.add(new THREE.Line(geometry,m));}
line([[-23,.025,-14],[-23,.025,19],[23,.025,19],[23,.025,-14]]);line([[-11,.04,-14],[-11,.04,-.4],[11,.04,-.4],[11,.04,-14]]);line([[-5,.04,-14],[-5,.04,-8.5],[5,.04,-8.5],[5,.04,-14]]);
const penaltyMark=box(.3,.015,.3,white,0,.02,10);
// Goal face is at z=-12.5; shot begins z=11.
const GZ=-12.5;box(10,.23,.23,white,0,5.2,GZ);box(.23,5.2,.23,white,-5,2.6,GZ);box(.23,5.2,.23,white,5,2.6,GZ);
const netMat=new THREE.LineBasicMaterial({color:0xc5e2e9,transparent:true,opacity:.27});function netLine(a,b){const geo=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(...a),new THREE.Vector3(...b)]);scene.add(new THREE.Line(geo,netMat))}
for(let x=-5;x<=5.001;x+=.5){netLine([x,0,GZ-.1],[x,5.2,GZ-.1]);netLine([x,5.2,GZ-.1],[x,5.2,GZ-2.3]);netLine([x,0,GZ-.1],[x,0,GZ-2.3]);}
for(let y=0;y<=5.201;y+=.5)netLine([-5,y,GZ-.15],[5,y,GZ-.15]);for(let z=GZ-.1;z>=GZ-2.301;z-=.5){netLine([-5,5.2,z],[5,5.2,z]);netLine([-5,0,z],[5,0,z])}
for(let y=0;y<=5.201;y+=.5){netLine([-5,y,GZ],[ -5,y,GZ-2.3]);netLine([5,y,GZ],[5,y,GZ-2.3])}
// Stadium tiers, illuminated advertising, procedural crowd.
for(let side of [-1,1]){for(let tier=0;tier<9;tier++){const height=1.4+tier*.52;box(55,.4,1.5,stand,side*(24+tier*.52),height,-7);for(let z=-33;z<21;z+=1.5){if((Math.floor(z*7+tier*11)%5)!==0){const colors=[0xa4bbd5,0xf9df90,0x438a9d,0xd1e5e1,0x4aa26f];box(.18,.28,.16,mat(colors[(tier+Math.floor(z+40))%colors.length]),side*(23.5+tier*.52),height+.28,z)}}}}
for(let tier=0;tier<5;tier++){box(65,.3,1.6,stand,0,1.2+tier*.47,-55-tier*.85)}
for(let i=0;i<320;i++){const x=(Math.random()-.5)*62,y=2+Math.random()*4.8,z=-56-Math.random()*6;const colors=[0xdce6de,0x9be071,0x4ea8bb,0xf1d181];box(.16,.2,.13,mat(colors[i%4]),x,y,z)}
for(let x of [-27,27]){const pole=box(.32,24,.32,mat(0x737d87),x,12,-17);box(8,.5,.8,mat(0xe8ffff,.3),x,24,-17);const flood=new THREE.SpotLight(0xd3eaff,330,120,Math.PI/3,.65);flood.position.set(x,24,-16);flood.target.position.set(0,0,-5);scene.add(flood,flood.target)}
for(let i=0;i<8;i++){const x=-19+i*5.5;box(5,1,.18,mat(i%2?0x0c3d50:0x67a72a),x,.72,-19)}
function capsuleBetween(a,b,r,material,parent){const av=new THREE.Vector3(...a),bv=new THREE.Vector3(...b);let delta=bv.clone().sub(av);const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,delta.length(),10),material);mesh.position.copy(av.add(bv).multiplyScalar(.5));mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());mesh.castShadow=true;parent.add(mesh);return mesh}
keeper=new THREE.Group();keeper.position.set(0,0,GZ+3.3);keeper.scale.setScalar(1.95);scene.add(keeper);
const chest=box(1.04,1.32,.53,keeperMat,0,2.2,0,keeper);const shorts=box(.97,.5,.53,black,0,1.31,0,keeper);const head=new THREE.Mesh(new THREE.SphereGeometry(.39,24,18),skin);head.position.set(0,3.30,.12);head.castShadow=true;keeper.add(head);
// Face looks toward the player (+Z), with eyes, pupils, eyebrows, ears and nose.
const eyeWhite=mat(0xffffff), pupil=mat(0x142938),hair=mat(0x141923),mouth=mat(0x873d39),gloveBright=mat(0xd6fc4b);
for(const side of [-1,1]){
  const eye=new THREE.Mesh(new THREE.SphereGeometry(.085,12,10),eyeWhite);eye.position.set(side*.15,3.36,.46);keeper.add(eye);
  const pupilMesh=new THREE.Mesh(new THREE.SphereGeometry(.042,12,10),pupil);pupilMesh.position.set(side*.15,3.36,.535);keeper.add(pupilMesh);
  box(.18,.045,.06,hair,side*.15,3.52,.438,keeper);
  const ear=new THREE.Mesh(new THREE.SphereGeometry(.10,10,8),skin);ear.position.set(side*.40,3.29,.10);keeper.add(ear);
}
const nose=new THREE.Mesh(new THREE.SphereGeometry(.08,12,10),skin);nose.position.set(0,3.23,.51);keeper.add(nose);
box(.18,.03,.035,mouth,0,3.07,.48,keeper);
const hairCap=new THREE.Mesh(new THREE.SphereGeometry(.397,24,14,0,Math.PI*2,0,Math.PI*.43),hair);hairCap.position.set(0,3.35,.10);keeper.add(hairCap);
// Visible chest number and chest crest.
box(.22,.3,.035,white,0,2.28,.287,keeper);
const crest=new THREE.Mesh(new THREE.CircleGeometry(.09,16),gloveBright);crest.position.set(-.34,2.53,.295);keeper.add(crest);
keeperParts.leftArm=new THREE.Group();keeperParts.rightArm=new THREE.Group();for(let s of [-1,1]){let g=new THREE.Group();g.position.set(s*.66,2.65,.13);g.rotation.z=s*.36;keeper.add(g);capsuleBetween([0,0,0],[s*.25,-.9,.02],.17,keeperMat,g);const gloveObj=new THREE.Mesh(new THREE.BoxGeometry(.37,.30,.26),gloveBright);gloveObj.position.set(s*.30,-.88,.14);gloveObj.castShadow=true;g.add(gloveObj);keeperParts[s<0?'leftArm':'rightArm']=g;capsuleBetween([s*.27,1.15,0],[s*.36,.23,.03],.21,black,keeper);box(.39,.22,.68,white,s*.36,.14,.22,keeper)}
const ballGroup=new THREE.Group();ball=ballGroup;scene.add(ball);const sphere=new THREE.Mesh(new THREE.SphereGeometry(.42,32,20),white);sphere.castShadow=true;ball.add(sphere);const patchMat=mat(0x172633);for(let i=0;i<12;i++){const a=i*Math.PI*2/12,phi=(i%3+1)*Math.PI/4;const patch=new THREE.Mesh(new THREE.IcosahedronGeometry(.13,0),patchMat);patch.position.set(Math.sin(phi)*Math.cos(a)*.411,Math.cos(phi)*.411,Math.sin(phi)*Math.sin(a)*.411);patch.lookAt(0,0,0);ball.add(patch)}ball.position.set(0,.42,11);
const aimMarker=new THREE.Mesh(new THREE.TorusGeometry(.5,.06,7,40),new THREE.MeshBasicMaterial({color:0xc5ff65}));aimMarker.position.set(0,2.7,GZ+.2);scene.add(aimMarker);
function resize(){camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight)}window.addEventListener('resize',resize);
function setStatus(message,color='#ffe187'){ $('trackingText').textContent=message;$('trackingDot').style.color=color }
function setHint(message){$('hint').textContent=message}
function aimAt(x){state.aim=THREE.MathUtils.clamp(x,-1,1);aimMarker.position.x=state.aim*4.2;const visual=Math.round(state.aim*42);$('aim').style.left=(50+visual*.45)+'%'}
function beep(freq=440,duration=.12,type='sine',volume=.11){if(!state.sound)return;try{let ctx=beep.ctx||(beep.ctx=new (window.AudioContext||window.webkitAudioContext)());if(ctx.state==='suspended')ctx.resume();const oscillator=ctx.createOscillator(),gain=ctx.createGain();oscillator.type=type;oscillator.frequency.setValueAtTime(freq,ctx.currentTime);gain.gain.setValueAtTime(volume,ctx.currentTime);gain.gain.exponentialRampToValueAtTime(.001,ctx.currentTime+duration);oscillator.connect(gain);gain.connect(ctx.destination);oscillator.start();oscillator.stop(ctx.currentTime+duration)}catch{}}
function flash(message,color='#bdf84a'){const t=$('toast');t.textContent=message;t.style.color=color;t.classList.remove('show');void t.offsetWidth;t.classList.add('show')}
function randomKeeper(){const accuracy={easy:.23,medium:.48,hard:.73}[state.difficulty];const target=state.aim*4.1+(Math.random()-.5)*1.35;return Math.random()<accuracy?THREE.MathUtils.clamp(target+(.5-Math.random())*.8,-4.1,4.1):(Math.random()-.5)*8.3}
function kick(){if(!state.playing||state.busy||state.shots>=5)return;state.busy=true;state.lastKick=performance.now();const x=state.aim*4.2+(Math.random()-.5)*.55;const y=1.1+Math.random()*3.25;const kx=randomKeeper();const ky=1.75+Math.random()*.95;const saved=Math.abs(x-kx)<.95&&Math.abs(y-ky)<1.4;const missed=Math.abs(x)>4.85||y>4.9;state.shots++;const goalResult=!saved&&!missed;if(goalResult)state.goals++;
shotAnim={start:performance.now(),duration:1040,x,y,saved,missed,goalResult};keeperMove={start:performance.now(),kx};$('goals').textContent=state.goals;$('roundLabel').textContent=`${Math.min(state.shots+1,5)} / 5`;$('message').textContent='SHOOTING...';beep(160,.19,'sawtooth',.13);setTimeout(()=>{flash(missed?'MISS!':saved?'SAVED!':'GOOOAAAL!',missed?'#ffd166':saved?'#ff9877':'#c8ff5e');$('message').textContent=goalResult?'WHAT A STRIKE!':saved?'INCREDIBLE SAVE!':'SO CLOSE!';beep(goalResult?740:170,.45,'triangle',.15);if(goalResult){setTimeout(()=>beep(960,.45,'sine',.09),140)}},850);
setTimeout(()=>{ball.position.set(0,.42,11);ball.rotation.set(0,0,0);keeper.position.x=0;keeper.rotation.z=0;keeperParts.leftArm.rotation.z=-.36;keeperParts.rightArm.rotation.z=.36;state.busy=false;shotAnim=null;keeperMove=null;if(state.shots>=5)finish();else{$('message').textContent='READY FOR NEXT KICK';setHint('Tentukan arah dan sepak lagi!')}},2150)}
function updateScene(t){if(shotAnim){const p=THREE.MathUtils.clamp((t-shotAnim.start)/shotAnim.duration,0,1);const e=1-Math.pow(1-p,1.25);ball.position.set(shotAnim.x*e,.42+(shotAnim.y-.42)*e+Math.sin(p*Math.PI)*.55,11+(GZ-11)*e);ball.rotation.x=-p*17;ball.rotation.z=p*7;if(p>=1&&shotAnim.saved){ball.position.z=GZ+1.25;ball.position.y=Math.max(.4,shotAnim.y-.4)}}if(keeperMove){const p=THREE.MathUtils.clamp((t-keeperMove.start-220)/660,0,1);keeper.position.x=keeperMove.kx*(p<.5?2*p:1);keeper.rotation.z=-Math.sign(keeperMove.kx)*Math.min(Math.abs(keeperMove.kx)/10,.35)*p;keeperParts.leftArm.rotation.z=-.36-p*1.05;keeperParts.rightArm.rotation.z=.36+p*1.05}
aimMarker.material.opacity=.75+.2*Math.sin(t*.007);aimMarker.rotation.z=t*.0005;}
function loop(t){requestAnimationFrame(loop);updateScene(t);renderer.render(scene,camera);if(state.camera&&state.playing&&t-lastPose>70){lastPose=t;processPose(t)}}requestAnimationFrame(loop);
function saveLocal(row){const records=JSON.parse(localStorage.getItem('skg_penalty_scores')||'[]');records.push(row);records.sort((a,b)=>b.goals-a.goals||a.seconds-b.seconds);localStorage.setItem('skg_penalty_scores',JSON.stringify(records.slice(0,100)));}
function publishScore(row){if(!GAS_URL){setHint('Leaderboard LOCAL. Sambung Apps Script dalam config.js untuk simpan ke Sheets.');return}try{const form=document.createElement('form');form.method='POST';form.action=GAS_URL;form.target='scoreSink';form.style.display='none';const frame=document.createElement('iframe');frame.name='scoreSink';frame.style.display='none';frame.title='Score submission';document.body.appendChild(frame);for(const [k,v] of Object.entries(row)){const inp=document.createElement('input');inp.name=k;inp.value=String(v);form.appendChild(inp)}const action=document.createElement('input');action.name='action';action.value='save';form.appendChild(action);document.body.appendChild(form);form.submit();setHint('Markah dihantar ke Apps Script (pengesahan: semak Google Sheets).');setTimeout(()=>{form.remove();frame.remove()},15000)}catch(err){setHint('Gagal menghantar: '+err.message)}}
let startTime=0;
function finish(){state.playing=false;$('kickButton').disabled=true;const secs=Math.round((performance.now()-startTime)/1000);const row={name:state.name,klass:state.klass,goals:state.goals,shots:5,seconds:secs,level:state.difficulty,created:new Date().toISOString()};saveLocal(row);publishScore(row);$('message').textContent=`FULL TIME • ${state.goals}/5 GOALS`;flash(`FINAL ${state.goals} / 5`);setTimeout(()=>{$('overlay').classList.remove('hidden');$('startAR').textContent='📷 PLAY AGAIN WITH AR';$('startTouch').textContent='🎮 PLAY AGAIN TOUCH';},1300)}
async function begin(mode){const name=$('playerName').value.trim(),klass=$('playerClass').value.trim();if(!name||!klass){alert('Isi nama dan kelas dahulu.');return}state.name=name;state.klass=klass;state.difficulty=$('difficulty').value;state.goals=0;state.shots=0;state.playing=true;state.busy=false;$('overlay').classList.add('hidden');$('goals').textContent='0';$('attempts').textContent='5';$('roundLabel').textContent='1 / 5';$('playerLabel').textContent=name.toUpperCase();$('message').textContent='AIM & KICK!';$('kickButton').disabled=false;startTime=performance.now();aimAt(0);state.mode=mode;if(mode==='ar'){try{await activateCamera();setStatus('FOOT AR ACTIVE','#a7ff5b')}catch(e){state.mode='touch';setStatus('AR UNAVAILABLE','#ffb68c');setHint('AR gagal: '+e.message+' — gunakan TOUCH / keyboard.')}}else{setStatus('TOUCH ACTIVE','#b9e98a');setHint('Klik kawasan gol untuk sasarkan; tekan KICK untuk sepak.')}}
// V1.5: MediaPipe is served from THIS Vercel deployment, not jsDelivr/unpkg.
// npm run build copies the installed MediaPipe module, WASM and (when possible) the pose model.
async function loadPose(){
  setHint('Memuatkan pengesan kaki dari Vercel sendiri ...');
  let mp;
  try { mp=await import('./vendor/vision_bundle.mjs'); }
  catch(e){throw new Error('Modul AR tempatan tiada. Pastikan Vercel menjalankan npm run build (Output: dist). '+e.message)}
  let vision;
  try {vision=await mp.FilesetResolver.forVisionTasks(new URL('./vendor/wasm/',import.meta.url).href)}
  catch(e){throw new Error('WASM gagal dimuat: '+e.message)}
  const remoteModel='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
  let modelPath='./vendor/pose_landmarker_lite.task';
  try{const r=await fetch(modelPath,{method:'HEAD'});if(!r.ok)modelPath=remoteModel}
  catch{modelPath=remoteModel}
  const opts={baseOptions:{modelAssetPath:modelPath,delegate:'GPU'},runningMode:'VIDEO',numPoses:1,minPoseDetectionConfidence:.5,minPosePresenceConfidence:.5,minTrackingConfidence:.5};
  try {return await mp.PoseLandmarker.createFromOptions(vision,opts)}
  catch(err){
    setHint('GPU tidak tersedia, mencuba CPU ...');
    try{return await mp.PoseLandmarker.createFromOptions(vision,{...opts,baseOptions:{...opts.baseOptions,delegate:'CPU'}})}
    catch(err2){throw new Error('Model pose gagal: '+err2.message+' (GPU: '+err.message+')')}
  }
}
async function activateCamera(){
  if(!navigator.mediaDevices?.getUserMedia)throw new Error('Kamera memerlukan HTTPS dan kebenaran browser');
  const video=$('camera');
  try{
    if(!videoStream){
      setHint('Meminta kebenaran kamera ...');
      videoStream=await navigator.mediaDevices.getUserMedia({video:{facingMode:'user',width:{ideal:640},height:{ideal:480}},audio:false});
      video.srcObject=videoStream;await video.play();
    }
    if(!poseLandmarker)poseLandmarker=await loadPose();
    state.camera=true;state.poseReady=true;previousAnkle=null;
    $('cameraTag').textContent='LIVE • FOOT TRACKING';$('cameraButton').textContent='📷 AR ON';
    setHint('Undur sehingga kedua-dua kaki terlihat. Angkat lalu hayun satu kaki untuk menendang.');
  }catch(err){
    state.camera=false;state.poseReady=false;
    $('cameraTag').textContent='AR UNAVAILABLE';
    $('cameraButton').textContent='📷 RETRY AR';
    // Preserve the video preview for troubleshooting while allowing retry or Touch Mode.
    throw err;
  }
}
function processPose(t){const vid=$('camera');if(!poseLandmarker||vid.readyState<2)return;try{const res=poseLandmarker.detectForVideo(vid,t);const landmarks=res.landmarks?.[0];const cnv=$('skeleton');if(cnv.width!==vid.videoWidth){cnv.width=vid.videoWidth;cnv.height=vid.videoHeight}const ctx=cnv.getContext('2d');ctx.clearRect(0,0,cnv.width,cnv.height);if(!landmarks){setStatus('SHOW FULL BODY','#ffb97a');previousAnkle=null;return}const indices=[23,24,25,26,27,28,29,30,31,32];ctx.strokeStyle='#bdfb58';ctx.lineWidth=5;for(const [a,b] of [[23,25],[25,27],[24,26],[26,28],[23,24]]){if(landmarks[a].visibility>.45&&landmarks[b].visibility>.45){ctx.beginPath();ctx.moveTo(landmarks[a].x*cnv.width,landmarks[a].y*cnv.height);ctx.lineTo(landmarks[b].x*cnv.width,landmarks[b].y*cnv.height);ctx.stroke()}}for(let i of [27,28]){let p=landmarks[i];if(p.visibility>.45){ctx.beginPath();ctx.fillStyle='#d9ff6b';ctx.arc(p.x*cnv.width,p.y*cnv.height,12,0,Math.PI*2);ctx.fill()}}
const left=landmarks[27],right=landmarks[28],hipL=landmarks[23],hipR=landmarks[24];if(Math.min(left.visibility,right.visibility,hipL.visibility,hipR.visibility)<.5){setStatus('SHOW FEET','#ffba82');previousAnkle=null;return}setStatus('FEET TRACKED','#a6fb6b');const chosen=left.y<right.y?left:right;const hipWidth=Math.max(.08,Math.abs(hipL.x-hipR.x));const center=(hipL.x+hipR.x)/2;const target=THREE.MathUtils.clamp((.5-chosen.x)*2.2,-1,1);aimAt(state.aim*.86+target*.14);
const y=chosen.y;const dy=previousAnkle?(previousAnkle.y-y)/Math.max((t-previousAnkle.time)/1000,.03):0;const lifted=(Math.min(left.y,right.y)<Math.min(hipL.y,hipR.y)+.40);const motion=Math.min(1,Math.abs(dy)/1.1);$('motionBar').style.width=(motion*100)+'%';if(dy>.48&&lifted&&t-state.lastKick>1800&&!state.busy){kick();}previousAnkle={y,time:t};setHint(lifted?'Kaki dikesan — HAYUN untuk sepak!':'Angkat dan hayun kaki di depan kamera.');}catch(e){setStatus('TRACKING ERROR','#ffb97a');setHint('Tracking terganggu: '+e.message)}}
function fetchRemoteScores(){return new Promise((resolve,reject)=>{if(!GAS_URL){reject(new Error('Belum sambung Apps Script'));return}const cb='skgCallback'+Date.now();let done=false;const script=document.createElement('script');const timeout=setTimeout(()=>finish(new Error('Timeout leaderboard')),10000);function finish(error,data){if(done)return;done=true;clearTimeout(timeout);script.remove();delete window[cb];error?reject(error):resolve(data)}window[cb]=data=>finish(null,data);script.onerror=()=>finish(new Error('Gagal mengambil ranking'));script.src=GAS_URL+'?action=leaderboard&callback='+cb+'&t='+Date.now();document.body.appendChild(script)})}
async function showRanking(){const panel=$('ranking');panel.classList.remove('hidden');$('rankStatus').textContent='Memuatkan Top 10...';let rows=[];let label='';try{const result=await fetchRemoteScores();if(!result.ok)throw Error(result.error||'Invalid response');rows=result.rows||[];label='GOOGLE SHEETS • LEADERBOARD';}catch(e){rows=JSON.parse(localStorage.getItem('skg_penalty_scores')||'[]');label='LOCAL DEVICE • '+e.message}rows.sort((a,b)=>Number(b.goals)-Number(a.goals)||Number(a.seconds)-Number(b.seconds));$('rankStatus').textContent=label;const table=$('rankTable');table.replaceChildren();rows.slice(0,10).forEach((r,i)=>{let div=document.createElement('div');div.className='rankRow';const rank=document.createElement('strong');rank.textContent=i+1;const person=document.createElement('div');person.textContent=r.name||'Unknown';const klass=document.createElement('small');klass.textContent=r.klass||'';person.appendChild(document.createElement('br'));person.appendChild(klass);const lvl=document.createElement('small');lvl.textContent=(r.level||'').toUpperCase();const score=document.createElement('span');score.className='pts';score.textContent=`${r.goals}/5`;div.append(rank,person,lvl,score);table.appendChild(div)});if(!rows.length)table.textContent='Belum ada rekod. Mulakan permainan!'}
$('startAR').onclick=()=>begin('ar');$('startTouch').onclick=()=>begin('touch');$('kickButton').onclick=kick;$('cameraButton').onclick=async()=>{try{state.mode='ar';await activateCamera()}catch(e){setHint('Kamera gagal: '+e.message)}};$('modeButton').onclick=()=>{state.mode='touch';state.camera=false;setStatus('TOUCH MODE','#cbfb5e');setHint('Mod sentuh aktif. Tekan skrin atau guna arrow keys.');};$('soundButton').onclick=()=>{state.sound=!state.sound;$('soundButton').textContent=state.sound?'🔊 SOUND ON':'🔇 SOUND OFF'};$('leaderboardButton').onclick=showRanking;$('refreshRanking').onclick=showRanking;$('closeRanking').onclick=()=>$('ranking').classList.add('hidden');
renderer.domElement.addEventListener('pointerdown',e=>{if(!state.playing||state.mode!=='touch')return;const percent=e.clientX/innerWidth;aimAt((percent-.5)*2.1);setHint('Arah ditetapkan. Tekan KICK!')});window.addEventListener('keydown',e=>{if(!state.playing||['INPUT','SELECT'].includes(document.activeElement.tagName))return;if(e.key==='ArrowLeft'){e.preventDefault();aimAt(state.aim-.15)}if(e.key==='ArrowRight'){e.preventDefault();aimAt(state.aim+.15)}if(e.code==='Space'){e.preventDefault();kick()}});
setStatus('V1.5 • STADIUM READY','#c7fc69');
