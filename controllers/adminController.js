/**
 * Controlador del Administrador
 * Dashboard, CRUD usuarios, membresías (solo editar las 3 existentes), reportes, solicitudes
 */
const Usuario = require('../models/Usuario');
const Membresia = require('../models/Membresia');
const Pago = require('../models/Pago');
const SolicitudMembresia = require('../models/SolicitudMembresia');
const Notificacion = require('../models/Notificacion');

const adminController = {
    // ==================== DASHBOARD ====================

    async dashboard(req, res) {
        try {
            const totalClientes = await Usuario.countByRole('cliente');
            const totalEntrenadores = await Usuario.countByRole('entrenador');
            const membresiasActivas = await Membresia.countActivas();
            const ingresosMes = await Pago.getIngresosMes();
            const totalIngresos = await Pago.getTotalIngresos();
            const solicitudesPendientes = await SolicitudMembresia.countPendientes();

            res.render('admin/dashboard', {
                title: 'Panel de Administración',
                totalClientes,
                totalEntrenadores,
                membresiasActivas,
                ingresosMes,
                totalIngresos,
                solicitudesPendientes
            });
        } catch (error) {
            console.error('Error en dashboard admin:', error);
            req.flash('error', 'Error al cargar el dashboard');
            res.redirect('/');
        }
    },

    // ==================== CRUD USUARIOS ====================

    async usuarios(req, res) {
        try {
            const usuarios = await Usuario.getAll();
            res.render('admin/usuarios', {
                title: 'Gestión de Usuarios',
                usuarios
            });
        } catch (error) {
            console.error('Error al listar usuarios:', error);
            req.flash('error', 'Error al cargar los usuarios');
            res.redirect('/admin/dashboard');
        }
    },

    showCrearUsuario(req, res) {
        res.render('admin/usuario-form', {
            title: 'Nuevo Usuario',
            usuario: null,
            editing: false
        });
    },

    async crearUsuario(req, res) {
        try {
            const { nombre, correo, password, telefono, rol } = req.body;

            if (!nombre || !correo || !password) {
                req.flash('error', 'Nombre, correo y contraseña son obligatorios');
                return res.redirect('/admin/usuarios/crear');
            }

            const existente = await Usuario.findByEmail(correo);
            if (existente) {
                req.flash('error', 'Este correo ya está registrado');
                return res.redirect('/admin/usuarios/crear');
            }

            await Usuario.create({ nombre, correo, password, telefono, rol });
            req.flash('success', 'Usuario creado exitosamente');
            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al crear usuario:', error);
            req.flash('error', 'Error al crear el usuario');
            res.redirect('/admin/usuarios/crear');
        }
    },

    async showEditarUsuario(req, res) {
        try {
            const usuario = await Usuario.findById(req.params.id);
            if (!usuario) {
                req.flash('error', 'Usuario no encontrado');
                return res.redirect('/admin/usuarios');
            }
            res.render('admin/usuario-form', {
                title: 'Editar Usuario',
                usuario,
                editing: true
            });
        } catch (error) {
            console.error('Error al cargar usuario:', error);
            req.flash('error', 'Error al cargar el usuario');
            res.redirect('/admin/usuarios');
        }
    },

    async actualizarUsuario(req, res) {
        try {
            const { nombre, correo, password, telefono, rol, activo } = req.body;
            await Usuario.update(req.params.id, {
                nombre, correo, password, telefono, rol,
                activo: activo ? 1 : 0
            });
            req.flash('success', 'Usuario actualizado exitosamente');
            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al actualizar usuario:', error);
            req.flash('error', 'Error al actualizar el usuario');
            res.redirect('/admin/usuarios');
        }
    },

    async eliminarUsuario(req, res) {
        try {
            await Usuario.delete(req.params.id);
            req.flash('success', 'Usuario eliminado exitosamente');
            res.redirect('/admin/usuarios');
        } catch (error) {
            console.error('Error al eliminar usuario:', error);
            req.flash('error', 'Error al eliminar el usuario');
            res.redirect('/admin/usuarios');
        }
    },

    // ==================== CREAR ENTRENADOR ====================

    showCrearEntrenador(req, res) {
        res.render('admin/entrenador-form', {
            title: 'Crear Entrenador'
        });
    },

    async crearEntrenador(req, res) {
        try {
            const { nombre, correo, password, telefono } = req.body;

            if (!nombre || !correo || !password) {
                req.flash('error', 'Nombre, correo y contraseña son obligatorios');
                return res.redirect('/admin/entrenadores/crear');
            }

            const existente = await Usuario.findByEmail(correo);
            if (existente) {
                req.flash('error', 'Este correo ya está registrado');
                return res.redirect('/admin/entrenadores/crear');
            }

            await Usuario.create({ nombre, correo, password, telefono, rol: 'entrenador' });
            req.flash('success', 'Entrenador creado exitosamente');
            res.redirect('/admin/dashboard');
        } catch (error) {
            console.error('Error al crear entrenador:', error);
            req.flash('error', 'Error al crear el entrenador');
            res.redirect('/admin/entrenadores/crear');
        }
    },

    // ==================== GESTIÓN DE MEMBRESÍAS ====================
    // Solo existen 3 membresías: Básica, Plus, Premium
    // El admin puede editar precio, duración, descripción y estado
    // NO puede crear nuevas ni eliminar las existentes

    async membresias(req, res) {
        try {
            const membresias = await Membresia.getAll();
            res.render('admin/membresias', {
                title: 'Gestión de Membresías',
                membresias
            });
        } catch (error) {
            console.error('Error al listar membresías:', error);
            req.flash('error', 'Error al cargar las membresías');
            res.redirect('/admin/dashboard');
        }
    },

    async showEditarMembresia(req, res) {
        try {
            const membresia = await Membresia.findById(req.params.id);
            if (!membresia) {
                req.flash('error', 'Membresía no encontrada');
                return res.redirect('/admin/membresias');
            }
            res.render('admin/membresia-form', {
                title: `Editar Membresía - ${membresia.nombre}`,
                membresia,
                editing: true
            });
        } catch (error) {
            console.error('Error al cargar membresía:', error);
            req.flash('error', 'Error al cargar la membresía');
            res.redirect('/admin/membresias');
        }
    },

    async actualizarMembresia(req, res) {
        try {
            const { nombre, descripcion, precio, duracion, activa } = req.body;

            // El tipo NO se puede cambiar — se ignora cualquier valor enviado
            await Membresia.update(req.params.id, {
                nombre, descripcion, precio, duracion,
                activa: activa ? 1 : 0
            });
            req.flash('success', 'Membresía actualizada exitosamente');
            res.redirect('/admin/membresias');
        } catch (error) {
            console.error('Error al actualizar membresía:', error);
            req.flash('error', 'Error al actualizar la membresía');
            res.redirect('/admin/membresias');
        }
    },

    // ==================== SOLICITUDES ====================

    async solicitudes(req, res) {
        try {
            const solicitudes = await SolicitudMembresia.getAll();
            res.render('admin/solicitudes', {
                title: 'Solicitudes de Membresía',
                solicitudes
            });
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
            req.flash('error', 'Error al cargar las solicitudes');
            res.redirect('/admin/dashboard');
        }
    },

    async aprobarSolicitud(req, res) {
        try {
            const solicitud = await SolicitudMembresia.findById(req.params.id);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/admin/solicitudes');
            }

            // Actualizar estado
            await SolicitudMembresia.updateEstado(solicitud.id, 'aceptada');

            // Activar membresía (desactiva las anteriores automáticamente)
            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + solicitud.membresia_duracion);

            await Membresia.asignarAUsuario(
                solicitud.usuario_id,
                solicitud.membresia_id,
                fechaInicio.toISOString().split('T')[0],
                fechaFin.toISOString().split('T')[0]
            );

            // Crear pago
            await Pago.create({
                usuario_id: solicitud.usuario_id,
                membresia_id: solicitud.membresia_id,
                monto: solicitud.membresia_precio,
                metodo_pago: solicitud.metodo_pago,
                fecha: new Date().toISOString().split('T')[0],
                estado: 'pagado'
            });

            // Notificar al cliente
            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: `¡Tu solicitud de membresía "${solicitud.membresia_nombre}" ha sido aprobada! Ya está activa.`
            });

            req.flash('success', 'Solicitud aprobada exitosamente');
            res.redirect('/admin/solicitudes');
        } catch (error) {
            console.error('Error al aprobar solicitud:', error);
            req.flash('error', 'Error al aprobar la solicitud');
            res.redirect('/admin/solicitudes');
        }
    },

    async rechazarSolicitud(req, res) {
        try {
            const solicitud = await SolicitudMembresia.findById(req.params.id);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/admin/solicitudes');
            }

            await SolicitudMembresia.updateEstado(solicitud.id, 'rechazada');

            // Notificar al cliente
            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: `Tu solicitud de membresía "${solicitud.membresia_nombre}" ha sido rechazada. Contacta al administrador para más información.`
            });

            req.flash('success', 'Solicitud rechazada');
            res.redirect('/admin/solicitudes');
        } catch (error) {
            console.error('Error al rechazar solicitud:', error);
            req.flash('error', 'Error al rechazar la solicitud');
            res.redirect('/admin/solicitudes');
        }
    },

    // ==================== REPORTES ====================

    async reportes(req, res) {
        try {
            const totalClientes = await Usuario.countByRole('cliente');
            const totalEntrenadores = await Usuario.countByRole('entrenador');
            const membresiasActivas = await Membresia.countActivas();
            const totalIngresos = await Pago.getTotalIngresos();
            const ingresosMes = await Pago.getIngresosMes();
            const pagos = await Pago.getAll();
            const ingresosPorMetodo = await Pago.getIngresosPorMetodo();
            const ingresosMensuales = await Pago.getIngresosMensuales();

            res.render('admin/reportes', {
                title: 'Reportes',
                totalClientes,
                totalEntrenadores,
                membresiasActivas,
                totalIngresos,
                ingresosMes,
                pagos,
                ingresosPorMetodo,
                ingresosMensuales
            });
        } catch (error) {
            console.error('Error al cargar reportes:', error);
            req.flash('error', 'Error al cargar los reportes');
            res.redirect('/admin/dashboard');
        }
    }
};

module.exports = adminController;
