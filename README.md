# 📚 Acervo — Sistema de Biblioteca

Sistema de biblioteca com página web dinâmica, API em Node.js/Express e banco PostgreSQL (Supabase). Controla livros, leitores e empréstimos, com a regra de que um leitor pode ter no máximo 3 livros emprestados ao mesmo tempo.

## Tecnologias

- Frontend: HTML, CSS e JavaScript puro
- Backend: Node.js + Express
- Banco de dados: PostgreSQL (Supabase)
- Hospedagem: Vercel

## Estrutura

```
├── server.js              # Servidor Express (página + API)
├── db.js                  # Conexão com o banco
├── schema_supabase.sql    # Script para criar as tabelas
├── routes/                # Rotas da API (livros, leitores, empréstimos)
└── public/                # Página web (HTML, CSS, JS)
```

## Rodando localmente

1. Criar um projeto no Supabase e rodar `schema_supabase.sql` no SQL Editor dele.
2. Copiar `.env.example` para `.env` e colar a connection string do Supabase na variável `DATABASE_URL`.
3. Instalar e rodar:
   ```
   npm install
   npm start
   ```
4. Abrir **http://localhost:3000** no navegador.

> Se a API não estiver acessível, a página cai sozinha em "Modo demonstração" (dados só na memória do navegador), pra ainda dar pra testar a interface.

## API

| Método | Rota | Descrição |
|---|---|---|
| GET/POST | `/api/livros` | Listar / cadastrar livros |
| PUT/DELETE | `/api/livros/:id` | Atualizar / excluir um livro |
| GET/POST | `/api/leitores` | Listar / cadastrar leitores |
| PUT/DELETE | `/api/leitores/:id` | Atualizar / excluir um leitor |
| GET/POST | `/api/emprestimos` | Listar / realizar empréstimo |
| PUT | `/api/emprestimos/:id/finalizar` | Finalizar um empréstimo |

## Deploy

Projeto no GitHub → importar no Vercel → configurar a variável `DATABASE_URL` nas Environment Variables → Deploy.

## Aviso

Não tem sistema de login — qualquer pessoa com o link pode editar os dados. Ok para uso de teste/demonstração.
