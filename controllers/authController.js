/**
 * Controlador de Autenticación
 * Maneja login, registro y logout
 */
const Usuario = require('../models/Usuario');

const authController = {
    /**
     * Mostrar formulario de login
     */
    showLogin(req, res) {
        // Solo redirigimos si el usuario YA tiene una sesión activa y válida
        if (req.session && req.session.user && req.session.user.rol) {
            return redirectByRole(req, res);
        }
        // De lo contrario, renderizamos la vista de login tranquilamente
        res.render('auth/login', { 
            title: 'Iniciar Sesión',
            // Agregamos esto para evitar errores si usas mensajes flash
            messages: req.flash() 
        });
    },

    /**
     * Procesar login
     */
    async login(req, res) {
        try {
            const { correo, password } = req.body;

            if (!correo || !password) {
                req.flash('error', 'Todos los campos son obligatorios');
                return res.redirect('/login');
            }

            const usuario = await Usuario.findByEmail(correo);
            
            // Si el usuario no existe o la contraseña no coincide
            if (!usuario || !(await Usuario.comparePassword(password, usuario.password))) {
                req.flash('error', 'Correo o contraseña incorrectos');
                return res.redirect('/login');
            }

            if (!usuario.activo) {
                req.flash('error', 'Tu cuenta ha sido desactivada');
                return res.redirect('/login');
            }

            // Guardar sesión de forma segura
            req.session.user = {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            };

            // Guardamos explícitamente la sesión antes de redirigir para evitar fallos en Render
            req.session.save((err) => {
                if (err) {
                    console.error('Error al guardar sesión:', err);
                    return res.redirect('/login');
                }
                return redirectByRole(req, res);
            });

        } catch (error) {
            console.error('Error en login:', error);
            req.flash('error', 'Error interno del servidor');
            res.redirect('/login');
        }
    },

    /**
     * Mostrar formulario de registro
     */
    showRegistro(req, res) {
        if (req.session.user) {
            return redirectByRole(req, res);
        }
        res.render('auth/registro', { title: 'Registro' });
    },

    /**
     * Procesar registro
     */
    async registro(req, res) {
        try {
            const { nombre, correo, password, password2, telefono } = req.body;

            if (!nombre || !correo || !password || !password2) {
                req.flash('error', 'Todos los campos son obligatorios');
                return res.redirect('/registro');
            }

            if (password !== password2) {
                req.flash('error', 'Las contraseñas no coinciden');
                return res.redirect('/registro');
            }

            const existente = await Usuario.findByEmail(correo);
            if (existente) {
                req.flash('error', 'Este correo ya está registrado');
                return res.redirect('/registro');
            }

            await Usuario.create({
                nombre,
                correo,
                password,
                telefono,
                rol: 'cliente'
            });

            req.flash('success', '¡Registro exitoso! Ya puedes iniciar sesión');
            res.redirect('/login');

        } catch (error) {
            console.error('Error en registro:', error);
            req.flash('error', 'Error al crear la cuenta');
            res.redirect('/registro');
        }
    },

    /**
     * Cerrar sesión
     */
    logout(req, res) {
        req.session.destroy((err) => {
            if (err) console.error('Error al cerrar sesión:', err);
            res.clearCookie('connect.sid'); // Limpia la cookie del navegador
            res.redirect('/login');
        });
    }
};

/**
 * Redirige al dashboard según el rol del usuario
 */
function redirectByRole(req, res) {
    const rol = req.session.user.rol;
    
    // Verificamos que el rol exista para no redirigir a una ruta indefinida
    const routes = {
        'admin': '/admin/dashboard',
        'entrenador': '/entrenador/dashboard',
        'cliente': '/cliente/dashboard'
    };

    const target = routes[rol] || '/login';
    return res.redirect(target);
}

module.exports = authController;
