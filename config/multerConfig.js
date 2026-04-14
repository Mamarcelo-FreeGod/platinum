/**
 * Configuración de Multer para subida de archivos
 * Maneja la subida de GIFs para ejercicios de rutinas
 */
const multer = require('multer');
const path = require('path');

// Configurar almacenamiento
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, path.join(__dirname, '..', 'public', 'img', 'rutinas-personalizadas'));
    },
    filename: function (req, file, cb) {
        // Generar nombre único: timestamp + nombre sanitizado
        const sanitizedName = file.originalname
            .toLowerCase()
            .replace(/[^a-z0-9.]/g, '-')
            .replace(/-+/g, '-');
        const uniqueName = `${Date.now()}-${sanitizedName}`;
        cb(null, uniqueName);
    }
});

// Filtro: solo GIF e imágenes
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/gif', 'image/png', 'image/jpeg', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Solo se permiten archivos GIF, PNG, JPEG o WebP'), false);
    }
};

// Crear instancia de multer
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB máximo
    }
});

module.exports = upload;
