# ISC — Discord registration notifications (Vercel)

Website ini menampilkan halaman akun ISC profesional di tengah layar. Pengunjung harus membuat akun terlebih dahulu, lalu login untuk membuka halaman komunitas. Saat akun baru dibuat, backend Vercel mengirim notifikasi username dan waktu pendaftaran ke channel Discord. Tidak ada tombol atau dashboard admin pada tampilan pengguna.

## Isi notifikasi Discord
- Username
- Waktu pendaftaran dari server (WIB / Asia Jakarta)

Kata sandi dan hash kata sandi tidak pernah dikirim ke Discord.

## Deploy GitHub + Vercel
1. Upload isi folder ini ke repository GitHub. Pertahankan `index.html` di root dan `api/registration-notify.js` di folder `api`.
2. Import repository tersebut ke Vercel lalu deploy.
3. Di server Discord, buka pengaturan channel teks → **Integrations → Webhooks**, buat webhook, lalu salin URL-nya.
4. Di Vercel, buka **Project → Settings → Environment Variables**. Tambahkan `DISCORD_WEBHOOK_URL` dan isi dengan URL webhook. Pilih Production (serta Preview bila diperlukan).
5. Simpan lalu redeploy. Jangan pernah menaruh URL webhook di HTML atau repository publik.
6. Buka website, buat akun baru, kemudian login. Periksa channel Discord untuk notifikasi pendaftaran.

## Batasan penting
- Sistem akun saat ini masih memakai browser `localStorage`. Akun tidak dibagikan antarperangkat dan data browser bisa hilang jika data situs dihapus. Ini belum merupakan database online bersama.
- Endpoint notifikasi publik menggunakan validasi input, honeypot, dan pembatasan percobaan sederhana per instance. Sebelum promosi publik, tambahkan rate limiting terkelola dan CAPTCHA.
- URL webhook adalah rahasia. Jika bocor, hapus/ganti webhook di Discord dan perbarui environment variable di Vercel.
- Untuk login lintas perangkat dan akun yang benar-benar tersimpan online, migrasikan autentikasi ke backend dengan database dan password hashing yang sesuai (misalnya Supabase Auth).
