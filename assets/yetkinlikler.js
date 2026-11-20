// "Yetkinlikler" bölümü ve yönetici paneli (Türkçe ve İngilizce ana sayfada ortak).
//
// Site statik (GitHub Pages): sunucu yok, şifre doğrulayacak bir yer de yok. Sayfaya gömülü bir şifre
// herkesçe okunabilir, o yüzden giriş anahtarı bir GitHub erişim anahtarıdır (fine-grained personal
// access token, yalnızca bu depoya "Contents: Read and write" izniyle). Yönetici panelindeki her
// değişiklik GitHub API ile doğrudan depoya commit olur; anahtarı olmayan biri hiçbir şey yazamaz.
//
// Veri: data/yetkinlikler.json · Belgeler: assets/belgeler/ · Giriş: alt bilgideki "Build · Secure"
// arasındaki nokta ya da adres çubuğunda #yonetici.
(() => {
    const OWNER = 'ahmtrntsdln';
    const REPO = 'ahmtrntsdln.github.io';
    const BRANCH = 'main';
    const DATA_PATH = 'data/yetkinlikler.json';
    const DOC_DIR = 'assets/belgeler/';
    const MAX_DOC_BYTES = 8 * 1024 * 1024;
    const DOC_TYPES = { 'application/pdf': 'pdf', 'image/png': 'png', 'image/jpeg': 'jpg', 'image/webp': 'webp' };
    const TOKEN_KEY = 'tt-yonetici-anahtari';
    const API = `https://api.github.com/repos/${OWNER}/${REPO}/contents/`;

    const section = document.getElementById('yetkinlikler');
    if (!section) return;
    const root = section.dataset.root || '';
    const english = document.documentElement.lang === 'en';
    const t = english ? {
        locale: 'en-GB',
        empty: 'No competencies added yet. Certificates and documents will appear here as I earn them.',
        loadFailed: 'Competencies could not be loaded right now.',
        viewDoc: 'View document',
        verify: 'Verify',
        edit: 'Edit',
        remove: 'Delete',
        confirmRemove: (title) => `Delete "${title}"? Its document will be removed too.`,
        addTitle: 'Add competency',
        editTitle: 'Edit competency',
        currentDoc: 'Current document:',
        checking: 'Checking key…',
        badOwner: 'This key does not belong to the site owner.',
        badToken: 'Key is invalid or expired.',
        noPush: 'This key has no write access to the site repository.',
        saving: 'Saving…',
        saved: 'Saved. The public site updates in about a minute.',
        deleted: 'Deleted. The public site updates in about a minute.',
        saveFailed: (msg) => `Could not save: ${msg}`,
        tooBig: 'Document must be 8 MB or smaller.',
        badType: 'Document must be a PDF, PNG, JPG or WebP file.',
        badUrl: 'Verification link must start with https://',
        loggedOut: 'Signed out.'
    } : {
        locale: 'tr-TR',
        empty: 'Henüz eklenmiş bir yetkinlik yok. Sertifika ve belgeler aldıkça burada yer alacak.',
        loadFailed: 'Yetkinlikler şu anda yüklenemedi.',
        viewDoc: 'Belgeyi gör',
        verify: 'Doğrula',
        edit: 'Düzenle',
        remove: 'Sil',
        confirmRemove: (title) => `"${title}" silinsin mi? Ekli belgesi de kaldırılacak.`,
        addTitle: 'Yetkinlik ekle',
        editTitle: 'Yetkinliği düzenle',
        currentDoc: 'Mevcut belge:',
        checking: 'Anahtar kontrol ediliyor…',
        badOwner: 'Bu anahtar site sahibine ait değil.',
        badToken: 'Anahtar geçersiz ya da süresi dolmuş.',
        noPush: 'Bu anahtarın site deposuna yazma izni yok.',
        saving: 'Kaydediliyor…',
        saved: 'Kaydedildi. Herkese açık sitede yaklaşık 1 dakika içinde görünür.',
        deleted: 'Silindi. Herkese açık site yaklaşık 1 dakika içinde güncellenir.',
        saveFailed: (msg) => `Kaydedilemedi: ${msg}`,
        tooBig: 'Belge en fazla 8 MB olabilir.',
        badType: 'Belge PDF, PNG, JPG ya da WebP olmalı.',
        badUrl: 'Doğrulama bağlantısı https:// ile başlamalı.',
        loggedOut: 'Çıkış yapıldı.'
    };

    const $ = (id) => document.getElementById(id);
    const list = $('yk-list');
    const emptyNote = $('yk-empty');
    const adminBar = $('yk-admin-bar');
    const adminStatus = $('yk-admin-status');
    const loginModal = $('yk-login-modal');
    const loginForm = $('yk-login-form');
    const loginError = $('yk-login-error');
    const editModal = $('yk-edit-modal');
    const editForm = $('yk-edit-form');
    const editError = $('yk-edit-error');
    const secretDot = $('yk-secret');

    let items = [];
    let token = null;
    let lastFocus = null;

    // ---------- Depolama (gizli pencerede ya da engellenmiş depolamada sessizce çalışmaz) ----------
    function readToken() {
        try { return sessionStorage.getItem(TOKEN_KEY) || localStorage.getItem(TOKEN_KEY); } catch { return null; }
    }
    function storeToken(value, remember) {
        try {
            (remember ? localStorage : sessionStorage).setItem(TOKEN_KEY, value);
        } catch { /* yalnızca bu oturum boyunca bellekte kalır */ }
    }
    function clearToken() {
        try { sessionStorage.removeItem(TOKEN_KEY); localStorage.removeItem(TOKEN_KEY); } catch { /* yok say */ }
    }

    // ---------- Yardımcılar ----------
    function utf8ToBase64(value) {
        const bytes = new TextEncoder().encode(value);
        let binary = '';
        for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
        return btoa(binary);
    }
    function base64ToUtf8(value) {
        const binary = atob(value.replace(/\s/g, ''));
        return new TextDecoder().decode(Uint8Array.from(binary, (c) => c.charCodeAt(0)));
    }
    function fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(String(reader.result).split(',')[1]);
            reader.onerror = () => reject(reader.error);
            reader.readAsDataURL(file);
        });
    }
    function slugify(value) {
        const map = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' };
        return value.toLocaleLowerCase('tr-TR').replace(/[çğıöşü]/g, (c) => map[c])
            .normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'belge';
    }
    const safeDoc = (path) => typeof path === 'string' && /^assets\/belgeler\/[a-z0-9._-]+$/.test(path);
    const safeUrl = (url) => typeof url === 'string' && /^https:\/\/[^\s]+$/i.test(url);
    function formatDate(value) {
        if (!/^\d{4}-\d{2}(-\d{2})?$/.test(value || '')) return '';
        const [y, m, d] = value.split('-').map(Number);
        const options = d ? { day: 'numeric', month: 'long', year: 'numeric' } : { month: 'long', year: 'numeric' };
        return new Date(Date.UTC(y, m - 1, d || 1)).toLocaleDateString(t.locale, { ...options, timeZone: 'UTC' });
    }
    function el(tag, className, textValue) {
        const node = document.createElement(tag);
        if (className) node.className = className;
        if (textValue) node.textContent = textValue;
        return node;
    }

    // ---------- Görüntüleme (yalnızca textContent: veriden gelen metin HTML olarak yorumlanmaz) ----------
    function render() {
        list.replaceChildren();
        const sorted = [...items].sort((a, b) => String(b.tarih || '').localeCompare(String(a.tarih || '')));
        sorted.forEach((item) => {
            const card = el('article', 'card yk-card');
            const meta = [item.kurum, formatDate(item.tarih)].filter(Boolean).join(' · ');
            if (meta) card.append(el('span', 'note-kicker', meta));
            card.append(el('h3', '', item.baslik));
            if (item.aciklama) card.append(el('p', '', item.aciklama));
            if (safeDoc(item.belge) && item.belgeTuru !== 'pdf') {
                const img = el('img', 'yk-thumb');
                img.src = root + item.belge;
                img.alt = item.baslik;
                img.loading = 'lazy';
                card.append(img);
            }
            const actions = el('div', 'project-actions');
            if (safeDoc(item.belge)) {
                const a = el('a', 'project-button', t.viewDoc);
                a.href = root + item.belge;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                actions.append(a);
            }
            if (safeUrl(item.dogrulama)) {
                const a = el('a', 'project-button', t.verify);
                a.href = item.dogrulama;
                a.target = '_blank';
                a.rel = 'noopener noreferrer';
                actions.append(a);
            }
            if (token) {
                const editBtn = el('button', 'project-button yk-admin-btn', t.edit);
                editBtn.type = 'button';
                editBtn.addEventListener('click', () => openEdit(item));
                const delBtn = el('button', 'project-button yk-admin-btn yk-danger', t.remove);
                delBtn.type = 'button';
                delBtn.addEventListener('click', () => removeItem(item));
                actions.append(editBtn, delBtn);
            }
            if (actions.childElementCount) card.append(actions);
            list.append(card);
        });
        emptyNote.hidden = items.length > 0;
    }

    async function loadPublic() {
        try {
            const response = await fetch(`${root}${DATA_PATH}`, { cache: 'no-cache' });
            if (!response.ok) throw new Error(response.status);
            const data = await response.json();
            items = Array.isArray(data.yetkinlikler) ? data.yetkinlikler : [];
        } catch {
            items = [];
            emptyNote.textContent = t.loadFailed;
        }
        render();
    }

    // ---------- GitHub API ----------
    async function gh(path, options = {}) {
        const response = await fetch(path.startsWith('https://') ? path : API + path, {
            ...options,
            cache: 'no-store',
            headers: {
                Accept: 'application/vnd.github+json',
                Authorization: `Bearer ${token}`,
                'X-GitHub-Api-Version': '2022-11-28',
                ...(options.body ? { 'Content-Type': 'application/json' } : {})
            }
        });
        if (!response.ok) {
            let message = `${response.status}`;
            try { message += ` ${(await response.json()).message}`; } catch { /* gövde yok */ }
            const error = new Error(message);
            error.status = response.status;
            throw error;
        }
        return response.status === 204 ? null : response.json();
    }
    async function loadFromRepo() {
        const file = await gh(`${DATA_PATH}?ref=${BRANCH}`);
        const data = JSON.parse(base64ToUtf8(file.content));
        return { list: Array.isArray(data.yetkinlikler) ? data.yetkinlikler : [], sha: file.sha };
    }
    // Her yazmadan hemen önce dosyanın güncel hâli okunur; başka bir sekmede yapılan değişiklik ezilmez.
    async function mutate(change, message) {
        const current = await loadFromRepo();
        const next = change(current.list);
        const body = JSON.stringify({ yetkinlikler: next }, null, 2) + '\n';
        await gh(DATA_PATH, {
            method: 'PUT',
            body: JSON.stringify({ message, content: utf8ToBase64(body), sha: current.sha, branch: BRANCH })
        });
        items = next;
        render();
    }
    async function uploadDoc(file, title) {
        const ext = DOC_TYPES[file.type];
        const path = `${DOC_DIR}${Date.now()}-${slugify(title)}.${ext}`;
        await gh(path, {
            method: 'PUT',
            body: JSON.stringify({ message: `Yetkinlik belgesi: ${title}`, content: await fileToBase64(file), branch: BRANCH })
        });
        return { belge: path, belgeTuru: ext === 'pdf' ? 'pdf' : 'image' };
    }
    async function deleteDoc(path, title) {
        if (!safeDoc(path)) return;
        try {
            const file = await gh(`${path}?ref=${BRANCH}`);
            await gh(path, {
                method: 'DELETE',
                body: JSON.stringify({ message: `Yetkinlik belgesi kaldırıldı: ${title}`, sha: file.sha, branch: BRANCH })
            });
        } catch { /* belge zaten yoksa sorun değil */ }
    }

    // ---------- Giriş / çıkış ----------
    async function verify(candidate) {
        token = candidate;
        try {
            const user = await gh('https://api.github.com/user');
            if (String(user.login).toLowerCase() !== OWNER) throw new Error(t.badOwner);
            const repo = await gh(`https://api.github.com/repos/${OWNER}/${REPO}`);
            if (repo.permissions && repo.permissions.push === false) throw new Error(t.noPush);
            return true;
        } catch (error) {
            token = null;
            throw error.status === 401 ? new Error(t.badToken) : error;
        }
    }
    async function enterAdmin() {
        adminBar.hidden = false;
        section.classList.add('yk-is-admin');
        try {
            items = (await loadFromRepo()).list;
        } catch { /* herkese açık kopya zaten yüklü */ }
        render();
    }
    function logout() {
        token = null;
        clearToken();
        adminBar.hidden = true;
        section.classList.remove('yk-is-admin');
        render();
        setStatus(t.loggedOut);
    }
    function setStatus(message) {
        adminStatus.textContent = message || '';
    }

    function openModal(modal, focusTarget) {
        lastFocus = document.activeElement;
        modal.classList.add('is-open');
        focusTarget.focus();
    }
    function closeModal(modal) {
        modal.classList.remove('is-open');
        if (lastFocus && lastFocus.focus) lastFocus.focus();
    }
    [loginModal, editModal].forEach((modal) => {
        modal.addEventListener('click', (event) => { if (event.target === modal) closeModal(modal); });
        modal.querySelector('.modal-close').addEventListener('click', () => closeModal(modal));
    });
    document.addEventListener('keydown', (event) => {
        if (event.key !== 'Escape') return;
        [loginModal, editModal].forEach((modal) => { if (modal.classList.contains('is-open')) closeModal(modal); });
    });

    function openLogin() {
        if (token) {
            section.scrollIntoView({ behavior: 'smooth' });
            return;
        }
        loginError.textContent = '';
        loginForm.reset();
        openModal(loginModal, $('yk-token'));
    }
    secretDot.addEventListener('click', openLogin);
    if (location.hash === '#yonetici' || location.hash === '#admin') {
        history.replaceState(null, '', location.pathname + location.search);
        openLogin();
    }

    loginForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const candidate = $('yk-token').value.trim();
        if (!candidate) return;
        loginError.textContent = t.checking;
        try {
            await verify(candidate);
            storeToken(candidate, $('yk-remember').checked);
            loginForm.reset();
            closeModal(loginModal);
            await enterAdmin();
            section.scrollIntoView({ behavior: 'smooth' });
        } catch (error) {
            loginError.textContent = error.message;
        }
    });
    $('yk-logout').addEventListener('click', logout);

    // ---------- Ekle / düzenle / sil ----------
    let editing = null;
    function openEdit(item) {
        editing = item || null;
        editForm.reset();
        editError.textContent = '';
        $('yk-edit-title').textContent = item ? t.editTitle : t.addTitle;
        $('yk-f-baslik').value = item ? item.baslik || '' : '';
        $('yk-f-kurum').value = item ? item.kurum || '' : '';
        $('yk-f-tarih').value = item && /^\d{4}-\d{2}-\d{2}$/.test(item.tarih || '') ? item.tarih
            : item && /^\d{4}-\d{2}$/.test(item.tarih || '') ? `${item.tarih}-01` : '';
        $('yk-f-aciklama').value = item ? item.aciklama || '' : '';
        $('yk-f-dogrulama').value = item ? item.dogrulama || '' : '';
        const current = $('yk-current-doc');
        current.hidden = !(item && safeDoc(item.belge));
        if (!current.hidden) {
            const link = $('yk-current-doc-link');
            link.href = root + item.belge;
            link.textContent = item.belge.slice(DOC_DIR.length);
        }
        openModal(editModal, $('yk-f-baslik'));
    }
    $('yk-add').addEventListener('click', () => openEdit(null));

    editForm.addEventListener('submit', async (event) => {
        event.preventDefault();
        const submit = editForm.querySelector('button[type="submit"]');
        const title = $('yk-f-baslik').value.trim();
        const link = $('yk-f-dogrulama').value.trim();
        const file = $('yk-f-belge').files[0];
        const dropDoc = $('yk-f-belge-kaldir').checked;
        if (!title) return;
        if (link && !safeUrl(link)) { editError.textContent = t.badUrl; return; }
        if (file && !DOC_TYPES[file.type]) { editError.textContent = t.badType; return; }
        if (file && file.size > MAX_DOC_BYTES) { editError.textContent = t.tooBig; return; }

        submit.disabled = true;
        editError.textContent = t.saving;
        const previousDoc = editing && safeDoc(editing.belge) ? editing.belge : null;
        try {
            let doc = previousDoc && !dropDoc ? { belge: previousDoc, belgeTuru: editing.belgeTuru } : { belge: null, belgeTuru: null };
            if (file) doc = await uploadDoc(file, title);
            const entry = {
                id: editing ? editing.id : `${Date.now().toString(36)}-${slugify(title)}`,
                baslik: title,
                kurum: $('yk-f-kurum').value.trim(),
                tarih: $('yk-f-tarih').value,
                aciklama: $('yk-f-aciklama').value.trim(),
                dogrulama: link,
                ...doc
            };
            const id = entry.id;
            await mutate(
                (current) => (current.some((x) => x.id === id) ? current.map((x) => (x.id === id ? entry : x)) : [...current, entry]),
                `Yetkinlik ${editing ? 'güncellendi' : 'eklendi'}: ${title}`
            );
            if (previousDoc && previousDoc !== entry.belge) await deleteDoc(previousDoc, title);
            closeModal(editModal);
            setStatus(t.saved);
        } catch (error) {
            if (error.status === 401) logout();
            editError.textContent = t.saveFailed(error.message);
        } finally {
            submit.disabled = false;
        }
    });

    async function removeItem(item) {
        if (!window.confirm(t.confirmRemove(item.baslik))) return;
        setStatus(t.saving);
        try {
            await mutate((current) => current.filter((x) => x.id !== item.id), `Yetkinlik silindi: ${item.baslik}`);
            await deleteDoc(item.belge, item.baslik);
            setStatus(t.deleted);
        } catch (error) {
            if (error.status === 401) logout();
            setStatus(t.saveFailed(error.message));
        }
    }

    // ---------- Başlangıç ----------
    loadPublic().then(async () => {
        const saved = readToken();
        if (!saved) return;
        try {
            await verify(saved);
            await enterAdmin();
        } catch {
            clearToken();
        }
    });
})();
