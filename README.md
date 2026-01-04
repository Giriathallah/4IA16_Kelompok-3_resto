Resto Bunda – Setup Lokal

Prasyarat

XAMPP (aktifkan Apache dan MySQL)

Node.js v22 atau lebih baru, npm v10 atau lebih baru

Buat Database

Buka phpMyAdmin dari XAMPP

Buat database baru dengan nama: resto_bunda

Konfigurasi Environment

File .env sudah disertakan dalam project

Tidak perlu diubah kecuali:

MIDTRANS_SERVER_KEY dan NEXT_PUBLIC_MIDTRANS_CLIENT_KEY diisi dengan sandbox key dari Midtrans

DATABASE_URL sudah diarahkan ke database resto_bunda di localhost

Install Dependensi
Jalankan perintah berikut di terminal:
npm install

Migrasi dan Seed Database
Jalankan perintah berikut:
npx prisma migrate dev --name init
npx prisma db seed

Seed akan membuat data awal:

Admin: admin@gmail.com
dengan password asdasdasd

Beberapa user dan produk dummy

Jalankan Project
Jalankan perintah berikut:
npm run dev

Akses aplikasi di browser melalui alamat:
http://localhost:3000

Akun Login
Admin
Email: admin@gmail.com

Password: asdasdasd

User contoh
Email: andi.wijaya@example.com

Password: asdasdasd
