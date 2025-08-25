(() => {
    const nav    = document.querySelector('.nav');
    const toggle = document.querySelector('.nav__toggle');
    const drawer = document.getElementById('nav-drawer');
    if (!nav || !toggle || !drawer) return;
    
        const open = () => {
        drawer.classList.add('is-open');
        toggle.classList.add('is-open');          // ← activa la cruz
        nav.classList.add('is-overlay');
        toggle.setAttribute('aria-expanded', 'true');
        };
    
        const close = () => {
        drawer.classList.remove('is-open');
        toggle.classList.remove('is-open');       // ← vuelve a hamburguesa
        nav.classList.remove('is-overlay');
        toggle.setAttribute('aria-expanded', 'false');
        };
    
        // Un solo listener para alternar
        toggle.addEventListener('click', () => {
        drawer.classList.contains('is-open') ? close() : open();
        });
    
    // Cerrar al hacer click fuera
    document.addEventListener('click', (e) => {
        if (!drawer.contains(e.target) && !toggle.contains(e.target) && drawer.classList.contains('is-open')) {
        close();
        }
    });

    // Cerrar con ESC
    document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && drawer.classList.contains('is-open')) close();
    });

    // Cerrar al clicar un link del menú
    drawer.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) close();
    });
})();
