const pool = require('./config/db');

async function upgradeDB() {
    try {
        console.log('Iniciando actualización de la base de datos para Progreso Premium...');

        await pool.query(`
            CREATE TABLE IF NOT EXISTS progreso (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                fecha DATE NOT NULL,
                peso DECIMAL(5,2),
                observaciones TEXT,
                comentarios_entrenador TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('Tabla "progreso" verificada/creada exitosamente.');
        
        process.exit(0);
    } catch (error) {
        console.error('Error al actualizar la BD:', error);
        process.exit(1);
    }
}

upgradeDB();
