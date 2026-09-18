# TNAPRO Backend (Powered By MMCSB)

Ini adalah dokumentasi untuk membantu pembangunan semasa dan masa depan sistem TNAPRO. Fail ini bertindak sebagai rujukan dan panduan tentang cara menggunakan setiap API yang disediakan.

## Gambaran Keseluruhan Backend

Backend TNAPRO adalah aplikasi Node.js yang dibina menggunakan Express.js untuk pengurusan latihan, pengguna, dan proses kelulusan. Ia menggunakan Prisma sebagai ORM untuk interaksi dengan database PostgreSQL, dan menyediakan API RESTful untuk frontend.

### Teknologi Utama
- **Node.js** dengan **Express.js** untuk server web
- **Prisma** sebagai ORM untuk database PostgreSQL
- **JWT** untuk authentication
- **Swagger** untuk dokumentasi API
- **Multer** untuk upload fail (gambar, CSV)
- **Nodemailer** untuk penghantaran emel
- **Cloudinary** untuk penyimpanan gambar
- **QR Code** untuk penjanaan kod QR

### Struktur Folder
```
backend/
├── prisma/                 # Konfigurasi database dan migrations
│   ├── schema.prisma       # Definisi model database
│   ├── seed.ts            # Data awal untuk database
│   └── migrations/        # Fail migration database
├── src/
│   ├── app.ts             # Konfigurasi utama aplikasi Express
│   ├── index.ts           # Entry point aplikasi
│   ├── bootstrap/         # Setup awal (admin user)
│   ├── lib/               # Utiliti perpustakaan (Prisma client)
│   ├── middleware/        # Middleware untuk auth, error handling, upload
│   ├── modules/           # Modul-modul API
│   │   ├── auth/          # Authentication dan authorization
│   │   ├── user/          # Pengurusan pengguna
│   │   ├── training/      # Pengurusan latihan
│   │   ├── request-training/ # Permintaan latihan
│   │   ├── approval-user/ # Proses kelulusan
│   │   ├── payment/       # Tuntutan pembayaran
│   │   ├── notification/  # Notifikasi
│   │   └── ...            # Modul lain
│   ├── services/          # Perkhidmatan utiliti
│   ├── types/             # Definisi TypeScript
│   └── utils/             # Utiliti tambahan
├── swagger-autogen.js     # Konfigurasi Swagger
├── swagger-output.json    # Dokumentasi API yang dijana
└── package.json           # Dependencies dan scripts
```

### Cara Menjalankan

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Setup database:**
   - Pastikan PostgreSQL berjalan
   - Konfigurasi connection string di `.env`
   - Jalankan migration:
     ```bash
     npx prisma migrate deploy
     ```
   - Generate Prisma client:
     ```bash
     npx prisma generate
     ```

3. **Jalankan dalam development mode:**
   ```bash
   npm run dev
   ```
   Ini akan menjana Swagger docs dan memulakan server di port 3001.

4. **Build untuk production:**
   ```bash
   npm run build
   npm start
   ```

### Model Database Utama

- **User**: Maklumat pengguna, peranan (ADMIN/USER), profil staf
- **StaffProfile**: Maklumat profesional staf, kemahiran, jabatan
- **Training**: Maklumat latihan, tarikh, venue, jenis pembayaran
- **RequestTraining**: Permintaan latihan oleh pengguna
- **ApprovalUser**: Proses kelulusan untuk permintaan latihan
- **PaymentClaim**: Tuntutan pembayaran untuk latihan
- **Form**: Sistem borang dinamik untuk pengumpulan data
- **Notification**: Sistem notifikasi untuk pengguna

### API Endpoints Utama

API menggunakan authentication JWT. Header `Authorization: Bearer {token}` diperlukan untuk kebanyakan endpoints.

#### Authentication
- `POST /api/auth/login` - Login pengguna
- `POST /api/auth/register` - Daftar pengguna baru

#### Pengguna
- `GET /api/user` - Dapatkan semua pengguna
- `GET /api/user/:id` - Dapatkan pengguna spesifik
- `PUT /api/user/:id` - Update pengguna

#### Latihan
- `GET /api/training` - Dapatkan semua latihan
- `POST /api/training` - Cipta latihan baru
- `PUT /api/training/:id` - Update latihan

#### Permintaan Latihan
- `POST /api/request-training` - Hantar permintaan latihan
- `GET /api/request-training` - Dapatkan permintaan latihan

#### Kelulusan
- `POST /api/approval-user` - Proses kelulusan
- `GET /api/approval-user` - Dapatkan status kelulusan

#### Pembayaran
- `POST /api/payment` - Tuntut pembayaran
- `GET /api/payment` - Dapatkan tuntutan pembayaran

### Dokumentasi API Lengkap

Akses dokumentasi Swagger di `http://localhost:3001/api-docs` apabila server berjalan.

### Environment Variables

Cipta fail `.env` dengan:
```
DATABASE_URL="postgresql://username:password@localhost:5432/database_name"
JWT_SECRET="your_jwt_secret"
PORT=3001
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_password
```

### Catatan Pembangunan

- Gunakan `npm run swagger` untuk menjana dokumentasi API
- Database migrations disimpan di `prisma/migrations/`
- Middleware authentication melindungi routes sensitif
- Sistem menyokong upload gambar dan CSV import
- Notifikasi emel dihantar untuk kelulusan dan pembayaran

## Hanif tester
- hello asfasfewc sdfsfsdf
