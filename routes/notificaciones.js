/**
 * Rutas de Notificaciones
 * Accesible para cualquier usuario autenticado
 */
const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { isAuthenticated } = require('../middlewares/auth');

// Todas las rutas requieren autenticación
router.use(isAuthenticated);

// Listar notificaciones
router.get('/', notificacionController.index);

// Marcar una como leída
router.get('/leida/:id', notificacionController.marcarLeida);

// Marcar todas como leídas (redirect)
router.get('/leer-todas', notificacionController.marcarTodas);

// Marcar todas como leídas — API JSON (para AJAX desde la campana del navbar)
router.post('/marcar-leidas', notificacionController.marcarTodasAPI);

module.exports = router;
