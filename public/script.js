/* ============================================================
   Acervo — script.js
   --------------------------------------------------------------
   CONTRATO DA API ESPERADA (para quando você construir o back-end
   em Java com o banco Biblioteca_java):

   GET    /api/livros                -> [ {id, titulo, autor, anoPubli, isbn, disponivel} ]
   POST   /api/livros                -> body igual ao acima (sem id)      -> cria
   PUT    /api/livros/:id            -> body parcial                      -> atualiza
   DELETE /api/livros/:id                                                 -> remove

   GET    /api/leitores              -> [ {id, nome, cpf, idade, livrosEmprestados} ]
   POST   /api/leitores              -> cria
   PUT    /api/leitores/:id          -> atualiza
   DELETE /api/leitores/:id          -> remove

   GET    /api/emprestimos           -> [ {id, livroId, leitorId, aprovado, dataEmprestimo, dataFinalizacao} ]
   POST   /api/emprestimos           -> body {leitorId, livroId}          -> realiza (equivalente a Emprestimo.Realizar())
   PUT    /api/emprestimos/:id/finalizar                                  -> finaliza (equivalente a Emprestimo.Finalizar())

   Enquanto essa API não existir, a página roda em MODO DEMONSTRAÇÃO:
   os dados ficam só na memória do navegador (não são salvos), mas toda
   a interface e as regras de negócio (limite de 3 livros por leitor,
   livro precisa estar disponível etc.) já funcionam do jeito que vão
   funcionar quando a API real responder nesses mesmos endpoints.
================================================================ */

const API_BASE = "/api";
const API_TIMEOUT_MS = 1500;

let useMock = true;

let livros = [];
let leitores = [];
let emprestimos = [];

/* ============================================================
   Dados de demonstração (espelham o main() que você já tinha)
================================================================ */
function dadosIniciais() {
  livros = [
    { id: 1, titulo: "Java Básico", autor: "João Silva", anoPubli: 2023, isbn: "123456", disponivel: true },
    { id: 2, titulo: "Estruturas de Dados", autor: "Maria Costa", anoPubli: 2021, isbn: "789012", disponivel: true },
    { id: 3, titulo: "Banco de Dados na Prática", autor: "Renato Alves", anoPubli: 2020, isbn: "456789", disponivel: false },
  ];
  leitores = [
    { id: 1, nome: "Dalton", cpf: "123.456.789-00", idade: 20, livrosEmprestados: 1 },
    { id: 2, nome: "Ana Beatriz", cpf: "987.654.321-00", idade: 24, livrosEmprestados: 0 },
  ];
  emprestimos = [
    { id: 1, livroId: 3, leitorId: 1, aprovado: true, dataEmprestimo: new Date().toISOString(), dataFinalizacao: null },
  ];
}

let nextId = { livros: 4, leitores: 3, emprestimos: 2 };

/* ============================================================
   Camada de dados: tenta a API real, cai pro modo demonstração
================================================================ */
async function checarApi() {
  try {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), API_TIMEOUT_MS);
    const res = await fetch(`${API_BASE}/livros`, { signal: ctrl.signal });
    clearTimeout(t);
    useMock = !res.ok;
  } catch (e) {
    useMock = true;
  }

  const pill = document.getElementById("apiStatus");
  const text = document.getElementById("apiStatusText");
  const note = document.getElementById("modeNote");

  if (useMock) {
    pill.className = "status-pill demo";
    text.textContent = "Modo demonstração";
    note.textContent = "Modo demonstração — os dados não são salvos, apenas simulam a API que você vai construir.";
    dadosIniciais();
  } else {
    pill.className = "status-pill connected";
    text.textContent = "Conectado à API";
    note.textContent = "Conectado à API em " + API_BASE + ".";
    livros = await Api.getLivros();
    leitores = await Api.getLeitores();
    emprestimos = await Api.getEmprestimos();
  }
}

async function apiFetch(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    let msg = "Erro na requisição";
    try { msg = (await res.json()).message || msg; } catch (_) {}
    throw new Error(msg);
  }
  if (res.status === 204) return null;
  return res.json();
}

const Api = {
  // --- Livros ---
  async getLivros() {
    if (useMock) return structuredClone(livros);
    return apiFetch("/livros");
  },
  async addLivro(data) {
    if (useMock) {
      const novo = { id: nextId.livros++, disponivel: true, ...data };
      livros.push(novo);
      return novo;
    }
    return apiFetch("/livros", { method: "POST", body: JSON.stringify(data) });
  },
  async updateLivro(id, data) {
    if (useMock) {
      const i = livros.findIndex(l => l.id === id);
      livros[i] = { ...livros[i], ...data };
      return livros[i];
    }
    return apiFetch(`/livros/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteLivro(id) {
    if (useMock) { livros = livros.filter(l => l.id !== id); return; }
    return apiFetch(`/livros/${id}`, { method: "DELETE" });
  },

  // --- Leitores ---
  async getLeitores() {
    if (useMock) return structuredClone(leitores);
    return apiFetch("/leitores");
  },
  async addLeitor(data) {
    if (useMock) {
      const novo = { id: nextId.leitores++, livrosEmprestados: 0, ...data };
      leitores.push(novo);
      return novo;
    }
    return apiFetch("/leitores", { method: "POST", body: JSON.stringify(data) });
  },
  async updateLeitor(id, data) {
    if (useMock) {
      const i = leitores.findIndex(l => l.id === id);
      leitores[i] = { ...leitores[i], ...data };
      return leitores[i];
    }
    return apiFetch(`/leitores/${id}`, { method: "PUT", body: JSON.stringify(data) });
  },
  async deleteLeitor(id) {
    if (useMock) { leitores = leitores.filter(l => l.id !== id); return; }
    return apiFetch(`/leitores/${id}`, { method: "DELETE" });
  },

  // --- Empréstimos (espelha Emprestimo.Realizar() / Finalizar()) ---
  async getEmprestimos() {
    if (useMock) return structuredClone(emprestimos);
    return apiFetch("/emprestimos");
  },
  async realizarEmprestimo({ leitorId, livroId }) {
    if (useMock) {
      const livro = livros.find(l => l.id === livroId);
      const leitor = leitores.find(l => l.id === leitorId);
      if (!livro || !livro.disponivel) throw new Error("Este livro não está disponível.");
      if (leitor.livrosEmprestados >= 3) throw new Error(`${leitor.nome} já atingiu o limite de 3 livros.`);

      livro.disponivel = false;
      leitor.livrosEmprestados++;
      const novo = {
        id: nextId.emprestimos++,
        livroId, leitorId,
        aprovado: true,
        dataEmprestimo: new Date().toISOString(),
        dataFinalizacao: null,
      };
      emprestimos.push(novo);
      return novo;
    }
    return apiFetch("/emprestimos", { method: "POST", body: JSON.stringify({ leitorId, livroId }) });
  },
  async finalizarEmprestimo(id) {
    if (useMock) {
      const emp = emprestimos.find(e => e.id === id);
      if (!emp || !emp.aprovado) throw new Error("Nenhum empréstimo ativo.");
      const livro = livros.find(l => l.id === emp.livroId);
      const leitor = leitores.find(l => l.id === emp.leitorId);
      livro.disponivel = true;
      leitor.livrosEmprestados = Math.max(0, leitor.livrosEmprestados - 1);
      emp.aprovado = false;
      emp.dataFinalizacao = new Date().toISOString();
      return emp;
    }
    return apiFetch(`/emprestimos/${id}/finalizar`, { method: "PUT" });
  },
};

/* ============================================================
   Utilidades de UI
================================================================ */
function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.className = "toast show" + (isError ? " error" : "");
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.className = "toast"; }, 3200);
}

function fmtData(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

function iniciais(nome) {
  return nome.trim().charAt(0).toUpperCase();
}

function abrirModal(html) {
  document.getElementById("modalContent").innerHTML = html;
  document.getElementById("modalBackdrop").classList.add("open");
}
function fecharModal() {
  document.getElementById("modalBackdrop").classList.remove("open");
  document.getElementById("modalContent").innerHTML = "";
}
document.getElementById("modalClose").addEventListener("click", fecharModal);
document.getElementById("modalBackdrop").addEventListener("click", (e) => {
  if (e.target.id === "modalBackdrop") fecharModal();
});

function marcarInvalido(campoEl, mensagem) {
  campoEl.classList.add("invalid");
  campoEl.querySelector(".field-error").textContent = mensagem;
}
function limparValidacao(formEl) {
  formEl.querySelectorAll(".field").forEach(f => f.classList.remove("invalid"));
}

/* ============================================================
   Navegação entre abas
================================================================ */
document.querySelectorAll(".tab").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab").forEach(b => { b.classList.remove("active"); b.setAttribute("aria-selected", "false"); });
    document.querySelectorAll(".panel").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    btn.setAttribute("aria-selected", "true");
    document.getElementById(`panel-${btn.dataset.tab}`).classList.add("active");
  });
});

/* ============================================================
   Render: Estatísticas
================================================================ */
function renderStats() {
  const disponiveis = livros.filter(l => l.disponivel).length;
  const ativos = emprestimos.filter(e => e.aprovado).length;

  document.getElementById("stats").innerHTML = `
    <div class="stat-card"><div class="num">${livros.length}</div><div class="label">Livros no acervo</div></div>
    <div class="stat-card"><div class="num">${disponiveis}</div><div class="label">Disponíveis agora</div></div>
    <div class="stat-card"><div class="num">${leitores.length}</div><div class="label">Leitores cadastrados</div></div>
    <div class="stat-card"><div class="num">${ativos}</div><div class="label">Empréstimos ativos</div></div>
  `;
}

/* ============================================================
   Render: Livros
================================================================ */
function renderLivros() {
  const termo = document.getElementById("buscaLivros").value.trim().toLowerCase();
  const lista = livros.filter(l =>
    !termo || l.titulo.toLowerCase().includes(termo) || l.autor.toLowerCase().includes(termo) || l.isbn.includes(termo)
  );

  document.getElementById("emptyLivros").hidden = lista.length !== 0;

  document.getElementById("listaLivros").innerHTML = lista.map(l => `
    <article class="card">
      <span class="card-tab">${iniciais(l.titulo)}</span>
      <h3 class="card-title">${l.titulo}</h3>
      <p class="card-sub">${l.autor} · ${l.anoPubli}</p>
      <div class="card-meta">
        <span>ISBN <code>${l.isbn}</code></span>
        <span class="badge ${l.disponivel ? "ok" : "no"}">${l.disponivel ? "Disponível" : "Emprestado"}</span>
      </div>
      <div class="card-actions">
        <button class="btn-secondary" data-editar-livro="${l.id}">Editar</button>
        <button class="btn-danger" data-excluir-livro="${l.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

function formLivro(livro = null) {
  const editando = !!livro;
  abrirModal(`
    <h3>${editando ? "Editar livro" : "Novo livro"}</h3>
    <form id="formLivro">
      <div class="field">
        <label for="fTitulo">Título</label>
        <input id="fTitulo" name="titulo" value="${livro?.titulo ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="fAutor">Autor</label>
        <input id="fAutor" name="autor" value="${livro?.autor ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="fAno">Ano de publicação</label>
        <input id="fAno" name="anoPubli" type="number" min="1450" max="2100" value="${livro?.anoPubli ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="fIsbn">ISBN</label>
        <input id="fIsbn" name="isbn" value="${livro?.isbn ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" id="cancelarLivro">Cancelar</button>
        <button type="submit" class="btn-primary">${editando ? "Salvar" : "Adicionar"}</button>
      </div>
    </form>
  `);

  document.getElementById("cancelarLivro").addEventListener("click", fecharModal);

  document.getElementById("formLivro").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    limparValidacao(form);

    const data = {
      titulo: form.titulo.value.trim(),
      autor: form.autor.value.trim(),
      anoPubli: Number(form.anoPubli.value),
      isbn: form.isbn.value.trim(),
    };

    const duplicado = livros.find(l => l.isbn === data.isbn && l.id !== livro?.id);
    if (duplicado) {
      marcarInvalido(form.fIsbn.closest(".field"), "Já existe um livro com esse ISBN.");
      return;
    }

    try {
      if (editando) await Api.updateLivro(livro.id, data);
      else await Api.addLivro(data);
      livros = await Api.getLivros();
      renderLivros(); renderStats(); renderEmprestimosOpcoes();
      fecharModal();
      toast(editando ? "Livro atualizado." : "Livro adicionado.");
    } catch (err) {
      toast(err.message, true);
    }
  });
}

document.getElementById("novoLivroBtn").addEventListener("click", () => formLivro());
document.getElementById("buscaLivros").addEventListener("input", renderLivros);

document.getElementById("listaLivros").addEventListener("click", async (e) => {
  const editId = e.target.dataset.editarLivro;
  const delId = e.target.dataset.excluirLivro;
  if (editId) formLivro(livros.find(l => l.id === Number(editId)));
  if (delId) {
    const livro = livros.find(l => l.id === Number(delId));
    if (!livro.disponivel) { toast("Não é possível excluir um livro emprestado.", true); return; }
    if (!confirm(`Excluir "${livro.titulo}"?`)) return;
    try {
      await Api.deleteLivro(livro.id);
      livros = await Api.getLivros();
      renderLivros(); renderStats();
      toast("Livro excluído.");
    } catch (err) { toast(err.message, true); }
  }
});

/* ============================================================
   Render: Leitores
================================================================ */
function renderLeitores() {
  const termo = document.getElementById("buscaLeitores").value.trim().toLowerCase();
  const lista = leitores.filter(l =>
    !termo || l.nome.toLowerCase().includes(termo) || l.cpf.includes(termo)
  );

  document.getElementById("emptyLeitores").hidden = lista.length !== 0;

  document.getElementById("listaLeitores").innerHTML = lista.map(l => `
    <article class="card">
      <span class="card-tab">${iniciais(l.nome)}</span>
      <h3 class="card-title">${l.nome}</h3>
      <p class="card-sub">${l.idade} anos</p>
      <div class="card-meta">
        <span>CPF <code>${l.cpf}</code></span>
        <span>${l.livrosEmprestados}/3 livros emprestados</span>
      </div>
      <div class="card-actions">
        <button class="btn-secondary" data-editar-leitor="${l.id}">Editar</button>
        <button class="btn-danger" data-excluir-leitor="${l.id}">Excluir</button>
      </div>
    </article>
  `).join("");
}

function formLeitor(leitor = null) {
  const editando = !!leitor;
  abrirModal(`
    <h3>${editando ? "Editar leitor" : "Novo leitor"}</h3>
    <form id="formLeitor">
      <div class="field">
        <label for="fNome">Nome</label>
        <input id="fNome" name="nome" value="${leitor?.nome ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="fCpf">CPF</label>
        <input id="fCpf" name="cpf" placeholder="000.000.000-00" value="${leitor?.cpf ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="fIdade">Idade</label>
        <input id="fIdade" name="idade" type="number" min="0" max="130" value="${leitor?.idade ?? ""}" required>
        <p class="field-error"></p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" id="cancelarLeitor">Cancelar</button>
        <button type="submit" class="btn-primary">${editando ? "Salvar" : "Adicionar"}</button>
      </div>
    </form>
  `);

  document.getElementById("cancelarLeitor").addEventListener("click", fecharModal);

  document.getElementById("formLeitor").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    limparValidacao(form);

    const cpfRegex = /^\d{3}\.\d{3}\.\d{3}-\d{2}$/;
    if (!cpfRegex.test(form.cpf.value.trim())) {
      marcarInvalido(form.fCpf.closest(".field"), "Use o formato 000.000.000-00.");
      return;
    }
    const duplicado = leitores.find(l => l.cpf === form.cpf.value.trim() && l.id !== leitor?.id);
    if (duplicado) {
      marcarInvalido(form.fCpf.closest(".field"), "Já existe um leitor com esse CPF.");
      return;
    }

    const data = {
      nome: form.nome.value.trim(),
      cpf: form.cpf.value.trim(),
      idade: Number(form.idade.value),
    };

    try {
      if (editando) await Api.updateLeitor(leitor.id, data);
      else await Api.addLeitor(data);
      leitores = await Api.getLeitores();
      renderLeitores(); renderStats(); renderEmprestimosOpcoes();
      fecharModal();
      toast(editando ? "Leitor atualizado." : "Leitor adicionado.");
    } catch (err) {
      toast(err.message, true);
    }
  });
}

document.getElementById("novoLeitorBtn").addEventListener("click", () => formLeitor());
document.getElementById("buscaLeitores").addEventListener("input", renderLeitores);

document.getElementById("listaLeitores").addEventListener("click", async (e) => {
  const editId = e.target.dataset.editarLeitor;
  const delId = e.target.dataset.excluirLeitor;
  if (editId) formLeitor(leitores.find(l => l.id === Number(editId)));
  if (delId) {
    const leitor = leitores.find(l => l.id === Number(delId));
    if (leitor.livrosEmprestados > 0) { toast("Este leitor ainda tem livros emprestados.", true); return; }
    if (!confirm(`Excluir "${leitor.nome}"?`)) return;
    try {
      await Api.deleteLeitor(leitor.id);
      leitores = await Api.getLeitores();
      renderLeitores(); renderStats();
      toast("Leitor excluído.");
    } catch (err) { toast(err.message, true); }
  }
});

/* ============================================================
   Render: Empréstimos
================================================================ */
function renderEmprestimos() {
  const filtro = document.getElementById("filtroEmprestimos").value;
  let lista = [...emprestimos].sort((a, b) => new Date(b.dataEmprestimo) - new Date(a.dataEmprestimo));
  if (filtro === "ativos") lista = lista.filter(e => e.aprovado);
  if (filtro === "finalizados") lista = lista.filter(e => !e.aprovado);

  document.getElementById("emptyEmprestimos").hidden = lista.length !== 0;

  const linhas = lista.map(e => {
    const livro = livros.find(l => l.id === e.livroId);
    const leitor = leitores.find(l => l.id === e.leitorId);
    return `
      <div class="ledger-row">
        <span class="ledger-livro">${livro?.titulo ?? "—"}</span>
        <span class="ledger-leitor">${leitor?.nome ?? "—"}</span>
        <span class="ledger-data">${fmtData(e.dataEmprestimo)}</span>
        <span class="badge ${e.aprovado ? "ok" : "no"}">${e.aprovado ? "Ativo" : "Finalizado"}</span>
        <span>${e.aprovado ? `<button class="btn-secondary" data-finalizar="${e.id}">Finalizar</button>` : ""}</span>
      </div>
    `;
  }).join("");

  document.getElementById("listaEmprestimos").innerHTML = lista.length ? `
    <div class="ledger-row head">
      <span>Livro</span><span>Leitor</span><span>Data</span><span>Status</span><span></span>
    </div>
    ${linhas}
  ` : "";
}

function renderEmprestimosOpcoes() {
  // usado ao (re)abrir o formulário de novo empréstimo, ver abaixo
}

function formEmprestimo() {
  const livrosDisponiveis = livros.filter(l => l.disponivel);
  if (!livrosDisponiveis.length) { toast("Nenhum livro disponível no momento.", true); return; }
  if (!leitores.length) { toast("Cadastre um leitor antes de fazer um empréstimo.", true); return; }

  abrirModal(`
    <h3>Novo empréstimo</h3>
    <div class="form-note">Um leitor pode ter no máximo 3 livros emprestados ao mesmo tempo.</div>
    <form id="formEmprestimo">
      <div class="field">
        <label for="fLeitor">Leitor</label>
        <select id="fLeitor" name="leitorId" required>
          ${leitores.map(l => `<option value="${l.id}">${l.nome} (${l.livrosEmprestados}/3)</option>`).join("")}
        </select>
        <p class="field-error"></p>
      </div>
      <div class="field">
        <label for="fLivroEmp">Livro</label>
        <select id="fLivroEmp" name="livroId" required>
          ${livrosDisponiveis.map(l => `<option value="${l.id}">${l.titulo} — ${l.autor}</option>`).join("")}
        </select>
        <p class="field-error"></p>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn-secondary" id="cancelarEmprestimo">Cancelar</button>
        <button type="submit" class="btn-primary">Realizar empréstimo</button>
      </div>
    </form>
  `);

  document.getElementById("cancelarEmprestimo").addEventListener("click", fecharModal);

  document.getElementById("formEmprestimo").addEventListener("submit", async (e) => {
    e.preventDefault();
    const form = e.target;
    try {
      await Api.realizarEmprestimo({
        leitorId: Number(form.leitorId.value),
        livroId: Number(form.livroId.value),
      });
      livros = await Api.getLivros();
      leitores = await Api.getLeitores();
      emprestimos = await Api.getEmprestimos();
      renderLivros(); renderLeitores(); renderEmprestimos(); renderStats();
      fecharModal();
      toast("Empréstimo realizado.");
    } catch (err) {
      toast(err.message, true);
    }
  });
}

document.getElementById("novoEmprestimoBtn").addEventListener("click", formEmprestimo);
document.getElementById("filtroEmprestimos").addEventListener("change", renderEmprestimos);

document.getElementById("listaEmprestimos").addEventListener("click", async (e) => {
  const id = e.target.dataset.finalizar;
  if (!id) return;
  try {
    await Api.finalizarEmprestimo(Number(id));
    livros = await Api.getLivros();
    leitores = await Api.getLeitores();
    emprestimos = await Api.getEmprestimos();
    renderLivros(); renderLeitores(); renderEmprestimos(); renderStats();
    toast("Empréstimo finalizado.");
  } catch (err) {
    toast(err.message, true);
  }
});

/* ============================================================
   Início
================================================================ */
(async function iniciar() {
  await checarApi();
  renderStats();
  renderLivros();
  renderLeitores();
  renderEmprestimos();
})();
