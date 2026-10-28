import fs from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd(), dist=path.join(root,'dist');
await fs.mkdir(path.join(dist,'vendor','wasm'),{recursive:true});
await fs.copyFile(path.join(root,'node_modules','three','build','three.module.js'),path.join(dist,'vendor','three.module.js'));
for (const name of ['index.html','style.css','game.js','config.js']) await fs.copyFile(path.join(root,name),path.join(dist,name));
const lib=path.join(root,'node_modules','@mediapipe','tasks-vision');
await fs.copyFile(path.join(lib,'vision_bundle.mjs'),path.join(dist,'vendor','vision_bundle.mjs'));
const wasm=path.join(lib,'wasm');
for (const file of await fs.readdir(wasm)) if (file.endsWith('.wasm')||file.endsWith('.js')) await fs.copyFile(path.join(wasm,file),path.join(dist,'vendor','wasm',file));
const url='https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';
const controller=new AbortController(), timer=setTimeout(()=>controller.abort(),30000);
try{const res=await fetch(url,{signal:controller.signal}); if(!res.ok)throw Error('HTTP '+res.status);await fs.writeFile(path.join(dist,'vendor','pose_landmarker_lite.task'),new Uint8Array(await res.arrayBuffer()));console.log('Pose model copied locally')}catch(e){console.warn('Pose model could not be downloaded during build; runtime will try Google storage. '+e.message)}finally{clearTimeout(timer)}
console.log('Built V1.5 dist with Three.js + MediaPipe JS + WASM');
