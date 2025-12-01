Markdown# ⚛️ Media Pembelajaran IPA Kelas VII: Zat dan Karakteristiknya

Proyek ini adalah implementasi website pembelajaran interaktif menggunakan HTML, CSS, Vanilla JavaScript, dan **Supabase** sebagai *backend* tanpa server untuk menyimpan data hasil kuis.

## 📁 Struktur Proyek

IPA-Zat-Karakteristiknya/├── assets/│   ├── css/│   │   └── style.css       (Styling dasar dan responsif)│   ├── js/│   │   ├── main.js         (Logika utama: Quiz, LKPD Download, Auth, Dashboard)│   │   └── supabase.js     (Konfigurasi API Key Supabase)│   └── files/│       ├── Materi Zat dan Karakteristiknya.pdf (File materi)│       └── Video Stimulasi.mp4 (File video)├── index.html              (Halaman Beranda)├── materi.html             (Halaman Materi & Flipbook Placeholder)├── video.html              (Halaman Video Stimulasi)├── lkpd.html               (Halaman LKPD Digital & Download Jawaban)├── quiz.html               (Halaman Kuis Pilihan Ganda & Submit ke Supabase)├── login.html              (Halaman Login Guru)├── teacher-dashboard.html  (Dashboard Hasil Kuis, khusus Guru)└── README.md               (Dokumentasi ini)
---

## 🔐 Langkah-Langkah Konfigurasi Supabase (Wajib Dilakukan!)

### 1. Inisialisasi Kunci API

1.  Buat proyek baru di **Supabase** atau gunakan proyek yang sudah ada.
2.  Buka file `assets/js/supabase.js`.
3.  Ganti `[GANTI_DENGAN_PROJECT_ID_ANDA]` dan `GANTI_DENGAN_ANON_PUBLIC_KEY_ANDA` dengan URL dan Public Key dari halaman **Settings -> API** Supabase Anda.

### 2. Konfigurasi Database (Tabel Kuis)

Anda harus membuat tabel baru dengan nama **`quiz_submissions`** di Supabase SQL Editor untuk menyimpan hasil kuis siswa:

```sql
CREATE TABLE quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users (id), -- Kunci ke user di Supabase Auth
  user_email TEXT, -- Menyimpan email siswa untuk tampilan di dashboard
  score INT,
  answers JSONB, -- Menyimpan jawaban detail siswa (opsional)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
3. Konfigurasi Role GuruUntuk memastikan teacher-dashboard.html hanya dapat diakses oleh guru, Anda harus menetapkan role guru di metadata pengguna Supabase.Daftarkan akun guru melalui halaman login.html atau buat secara manual di Supabase Auth.Jalankan perintah SQL berikut di Supabase SQL Editor (ganti email):SQL-- Ganti dengan email guru yang sudah terdaftar di Supabase Auth
UPDATE auth.users 
SET raw_user_meta_data = raw_user_meta_data || '{"role": "teacher"}'
WHERE email = 'email_guru_anda@contoh.com'; 
4. Konfigurasi Row-Level Security (RLS)Aktifkan RLS pada tabel quiz_submissions dan terapkan kebijakan berikut di Supabase Dashboard untuk mengamankan data:Nama KebijakanTindakanLogika SQL (USING)KeteranganAllow select for teacherSELECTauth.jwt() -> 'user_metadata' ->> 'role' = 'teacher'Hanya pengguna dengan role 'teacher' yang bisa melihat semua hasil.Allow insert for auth userINSERT(auth.uid() IS NOT NULL)Semua pengguna yang sudah login (siswa) bisa mengirim kuis.