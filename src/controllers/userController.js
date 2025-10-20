import pool from '../config/db.js';
import bcrypt from 'bcryptjs';

// Edit profil user sendiri
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

    // Ambil data lama user
    const { rows } = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
    if (!rows.length) return res.status(404).json({ message: 'User tidak ditemukan' });

    const oldUser = rows[0];
    let newPassword = oldUser.password;

    // Kalau password baru dikirim, hash ulang
    if (password) {
      newPassword = await bcrypt.hash(password, 10);
    }

    // Update data 
    await pool.query(
      `UPDATE users 
       SET username = $1, email = $2, password = $3, updated_at = CURRENT_TIMESTAMP 
       WHERE id = $4`,
      [username || oldUser.username, email || oldUser.email, newPassword, id]
    );

    res.json({ message: 'Profil berhasil diperbarui' });
  } catch (err) {
    res.status(500).json({ message: 'Gagal update profil', error: err.message });
  }
};