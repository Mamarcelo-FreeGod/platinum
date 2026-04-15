/**
 * Rutas del Entrenador
 * Protegidas con middleware isEntrenador
 * v3.0: Rutas de chat con clientes Premium
 */
const express = require('express');
const router = express.Router();
const entrenadorController = require('../controllers/entrenadorController');
const { isAuthenticated, isEntrenador } = require('../middlewares/auth');
const upload = require('../config/multerConfig');
const multer = require('multer');
const path = require('path');

const storageGifs = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/gifs'); // Asegúrate de que esta carpeta exista
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const uploadGifs = multer({ storage: storageGifs });
// Aplicar middlewares a todas las rutas
router.use(isAuthenticated, isEntrenador);

// Dashboard
router.get('/dashboard', entrenadorController.dashboard);

// Clientes (removido, se usa Clientes Personalizados)

// Rutinas - ahora muestra lista de clientes con rutinas
router.get('/rutinas', entrenadorController.rutinas);
router.get('/rutinas/crear', entrenadorController.showCrearRutina);
router.post('/rutinas/crear', uploadGifs.any(), entrenadorController.crearRutina);
router.get('/rutinas/cliente/:id/crear', entrenadorController.crearRutinaCliente);
router.get('/rutinas/cliente/:id', entrenadorController.rutinasCliente);
router.get('/rutinas/editar/:id', entrenadorController.getEditarRutina);
router.post('/rutinas/editar/:id', uploadGifs.any(), entrenadorController.postEditarRutina);
router.get('/rutinas/eliminar/:id', entrenadorController.eliminarRutina);
router.get('/rutinas/:id', entrenadorController.verRutinaDetalle);
// Solicitudes de membresía
router.get('/solicitudes', entrenadorController.solicitudes);
router.get('/solicitudes/aprobar/:id', entrenadorController.aprobarSolicitud);
router.get('/solicitudes/rechazar/:id', entrenadorController.rechazarSolicitud);

// Solicitudes de rutina personalizada
router.get('/solicitudes-rutina', entrenadorController.solicitudesRutina);
router.get('/solicitudes-rutina/aceptar/:id', entrenadorController.aceptarSolicitudRutina);
router.get('/solicitudes-rutina/rechazar/:id', entrenadorController.rechazarSolicitudRutina);

// Clientes personalizados
router.get('/clientes-personalizados', entrenadorController.clientesPersonalizados);
router.get('/rutina-personalizada/crear/:clienteId', entrenadorController.showCrearRutinaPersonalizada);
router.post('/rutina-personalizada/crear/:clienteId', upload.array('media_ejercicio', 20), entrenadorController.crearRutinaPersonalizada);

// Seguimiento de clientes Premium
router.get('/seguimiento', entrenadorController.seguimiento);
router.get('/seguimiento/:clienteId', entrenadorController.seguimientoCliente);
router.post('/seguimiento/comentar', entrenadorController.comentarProgreso);
router.post('/progreso/editar-peso', entrenadorController.editarPesoCliente);
router.post('/progreso/feedback/:id', entrenadorController.postFeedbackProgreso);

// Chat con clientes Premium (v3.0)
router.get('/chat', entrenadorController.getChat);
router.post('/chat/send', entrenadorController.sendMessage);

module.exports = router;
