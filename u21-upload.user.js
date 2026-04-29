// ==UserScript==
// @name         BuzzerBeater U21 Tools Combined Secure Managers
// @namespace    http://tampermonkey.net/
// @version      6.1
// @description  Sichere rollenbasierte U21 Suite: Rolle wird serverseitig per Token geprüft
// @match        https://www.buzzerbeater.com/player/*
// @match        https://buzzerbeater.com/player/*
// @match        https://www.buzzerbeater.com/community/bbmail.aspx*
// @match        https://buzzerbeater.com/community/bbmail.aspx*
// @grant        GM_setClipboard
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        // NEU: Role Access WebApp + persönlicher Token
        accessWebAppUrl: 'https://script.google.com/macros/s/AKfycbyJCLWtdHI2gOrFXbhWOXFAMhQwrv9C2Y1n4eV19kw7Z72VM2Tq39T7C21FO91J1INBtg/exec',
        accessToken: '',
        accessOwner: '',

        uploadWebAppUrl: 'https://script.google.com/macros/s/AKfycbxP5ibVZZVnnkvP_V_ctkenN0xiGRx-Q1cZ_aVczRU6_KnJgQjnUK2bfcCCdwKdhEVJ/exec',
        trainingWebAppUrl: 'https://script.google.com/macros/s/AKfycbxU_WJKLnQxzOS0C6F085LJUhI9fy_rN9yC-gfQh9SXzPbV3lKoxlw2RELFPDJc39zl/exec',
        scoutingWebAppUrl: 'https://script.google.com/macros/s/AKfycbwymkU4B55UWKn38GH1CT-nv64uM5cPPzNzTbvJaly4bcwAA5Oksw_w0fwJeA-0d-o_/exec',
        exportWebAppUrl: 'https://script.google.com/macros/s/AKfycbySrmbfomj9y2yLxaPCj06p-zX-rj2WUXr-hsV2rFm_SLEdTCNFxi36fE0PCofiNK0n/exec',
        managerLanguageWebAppUrl: 'https://script.google.com/macros/s/AKfycbx9q49TTyVIUU6Cp5zfqsSLmbcSIVmPigULUseS7qDRyL6T0nkzdGLdhMLW2_cZ0z-A/exec',

        scoutingStorageKey: 'bb_u21_combined_scouting_v60',
        messageStorageKey: 'bb_u21_combined_message_v60',
        requestTimeoutMs: 30000,
        initDelayMs: 300,
        trainingPanelWidth: 430
    };

    let CURRENT_ROLE = 'manager';
    let ACCESS_TRUSTED = false;

    let FEATURES = {
        upload: true,
        scoutInfo: true,
        lastUpdate: true,
        trainingSuggestion: true,
        exportOtherCountries: false,
        messages: false,
        scoutingWorkflow: false,
        managerLanguage: false
    };

    const SWISS_ALIASES = ['schweiz', 'switzerland', 'suisse', 'svizzera', 'svizra'];

    const SKILL_LABELS = {
        SW: ['sprungwurf', 'jump shot', 'tir en suspension', 'tiro in sosp.', 'tiro in sospensione'],
        RW: ['reichweite', 'jump range', 'portée shoot', 'distanza di tiro'],
        AV: ['außenvert.', 'aussenvert.', 'outside defense', 'outside def.', 'déf. extérieure', 'défense extérieure', 'dif. perimetrale', 'difesa perimetrale'],
        DRI: ['dribbeln', 'handling', 'dribble', 'dextérité', 'palleggio'],
        ZZK: ['zug zum korb', 'driving', 'pénétration', 'penetrazione'],
        PAS: ['passspiel', 'passing', 'passe', 'passaggio'],
        ZW: ['zonenwurf', 'inside shot', 'shot intérieur', 'tiro da sotto'],
        IV: ['innenvert.', 'innenvert', 'inside defense', 'inside def.', 'déf. intérieure', 'défense intérieure', 'dif. in area', 'difesa in area'],
        REB: ['rebounds', 'rebound', 'rebounding', 'rebond', 'rimbalzo'],
        BLO: ['blocken', 'shot blocking', 'contre', 'stoppata'],
        KON: ['kondition', 'stamina', 'endurance', 'resistenza'],
        FW: ['freiwurf', 'free throw', 'lancer franc', 'tiri liberi'],
        XP: ['erfahrung', 'experience', 'expérience', 'esperienza']
    };

    const SKILL_ORDER = ['SW', 'RW', 'AV', 'DRI', 'ZZK', 'PAS', 'ZW', 'IV', 'REB', 'BLO', 'KON', 'FW', 'XP'];

    const TRAINING_TARGET_ALIASES = {
        SW: 'SW', RW: 'RW', AV: 'AV', DRI: 'DRI', ZzK: 'ZZK', ZZK: 'ZZK', PAS: 'PAS', ZW: 'ZW', IV: 'IV', REB: 'REB', BLO: 'BLO', KON: 'KON', FW: 'FW',
        JS: 'SW', JR: 'RW', OD: 'AV', Han: 'DRI', DR: 'ZZK', Pas: 'PAS', IS: 'ZW', ID: 'IV', Reb: 'REB', SB: 'BLO', Sta: 'KON', FT: 'FW',
        PS: 'RW', DE: 'AV', Dex: 'DRI', Dr: 'ZZK', SI: 'ZW', DI: 'IV', CTR: 'BLO', End: 'KON', LF: 'FW',
        TSos: 'SW', DT: 'RW', DifP: 'AV', Pal: 'DRI', Pen: 'ZZK', TdS: 'ZW', DifA: 'IV', Rim: 'REB', Stp: 'BLO', Res: 'KON', TL: 'FW'
    };

   const MESSAGE_TEMPLATES = ['NEW', 'Draft', 'Discord', 'U21-Upload'];

    const LANGUAGE_BUTTONS = [
        { code: 'DE', color: '#1565c0' },
        { code: 'ENG', color: '#2e7d32' },
        { code: 'FRA', color: '#6a1b9a' },
        { code: 'IT', color: '#ef6c00' }
    ];

    const UPLOAD_TEXTS = {
        de: { playerDetected: 'Spieler erkannt:', scout: 'Scout:', lastUpdateLoading: 'Letztes Update wird geladen ...', lastUpdate: 'Letztes Update:', notFound: 'nicht gefunden', onlySwiss: 'Dieses Tool ist nur für Schweizer Spieler bis 21 Jahre gedacht.', noSkills: 'Keine Skills sichtbar - Update nicht möglich.', uploadButton: 'Upload to Database', uploadToast: 'Upload:', uploadSuccessUpdated: '✅ Datenbank aktualisiert:', uploadSuccessInserted: '✅ Datenbank neu gespeichert:', uploadOnlySwiss: 'Nur für Schweizer Spieler bis 21 Jahre gedacht.', uploadFailed: 'Upload fehlgeschlagen:', unknownPlayer: 'Unbekannt', languageLoading: 'Sprache wird geladen ...', languageLabel: 'Sprache:' },
        en: { playerDetected: 'Player detected:', scout: 'Scout:', lastUpdateLoading: 'Last update is loading ...', lastUpdate: 'Last update:', notFound: 'not found', onlySwiss: 'This tool is only intended for Swiss players up to 21 years old.', noSkills: 'No skills visible - update not possible.', uploadButton: 'Upload to Database', uploadToast: 'Upload:', uploadSuccessUpdated: '✅ Database updated:', uploadSuccessInserted: '✅ Saved to database:', uploadOnlySwiss: 'Only intended for Swiss players up to 21 years old.', uploadFailed: 'Upload failed:', unknownPlayer: 'Unknown', languageLoading: 'Language loading ...', languageLabel: 'Language:' },
        fr: { playerDetected: 'Joueur détecté :', scout: 'Scout :', lastUpdateLoading: 'Dernière mise à jour en cours de chargement ...', lastUpdate: 'Dernière mise à jour :', notFound: 'introuvable', onlySwiss: 'Cet outil est uniquement destiné aux joueurs suisses jusqu’à 21 ans.', noSkills: 'Aucune compétence visible - mise à jour impossible.', uploadButton: 'Upload to Database', uploadToast: 'Téléversement :', uploadSuccessUpdated: '✅ Base de données mise à jour :', uploadSuccessInserted: '✅ Enregistré dans la base :', uploadOnlySwiss: 'Uniquement pour les joueurs suisses jusqu’à 21 ans.', uploadFailed: 'Échec du téléversement :', unknownPlayer: 'Inconnu', languageLoading: 'Langue en chargement ...', languageLabel: 'Langue :' },
        it: { playerDetected: 'Giocatore rilevato:', scout: 'Scout:', lastUpdateLoading: 'Ultimo aggiornamento in caricamento ...', lastUpdate: 'Ultimo aggiornamento:', notFound: 'non trovato', onlySwiss: 'Questo strumento è destinato solo a giocatori svizzeri fino a 21 anni.', noSkills: 'Nessuna skill visibile - aggiornamento non possibile.', uploadButton: 'Upload to Database', uploadToast: 'Upload:', uploadSuccessUpdated: '✅ Database aggiornato:', uploadSuccessInserted: '✅ Salvato nel database:', uploadOnlySwiss: 'Solo per giocatori svizzeri fino a 21 anni.', uploadFailed: 'Upload fallito:', unknownPlayer: 'Sconosciuto', languageLoading: 'Lingua in caricamento ...', languageLabel: 'Lingua:' }
    };

    const TRAINING_TEXTS = {
        de: { title: 'Trainingsvorschlag', loading: 'Trainingsvorschlag wird geladen ...', profile: 'Spielerprofil', noProfile: 'kein Spielerprofil hinterlegt, Scout kontaktieren', progress: 'Fortschritt', goalsDone: 'Ziele erfüllt', goals: 'Trainingsziele', noPlan: 'Kein Trainingsplan gefunden', done: 'erfüllt', popsLeft: 'Pops fehlen', tipLabel: 'Tipp', noteLabel: 'Hinweis', tipFw: 'FW kann durch Trainingsplatz verbessert werden', tipMinutes: 'Für optimale Form 50-70 min Spielzeit pro Woche anstreben', noteContact: 'Scout kontaktieren empfohlen', noteContactAt: 'Scout kontaktieren ab 50% Fortschritt', onlyU21: 'Trainingsvorschlag nur verfügbar für Schweizer Spieler bis 21 Jahre.' },
        en: { title: 'Training suggestion', loading: 'Training suggestion is loading ...', profile: 'Player profile', noProfile: 'no player profile assigned, contact scout', progress: 'Progress', goalsDone: 'goals completed', goals: 'Training goals', noPlan: 'No training plan found', done: 'completed', popsLeft: 'pops missing', tipLabel: 'Tip', noteLabel: 'Note', tipFw: 'FT can be improved through the training court', tipMinutes: 'For optimal form, aim for 50-70 minutes of playing time per week', noteContact: 'Contacting the scout is recommended', noteContactAt: 'Contact scout from 50% progress', onlyU21: 'Training suggestion only available for Swiss players up to 21 years old.' },
        fr: { title: 'Suggestion d’entraînement', loading: 'Suggestion d’entraînement en cours de chargement ...', profile: 'Profil du joueur', noProfile: 'aucun profil joueur défini, contacter le scout', progress: 'Progression', goalsDone: 'objectifs atteints', goals: 'Objectifs d’entraînement', noPlan: 'Aucun plan d’entraînement trouvé', done: 'atteint', popsLeft: 'pops manquants', tipLabel: 'Conseil', noteLabel: 'Remarque', tipFw: 'LF peut être amélioré avec le terrain d’entraînement', tipMinutes: 'Pour une forme optimale, viser 50-70 minutes de temps de jeu par semaine', noteContact: 'Il est recommandé de contacter le scout', noteContactAt: 'Contacter le scout à partir de 50% de progression', onlyU21: 'Suggestion d’entraînement disponible uniquement pour les joueurs suisses jusqu’à 21 ans.' },
        it: { title: 'Suggerimento allenamento', loading: 'Suggerimento allenamento in caricamento ...', profile: 'Profilo giocatore', noProfile: 'nessun profilo giocatore inserito, contattare lo scout', progress: 'Progresso', goalsDone: 'obiettivi completati', goals: 'Obiettivi di allenamento', noPlan: 'Nessun piano di allenamento trovato', done: 'completato', popsLeft: 'pop mancanti', tipLabel: 'Consiglio', noteLabel: 'Nota', tipFw: 'TL può essere migliorato con il campo di allenamento', tipMinutes: 'Per una forma ottimale, puntare a 50-70 minuti di gioco a settimana', noteContact: 'Si consiglia di contattare lo scout', noteContactAt: 'Contattare lo scout dal 50% di progresso', onlyU21: 'Suggerimento allenamento disponibile solo per giocatori svizzeri fino a 21 anni.' }
    };

    function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }
    function text(value) { return String(value || '').replace(/\s+/g, ' ').trim(); }
    function normalize(value) { return text(value).toLowerCase(); }
    function normalizeLabel(value) { return normalize(value).replace(/:\s*$/, ''); }
    function cleanPlayerName(value) { return text(value).replace(/\(\d+\)/g, '').trim(); }
    function toInt(value) { const n = parseInt(String(value || '').trim(), 10); return Number.isNaN(n) ? null : n; }
    function escapeHtml(value) { return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;'); }
    function getBodyText(doc = document) { return doc && doc.body ? String(doc.body.innerText || doc.body.textContent || '') : ''; }
    function isPlayerPage() { return /\/player\//i.test(window.location.pathname); }
    function isMailCreatePage() { return /bbmail\.aspx/i.test(window.location.pathname) && /showType=create/i.test(window.location.search); }

    function detectUiLanguage() {
        const body = getBodyText();
        if (/Alter\s*:/i.test(body) || /Besitzer\s*:/i.test(body) || /Gehalt/i.test(body) || /Potenzial\s*:/i.test(body)) return 'de';
        if (/Âge\s*:/i.test(body) || /Propriétaire\s*:/i.test(body) || /Salaire/i.test(body) || /Potentiel\s*:/i.test(body)) return 'fr';
        if (/Età\s*:/i.test(body) || /Proprietario\s*:/i.test(body) || /Stipendio/i.test(body) || /Potenziale\s*:/i.test(body)) return 'it';
        if (/Age\s*:/i.test(body) || /Owner\s*:/i.test(body) || /Salary/i.test(body) || /Potential\s*:/i.test(body)) return 'en';
        return 'en';
    }

    function uiLang() { return detectUiLanguage(); }
    function uploadText(key) { return UPLOAD_TEXTS[uiLang()]?.[key] || UPLOAD_TEXTS.en[key] || key; }
    function trainingText() { return TRAINING_TEXTS[uiLang()] || TRAINING_TEXTS.en; }

    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;
        Object.assign(toast.style, { position: 'fixed', top: '20px', right: '20px', zIndex: '99999', background: isError ? '#b71c1c' : '#333', color: '#fff', padding: '10px 14px', borderRadius: '8px', fontSize: '14px', boxShadow: '0 2px 10px rgba(0,0,0,0.3)', maxWidth: '340px', lineHeight: '1.35' });
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function gmPostJson(url, payload, { rejectOnError = true } = {}) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST', url, headers: { 'Content-Type': 'application/json' }, data: JSON.stringify(payload), timeout: CONFIG.requestTimeoutMs,
                onload(response) {
                    try {
                        if (response.status < 200 || response.status >= 300) throw new Error(`HTTP ${response.status}`);
                        const data = JSON.parse(response.responseText || '{}');
                        if (rejectOnError && !data.ok) throw new Error(data.error || 'Unbekannter Fehler.');
                        resolve(data);
                    } catch (err) {
                        if (rejectOnError) reject(err);
                        else resolve({ ok: false, error: String(err?.message || err) });
                    }
                },
                ontimeout() { const err = new Error('Zeitüberschreitung beim Verbinden mit Google Script.'); rejectOnError ? reject(err) : resolve({ ok: false, error: err.message }); },
                onerror() { const err = new Error('Verbindung fehlgeschlagen.'); rejectOnError ? reject(err) : resolve({ ok: false, error: err.message }); }
            });
        });
    }

   async function loadAccess() {
    if (!CONFIG.accessWebAppUrl || CONFIG.accessWebAppUrl.includes('DEINE_ROLE_WEBAPP_URL')) return;

    const teamName = CONFIG.accessOwner || getTeamName();

    const data = await gmPostJson(CONFIG.accessWebAppUrl, {
        action: 'getAccess',
        teamName,
        accessToken: CONFIG.accessToken || ''
    }, { rejectOnError: false });
       console.log('[U21 ACCESS CHECK]', {
    teamName,
    accessOwner: CONFIG.accessOwner,
    tokenUsed: CONFIG.accessToken,
    response: data
});

    if (!data?.ok || !data.features) return;

    CURRENT_ROLE = data.role || 'manager';
    ACCESS_TRUSTED = !!data.trusted;

    FEATURES = {
        upload: !!data.features.upload,
        scoutInfo: !!data.features.scoutInfo,
        lastUpdate: !!data.features.lastUpdate,
        trainingSuggestion: !!data.features.trainingSuggestion,
        exportOtherCountries: !!data.features.exportOtherCountries,
        messages: !!data.features.messages,
        scoutingWorkflow: !!data.features.scoutingWorkflow,
        managerLanguage: !!data.features.managerLanguage
    };
}
    function getPlayerId() {
    const hidden = document.getElementById('cphContent_hdnPlayerID');
    if (hidden && hidden.value) return String(hidden.value).trim();

    const match = String(window.location.href).match(/playerid=(\d+)/i);
    return match ? match[1] : '';
}
    function getPlayerName() {
        const selectors = ['.boxheader a[href*="/player/"]', '#cphContent_lblPlayerName a', '#cphContent_playerName a'];
        for (const selector of selectors) { const name = cleanPlayerName(document.querySelector(selector)?.textContent); if (name) return name; }
        for (const link of document.querySelectorAll('a[href*="/player/"]')) { const raw = text(link.textContent); if (/\(\d{6,}\)/.test(raw)) return cleanPlayerName(raw); }
        for (const line of getBodyText().split('\n').map(text).filter(Boolean)) { if (/\(\d{6,}\)/.test(line)) return cleanPlayerName(line); }
        return '';
    }

    function getPlayerAge() {
        const body = getBodyText();
        const match = body.match(/Alter:\s*(\d+)/i) || body.match(/Age:\s*(\d+)/i) || body.match(/Âge\s*:\s*(\d+)/i) || body.match(/Età\s*:\s*(\d+)/i);
        return match ? String(parseInt(match[1], 10)) : '';
    }

    function getPlayerAgeNumber() { const age = parseInt(getPlayerAge(), 10); return Number.isNaN(age) ? null : age; }

    function getManagerName() {
        const body = getBodyText();
        const match = body.match(/Besitzer:\s*([^\n]+)/i) || body.match(/Owner:\s*([^\n]+)/i) || body.match(/Propriétaire\s*:\s*([^\n]+)/i) || body.match(/Proprietario\s*:\s*([^\n]+)/i);
        return match ? text(match[1]) : '';
    }

    function getCountryName() {
        const mainFlag = document.getElementById('cphContent_nationalFlag');
        const mainTitle = text(mainFlag?.getAttribute('title'));
        if (mainTitle) return mainTitle;
        for (const img of document.querySelectorAll('img[src*="/flags/"]')) { const title = text(img.getAttribute('title')); if (title) return title; }
        return '';
    }

    function getCountryFlagHtml() { const flag = document.getElementById('cphContent_nationalFlag') || document.querySelector('img[src*="/flags/"]'); return flag?.src ? `<img src="${escapeHtml(flag.src)}" style="height:12px; vertical-align:middle; margin-left:4px;">` : ''; }
    function getTeamLink() { return document.getElementById('cphContent_teamName'); }
    function getTeamName() { return text(getTeamLink()?.textContent); }
    function getTeamOverviewUrl() { const href = text(getTeamLink()?.getAttribute('href')); return href ? new URL(href, window.location.origin).href : ''; }
    function getPlayerLink() { return window.location.href.split('#')[0]; }
    function isSwissCountryName(countryName) { return SWISS_ALIASES.includes(normalize(countryName)); }
    function isSwissPlayer() { return isSwissCountryName(getCountryName()); }
    function isEligibleU21(country = getCountryName(), age = getPlayerAge()) { const n = parseInt(age, 10); return isSwissCountryName(country) && !Number.isNaN(n) && n <= 21; }
    function isEligibleForSwissU21Scouting() { const age = getPlayerAgeNumber(); return age !== null && age <= 21 && isSwissPlayer(); }

    function extractSkillNumber(value) { const match = String(value || '').match(/\((\d+)\)/); return match ? match[1] : ''; }

    function buildSkillMap() {
        const map = new Map();
        document.querySelectorAll('td').forEach(td => {
            const txt = String(td.innerText || td.textContent || '').trim();
            if (!txt.includes(':') || !/\(\d+\)/.test(txt)) return;
            const label = normalizeLabel(txt.split(':')[0]);
            const value = extractSkillNumber(txt);
            if (label && value) map.set(label, value);
        });
        return map;
    }

    function getSkillByLabels(skillMap, labels) {
        for (const label of labels) { const value = skillMap.get(normalizeLabel(label)); if (value !== undefined && value !== '') return value; }
        return '';
    }

    function collectSkills() { const skillMap = buildSkillMap(); return SKILL_ORDER.map(key => getSkillByLabels(skillMap, SKILL_LABELS[key])); }
    function hasVisibleSkills() { try { const skills = collectSkills(); return Array.isArray(skills) && skills.length === SKILL_ORDER.length && skills.every(v => String(v || '').trim() !== ''); } catch { return false; } }
    function getCurrentSkillMap() { const skills = collectSkills(); return Object.fromEntries(SKILL_ORDER.map((key, index) => [key, toInt(skills[index])])); }

   function buildUploadPayload() {
    const payload = {
        playerId: getPlayerId(),
        name: getPlayerName(),
        age: getPlayerAge(),
        link: getPlayerLink(),
        country: getCountryName(),
        managerName: getManagerName(),
        skills: collectSkills(),
        accessToken: CONFIG.accessToken || ''
    };
    validatePayload(payload);
    return payload;
}
    function buildScoutingPayload() {
    const payload = {
        playerId: getPlayerId(),
        name: getPlayerName(),
        age: getPlayerAge(),
        skills: collectSkills(),
        accessToken: CONFIG.accessToken || ''
    };
    validatePayload(payload, false);
    return payload;
}
    function buildExportPayload() { const payload = { name: getPlayerName(), age: getPlayerAge(), link: getPlayerLink(), country: getCountryName(), skills: collectSkills(), accessToken: CONFIG.accessToken || '' }; validatePayload(payload); return payload; }

    function validatePayload(payload, needsCountry = true) {
        if (!payload.name) throw new Error('Spielername nicht gefunden.');
        if (!payload.age) throw new Error('Alter nicht gefunden.');
        if (needsCountry && !payload.country) throw new Error('Land nicht gefunden.');
        if (payload.skills.some(v => v === '')) throw new Error('Mindestens ein Skill fehlt.');
    }

    async function fetchUploadData(action, playerName, playerAge, playerLink) { return gmPostJson(CONFIG.uploadWebAppUrl, { action, name: playerName, age: playerAge, link: playerLink, accessToken: CONFIG.accessToken || '' }, { rejectOnError: false }); }
    async function fetchSwissLastUpdate(playerName, playerAge, playerLink) { const data = await fetchUploadData('getSwissLastUpdate', playerName, playerAge, playerLink); return data?.ok ? text(data.lastUpdate) : ''; }
    async function fetchOtherCountryLastUpdate(playerName, playerAge, playerLink) { const data = await gmPostJson(CONFIG.exportWebAppUrl, { action: 'getOtherCountryLastUpdate', name: playerName, age: playerAge, link: playerLink, accessToken: CONFIG.accessToken || '' }, { rejectOnError: false }); return data?.ok ? text(data.lastUpdate) : ''; }
    async function fetchMainLastUpdate(playerName, playerAge, playerLink, countryName) { return isSwissCountryName(countryName) ? fetchSwissLastUpdate(playerName, playerAge, playerLink) : fetchOtherCountryLastUpdate(playerName, playerAge, playerLink); }
    async function fetchScout(playerName, playerAge, playerLink) { const data = await fetchUploadData('getScout', playerName, playerAge, playerLink); return { scout: data?.scout || 'Brausetablette', mailLink: data?.mailLink || '' }; }
    async function fetchManagerLanguage(teamName) { const data = await gmPostJson(CONFIG.accessWebAppUrl || CONFIG.managerLanguageWebAppUrl, { action: 'getManagerLanguage', teamName, accessToken: CONFIG.accessToken || '' }, { rejectOnError: false }); return data?.ok && data.language ? text(data.language) : 'unknown'; }
    async function fetchTrainingPlan(playerName, playerAge, playerLink) { const data = await gmPostJson(CONFIG.trainingWebAppUrl, { action: 'getTrainingPlan', name: playerName, age: playerAge, link: playerLink, lang: uiLang(), accessToken: CONFIG.accessToken || '' }, { rejectOnError: false }); return { profile: data?.profile || '', targets: Array.isArray(data?.targets) ? data.targets : [], message: data?.message || '' }; }

    async function copyTextToClipboard(value) { try { GM_setClipboard(value); } catch { await navigator.clipboard.writeText(value); } }

    async function uploadToDatabase() {
        try {
            const payload = buildUploadPayload();
            if (!isEligibleU21(payload.country, payload.age)) { showToast(uploadText('uploadOnlySwiss'), true); return; }
            showToast(`${uploadText('uploadToast')} ${payload.name} (${payload.age})`);
            const result = await gmPostJson(CONFIG.uploadWebAppUrl, payload);
            showToast(`${result.action === 'updated' ? uploadText('uploadSuccessUpdated') : uploadText('uploadSuccessInserted')} ${payload.name}`);
            updateLineToToday('bb-main-last-update', uploadText('lastUpdate'));
        } catch (err) { alert(uploadText('uploadFailed') + ' ' + (err.message || err)); }
    }

    async function exportPlayer() {
        try {
            const payload = buildExportPayload();
            showToast(`Export: ${payload.name} (${payload.country})`);
            const result = await gmPostJson(CONFIG.exportWebAppUrl, payload);
            showToast(`✅ ${result.action === 'inserted' ? 'neu gespeichert' : 'aktualisiert'}: ${payload.name}`);
            updateLineToToday('bb-main-last-update', uploadText('lastUpdate'));
        } catch (err) { alert('Export Fehler: ' + (err.message || err)); }
    }

    function setWorkflowState(state) { sessionStorage.setItem(CONFIG.scoutingStorageKey, JSON.stringify(state)); }
    function getWorkflowState() { try { const raw = sessionStorage.getItem(CONFIG.scoutingStorageKey); return raw ? JSON.parse(raw) : null; } catch { return null; } }
    function clearWorkflowState() { sessionStorage.removeItem(CONFIG.scoutingStorageKey); }
    function isVisible(el) { if (!el) return false; const style = window.getComputedStyle(el); return style.display !== 'none' && style.visibility !== 'hidden' && el.offsetParent !== null; }
    function findActionElement(searchText) { const needle = normalize(searchText); return Array.from(document.querySelectorAll('input, button, a')).find(el => normalize(el.value || el.textContent).includes(needle)) || null; }
    function findAddButton() { return findActionElement('in die auswahl aufnehmen'); }
    function findRemoveButton() { return findActionElement('aus kader streichen'); }
    function isInTeam() { return normalize(getBodyText()).includes('dieser spieler ist aktuell im kader der u21-nationalmannschaft') || !!findRemoveButton(); }

    function clickVisibleButtonBySelectors(selectors, exactText) {
        for (const btn of selectors.map(s => document.querySelector(s)).filter(Boolean)) { if (isVisible(btn)) { btn.click(); return true; } }
        for (const btn of document.querySelectorAll('input[type="submit"], input[type="button"], button')) { if (text(btn.value || btn.textContent) === exactText && isVisible(btn)) { btn.click(); return true; } }
        return false;
    }

    function clickRecruitYesButton() { return clickVisibleButtonBySelectors(['#cphContent_btnNTRecruitYes2', 'input[id*="btnNTRecruitYes"][value="Ja"]', 'input[name*="btnNTRecruitYes"][value="Ja"]'], 'Ja'); }
    function clickDismissYesButton() { return clickVisibleButtonBySelectors(['#cphContent_btnDismissYes2', 'input[id*="btnDismissYes"][value="Ja"]', 'input[name*="btnDismissYes"][value="Ja"]'], 'Ja'); }

    function waitForAndClick(clickFn, maxAttempts = 35, interval = 120) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const timer = setInterval(() => {
                attempts += 1;
                if (clickFn()) { clearInterval(timer); resolve(true); return; }
                if (attempts >= maxAttempts) { clearInterval(timer); reject(new Error('Bestätigungsbutton nicht gefunden.')); }
            }, interval);
        });
    }

    async function triggerAddFlow() { if (isInTeam()) { showToast('Spieler ist bereits im Team'); return; } const addButton = findAddButton(); if (!addButton) throw new Error('Button "in die Auswahl aufnehmen" nicht gefunden.'); showToast('Füge Spieler zum Team hinzu ...'); addButton.click(); await waitForAndClick(clickRecruitYesButton); }
    async function triggerRemoveFlow() { if (!isInTeam()) { showToast('Spieler ist bereits entfernt'); return; } const removeButton = findRemoveButton(); if (!removeButton) throw new Error('Button "aus Kader streichen" nicht gefunden.'); showToast('Entferne Spieler wieder ...'); removeButton.click(); await waitForAndClick(clickDismissYesButton); }

    async function processScouting() { const payload = buildScoutingPayload(); showToast(`Suche: ${payload.name} | Alter ${payload.age}`); await copyTextToClipboard(payload.skills.join('\t')); await gmPostJson(CONFIG.scoutingWebAppUrl, payload); showToast(`Im Sheet aktualisiert: ${payload.name} (${payload.age})`); }

    async function startScoutingWorkflow() {
        try {
            if (!FEATURES.scoutingWorkflow) { showToast('Keine Berechtigung für Scouting Workflow.', true); return; }
            if (getWorkflowState()?.active) { showToast('Scouting-Workflow läuft bereits.', true); return; }
            if (!isEligibleForSwissU21Scouting()) { showToast('Nur für Schweizer Spieler bis 21 Jahre', true); return; }
            const baseState = { active: true, name: getPlayerName(), age: getPlayerAge(), startedAt: Date.now() };
            if (!isInTeam()) { setWorkflowState({ ...baseState, stage: 'adding' }); await triggerAddFlow(); return; }
            setWorkflowState({ ...baseState, stage: 'processing' }); await processScouting(); setWorkflowState({ ...baseState, stage: 'removing' }); await triggerRemoveFlow();
        } catch (err) { clearWorkflowState(); alert('Scouting fehlgeschlagen: ' + (err.message || err)); }
    }

    async function resumeScoutingWorkflow() {
        if (!FEATURES.scoutingWorkflow) return;
        const state = getWorkflowState();
        if (!state?.active) return;
        try {
            if (!isEligibleForSwissU21Scouting()) { clearWorkflowState(); return; }
            if (state.stage === 'adding') { if (!isInTeam()) { await triggerAddFlow(); return; } setWorkflowState({ ...state, stage: 'processing' }); await processScouting(); setWorkflowState({ ...state, stage: 'removing' }); await triggerRemoveFlow(); return; }
            if (state.stage === 'processing') { await processScouting(); setWorkflowState({ ...state, stage: 'removing' }); await triggerRemoveFlow(); return; }
            if (state.stage === 'removing') { if (!isInTeam()) { clearWorkflowState(); showToast('Scouting abgeschlossen'); return; } await triggerRemoveFlow(); }
        } catch (err) { clearWorkflowState(); alert('Scouting-Workflow abgebrochen: ' + (err.message || err)); }
    }

    function setNativeValue(element, value) { const proto = element.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype; const descriptor = Object.getOwnPropertyDescriptor(proto, 'value'); if (descriptor?.set) descriptor.set.call(element, value); else element.value = value; }

    function waitForElement(selector, maxAttempts = 120, interval = 300) {
        return new Promise((resolve, reject) => {
            let attempts = 0;
            const timer = setInterval(() => { const el = document.querySelector(selector); attempts += 1; if (el) { clearInterval(timer); resolve(el); return; } if (attempts >= maxAttempts) { clearInterval(timer); reject(new Error(`Element nicht gefunden: ${selector}`)); } }, interval);
        });
    }

    function getManagerNameFromRecipientField(value) { const recipient = text(value); if (!recipient) return ''; if (!/@/.test(recipient)) return recipient; const displayName = recipient.match(/^"?([^"<]+?)"?\s*<[^>]+>$/); if (displayName) return text(displayName[1]); const emailName = recipient.match(/^([^@\s]+)@/); return emailName ? text(emailName[1]) : recipient; }
    function getNewMessageLabel() {
    const lang = uiLang();

    if (lang === 'de') return 'Neue Nachricht';
    if (lang === 'fr') return 'Nouveau message';
    if (lang === 'it') return 'Nuovo messaggio';

    return 'New Message';
}
   function getTemplateSubject(templateKey, playerName) {
    if (templateKey === 'NEW') return playerName;
    if (templateKey === 'Discord') return 'Discord';
    if (templateKey === 'U21-Upload') return 'U21-Upload';
    return playerName;
}

    function getDiscordMessageText(language, managerName) {
        const greetingName = managerName ? ` ${managerName}` : '';
        const templates = {
            DE: `Hey${greetingName},\n\nFür eine vereinfachte Kommunikation untereinander und für Tipps und Tricks nutzen wir Discord.\nGerne würde ich dich auf unseren Server einladen, hier ist der Link!\n\n[link=https://discord.gg/xkjr7Q3PGQ]\n\nLiebe Grüsse\nBrausetablette`,
            ENG: `Hey${greetingName},\n\nFor easier communication with each other and for tips and tricks, we use Discord.\nI would like to invite you to our server, here is the link!\n\n[link=https://discord.gg/xkjr7Q3PGQ]\n\nBest regards\nBrausetablette`,
            FRA: `Salut${greetingName},\n\nPour faciliter la communication entre nous ainsi que pour partager des conseils et astuces, nous utilisons Discord.\nJ'aimerais t'inviter sur notre serveur, voici le lien !\n\n[link=https://discord.gg/xkjr7Q3PGQ]\n\nMeilleures salutations\nBrausetablette`,
            IT: `Ciao${greetingName},\n\nPer semplificare la comunicazione tra di noi e per condividere consigli e suggerimenti, usiamo Discord.\nMi farebbe piacere invitarti sul nostro server, ecco il link!\n\n[link=https://discord.gg/xkjr7Q3PGQ]\n\nCordiali saluti\nBrausetablette`
        };
        return templates[language] || templates.DE;
    }

    function getDraftMessageText(language, playerName, managerName) {
        const greetingName = managerName ? ` ${managerName}` : '';
        const templates = {
            DE: `Hallo${greetingName},\n\nich bin Trainer der Schweizer U21-Nationalmannschaft.\n\nDein Spieler ${playerName} ist ein interessanter Kandidat für die U21 und ich würde mich gerne mit dir zu einem möglichen Trainingsplan austauschen.\n\nFalls du den Spieler selbst trainierst, können wir gerne gemeinsam besprechen, wie man ihn optimal fördern kann.\n\nFalls du den Spieler nicht trainieren möchtest, wäre ich dir sehr dankbar, wenn du ihn verkaufen würdest, damit er in gute Trainingshände kommt.\n\nBei Fragen kannst du dich jederzeit gerne bei mir melden.\n\nFreundliche Grüsse\nBrausetablette`,
            ENG: `Hello${greetingName},\n\nI am the coach of the Swiss U21 national team.\n\nYour player ${playerName} is an interesting candidate for the U21 team, and I would like to discuss a possible training plan with you.\n\nIf you are training the player yourself, we can gladly discuss together how to develop him in the best possible way.\n\nIf you do not wish to train the player, I would be very grateful if you would sell him so that he can end up in good training hands.\n\nIf you have any questions, please feel free to contact me at any time.\n\nBest regards\nBrausetablette`,
            FRA: `Bonjour${greetingName},\n\nJe suis l'entraîneur de l'équipe nationale suisse U21.\n\nTon joueur ${playerName} est un candidat intéressant pour les U21 et j'aimerais échanger avec toi au sujet d'un éventuel plan d'entraînement.\n\nSi tu entraînes toi-même ce joueur, nous pouvons volontiers discuter ensemble de la meilleure façon de le développer.\n\nSi tu ne souhaites pas entraîner ce joueur, je te serais très reconnaissant de le vendre afin qu'il puisse rejoindre de bonnes mains pour son entraînement.\n\nSi tu as des questions, n'hésite pas à me contacter à tout moment.\n\nMeilleures salutations\nBrausetablette`,
            IT: `Ciao${greetingName},\n\nsono l'allenatore della nazionale svizzera U21.\n\nIl tuo giocatore ${playerName} è un candidato interessante per la U21 e mi farebbe piacere confrontarmi con te su un possibile piano di allenamento.\n\nSe alleni tu stesso il giocatore, possiamo volentieri discutere insieme su come svilupparlo nel modo migliore.\n\nSe invece non desideri allenarlo, ti sarei molto grato se lo vendessi, così da permettergli di finire in buone mani per l'allenamento.\n\nSe hai domande, puoi contattarmi in qualsiasi momento.\n\nCordiali saluti\nBrausetablette`
        };
        return templates[language] || templates.DE;
    }

    function getU21UploadMessageText(language, managerName) {
        const greetingName = managerName ? ` ${managerName}` : '';
        const templates = {
            DE: `Hallo${greetingName},\n\nIch habe für unsere Schweizer Manager ein U21 Upload Tool erstellt.\n\nMit diesem Tool könnt ihr die aktuellen Skills eurer Schweizer Spieler direkt an die U21-Datenbank senden und erhaltet automatisch Trainingsvorschläge.\n\n✅ Schritt 1: Tampermonkey installieren\n\nTampermonkey ist ein Browser-Add-on, mit dem Zusatztools für Webseiten genutzt werden können.\n\nChrome / Brave / Edge / Firefox:\n\n[link=https://www.tampermonkey.net/]\n\n✅ Schritt 2: U21 Upload Tool installieren\n\n[link=https://github.com/kevinburri1440-hub/u21-upload/raw/main/u21-upload.user.js]\n\nDann öffnet sich Tampermonkey automatisch. Dort einfach auf Installieren klicken.\n\n✅ Schritt 3: Wichtige BuzzerBeater Einstellung\n\nEinstellungen → Nummerierung neben Skills = Aktiv\n\n✅ Schritt 4: Tool verwenden\n\nSchweizer Spieler öffnen. Rechts erscheint automatisch U21 Upload.\n\nDort könnt ihr Skills hochladen, Scout sehen, Scout direkt anschreiben, Trainingsvorschlag erhalten und Fortschritt & fehlende Pops sehen.\n\nBei Fragen kannst du dich jederzeit gerne bei mir melden.\n\nLiebe Grüsse\nBrausetablette`,
            ENG: `Hello${greetingName},\n\nI created a U21 Upload Tool for our Swiss managers.\n\nWith this tool, you can send the current skills of your Swiss players directly to the U21 database and automatically receive training suggestions.\n\n✅ Step 1: Install Tampermonkey\n\n[link=https://www.tampermonkey.net/]\n\n✅ Step 2: Install the U21 Upload Tool\n\n[link=https://github.com/kevinburri1440-hub/u21-upload/raw/main/u21-upload.user.js]\n\nTampermonkey will then open automatically. Just click Install.\n\n✅ Step 3: Important BuzzerBeater setting\n\nSettings → Numbering next to skills = Enabled\n\n✅ Step 4: Use the tool\n\nOpen a Swiss player. The U21 Upload box will appear on the right.\n\nThere you can upload skills, see the scout, contact the scout directly, receive a training suggestion and see progress & missing pops.\n\nBest regards\nBrausetablette`,
            FRA: `Bonjour${greetingName},\n\nJ'ai créé un outil U21 Upload pour nos managers suisses.\n\nAvec cet outil, tu peux envoyer les compétences actuelles de tes joueurs suisses directement à la base de données U21 et recevoir automatiquement des conseils d'entraînement.\n\n✅ Étape 1 : Installer Tampermonkey\n\n[link=https://www.tampermonkey.net/]\n\n✅ Étape 2 : Installer l'outil U21 Upload\n\n[link=https://github.com/kevinburri1440-hub/u21-upload/raw/main/u21-upload.user.js]\n\nTampermonkey s'ouvrira automatiquement. Clique simplement sur Installer.\n\n✅ Étape 3 : Réglage important dans BuzzerBeater\n\nParamètres → Numérotation à côté des compétences = Activée\n\n✅ Étape 4 : Utiliser l'outil\n\nOuvre un joueur suisse. Le bloc U21 Upload apparaît à droite.\n\nTu peux envoyer les compétences, voir le scout, contacter directement le scout, recevoir une proposition d'entraînement et voir les progrès.\n\nMeilleures salutations\nBrausetablette`,
            IT: `Ciao${greetingName},\n\nHo creato uno strumento U21 Upload per i nostri manager svizzeri.\n\nCon questo tool puoi inviare le skill attuali dei tuoi giocatori svizzeri direttamente al database U21 e ricevere automaticamente suggerimenti di allenamento.\n\n✅ Passo 1: Installa Tampermonkey\n\n[link=https://www.tampermonkey.net/]\n\n✅ Passo 2: Installa U21 Upload Tool\n\n[link=https://github.com/kevinburri1440-hub/u21-upload/raw/main/u21-upload.user.js]\n\nTampermonkey si aprirà automaticamente. Clicca su Installa.\n\n✅ Passo 3: Impostazione importante in BuzzerBeater\n\nImpostazioni → Numerazione accanto alle skill = Attiva\n\n✅ Passo 4: Usa il tool\n\nApri un giocatore svizzero. A destra apparirà U21 Upload.\n\nDa lì puoi caricare le skill, vedere lo scout, contattare direttamente lo scout, ricevere un suggerimento di allenamento e vedere i progressi.\n\nCordiali saluti\nBrausetablette`
        };
        return templates[language] || templates.DE;
    }

  function getTemplateMessage(templateKey, language, playerName, managerName) {
    if (templateKey === 'NEW') return '';
    if (templateKey === 'Discord') return getDiscordMessageText(language, managerName);
    if (templateKey === 'U21-Upload') return getU21UploadMessageText(language, managerName);
    return getDraftMessageText(language, playerName, managerName);
}

    async function fillComposerFromStoredPayload() {
        const raw = localStorage.getItem(CONFIG.messageStorageKey);
        if (!raw) return;
        let payload;
        try { payload = JSON.parse(raw); } catch { localStorage.removeItem(CONFIG.messageStorageKey); return; }
        if (!payload?.subject || !payload?.language) { localStorage.removeItem(CONFIG.messageStorageKey); return; }
        try {
            const [subjectField, messageField, recipientField] = await Promise.all([waitForElement('#cphContent_tbSubject'), waitForElement('#cphContent_tbMessage'), waitForElement('#cphContent_tbTo')]);
            await sleep(1000);
            const managerName = getManagerNameFromRecipientField(recipientField.value);
            const finalMessage = getTemplateMessage(payload.templateKey || 'Draft', payload.language, payload.playerName || payload.subject, managerName);
            setNativeValue(subjectField, payload.subject); subjectField.value = payload.subject;
            setNativeValue(messageField, finalMessage); messageField.value = finalMessage;
            if (typeof window.counter === 'function') { try { window.counter(); } catch {} }
            messageField.focus(); try { messageField.setSelectionRange(messageField.value.length, messageField.value.length); } catch {}
            showToast(`Text ${payload.templateKey || 'Draft'} / ${payload.language} vorbereitet`);
            localStorage.removeItem(CONFIG.messageStorageKey);
        } catch (err) { showToast('Fehler beim Füllen der Nachricht: ' + (err.message || err), true); }
    }

    function startMessageFlow(language) {
        try {
            if (!FEATURES.messages) { showToast('Keine Berechtigung für Text Messages.', true); return; }
            const playerName = getPlayerName();
            const teamUrl = getTeamOverviewUrl();
            const templateKey = document.getElementById('bb-message-template-select')?.value || 'Draft';
            const subject = getTemplateSubject(templateKey, playerName);
            if (!playerName) throw new Error('Spielername nicht gefunden.');
            if (!teamUrl) throw new Error('Team-Link nicht gefunden.');
            localStorage.setItem(CONFIG.messageStorageKey, JSON.stringify({ subject, playerName, language, templateKey, ts: Date.now() }));
            const teamTab = window.open(teamUrl, '_blank');
            if (!teamTab) throw new Error('Neuer Tab konnte nicht geöffnet werden. Popup-Blocker?');
            showToast(`Text ${templateKey} / ${language} wird vorbereitet ...`);
            const poll = setInterval(() => {
                try {
                    if (!teamTab || teamTab.closed) { clearInterval(poll); return; }
                    const messageLink = teamTab.document.querySelector('a[href*="/community/bbmail.aspx?showType=create"][href*="user="]');
                    if (!messageLink) return;
                    clearInterval(poll);
                    const href = text(messageLink.getAttribute('href'));
                    if (!href) throw new Error('Nachrichten-Link nicht gefunden.');
                    teamTab.location.href = new URL(href, window.location.origin).href;
                } catch {}
            }, 400);
            setTimeout(() => clearInterval(poll), 60000);
        } catch (err) { alert('Text konnte nicht vorbereitet werden: ' + (err.message || err)); }
    }

    function parseTrainingTarget(targetText) {
        const value = String(targetText || '').trim();
        const keys = Object.keys(TRAINING_TARGET_ALIASES).sort((a, b) => b.length - a.length);
        for (const key of keys) {
            const match = value.match(new RegExp('\\b' + key + '\\b\\s*(\\d+)', 'i'));
            if (!match) continue;
            const realKey = keys.find(k => k.toLowerCase() === key.toLowerCase());
            return { skill: TRAINING_TARGET_ALIASES[realKey], target: parseInt(match[1], 10), raw: value };
        }
        return null;
    }

    function evaluateTrainingTarget(targetText, currentSkills) {
        const parsed = parseTrainingTarget(targetText);
        if (!parsed) return { status: 'neutral', icon: '➖', text: targetText };
        const current = currentSkills[parsed.skill];
        if (current === null || current === undefined || Number.isNaN(current)) return { status: 'open', icon: '⬜', text: targetText, current: null, target: parsed.target, skill: parsed.skill };
        if (current >= parsed.target) return { status: 'done', icon: '🟩', text: targetText, current, target: parsed.target, skill: parsed.skill };
        return { status: 'open', icon: '⬜', text: targetText, current, target: parsed.target, skill: parsed.skill };
    }

    function buildProgressBar(percent) { let html = ''; const totalBars = 10; const filledBars = Math.round((percent / 100) * totalBars); for (let i = 0; i < totalBars; i++) { const filled = i < filledBars; let color = '#d0d0d0'; if (filled) color = percent < 40 ? '#c62828' : percent < 60 ? '#f9a825' : '#2e7d32'; html += `<span style="display:inline-block;width:14px;height:8px;margin-right:2px;border-radius:2px;background:${color};"></span>`; } return html; }

    function renderTrainingPlan(trainingData, scoutData = null) {
        const wrap = document.getElementById('bb-training-plan-content'); if (!wrap) return;
        const tr = trainingText(); const profile = text(trainingData.profile); const message = text(trainingData.message); const targets = Array.isArray(trainingData.targets) ? trainingData.targets : []; const currentSkills = getCurrentSkillMap();
            const scoutHtml = scoutData
        ? `<span style="float:right;font-weight:normal;color:#666;">
              <b>${uploadText('scout')}</b> ${escapeHtml(scoutData.scout || '-')}
               ${scoutData.mailLink ? `<a href="${escapeHtml(absoluteUrl(scoutData.mailLink))}" target="_blank" title="Nachricht an Scout" style="margin-left:4px;text-decoration:none;">✉️</a>` : ''}
           </span>`
        : '';
       if (!profile) {
    const scoutPlainHtml = scoutData
        ? `<div style="margin-top:2px;">
               <b>${uploadText('scout')}</b> ${escapeHtml(scoutData.scout || '-')}
               ${scoutData.mailLink ? `<a href="${escapeHtml(absoluteUrl(scoutData.mailLink))}" target="_blank" title="Nachricht an Scout" style="margin-left:4px;text-decoration:none;">✉️</a>` : ''}
           </div>`
        : '';

    wrap.innerHTML = `
        <div style="font-size:11px;line-height:1.45;color:#666;">
            <div style="margin-bottom:2px;"><b>${tr.profile}:</b> ${tr.noProfile}</div>
            ${scoutPlainHtml}
        </div>
    `;
    return;
}
        const evaluatedTargets = targets.map(target => evaluateTrainingTarget(target, currentSkills)); const countableTargets = evaluatedTargets.filter(t => t.status === 'done' || t.status === 'open'); const doneTargets = countableTargets.filter(t => t.status === 'done'); const progressPercent = countableTargets.length ? Math.round((doneTargets.length / countableTargets.length) * 100) : 0;
        let html = `<div style="font-size:11px;line-height:1.45;color:#666;"><div style="margin-bottom:8px;">
    <b>${tr.profile}:</b> ${escapeHtml(profile)}
    ${scoutHtml}
</div><div style="margin-bottom:4px;font-weight:bold;">${tr.progress}: ${doneTargets.length}/${countableTargets.length} ${tr.goalsDone} (${progressPercent}%)</div><div style="margin-bottom:10px;">${buildProgressBar(progressPercent)}</div>`;
        if (evaluatedTargets.length) {
            html += `<div style="font-weight:bold;margin-bottom:6px;">${tr.goals}:</div><div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">`;
            let numberIndex = 0;
            evaluatedTargets.forEach(evaluation => {
                let icon = '➖'; let color = '#666'; let numberLabel = '';
                if (evaluation.status === 'done') { icon = '🟩'; color = '#2e7d32'; numberIndex += 1; numberLabel = numberIndex + '.'; }
                else if (evaluation.status === 'open') { icon = '⬜'; color = '#333'; numberIndex += 1; numberLabel = numberIndex + '.'; }
                let extraInfo = '';
                if (evaluation.status === 'done') extraInfo = ` <span style="color:#2e7d32;">(${tr.done})</span>`;
                else if (evaluation.status === 'open' && evaluation.current !== null && evaluation.current !== undefined && evaluation.target !== undefined) extraInfo = ` <span style="color:#888;">(${Math.max(0, evaluation.target - evaluation.current)} ${tr.popsLeft})</span>`;
                html += `<div style="display:flex;align-items:flex-start;gap:6px;color:${color};"><span style="min-width:18px;font-weight:bold;">${numberLabel}</span><span style="min-width:18px;">${icon}</span><span>${escapeHtml(evaluation.text)}${extraInfo}</span></div>`;
            });
            html += `</div>`;
        } else html += `<div style="margin-bottom:10px;">${tr.noPlan}</div>`;
        html += `<div style="margin-bottom:6px;">💡 <b>${tr.tipLabel}:</b> ${tr.tipFw}</div><div style="margin-bottom:6px;">💡 <b>${tr.tipLabel}:</b> ${tr.tipMinutes}</div>`;
        html += progressPercent >= 50 ? `<div style="color:#2e7d32;font-weight:bold;">📨 <b>${tr.noteLabel}:</b> ${tr.noteContact}</div>` : `<div style="color:#888;">📨 <b>${tr.noteLabel}:</b> ${tr.noteContactAt}</div>`;
        if (message && evaluatedTargets.length === 0) html += `<div style="margin-top:8px;">${escapeHtml(message)}</div>`;
        html += `</div>`; wrap.innerHTML = html;
    }

  function getRoleTitle() {
    const flag = getCountryFlagHtml() || '';

    if (CURRENT_ROLE === 'manager') {
        return `${flag} <span style="margin-left:4px;">U21</span>`;
    }

    if (CURRENT_ROLE === 'scout') {
        return `${flag} <span style="margin-left:4px;">U21 Scout Tools</span>`;
    }

    return `${flag} <span style="margin-left:4px;">U21</span>`;
}
    function hexToRgba(hex, alpha = 1) {
    const clean = String(hex || '').replace('#', '').trim();

    if (!/^[0-9a-fA-F]{6}$/.test(clean)) {
        return `rgba(119,119,119,${alpha})`;
    }

    const r = parseInt(clean.slice(0, 2), 16);
    const g = parseInt(clean.slice(2, 4), 16);
    const b = parseInt(clean.slice(4, 6), 16);

    return `rgba(${r},${g},${b},${alpha})`;
}

    function createButton({ text: label, color = '#777', textColor = '#222', onClick, disabled = false, title = '' }) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = label;
    if (title) btn.title = title;

    Object.assign(btn.style, {
        width: '100%',
        padding: '7px 10px',
        background: disabled ? '#e2e2e2' : hexToRgba(color, 0.12),
        color: disabled ? '#888' : textColor,
        border: `1px solid ${disabled ? '#cfcfcf' : hexToRgba(color, 0.45)}`,
        borderLeft: `4px solid ${disabled ? '#bdbdbd' : color}`,
        borderRadius: '5px',
        cursor: disabled ? 'default' : 'pointer',
        fontWeight: '600',
        fontSize: '12px',
        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.65)',
        transition: 'filter 0.08s ease, background 0.08s ease, border-color 0.08s ease'
    });

    if (!disabled && typeof onClick === 'function') {
        btn.addEventListener('click', onClick);
        btn.addEventListener('mouseenter', () => {
            btn.style.background = hexToRgba(color, 0.18);
            btn.style.borderColor = hexToRgba(color, 0.65);
        });
        btn.addEventListener('mouseleave', () => {
            btn.style.background = hexToRgba(color, 0.12);
            btn.style.borderColor = hexToRgba(color, 0.45);
        });
    }

    return btn;
}

  function createTemplateSelect() {
    const select = document.createElement('select');
    select.id = 'bb-message-template-select';

    const color = '#1f4d1f';

    Object.assign(select.style, {
        gridColumn: '1 / -1',
        width: '100%',
        padding: '7px 8px',
        borderRadius: '5px',
        border: `1px solid ${hexToRgba(color, 0.45)}`,
        borderLeft: `4px solid ${color}`,
        background: hexToRgba(color, 0.10),
        color: '#222',
        fontSize: '12px',
        fontWeight: '600',
        boxSizing: 'border-box',
        cursor: 'pointer',
        marginBottom: '2px',
        outline: 'none'
    });

    select.addEventListener('mouseenter', () => {
        select.style.background = hexToRgba(color, 0.16);
        select.style.borderColor = hexToRgba(color, 0.65);
    });

    select.addEventListener('mouseleave', () => {
        select.style.background = hexToRgba(color, 0.10);
        select.style.borderColor = hexToRgba(color, 0.45);
    });

    for (const name of MESSAGE_TEMPLATES) {
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name === 'NEW' ? getNewMessageLabel() : name;
        select.appendChild(option);
    }

    return select;
}
    function createShell() { const existing = document.getElementById('bb-u21-combined-shell'); if (existing) return existing; const rightColumn = document.getElementById('rightColumn'); if (!rightColumn) return null; const shell = document.createElement('div'); shell.id = 'bb-u21-combined-shell'; Object.assign(shell.style, { position: 'relative', marginTop: '12px', width: '100%', boxSizing: 'border-box', overflow: 'visible' }); const anchor = document.getElementById('cbBuddyList'); if (anchor && anchor.parentNode === rightColumn) rightColumn.insertBefore(shell, anchor.nextSibling); else rightColumn.appendChild(shell); return shell; }

    function createMainBox(shell) { const existing = document.getElementById('bb-u21-combined-box'); if (existing) return existing; const box = document.createElement('div'); box.id = 'bb-u21-combined-box'; box.className = 'noclass'; box.style.width = '100%'; box.style.boxSizing = 'border-box'; box.innerHTML = `<div class="boxheader" style="display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:6px 8px;"><span style="display:flex;align-items:center;">${getRoleTitle()}</span></div><div class="boxcontent" style="padding:10px;width:100%;box-sizing:border-box;"><div id="bb-u21-player-info" style="font-size:11px;color:#666;line-height:1.45;margin-bottom:10px;"></div><div id="bb-u21-upload-section"></div><div id="bb-u21-admin-section"></div><div id="bb-u21-message-section"></div></div>`; shell.appendChild(box); return box; }

    function createTrainingBox(shell) { if (!FEATURES.trainingSuggestion) return null; const existing = document.getElementById('bb-training-plan-box'); if (existing) return existing; const tr = trainingText(); const box = document.createElement('div'); box.id = 'bb-training-plan-box'; box.className = 'noclass'; Object.assign(box.style, { position: 'absolute', left: 'calc(100% + 12px)', top: '0', width: CONFIG.trainingPanelWidth + 'px', boxSizing: 'border-box' }); box.innerHTML = `<div class="boxheader" style="display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:6px 8px;"><span style="font-size:15px;">📋</span><span>${tr.title}</span></div><div class="boxcontent" style="padding:12px;width:100%;box-sizing:border-box;font-size:11px;line-height:1.45;color:#666;"><div id="bb-training-plan-content">${tr.loading}</div></div>`; shell.appendChild(box); return box; }

    function addSection(parent, title) { const section = document.createElement('div'); section.style.marginTop = '10px'; section.innerHTML = `<div style="height:1px;background:#d7d7d7;margin:10px 0;"></div><div style="font-weight:bold;color:#1f4d1f;margin-bottom:6px;font-size:12px;">${title}</div>`; parent.appendChild(section); return section; }

    function createUpdateColor(dateStr) { if (!dateStr) return '#777'; const parts = String(dateStr).split('.'); if (parts.length !== 3) return '#777'; const date = new Date(parts[2], Number(parts[1]) - 1, parts[0]); if (Number.isNaN(date.getTime())) return '#777'; const diffDays = (new Date() - date) / 86400000; if (diffDays <= 14) return '#2e7d32'; if (diffDays <= 49) return '#f9a825'; return '#c62828'; }
    function updateLineToToday(elementId, label) { const line = document.getElementById(elementId); if (!line) return; const now = new Date(); const today = `${String(now.getDate()).padStart(2, '0')}.${String(now.getMonth() + 1).padStart(2, '0')}.${now.getFullYear()}`; line.innerHTML = `${label} <b style="color:#2e7d32;">${today}</b>`; }
    function absoluteUrl(href) { return href?.startsWith('http') ? href : new URL(href, window.location.origin).href; }

    async function buildSidebarContent() {
        const shell = createShell(); if (!shell) return;
        const box = createMainBox(shell); createTrainingBox(shell);
        const infoWrap = box.querySelector('#bb-u21-player-info'); const uploadSection = box.querySelector('#bb-u21-upload-section'); const adminSection = box.querySelector('#bb-u21-admin-section'); const messageSection = box.querySelector('#bb-u21-message-section');
        if (!infoWrap || infoWrap.dataset.ready === '1') return;
        const playerName = getPlayerName() || uploadText('unknownPlayer'); const country = getCountryName() || uploadText('unknownPlayer'); const age = getPlayerAge() || '?'; const playerLink = getPlayerLink(); const teamName = getTeamName(); const eligible = isEligibleU21(country, age); const scoutingEligible = isEligibleForSwissU21Scouting(); const skillsVisible = hasVisibleSkills();

        infoWrap.innerHTML = `<div>${uploadText('playerDetected')}</div><div><b>${escapeHtml(playerName)}</b> &nbsp;|&nbsp; ${escapeHtml(age)}</div><div style="margin-bottom:4px;"><b>${escapeHtml(country)}</b>${getCountryFlagHtml()}</div>${FEATURES.managerLanguage ? `<div id="bb-manager-language-line" style="margin-bottom:6px;">${uploadText('languageLoading')}</div>` : ''}${FEATURES.lastUpdate ? `<div id="bb-main-last-update">${uploadText('lastUpdateLoading')}</div>` : ''}${!skillsVisible ? `<div style="margin-top:6px;color:#888;font-weight:600;">${uploadText('noSkills')}</div>` : ''}${!eligible && (FEATURES.upload || FEATURES.trainingSuggestion) ? `<div style="margin-top:8px;color:#c62828;font-weight:bold;">${uploadText('onlySwiss')}</div>` : ''}`;
        infoWrap.dataset.ready = '1';

               if (FEATURES.upload || FEATURES.scoutInfo) {
            const section = addSection(uploadSection, '📤 Upload');
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.flexDirection = 'column';
            actions.style.gap = '8px';
            section.appendChild(actions);

            if (FEATURES.upload) {
                actions.appendChild(createButton({
                    text: uploadText('uploadButton'),
                    color: '#1565c0',
                    onClick: uploadToDatabase,
                    disabled: !eligible || !skillsVisible,
                    title: !skillsVisible ? uploadText('noSkills') : eligible ? uploadText('uploadButton') : uploadText('uploadOnlySwiss')
                }));
            }
        }

        if (FEATURES.scoutingWorkflow || FEATURES.exportOtherCountries) {
            const section = addSection(adminSection, CURRENT_ROLE === 'admin' ? '🔎 Admin / Scout Tools' : '🔎 Scout Tools');
            const actions = document.createElement('div');
            actions.style.display = 'flex';
            actions.style.flexDirection = 'column';
            actions.style.gap = '8px';
            section.appendChild(actions);

            if (FEATURES.scoutingWorkflow) {
                actions.appendChild(createButton({
                    text: '🔎 Scouting Workflow',
                    color: '#c62828',
                    onClick: startScoutingWorkflow,
                    disabled: !scoutingEligible,
                    title: 'Fügt den Spieler ins U21-Team ein, liest Skills aus, schreibt ins Sheet und entfernt ihn wieder'
                }));
            }

            if (FEATURES.exportOtherCountries) {
                actions.appendChild(createButton({
                    text: '📤 Export other countries',
                    color: '#d4a017',
                    textColor: '#222',
                    onClick: exportPlayer,
                    disabled: !skillsVisible || getPlayerAgeNumber() === null || getPlayerAgeNumber() > 21,
                   title: !skillsVisible
    ? uploadText('noSkills')
    : getPlayerAgeNumber() > 21
        ? 'Nur für Spieler bis 21 Jahre'
        : 'Exportiert den Spieler in den Google-Sheet-Tab other countries'
                }));
            }
        }

        if (FEATURES.messages) {
            const section = addSection(messageSection, '✉️ Text Messages');
            const grid = document.createElement('div');
            grid.style.display = 'grid';
            grid.style.gridTemplateColumns = '1fr 1fr';
            grid.style.gap = '6px';

            grid.appendChild(createTemplateSelect());

            for (const lang of LANGUAGE_BUTTONS) {
                grid.appendChild(createButton({
                    text: lang.code,
                    color: lang.color,
                    onClick: () => startMessageFlow(lang.code),
                    title: `Öffnet eine neue Nachricht in ${lang.code}`
                }));
            }

            section.appendChild(grid);
        }

        if (FEATURES.managerLanguage) {
            fetchManagerLanguage(teamName).then(language => {
                const line = document.getElementById('bb-manager-language-line');
                if (line) {
                    line.innerHTML = `${uploadText('languageLabel')} <b>${escapeHtml(language || 'unknown')}</b>`;
                }
            });
        }

        if (FEATURES.lastUpdate) {
            const line = document.getElementById('bb-main-last-update');
            const lastUpdate = await fetchMainLastUpdate(playerName, age, playerLink, country);

            if (line) {
                line.innerHTML = lastUpdate
                    ? `${uploadText('lastUpdate')} <b style="color:${createUpdateColor(lastUpdate)};">${escapeHtml(lastUpdate)}</b>`
                    : `${uploadText('lastUpdate')} <span style="color:#777;">${uploadText('notFound')}</span>`;
            }
        }

              if (FEATURES.trainingSuggestion) {
    const wrap = document.getElementById('bb-training-plan-content');

    (async () => {
        let scoutData = null;

        if (FEATURES.scoutInfo && eligible) {
            scoutData = await fetchScout(playerName, age, playerLink);
        }

        if (!eligible) {
            if (wrap) wrap.innerHTML = `<div style="color:#888;">${trainingText().onlyU21}</div>`;
            return;
        }

        const trainingData = await fetchTrainingPlan(playerName, age, playerLink);
        renderTrainingPlan(trainingData, scoutData);
    })();
}
    }
   function initPlayerPage() {
    setTimeout(async () => {
        const state = getWorkflowState();

        // Sidebar sofort anzeigen
        await buildSidebarContent();

        // Wenn Workflow aktiv ist: direkt weiterarbeiten
        if (state?.active) {
            FEATURES.scoutingWorkflow = true;
            resumeScoutingWorkflow();
        }

        // Access im Hintergrund laden
        await loadAccess();

        // Sidebar mit echten Rechten neu laden
        const oldBox = document.getElementById('bb-u21-combined-shell');
        if (oldBox) oldBox.remove();

        await buildSidebarContent();

        // Nur starten, falls nicht schon vorher gestartet
        if (!state?.active) {
            resumeScoutingWorkflow();
        }
    }, CONFIG.initDelayMs);
}
    function initMailPage() { setTimeout(fillComposerFromStoredPayload, CONFIG.initDelayMs); }

    if (isPlayerPage()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPlayerPage);
    } else {
        initPlayerPage();
    }
}

if (isMailCreatePage()) {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initMailPage);
    } else {
        initMailPage();
    }
}

})();
