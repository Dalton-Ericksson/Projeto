-- Rodar isso no SQL Editor do Supabase (Project > SQL Editor > New query)

CREATE TABLE IF NOT EXISTS leitores (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    nome VARCHAR(100),
    cpf VARCHAR(14) UNIQUE,
    idade INT,
    livros_emprestados INT DEFAULT 0
);

CREATE TABLE IF NOT EXISTS livros (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    titulo VARCHAR(150),
    autor VARCHAR(100),
    ano_publi INT,
    isbn VARCHAR(20) UNIQUE,
    disponivel BOOLEAN DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS emprestimos (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    leitor_id BIGINT REFERENCES leitores(id),
    livro_id BIGINT REFERENCES livros(id),
    aprovado BOOLEAN DEFAULT FALSE,
    data_emprestimo TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    data_finalizacao TIMESTAMP NULL DEFAULT NULL
);
