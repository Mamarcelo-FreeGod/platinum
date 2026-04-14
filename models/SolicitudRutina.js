/**
 * Modelo SolicitudRutina
 * Operaciones CRUD para la tabla solicitudes_rutina
 */
const pool = require('../config/db');

const SolicitudRutina = {
    /**
     * Crear nueva solicitud de rutina
     */
    async create(data) {
        const [result] = await pool.query(
            'INSERT INTO solicitudes_rutina (usuario_id, peso, estatura, sexo, condicion, tipo_solicitud, descripcion, rutina_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
                data.usuario_id, 
                data.peso || null, 
                data.estatura || null, 
                data.sexo || null, 
                data.condicion || null,
                data.tipo_solicitud || 'nueva_rutina',
                data.descripcion || null,
                data.rutina_id || null
            ]
        );
        return result.insertId;
    },

    /**
     * Obtener todas las solicitudes (con nombre de usuario)
     */
    async getAll() {
        const [rows] = await pool.query(`
            SELECT sr.*, u.nombre as cliente_nombre, u.correo as cliente_correo
            FROM solicitudes_rutina sr
            JOIN usuarios u ON sr.usuario_id = u.id
            ORDER BY sr.created_at DESC
        `);
        return rows;
    },

    /**
     * Obtener solicitudes pendientes
     */
    async getPendientes() {
        const [rows] = await pool.query(`
            SELECT sr.*, u.nombre as cliente_nombre, u.correo as cliente_correo
            FROM solicitudes_rutina sr
            JOIN usuarios u ON sr.usuario_id = u.id
            WHERE sr.estado = 'pendiente'
            ORDER BY sr.created_at DESC
        `);
        return rows;
    },

    /**
     * Obtener solicitudes aceptadas (clientes personalizados)
     */
    async getAceptadas() {
        const [rows] = await pool.query(`
            SELECT sr.*, u.nombre as cliente_nombre, u.correo as cliente_correo, u.telefono as cliente_telefono
            FROM solicitudes_rutina sr
            INNER JOIN (
                SELECT MAX(id) as id
                FROM solicitudes_rutina
                WHERE estado = 'aceptada'
                GROUP BY usuario_id
            ) latest ON sr.id = latest.id
            JOIN usuarios u ON sr.usuario_id = u.id
            ORDER BY sr.created_at DESC
        `);
        return rows;
    },

    /**
     * Buscar solicitud por ID
     */
    async findById(id) {
        const [rows] = await pool.query(`
            SELECT sr.*, u.nombre as cliente_nombre, u.correo as cliente_correo
            FROM solicitudes_rutina sr
            JOIN usuarios u ON sr.usuario_id = u.id
            WHERE sr.id = ?
        `, [id]);
        return rows[0];
    },

    /**
     * Obtener solicitudes de un usuario
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(
            'SELECT * FROM solicitudes_rutina WHERE usuario_id = ? ORDER BY created_at DESC',
            [usuarioId]
        );
        return rows;
    },

    /**
     * Actualizar estado de solicitud
     */
    async updateEstado(id, estado) {
        const [result] = await pool.query(
            'UPDATE solicitudes_rutina SET estado = ? WHERE id = ?',
            [estado, id]
        );
        return result.affectedRows;
    },

    /**
     * Contar solicitudes pendientes
     */
    async countPendientes() {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM solicitudes_rutina WHERE estado = 'pendiente'"
        );
        return rows[0].total;
    },

    /**
     * Verificar si usuario ya tiene solicitud pendiente
     */
    async tienePendiente(usuarioId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM solicitudes_rutina WHERE usuario_id = ? AND estado = 'pendiente'",
            [usuarioId]
        );
        return rows[0].total > 0;
    },

    /**
     * Verificar si usuario ya tiene información física guardada (peso)
     */
    async checkUserExistsInfo(usuarioId) {
        const [rows] = await pool.query(
            "SELECT COUNT(*) as total FROM solicitudes_rutina WHERE usuario_id = ? AND peso IS NOT NULL",
            [usuarioId]
        );
        return rows[0].total > 0;
    }
};

module.exports = SolicitudRutina;
