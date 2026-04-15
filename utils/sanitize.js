/**
 * Utilidad de Saneamiento (Sanitización) de entradas
 * Previene ataques XSS escapando caracteres HTML peligrosos
 * GYM PLATINUM — Security Patch v1.0
 */

/**
 * Escapa caracteres HTML peligrosos de una cadena
 * Convierte: < > " ' & / ` en sus entidades HTML seguras
 * @param {string} str - Cadena a escapar
 * @returns {string} Cadena segura
 */
function escapeHTML(str) {
    if (typeof str !== 'string') return str;
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;')
        .replace(/`/g, '&#96;');
}

/**
 * Sanitiza un objeto plano escapando todos sus valores string.
 * Útil para sanitizar req.body completo antes de procesarlo.
 * @param {Object} obj - Objeto con valores a sanitizar
 * @param {Array<string>} exclude - Claves a excluir (e.g. 'password')
 * @returns {Object} Objeto con valores escapados
 */
function sanitizeObject(obj, exclude = []) {
    if (!obj || typeof obj !== 'object') return obj;
    const sanitized = {};
    for (const key of Object.keys(obj)) {
        if (exclude.includes(key)) {
            sanitized[key] = obj[key];
        } else if (typeof obj[key] === 'string') {
            sanitized[key] = escapeHTML(obj[key]);
        } else if (Array.isArray(obj[key])) {
            sanitized[key] = obj[key].map(item => 
                typeof item === 'string' ? escapeHTML(item) : item
            );
        } else {
            sanitized[key] = obj[key];
        }
    }
    return sanitized;
}

/**
 * Middleware Express para sanitizar automáticamente req.body
 * Excluye 'password' y 'password2' de la sanitización
 */
function sanitizeMiddleware(req, res, next) {
    if (req.body && typeof req.body === 'object') {
        // Solo sanitizar valores string del primer nivel
        // Excluir passwords y campos que necesiten datos crudos
        const exclude = ['password', 'password2', 'ejercicios', 'rutinas_por_dia'];
        for (const key of Object.keys(req.body)) {
            if (exclude.includes(key)) continue;
            if (typeof req.body[key] === 'string') {
                req.body[key] = escapeHTML(req.body[key]);
            }
        }
    }
    next();
}

module.exports = {
    escapeHTML,
    sanitizeObject,
    sanitizeMiddleware
};
