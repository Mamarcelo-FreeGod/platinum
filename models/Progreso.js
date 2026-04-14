/**
 * Modelo Progreso
 * Operaciones CRUD para la tabla progreso
 * v3.0: Añade soporte para volumen estimado, datos semanales y mensuales
 */
const pool = require('../config/db');

const Progreso = {
    /**
     * Crear nuevo registro de progreso
     */
    async create(data) {
        const [result] = await pool.query(
            'INSERT INTO progreso (usuario_id, fecha, peso, observaciones) VALUES (?, ?, ?, ?)',
            [data.usuario_id, data.fecha, data.peso, data.observaciones]
        );
        return result.insertId;
    },

    /**
     * Obtener progresos de un usuario
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(
            'SELECT * FROM progreso WHERE usuario_id = ? ORDER BY fecha DESC',
            [usuarioId]
        );
        return rows;
    },

    /**
     * Obtener progreso por ID
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM progreso WHERE id = ?', [id]);
        return rows[0];
    },

    /**
     * Agregar comentario del entrenador
     */
    async addComentario(id, comentario) {
        const [result] = await pool.query(
            'UPDATE progreso SET comentarios_entrenador = ? WHERE id = ?',
            [comentario, id]
        );
        return result.affectedRows > 0;
    },

    /**
     * Obtener datos semanales (últimas 8 semanas) para gráficas
     */
    async getWeeklyData(usuarioId) {
        const [rows] = await pool.query(
            `SELECT 
                YEARWEEK(fecha, 1) as semana,
                MIN(fecha) as inicio_semana,
                AVG(peso) as peso_promedio,
                COUNT(*) as registros
             FROM progreso 
             WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
             GROUP BY YEARWEEK(fecha, 1)
             ORDER BY semana ASC`,
            [usuarioId]
        );
        return rows;
    },

    /**
     * Obtener datos mensuales (últimos 6 meses) para gráficas
     */
    async getMonthlyData(usuarioId) {
        const [rows] = await pool.query(
            `SELECT 
                YEAR(fecha) as anio,
                MONTH(fecha) as mes,
                AVG(peso) as peso_promedio,
                COUNT(*) as registros
             FROM progreso 
             WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY YEAR(fecha), MONTH(fecha)
             ORDER BY anio ASC, mes ASC`,
            [usuarioId]
        );
        return rows;
    },

    /**
     * Obtener último registro del usuario
     */
    async getUltimo(usuarioId) {
        const [rows] = await pool.query(
            'SELECT * FROM progreso WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1',
            [usuarioId]
        );
        return rows[0] || null;
    },

    /**
     * Calcular IMC y porcentaje de grasa corporal según fórmula de Deurenberg
     */
    calcularComposicionCorporal(peso, estatura, sexo) {
        if (!peso || !estatura) return null;
        
        const h = estatura / 100;
        const imc = peso / (h * h);
        let grasa = 0;
        
        // Asumiendo edad promedio 25 para la fórmula
        const edad_promedio = 25;
        
        if (sexo === 'Masculino') {
            grasa = (1.20 * imc) + (0.23 * edad_promedio) - 16.2;
        } else {
            grasa = (1.20 * imc) + (0.23 * edad_promedio) - 5.4;
        }
        
        // Ajuste básico
        grasa = Math.max(5, grasa);

        let clasificacion = '';
        if (imc < 18.5) clasificacion = 'Bajo peso';
        else if (imc < 24.9) clasificacion = 'Normal';
        else if (imc < 29.9) clasificacion = 'Sobrepeso';
        else clasificacion = 'Obesidad';

        let objetivo = '';
        if (imc < 18.5) objetivo = 'Aumentar masa muscular y caloric surplus.';
        else if (imc < 24.9) objetivo = 'Mantener composición y ganar fuerza.';
        else objetivo = 'Reducción de porcentaje de grasa (déficit calórico).';

        return {
            imc: parseFloat(imc.toFixed(1)),
            grasa: parseFloat(grasa.toFixed(1)),
            clasificacion,
            objetivo,
            estaturaInt: parseInt(estatura)
        };
    },

    /**
     * Verificar si el usuario puede actualizar su peso (1 vez cada 7 días)
     */
    async puedeActualizarPeso(usuarioId) {
        const [rows] = await pool.query(
            'SELECT fecha FROM progreso WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1',
            [usuarioId]
        );
        if (rows.length === 0) return true;

        const ultimaFecha = new Date(rows[0].fecha);
        const hoy = new Date();
        const diffDias = (hoy - ultimaFecha) / (1000 * 60 * 60 * 24);
        return diffDias >= 7;
    }
};

module.exports = Progreso;
