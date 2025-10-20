import pool from '../config/db.js';
import cloudinary from '../config/cloudinary.js';
import streamifier from 'streamifier';
import bcrypt from 'bcryptjs';

// Get all users
export const getUsers = async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, username, email, role, avatar_url, updated_at FROM users'
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: 'Gagal mengambil data user', error: err.message });
  }
};

// Update profile 
export const updateProfile = async (req, res) => {
  try {
    const { id } = req.user; 
    const { username, email, password } = req.body;

    // Validasi input email
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return res.status(400).json({ message: 'Format email tidak valid' });
    }

    // Validasi password minimal 6 karakter
    if (password && password.length < 6) {
      return res.status(400).json({ message: 'Password minimal 6 karakter' });
    }

    // Ambil data user lama
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });

    const oldUser = rows[0];
    let newPassword = oldUser.password;

    // Kalau user kirim password baru, hash ulang
    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    // Update data user
    const result = await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, password = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING id, username, email, updated_at`,
      [username || oldUser.username, email || oldUser.email, newPassword, id]
    );

    res.json({
      message: 'Profil berhasil diperbarui',
      user: result.rows[0],
    });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update profil', error: err.message });
  }
};

// Upload avatar ke Cloudinary
export const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Tidak ada file yang diupload' });

    // Upload ke Cloudinary
    const uploadStream = () =>
      new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          { folder: 'avatars' },
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
        streamifier.createReadStream(req.file.buffer).pipe(stream);
      });

    const result = await uploadStream();
    const { id } = req.user;

    // Simpan URL avatar & updated_at
    await pool.query(
      'UPDATE users SET avatar_url = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [result.secure_url, id]
    );

    res.json({ message: 'Avatar berhasil diupload', url: result.secure_url });
  } catch (err) {
    res.status(500).json({ message: 'Upload gagal', error: err.message });
  }
};