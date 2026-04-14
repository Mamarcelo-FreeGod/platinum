/**
 * Controlador de Rutinas Predefinidas
 * v3.0: Ejercicios completos con series, reps, descanso, técnica y GIF
 */

// Datos de rutinas predefinidas (hardcoded) — EXPANDIDOS v3.0
const rutinasPredefinidas = {
    pecho: {
        titulo: 'Rutina de Pecho',
        icono: 'bi-heart-pulse-fill',
        bgImage: 'https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?auto=format&fit=crop&w=800&q=80',
        color: '#ef4444',
        descripcion: 'Desarrolla fuerza y masa muscular en el pecho con estos ejercicios fundamentales.',
        ejercicios: [
            {
                nombre: 'Press Plano con Barra',
                series: '4',
                reps: '12',
                descanso: '2-3 min',
                tecnica: 'Acuéstate en el banco plano con los pies firmemente apoyados. Agarra la barra un poco más ancho que los hombros. Baja controladamente hasta el pecho y empuja explosivamente hacia arriba sin bloquear los codos.',
                gif: '/img/rutinas/press plano.gif'
            },
            {
                nombre: 'Press Inclinado con Mancuernas',
                series: '3',
                reps: '10',
                descanso: '2 min',
                tecnica: 'Inclina el banco a 30-45°. Toma las mancuernas con agarre neutro, baja hasta sentir estiramiento en el pecho superior y empuja hacia arriba juntando ligeramente las mancuernas en la parte alta.',
<<<<<<< HEAD
                gif: '/img/rutinas/press-inclinado.gif'
=======
                gif: '/img/rutinas/press inclinado con mancuernas.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Cruce en Polea',
                series: '3',
                reps: '12',
                descanso: '90 seg',
                tecnica: 'De pie entre las poleas altas, da un pequeño paso al frente. Con los codos ligeramente flexionados, cruza los cables frente al pecho contrayendo los pectorales. Controla el regreso lentamente.',
<<<<<<< HEAD
                gif: '/img/rutinas/cruce-polea.gif'
=======
                gif: '/img/rutinas/cruce en polea.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Aperturas con Mancuernas',
                series: '3',
                reps: '12',
                descanso: '90 seg',
                tecnica: 'En banco plano, brazos extendidos arriba con mancuernas. Abre los brazos en arco manteniendo codos ligeramente flexionados hasta sentir estiramiento. Cierra contrayendo el pecho como si abrazaras un árbol.',
<<<<<<< HEAD
                gif: '/img/rutinas/aperturas.gif'
=======
                gif: '/img/rutinas/aperturas con mancuernas.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            }
        ]
    },
    espalda: {
        titulo: 'Rutina de Espalda',
        icono: 'bi-arrow-up-circle-fill',
        bgImage: 'https://images.unsplash.com/photo-1598971639058-fab3c3109a00?auto=format&fit=crop&w=800&q=80',
        color: '#3b82f6',
        descripcion: 'Fortalece tu espalda con estos ejercicios clave para un torso amplio y fuerte.',
        ejercicios: [
            {
                nombre: 'Dominadas',
                series: '4',
                reps: '10',
                descanso: '2-3 min',
                tecnica: 'Cuelga de la barra con agarre prono (palmas al frente), un poco más ancho que los hombros. Retrae las escápulas y jala tu cuerpo hasta pasar la barbilla por encima de la barra. Baja controladamente.',
                gif: '/img/rutinas/dominadas.gif'
            },
            {
                nombre: 'Remo con Barra',
                series: '4',
                reps: '12',
                descanso: '2 min',
                tecnica: 'Inclínate a 45° con rodillas ligeramente flexionadas. Agarra la barra con agarre prono a la anchura de hombros. Jala hacia el abdomen inferior apretando los omóplatos. Baja controladamente sin rebotar.',
<<<<<<< HEAD
                gif: '/img/rutinas/remo-barra.gif'
=======
                gif: '/img/rutinas/remo con barra.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Jalón al Pecho',
                series: '3',
                reps: '12',
                descanso: '90 seg',
                tecnica: 'Sentado en la máquina con muslos asegurados, agarra la barra con agarre amplio. Inclínate ligeramente hacia atrás y tira de la barra hacia el pecho superior, enfocando la contracción en los dorsales.',
<<<<<<< HEAD
                gif: '/img/rutinas/jalon-pecho.gif'
=======
                gif: '/img/rutinas/jalon al pecho.webp'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Remo en Polea Baja',
                series: '3',
                reps: '12',
                descanso: '90 seg',
                tecnica: 'Sentado con espalda recta y pies en la plataforma, agarra el triángulo o barra. Jala hacia el abdomen manteniendo los codos cerca del cuerpo. Estira completamente los brazos al regresar sin redondear la espalda.',
<<<<<<< HEAD
                gif: '/img/rutinas/remo-polea.gif'
=======
                gif: '/img/rutinas/remo en polea baja.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            }
        ]
    },
    brazos: {
        titulo: 'Rutina de Bíceps, Tríceps y Hombro',
        icono: 'bi-lightning-charge-fill',
        bgImage: 'https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?auto=format&fit=crop&w=800&q=80',
        color: '#f59e0b',
        descripcion: 'Trabaja brazos y hombros para un físico completo y proporcionado.',
        ejercicios: [
            {
                nombre: 'Curl con Barra',
                series: '3',
                reps: '12',
                descanso: '90 seg',
                tecnica: 'De pie con pies a la anchura de hombros, agarra la barra con agarre supino. Mantén los codos pegados al cuerpo y flexiona solo los antebrazos. Evita balancear el cuerpo. Baja lentamente.',
<<<<<<< HEAD
                gif: '/img/rutinas/curl-barra.gif'
=======
                gif: '/img/rutinas/curl con barra.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Curl Martillo',
                series: '3',
                reps: '10 por brazo',
                descanso: '60 seg',
                tecnica: 'Con mancuernas en posición neutra (pulgares arriba), flexiona alternando brazos. Mantén los codos pegados al torso y controla tanto la subida como la bajada del peso.',
<<<<<<< HEAD
                gif: '/img/rutinas/curl-martillo.gif'
=======
                gif: '/img/rutinas/curl martillo.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Extensiones de Tríceps en Polea',
                series: '3',
                reps: '12',
                descanso: '60 seg',
                tecnica: 'En la polea alta con barra recta o V, mantén los codos pegados al cuerpo a 90°. Extiende los antebrazos hacia abajo contrayendo los tríceps. No muevas los codos de posición.',
<<<<<<< HEAD
                gif: '/img/rutinas/extension-triceps.gif'
=======
                gif: '/img/rutinas/extensiones de triceps en polea.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Press Militar',
                series: '4',
                reps: '10',
                descanso: '2 min',
                tecnica: 'Sentado con espalda recta, levanta las mancuernas o barra desde los hombros hasta arriba de la cabeza. Extiende completamente los brazos sin bloquear. Baja controladamente hasta la línea de las orejas.',
<<<<<<< HEAD
                gif: '/img/rutinas/press-militar.gif'
=======
                gif: '/img/rutinas/press militar.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Elevaciones Laterales',
                series: '3',
                reps: '15',
                descanso: '60 seg',
                tecnica: 'De pie con mancuernas ligeras a los lados, eleva los brazos lateralmente con codos ligeramente flexionados hasta la altura de los hombros. Baja lentamente. No uses impulso del cuerpo.',
<<<<<<< HEAD
                gif: '/img/rutinas/elevaciones-laterales.gif'
=======
                gif: '/img/rutinas/elevaciones laterales.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            }
        ]
    },
    pierna: {
        titulo: 'Rutina de Pierna Completa',
        icono: 'bi-person-walking',
        bgImage: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?auto=format&fit=crop&w=800&q=80',
        color: '#22c55e',
        descripcion: 'Entrena cuádriceps, isquiotibiales, glúteos y pantorrillas en una sesión completa.',
        ejercicios: [
            {
                nombre: 'Sentadillas con Barra',
                series: '4',
                reps: '12',
                descanso: '2-3 min',
                tecnica: 'Coloca la barra en los trapecios, pies a la anchura de los hombros. Baja como si te sentaras manteniendo la espalda recta y las rodillas alineadas con los pies. Sube empujando desde los talones.',
<<<<<<< HEAD
                gif: '/img/rutinas/sentadillas.gif'
=======
                gif: '/img/rutinas/sentadillas con barra.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Prensa de Pierna',
                series: '4',
                reps: '15',
                descanso: '2 min',
                tecnica: 'Siéntate en la máquina con la espalda pegada al respaldo. Coloca los pies a la anchura de los hombros en la plataforma. Baja controladamente flexionando las rodillas a 90° y empuja sin bloquear.',
<<<<<<< HEAD
                gif: '/img/rutinas/prensa.gif'
=======
                gif: '/img/rutinas/prensa de pierna.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Extensiones de Cuádriceps',
                series: '3',
                reps: '12',
                descanso: '60 seg',
                tecnica: 'Sentado en la máquina con rodillas alineadas al eje de rotación. Extiende las piernas completamente contrayendo los cuádriceps en la parte alta. Baja lentamente sin dejar caer el peso.',
<<<<<<< HEAD
                gif: '/img/rutinas/extensiones-cuadriceps.gif'
=======
                gif: '/img/rutinas/extensiones de cuadriceps.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Curl Femoral',
                series: '3',
                reps: '12',
                descanso: '60 seg',
                tecnica: 'Acostado boca abajo en la máquina, ajusta el rodillo en los tobillos. Flexiona las piernas hacia los glúteos contrayendo los isquiotibiales. Baja controladamente evitando que el peso rebote.',
<<<<<<< HEAD
                gif: '/img/rutinas/curl-femoral.gif'
=======
                gif: '/img/rutinas/curl femoral.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            },
            {
                nombre: 'Elevación de Pantorrillas',
                series: '4',
                reps: '20',
                descanso: '45 seg',
                tecnica: 'De pie en la máquina o en un escalón, sube completamente sobre las puntas de los pies contrayendo las pantorrillas. Mantén 1 segundo arriba y baja estirado por debajo del nivel del escalón.',
<<<<<<< HEAD
                gif: '/img/rutinas/pantorrillas.gif'
=======
                gif: '/img/rutinas/elevacion de pantorrillas.gif'
>>>>>>> 7c44f65b448f5fec62781507395f22655ea37ace
            }
        ]
    }
};

const categorias = [
    { key: 'pecho', ...rutinasPredefinidas.pecho },
    { key: 'espalda', ...rutinasPredefinidas.espalda },
    { key: 'brazos', ...rutinasPredefinidas.brazos },
    { key: 'pierna', ...rutinasPredefinidas.pierna }
];

const rutinasController = {
    /**
     * Página principal de rutinas predefinidas
     */
    index(req, res) {
        res.render('rutinas/index', {
            title: 'Rutinas de Entrenamiento',
            categorias
        });
    },

    /**
     * Detalle de una rutina por tipo
     */
    detalle(req, res) {
        const tipo = req.params.tipo;
        const rutina = rutinasPredefinidas[tipo];

        if (!rutina) {
            req.flash('error', 'Rutina no encontrada');
            return res.redirect('/rutinas');
        }

        res.render('rutinas/detalle', {
            title: rutina.titulo,
            rutina,
            tipo
        });
    }
};

module.exports = rutinasController;
