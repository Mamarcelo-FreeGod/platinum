/**
 * GYM PLATINUM - Aplicación Principal (Versión para Render)
 * Sistema de gestión para gimnasio
 */
require('dotenv').config();
const express = require('express');
const session = require('express-session');
const flash = require('connect-flash');
const path = require('path');

const app = express();

// 1. CONFIGURACIÓN PARA RENDER (¡IMPORTANTE!)
// Esto permite que las cookies de sesión funcionen correctamente a través del proxy de Render
app.set('trust proxy', 1);

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
        secure: true, // Cambiado a true porque Render usa HTTPS
        sameSite: 'lax',
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

    if (req.session.user) {
        try {
            const Notificacion = require('./models/Notificacion');
            res.locals.notificacionesNoLeidas = await Notificacion.countNoLeidas(req.session.user.id);
            res.locals.ultimasNotificaciones = await Notificacion.getUltimas(req.session.user.id, 5);
        } catch (e) {
            res.locals.notificacionesNoLeidas = 0;
            res.locals.ultimasNotificaciones = [];
        }

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

// Las rutas hijas primero
app.use('/cliente', clienteRoutes);
app.use('/admin', adminRoutes);
app.use('/entrenador', entrenadorRoutes);
app.use('/notificaciones', notificacionRoutes);
app.use('/rutinas', rutinasRoutes);

// El authRoutes manejará la raíz '/' y el '/login' internamente
app.use('/', authRoutes);

// ELIMINADO: app.get('/') que redireccionaba a /login. 
// Ahora authRoutes debe encargarse de decidir qué mostrar en la raíz.

// 404
app.use((req, res) => {
    res.status(404).render('404', { title: 'Página no encontrada' });
});

// ==================== INICIAR SERVIDOR ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
});