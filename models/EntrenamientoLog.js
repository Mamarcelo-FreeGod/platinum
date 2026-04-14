/**
 * Modelo EntrenamientoLog
 * Registro de días entrenados para calendario de progreso
 */
const pool = require('../config/db');

const EntrenamientoLog = {
    /**
     * Registrar un día de entrenamiento
     * Usa INSERT IGNORE para evitar duplicados por día
     */
    async create(data) {
        const [result] = await pool.query(
            `INSERT IGNORE INTO entrenamiento_log (usuario_id, fecha, dia_semana, rutina_id, notas)
             VALUES (?, ?, ?, ?, ?)`,
            [data.usuario_id, data.fecha, data.dia_semana || null, data.rutina_id || null, data.notas || null]
        );
        return result.insertId || result.affectedRows;
    },

    /**
     * Obtener todos los entrenamientos de un usuario
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(
            'SELECT * FROM entrenamiento_log WHERE usuario_id = ? ORDER BY fecha DESC',
            [usuarioId]
        );
        return rows;
    },

    /**
     * Obtener entrenamientos de un mes específico (para calendario)
     */
    async getByUsuarioIdAndMonth(usuarioId, year, month) {
        const [rows] = await pool.query(
            `SELECT * FROM entrenamiento_log 
             WHERE usuario_id = ? AND YEAR(fecha) = ? AND MONTH(fecha) = ?
             ORDER BY fecha ASC`,
            [usuarioId, year, month]
        );
        return rows;
    },

    /**
     * Obtener entrenamientos en un rango de fechas
     */
    async getByUsuarioIdAndDateRange(usuarioId, startDate, endDate) {
        const [rows] = await pool.query(
            `SELECT * FROM entrenamiento_log 
             WHERE usuario_id = ? 
             AND fecha BETWEEN ? AND ?
             ORDER BY fecha ASC`,
            [usuarioId, startDate, endDate]
        );
        return rows;
    },

    /**
     * Contar días entrenados en la semana actual
     */
    async countThisWeek(usuarioId) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as total FROM entrenamiento_log 
             WHERE usuario_id = ? AND YEARWEEK(fecha, 1) = YEARWEEK(CURDATE(), 1)`,
            [usuarioId]
        );
        return rows[0].total;
    },

    /**
     * Contar días entrenados en el mes actual
     */
    async countThisMonth(usuarioId) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as total FROM entrenamiento_log 
             WHERE usuario_id = ? AND MONTH(fecha) = MONTH(CURDATE()) AND YEAR(fecha) = YEAR(CURDATE())`,
            [usuarioId]
        );
        return rows[0].total;
    },

    /**
     * Obtener conteo de entrenamientos por semana (últimas 8 semanas)
     */
    async getWeeklyCount(usuarioId) {
        const [rows] = await pool.query(
            `SELECT 
                YEARWEEK(fecha, 1) as semana,
                MIN(fecha) as inicio_semana,
                COUNT(*) as total
             FROM entrenamiento_log 
             WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 8 WEEK)
             GROUP BY YEARWEEK(fecha, 1) 
             ORDER BY semana ASC`,
            [usuarioId]
        );
        return rows;
    },

    /**
     * Obtener conteo mensual (últimos 6 meses)
     */
    async getMonthlyCount(usuarioId) {
        const [rows] = await pool.query(
            `SELECT 
                YEAR(fecha) as anio,
                MONTH(fecha) as mes,
                COUNT(*) as total
             FROM entrenamiento_log 
             WHERE usuario_id = ? AND fecha >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
             GROUP BY YEAR(fecha), MONTH(fecha)
             ORDER BY anio ASC, mes ASC`,
            [usuarioId]
        );
        return rows;
    },

    /**
     * Verificar si ya entrenó hoy
     */
    async entrenoHoy(usuarioId) {
        const [rows] = await pool.query(
            `SELECT COUNT(*) as total FROM entrenamiento_log 
             WHERE usuario_id = ? AND fecha = CURDATE()`,
            [usuarioId]
        );
        return rows[0].total > 0;
    },

    /**
     * Eliminar registro de entrenamiento
     */
    async delete(id, usuarioId) {
        const [result] = await pool.query(
            'DELETE FROM entrenamiento_log WHERE id = ? AND usuario_id = ?',
            [id, usuarioId]
        );
        return result.affectedRows;
    }
};

module.exports = EntrenamientoLog;
