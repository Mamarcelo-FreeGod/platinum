/**
 * Controlador del Cliente
 * Dashboard, perfil, membresía (solicitar), rutinas, pagos
 * v3.0: Progreso avanzado con calendario, gráficas y chat
 * Incluye lógica de restricción por tipo de membresía (basica/plus/premium)
 */
const Usuario = require('../models/Usuario');
const Membresia = require('../models/Membresia');
const Rutina = require('../models/Rutina');
const Pago = require('../models/Pago');
const SolicitudMembresia = require('../models/SolicitudMembresia');
const Notificacion = require('../models/Notificacion');
const SolicitudRutina = require('../models/SolicitudRutina');
const Progreso = require('../models/Progreso');
const EntrenamientoLog = require('../models/EntrenamientoLog');
const MensajeChat = require('../models/MensajeChat');
const pool = require('../config/db');

const clienteController = {
    /**
     * Dashboard del cliente
     */
    async dashboard(req, res) {
        try {
            const userId = req.session.user.id;
            const membresia = await Membresia.getByUsuarioId(userId);
            const rutinas = await Rutina.getByUsuarioId(userId);
            const pagos = await Pago.getByUsuarioId(userId);
            const solicitudesPendientes = await SolicitudMembresia.getByUsuarioId(userId);
            const pendientes = solicitudesPendientes.filter(s => s.estado === 'pendiente');

            res.render('cliente/dashboard', {
                title: 'Mi Dashboard',
                membresia,
                totalRutinas: rutinas.length,
                totalPagos: pagos.length,
                solicitudesPendientes: pendientes.length,
                ultimosPagos: pagos.slice(0, 3)
            });
        } catch (error) {
            console.error('Error en dashboard cliente:', error);
            req.flash('error', 'Error al cargar el dashboard');
            res.redirect('/');
        }
    },

    /**
     * Ver perfil del cliente
     */
    async perfil(req, res) {
        try {
            const usuario = await Usuario.findById(req.session.user.id);
            res.render('cliente/perfil', {
                title: 'Mi Perfil',
                usuario
            });
        } catch (error) {
            console.error('Error al cargar perfil:', error);
            req.flash('error', 'Error al cargar el perfil');
            res.redirect('/cliente/dashboard');
        }
    },

    /**
     * Actualizar perfil
     */
    async updatePerfil(req, res) {
        try {
            const { nombre, correo, telefono, password } = req.body;
            const userId = req.session.user.id;

            const data = { nombre, correo, telefono, rol: 'cliente', activo: 1 };
            if (password && password.trim() !== '') {
                data.password = password;
            }

            await Usuario.update(userId, data);

            // Actualizar sesión
            req.session.user.nombre = nombre;
            req.session.user.correo = correo;

            req.flash('success', 'Perfil actualizado correctamente');
            res.redirect('/cliente/perfil');
        } catch (error) {
            console.error('Error al actualizar perfil:', error);
            req.flash('error', 'Error al actualizar el perfil');
            res.redirect('/cliente/perfil');
        }
    },

    /**
     * Ver membresía activa y membresías disponibles
     */
    async membresia(req, res) {
        try {
            const userId = req.session.user.id;
            const membresia = await Membresia.getByUsuarioId(userId);
            const todasMembresias = await Membresia.getAll();
            const solicitudes = await SolicitudMembresia.getByUsuarioId(userId);

            res.render('cliente/membresia', {
                title: 'Mi Membresía',
                membresia,
                todasMembresias,
                solicitudes
            });
        } catch (error) {
            console.error('Error al cargar membresía:', error);
            req.flash('error', 'Error al cargar la membresía');
            res.redirect('/cliente/dashboard');
        }
    },

    /**
     * Solicitar membresía
     * Validaciones:
     * - No puede tener CUALQUIER solicitud pendiente
     * - Premium NO puede solicitar ninguna otra (ya tiene el máximo)
     * - Plus SOLO puede subir a Premium (no puede bajar a Básica)
     * - Básica puede subir a Plus o Premium
     * - NO se permite downgrade
     */
    async solicitarMembresia(req, res) {
        try {
            const userId = req.session.user.id;
            const { membresia_id, metodo_pago } = req.body;

            if (!membresia_id || !metodo_pago) {
                req.flash('error', 'Debes seleccionar una membresía y método de pago');
                return res.redirect('/cliente/membresia');
            }

            // Verificar que la membresía existe y es válida
            const membresiaInfo = await Membresia.findById(membresia_id);
            if (!membresiaInfo || !membresiaInfo.activa) {
                req.flash('error', 'La membresía seleccionada no está disponible');
                return res.redirect('/cliente/membresia');
            }

            // Verificar si ya tiene CUALQUIER solicitud pendiente
            const yaPendiente = await SolicitudMembresia.tieneCualquierPendiente(userId);
            if (yaPendiente) {
                req.flash('error', 'Ya tienes una solicitud pendiente. Espera a que sea procesada antes de solicitar otra.');
                return res.redirect('/cliente/membresia');
            }

            // Obtener membresía actual del usuario
            const membresiaActual = await Membresia.getByUsuarioId(userId);

            if (membresiaActual) {
                const tipoActual = membresiaActual.tipo;
                const tipoNuevo = membresiaInfo.tipo;

                // No puede solicitar el mismo plan
                if (tipoActual === tipoNuevo) {
                    req.flash('error', 'Ya tienes este plan activo.');
                    return res.redirect('/cliente/membresia');
                }

                // Jerarquía: basica=1, plus=2, premium=3
                const jerarquia = { basica: 1, plus: 2, premium: 3 };
                const nivelActual = jerarquia[tipoActual] || 0;
                const nivelNuevo = jerarquia[tipoNuevo] || 0;

                // Premium no puede solicitar nada (ya tiene el máximo)
                if (tipoActual === 'premium') {
                    req.flash('error', 'Ya tienes el plan Premium. Es el nivel máximo disponible.');
                    return res.redirect('/cliente/membresia');
                }

                // No se permite downgrade
                if (nivelNuevo < nivelActual) {
                    req.flash('error', 'No es posible cambiar a un plan inferior. Solo se permiten upgrades.');
                    return res.redirect('/cliente/membresia');
                }
            }

            // Crear solicitud
            await SolicitudMembresia.create({
                usuario_id: userId,
                membresia_id,
                metodo_pago
            });

            // Obtener info para notificación
            const usuario = await Usuario.findById(userId);

            // Notificar a admins
            await Notificacion.notificarPorRol('admin',
                `Nueva solicitud de membresía "${membresiaInfo.nombre}" de ${usuario.nombre} (${metodo_pago})`
            );

            req.flash('success', '¡Solicitud enviada! Un administrador revisará tu solicitud.');
            res.redirect('/cliente/membresia');
        } catch (error) {
            console.error('Error al solicitar membresía:', error);
            req.flash('error', 'Error al enviar la solicitud');
            res.redirect('/cliente/membresia');
        }
    },

    /**
     * Ver rutinas asignadas - Vista mensual (v5.3)
     */
    async getRutinas(req, res) {
        try {
            const tipoMembresia = req.tipoMembresia || null;

            if (tipoMembresia === 'basica') {
                return res.redirect('/cliente/membresia?error=upgrade_required');
            }

            const hoy = new Date();
            const semanaActual = Math.ceil(hoy.getDate() / 7);

            res.render('cliente/rutinas', {
                title: 'Plan Mensual',
                semanaActual,
                esPremium: tipoMembresia === 'premium'
            });
        } catch (error) {
            console.error('Error al cargar rutinas:', error);
            req.flash('error', 'Error al cargar el plan mensual');
            res.redirect('/cliente/dashboard');
        }
    },

    /**
     * Ver rutina detalle por semana (v5.3/v5.4/v5.6)
     */
    async getRutinaSemana(req, res) {
        try {
            const semana = parseInt(req.params.semana);
            const userId = req.session.user.id;
            const tipoMembresia = req.tipoMembresia || null;

            if (tipoMembresia === 'basica') {
                return res.redirect('/cliente/membresia?error=upgrade_required');
            }

            const esPremium = (tipoMembresia === 'premium');
            
            // Helper v5.4
            const hoy = new Date();
            const diaMes = hoy.getDate();
            const semanaActual = Math.ceil(diaMes / 7); // 1 a 4

            if (semana > semanaActual) {
                return res.render('cliente/rutina-semana', {
                    title: 'Semana bloqueada',
                    bloqueado: true,
                    semanaActual,
                    semanaSolicitada: semana,
                    esPremium
                });
            }

            const pool = require('../config/db');
            const [rutinas] = await pool.query('SELECT * FROM rutinas WHERE usuario_id = ? AND semana = ?', [userId, semana]);
            const [logs] = await pool.query('SELECT * FROM entrenamiento_log WHERE usuario_id = ? AND semana = ?', [userId, semana]);
            
            // Estático de Lunes a Domingo v5.6
            const nombresDiasFijos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            const diasSemana = [];

            // Helper format
            hoy.setHours(0,0,0,0);
            
            for (let i = 0; i < nombresDiasFijos.length; i++) {
                const nombreStr = nombresDiasFijos[i];

                diasSemana.push({
                    nombre: nombreStr,
                    // No calculamos la fecha exacta del mes, simplemente mapeamos el día y la condición de "tieneRutina" y si fue "entrenado"
                    // Así prevenimos el desorden y los saltos artificiales del v5.4
                });
            }
            
            res.render('cliente/rutina-semana', {
                title: 'Semana ' + semana,
                semana,
                rutinas,
                logs,
                tipoMembresia,
                esPremium,
                diasSemana,
                bloqueado: false
            });
        } catch (error) {
            console.error('Error al cargar detalle semana:', error);
            req.flash('error', 'Error al cargar la semana');
            res.redirect('/cliente/rutinas');
        }
    },

    /**
     * Toggle día entrenado por semana en mini calendario (v5.3/v5.4)
     */
    async toggleDia(req, res) {
        try {
            const userId = req.session.user.id;
            const { semana, dia } = req.body;
            
            if (!semana || !dia) {
                return res.status(400).json({ ok: false, error: 'Semana y día requeridos' });
            }
            
            const hoy = new Date();
            const diaMes = hoy.getDate();
            const semanaActual = Math.ceil(diaMes / 7);
            
            if (semana > semanaActual) {
                return res.status(403).json({ ok: false, error: 'Semana futura bloqueada' });
            }
            
            const pool = require('../config/db');
            const [existe] = await pool.query('SELECT id FROM entrenamiento_log WHERE usuario_id = ? AND semana = ? AND dia_semana = ?', [userId, semana, dia]);
            
            if (existe.length > 0) {
                await pool.query('DELETE FROM entrenamiento_log WHERE usuario_id = ? AND semana = ? AND dia_semana = ?', [userId, semana, dia]);
                return res.json({ ok: true, action: 'removed' });
            } else {
                const fechaSql = hoy.toISOString().split('T')[0];
                await pool.query('INSERT INTO entrenamiento_log (usuario_id, semana, dia_semana, completado, fecha) VALUES (?, ?, ?, 1, ?)', [userId, semana, dia, fechaSql]);
                return res.json({ ok: true, action: 'added' });
            }
        } catch (error) {
            console.error('Error en toggleDia:', error);
            return res.status(500).json({ ok: false, error: 'Error interno' });
        }
    },

    /**
     * Ver detalle de rutina por día de la semana
     * Verifica restricciones por tipo de membresía
     */
    async getRutinaDetalle(req, res) {
        try {
            const rutina_id = req.params.id;
            const usuario_id = req.session.user.id;
            
            const pool = require('../config/db');
            const [rutinaRows] = await pool.query(`
              SELECT * FROM rutinas 
              WHERE id = ? AND usuario_id = ?
            `, [rutina_id, usuario_id]);

            if (rutinaRows.length === 0) {
                req.flash('error', 'Rutina no encontrada');
                return res.redirect('/cliente/rutinas');
            }

            const rutina = rutinaRows[0];
            
            // Parse for JSON
            if (typeof rutina.ejercicios === 'string') {
                try {
                    rutina.ejercicios = JSON.parse(rutina.ejercicios);
                } catch(e) {
                    rutina.ejercicios = [];
                }
            } else if (!rutina.ejercicios) {
                rutina.ejercicios = [];
            }

            // Validar restricción Básica
            const tipoMembresia = req.tipoMembresia || null;
            const diasBasica = ['Lunes', 'Miércoles', 'Viernes'];

            if (tipoMembresia === 'basica' && !diasBasica.includes(rutina.dia_semana)) {
                req.flash('error', `Tu plan actual no incluye el día ${rutina.dia_semana}. ¡Mejora tu membresía para acceder a todos los días!`);
                return res.redirect('/cliente/rutinas');
            }

            // Además, necesitamos saber si ESTA rutina ya fue completada para el botón final
            const [logRows] = await pool.query(`
              SELECT * FROM entrenamiento_log 
              WHERE usuario_id = ? AND semana = ? AND dia_semana = ?
            `, [usuario_id, rutina.semana, rutina.dia_semana]);

            const entrenado = logRows.length > 0;

            res.render('cliente/rutina-detalle', {
              title: `Rutina del ${rutina.dia_semana}`,
              rutina,
              entrenado,
              tipoMembresia
            });
        } catch (error) {
            console.error('Error al cargar detalle de rutina:', error);
            req.flash('error', 'Error interno');
            res.redirect('/cliente/rutinas');
        }
    },

    /**
     * Ver historial de pagos
     */
    async pagos(req, res) {
        try {
            const pagos = await Pago.getByUsuarioId(req.session.user.id);
            res.render('cliente/pagos', {
                title: 'Mis Pagos',
                pagos
            });
        } catch (error) {
            console.error('Error al cargar pagos:', error);
            req.flash('error', 'Error al cargar los pagos');
            res.redirect('/cliente/dashboard');
        }
    },

    /**
     * Mostrar formulario de solicitud de rutina personalizada
     * Solo accesible para Plus y Premium (middleware soloPlus)
     */
    async showSolicitarRutina(req, res) {
        try {
            // Verificar si ya tiene solicitud pendiente
            const yaPendiente = await SolicitudRutina.tienePendiente(req.session.user.id);

            // Para Plus: verificar límite de 1 rutina personalizada al mes
            const tipoMembresia = req.tipoMembresia || null;
            let limiteAlcanzado = false;
            if (tipoMembresia === 'plus') {
                const rutinasEsteMes = await Membresia.countRutinasPersonalizadasMes(req.session.user.id);
                limiteAlcanzado = rutinasEsteMes >= 1;
            }

            // Verificar si ya tiene información física guardada
            const tieneInfoPrevia = await SolicitudRutina.checkUserExistsInfo(req.session.user.id);
            const rutinas = await Rutina.getByUsuarioId(req.session.user.id);

            res.render('cliente/solicitar-rutina', {
                title: 'Solicitar Rutina Personalizada',
                yaPendiente,
                limiteAlcanzado,
                tipoMembresia,
                tieneInfoPrevia,
                rutinas
            });
        } catch (error) {
            console.error('Error al cargar formulario:', error);
            req.flash('error', 'Error al cargar el formulario');
            res.redirect('/rutinas');
        }
    },

    /**
     * Procesar solicitud de rutina personalizada
     */
    async solicitarRutina(req, res) {
        try {
            const userId = req.session.user.id;
            const { peso, estatura, sexo, condicion, tipo_solicitud, descripcion, rutina_id } = req.body;

            // Verificar si ya tiene solicitud pendiente
            const yaPendiente = await SolicitudRutina.tienePendiente(userId);
            if (yaPendiente) {
                req.flash('error', 'Ya tienes una solicitud pendiente. Espera a que sea procesada.');
                return res.redirect('/cliente/solicitar-rutina');
            }

            // Verificar límite para Plus
            const tipoMembresia = req.tipoMembresia || null;
            if (tipoMembresia === 'plus') {
                const rutinasEsteMes = await Membresia.countRutinasPersonalizadasMes(userId);
                if (rutinasEsteMes >= 1) {
                    req.flash('error', 'Tu plan Plus solo permite 1 rutina personalizada al mes. Mejora a Premium para rutinas ilimitadas.');
                    return res.redirect('/cliente/solicitar-rutina');
                }
            }

            const tieneInfoPrevia = await SolicitudRutina.checkUserExistsInfo(userId);
            let data = {
                usuario_id: userId,
                condicion: condicion || ''
            };

            let notificacionMsg = '';

            if (!tieneInfoPrevia) {
                // Primera vez
                if (!peso || !estatura || !sexo) {
                    req.flash('error', 'Peso, estatura y sexo son obligatorios');
                    return res.redirect('/cliente/solicitar-rutina');
                }
                data.peso = peso;
                data.estatura = estatura;
                data.sexo = sexo;
                data.tipo_solicitud = 'nueva_rutina';
                data.descripcion = condicion || 'Solicitud inicial';
                
                notificacionMsg = `Nueva solicitud de rutina de ${req.session.user.nombre}. Peso: ${peso}kg, Estatura: ${estatura}cm.`;
            } else {
                // Solicitud simple
                if (!tipo_solicitud || !descripcion) {
                    req.flash('error', 'El tipo de solicitud y la descripción son obligatorios');
                    return res.redirect('/cliente/solicitar-rutina');
                }
                data.tipo_solicitud = tipo_solicitud;
                data.descripcion = descripcion;
                data.rutina_id = rutina_id || null;
                
                notificacionMsg = `Nueva solicitud de ${req.session.user.nombre}: ${tipo_solicitud}.`;
            }

            // Crear solicitud
            await SolicitudRutina.create(data);

            // Notificar a entrenadores
            await Notificacion.notificarPorRol('entrenador', notificacionMsg);

            req.flash('success', '¡Solicitud enviada! Un entrenador revisará tu solicitud y creará tu rutina personalizada.');
            res.redirect('/rutinas');
        } catch (error) {
            console.error('Error al solicitar rutina:', error);
            req.flash('error', 'Error al enviar la solicitud');
            res.redirect('/cliente/solicitar-rutina');
        }
    },

    // ==================== PROGRESO v5.0 (SIMPLIFICADO) ====================

    /**
     * Ver progreso del cliente — versión simplificada v5.0
     * Sin calendario interactivo. Datos para 2 gráficas simples.
     */
    async getProgreso(req, res) {
        try {
            const userId = req.session.user.id;

            // Guard: verificar rutina aceptada
            let sinRutina = true;
            try {
                const [solRows] = await pool.query(
                    "SELECT id FROM solicitudes_rutina WHERE usuario_id = ? AND estado = 'aceptada' LIMIT 1",
                    [userId]
                );
                sinRutina = solRows.length === 0;
            } catch (e) {
                console.warn('Error al verificar rutina:', e.message);
            }

            if (sinRutina) {
                return res.render('cliente/progreso', {
                    title: 'Mi Progreso',
                    sinRutina: true
                });
            }

            // ========== 1. Datos base ==========
            let solicitudData = null;
            try {
                const [solRows] = await pool.query(
                    'SELECT peso, estatura, sexo FROM solicitudes_rutina WHERE usuario_id = ? AND peso IS NOT NULL AND estatura IS NOT NULL ORDER BY id DESC LIMIT 1',
                    [userId]
                );
                if (solRows.length > 0) solicitudData = solRows[0];
            } catch (e) { console.warn('Error solicitud:', e.message); }

            let progreso = [];
            let ultimoProgresoRow = null;
            try {
                const [progRows] = await pool.query(
                    'SELECT * FROM progreso WHERE usuario_id = ? ORDER BY fecha ASC',
                    [userId]
                );
                progreso = progRows;
                if (progRows.length > 0) {
                    ultimoProgresoRow = progRows[progRows.length - 1];
                }
            } catch (e) { console.warn('Error progreso:', e.message); }

            // ========== 2. Peso y estatura ==========
            let pesoActual = null;
            let estatura = null;
            let sexo = null;

            if (solicitudData) {
                estatura = parseFloat(solicitudData.estatura);
                sexo = solicitudData.sexo;
            }

            if (ultimoProgresoRow && ultimoProgresoRow.peso) {
                pesoActual = parseFloat(ultimoProgresoRow.peso);
            } else if (solicitudData && solicitudData.peso) {
                pesoActual = parseFloat(solicitudData.peso);
            }

            // ========== 3. Composición corporal ==========
            let composicion = null;
            if (pesoActual && estatura) {
                const h = estatura / 100;
                const imc = pesoActual / (h * h);
                const sexo_num = (sexo === 'Masculino') ? 1 : 0;
                let grasa = (1.2 * imc) + (0.23 * 25) - (10.8 * sexo_num) - 5.4;
                grasa = Math.max(5, grasa);

                let clasificacion = '';
                if (imc < 18.5) clasificacion = 'Bajo peso';
                else if (imc < 25) clasificacion = 'Normal';
                else if (imc < 30) clasificacion = 'Sobrepeso';
                else clasificacion = 'Obesidad';

                let objetivo_msg = '';
                if (imc >= 25) {
                    const meta = (pesoActual * 0.92).toFixed(1);
                    objetivo_msg = `Tu IMC indica ${clasificacion.toLowerCase()}. Objetivo: reducir a ~${meta} kg. Enfócate en déficit calórico y cardio.`;
                } else if (imc < 18.5) {
                    const meta = (pesoActual * 1.05).toFixed(1);
                    objetivo_msg = `Tu IMC indica bajo peso. Objetivo: subir a ~${meta} kg. Aumenta ingesta calórica y entrena fuerza.`;
                } else {
                    objetivo_msg = 'Tu peso está en rango normal. Mantén tu composición y enfócate en ganar fuerza.';
                }

                composicion = {
                    imc: parseFloat(imc.toFixed(1)),
                    grasa: parseFloat(grasa.toFixed(1)),
                    clasificacion,
                    objetivo: objetivo_msg,
                    estaturaInt: parseInt(estatura),
                    pesoActual: parseFloat(pesoActual.toFixed(1))
                };
            }

            // ========== 4. GRÁFICA 1: Plan Mensual (Semanas 1-4) ==========
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth() + 1;

            let chartSemanalData = [
                { label: 'Semana 1', value: 0 },
                { label: 'Semana 2', value: 0 },
                { label: 'Semana 3', value: 0 },
                { label: 'Semana 4', value: 0 }
            ];
            let totalDiasEntrenadosMes = 0;

            try {
                const [rows] = await pool.query(
                    'SELECT semana, COUNT(*) as total FROM entrenamiento_log WHERE usuario_id = ? AND YEAR(fecha) = ? AND MONTH(fecha) = ? GROUP BY semana',
                    [userId, year, month]
                );
                rows.forEach(function(r) {
                    if (r.semana >= 1 && r.semana <= 4) {
                        chartSemanalData[r.semana - 1].value = r.total;
                        totalDiasEntrenadosMes += r.total;
                    }
                });
            } catch (logErr) {
                console.error('Error al obtener datos semanales:', logErr);
            }

            // ========== 6. Control semanal de peso ==========
            let puedeActualizar = true;
            try {
                puedeActualizar = await Progreso.puedeActualizarPeso(userId);
            } catch (paErr) {
                console.warn('Error al verificar peso semanal:', paErr.message);
            }

            // ========== 7. Render ==========
            res.render('cliente/progreso', {
                title: 'Mi Progreso',
                composicion,
                pesoActual,
                puedeActualizar,
                totalDiasEntrenadosMes,
                progreso,
                chartSemanal: JSON.stringify(chartSemanalData)
            });
        } catch (error) {
            console.error('Error al cargar progreso:', error);
            try {
                res.render('cliente/progreso', {
                    title: 'Mi Progreso',
                    composicion: null,
                    pesoActual: null,
                    puedeActualizar: true,
                    totalDiasEntrenadosMes: 0,
                    chartSemanal: '[]',
                    chartPeso: '[]',
                    mensaje: 'Ocurrió un error al cargar datos. Intenta de nuevo.'
                });
            } catch (renderErr) {
                req.flash('error', 'Error al cargar tu progreso');
                res.redirect('/cliente/dashboard');
            }
        }
    },








    /**
     * Registrar múltiples días entrenados de la semana (checklist semanal)
     */
    async logEntrenamientoSemana(req, res) {
        try {
            const userId = req.session.user.id;
            let dias = req.body['dias[]'] || req.body.dias || [];

            // Normalizar a array
            if (!Array.isArray(dias)) dias = [dias];

            if (dias.length === 0) {
                req.flash('error', 'Selecciona al menos un día');
                return res.redirect('/cliente/progreso');
            }

            const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            // Calcular la fecha de cada día de ESTA semana (basado en hoy)
            const hoy = new Date();
            // Lunes de esta semana (inicio)
            const diaSemanaHoy = hoy.getDay(); // 0=Dom, 1=Lun...
            const diffLunes = diaSemanaHoy === 0 ? -6 : 1 - diaSemanaHoy;
            const lunesHoy = new Date(hoy);
            lunesHoy.setDate(hoy.getDate() + diffLunes);
            lunesHoy.setHours(0, 0, 0, 0);

            const mapaFechas = {};
            diasValidos.forEach(function(d, i) {
                const fecha = new Date(lunesHoy);
                fecha.setDate(lunesHoy.getDate() + i);
                mapaFechas[d] = fecha.toISOString().split('T')[0];
            });

            let insertados = 0;
            for (const dia of dias) {
                if (!diasValidos.includes(dia)) continue;
                const fecha = mapaFechas[dia];
                // Verificar si ya existe registro para ese día
                const [existe] = await pool.query(
                    'SELECT id FROM entrenamiento_log WHERE usuario_id = ? AND fecha = ?',
                    [userId, fecha]
                );
                if (existe.length === 0) {
                    await EntrenamientoLog.create({
                        usuario_id: userId,
                        fecha,
                        dia_semana: dia,
                        notas: null
                    });
                    insertados++;
                }
            }

            if (insertados > 0) {
                req.flash('success', `¡${insertados} día(s) registrado(s) correctamente! 💪`);
            } else {
                req.flash('success', 'Esos días ya estaban registrados.');
            }
            res.redirect('/cliente/progreso');
        } catch (error) {
            console.error('Error al registrar semana:', error);
            req.flash('error', 'Error al registrar los días');
            res.redirect('/cliente/progreso');
        }
    },

    /**
     * Guardar nuevo progreso
     */
    async saveProgreso(req, res) {
        try {
            const userId = req.session.user.id;
            const { peso, observaciones } = req.body;
            const nuevoPeso = parseFloat(peso);
            const hoy = new Date().toISOString().split('T')[0];

            if (!nuevoPeso || nuevoPeso < 20 || nuevoPeso > 300) {
                req.flash('error', 'Peso inválido. Ingresa un valor entre 20 y 300 kg.');
                return res.redirect('/cliente/progreso');
            }

            // Obtener último registro de peso
            const [ultimoRows] = await pool.query(
                'SELECT peso, fecha FROM progreso WHERE usuario_id = ? ORDER BY fecha DESC LIMIT 1',
                [userId]
            );

            if (ultimoRows.length > 0) {
                const ultimoFechaStr = new Date(ultimoRows[0].fecha).toISOString().split('T')[0];

                // Permitir corrección el mismo día (UPDATE en vez de INSERT)
                if (ultimoFechaStr === hoy) {
                    await pool.query(
                        'UPDATE progreso SET peso = ?, observaciones = ? WHERE usuario_id = ? AND fecha = ?',
                        [nuevoPeso, observaciones || '', userId, hoy]
                    );
                    req.flash('success', '¡Peso corregido correctamente para hoy! ✏️');
                    return res.redirect('/cliente/progreso');
                }

                // Validación: cambio máximo ±3kg por semana
                const diffPeso = Math.abs(nuevoPeso - parseFloat(ultimoRows[0].peso));
                if (diffPeso > 3) {
                    req.flash('error', `Cambio de peso irreal (${diffPeso.toFixed(1)} kg). Máximo ±3 kg por semana.`);
                    return res.redirect('/cliente/progreso');
                }

                // Verificar restricción semanal (no mismo día, ya manejado arriba)
                const puede = await Progreso.puedeActualizarPeso(userId);
                if (!puede) {
                    req.flash('error', 'Solo puedes actualizar tu peso una vez cada 7 días. Espera unos días más.');
                    return res.redirect('/cliente/progreso');
                }
            }

            await Progreso.create({
                usuario_id: userId,
                fecha: hoy,
                peso: nuevoPeso,
                observaciones: observaciones || ''
            });

            req.flash('success', '¡Peso registrado correctamente! Tu próxima medición será en 7 días. 📊');
            res.redirect('/cliente/progreso');
        } catch (error) {
            console.error('Error al guardar progreso:', error);
            req.flash('error', 'Error al guardar tu progreso');
            res.redirect('/cliente/progreso');
        }
    },

    /**
     * Registrar día de entrenamiento (marcar como entrenado)
     */
    async logEntrenamiento(req, res) {
        try {
            const userId = req.session.user.id;
            const { notas } = req.body;
            const hoy = new Date();
            const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

            await EntrenamientoLog.create({
                usuario_id: userId,
                fecha: hoy.toISOString().split('T')[0],
                dia_semana: diasSemana[hoy.getDay()],
                notas: notas || null
            });

            req.flash('success', '¡Día marcado como entrenado! 💪');
            res.redirect('/cliente/progreso');
        } catch (error) {
            console.error('Error al registrar entrenamiento:', error);
            req.flash('error', 'Error al registrar el entrenamiento');
            res.redirect('/cliente/progreso');
        }
    },

    /**
     * API: Obtener datos de calendario por mes (para navegación AJAX)
     */
    async getCalendarioAPI(req, res) {
        try {
            const userId = req.session.user.id;
            const year = parseInt(req.params.year);
            const month = parseInt(req.params.month);

            if (!year || !month || month < 1 || month > 12) {
                return res.json({ error: 'Parámetros inválidos' });
            }

            const entrenamientos = await EntrenamientoLog.getByUsuarioIdAndMonth(userId, year, month) || [];
            
            // FIX: Validar y parsear fecha correctamente desde objeto Date MySQL
            const diasEntrenados = entrenamientos.map(function(e) {
                if (!e || !e.fecha) return null;
                return new Date(e.fecha).getDate();
            }).filter(function(d) { return d !== null; });

            const primerDia = new Date(year, month - 1, 1);
            const ultimoDia = new Date(year, month, 0);
            var primerDiaSemana = primerDia.getDay();
            primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1;

            const meses = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

            res.json({
                year,
                month,
                monthName: meses[month - 1],
                diasEnMes: ultimoDia.getDate(),
                primerDiaSemana,
                diasEntrenados,
                hoyDia: (year === new Date().getFullYear() && month === (new Date().getMonth() + 1)) ? new Date().getDate() : null
            });
        } catch (error) {
            console.error('Error en API calendario:', error);
            res.json({ error: 'Error interno', diasEntrenados: [] });
        }
    },

    // ==================== CHAT (v3.0) ====================

    /**
     * Vista de chat para cliente Premium
     */
    async getChat(req, res) {
        try {
            const userId = req.session.user.id;
            const contactoId = req.query.con ? parseInt(req.query.con) : null;

            // Obtener entrenadores del cliente
            const entrenadores = await MensajeChat.getEntrenadoresDeCliente(userId);
            
            // Obtener contactos con historial de chat
            const contactos = await MensajeChat.getContactos(userId);

            // Mezclar entrenadores y contactos (sin duplicados)
            const contactoIds = contactos.map(function(c) { return c.contacto_id; });
            var todosContactos = contactos.slice();
            entrenadores.forEach(function(e) {
                if (!contactoIds.includes(e.id)) {
                    todosContactos.push({
                        contacto_id: e.id,
                        contacto_nombre: e.nombre,
                        contacto_correo: e.correo,
                        contacto_rol: 'entrenador',
                        ultimo_mensaje: null,
                        ultimo_mensaje_fecha: null,
                        no_leidos: 0
                    });
                }
            });

            // Si hay un contacto seleccionado, cargar conversación
            var mensajes = [];
            var contactoActual = null;
            if (contactoId) {
                mensajes = await MensajeChat.getConversacion(userId, contactoId);
                await MensajeChat.marcarLeidos(userId, contactoId);
                contactoActual = await Usuario.findById(contactoId);
            } else if (todosContactos.length > 0) {
                // Auto-seleccionar primer contacto
                var primerContacto = todosContactos[0].contacto_id;
                mensajes = await MensajeChat.getConversacion(userId, primerContacto);
                await MensajeChat.marcarLeidos(userId, primerContacto);
                contactoActual = await Usuario.findById(primerContacto);
            }

            res.render('cliente/chat', {
                title: 'Chat con Entrenador',
                contactos: todosContactos,
                mensajes,
                contactoActual,
                userId
            });
        } catch (error) {
            console.error('Error al cargar chat:', error);
            req.flash('error', 'Error al cargar el chat');
            res.redirect('/cliente/progreso');
        }
    },

    /**
     * Enviar mensaje (cliente → entrenador)
     */
    async sendMessage(req, res) {
        try {
            const userId = req.session.user.id;
            const { receptor_id, mensaje } = req.body;

            if (!receptor_id || !mensaje || !mensaje.trim()) {
                req.flash('error', 'El mensaje no puede estar vacío');
                return res.redirect('/cliente/chat');
            }

            await MensajeChat.create({
                emisor_id: userId,
                receptor_id: parseInt(receptor_id),
                mensaje: mensaje.trim()
            });

            res.redirect('/cliente/chat?con=' + receptor_id);
        } catch (error) {
            console.error('Error al enviar mensaje:', error);
            req.flash('error', 'Error al enviar el mensaje');
            res.redirect('/cliente/chat');
        }
    },

    /**
     * Toggle día entrenado (AJAX desde calendario o rutina-dia)
     */
    async toggleEntrenamiento(req, res) {
        try {
            const userId = req.session.user.id;
            const { fecha } = req.body;

            if (!fecha) {
                return res.status(400).json({ ok: false, error: 'Fecha requerida' });
            }

            // Bloquear fechas futuras
            const hoy = new Date().toISOString().split('T')[0];
            if (fecha > hoy) {
                return res.status(400).json({ ok: false, error: 'No puedes marcar días futuros' });
            }

            const [existe] = await pool.query(
                'SELECT id FROM entrenamiento_log WHERE usuario_id = ? AND fecha = ?',
                [userId, fecha]
            );

            if (existe.length > 0) {
                await pool.query(
                    'DELETE FROM entrenamiento_log WHERE usuario_id = ? AND fecha = ?',
                    [userId, fecha]
                );
                return res.json({ ok: true, action: 'removed' });
            } else {
                const diasSemana = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
                const fechaObj = new Date(fecha + 'T12:00:00');
                const diaSemana = diasSemana[fechaObj.getDay()];

                await pool.query(
                    'INSERT INTO entrenamiento_log (usuario_id, fecha, dia_semana, completado) VALUES (?, ?, ?, 1)',
                    [userId, fecha, diaSemana]
                );
                return res.json({ ok: true, action: 'added' });
            }
        } catch (error) {
            console.error('Error al toggle entrenamiento:', error);
            return res.status(500).json({ ok: false, error: 'Error interno' });
        }
    },

    /**
     * Toggle día entrenado por SEMANA (AJAX desde panel rutinas v5.0)
     * Permite al cliente marcar/desmarcar qué días entrenó cada semana del mes.
     */
    async toggleSemana(req, res) {
        try {
            const userId = req.session.user.id;
            const { semana, dia } = req.body;

            if (!semana || !dia) {
                return res.status(400).json({ ok: false, error: 'Semana y día requeridos' });
            }

            const semanaNum = parseInt(semana);
            if (semanaNum < 1 || semanaNum > 4) {
                return res.status(400).json({ ok: false, error: 'Semana inválida (1-4)' });
            }

            const diasValidos = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];
            if (!diasValidos.includes(dia)) {
                return res.status(400).json({ ok: false, error: 'Día inválido' });
            }

            // Generar fecha real basada en semana + día del mes actual
            const now = new Date();
            const year = now.getFullYear();
            const month = now.getMonth();
            
            // Calcular la fecha: día 1 del mes + offset de semana + offset de día
            const diaIndex = diasValidos.indexOf(dia); // 0=Lunes ... 6=Domingo
            const primerDia = new Date(year, month, 1);
            var primerDiaSemana = primerDia.getDay(); // 0=Dom, 1=Lun...
            primerDiaSemana = primerDiaSemana === 0 ? 6 : primerDiaSemana - 1; // Convertir a 0=Lun

            const diaDelMes = 1 + ((semanaNum - 1) * 7) + diaIndex - primerDiaSemana;
            
            // Validar que el día está dentro del mes
            const ultimoDia = new Date(year, month + 1, 0).getDate();
            if (diaDelMes < 1 || diaDelMes > ultimoDia) {
                return res.status(400).json({ ok: false, error: 'Ese día no existe en este mes' });
            }

            const fechaStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(diaDelMes).padStart(2, '0')}`;
            
            // Bloquear fechas futuras
            const hoy = now.toISOString().split('T')[0];
            if (fechaStr > hoy) {
                return res.status(400).json({ ok: false, error: 'No puedes marcar días futuros' });
            }

            // Verificar si ya existe
            const [existe] = await pool.query(
                'SELECT id FROM entrenamiento_log WHERE usuario_id = ? AND semana = ? AND dia_semana = ?',
                [userId, semanaNum, dia]
            );

            if (existe.length > 0) {
                // Desmarcar
                await pool.query(
                    'DELETE FROM entrenamiento_log WHERE usuario_id = ? AND semana = ? AND dia_semana = ?',
                    [userId, semanaNum, dia]
                );
                return res.json({ ok: true, action: 'removed' });
            } else {
                // Marcar
                await pool.query(
                    'INSERT INTO entrenamiento_log (usuario_id, fecha, dia_semana, semana, completado) VALUES (?, ?, ?, ?, 1)',
                    [userId, fechaStr, dia, semanaNum]
                );
                return res.json({ ok: true, action: 'added' });
            }
        } catch (error) {
            console.error('Error al toggle semana:', error);
            return res.status(500).json({ ok: false, error: 'Error interno' });
        }
    }
};

module.exports = clienteController;
