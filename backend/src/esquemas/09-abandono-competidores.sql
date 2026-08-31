CREATE TABLE IF NOT EXISTS abandono_competidores (
  nro INTEGER NOT NULL,
  etapa INTEGER NOT NULL,
  pes_pendientes INTEGER[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  PRIMARY KEY (nro, etapa)
);
