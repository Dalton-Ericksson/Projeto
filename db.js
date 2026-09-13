// db.js
// Conexão com o banco PostgreSQL (Supabase).
// A string de conexão vem de uma variável de ambiente, nunca escrita direto aqui —
// assim você pode usar isso localmente e configurar o mesmo valor no painel do Vercel,
// sem essa informação aparecer no código que vai pro GitHub.

const { Pool } = require("pg");

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // o Supabase exige conexão SSL
});

module.exports = pool;
