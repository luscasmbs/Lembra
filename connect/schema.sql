CREATE TABLE IF NOT EXISTS cadastro (
  id_pac INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  cpf VARCHAR(32) NOT NULL UNIQUE,
  telefone VARCHAR(32) NULL,
  tipo VARCHAR(8) NOT NULL,
  medico VARCHAR(120) NOT NULL,
  restricao TEXT NOT NULL,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  atualizado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS cuidadores (
  id INT AUTO_INCREMENT PRIMARY KEY,
  nome VARCHAR(160) NOT NULL,
  email VARCHAR(160) NOT NULL UNIQUE,
  senha VARCHAR(255) NOT NULL,
  cpf_paciente VARCHAR(32) NOT NULL,
  estagio ENUM('leve','moderado') DEFAULT 'moderado',
  timer_jogos TINYINT(1) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_cuidadores_paciente
    FOREIGN KEY (cpf_paciente) REFERENCES cadastro(cpf)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lembretes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpf_paciente VARCHAR(32) NOT NULL,
  titulo VARCHAR(180) NOT NULL,
  tipo VARCHAR(40) DEFAULT 'Rotina',
  horario TIME NOT NULL,
  concluido TINYINT(1) DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_lembretes_paciente
    FOREIGN KEY (cpf_paciente) REFERENCES cadastro(cpf)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS humor_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpf_paciente VARCHAR(32) NOT NULL,
  humor VARCHAR(32) NOT NULL,
  registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_humor_paciente
    FOREIGN KEY (cpf_paciente) REFERENCES cadastro(cpf)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS jogo_sessoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpf_paciente VARCHAR(32) NULL,
  jogo VARCHAR(80) NOT NULL,
  pontos INT DEFAULT 0,
  resultado VARCHAR(80) DEFAULT 'concluido',
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_jogo_sessoes_paciente (cpf_paciente, criado_em)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS localizacao_registros (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpf_paciente VARCHAR(32) NOT NULL,
  latitude DECIMAL(10, 7) NOT NULL,
  longitude DECIMAL(10, 7) NOT NULL,
  registrado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_localizacao_paciente
    FOREIGN KEY (cpf_paciente) REFERENCES cadastro(cpf)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS musica_favoritas (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpf_paciente VARCHAR(32) NOT NULL,
  musica VARCHAR(120) NOT NULL,
  artista VARCHAR(120) NULL,
  duracao_segundos INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_musica_fav_paciente
    FOREIGN KEY (cpf_paciente) REFERENCES cadastro(cpf)
    ON UPDATE CASCADE
    ON DELETE CASCADE
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS musica_sessoes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  cpf_paciente VARCHAR(32) NULL,
  musica VARCHAR(120) NOT NULL,
  artista VARCHAR(120) NULL,
  duracao_segundos INT DEFAULT 0,
  criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_musica_sessoes_paciente (cpf_paciente, criado_em)
) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
