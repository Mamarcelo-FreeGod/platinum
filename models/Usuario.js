/**
 * Modelo Usuario
 * Operaciones CRUD para la tabla usuarios
 */
const pool = require('../config/db');
const bcrypt = require('bcryptjs');

const Usuario = {
    /**
     * Buscar usuario por correo electrónico
     */
    async findByEmail(correo) {
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE correo = ?', [correo]);
        return rows[0];
    },

    /**
     * Buscar usuario por ID
     */
    async findById(id) {
        const [rows] = await pool.query('SELECT id, nombre, correo, telefono, rol, activo, fecha_registro FROM usuarios WHERE id = ?', [id]);
        return rows[0];
    },

    /**
     * Obtener todos los usuarios
     */
    async getAll() {
        const [rows] = await pool.query('SELECT id, nombre, correo, telefono, rol, activo, fecha_registro FROM usuarios ORDER BY fecha_registro DESC');
        return rows;
    },

    /**
     * Obtener usuarios por rol
     */
    async getByRole(rol) {
        const [rows] = await pool.query('SELECT id, nombre, correo, telefono, rol, activo, fecha_registro FROM usuarios WHERE rol = ? ORDER BY nombre', [rol]);
        return rows;
    },

    /**
     * Crear nuevo usuario
     */
    async create(data) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(data.password, salt);
        const [result] = await pool.query(
            'INSERT INTO usuarios (nombre, correo, password, telefono, rol) VALUES (?, ?, ?, ?, ?)',
            [data.nombre, data.correo, hashedPassword, data.telefono || null, data.rol || 'cliente']
        );
        return result.insertId;
    },

    /**
     * Actualizar usuario
     */
    async update(id, data) {
        let query = 'UPDATE usuarios SET nombre = ?, correo = ?, telefono = ?, rol = ?, activo = ? WHERE id = ?';
        let params = [data.nombre, data.correo, data.telefono, data.rol, data.activo !== undefined ? data.activo : 1, id];

        // Si se envía nueva contraseña, actualizarla
        if (data.password && data.password.trim() !== '') {
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(data.password, salt);
            query = 'UPDATE usuarios SET nombre = ?, correo = ?, password = ?, telefono = ?, rol = ?, activo = ? WHERE id = ?';
            params = [data.nombre, data.correo, hashedPassword, data.telefono, data.rol, data.activo !== undefined ? data.activo : 1, id];
        }

        const [result] = await pool.query(query, params);
        return result.affectedRows;
    },

    /**
     * Eliminar usuario
     */
    async delete(id) {
        const [result] = await pool.query('DELETE FROM usuarios WHERE id = ?', [id]);
        return result.affectedRows;
    },

    /**
     * Comparar contraseña
     */
    async comparePassword(candidatePassword, hashedPassword) {
        return bcrypt.compare(candidatePassword, hashedPassword);
    },

    /**
     * Contar usuarios por rol
     */
    async countByRole(rol) {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM usuarios WHERE rol = ?', [rol]);
        return rows[0].total;
    },

    /**
     * Contar total de usuarios
     */
    async countAll() {
        const [rows] = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        return rows[0].total;
    }
};

module.exports = Usuario;
