/**
 * Modelo Notificacion
 * Operaciones CRUD para la tabla notificaciones
 */
const pool = require('../config/db');

const Notificacion = {
    /**
     * Obtener notificaciones de un usuario
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(
            'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 50',
            [usuarioId]
        );
        return rows;
    },

    /**
     * Contar notificaciones no leídas
     */
    async countNoLeidas(usuarioId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM notificaciones WHERE usuario_id = ? AND leido = 0',
            [usuarioId]
        );
        return rows[0].total;
    },

    /**
     * Crear nueva notificación
     */
    async create(data) {
        const [result] = await pool.query(
            'INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)',
            [data.usuario_id, data.mensaje]
        );
        return result.insertId;
    },

    /**
     * Marcar una notificación como leída
     */
    async marcarLeida(id) {
        const [result] = await pool.query(
            'UPDATE notificaciones SET leido = 1 WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    },

    /**
     * Marcar todas las notificaciones de un usuario como leídas
     */
    async marcarTodasLeidas(usuarioId) {
        const [result] = await pool.query(
            'UPDATE notificaciones SET leido = 1 WHERE usuario_id = ?',
            [usuarioId]
        );
        return result.affectedRows;
    },

    /**
     * Obtener últimas N notificaciones (para dropdown)
     */
    async getUltimas(usuarioId, limit = 5) {
        const [rows] = await pool.query(
            'SELECT * FROM notificaciones WHERE usuario_id = ? ORDER BY fecha DESC LIMIT ?',
            [usuarioId, limit]
        );
        return rows;
    },

    /**
     * Notificar a todos los usuarios con un rol específico
     */
    async notificarPorRol(rol, mensaje) {
        const [usuarios] = await pool.query(
            'SELECT id FROM usuarios WHERE rol = ? AND activo = 1',
            [rol]
        );
        for (const usuario of usuarios) {
            await pool.query(
                'INSERT INTO notificaciones (usuario_id, mensaje) VALUES (?, ?)',
                [usuario.id, mensaje]
            );
        }
    }
};

module.exports = Notificacion;
