/**
 * Modelo MensajeChat
 * Sistema de mensajería persistente entre clientes Premium y entrenadores
 */
const pool = require('../config/db');

const MensajeChat = {
    /**
     * Enviar un mensaje
     */
    async create(data) {
        const [result] = await pool.query(
            'INSERT INTO mensajes_chat (emisor_id, receptor_id, mensaje) VALUES (?, ?, ?)',
            [data.emisor_id, data.receptor_id, data.mensaje]
        );
        return result.insertId;
    },

    /**
     * Obtener conversación entre dos usuarios
     */
    async getConversacion(userId1, userId2, limit = 100) {
        const [rows] = await pool.query(
            `SELECT mc.*, 
                    ue.nombre as emisor_nombre,
                    ur.nombre as receptor_nombre
             FROM mensajes_chat mc
             JOIN usuarios ue ON mc.emisor_id = ue.id
             JOIN usuarios ur ON mc.receptor_id = ur.id
             WHERE (mc.emisor_id = ? AND mc.receptor_id = ?)
                OR (mc.emisor_id = ? AND mc.receptor_id = ?)
             ORDER BY mc.created_at ASC
             LIMIT ?`,
            [userId1, userId2, userId2, userId1, limit]
        );
        return rows;
    },

    /**
     * Marcar mensajes como leídos (los que recibió el usuario)
     */
    async marcarLeidos(receptorId, emisorId) {
        const [result] = await pool.query(
            `UPDATE mensajes_chat SET leido = 1 
             WHERE receptor_id = ? AND emisor_id = ? AND leido = 0`,
            [receptorId, emisorId]
        );
        return result.affectedRows;
    },

    /**
     * Contar mensajes no leídos de un usuario
     */
    async countNoLeidos(usuarioId) {
        const [rows] = await pool.query(
            'SELECT COUNT(*) as total FROM mensajes_chat WHERE receptor_id = ? AND leido = 0',
            [usuarioId]
        );
        return rows[0].total;
    },

    /**
     * Obtener lista de contactos con último mensaje (para entrenadores)
     */
    async getContactos(userId) {
        const [rows] = await pool.query(
            `SELECT 
                u.id as contacto_id,
                u.nombre as contacto_nombre,
                u.correo as contacto_correo,
                u.rol as contacto_rol,
                (SELECT mensaje FROM mensajes_chat mc2 
                 WHERE (mc2.emisor_id = u.id AND mc2.receptor_id = ?) 
                    OR (mc2.emisor_id = ? AND mc2.receptor_id = u.id)
                 ORDER BY mc2.created_at DESC LIMIT 1) as ultimo_mensaje,
                (SELECT created_at FROM mensajes_chat mc3 
                 WHERE (mc3.emisor_id = u.id AND mc3.receptor_id = ?) 
                    OR (mc3.emisor_id = ? AND mc3.receptor_id = u.id)
                 ORDER BY mc3.created_at DESC LIMIT 1) as ultimo_mensaje_fecha,
                (SELECT COUNT(*) FROM mensajes_chat mc4 
                 WHERE mc4.emisor_id = u.id AND mc4.receptor_id = ? AND mc4.leido = 0) as no_leidos
             FROM usuarios u
             WHERE u.id IN (
                 SELECT DISTINCT emisor_id FROM mensajes_chat WHERE receptor_id = ?
                 UNION
                 SELECT DISTINCT receptor_id FROM mensajes_chat WHERE emisor_id = ?
             )
             ORDER BY ultimo_mensaje_fecha DESC`,
            [userId, userId, userId, userId, userId, userId, userId]
        );
        return rows;
    },

    /**
     * Obtener entrenadores disponibles para un cliente 
     * (entrenadores que tienen rutinas asignadas al cliente)
     */
    async getEntrenadoresDeCliente(clienteId) {
        const [rows] = await pool.query(
            `SELECT DISTINCT u.id, u.nombre, u.correo
             FROM usuarios u
             JOIN rutinas r ON r.entrenador_id = u.id
             WHERE r.usuario_id = ? AND u.rol = 'entrenador'
             ORDER BY u.nombre`,
            [clienteId]
        );
        return rows;
    },

    /**
     * Obtener clientes Premium que tienen conversación con un entrenador
     * o clientes Premium asignados
     */
    async getClientesPremiumDeEntrenador(entrenadorId) {
        const [rows] = await pool.query(
            `SELECT DISTINCT u.id, u.nombre, u.correo,
                (SELECT COUNT(*) FROM mensajes_chat mc 
                 WHERE mc.emisor_id = u.id AND mc.receptor_id = ? AND mc.leido = 0) as no_leidos,
                (SELECT mc2.mensaje FROM mensajes_chat mc2 
                 WHERE (mc2.emisor_id = u.id AND mc2.receptor_id = ?) 
                    OR (mc2.emisor_id = ? AND mc2.receptor_id = u.id)
                 ORDER BY mc2.created_at DESC LIMIT 1) as ultimo_mensaje,
                (SELECT mc3.created_at FROM mensajes_chat mc3 
                 WHERE (mc3.emisor_id = u.id AND mc3.receptor_id = ?) 
                    OR (mc3.emisor_id = ? AND mc3.receptor_id = u.id)
                 ORDER BY mc3.created_at DESC LIMIT 1) as ultimo_mensaje_fecha
             FROM usuarios u
             JOIN usuario_membresia um ON um.usuario_id = u.id
             JOIN membresias m ON um.membresia_id = m.id
             WHERE u.rol = 'cliente' 
               AND m.tipo = 'premium' 
               AND um.estado = 'activa'
               AND um.fecha_fin >= CURDATE()
               AND (u.id IN (SELECT DISTINCT usuario_id FROM rutinas WHERE entrenador_id = ?)
                    OR u.id IN (SELECT DISTINCT emisor_id FROM mensajes_chat WHERE receptor_id = ?)
                    OR u.id IN (SELECT DISTINCT receptor_id FROM mensajes_chat WHERE emisor_id = ?))
             ORDER BY ultimo_mensaje_fecha DESC, u.nombre ASC`,
            [entrenadorId, entrenadorId, entrenadorId, entrenadorId, entrenadorId, entrenadorId, entrenadorId, entrenadorId]
        );
        return rows;
    }
};

module.exports = MensajeChat;
