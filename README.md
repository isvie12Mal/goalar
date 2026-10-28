# SKG Football AR Penalty V1.5 — semak deployment dahulu

## Penting: Screenshot ralat CDN lama
Jika skrin masih memaparkan `cdn.jsdelivr.net/npm/@mediapipe/tasks-vision` atau `unpkg.com`, itu bermakna kod lama masih dipaparkan. **V1.5 tidak mengimport MediaPipe daripada kedua-dua alamat tersebut.** Pastikan badge hijau `V1.5 • LOCAL AR BUILD` di sudut kanan atas.

## Upload GitHub
1. Extract ZIP. Buka repo yang tersambung ke Vercel, pilih branch deployment (kebiasaannya `main`).
2. Gantikan semua fail di ROOT repo (bukan dalam folder bersarang): `index.html`, `game.js`, `style.css`, `config.js`, `Code.gs`, `package.json`, `vercel.json`, `README.md`, dan `scripts/build.mjs`.
3. Commit changes. Semak commit hash pada Vercel > Deployments supaya sama dengan commit GitHub.
4. Vercel > Settings > Build and Deployment: Framework `Other`, Install Command `npm install`, Build Command `npm run build`, Output Directory `dist`, Root Directory kosong (repo root).
5. Redeploy dengan pilihan **without cache** jika tersedia. Selepas Ready, semak `https://alamat-game.vercel.app/` ada badge V1.5. Tekan Ctrl+Shift+R.

## Semak AR jika badge V1.5 sudah keluar
- Semak `https://alamat-game.vercel.app/vendor/vision_bundle.mjs`, `/vendor/wasm/vision_wasm_internal.wasm` dan `/vendor/pose_landmarker_lite.task` (jika model berjaya didownload semasa build).
- Jika ralat model, periksa log build. Projek cuba memuat turun model daripada Google semasa build, dan menggunakan URL Google hanya sebagai fallback.
- Benarkan kamera HTTPS, jauhkan laptop/telefon supaya pinggang dan kedua-dua kaki kelihatan.
- Touch Mode boleh digunakan sementara AR belum siap.

## Penjaga gol
Penjaga gol V1.5 telah didekatkan kepada gawang dan dibesarkan, manakala belakang stadium dialihkan lebih jauh.

## Rekod Sheets
`config.js` mengekalkan URL Apps Script yang dibekalkan. Penyimpanan perlu diuji pada Google Sheets sebenar; hantaran `form` tidak menjamin kejayaan.
