// Ana sayfanın (Türkçe ve İngilizce) ortak betiği. Satır içi değil ayrı dosyada: içerik güvenlik politikası
// (CSP) yalnızca bu siteden gelen betiklere izin verir. Metinler sayfanın diline (<html lang>) göre seçilir.
(() => {
    const english = document.documentElement.lang === 'en';
    const text = english ? {
        files: (code, areas) => `${code} code files · ${areas} source areas`,
        updated: (date) => `Last GitHub update: ${date}`,
        locale: 'en-GB',
        liveFailed: 'Live GitHub data is unavailable right now',
        filesFailed: 'Code coverage is unavailable right now'
    } : {
        files: (code, areas) => `${code} kod dosyası · ${areas} kaynak alanı`,
        updated: (date) => `GitHub son güncelleme: ${date}`,
        locale: 'tr-TR',
        liveFailed: 'Canlı GitHub verisi şu anda alınamadı',
        filesFailed: 'Kod kapsamı şu anda alınamadı'
    };

    const revealItems = document.querySelectorAll('.hero, section, footer');
    const revealObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => revealObserver.observe(item));

    const transitionCanvas = document.getElementById('techTransition');
    const transitionContext = transitionCanvas.getContext('2d');
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let transitionWidth = 0;
    let transitionHeight = 0;
    let transitionAngle = 0;
    function resizeTransitionCanvas() {
        const scale = window.devicePixelRatio || 1;
        const bounds = transitionCanvas.getBoundingClientRect();
        transitionWidth = bounds.width;
        transitionHeight = bounds.height;
        transitionCanvas.width = Math.floor(transitionWidth * scale);
        transitionCanvas.height = Math.floor(transitionHeight * scale);
        transitionContext.setTransform(scale, 0, 0, scale, 0, 0);
    }
    function drawTransition() {
        transitionContext.clearRect(0, 0, transitionWidth, transitionHeight);
        transitionContext.save();
        transitionContext.translate(transitionWidth / 2, transitionHeight / 2);
        transitionContext.rotate(transitionAngle);
        const radius = Math.max(transitionWidth, transitionHeight) * 0.7;
        transitionContext.strokeStyle = 'rgba(88, 166, 255, 0.2)';
        transitionContext.lineWidth = 1;
        for (let ring = 0; ring < 5; ring += 1) {
            transitionContext.beginPath();
            transitionContext.arc(0, 0, radius * (0.35 + ring * 0.14), 0, Math.PI * 2);
            transitionContext.stroke();
        }
        transitionContext.strokeStyle = 'rgba(88, 166, 255, 0.14)';
        for (let ray = 0; ray < 16; ray += 1) {
            const angle = (Math.PI * 2 * ray) / 16;
            transitionContext.beginPath();
            transitionContext.moveTo(Math.cos(angle) * 35, Math.sin(angle) * 35);
            transitionContext.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
            transitionContext.stroke();
        }
        transitionContext.fillStyle = 'rgba(126, 231, 135, 0.65)';
        transitionContext.font = '12px Courier New';
        for (let bit = 0; bit < 24; bit += 1) {
            const angle = (Math.PI * 2 * bit) / 24;
            const distance = radius * (0.42 + (bit % 3) * 0.12);
            transitionContext.fillText(bit % 2 ? '1' : '0', Math.cos(angle) * distance, Math.sin(angle) * distance);
        }
        transitionContext.restore();
        transitionAngle += reducedMotion ? 0 : 0.0009;
        if (!reducedMotion) requestAnimationFrame(drawTransition);
    }
    resizeTransitionCanvas();
    drawTransition();
    window.addEventListener('resize', resizeTransitionCanvas);

    const contactModal = document.getElementById('contact-modal');
    const contactOpen = document.getElementById('contact-open');
    const contactClose = document.getElementById('contact-close');
    const chiefModal = document.getElementById('chief-modal');
    const chiefOpen = document.getElementById('chief-open');
    const chiefClose = document.getElementById('chief-close');
    const chiefUpdated = document.getElementById('chief-updated');
    const chiefFiles = document.getElementById('chief-files');
    const identityModal = document.getElementById('identity-modal');
    const identityOpen = document.getElementById('identity-open');
    const identityClose = document.getElementById('identity-close');

    function closeContactModal() {
        contactModal.classList.remove('is-open');
        contactOpen.focus();
    }

    contactOpen.addEventListener('click', () => {
        contactModal.classList.add('is-open');
        contactClose.focus();
    });
    contactClose.addEventListener('click', closeContactModal);
    identityOpen.addEventListener('click', () => {
        identityModal.classList.add('is-open');
        identityClose.focus();
    });
    identityClose.addEventListener('click', () => {
        identityModal.classList.remove('is-open');
        identityOpen.focus();
    });
    identityModal.addEventListener('click', (event) => {
        if (event.target === identityModal) {
            identityModal.classList.remove('is-open');
            identityOpen.focus();
        }
    });
    contactModal.addEventListener('click', (event) => {
        if (event.target === contactModal) closeContactModal();
    });
    // Açık pencerede Tab / Shift+Tab pencerenin içinde döner; odak arkadaki sayfaya kaçmaz.
    const focusableSelector = 'a[href], button:not([disabled]), input:not([type="hidden"]):not([tabindex="-1"]), textarea, select, [tabindex]:not([tabindex="-1"])';
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Tab') return;
        const openModal = document.querySelector('.contact-modal.is-open');
        if (!openModal) return;
        const focusable = [...openModal.querySelectorAll(focusableSelector)].filter((element) => element.getClientRects().length);
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (!openModal.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        } else if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    });
    document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape' && contactModal.classList.contains('is-open')) {
            closeContactModal();
        }
        if (event.key === 'Escape' && chiefModal.classList.contains('is-open')) {
            chiefModal.classList.remove('is-open');
            chiefOpen.focus();
        }
        if (event.key === 'Escape' && identityModal.classList.contains('is-open')) {
            identityModal.classList.remove('is-open');
            identityOpen.focus();
        }
    });

    // GitHub'dan yalnızca gerçekten ölçülebilen bilgiler gelir: dosya sayısı ve son güncelleme tarihi.
    async function loadChiefStatus() {
        const repo = 'ahmtrntsdln/Chief-Sef';
        const treeResponse = await fetch(`https://api.github.com/repos/${repo}/git/trees/main?recursive=1`);
        if (!treeResponse.ok) throw new Error('Chief kaynak ağacı alınamadı');
        const tree = await treeResponse.json();
        const files = tree.tree.filter((item) => item.type === 'blob');
        const codeFiles = files.filter((item) => /\.(py|cpp|h|hpp|c|sh|js|ts)$/i.test(item.path));
        const directories = new Set(files.map((item) => item.path.split('/')[0]));
        chiefFiles.textContent = text.files(codeFiles.length, directories.size);
        const repoResponse = await fetch(`https://api.github.com/repos/${repo}`);
        if (!repoResponse.ok) throw new Error('Chief depo bilgisi alınamadı');
        const repository = await repoResponse.json();
        chiefUpdated.textContent = text.updated(new Date(repository.pushed_at).toLocaleDateString(text.locale));
    }

    chiefOpen.addEventListener('click', async () => {
        chiefModal.classList.add('is-open');
        chiefClose.focus();
        try {
            await loadChiefStatus();
        } catch (error) {
            chiefUpdated.textContent = text.liveFailed;
            chiefFiles.textContent = text.filesFailed;
        }
    });
    chiefClose.addEventListener('click', () => {
        chiefModal.classList.remove('is-open');
        chiefOpen.focus();
    });
    chiefModal.addEventListener('click', (event) => {
        if (event.target === chiefModal) {
            chiefModal.classList.remove('is-open');
            chiefOpen.focus();
        }
    });
})();
