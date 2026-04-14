-- GYM PLATINUM v4.1 - Base de Datos Completa
-- Incluye limpieza total y datos de prueba funcionales.

DROP DATABASE IF EXISTS gym_platinum;
CREATE DATABASE gym_platinum CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE gym_platinum;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================
-- 1. USUARIOS
-- ==========================================
CREATE TABLE usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    telefono VARCHAR(20),
    rol ENUM('admin', 'entrenador', 'cliente') DEFAULT 'cliente',
    activo BOOLEAN DEFAULT 1,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. MEMBRESÍAS
-- ==========================================
CREATE TABLE membresias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    tipo ENUM('basica', 'plus', 'premium') NOT NULL,
    descripcion TEXT,
    precio DECIMAL(10,2) NOT NULL,
    duracion INT DEFAULT 30,
    activa BOOLEAN DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. USUARIO_MEMBRESIA
-- ==========================================
CREATE TABLE usuario_membresia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    membresia_id INT NOT NULL,
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    estado ENUM('activa', 'expirada', 'cancelada') DEFAULT 'activa',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (membresia_id) REFERENCES membresias(id) ON DELETE RESTRICT
);

-- ==========================================
-- 4. PAGOS
-- ==========================================
CREATE TABLE pagos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    membresia_id INT NOT NULL,
    monto DECIMAL(10,2) NOT NULL,
    metodo_pago VARCHAR(50),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    estado ENUM('pendiente', 'pagado', 'rechazado') DEFAULT 'pendiente',
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (membresia_id) REFERENCES membresias(id) ON DELETE RESTRICT
);

-- ==========================================
-- 5. SOLICITUDES_MEMBRESIA
-- ==========================================
CREATE TABLE solicitudes_membresia (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    membresia_id INT NOT NULL,
    metodo_pago VARCHAR(50),
    estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (membresia_id) REFERENCES membresias(id) ON DELETE CASCADE
);

-- ==========================================
-- 6. ASIGNACIONES 
-- ==========================================
CREATE TABLE asignaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    cliente_id INT NOT NULL,
    entrenador_id INT NOT NULL,
    fecha_asignacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    activa BOOLEAN DEFAULT 1,
    FOREIGN KEY (cliente_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (entrenador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    UNIQUE KEY unique_asignacion (cliente_id, entrenador_id)
);

-- ==========================================
-- 7. RUTINAS
-- ==========================================
CREATE TABLE rutinas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    entrenador_id INT NOT NULL,
    nombre VARCHAR(150) NOT NULL,
    dia_semana VARCHAR(20),
    semana INT DEFAULT 1,          -- Semana del mes (1-4)
    descripcion TEXT,
    calentamiento TEXT,            
    ejercicios JSON,
    duracion_min INT DEFAULT 60,
    fecha DATE,                    
    gif VARCHAR(255),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (entrenador_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==========================================
-- 8. SOLICITUDES_RUTINA
-- ==========================================
CREATE TABLE solicitudes_rutina (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    peso DECIMAL(5,2) NULL,
    estatura DECIMAL(5,2) NULL,
    sexo VARCHAR(50) NULL,
    condicion TEXT,
    tipo_solicitud VARCHAR(100),
    descripcion TEXT,
    rutina_id INT NULL,
    estado ENUM('pendiente', 'aceptada', 'rechazada') DEFAULT 'pendiente',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE SET NULL
);

-- ==========================================
-- 9. PROGRESO 
-- ==========================================
CREATE TABLE progreso (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    peso DECIMAL(5,2),
    observaciones TEXT,
    comentarios_entrenador TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==========================================
-- 10. ENTRENAMIENTO_LOG
-- ==========================================
CREATE TABLE entrenamiento_log (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    fecha DATE NOT NULL,
    dia_semana VARCHAR(20),
    semana INT DEFAULT 1,          -- Semana del mes (1-4)
    rutina_id INT NULL,
    completado BOOLEAN DEFAULT 1,
    notas TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (rutina_id) REFERENCES rutinas(id) ON DELETE SET NULL,
    UNIQUE KEY unique_user_semana_dia (usuario_id, semana, dia_semana)
);

-- ==========================================
-- 11. MENSAJES_CHAT
-- ==========================================
CREATE TABLE mensajes_chat (
    id INT AUTO_INCREMENT PRIMARY KEY,
    emisor_id INT NOT NULL,
    receptor_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (emisor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==========================================
-- 12. NOTIFICACIONES
-- ==========================================
CREATE TABLE notificaciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL,
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT 0,
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
);

-- ==========================================
-- INSERTS / SEEDER
-- ==========================================

-- Hash bcrypt de "123flavio"
SET @pass_hash = '$2a$10$HKfOLAS84OP7ehstoStM5OVoqiIyZIvF/WNC/3NIZESRH6VyRmP5y';

-- 1. USUARIOS
INSERT INTO usuarios (id, nombre, correo, password, rol, activo, telefono) VALUES
(1, 'Administrador', 'flavio@gmail.com', @pass_hash, 'admin', 1, '555-1000'),
(2, 'Entrenador', 'flavioe@gmail.com', @pass_hash, 'entrenador', 1, '555-2000'),
(3, 'Cliente', 'flavioc@gmail.com', @pass_hash, 'cliente', 1, '555-3000');

-- 2. MEMBRESÍAS
INSERT INTO membresias (id, nombre, tipo, precio, descripcion, duracion) VALUES
(1, 'Plan Básico', 'basica', 250.00, 'Acceso a instalaciones.', 30),
(2, 'Plan Plus', 'plus', 400.00, 'Rutinas predefinidas siempre + 1 rutina base.', 30),
(3, 'Plan Premium', 'premium', 700.00, 'Rutinas ilimitadas y herramientas Premium.', 30);

-- 3. SOLICITUD DE MEMBRESÍA
INSERT INTO solicitudes_membresia (usuario_id, membresia_id, metodo_pago, estado, created_at) VALUES
(3, 3, 'Efectivo', 'aceptada', NOW());

-- Activar la membresía del cliente
INSERT INTO usuario_membresia (usuario_id, membresia_id, fecha_inicio, fecha_fin, estado) VALUES
(3, 3, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 30 DAY), 'activa');

-- 4. ASIGNACIÓN
INSERT INTO asignaciones (cliente_id, entrenador_id, activa) VALUES
(3, 2, 1);

-- 5. SOLICITUD DE RUTINA
INSERT INTO solicitudes_rutina (usuario_id, peso, estatura, sexo, condicion, tipo_solicitud, descripcion, estado, created_at) VALUES
(3, 80.00, 175.00, 'Masculino', 'Ninguna', 'nueva_rutina', 'Quiero mejorar condición física', 'aceptada', NOW());

-- 6. RUTINAS (con semana del mes)
INSERT INTO rutinas (usuario_id, entrenador_id, nombre, dia_semana, semana, calentamiento, duracion_min, fecha, ejercicios) VALUES
(3, 2, 'Cuerpo Completo', 'Lunes', 1, '10 min calentamiento', 60, CURDATE(),
 '[{"nombre":"Sentadillas Libres","series":"4","reps":"12","descanso":"90 seg","tecnica":"Espalda recta.","gif":""}, {"nombre":"Press Banca","series":"4","reps":"10","descanso":"90 seg","tecnica":"Control excentrico.","gif":""}]'),

(3, 2, 'Tren Superior', 'Miércoles', 1, '5 min salto', 50, CURDATE(),
 '[{"nombre":"Dominadas","series":"3","reps":"8","descanso":"120 seg","tecnica":"Llevar barra al pecho.","gif":""}, {"nombre":"Press Militar","series":"4","reps":"12","descanso":"90 seg","tecnica":"Apretar abdomen.","gif":""}]'),

(3, 2, 'Tren Inferior', 'Viernes', 1, '10 min bici', 55, CURDATE(),
 '[{"nombre":"Prensa","series":"4","reps":"15","descanso":"90 seg","tecnica":"No bloquear rodillas.","gif":""}, {"nombre":"Curl de Isquios","series":"3","reps":"15","descanso":"60 seg","tecnica":"Bajar lento.","gif":""}]');

-- 7. PROGRESO
INSERT INTO progreso (usuario_id, peso, fecha, created_at, observaciones) VALUES
(3, 80.00, DATE_SUB(CURDATE(), INTERVAL 14 DAY), DATE_SUB(NOW(), INTERVAL 14 DAY), 'Semana 1'),
(3, 79.00, DATE_SUB(CURDATE(), INTERVAL 7 DAY), DATE_SUB(NOW(), INTERVAL 7 DAY), 'Semana 2');

-- 8. ENTRENAMIENTO_LOG (con semana del mes)
INSERT INTO entrenamiento_log (usuario_id, fecha, dia_semana, semana, completado) VALUES
(3, DATE_SUB(CURDATE(), INTERVAL 2 DAY), 'Miércoles', 2, 1),
(3, DATE_SUB(CURDATE(), INTERVAL 4 DAY), 'Lunes', 2, 1),
(3, DATE_SUB(CURDATE(), INTERVAL 9 DAY), 'Viernes', 1, 1),
(3, DATE_SUB(CURDATE(), INTERVAL 11 DAY), 'Miércoles', 1, 1);

SET FOREIGN_KEY_CHECKS = 1;
