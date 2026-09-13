// routes/emprestimos.js
const express = require("express");
const router = express.Router();
const pool = require("../db");

function paraApi(linha) {
  return {
    id: linha.id,
    livroId: linha.livro_id,
    leitorId: linha.leitor_id,
    aprovado: linha.aprovado,
    dataEmprestimo: linha.data_emprestimo,
    dataFinalizacao: linha.data_finalizacao,
  };
}

router.get("/", async (req, res) => {
  try {
    const { rows } = await pool.query("SELECT * FROM emprestimos ORDER BY data_emprestimo DESC");
    res.json(rows.map(paraApi));
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", async (req, res) => {
  const { leitorId, livroId } = req.body;
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const { rows: livros } = await cliente.query("SELECT * FROM livros WHERE id = $1 FOR UPDATE", [livroId]);
    const { rows: leitores } = await cliente.query("SELECT * FROM leitores WHERE id = $1 FOR UPDATE", [leitorId]);

    if (!livros.length || !leitores.length) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({ message: "Livro ou leitor não encontrado." });
    }

    const livro = livros[0];
    const leitor = leitores[0];

    if (!livro.disponivel) {
      await cliente.query("ROLLBACK");
      return res.status(409).json({ message: "Este livro não está disponível." });
    }
    if (leitor.livros_emprestados >= 3) {
      await cliente.query("ROLLBACK");
      return res.status(409).json({ message: `${leitor.nome} já atingiu o limite de 3 livros.` });
    }

    await cliente.query("UPDATE livros SET disponivel = FALSE WHERE id = $1", [livroId]);
    await cliente.query("UPDATE leitores SET livros_emprestados = livros_emprestados + 1 WHERE id = $1", [leitorId]);
    const { rows } = await cliente.query(
      "INSERT INTO emprestimos (leitor_id, livro_id, aprovado, data_emprestimo) VALUES ($1, $2, TRUE, NOW()) RETURNING *",
      [leitorId, livroId]
    );

    await cliente.query("COMMIT");
    res.status(201).json(paraApi(rows[0]));
  } catch (err) {
    await cliente.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    cliente.release();
  }
});

router.put("/:id/finalizar", async (req, res) => {
  const cliente = await pool.connect();

  try {
    await cliente.query("BEGIN");

    const { rows: emprestimos } = await cliente.query(
      "SELECT * FROM emprestimos WHERE id = $1 FOR UPDATE",
      [req.params.id]
    );
    if (!emprestimos.length) {
      await cliente.query("ROLLBACK");
      return res.status(404).json({ message: "Empréstimo não encontrado." });
    }

    const emprestimo = emprestimos[0];
    if (!emprestimo.aprovado) {
      await cliente.query("ROLLBACK");
      return res.status(409).json({ message: "Nenhum empréstimo ativo." });
    }

    await cliente.query("UPDATE livros SET disponivel = TRUE WHERE id = $1", [emprestimo.livro_id]);
    await cliente.query(
      "UPDATE leitores SET livros_emprestados = GREATEST(livros_emprestados - 1, 0) WHERE id = $1",
      [emprestimo.leitor_id]
    );
    const { rows } = await cliente.query(
      "UPDATE emprestimos SET aprovado = FALSE, data_finalizacao = NOW() WHERE id = $1 RETURNING *",
      [req.params.id]
    );

    await cliente.query("COMMIT");
    res.json(paraApi(rows[0]));
  } catch (err) {
    await cliente.query("ROLLBACK");
    res.status(500).json({ message: err.message });
  } finally {
    cliente.release();
  }
});

module.exports = router;