/**
 * Modelo Pago
 * Operaciones CRUD para la tabla pagos
 */
const pool = require('../config/db');

const Pago = {
    /**
     * Obtener todos los pagos
     */
    async getAll() {
        const [rows] = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre, m.nombre as membresia_nombre
      FROM pagos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN membresias m ON p.membresia_id = m.id
      ORDER BY p.fecha DESC
    `);
        return rows;
    },

    /**
     * Buscar pago por ID
     */
    async findById(id) {
        const [rows] = await pool.query(`
      SELECT p.*, u.nombre as usuario_nombre, m.nombre as membresia_nombre
      FROM pagos p
      JOIN usuarios u ON p.usuario_id = u.id
      LEFT JOIN membresias m ON p.membresia_id = m.id
      WHERE p.id = ?
    `, [id]);
        return rows[0];
    },

    /**
     * Obtener pagos de un usuario
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(`
      SELECT p.*, m.nombre as membresia_nombre
      FROM pagos p
      LEFT JOIN membresias m ON p.membresia_id = m.id
      WHERE p.usuario_id = ?
      ORDER BY p.fecha DESC
    `, [usuarioId]);
        return rows;
    },

    /**
     * Crear nuevo pago
     */
    async create(data) {
        const [result] = await pool.query(
            'INSERT INTO pagos (usuario_id, membresia_id, monto, metodo_pago, fecha, estado, notas) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [data.usuario_id, data.membresia_id || null, data.monto, data.metodo_pago || 'efectivo', data.fecha, data.estado || 'pagado', data.notas || null]
        );
        return result.insertId;
    },

    /**
     * Actualizar pago
     */
    async update(id, data) {
        const [result] = await pool.query(
            'UPDATE pagos SET monto = ?, metodo_pago = ?, estado = ?, notas = ? WHERE id = ?',
            [data.monto, data.metodo_pago, data.estado, data.notas, id]
        );
        return result.affectedRows;
    },

    /**
     * Eliminar pago
     */
    async delete(id) {
        const [result] = await pool.query('DELETE FROM pagos WHERE id = ?', [id]);
        return result.affectedRows;
    },

    /**
     * Obtener suma total de ingresos
     */
    async getTotalIngresos() {
        const [rows] = await pool.query("SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE estado = 'pagado'");
        return rows[0].total;
    },

    /**
     * Obtener ingresos del mes actual
     */
    async getIngresosMes() {
        const [rows] = await pool.query(`
      SELECT COALESCE(SUM(monto), 0) as total 
      FROM pagos 
      WHERE estado = 'pagado' 
      AND MONTH(fecha) = MONTH(CURDATE()) 
      AND YEAR(fecha) = YEAR(CURDATE())
    `);
        return rows[0].total;
    },

    /**
     * Contar pagos pendientes
     */
    async countPendientes() {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM pagos WHERE estado = 'pendiente'");
        return rows[0].total;
    },

    /**
     * Obtener ingresos agrupados por método de pago
     */
    async getIngresosPorMetodo() {
        const [rows] = await pool.query(`
            SELECT metodo_pago, 
                   COUNT(*) as cantidad,
                   COALESCE(SUM(monto), 0) as total
            FROM pagos 
            WHERE estado = 'pagado'
            GROUP BY metodo_pago
            ORDER BY total DESC
        `);
        return rows;
    },

    /**
     * Obtener ingresos mensuales (últimos 12 meses)
     */
    async getIngresosMensuales() {
        const [rows] = await pool.query(`
            SELECT 
                DATE_FORMAT(fecha, '%Y-%m') as mes,
                DATE_FORMAT(fecha, '%M %Y') as mes_nombre,
                COALESCE(SUM(monto), 0) as total,
                COUNT(*) as cantidad
            FROM pagos 
            WHERE estado = 'pagado'
            AND fecha >= DATE_SUB(CURDATE(), INTERVAL 12 MONTH)
            GROUP BY DATE_FORMAT(fecha, '%Y-%m'), DATE_FORMAT(fecha, '%M %Y')
            ORDER BY mes DESC
        `);
        return rows;
    }
};

module.exports = Pago;
