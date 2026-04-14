/**
 * Modelo Asignacion
 * Operaciones CRUD para la tabla asignaciones (entrenador-cliente)
 */
const pool = require('../config/db');

const Asignacion = {
    /**
     * Obtener clientes asignados a un entrenador
     */
    async getByEntrenadorId(entrenadorId) {
        const [rows] = await pool.query(`
            SELECT u.id, u.nombre, u.correo, u.telefono, a.fecha_asignacion, a.id as asignacion_id,
                   (SELECT COUNT(*) FROM rutinas r WHERE r.usuario_id = u.id AND r.entrenador_id = ?) as total_rutinas
            FROM asignaciones a
            JOIN usuarios u ON a.cliente_id = u.id
            WHERE a.entrenador_id = ? AND a.activa = 1
            ORDER BY u.nombre
        `, [entrenadorId, entrenadorId]);
        return rows;
    },

    /**
     * Crear nueva asignación
     */
    async create(entrenadorId, clienteId) {
        const [result] = await pool.query(
            'INSERT INTO asignaciones (entrenador_id, cliente_id, fecha_asignacion) VALUES (?, ?, CURDATE())',
            [entrenadorId, clienteId]
        );
        return result.insertId;
    },

    /**
     * Eliminar asignación (desactivar)
     */
    async delete(id) {
        const [result] = await pool.query(
            'DELETE FROM asignaciones WHERE id = ?',
            [id]
        );
        return result.affectedRows;
    },

    /**
     * Verificar si existe una asignación activa
     */
    async exists(entrenadorId, clienteId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM asignaciones WHERE entrenador_id = ? AND cliente_id = ? AND activa = 1',
            [entrenadorId, clienteId]
        );
        return rows[0].total > 0;
    },

    /**
     * Contar clientes de un entrenador
     */
    async countByEntrenador(entrenadorId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM asignaciones WHERE entrenador_id = ? AND activa = 1',
            [entrenadorId]
        );
        return rows[0].total;
    },

    /**
     * Buscar asignación por ID
     */
    async findById(id) {
        const [rows] = await pool.query(
            'SELECT * FROM asignaciones WHERE id = ?',
            [id]
        );
        return rows[0];
    }
};

module.exports = Asignacion;
