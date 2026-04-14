/**
 * Modelo SolicitudMembresia
 * Operaciones CRUD para la tabla solicitudes_membresia
 */
const pool = require('../config/db');

const SolicitudMembresia = {
    /**
     * Obtener todas las solicitudes con datos de usuario y membresía
     */
    async getAll() {
        const [rows] = await pool.query(`
            SELECT sm.*, u.nombre as usuario_nombre, u.correo as usuario_correo,
                   m.nombre as membresia_nombre, m.precio as membresia_precio, m.duracion as membresia_duracion
            FROM solicitudes_membresia sm
            JOIN usuarios u ON sm.usuario_id = u.id
            JOIN membresias m ON sm.membresia_id = m.id
            ORDER BY sm.created_at DESC
        `);
        return rows;
    },

    /**
     * Obtener solicitudes pendientes
     */
    async getPendientes() {
        const [rows] = await pool.query(`
            SELECT sm.*, u.nombre as usuario_nombre, u.correo as usuario_correo,
                   m.nombre as membresia_nombre, m.precio as membresia_precio, m.duracion as membresia_duracion
            FROM solicitudes_membresia sm
            JOIN usuarios u ON sm.usuario_id = u.id
            JOIN membresias m ON sm.membresia_id = m.id
            WHERE sm.estado = 'pendiente'
            ORDER BY sm.created_at DESC
        `);
        return rows;
    },

    /**
     * Obtener solicitudes de un usuario
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(`
            SELECT sm.*, m.nombre as membresia_nombre, m.precio as membresia_precio
            FROM solicitudes_membresia sm
            JOIN membresias m ON sm.membresia_id = m.id
            WHERE sm.usuario_id = ?
            ORDER BY sm.created_at DESC
        `, [usuarioId]);
        return rows;
    },

    /**
     * Buscar por ID
     */
    async findById(id) {
        const [rows] = await pool.query(`
            SELECT sm.*, u.nombre as usuario_nombre, u.correo as usuario_correo,
                   m.nombre as membresia_nombre, m.precio as membresia_precio, m.duracion as membresia_duracion
            FROM solicitudes_membresia sm
            JOIN usuarios u ON sm.usuario_id = u.id
            JOIN membresias m ON sm.membresia_id = m.id
            WHERE sm.id = ?
        `, [id]);
        return rows[0];
    },

    /**
     * Crear nueva solicitud
     */
    async create(data) {
        const [result] = await pool.query(
            'INSERT INTO solicitudes_membresia (usuario_id, membresia_id, metodo_pago) VALUES (?, ?, ?)',
            [data.usuario_id, data.membresia_id, data.metodo_pago || 'efectivo']
        );
        return result.insertId;
    },

    /**
     * Actualizar estado de solicitud
     */
    async updateEstado(id, estado) {
        const [result] = await pool.query(
            'UPDATE solicitudes_membresia SET estado = ? WHERE id = ?',
            [estado, id]
        );
        return result.affectedRows;
    },

    /**
     * Contar solicitudes pendientes
     */
    async countPendientes() {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM solicitudes_membresia WHERE estado = 'pendiente'");
        return rows[0].total;
    },

    /**
     * Verificar si el usuario tiene solicitud pendiente para una membresía específica
     */
    async tienePendiente(usuarioId, membresiaId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM solicitudes_membresia WHERE usuario_id = ? AND membresia_id = ? AND estado = 'pendiente'",
            [usuarioId, membresiaId]
        );
        return rows[0].total > 0;
    },

    /**
     * Verificar si el usuario tiene CUALQUIER solicitud pendiente
     * Usado para impedir múltiples solicitudes simultáneas
     */
    async tieneCualquierPendiente(usuarioId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM solicitudes_membresia WHERE usuario_id = ? AND estado = 'pendiente'",
            [usuarioId]
        );
        return rows[0].total > 0;
    }
};

module.exports = SolicitudMembresia;
