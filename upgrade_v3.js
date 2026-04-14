/**
 * GYM PLATINUM v3.0 — Database Migration
 * Creates tables: entrenamiento_log, mensajes_chat
 * Adds column volumen_estimado to progreso
 */
const pool = require('./config/db');

async function upgradeV3() {
    try {
        console.log('🚀 Iniciando migración GYM PLATINUM v3.0...\n');

        // 1. Tabla entrenamiento_log (calendario de entrenamientos)
        console.log('📅 Creando tabla entrenamiento_log...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS entrenamiento_log (
                id INT AUTO_INCREMENT PRIMARY KEY,
                usuario_id INT NOT NULL,
                fecha DATE NOT NULL,
                dia_semana VARCHAR(20),
                rutina_id INT NULL,
                completado BOOLEAN DEFAULT 1,
                notas TEXT,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                UNIQUE KEY unique_user_date (usuario_id, fecha)
            ) ENGINE=InnoDB;
        `);
        console.log('   ✅ Tabla entrenamiento_log creada/verificada.');

        // 2. Tabla mensajes_chat
        console.log('💬 Creando tabla mensajes_chat...');
        await pool.query(`
            CREATE TABLE IF NOT EXISTS mensajes_chat (
                id INT AUTO_INCREMENT PRIMARY KEY,
                emisor_id INT NOT NULL,
                receptor_id INT NOT NULL,
                mensaje TEXT NOT NULL,
                leido BOOLEAN DEFAULT 0,
                created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (emisor_id) REFERENCES usuarios(id) ON DELETE CASCADE,
                FOREIGN KEY (receptor_id) REFERENCES usuarios(id) ON DELETE CASCADE
            ) ENGINE=InnoDB;
        `);
        console.log('   ✅ Tabla mensajes_chat creada/verificada.');

        // 3. Añadir columna volumen_estimado a progreso
        console.log('📊 Añadiendo columna volumen_estimado a progreso...');
        try {
            await pool.query(`ALTER TABLE progreso ADD COLUMN volumen_estimado DECIMAL(10,2) NULL;`);
            console.log('   ✅ Columna volumen_estimado añadida.');
        } catch (e) {
            if (e.code === 'ER_DUP_FIELDNAME') {
                console.log('   ⚠️  Columna volumen_estimado ya existe, saltando.');
            } else {
                console.log('   ⚠️  ' + e.message);
            }
        }

        console.log('\n✅ Migración GYM PLATINUM v3.0 completada exitosamente.');
        process.exit(0);
    } catch (error) {
        console.error('\n❌ Error en la migración:', error);
        process.exit(1);
    }
}

upgradeV3();
