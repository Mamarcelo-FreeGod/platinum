/**
 * Controlador del Entrenador
 * Dashboard, clientes, rutinas, solicitudes de membresía y rutina personalizada
 * v3.0: Chat con clientes Premium, rutinas por día independientes
 */
const Usuario = require('../models/Usuario');
const Rutina = require('../models/Rutina');
const Asignacion = require('../models/Asignacion');
const SolicitudMembresia = require('../models/SolicitudMembresia');
const Membresia = require('../models/Membresia');
const Pago = require('../models/Pago');
const Notificacion = require('../models/Notificacion');
const SolicitudRutina = require('../models/SolicitudRutina');
const Progreso = require('../models/Progreso');
const MensajeChat = require('../models/MensajeChat');
const pool = require('../config/db');

/**
 * Procesa archivos de media subidos y los asigna a cada ejercicio por índice.
 * @param {Array} ejercicios - Array de objetos ejercicio parseados
 * @param {Array} files - req.files de multer (upload.array)
 * @returns {Array} ejercicios con campo media asignado
 */
function asignarMediaAEjercicios(ejercicios, files) {
    if (!files || files.length === 0) return ejercicios;
    return ejercicios.map(function(ej, index) {
        if (files[index]) {
            ej.media = '/img/rutinas-personalizadas/' + files[index].filename;
        }
        return ej;
    });
}

/**
 * Parsea ejercicios del body (JSON string) y asigna media de los archivos subidos
 */
function procesarEjerciciosConMedia(body, files) {
    var ejercicios = [];
    if (body.ejercicios) {
        try {
            ejercicios = typeof body.ejercicios === 'string'
                ? JSON.parse(body.ejercicios)
                : body.ejercicios;
        } catch (e) {
            ejercicios = [];
        }
    }
    if (ejercicios.length > 0 && files) {
        ejercicios = asignarMediaAEjercicios(ejercicios, files);
    }
    return ejercicios;
}

const entrenadorController = {
    // ==================== DASHBOARD ====================

    async dashboard(req, res) {
        try {
            const entrenadorId = req.session.user.id;
            const totalClientes = await Asignacion.countByEntrenador(entrenadorId);
            const totalRutinas = await Rutina.countByEntrenador(entrenadorId);
            const rutinas = await Rutina.getByEntrenadorId(entrenadorId);
            const solicitudesPendientes = await SolicitudMembresia.countPendientes();
            const solicitudesRutinaPendientes = await SolicitudRutina.countPendientes();

            // Chat: contar mensajes no leidos
            var chatNoLeidos = 0;
            try {
                chatNoLeidos = await MensajeChat.countNoLeidos(entrenadorId);
            } catch(e) {}

            res.render('entrenador/dashboard', {
                title: 'Panel de Entrenador',
                totalClientes,
                totalRutinas,
                solicitudesPendientes,
                solicitudesRutinaPendientes,
                ultimasRutinas: rutinas.slice(0, 5),
                chatNoLeidos
            });
        } catch (error) {
            console.error('Error en dashboard entrenador:', error);
            req.flash('error', 'Error al cargar el dashboard');
            res.redirect('/');
        }
    },

    // ==================== RUTINAS ====================

    /**
     * Mis Rutinas: Muestra TODOS los clientes personalizados (con aceptada),
     * aunque NO tengan rutinas asignadas todavía.
     */
    async rutinas(req, res) {
        try {
            const entrenadorId = req.session.user.id;

            // FIX: Base = clientes con solicitud aceptada (INNER JOIN solicitudes_rutina aceptadas)
            // LEFT JOIN con rutinas → aparecen aunque no tengan rutinas todavía
            // Subconsulta para traer solo la última solicitud aceptada de cada cliente
            const [clientes] = await pool.query(`
                SELECT u.id, u.nombre, u.correo,
                       sr.peso, sr.estatura, sr.sexo, sr.condicion,
                       COUNT(r.id) as total_rutinas
                FROM usuarios u
                INNER JOIN solicitudes_rutina sr
                    ON sr.usuario_id = u.id
                    AND sr.estado = 'aceptada'
                    AND sr.id = (
                        SELECT MAX(id) FROM solicitudes_rutina
                        WHERE usuario_id = u.id AND estado = 'aceptada'
                    )
                LEFT JOIN rutinas r
                    ON r.usuario_id = u.id AND r.entrenador_id = ?
                GROUP BY u.id, u.nombre, u.correo, sr.peso, sr.estatura, sr.sexo, sr.condicion
                ORDER BY u.nombre ASC
            `, [entrenadorId]);

            res.render('entrenador/rutinas', {
                title: 'Mis Rutinas',
                clientes
            });
        } catch (error) {
            console.error('Error al cargar rutinas:', error);
            req.flash('error', 'Error al cargar las rutinas');
            res.redirect('/entrenador/dashboard');
        }
    },

    /**
     * Ver rutinas de un cliente específico, organizadas por día
     */
    async rutinasCliente(req, res) {
        try {
            const clienteId = req.params.id;
            const entrenadorId = req.session.user.id;

            const cliente = await Usuario.findById(clienteId);
            if (!cliente) {
                req.flash('error', 'Cliente no encontrado');
                return res.redirect('/entrenador/rutinas');
            }

            // Obtener todas las rutinas de este cliente creadas por este entrenador
            const [rutinas] = await pool.query(`
                SELECT r.*
                FROM rutinas r
                WHERE r.usuario_id = ? AND r.entrenador_id = ?
                ORDER BY FIELD(r.dia_semana, 'Lunes','Martes','Miércoles','Jueves','Viernes','Sábado','Domingo'), r.created_at ASC
            `, [clienteId, entrenadorId]);

            // Parsear ejercicios JSON
            rutinas.forEach(function(r) {
                if (r.ejercicios) {
                    try {
                        if (typeof r.ejercicios === 'string') {
                            r.ejercicios = JSON.parse(r.ejercicios);
                        }
                    } catch (e) {
                        r.ejercicios = [];
                    }
                } else {
                    r.ejercicios = [];
                }
            });

            // Agrupar por semana (v5.5)
            const rutinasAgrupadas = {
                1: [],
                2: [],
                3: [],
                4: []
            };

            rutinas.forEach(r => {
                const s = r.semana || 1;
                if (rutinasAgrupadas[s]) {
                    rutinasAgrupadas[s].push(r);
                }
            });

            res.render('entrenador/rutinas-cliente', {
                title: 'Rutinas de ' + cliente.nombre,
                cliente,
                rutinasAgrupadas
            });
        } catch (error) {
            console.error('Error al cargar rutinas del cliente:', error);
            req.flash('error', 'Error al cargar las rutinas');
            res.redirect('/entrenador/rutinas');
        }
    },

    async showCrearRutina(req, res) {
        try {
            const entrenadorId = req.session.user.id;
            const [clientes] = await pool.query(`
                SELECT u.id, u.nombre 
                FROM usuarios u
                JOIN asignaciones a ON u.id = a.cliente_id
                WHERE a.entrenador_id = ? AND a.activa = 1
            `, [entrenadorId]);

            res.render('entrenador/rutina-form', {
                title: 'Nueva Rutina',
                rutina: null,
                clientes,
                editing: false
            });
        } catch (error) {
            console.error('Error al cargar formulario:', error);
            req.flash('error', 'Error al cargar el formulario');
            res.redirect('/entrenador/rutinas');
        }
    },

    async crearRutina(req, res) {
        try {
            const { cliente_id, semanas, dias, nombre, calentamiento, ejercicios, duracion_min } = req.body;
            const entrenador_id = req.session.user.id;

            // 1. Asegurar que semanas y dias sean Arrays (por si solo seleccionan uno)
            const semanasArray = Array.isArray(semanas) ? semanas : (semanas ? [semanas] : []);
            const diasArray = Array.isArray(dias) ? dias : (dias ? [dias] : []);
            
            // 2. Convertir ejercicios a JSON
            let ejerciciosJSON = null;
            if (ejercicios) {
                // Si el frontend lo mandó como hidden input String, o como Object map
                ejerciciosJSON = typeof ejercicios === 'string' ? ejercicios : JSON.stringify(ejercicios);
            }

            // 3. Bucle para insertar una rutina por cada combinación de Semana y Día
            for (const semana of semanasArray) {
                for (const dia of diasArray) {
                    if (semana && dia) { // Validar que no estén vacíos
                        await pool.query(`
                            INSERT INTO rutinas (usuario_id, entrenador_id, nombre, dia_semana, semana, calentamiento, ejercicios, duracion_min, fecha) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        `, [cliente_id, entrenador_id, nombre, dia, semana, calentamiento, ejerciciosJSON, duracion_min || 60, new Date().toISOString().split('T')[0]]);
                    }
                }
            }

            const cliente = await Usuario.findById(cliente_id);
            if (cliente) {
                await Notificacion.create({
                    usuario_id: cliente_id,
                    mensaje: `El entrenador te ha asignado nuevas rutinas: "${nombre}".`
                });
            }

            req.flash('success', 'Rutinas creadas masivamente con éxito');
            res.redirect('/entrenador/rutinas');
        } catch (error) {
            console.error('Error al crear rutina masiva:', error);
            req.flash('error', 'Hubo un error al crear las rutinas');
            res.redirect('back');
        }
    },

    async getEditarRutina(req, res) {
        try {
            const [rutinaRows] = await pool.query('SELECT * FROM rutinas WHERE id = ?', [req.params.id]);
            if (rutinaRows.length === 0) return res.status(404).send('Rutina no encontrada');
            
            let rutina = rutinaRows[0];
            rutina.ejercicios = typeof rutina.ejercicios === 'string' ? JSON.parse(rutina.ejercicios) : rutina.ejercicios;
            
            res.render('entrenador/rutina-editar', { rutina });
        } catch (error) {
            console.error(error);
            res.status(500).send('Error');
        }
    },

    async postEditarRutina(req, res) {
        try {
            const { nombre, calentamiento, ejercicios } = req.body;
            
            // Iteramos sobre los ejercicios que llegaron del req.body
            const ejerciciosProcesados = ejercicios.map((ej, index) => {
                // Buscamos si en req.files viene un archivo con el fieldname que coincida con este índice
                const file = req.files ? req.files.find(f => f.fieldname === `ejercicios[${index}][gif_file]`) : null;
                
                return {
                    nombre: ej.nombre,
                    series: ej.series,
                    repeticiones: ej.repeticiones || ej.reps,
                    descanso: ej.descanso,
                    tecnica: ej.tecnica,
                    // Si subió un archivo nuevo, guardamos la nueva ruta local. 
                    // Si no, conservamos el gif_viejo que mandamos oculto desde el frontend.
                    gif: file ? `/uploads/gifs/${file.filename}` : ej.gif_viejo
                };
            });

            const ejerciciosJSON = JSON.stringify(ejerciciosProcesados);

            await pool.query(`
                UPDATE rutinas 
                SET nombre = ?, calentamiento = ?, ejercicios = ?
                WHERE id = ?
            `, [nombre, calentamiento, ejerciciosJSON, req.params.id]);

            res.redirect(`/entrenador/rutinas/${req.params.id}`);
        } catch (error) {
            console.error(error);
            res.status(500).send('Error al actualizar rutina con archivos');
        }
    },

    async eliminarRutina(req, res) {
        try {
            await Rutina.delete(req.params.id);
            req.flash('success', 'Rutina eliminada exitosamente');
            res.redirect('/entrenador/rutinas');
        } catch (error) {
            console.error('Error al eliminar rutina:', error);
            req.flash('error', 'Error al eliminar la rutina');
            res.redirect('/entrenador/rutinas');
        }
    },

    // ==================== SOLICITUDES MEMBRESÍA ====================

    async solicitudes(req, res) {
        try {
            const solicitudes = await SolicitudMembresia.getAll();
            res.render('entrenador/solicitudes', {
                title: 'Solicitudes de Membresía',
                solicitudes,
                activeTab: 'solicitudes'
            });
        } catch (error) {
            console.error('Error al cargar solicitudes:', error);
            req.flash('error', 'Error al cargar las solicitudes');
            res.redirect('/entrenador/dashboard');
        }
    },

    async aprobarSolicitud(req, res) {
        try {
            const solicitud = await SolicitudMembresia.findById(req.params.id);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/entrenador/solicitudes');
            }

            await SolicitudMembresia.updateEstado(solicitud.id, 'aprobada');

            const fechaInicio = new Date();
            const fechaFin = new Date();
            fechaFin.setDate(fechaFin.getDate() + solicitud.membresia_duracion);

            await Membresia.asignarAUsuario(
                solicitud.usuario_id,
                solicitud.membresia_id,
                fechaInicio.toISOString().split('T')[0],
                fechaFin.toISOString().split('T')[0]
            );

            await Pago.create({
                usuario_id: solicitud.usuario_id,
                membresia_id: solicitud.membresia_id,
                monto: solicitud.membresia_precio,
                metodo_pago: solicitud.metodo_pago,
                fecha: new Date().toISOString().split('T')[0],
                estado: 'pagado'
            });

            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: `¡Tu solicitud de membresía "${solicitud.membresia_nombre}" ha sido aprobada! Ya está activa.`
            });

            req.flash('success', 'Solicitud aprobada exitosamente');
            res.redirect('/entrenador/solicitudes');
        } catch (error) {
            console.error('Error al aprobar solicitud:', error);
            req.flash('error', 'Error al aprobar la solicitud');
            res.redirect('/entrenador/solicitudes');
        }
    },

    async rechazarSolicitud(req, res) {
        try {
            const solicitud = await SolicitudMembresia.findById(req.params.id);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/entrenador/solicitudes');
            }

            await SolicitudMembresia.updateEstado(solicitud.id, 'rechazada');

            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: `Tu solicitud de membresía "${solicitud.membresia_nombre}" ha sido rechazada.`
            });

            req.flash('success', 'Solicitud rechazada');
            res.redirect('/entrenador/solicitudes');
        } catch (error) {
            console.error('Error al rechazar solicitud:', error);
            req.flash('error', 'Error al rechazar la solicitud');
            res.redirect('/entrenador/solicitudes');
        }
    },

    // ==================== SOLICITUDES RUTINA PERSONALIZADA ====================

    async solicitudesRutina(req, res) {
        try {
            const solicitudes = await SolicitudRutina.getPendientes();
            res.render('entrenador/solicitudes-rutina', {
                title: 'Solicitudes de Rutina',
                solicitudes,
                activeTab: 'solicitudes-rutina'
            });
        } catch (error) {
            console.error('Error al cargar solicitudes de rutina:', error);
            req.flash('error', 'Error al cargar las solicitudes');
            res.redirect('/entrenador/dashboard');
        }
    },

    async aceptarSolicitudRutina(req, res) {
        try {
            const solicitud = await SolicitudRutina.findById(req.params.id);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/entrenador/solicitudes-rutina');
            }

            // FIX #2: Preservar datos físicos si la nueva solicitud los trae vacíos
            // Buscar la última solicitud con datos físicos válidos del mismo usuario
            if (!solicitud.peso || !solicitud.estatura || !solicitud.sexo) {
                try {
                    const [anteriorRows] = await pool.query(`
                        SELECT peso, estatura, sexo
                        FROM solicitudes_rutina
                        WHERE usuario_id = ? AND peso IS NOT NULL
                        ORDER BY id DESC
                        LIMIT 1
                    `, [solicitud.usuario_id]);
                    if (anteriorRows.length > 0) {
                        const ant = anteriorRows[0];
                        if (!solicitud.peso)    solicitud.peso    = ant.peso;
                        if (!solicitud.estatura) solicitud.estatura = ant.estatura;
                        if (!solicitud.sexo)    solicitud.sexo    = ant.sexo;
                        // Actualizar en la base de datos para consistencia
                        await pool.query(
                            'UPDATE solicitudes_rutina SET peso = ?, estatura = ?, sexo = ? WHERE id = ?',
                            [solicitud.peso, solicitud.estatura, solicitud.sexo, solicitud.id]
                        );
                    }
                } catch (fixErr) {
                    console.warn('No se pudo preservar datos físicos:', fixErr.message);
                }
            }

            await SolicitudRutina.updateEstado(solicitud.id, 'aceptada');

            const entrenador = await Usuario.findById(req.session.user.id);
            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: `¡El entrenador ${entrenador.nombre} ha aceptado tu solicitud de rutina personalizada! Pronto recibirás tu rutina.`
            });

            req.flash('success', 'Solicitud aceptada. Cargando panel del cliente.');
            return res.redirect(`/entrenador/rutinas/cliente/${solicitud.usuario_id}`);
        } catch (error) {
            console.error('Error al aceptar solicitud:', error);
            req.flash('error', 'Error al aceptar la solicitud');
            res.redirect('/entrenador/solicitudes-rutina');
        }
    },

    async rechazarSolicitudRutina(req, res) {
        try {
            const solicitud = await SolicitudRutina.findById(req.params.id);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/entrenador/solicitudes-rutina');
            }

            await SolicitudRutina.updateEstado(solicitud.id, 'rechazada');

            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: 'Tu solicitud de rutina personalizada ha sido rechazada. Puedes intentar de nuevo o contactar al gimnasio.'
            });

            req.flash('success', 'Solicitud rechazada');
            res.redirect('/entrenador/solicitudes-rutina');
        } catch (error) {
            console.error('Error al rechazar solicitud:', error);
            req.flash('error', 'Error al rechazar la solicitud');
            res.redirect('/entrenador/solicitudes-rutina');
        }
    },

    // ==================== CLIENTES PERSONALIZADOS ====================

    async clientesPersonalizados(req, res) {
        try {
            const clientes = await SolicitudRutina.getAceptadas();
            res.render('entrenador/clientes-personalizados', {
                title: 'Clientes Personalizados',
                clientes
            });
        } catch (error) {
            console.error('Error al cargar clientes personalizados:', error);
            req.flash('error', 'Error al cargar los clientes');
            res.redirect('/entrenador/dashboard');
        }
    },

    /**
     * Crear rutina para un cliente específico (redireccionado desde rutinas-cliente)
     * Busca la última solicitud aceptada del cliente y renderiza el form con cliente precargado
     */
    async crearRutinaCliente(req, res) {
        try {
            const clienteId = req.params.id;
            const cliente = await Usuario.findById(clienteId);
            if (!cliente) {
                req.flash('error', 'Cliente no encontrado');
                return res.redirect('/entrenador/rutinas');
            }

            // Buscar la última solicitud aceptada de este cliente
            const [solRows] = await pool.query(
                `SELECT sr.*, u.nombre as cliente_nombre, u.correo as cliente_correo
                 FROM solicitudes_rutina sr
                 JOIN usuarios u ON sr.usuario_id = u.id
                 WHERE sr.usuario_id = ? AND sr.estado = 'aceptada'
                 ORDER BY sr.id DESC LIMIT 1`,
                [clienteId]
            );

            let solicitud = null;
            if (solRows.length > 0) {
                solicitud = solRows[0];
            } else {
                // Si no tiene solicitud aceptada, crear un objeto temporal para el form
                solicitud = {
                    id: 'cliente_' + clienteId,
                    usuario_id: clienteId,
                    cliente_nombre: cliente.nombre,
                    cliente_correo: cliente.correo,
                    peso: null,
                    estatura: null,
                    sexo: null,
                    condicion: null
                };
            }

            res.render('entrenador/rutina-personalizada-form', {
                title: 'Crear Rutina para ' + cliente.nombre,
                solicitud,
                clientePrecargado: true
            });
        } catch (error) {
            console.error('Error al cargar formulario de rutina cliente:', error);
            req.flash('error', 'Error al cargar el formulario');
            res.redirect('/entrenador/rutinas');
        }
    },

    async showCrearRutinaPersonalizada(req, res) {
        try {
            const solicitud = await SolicitudRutina.findById(req.params.clienteId);
            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/entrenador/clientes-personalizados');
            }

            res.render('entrenador/rutina-personalizada-form', {
                title: 'Crear Rutina Personalizada',
                solicitud
            });
        } catch (error) {
            console.error('Error al cargar formulario:', error);
            req.flash('error', 'Error al cargar el formulario');
            res.redirect('/entrenador/clientes-personalizados');
        }
    },

    /**
     * Crear rutina personalizada — v3.0 con soporte por día independiente
     * Soporta dos modos:
     * 1. Modo legacy: dias_semana[] + ejercicios globales (compatibilidad)
     * 2. Modo v3: rutinas_por_dia JSON con ejercicios independientes por día
     */
    async crearRutinaPersonalizada(req, res) {
        try {
            let solicitud = await SolicitudRutina.findById(req.params.clienteId);
            
            // Fallback: si no se encontró solicitud pero viene usuario_id del form (cliente precargado)
            if (!solicitud && req.body.usuario_id) {
                const clienteId = parseInt(req.body.usuario_id);
                const cliente = await Usuario.findById(clienteId);
                if (cliente) {
                    solicitud = {
                        id: req.params.clienteId,
                        usuario_id: clienteId,
                        cliente_nombre: cliente.nombre,
                        cliente_correo: cliente.correo
                    };
                }
            }

            if (!solicitud) {
                req.flash('error', 'Solicitud no encontrada');
                return res.redirect('/entrenador/clientes-personalizados');
            }

            const { descripcion, duracion_min } = req.body;
            let semanasList = req.body['semanas[]'] || req.body.semanas || [1];
            if (!Array.isArray(semanasList)) semanasList = [semanasList];
            
            let rutinas_por_dia = req.body.rutinas_por_dia;

            // ===== MODO v3: Rutinas por día independientes (v5.4 Multi-Semana) =====
            if (rutinas_por_dia) {
                try {
                    var diasData = typeof rutinas_por_dia === 'string' ? JSON.parse(rutinas_por_dia) : rutinas_por_dia;
                } catch (e) {
                    req.flash('error', 'Error en los datos de las rutinas');
                    return res.redirect(`/entrenador/rutina-personalizada/crear/${req.params.clienteId}`);
                }

                var diasCreados = 0;
                var fileIndex = 0;
                var diasKeys = Object.keys(diasData);

                // Paso 1: Procesar media para todos los ejercicios mapeados en memoria
                for (var i = 0; i < diasKeys.length; i++) {
                    var dia = diasKeys[i];
                    var diaInfo = diasData[dia];
                    if (!diaInfo || !diaInfo.nombre) continue;

                    var ejerciciosDia = diaInfo.ejercicios || [];
                    if (!Array.isArray(ejerciciosDia)) ejerciciosDia = [];
                    
                    for (var j = 0; j < ejerciciosDia.length; j++) {
                        if (req.files && req.files[fileIndex]) {
                            ejerciciosDia[j].media = '/img/rutinas-personalizadas/' + req.files[fileIndex].filename;
                            fileIndex++;
                        }
                    }
                    diaInfo.ejercicios = ejerciciosDia;
                }

                // Paso 2: Iterar combinatoria (Semanas x Días) e insertar rutinas JSON
                const pool = require('../config/db');
                
                for (let s = 0; s < semanasList.length; s++) {
                    const wk = parseInt(semanasList[s]);
                    
                    for (var i = 0; i < diasKeys.length; i++) {
                        var dia = diasKeys[i];
                        var diaInfo = diasData[dia];
                        if (!diaInfo || !diaInfo.nombre) continue;

                        try {
                            // Prevenir duplicados borrando la rutina previa del día y la semana (v5.4 Requerimiento)
                            await pool.query('DELETE FROM rutinas WHERE usuario_id = ? AND semana = ? AND dia_semana = ?', [solicitud.usuario_id, wk, dia]);

                            await Rutina.create({
                                usuario_id: solicitud.usuario_id,
                                entrenador_id: req.session.user.id,
                                nombre: diaInfo.nombre,
                                dia_semana: dia,
                                semana: wk,
                                descripcion: descripcion,
                                calentamiento: diaInfo.calentamiento || 'Calentamiento general',
                                ejercicios: JSON.stringify(diaInfo.ejercicios),
                                duracion_min: duracion_min || 60
                            });
                            
                            // Solo sumamos el contador visual de días creados basándonos en 1 sola semana para métricas de pantalla
                            if (s === 0) diasCreados++;
                        } catch (errInsertion) {
                            console.error(`Error insertando rutina para ${dia} sem ${wk}:`, errInsertion);
                        }
                    }
                }

                try {
                    await pool.query('UPDATE solicitudes_rutina SET estado = ? WHERE id = ?', ['aceptada', solicitud.id]);
                } catch (e) {
                    console.error('Error actualizando estado solicitud:', e.message);
                }

                const entrenador = await Usuario.findById(req.session.user.id);
                await Notificacion.create({
                    usuario_id: solicitud.usuario_id,
                    mensaje: `¡${entrenador.nombre} ha creado ${diasCreados} rutina(s) personalizada(s) para ti a través de ${semanasList.length} semanas! Revísalas en Mis Rutinas.`
                });

                req.flash('success', `${diasCreados} día(s) de entrenamiento diseñados para ${semanasList.length} semanas.`);
                return res.redirect('/entrenador/clientes-personalizados');
            }

            // ===== MODO LEGACY: compatibilidad con sistema anterior =====
            const { nombre } = req.body;
            let dias_semana = req.body.dias_semana;

            if (!nombre) {
                req.flash('error', 'El nombre de la rutina es obligatorio');
                return res.redirect(`/entrenador/rutina-personalizada/crear/${req.params.clienteId}`);
            }

            // Procesar ejercicios + media por ejercicio
            var ejercicios = procesarEjerciciosConMedia(req.body, req.files);

            const rutinaData = {
                usuario_id: solicitud.usuario_id,
                entrenador_id: req.session.user.id,
                nombre,
                descripcion: descripcion || null,
                calentamiento: req.body.calentamiento || null,
                ejercicios: ejercicios.length > 0 ? ejercicios : null,
                duracion_min: duracion_min || 60,
                semana: semana || 1,
                gif: null
            };

            // Normalizar dias_semana a array
            if (!dias_semana || dias_semana.length === 0) {
                // FIX: Eliminar rutina sin día previo para evitar duplicados
                await pool.query('DELETE FROM rutinas WHERE usuario_id = ? AND dia_semana IS NULL AND entrenador_id = ?', [solicitud.usuario_id, req.session.user.id]);
                await Rutina.create({
                    ...rutinaData,
                    dia_semana: null,
                    fecha: new Date().toISOString().split('T')[0]
                });
            } else {
                if (!Array.isArray(dias_semana)) {
                    dias_semana = [dias_semana];
                }

                for (const dia of dias_semana) {
                    // FIX: Eliminar rutina del mismo día antes de crear (evita duplicados por día)
                    await pool.query('DELETE FROM rutinas WHERE usuario_id = ? AND dia_semana = ?', [solicitud.usuario_id, dia]);
                    await Rutina.create({
                        ...rutinaData,
                        dia_semana: dia,
                        fecha: new Date().toISOString().split('T')[0]
                    });
                }
            }

            const entrenador = await Usuario.findById(req.session.user.id);
            await Notificacion.create({
                usuario_id: solicitud.usuario_id,
                mensaje: `¡${entrenador.nombre} ha creado tu rutina personalizada "${nombre}"! Revísala en Mis Rutinas.`
            });

            req.flash('success', 'Rutina personalizada creada exitosamente');
            res.redirect('/entrenador/clientes-personalizados');
        } catch (error) {
            console.error('Error al crear rutina personalizada:', error);
            req.flash('error', 'Error al crear la rutina');
            res.redirect('/entrenador/clientes-personalizados');
        }
    },

    // ==================== SEGUIMIENTO ====================
    async seguimiento(req, res) {
        try {
            const entrenador_id = req.session.user.id;
            const [clientes] = await pool.query(`
                SELECT u.id, u.nombre, u.correo 
                FROM usuarios u
                JOIN asignaciones a ON u.id = a.cliente_id
                JOIN usuario_membresia um ON u.id = um.usuario_id
                JOIN membresias m ON um.membresia_id = m.id
                WHERE a.entrenador_id = ? 
                  AND a.activa = 1 
                  AND m.tipo = 'premium' 
                  AND um.estado = 'activa'
            `, [entrenador_id]);

            res.render('entrenador/seguimiento', {
                title: 'Seguimiento de Clientes',
                clientes
            });
        } catch (error) {
            console.error('Error al cargar progreso:', error);
            req.flash('error', 'Error al cargar los clientes');
            res.redirect('/entrenador/dashboard');
        }
    },
    
    async seguimientoCliente(req, res) {
        try {
            // FIX CRÍTICO: Buscar el ID ya sea como 'id' o 'clienteId'
            const clienteId = req.params.id || req.params.clienteId; 
            
            if (!clienteId) {
                req.flash('error', 'ID de cliente no proporcionado en la ruta');
                return res.redirect('/entrenador/seguimiento');
            }
            
            const [clienteRows] = await pool.query('SELECT id, nombre, correo FROM usuarios WHERE id = ?', [clienteId]);
            if (clienteRows.length === 0) {
                req.flash('error', 'Cliente no encontrado');
                return res.redirect('/entrenador/seguimiento');
            }
            const cliente = clienteRows[0];
            // 1. Consulta para el historial de peso cronológico ASC
            const [progreso] = await pool.query('SELECT * FROM progreso WHERE usuario_id = ? ORDER BY fecha ASC', [clienteId]);
            const ultimoProgreso = progreso.length > 0 ? progreso[progreso.length - 1] : null;

            // Obtener datos físicos del cliente desde solicitudes_rutina
            let composicion = null;
            try {
                const [srRows] = await pool.query(
                    'SELECT peso, estatura, sexo FROM solicitudes_rutina WHERE usuario_id = ? AND peso IS NOT NULL ORDER BY id DESC LIMIT 1',
                    [clienteId]
                );
                if (srRows.length > 0 && ultimoProgreso && ultimoProgreso.peso) {
                    composicion = Progreso.calcularComposicionCorporal(
                        ultimoProgreso.peso, srRows[0].estatura, srRows[0].sexo
                    );
                }
            } catch (compErr) {
                console.warn('Error calculando composición para entrenador:', compErr.message);
            }

            // 2. Consulta para la constancia (Asegurar el GROUP BY)
            let diasEntrenadosMes = 0;
            const [logsEntrenamiento] = await pool.query(`
                SELECT semana, COUNT(*) as total 
                FROM entrenamiento_log 
                WHERE usuario_id = ? 
                GROUP BY semana 
                ORDER BY semana ASC
            `, [clienteId]);
            diasEntrenadosMes = logsEntrenamiento.reduce((acc, current) => acc + current.total, 0);

            res.render('entrenador/seguimiento-detalle', {
                title: 'Detalle de Progreso',
                cliente,
                progreso,
                ultimoProgreso,
                composicion,
                diasEntrenadosMes,
                logsEntrenamiento
            });
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            req.flash('error', 'Error al cargar el detalle del cliente');
            res.redirect('/entrenador/seguimiento');
        }
    },
    
    async comentarProgreso(req, res) {
        try {
            const { progreso_id, cliente_id, comentario } = req.body;
            await Progreso.addComentario(progreso_id, comentario);
            
            await Notificacion.create({
                usuario_id: cliente_id,
                mensaje: 'Tú entrenador ha dejado un comentario en tu progreso.'
            });

            req.flash('success', 'Comentario añadido exitosamente');
            res.redirect('/entrenador/seguimiento/' + cliente_id);
        } catch (error) {
            console.error('Error al comentar:', error);
            req.flash('error', 'Error al añadir el comentario');
            res.redirect('/entrenador/seguimiento');
        }
    },
    
    async postFeedbackProgreso(req, res) {
        try {
            await pool.query('UPDATE progreso SET comentarios_entrenador = ? WHERE id = ?', [req.body.comentarios_entrenador, req.params.id]);
            req.flash('success', 'Feedback guardado correctamente');
            res.redirect(req.get('Referrer') || '/entrenador/dashboard');
        } catch (error) {
            console.error(error);
            req.flash('error', 'Error al guardar feedback');
            res.redirect(req.get('Referrer') || '/entrenador/dashboard');
        }
    },

    // ==================== CHAT (v3.0) ====================

    /**
     * Lista de chats con clientes Premium
     */
    async getChat(req, res) {
        try {
            const entrenadorId = req.session.user.id;
            const contactoId = req.query.con ? parseInt(req.query.con) : null;

            // Obtener clientes Premium que este entrenador puede chatear
            const clientes = await MensajeChat.getClientesPremiumDeEntrenador(entrenadorId);

            // Si hay un contacto seleccionado, cargar conversación
            var mensajes = [];
            var contactoActual = null;
            if (contactoId) {
                mensajes = await MensajeChat.getConversacion(entrenadorId, contactoId);
                await MensajeChat.marcarLeidos(entrenadorId, contactoId);
                contactoActual = await Usuario.findById(contactoId);
            } else if (clientes.length > 0) {
                // Auto-seleccionar primer cliente
                var primerCliente = clientes[0].id;
                mensajes = await MensajeChat.getConversacion(entrenadorId, primerCliente);
                await MensajeChat.marcarLeidos(entrenadorId, primerCliente);
                contactoActual = await Usuario.findById(primerCliente);
            }

            res.render('entrenador/chat', {
                title: 'Chat con Clientes',
                clientes,
                mensajes,
                contactoActual,
                userId: entrenadorId
            });
        } catch (error) {
            console.error('Error al cargar chat:', error);
            req.flash('error', 'Error al cargar el chat');
            res.redirect('/entrenador/dashboard');
        }
    },

    /**
     * Enviar mensaje (entrenador → cliente)
     */
    async sendMessage(req, res) {
        try {
            const entrenadorId = req.session.user.id;
            const { receptor_id, mensaje } = req.body;

            if (!receptor_id || !mensaje || !mensaje.trim()) {
                req.flash('error', 'El mensaje no puede estar vacío');
                return res.redirect('/entrenador/chat');
            }

            await MensajeChat.create({
                emisor_id: entrenadorId,
                receptor_id: parseInt(receptor_id),
                mensaje: mensaje.trim()
            });

            // Notificar al cliente
            await Notificacion.create({
                usuario_id: parseInt(receptor_id),
                mensaje: 'Tu entrenador te ha enviado un mensaje. Revisa tu chat.'
            });

            res.redirect('/entrenador/chat?con=' + receptor_id);
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            req.flash('error', 'Error al enviar el mensaje');
            res.redirect('/entrenador/chat');
        }
    },

    /**
     * Editar peso de un cliente (solo entrenador)
     */
    async editarPesoCliente(req, res) {
        try {
            const { id, peso } = req.body;
            const nuevoPeso = parseFloat(peso);

            if (!id || !nuevoPeso || nuevoPeso < 20 || nuevoPeso > 300) {
                return res.status(400).json({ ok: false, error: 'Datos inválidos' });
            }

            // Verificar que el registro existe
            const [rows] = await pool.query('SELECT * FROM progreso WHERE id = ?', [id]);
            if (rows.length === 0) {
                return res.status(404).json({ ok: false, error: 'Registro no encontrado' });
            }

            await pool.query('UPDATE progreso SET peso = ? WHERE id = ?', [nuevoPeso, id]);
            return res.json({ ok: true, message: 'Peso actualizado correctamente' });
        } catch (error) {
            console.error('Error al editar peso:', error);
            return res.status(500).json({ ok: false, error: 'Error interno' });
        }
    },
    
    verRutinaDetalle: async (req, res) => {
        try {
            const rutina_id = req.params.id;
            const [rutinaRows] = await pool.query('SELECT * FROM rutinas WHERE id = ?', [rutina_id]);
            
            if (rutinaRows.length === 0) {
                return res.status(404).render('404', { mensaje: 'Rutina no encontrada' });
            }

            res.render('entrenador/rutina-detalle', {
                rutina: rutinaRows[0]
            });
        } catch (error) {
            console.error('Error al verRutinaDetalle:', error);
            res.status(500).send('Error en el servidor');
        }
    }
};

module.exports = entrenadorController;
