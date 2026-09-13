// routes/leitores.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

function paraApi(linha) {
  return {
    id: linha.id,
    nome: linha.nome,
    cpf: linha.cpf,
    idade: linha.idade,
    livrosEmprestados: linha.livros_emprestados,
  };
}

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM leitores ORDER BY nome");
    res.json(rows.map(paraApi));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { nome, cpf, idade } = req.body;
    const { rows } = await pool.query(
      "INSERT INTO leitores (nome, cpf, idade, livros_emprestados) VALUES ($1, $2, $3, 0) RETURNING *",
      [nome, cpf, idade]
    );
    res.status(201).json(paraApi(rows[0]));
  } catch (err) {
    if (err.code === "23505") {
      return res.status(409).json({ message: "Já existe um leitor com esse CPF." });
    }
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const { nome, cpf, idade } = req.body;
    const { rows } = await pool.query(
      "UPDATE leitores SET nome = $1, cpf = $2, idade = $3 WHERE id = $4 RETURNING *",
      [nome, cpf, idade, req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: "Leitor não encontrado." });
    res.json(paraApi(rows[0]));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT livros_emprestados FROM leitores WHERE id = $1", [req.params.id]);
    if (!rows.length) return res.status(404).json({ message: "Leitor não encontrado." });
    if (rows[0].livros_emprestados > 0) {
      return res.status(409).json({ message: "Este leitor ainda tem livros emprestados." });
    }
    await pool.query("DELETE FROM leitores WHERE id = $1", [req.params.id]);
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;