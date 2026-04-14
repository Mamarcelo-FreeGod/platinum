const pool = require('./config/db');

async function upgrade() {
    try {
        console.log("Upgrading DB...");
        
        await pool.query(`ALTER TABLE solicitudes_rutina MODIFY peso DECIMAL(5,2) NULL;`);
        await pool.query(`ALTER TABLE solicitudes_rutina MODIFY estatura DECIMAL(5,2) NULL;`);
        await pool.query(`ALTER TABLE solicitudes_rutina MODIFY sexo VARCHAR(10) NULL;`);
        
        // Add new columns if they do not exist. In mysql, easiest is to just try/catch if they exist
        try {
            await pool.query(`ALTER TABLE solicitudes_rutina ADD COLUMN tipo_solicitud VARCHAR(50) DEFAULT 'nueva_rutina';`);
        } catch(e) { console.log(e.message) }
        try {
            await pool.query(`ALTER TABLE solicitudes_rutina ADD COLUMN descripcion TEXT;`);
        } catch(e) { console.log(e.message) }
        try {
            await pool.query(`ALTER TABLE solicitudes_rutina ADD COLUMN rutina_id INT NULL;`);
        } catch(e) { console.log(e.message) }
        
        console.log("DB Upgrade finished");
        process.exit(0);
    } catch(err) {
        console.error(err);
        process.exit(1);
    }
}

upgrade();
