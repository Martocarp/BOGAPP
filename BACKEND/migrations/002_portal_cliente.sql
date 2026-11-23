-- Nuevas funciones de BOGAPP: consultas sobre expedientes y pedidos de nuevos asuntos.
-- Se puede ejecutar varias veces: CREATE TABLE IF NOT EXISTS no borra los datos previos.

CREATE TABLE IF NOT EXISTS Consultas_Casos (
  Consulta_ID INT AUTO_INCREMENT PRIMARY KEY,
  Caso_ID INT NOT NULL,
  Pregunta VARCHAR(2000) NOT NULL,
  Respuesta VARCHAR(2000) NULL,
  Fecha_Pregunta TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Fecha_Respuesta DATETIME NULL,
  FOREIGN KEY (Caso_ID) REFERENCES Casos(Caso_ID) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS Solicitudes_Casos (
  Solicitud_ID INT AUTO_INCREMENT PRIMARY KEY,
  Cliente_ID INT NOT NULL,
  Profesional_ID INT NULL,
  Estudio_ID INT NULL,
  Titulo VARCHAR(200) NOT NULL,
  Descripcion TEXT NOT NULL,
  Estado ENUM('PENDIENTE','ACEPTADA','RECHAZADA') NOT NULL DEFAULT 'PENDIENTE',
  Fecha_Solicitud TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  Fecha_Respuesta DATETIME NULL,
  FOREIGN KEY (Cliente_ID) REFERENCES Usuarios(Usuario_ID) ON DELETE CASCADE,
  FOREIGN KEY (Profesional_ID) REFERENCES Usuarios(Usuario_ID) ON DELETE CASCADE,
  FOREIGN KEY (Estudio_ID) REFERENCES Estudios(Estudio_ID) ON DELETE CASCADE
) ENGINE=InnoDB;
