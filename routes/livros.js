// routes/livros.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

function paraApi(linha) {
  return {
    id: linha.id,
    titulo: linha.titulo,
    autor: linha.autor,
    anoPubli: linha.ano_publi,
    isbn: linha.isbn,
    disponivel: linha.disponivel,
  };
}

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM livros ORDER BY titulo");
    res.json(rows.map(paraApi));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { titulo, autor, anoPubli, isbn } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO livros (titulo, autor, ano_publi, isbn, disponivel) VALUES ($1, $2, $3, $4, TRUE) RETURNING *",
      [titulo, autor, anoPubli, isbn]
    );
    res.status(201).json(paraApi(rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Já existe um livro com esse ISBN." });
    }
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { titulo, autor, anoPubli, isbn } = req.body;
    const { rows } = await pool.query(
      "UPDATE livros SET titulo = $1, autor = $2, ano_publi = $3, isbn = $4 WHERE id = $5 RETURNING *",
      [titulo, autor, anoPubli, isbn, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Livro não encontrado." });
    res.json(paraApi(rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT disponivel FROM livros WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Livro não encontrado." });
    if (!rows[0].disponivel) {
      return res.status(409).json({ message: "Não é possível excluir um livro emprestado." });
    }
    await pool.query("DELETE FROM livros WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;