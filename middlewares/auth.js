/**
 * Middlewares de autenticación y autorización
 * Protegen rutas según sesión, rol y tipo de membresía del usuario
 */
const Membresia = require('../models/Membresia');

/**
 * Verifica que el usuario tenga sesión activa
 */
const isAuthenticated = (req, res, next) => {
    if (req.session.user) {
        return next();
    }
    req.flash('error', 'Debes iniciar sesión para acceder');
    res.redirect('/login');
};

/**
 * Verifica que el usuario sea administrador
 */
const isAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'admin') {
        return next();
    }
    req.flash('error', 'No tienes permisos para acceder a esta sección');
    res.redirect('/login');
};

/**
 * Verifica que el usuario sea entrenador
 */
const isEntrenador = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'entrenador') {
        return next();
    }
    req.flash('error', 'No tienes permisos para acceder a esta sección');
    res.redirect('/login');
};

/**
 * Verifica que el usuario sea cliente
 */
const isCliente = (req, res, next) => {
    if (req.session.user && req.session.user.rol === 'cliente') {
        return next();
    }
    req.flash('error', 'No tienes permisos para acceder a esta sección');
    res.redirect('/login');
};

/**
 * Verifica que el usuario sea admin o entrenador
 */
const isAdminOrEntrenador = (req, res, next) => {
    if (req.session.user && (req.session.user.rol === 'admin' || req.session.user.rol === 'entrenador')) {
        return next();
    }
    req.flash('error', 'No tienes permisos para acceder a esta sección');
    res.redirect('/login');
};

/**
 * Verifica que el cliente tenga una membresía activa y vigente
 * Admins y entrenadores pasan automáticamente
 */
const tieneMembresiaActiva = async (req, res, next) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Debes iniciar sesión para acceder');
            return res.redirect('/login');
        }

        // Admins y entrenadores no necesitan membresía
        if (req.session.user.rol === 'admin' || req.session.user.rol === 'entrenador') {
            return next();
        }

        const tieneMembresia = await Membresia.tieneMembresiaActiva(req.session.user.id);
        if (tieneMembresia) {
            return next();
        }

        req.flash('error', 'Debes tener una membresía activa para acceder a las rutinas');
        return res.redirect('/cliente/membresia');
    } catch (error) {
        console.error('Error al verificar membresía:', error);
        req.flash('error', 'Error al verificar tu membresía');
        return res.redirect('/cliente/dashboard');
    }
};

/**
 * Carga el tipo de membresía del usuario en req y res.locals
 * Para usar en vistas y controladores
 */
const cargarTipoMembresia = async (req, res, next) => {
    try {
        if (req.session.user && req.session.user.rol === 'cliente') {
            const tipo = await Membresia.getTipoByUsuarioId(req.session.user.id);
            req.tipoMembresia = tipo; // 'basica', 'plus', 'premium' o null
            res.locals.tipoMembresia = tipo;
        } else {
            // Admins y entrenadores tienen acceso completo
            req.tipoMembresia = 'premium';
            res.locals.tipoMembresia = 'premium';
        }
        next();
    } catch (error) {
        console.error('Error al cargar tipo de membresía:', error);
        req.tipoMembresia = null;
        res.locals.tipoMembresia = null;
        next();
    }
};

/**
 * Middleware: Solo permite acceso a usuarios con plan Plus o Premium
 */
const soloPlus = async (req, res, next) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Debes iniciar sesión para acceder');
            return res.redirect('/login');
        }

        // Admins y entrenadores pasan siempre
        if (req.session.user.rol === 'admin' || req.session.user.rol === 'entrenador') {
            return next();
        }

        const tipo = req.tipoMembresia || await Membresia.getTipoByUsuarioId(req.session.user.id);

        if (tipo === 'plus' || tipo === 'premium') {
            return next();
        }

        req.flash('error', 'Esta función requiere un plan Plus o Premium. ¡Mejora tu membresía!');
        return res.redirect('/cliente/membresia');
    } catch (error) {
        console.error('Error en middleware soloPlus:', error);
        req.flash('error', 'Error al verificar tu plan');
        return res.redirect('/cliente/dashboard');
    }
};

/**
 * Middleware: Solo permite acceso a usuarios con plan Premium
 */
const soloPremium = async (req, res, next) => {
    try {
        if (!req.session.user) {
            req.flash('error', 'Debes iniciar sesión para acceder');
            return res.redirect('/login');
        }

        // Admins y entrenadores pasan siempre
        if (req.session.user.rol === 'admin' || req.session.user.rol === 'entrenador') {
            return next();
        }

        const tipo = req.tipoMembresia || await Membresia.getTipoByUsuarioId(req.session.user.id);

        if (tipo === 'premium') {
            return next();
        }

        req.flash('error', 'Esta función es exclusiva del plan Premium. ¡Mejora tu membresía!');
        return res.redirect('/cliente/membresia');
    } catch (error) {
        console.error('Error en middleware soloPremium:', error);
        req.flash('error', 'Error al verificar tu plan');
        return res.redirect('/cliente/dashboard');
    }
};

module.exports = {
    isAuthenticated,
    isAdmin,
    isEntrenador,
    isCliente,
    isAdminOrEntrenador,
    tieneMembresiaActiva,
    cargarTipoMembresia,
    soloPlus,
    soloPremium
};
