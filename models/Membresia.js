/**
 * Modelo Membresia
 * Operaciones CRUD para la tabla membresias y usuario_membresia
 * SOLO existen 3 tipos: basica, plus, premium
 */
const pool = require('../config/db');

const Membresia = {
    /**
     * Obtener todas las membresías (solo las 3 tipos)
     */
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM membresias ORDER BY precio ASC');
        return rows;
    },

    /**
     * Obtener solo membresías activas
     */
    async getActivas() {
        const [rows] = await pool.query('SELECT * FROM membresias WHERE activa = 1 ORDER BY precio ASC');
        return rows;
    },

    /**
     * Buscar membresía por ID
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM membresias WHERE id = ?', [id]);
        return rows[0];
    },

    /**
     * Buscar membresía por tipo (basica, plus, premium)
     */
    async getByTipo(tipo) {
        const [rows] = await pool.query('SELECT * FROM membresias WHERE tipo = ?', [tipo]);
        return rows[0];
    },

    /**
     * Contar total de membresías en el sistema
     */
    async countAll() {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM membresias');
        return rows[0].total;
    },

    /**
     * Crear nueva membresía
     * BLOQUEADO si ya existen 3 membresías (basica, plus, premium)
     */
    async create(data) {
        // Validar que no existan más de 3 membresías
        const total = await Membresia.countAll();
        if (total >= 3) {
            throw new Error('No se pueden crear más de 3 membresías. Solo existen: Básica, Plus y Premium.');
        }

        // Validar que no exista otra con el mismo tipo
        const existente = await Membresia.getByTipo(data.tipo);
        if (existente) {
            throw new Error(`Ya existe una membresía de tipo "${data.tipo}".`);
        }

        const [result] = await pool.query(
            'INSERT INTO membresias (nombre, tipo, descripcion, precio, duracion) VALUES (?, ?, ?, ?, ?)',
            [data.nombre, data.tipo, data.descripcion, data.precio, data.duracion]
        );
        return result.insertId;
    },

    /**
     * Actualizar membresía (precio, duración, descripción, estado)
     * NO permite cambiar el tipo
     */
    async update(id, data) {
        const [result] = await pool.query(
            'UPDATE membresias SET nombre = ?, descripcion = ?, precio = ?, duracion = ?, activa = ? WHERE id = ?',
            [data.nombre, data.descripcion, data.precio, data.duracion, data.activa !== undefined ? data.activa : 1, id]
        );
        return result.affectedRows;
    },

    /**
     * Eliminar membresía — BLOQUEADO para las 3 base
     * Las membresías base solo se pueden desactivar, no eliminar
     */
    async delete(id) {
        const membresia = await Membresia.findById(id);
        if (membresia && ['basica', 'plus', 'premium'].includes(membresia.tipo)) {
            throw new Error('No se puede eliminar una membresía base. Solo puedes desactivarla.');
        }
        const [result] = await pool.query('DELETE FROM membresias WHERE id = ?', [id]);
        return result.affectedRows;
    },

    /**
     * Obtener membresía activa de un usuario (incluye tipo)
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(`
      SELECT um.*, m.nombre, m.descripcion, m.precio, m.duracion, m.tipo
      FROM usuario_membresia um
      JOIN membresias m ON um.membresia_id = m.id
      WHERE um.usuario_id = ? AND um.estado = 'activa'
      ORDER BY um.fecha_fin DESC
      LIMIT 1
    `, [usuarioId]);
        return rows[0];
    },

    /**
     * Obtener el tipo de membresía activa de un usuario
     * Retorna: 'basica', 'plus', 'premium' o null
     */
    async getTipoByUsuarioId(usuarioId) {
        const [rows] = await pool.query(`
      SELECT m.tipo
      FROM usuario_membresia um
      JOIN membresias m ON um.membresia_id = m.id
      WHERE um.usuario_id = ? AND um.estado = 'activa' AND um.fecha_fin >= CURDATE()
      ORDER BY um.fecha_fin DESC
      LIMIT 1
    `, [usuarioId]);
        return rows[0] ? rows[0].tipo : null;
    },

    /**
     * Asignar membresía a usuario
     * DESACTIVA cualquier membresía anterior antes de asignar la nueva
     */
    async asignarAUsuario(usuarioId, membresiaId, fechaInicio, fechaFin) {
        // Desactivar membresías anteriores del usuario
        await pool.query(
            "UPDATE usuario_membresia SET estado = 'expirada' WHERE usuario_id = ? AND estado = 'activa'",
            [usuarioId]
        );

        // Asignar la nueva membresía
        const [result] = await pool.query(
            'INSERT INTO usuario_membresia (usuario_id, membresia_id, fecha_inicio, fecha_fin) VALUES (?, ?, ?, ?)',
            [usuarioId, membresiaId, fechaInicio, fechaFin]
        );
        return result.insertId;
    },

    /**
     * Contar membresías activas (usuarios con membresía vigente)
     */
    async countActivas() {
        const [rows] = await pool.query("SELECT COUNT(*) as total FROM usuario_membresia WHERE estado = 'activa'");
        return rows[0].total;
    },

    /**
     * Verificar si un usuario tiene membresía activa y vigente
     */
    async tieneMembresiaActiva(usuarioId) {
        const [rows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM usuario_membresia
      WHERE usuario_id = ? AND estado = 'activa' AND fecha_fin >= CURDATE()
    `, [usuarioId]);
        return rows[0].total > 0;
    },

    /**
     * Contar rutinas personalizadas creadas este mes para un usuario
     */
    async countRutinasPersonalizadasMes(usuarioId) {
        const [rows] = await pool.query(`
      SELECT COUNT(*) as total
      FROM rutinas
      WHERE usuario_id = ? 
        AND MONTH(created_at) = MONTH(CURDATE())
        AND YEAR(created_at) = YEAR(CURDATE())
    `, [usuarioId]);
        return rows[0].total;
    }
};

module.exports = Membresia;
