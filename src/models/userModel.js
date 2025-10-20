// Karena project ini menggunakan PostgreSQL dengan pool.query, semua query dieksekusi langsung di controller.
export const userTable = `
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  avatar_url TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;