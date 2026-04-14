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
        if (req.session.user) {
            return redirectByRole(req, res);
        }
        res.render('auth/login', { title: 'Iniciar Sesión' });
    },

    /**
     * Procesar login
     */
    async login(req, res) {
        try {
            const { correo, password } = req.body;

            // Validar campos
            if (!correo || !password) {
                req.flash('error', 'Todos los campos son obligatorios');
                return res.redirect('/login');
            }

            // Buscar usuario
            const usuario = await Usuario.findByEmail(correo);
            if (!usuario) {
                req.flash('error', 'Correo o contraseña incorrectos');
                return res.redirect('/login');
            }

            // Verificar si está activo
            if (!usuario.activo) {
                req.flash('error', 'Tu cuenta ha sido desactivada. Contacta al administrador');
                return res.redirect('/login');
            }

            // Verificar contraseña
            const isMatch = await Usuario.comparePassword(password, usuario.password);
            if (!isMatch) {
                req.flash('error', 'Correo o contraseña incorrectos');
                return res.redirect('/login');
            }

            // Guardar sesión
            req.session.user = {
                id: usuario.id,
                nombre: usuario.nombre,
                correo: usuario.correo,
                rol: usuario.rol
            };

            // Redirigir según rol
            return redirectByRole(req, res);

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

            // Validaciones
            if (!nombre || !correo || !password || !password2) {
                req.flash('error', 'Todos los campos son obligatorios');
                return res.redirect('/registro');
            }

            if (password !== password2) {
                req.flash('error', 'Las contraseñas no coinciden');
                return res.redirect('/registro');
            }

            if (password.length < 6) {
                req.flash('error', 'La contraseña debe tener al menos 6 caracteres');
                return res.redirect('/registro');
            }

            // Verificar que el correo no existe
            const existente = await Usuario.findByEmail(correo);
            if (existente) {
                req.flash('error', 'Este correo electrónico ya está registrado');
                return res.redirect('/registro');
            }

            // Crear usuario (siempre como cliente)
            await Usuario.create({
                nombre,
                correo,
                password,
                telefono,
                rol: 'cliente'
            });

            req.flash('success', '¡Registro exitoso! Ahora puedes iniciar sesión');
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
            res.redirect('/login');
        });
    }
};

/**
 * Redirige al dashboard según el rol del usuario
 */
function redirectByRole(req, res) {
    const rol = req.session.user.rol;
    switch (rol) {
        case 'admin':
            return res.redirect('/admin/dashboard');
        case 'entrenador':
            return res.redirect('/entrenador/dashboard');
        default:
            return res.redirect('/cliente/dashboard');
    }
}

module.exports = authController;
