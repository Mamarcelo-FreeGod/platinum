/**
 * GYM PLATINUM - JavaScript del Cliente
 * Interacciones UI y utilidades
 */
document.addEventListener('DOMContentLoaded', function () {

    // ==================== CONFIRMACIÓN DE ELIMINACIÓN ====================
    const deleteButtons = document.querySelectorAll('.btn-delete');
    deleteButtons.forEach(btn => {
        btn.addEventListener('click', function (e) {
            e.preventDefault();
            const url = this.getAttribute('href');
            if (confirm('¿Estás seguro de que deseas eliminar este elemento? Esta acción no se puede deshacer.')) {
                window.location.href = url;
            }
        });
    });

    // ==================== AUTO-CERRAR ALERTAS ====================
    // Skip alerts marked as persistent (progreso recommendations, etc.)
    const alerts = document.querySelectorAll('.alert:not(.alert-persistent)');
    alerts.forEach(alert => {
        setTimeout(() => {
            const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
            if (bsAlert) {
                alert.classList.remove('show');
                setTimeout(() => alert.remove(), 300);
            }
        }, 5000);
    });

    // ==================== INICIALIZAR TOOLTIPS ====================
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]');
    tooltipTriggerList.forEach(el => {
        new bootstrap.Tooltip(el);
    });

    // ==================== ACTIVE NAV LINK ====================
    const currentPath = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        const href = link.getAttribute('href');
        if (href && currentPath.startsWith(href) && href !== '/') {
            // FIX DEFINITIVO: Evitar la colisión entre 'solicitudes' y 'solicitudes-rutina'
            if (href.endsWith('/solicitudes') && currentPath.includes('/solicitudes-rutina')) {
                return; // Ignorar, no añadir clase active
            }
            link.classList.add('active');
        }
    });

    // ==================== ANIMACIÓN DE NÚMEROS ====================
    const animateNumbers = () => {
        const statsElements = document.querySelectorAll('.stat-card h3, .stat-card h4');
        statsElements.forEach(el => {
            const text = el.textContent;
            // Only animate pure numbers
            if (/^\d+$/.test(text.trim())) {
                const target = parseInt(text);
                let current = 0;
                const increment = Math.ceil(target / 30);
                const timer = setInterval(() => {
                    current += increment;
                    if (current >= target) {
                        current = target;
                        clearInterval(timer);
                    }
                    el.textContent = current;
                }, 30);
            }
        });
    };

    // Run number animations if stats are visible
    if (document.querySelector('.stat-card')) {
        animateNumbers();
    }

});
