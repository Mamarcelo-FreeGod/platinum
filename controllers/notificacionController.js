/**
 * Controlador de Notificaciones
 * Gestión de notificaciones del usuario logueado
 */
const Notificacion = require('../models/Notificacion');

const notificacionController = {
    /**
     * Listar notificaciones del usuario
     */
    async index(req, res) {
        try {
            const userId = req.session.user.id;
            const notificaciones = await Notificacion.getByUsuarioId(userId);

            res.render('notificaciones/index', {
                title: 'Mis Notificaciones',
                notificaciones
            });
        } catch (error) {
            console.error('Error al cargar notificaciones:', error);
            req.flash('error', 'Error al cargar las notificaciones');
            res.redirect('/');
        }
    },

    /**
     * Marcar una notificación como leída
     */
    async marcarLeida(req, res) {
        try {
            await Notificacion.marcarLeida(req.params.id);
            res.redirect('/notificaciones');
        } catch (error) {
            console.error('Error al marcar notificación:', error);
            req.flash('error', 'Error al actualizar la notificación');
            res.redirect('/notificaciones');
        }
    },

    /**
     * Marcar todas como leídas (página completa)
     */
    async marcarTodas(req, res) {
        try {
            const userId = req.session.user.id;
            await Notificacion.marcarTodasLeidas(userId);
            req.flash('success', 'Todas las notificaciones marcadas como leídas');
            res.redirect('/notificaciones');
        } catch (error) {
            console.error('Error al marcar notificaciones:', error);
            req.flash('error', 'Error al actualizar las notificaciones');
            res.redirect('/notificaciones');
        }
    },

    /**
     * Marcar todas como leídas — API JSON (para AJAX desde la campana del navbar)
     */
    async marcarTodasAPI(req, res) {
        try {
            const userId = req.session.user.id;
            await Notificacion.marcarTodasLeidas(userId);
            res.json({ ok: true });
        } catch (error) {
            console.error('Error al marcar notificaciones (API):', error);
            res.json({ ok: false, error: error.message });
        }
    }
};

module.exports = notificacionController;
