/**
 * Rutas de Autenticación
 */
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

<<<<<<< HEAD
=======
// --- AGREGA ESTO AQUÍ ---
// Redirigir la raíz al login
router.get('/', (req, res) => {
    res.redirect('/login');
});
// ------------------------

>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
// Login
router.get('/login', authController.showLogin);
router.post('/login', authController.login);

// Registro
router.get('/registro', authController.showRegistro);
router.post('/registro', authController.registro);

// Logout
router.get('/logout', authController.logout);

module.exports = router;
