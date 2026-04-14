/**
 * Modelo Rutina
 * Operaciones CRUD para la tabla rutinas
 * Soporta ejercicios estructurados como JSON
 */
const pool = require('../config/db');

const Rutina = {
    /**
     * Obtener todas las rutinas
     */
    async getAll() {
        const [rows] = await pool.query(`
      SELECT r.*, 
             uc.nombre as cliente_nombre,
             ue.nombre as entrenador_nombre
      FROM rutinas r
      JOIN usuarios uc ON r.usuario_id = uc.id
      JOIN usuarios ue ON r.entrenador_id = ue.id
      ORDER BY r.created_at DESC
    `);
        return rows.map(r => Rutina._parseEjercicios(r));
    },

    /**
     * Buscar rutina por ID
     */
    async findById(id) {
        const [rows] = await pool.query(`
      SELECT r.*, 
             uc.nombre as cliente_nombre,
             ue.nombre as entrenador_nombre
      FROM rutinas r
      JOIN usuarios uc ON r.usuario_id = uc.id
      JOIN usuarios ue ON r.entrenador_id = ue.id
      WHERE r.id = ?
    `, [id]);
        return rows[0] ? Rutina._parseEjercicios(rows[0]) : null;
    },

    /**
     * Obtener rutinas de un usuario/cliente
     */
    async getByUsuarioId(usuarioId) {
        const [rows] = await pool.query(`
      SELECT r.*, ue.nombre as entrenador_nombre
      FROM rutinas r
      JOIN usuarios ue ON r.entrenador_id = ue.id
      WHERE r.usuario_id = ?
      ORDER BY r.fecha DESC
    `, [usuarioId]);
        return rows.map(r => Rutina._parseEjercicios(r));
    },

    /**
     * Obtener rutinas creadas por un entrenador
     */
    async getByEntrenadorId(entrenadorId) {
        const [rows] = await pool.query(`
      SELECT r.*, uc.nombre as cliente_nombre
      FROM rutinas r
      JOIN usuarios uc ON r.usuario_id = uc.id
      WHERE r.entrenador_id = ?
      ORDER BY r.created_at DESC
    `, [entrenadorId]);
        return rows.map(r => Rutina._parseEjercicios(r));
    },

    /**
     * Crear nueva rutina (con soporte para calentamiento, ejercicios JSON y semana)
     */
    async create(data) {
        // Si ejercicios es un array, convertir a JSON string
        let ejerciciosJson = null;
        if (data.ejercicios) {
            ejerciciosJson = typeof data.ejercicios === 'string'
                ? data.ejercicios
                : JSON.stringify(data.ejercicios);
        }

        const [result] = await pool.query(
            'INSERT INTO rutinas (usuario_id, entrenador_id, nombre, descripcion, calentamiento, ejercicios, dia_semana, semana, duracion_min, fecha, gif) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [
                data.usuario_id,
                data.entrenador_id,
                data.nombre,
                data.descripcion || null,
                data.calentamiento || null,
                ejerciciosJson,
                data.dia_semana,
                data.semana || 1,
                data.duracion_min || 60,
                data.fecha,
                data.gif || null
            ]
        );
        return result.insertId;
    },

    /**
     * Actualizar rutina (con soporte para calentamiento y ejercicios JSON)
     */
    async update(id, data) {
        let ejerciciosJson = undefined;
        if (data.ejercicios !== undefined) {
            ejerciciosJson = data.ejercicios
                ? (typeof data.ejercicios === 'string' ? data.ejercicios : JSON.stringify(data.ejercicios))
                : null;
        }

        let query, params;
        if (data.gif !== undefined && ejerciciosJson !== undefined) {
            query = 'UPDATE rutinas SET nombre = ?, descripcion = ?, calentamiento = ?, ejercicios = ?, dia_semana = ?, duracion_min = ?, fecha = ?, gif = ? WHERE id = ?';
            params = [data.nombre, data.descripcion, data.calentamiento || null, ejerciciosJson, data.dia_semana, data.duracion_min, data.fecha, data.gif, id];
        } else if (data.gif !== undefined) {
            query = 'UPDATE rutinas SET nombre = ?, descripcion = ?, calentamiento = ?, dia_semana = ?, duracion_min = ?, fecha = ?, gif = ? WHERE id = ?';
            params = [data.nombre, data.descripcion, data.calentamiento || null, data.dia_semana, data.duracion_min, data.fecha, data.gif, id];
        } else if (ejerciciosJson !== undefined) {
            query = 'UPDATE rutinas SET nombre = ?, descripcion = ?, calentamiento = ?, ejercicios = ?, dia_semana = ?, duracion_min = ?, fecha = ? WHERE id = ?';
            params = [data.nombre, data.descripcion, data.calentamiento || null, ejerciciosJson, data.dia_semana, data.duracion_min, data.fecha, id];
        } else {
            query = 'UPDATE rutinas SET nombre = ?, descripcion = ?, calentamiento = ?, dia_semana = ?, duracion_min = ?, fecha = ? WHERE id = ?';
            params = [data.nombre, data.descripcion, data.calentamiento || null, data.dia_semana, data.duracion_min, data.fecha, id];
        }
        const [result] = await pool.query(query, params);
        return result.affectedRows;
    },

    /**
     * Eliminar rutina
     */
    async delete(id) {
        const [result] = await pool.query('DELETE FROM rutinas WHERE id = ?', [id]);
        return result.affectedRows;
    },

    /**
     * Contar rutinas de un entrenador
     */
    async countByEntrenador(entrenadorId) {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM rutinas WHERE entrenador_id = ?', [entrenadorId]);
        return rows[0].total;
    },

    /**
     * Obtener rutinas de un usuario por día de la semana
     */
    async getByUsuarioIdAndDia(usuarioId, diaSemana) {
        const [rows] = await pool.query(`
      SELECT r.*, ue.nombre as entrenador_nombre
      FROM rutinas r
      JOIN usuarios ue ON r.entrenador_id = ue.id
      WHERE r.usuario_id = ? AND r.dia_semana = ?
      ORDER BY r.created_at ASC
    `, [usuarioId, diaSemana]);
        return rows.map(r => Rutina._parseEjercicios(r));
    },

    /**
     * Parse ejercicios JSON field safely
     * @private
     */
    _parseEjercicios(row) {
        if (row && row.ejercicios) {
            try {
                if (typeof row.ejercicios === 'string') {
                    row.ejercicios = JSON.parse(row.ejercicios);
                }
                // MySQL may already return it as object/array
            } catch (e) {
                row.ejercicios = [];
            }
        } else if (row) {
            row.ejercicios = [];
        }
        return row;
    }
};

module.exports = Rutina;
