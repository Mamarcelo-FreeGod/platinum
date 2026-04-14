/**
 * Rutas del Administrador
 * Protegidas con middleware isAdmin
 */
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { isAuthenticated, isAdmin } = require('../middlewares/auth');

// Aplicar middlewares a todas las rutas
router.use(isAuthenticated, isAdmin);

// Dashboard
router.get('/dashboard', adminController.dashboard);

// CRUD Usuarios
router.get('/usuarios', adminController.usuarios);
router.get('/usuarios/crear', adminController.showCrearUsuario);
router.post('/usuarios/crear', adminController.crearUsuario);
router.get('/usuarios/editar/:id', adminController.showEditarUsuario);
router.post('/usuarios/editar/:id', adminController.actualizarUsuario);
router.get('/usuarios/eliminar/:id', adminController.eliminarUsuario);

// Crear Entrenador
router.get('/entrenadores/crear', adminController.showCrearEntrenador);
router.post('/entrenadores/crear', adminController.crearEntrenador);

// Membresías (solo ver y editar — NO crear ni eliminar)
router.get('/membresias', adminController.membresias);
router.get('/membresias/editar/:id', adminController.showEditarMembresia);
router.post('/membresias/editar/:id', adminController.actualizarMembresia);

// Solicitudes
router.get('/solicitudes', adminController.solicitudes);
router.get('/solicitudes/aprobar/:id', adminController.aprobarSolicitud);
router.get('/solicitudes/rechazar/:id', adminController.rechazarSolicitud);

// Reportes
router.get('/reportes', adminController.reportes);

module.exports = router;
