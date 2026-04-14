/**
 * Rutas del Cliente
 * Protegidas con middleware isCliente
 * v3.0: Rutas de progreso avanzado, calendario y chat
 */
const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');
const { isAuthenticated, isCliente, tieneMembresiaActiva, soloPlus, soloPremium } = require('../middlewares/auth');

// Aplicar middlewares a todas las rutas
router.use(isAuthenticated, isCliente);

// Dashboard
router.get('/dashboard', clienteController.dashboard);

// Perfil
router.get('/perfil', clienteController.perfil);
router.post('/perfil', clienteController.updatePerfil);

// Membresía
router.get('/membresia', clienteController.membresia);
router.post('/membresia/solicitar', clienteController.solicitarMembresia);

// Rutinas (requiere membresía activa)
router.get('/rutinas', tieneMembresiaActiva, clienteController.getRutinas);
router.get('/rutinas/semana/:semana', tieneMembresiaActiva, clienteController.getRutinaSemana);
router.post('/rutinas/toggle-dia', tieneMembresiaActiva, clienteController.toggleDia);
router.get('/rutinas/detalle/:id', tieneMembresiaActiva, clienteController.getRutinaDetalle);

// Solicitar rutina personalizada (requiere Plus o Premium)
router.get('/solicitar-rutina', soloPlus, clienteController.showSolicitarRutina);
router.post('/solicitar-rutina', soloPlus, clienteController.solicitarRutina);

// Pagos
router.get('/pagos', clienteController.pagos);

// Progreso (Solo Premium)
router.get('/progreso', soloPremium, clienteController.getProgreso);
router.post('/progreso', soloPremium, clienteController.saveProgreso);
router.post('/progreso/log', soloPremium, clienteController.logEntrenamiento);
router.post('/progreso/log-semana', soloPremium, clienteController.logEntrenamientoSemana);
router.post('/progreso/toggle', soloPremium, clienteController.toggleEntrenamiento);
router.get('/progreso/calendario/:year/:month', soloPremium, clienteController.getCalendarioAPI);

// Chat (Solo Premium)
router.get('/chat', soloPremium, clienteController.getChat);
router.post('/chat/send', soloPremium, clienteController.sendMessage);

module.exports = router;
