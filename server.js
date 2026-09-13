// server.js
require("dotenv").config(); // lê o arquivo .env quando roda localmente; no Vercel isso não faz nada, as variáveis já vêm prontas

const express = require("express");
const path = require("path");

const livrosRouter = require("./routes/livros");
const leitoresRouter = require("./routes/leitores");
const emprestimosRouter = require("./routes/emprestimos");

const app = express();
const PORT = 3000;

app.use(express.json());

// Serve a página web (index.html, style.css, script.js) direto pela mesma porta da API,
// então não tem problema de CORS e o API_BASE = "/api" do script.js já funciona sem mudar nada.
app.use(express.static(path.join(__dirname, "public")));

app.use("/api/livros", livrosRouter);
app.use("/api/leitores", leitoresRouter);
app.use("/api/emprestimos", emprestimosRouter);

app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
