/**
 * Rutas de Autenticación
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Login
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Registro
router.get('/registro', authController.showRegistro);
router.post('/registro', authController.registro);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
