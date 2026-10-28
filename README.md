# SKG Football AR Penalty V1.5.1 — NPM Fix

Pembetulan penting: `@mediapipe/tasks-vision` ditukar daripada versi tidak diterbitkan `0.10.22` kepada versi stabil `0.10.35`. Semua fail sumber V1.5 termasuk `Code.gs`, `config.js`, `scripts/build.mjs` dikekalkan.

## Deploy GitHub → Vercel
1. Unzip, muat naik semua kandungan folder ini ke root repository GitHub (pastikan `scripts/build.mjs` berada dalam folder `scripts`, **bukan** root). Commit changes.
2. Di Vercel: Framework: Other; Build Command: `npm run build`; Output Directory: `dist`; Root Directory: kosong jika semua fail berada di root.
3. Pastikan tiada `package-lock.json` lama yang mengunci versi salah. Jika ada, jana semula `npm install` dan commit lockfile baharu.
4. Vercel > Deployments: periksa commit terbaru dan `Ready`. Pada laman game, cari label `V1.5.1 • NPM FIX`.
5. Jika build masih gagal, salin log baharu. Versi MediaPipe telah disahkan tersenarai di npm, tetapi `npm install`/deploy tidak dapat dijalankan sepenuhnya dalam persekitaran ini.

Kamera dan Google Sheets perlu diuji selepas build berjaya.
