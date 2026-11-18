-- BOGAPP · Ampliación de módulos profesionales.
-- NO ejecutar el esquema viejo que contiene DROP DATABASE.
-- Se aplica mediante: node scripts/migrarProfesionales.js
CREATE TABLE IF NOT EXISTS Especializaciones (
  Especializacion_ID INT PRIMARY KEY AUTO_INCREMENT,
  Nombre VARCHAR(100) NOT NULL UNIQUE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Profesionales_Especializaciones (
  Usuario_ID INT NOT NULL,
  Especializacion_ID INT NOT NULL,
  PRIMARY KEY (Usuario_ID, Especializacion_ID),
  FOREIGN KEY (Usuario_ID) REFERENCES Usuarios(Usuario_ID),
  FOREIGN KEY (Especializacion_ID) REFERENCES Especializaciones(Especializacion_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Estudios_Especializaciones (
  Estudio_ID INT NOT NULL,
  Especializacion_ID INT NOT NULL,
  PRIMARY KEY (Estudio_ID, Especializacion_ID),
  FOREIGN KEY (Estudio_ID) REFERENCES Estudios(Estudio_ID) ON DELETE CASCADE,
  FOREIGN KEY (Especializacion_ID) REFERENCES Especializaciones(Especializacion_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Perfiles_Profesionales (
  Usuario_ID INT PRIMARY KEY,
  Biografia TEXT NULL,
  Cv_Nombre VARCHAR(255) NULL,
  Cv_Ruta VARCHAR(255) NULL,
  Cv_Visible BOOLEAN DEFAULT FALSE,
  Fecha_Actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (Usuario_ID) REFERENCES Usuarios(Usuario_ID)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Profesionales_Clientes (
  Profesional_ID INT NOT NULL,
  Cliente_ID INT NOT NULL,
  Estado ENUM('PENDIENTE','ACTIVO','RECHAZADO') NOT NULL DEFAULT 'PENDIENTE',
  Origen ENUM('SOLICITUD','INVITACION') NOT NULL DEFAULT 'INVITACION',
  Fecha_Solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (Profesional_ID, Cliente_ID),
  FOREIGN KEY (Profesional_ID) REFERENCES Usuarios(Usuario_ID),
  FOREIGN KEY (Cliente_ID) REFERENCES Usuarios(Usuario_ID)
) ENGINE=InnoDB;

INSERT IGNORE INTO Especializaciones (Nombre) VALUES
  ('Derecho penal'), ('Hurtos y robos'), ('Accidentes de tránsito'),
  ('Derecho laboral'), ('Derecho de familia'), ('Divorcios'),
  ('Sucesiones'), ('Civil y comercial'), ('Daños y perjuicios'),
  ('Derecho previsional'), ('Derecho administrativo'), ('Derecho tributario');
