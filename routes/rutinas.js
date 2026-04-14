/**
 * Rutas de Rutinas Predefinidas
 * Accesibles para todos los usuarios autenticados con membresía activa
 */
const express = require('express');
const router = express.Router();
const rutinasController = require('../controllers/rutinasController');
const { isAuthenticated, tieneMembresiaActiva } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y membresía activa
router.use(isAuthenticated, tieneMembresiaActiva);

// Listado de rutinas predefinidas
router.get('/', rutinasController.index);

// Detalle de rutina por tipo
router.get('/:tipo', rutinasController.detalle);

module.exports = router;

