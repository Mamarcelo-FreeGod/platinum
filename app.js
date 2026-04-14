/**
 * GYM PLATINUM - Aplicación Principal
 * Sistema de gestión para gimnasio
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// ==================== CONFIGURACIÓN ====================

// Motor de vistas Pug
app.set('view engine', 'pug');
app.set('views', path.join(__dirname, 'views'));

// Parsear body de formularios
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Archivos estáticos
app.use(express.static(path.join(__dirname, 'public')));

// Sesiones
app.use(session({
    secret: process.env.SESSION_SECRET || 'gym_platinum_secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24 // 24 horas
    }
}));

// Flash messages
app.use(flash());

// Variables globales para las vistas
app.use(async (req, res, next) => {
    res.locals.user = req.session.user || null;
    res.locals.success_msg = req.flash('success');
    res.locals.error_msg = req.flash('error');

    // Notificaciones para navbar si hay sesión
    if (req.session.user) {
        try {
            const Notificacion = require('./models/Notificacion');
            res.locals.notificacionesNoLeidas = await Notificacion.countNoLeidas(req.session.user.id);
            res.locals.ultimasNotificaciones = await Notificacion.getUltimas(req.session.user.id, 5);
        } catch (e) {
            res.locals.notificacionesNoLeidas = 0;
            res.locals.ultimasNotificaciones = [];
        }

        // Cargar tipo de membresía para clientes
        if (req.session.user.rol === 'cliente') {
            try {
                const Membresia = require('./models/Membresia');
                const tipo = await Membresia.getTipoByUsuarioId(req.session.user.id);
                req.tipoMembresia = tipo;
                res.locals.tipoMembresia = tipo;
            } catch (e) {
                req.tipoMembresia = null;
                res.locals.tipoMembresia = null;
            }
        } else {
            // Admins y entrenadores tienen acceso completo
            req.tipoMembresia = 'premium';
            res.locals.tipoMembresia = 'premium';
        }
    } else {
        res.locals.notificacionesNoLeidas = 0;
        res.locals.ultimasNotificaciones = [];
        req.tipoMembresia = null;
        res.locals.tipoMembresia = null;
    }
    next();
});

// ==================== RUTAS ====================
const authRoutes = require('./routes/auth');
const clienteRoutes = require('./routes/cliente');
const adminRoutes = require('./routes/admin');
const entrenadorRoutes = require('./routes/entrenador');
const notificacionRoutes = require('./routes/notificaciones');
const rutinasRoutes = require('./routes/rutinas');

app.use('/', authRoutes);
app.use('/cliente', clienteRoutes);
app.use('/admin', adminRoutes);
app.use('/entrenador', entrenadorRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/rutinas', rutinasRoutes);

// Ruta raíz
app.get('/', (req, res) => {
    if (req.session.user) {
        const rol = req.session.user.rol;
        if (rol === 'admin') return res.redirect('/admin/dashboard');
        if (rol === 'entrenador') return res.redirect('/entrenador/dashboard');
        return res.redirect('/cliente/dashboard');
    }
    res.redirect('/login');
});

// 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página no encontrada' });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`
  ╔══════════════════════════════════════════╗
  ║       🏋️  GYM PLATINUM v2.1.0  🏋️        ║
  ║   Servidor corriendo en puerto ${PORT}       ║
  ║   http://localhost:${PORT}                  ║
  ╚══════════════════════════════════════════╝
  `);
});
