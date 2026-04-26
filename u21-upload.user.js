// ==UserScript==
// @name         BuzzerBeater U21 Upload
// @namespace    http://tampermonkey.net/
// @version      1.6
// @description  Sidebar für Schweizer Manager zum Upload aktueller Skills ins U21 Player Sheet inkl. Trainingsvorschlag
// @match        https://www.buzzerbeater.com/player/*
// @match        https://buzzerbeater.com/player/*
// @grant        GM_xmlhttpRequest
// @connect      script.google.com
// @connect      script.googleusercontent.com
// ==/UserScript==

(function () {
    'use strict';

    const CONFIG = {
        uploadWebAppUrl: 'https://script.google.com/macros/s/AKfycbxP5ibVZZVnnkvP_V_ctkenN0xiGRx-Q1cZ_aVczRU6_KnJgQjnUK2bfcCCdwKdhEVJ/exec',
        trainingWebAppUrl: 'https://script.google.com/macros/s/AKfycbxU_WJKLnQxzOS0C6F085LJUhI9fy_rN9yC-gfQh9SXzPbV3lKoxlw2RELFPDJc39zl/exec',
        trainingPanelWidth: 430,
        initDelayMs: 900
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

    const TRAINING_TARGET_ALIASES = {
        // Deutsch
        SW: 'SW', RW: 'RW', AV: 'AV', DRI: 'DRI', ZzK: 'ZZK', ZZK: 'ZZK', PAS: 'PAS', ZW: 'ZW', IV: 'IV', REB: 'REB', BLO: 'BLO', KON: 'KON', FW: 'FW',

        // Englisch
        JS: 'SW', JR: 'RW', OD: 'AV', Han: 'DRI', DR: 'ZZK', Pas: 'PAS', IS: 'ZW', ID: 'IV', Reb: 'REB', SB: 'BLO', Sta: 'KON', FT: 'FW',

        // Französisch
        PS: 'RW', DE: 'AV', Dex: 'DRI', Dr: 'ZZK', SI: 'ZW', DI: 'IV', CTR: 'BLO', End: 'KON', LF: 'FW',

        // Italienisch
        TSos: 'SW', DT: 'RW', DifP: 'AV', Pal: 'DRI', Pen: 'ZZK', TdS: 'ZW', DifA: 'IV', Rim: 'REB', Stp: 'BLO', Res: 'KON', TL: 'FW'
    };

    const UPLOAD_TEXTS = {
        de: {
            title: 'U21-Upload',
            uploadButton: 'Upload to Database',
            playerDetected: 'Spieler erkannt:',
            scout: 'Scout:',
            lastUpdateLoading: 'Letztes Update wird geladen ...',
            lastUpdate: 'Letztes Update:',
            notFound: 'nicht gefunden',
            onlySwiss: 'Dieses Tool ist nur für Schweizer Spieler bis 21 Jahre gedacht.',
            uploadToast: 'Upload:',
            uploadSuccessUpdated: '✅ Datenbank aktualisiert:',
            uploadSuccessInserted: '✅ Datenbank neu gespeichert:',
            uploadOnlySwiss: 'Nur für Schweizer Spieler bis 21 Jahre gedacht.',
            uploadFailed: 'Upload fehlgeschlagen:',
            unknownPlayer: 'Unbekannt'
        },
        en: {
            title: 'U21-Upload',
            uploadButton: 'Upload to Database',
            playerDetected: 'Player detected:',
            scout: 'Scout:',
            lastUpdateLoading: 'Last update is loading ...',
            lastUpdate: 'Last update:',
            notFound: 'not found',
            onlySwiss: 'This tool is only intended for Swiss players up to 21 years old.',
            uploadToast: 'Upload:',
            uploadSuccessUpdated: '✅ Database updated:',
            uploadSuccessInserted: '✅ Saved to database:',
            uploadOnlySwiss: 'Only intended for Swiss players up to 21 years old.',
            uploadFailed: 'Upload failed:',
            unknownPlayer: 'Unknown'
        },
        fr: {
            title: 'U21-Upload',
            uploadButton: 'Upload to Database',
            playerDetected: 'Joueur détecté :',
            scout: 'Scout :',
            lastUpdateLoading: 'Dernière mise à jour en cours de chargement ...',
            lastUpdate: 'Dernière mise à jour :',
            notFound: 'introuvable',
            onlySwiss: 'Cet outil est uniquement destiné aux joueurs suisses jusqu’à 21 ans.',
            uploadToast: 'Téléversement :',
            uploadSuccessUpdated: '✅ Base de données mise à jour :',
            uploadSuccessInserted: '✅ Enregistré dans la base :',
            uploadOnlySwiss: 'Uniquement pour les joueurs suisses jusqu’à 21 ans.',
            uploadFailed: 'Échec du téléversement :',
            unknownPlayer: 'Inconnu'
        },
        it: {
            title: 'U21-Upload',
            uploadButton: 'Upload to Database',
            playerDetected: 'Giocatore rilevato:',
            scout: 'Scout:',
            lastUpdateLoading: 'Ultimo aggiornamento in caricamento ...',
            lastUpdate: 'Ultimo aggiornamento:',
            notFound: 'non trovato',
            onlySwiss: 'Questo strumento è destinato solo a giocatori svizzeri fino a 21 anni.',
            uploadToast: 'Upload:',
            uploadSuccessUpdated: '✅ Database aggiornato:',
            uploadSuccessInserted: '✅ Salvato nel database:',
            uploadOnlySwiss: 'Solo per giocatori svizzeri fino a 21 anni.',
            uploadFailed: 'Upload fallito:',
            unknownPlayer: 'Sconosciuto'
        }
    };

    const TRAINING_TEXTS = {
        de: {
            title: 'Trainingsvorschlag',
            loading: 'Trainingsvorschlag wird geladen ...',
            profile: 'Spielerprofil',
            noProfile: 'kein Spielerprofil hinterlegt, Scout kontaktieren',
            progress: 'Fortschritt',
            goalsDone: 'Ziele erfüllt',
            goals: 'Trainingsziele',
            noPlan: 'Kein Trainingsplan gefunden',
            done: 'erfüllt',
            popsLeft: 'Pops fehlen',
            tipLabel: 'Tipp',
            noteLabel: 'Hinweis',
            tipFw: 'FW kann durch Trainingsplatz verbessert werden',
            tipMinutes: 'Für optimale Form 50-70 min Spielzeit pro Woche anstreben',
            noteContact: 'Scout kontaktieren empfohlen',
            noteContactAt: 'Scout kontaktieren ab 50% Fortschritt',
            onlyU21: 'Trainingsvorschlag nur verfügbar für Schweizer Spieler bis 21 Jahre.'
        },
        en: {
            title: 'Training suggestion',
            loading: 'Training suggestion is loading ...',
            profile: 'Player profile',
            noProfile: 'no player profile assigned, contact scout',
            progress: 'Progress',
            goalsDone: 'goals completed',
            goals: 'Training goals',
            noPlan: 'No training plan found',
            done: 'completed',
            popsLeft: 'pops missing',
            tipLabel: 'Tip',
            noteLabel: 'Note',
            tipFw: 'FT can be improved through the training court',
            tipMinutes: 'For optimal form, aim for 50-70 minutes of playing time per week',
            noteContact: 'Contacting the scout is recommended',
            noteContactAt: 'Contact scout from 50% progress',
            onlyU21: 'Training suggestion only available for Swiss players up to 21 years old.'
        },
        fr: {
            title: 'Suggestion d’entraînement',
            loading: 'Suggestion d’entraînement en cours de chargement ...',
            profile: 'Profil du joueur',
            noProfile: 'aucun profil joueur défini, contacter le scout',
            progress: 'Progression',
            goalsDone: 'objectifs atteints',
            goals: 'Objectifs d’entraînement',
            noPlan: 'Aucun plan d’entraînement trouvé',
            done: 'atteint',
            popsLeft: 'pops manquants',
            tipLabel: 'Conseil',
            noteLabel: 'Remarque',
            tipFw: 'LF peut être amélioré avec le terrain d’entraînement',
            tipMinutes: 'Pour une forme optimale, viser 50-70 minutes de temps de jeu par semaine',
            noteContact: 'Il est recommandé de contacter le scout',
            noteContactAt: 'Contacter le scout à partir de 50% de progression',
            onlyU21: 'Suggestion d’entraînement disponible uniquement pour les joueurs suisses jusqu’à 21 ans.'
        },
        it: {
            title: 'Suggerimento allenamento',
            loading: 'Suggerimento allenamento in caricamento ...',
            profile: 'Profilo giocatore',
            noProfile: 'nessun profilo giocatore inserito, contattare lo scout',
            progress: 'Progresso',
            goalsDone: 'obiettivi completati',
            goals: 'Obiettivi di allenamento',
            noPlan: 'Nessun piano di allenamento trovato',
            done: 'completato',
            popsLeft: 'pop mancanti',
            tipLabel: 'Consiglio',
            noteLabel: 'Nota',
            tipFw: 'TL può essere migliorato con il campo di allenamento',
            tipMinutes: 'Per una forma ottimale, puntare a 50-70 minuti di gioco a settimana',
            noteContact: 'Si consiglia di contattare lo scout',
            noteContactAt: 'Contattare lo scout dal 50% di progresso',
            onlyU21: 'Suggerimento allenamento disponibile solo per giocatori svizzeri fino a 21 anni.'
        }
    };

    function getBodyText(doc = document) {
        return doc && doc.body ? String(doc.body.innerText || doc.body.textContent || '') : '';
    }

    function detectUiLanguage() {
        const text = getBodyText();

        if (/Alter\s*:/i.test(text) || /Besitzer\s*:/i.test(text) || /Gehalt/i.test(text) || /Potenzial\s*:/i.test(text)) return 'de';
        if (/Âge\s*:/i.test(text) || /Propriétaire\s*:/i.test(text) || /Salaire/i.test(text) || /Potentiel\s*:/i.test(text)) return 'fr';
        if (/Età\s*:/i.test(text) || /Proprietario\s*:/i.test(text) || /Stipendio/i.test(text) || /Potenziale\s*:/i.test(text)) return 'it';
        if (/Age\s*:/i.test(text) || /Owner\s*:/i.test(text) || /Salary/i.test(text) || /Potential\s*:/i.test(text)) return 'en';

        return 'en';
    }

    function lang() {
        return detectUiLanguage();
    }

    function uploadText(key) {
        const selected = lang();
        return (UPLOAD_TEXTS[selected] && UPLOAD_TEXTS[selected][key]) || UPLOAD_TEXTS.en[key] || key;
    }

    function trainingText() {
        return TRAINING_TEXTS[lang()] || TRAINING_TEXTS.en;
    }

    function normalizeLabel(text) {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .replace(/:\s*$/, '')
            .trim()
            .toLowerCase();
    }

    function cleanPlayerName(text) {
        return String(text || '')
            .replace(/\(\d+\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function extractNumber(text) {
        const match = String(text || '').match(/\((\d+)\)/);
        return match ? match[1] : '';
    }

    function toInt(value) {
        const n = parseInt(String(value || '').trim(), 10);
        return Number.isNaN(n) ? null : n;
    }

    function isPlayerPage() {
        return /\/player\//i.test(window.location.pathname);
    }

    function isSwissCountryName(countryName) {
        return SWISS_ALIASES.includes(String(countryName || '').toLowerCase());
    }

    function isEligibleU21(country, age) {
        const ageNum = parseInt(age, 10);
        return isSwissCountryName(country) && !Number.isNaN(ageNum) && ageNum <= 21;
    }

    function getPlayerLink() {
        return window.location.href.split('#')[0];
    }

    function getPlayerName() {
        const preferredSelectors = [
            '.boxheader a[href*="/player/"]',
            '#cphContent_lblPlayerName a',
            '#cphContent_playerName a'
        ];

        for (const selector of preferredSelectors) {
            const el = document.querySelector(selector);
            const text = cleanPlayerName(el && el.textContent);
            if (text) return text;
        }

        for (const link of document.querySelectorAll('a[href*="/player/"]')) {
            const raw = String(link.textContent || '').trim();
            const cleaned = cleanPlayerName(raw);
            if (cleaned && /\(\d{6,}\)/.test(raw)) return cleaned;
        }

        const candidates = Array.from(document.querySelectorAll('h1, h2, strong, b, td, div, span'));
        for (const el of candidates) {
            const raw = String(el.textContent || '').trim();
            if (!raw || raw.length > 120 || !/\(\d{6,}\)/.test(raw)) continue;

            const cleaned = cleanPlayerName(raw);
            if (cleaned) return cleaned;
        }

        const lines = getBodyText().split('\n').map(s => s.trim()).filter(Boolean);
        for (const line of lines) {
            if (/\(\d{6,}\)/.test(line)) {
                const cleaned = cleanPlayerName(line);
                if (cleaned) return cleaned;
            }
        }

        return '';
    }

    function getPlayerAge() {
        const text = getBodyText();
        const match = text.match(/Alter:\s*(\d+)/i) ||
            text.match(/Age:\s*(\d+)/i) ||
            text.match(/Âge\s*:\s*(\d+)/i) ||
            text.match(/Età\s*:\s*(\d+)/i);

        return match ? String(parseInt(match[1], 10)) : '';
    }

    function getManagerName() {
        const text = getBodyText();
        const match = text.match(/Besitzer:\s*([^\n]+)/i) ||
            text.match(/Owner:\s*([^\n]+)/i) ||
            text.match(/Propriétaire\s*:\s*([^\n]+)/i) ||
            text.match(/Proprietario\s*:\s*([^\n]+)/i);

        return match ? String(match[1]).trim() : '';
    }

    function getCountryName() {
        const mainFlag = document.getElementById('cphContent_nationalFlag');
        if (mainFlag) {
            const title = String(mainFlag.getAttribute('title') || '').trim();
            if (title) return title;
        }

        for (const img of document.querySelectorAll('img[src*="/flags/"]')) {
            const title = String(img.getAttribute('title') || '').trim();
            if (title) return title;
        }

        return '';
    }

    function getCountryFlagImg() {
        const flag = document.getElementById('cphContent_nationalFlag') || document.querySelector('img[src*="/flags/"]');
        return flag && flag.src
            ? `<img src="${flag.src}" style="height:12px; vertical-align:middle; margin-left:4px;">`
            : '';
    }

    function showToast(message, isError = false) {
        const toast = document.createElement('div');
        toast.textContent = message;

        Object.assign(toast.style, {
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: '99999',
            background: isError ? '#b71c1c' : '#333',
            color: '#fff',
            padding: '10px 14px',
            borderRadius: '8px',
            fontSize: '14px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
            maxWidth: '340px',
            lineHeight: '1.35'
        });

        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 4000);
    }

    function buildSkillMap() {
        const map = new Map();

        document.querySelectorAll('td').forEach(td => {
            const txt = String(td.innerText || td.textContent || '').trim();
            if (!txt.includes(':') || !/\(\d+\)/.test(txt)) return;

            const label = normalizeLabel(txt.split(':')[0]);
            const value = extractNumber(txt);
            if (label && value) map.set(label, value);
        });

        return map;
    }

    function getSkillByLabels(skillMap, labels) {
        for (const label of labels) {
            const value = skillMap.get(normalizeLabel(label));
            if (value !== undefined && value !== '') return value;
        }
        return '';
    }

    function collectSkills() {
        const skillMap = buildSkillMap();
        return [
            getSkillByLabels(skillMap, SKILL_LABELS.SW),
            getSkillByLabels(skillMap, SKILL_LABELS.RW),
            getSkillByLabels(skillMap, SKILL_LABELS.AV),
            getSkillByLabels(skillMap, SKILL_LABELS.DRI),
            getSkillByLabels(skillMap, SKILL_LABELS.ZZK),
            getSkillByLabels(skillMap, SKILL_LABELS.PAS),
            getSkillByLabels(skillMap, SKILL_LABELS.ZW),
            getSkillByLabels(skillMap, SKILL_LABELS.IV),
            getSkillByLabels(skillMap, SKILL_LABELS.REB),
            getSkillByLabels(skillMap, SKILL_LABELS.BLO),
            getSkillByLabels(skillMap, SKILL_LABELS.KON),
            getSkillByLabels(skillMap, SKILL_LABELS.FW),
            getSkillByLabels(skillMap, SKILL_LABELS.XP)
        ];
    }

    function getCurrentSkillMap() {
        const skills = collectSkills();
        return {
            SW: toInt(skills[0]),
            RW: toInt(skills[1]),
            AV: toInt(skills[2]),
            DRI: toInt(skills[3]),
            ZZK: toInt(skills[4]),
            PAS: toInt(skills[5]),
            ZW: toInt(skills[6]),
            IV: toInt(skills[7]),
            REB: toInt(skills[8]),
            BLO: toInt(skills[9]),
            KON: toInt(skills[10]),
            FW: toInt(skills[11]),
            XP: toInt(skills[12])
        };
    }

    function parseTrainingTarget(targetText) {
        const text = String(targetText || '').trim();
        const keys = Object.keys(TRAINING_TARGET_ALIASES).sort((a, b) => b.length - a.length);

        for (const key of keys) {
            const regex = new RegExp('\\b' + key + '\\b\\s*(\\d+)', 'i');
            const match = text.match(regex);

            if (!match) continue;

            const realKey = keys.find(k => k.toLowerCase() === key.toLowerCase());
            return {
                skill: TRAINING_TARGET_ALIASES[realKey],
                target: parseInt(match[1], 10),
                raw: text
            };
        }

        return null;
    }

    function evaluateTrainingTarget(targetText, currentSkills) {
        const parsed = parseTrainingTarget(targetText);

        if (!parsed) {
            return { status: 'neutral', icon: '➖', text: targetText };
        }

        const current = currentSkills[parsed.skill];

        if (current === null || current === undefined || Number.isNaN(current)) {
            return {
                status: 'open',
                icon: '⬜',
                text: targetText,
                current: null,
                target: parsed.target,
                skill: parsed.skill
            };
        }

        if (current >= parsed.target) {
            return {
                status: 'done',
                icon: '🟩',
                text: targetText,
                current,
                target: parsed.target,
                skill: parsed.skill
            };
        }

        return {
            status: 'open',
            icon: '⬜',
            text: targetText,
            current,
            target: parsed.target,
            skill: parsed.skill
        };
    }

    function buildProgressBar(percent) {
        const totalBars = 10;
        const filledBars = Math.round((percent / 100) * totalBars);
        let html = '';

        for (let i = 0; i < totalBars; i++) {
            const filled = i < filledBars;
            let color = '#d0d0d0';

            if (filled) {
                if (percent < 40) color = '#c62828';
                else if (percent < 60) color = '#f9a825';
                else color = '#2e7d32';
            }

            html += `<span style="display:inline-block;width:14px;height:8px;margin-right:2px;border-radius:2px;background:${color};"></span>`;
        }

        return html;
    }

    function sendJson(url, payload) {
        return new Promise((resolve, reject) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify(payload),
                onload(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        data.ok ? resolve(data) : reject(new Error(data.error || 'Unbekannter Fehler.'));
                    } catch {
                        reject(new Error('Antwort konnte nicht gelesen werden.'));
                    }
                },
                onerror() {
                    reject(new Error('Verbindung fehlgeschlagen.'));
                }
            });
        });
    }

    function fetchUploadData(action, playerName, playerAge, playerLink) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.uploadWebAppUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({ action, name: playerName, age: playerAge, link: playerLink }),
                onload(response) {
                    try {
                        resolve(JSON.parse(response.responseText));
                    } catch {
                        resolve({ ok: false });
                    }
                },
                onerror() {
                    resolve({ ok: false });
                }
            });
        });
    }

    async function fetchLastUpdate(playerName, playerAge, playerLink) {
        const data = await fetchUploadData('getSwissLastUpdate', playerName, playerAge, playerLink);
        return data && data.ok ? String(data.lastUpdate || '').trim() : '';
    }

    async function fetchScout(playerName, playerAge, playerLink) {
        const data = await fetchUploadData('getScout', playerName, playerAge, playerLink);
        return {
            scout: data.scout || 'Brausetablette',
            mailLink: data.mailLink || ''
        };
    }

    async function fetchTrainingPlan(playerName, playerAge, playerLink) {
        return new Promise(resolve => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.trainingWebAppUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({
                    action: 'getTrainingPlan',
                    name: playerName,
                    age: playerAge,
                    link: playerLink,
                    lang: lang()
                }),
                onload(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve({
                            profile: data.profile || '',
                            targets: Array.isArray(data.targets) ? data.targets : [],
                            message: data.message || ''
                        });
                    } catch {
                        resolve({ profile: '', targets: [], message: 'Trainingsvorschlag konnte nicht geladen werden' });
                    }
                },
                onerror() {
                    resolve({ profile: '', targets: [], message: 'Trainingsvorschlag konnte nicht geladen werden' });
                }
            });
        });
    }

    function uploadPayload() {
        const name = getPlayerName();
        const age = getPlayerAge();
        const link = getPlayerLink();
        const country = getCountryName();
        const managerName = getManagerName();
        const skills = collectSkills();

        if (!name) throw new Error('Spielername nicht gefunden.');
        if (!age) throw new Error('Alter nicht gefunden.');
        if (!country) throw new Error('Land nicht gefunden.');
        if (!skills.length || skills.some(v => v === '')) throw new Error('Mindestens ein Skill fehlt.');

        return { name, age, link, country, managerName, skills };
    }

    async function uploadToDatabase() {
        try {
            const payload = uploadPayload();

            if (!isEligibleU21(payload.country, payload.age)) {
                showToast(uploadText('uploadOnlySwiss'), true);
                return;
            }

            showToast(`${uploadText('uploadToast')} ${payload.name} (${payload.age})`);
            const result = await sendJson(CONFIG.uploadWebAppUrl, payload);

            showToast(`${result.action === 'updated' ? uploadText('uploadSuccessUpdated') : uploadText('uploadSuccessInserted')} ${payload.name}`);
            updateLastUpdateLineToToday();
        } catch (err) {
            alert(uploadText('uploadFailed') + ' ' + (err.message || err));
        }
    }

    function getUpdateColor(dateStr) {
        if (!dateStr) return '#777';

        const parts = dateStr.split('.');
        if (parts.length !== 3) return '#777';

        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        if (Number.isNaN(date.getTime())) return '#777';

        const diffDays = (new Date() - date) / (1000 * 60 * 60 * 24);
        if (diffDays <= 14) return '#2e7d32';
        if (diffDays <= 49) return '#f9a825';
        return '#c62828';
    }

    function updateLastUpdateLineToToday() {
        const updateLine = document.getElementById('bb-upload-last-update');
        if (!updateLine) return;

        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const yyyy = today.getFullYear();
        updateLine.innerHTML = `${uploadText('lastUpdate')} <b style="color:#2e7d32;">${dd}.${mm}.${yyyy}</b>`;
    }

    function createShell() {
        const existing = document.getElementById('bb-u21-upload-shell');
        if (existing) return existing;

        const rightColumn = document.getElementById('rightColumn');
        if (!rightColumn) return null;

        const shell = document.createElement('div');
        shell.id = 'bb-u21-upload-shell';
        Object.assign(shell.style, {
            position: 'relative',
            marginTop: '12px',
            width: '100%',
            boxSizing: 'border-box',
            overflow: 'visible'
        });

        const anchor = document.getElementById('cbBuddyList');
        if (anchor && anchor.parentNode === rightColumn) {
            rightColumn.insertBefore(shell, anchor.nextSibling);
        } else {
            rightColumn.appendChild(shell);
        }

        return shell;
    }

    function createUploadBox(shell) {
        const existing = document.getElementById('bb-u21-upload-box');
        if (existing) return existing;

        const box = document.createElement('div');
        box.id = 'bb-u21-upload-box';
        box.className = 'noclass';
        box.style.width = '100%';
        box.style.boxSizing = 'border-box';

        box.innerHTML = `
            <div class="boxheader" style="display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:6px 8px;">
                <span style="font-size:15px;">📤</span>
                <span>${uploadText('title')}</span>
            </div>
            <div class="boxcontent" style="padding:12px;width:100%;box-sizing:border-box;">
                <div id="bb-upload-actions" style="display:flex;flex-direction:column;gap:10px;margin-bottom:12px;"></div>
                <div id="bb-upload-note" style="font-size:11px;color:#666;line-height:1.45;"></div>
            </div>
        `;

        shell.appendChild(box);
        return box;
    }

    function createTrainingBox(shell) {
        const existing = document.getElementById('bb-training-plan-box');
        if (existing) return existing;

        const tr = trainingText();
        const box = document.createElement('div');
        box.id = 'bb-training-plan-box';
        box.className = 'noclass';
        Object.assign(box.style, {
            position: 'absolute',
            left: 'calc(100% + 12px)',
            top: '0',
            width: CONFIG.trainingPanelWidth + 'px',
            boxSizing: 'border-box'
        });

        box.innerHTML = `
            <div class="boxheader" style="display:flex;align-items:center;gap:6px;width:100%;box-sizing:border-box;padding:6px 8px;">
                <span style="font-size:15px;">📋</span>
                <span>${tr.title}</span>
            </div>
            <div class="boxcontent" style="padding:12px;width:100%;box-sizing:border-box;font-size:11px;line-height:1.45;color:#666;">
                <div id="bb-training-plan-content">${tr.loading}</div>
            </div>
        `;

        shell.appendChild(box);
        return box;
    }

    function createButton({ text, color, textColor = '#fff', onClick, disabled = false, title = '' }) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.textContent = text;
        if (title) btn.title = title;

        Object.assign(btn.style, {
            width: '100%',
            padding: '8px 10px',
            background: disabled ? '#cfcfcf' : color,
            color: disabled ? '#777' : textColor,
            border: 'none',
            borderRadius: '8px',
            cursor: disabled ? 'default' : 'pointer',
            fontWeight: 'bold',
            fontSize: '12px',
            boxShadow: disabled ? 'inset 0 1px 0 rgba(255,255,255,0.5)' : '0 2px 8px rgba(0,0,0,0.20)',
            transition: 'transform 0.08s ease'
        });

        if (!disabled && typeof onClick === 'function') {
            btn.addEventListener('click', onClick);
            btn.addEventListener('mouseenter', () => { btn.style.transform = 'translateY(-1px)'; });
            btn.addEventListener('mouseleave', () => { btn.style.transform = 'translateY(0)'; });
        }

        return btn;
    }

    function renderTrainingPlan(trainingData) {
        const wrap = document.getElementById('bb-training-plan-content');
        if (!wrap) return;

        const tr = trainingText();
        const profile = String(trainingData.profile || '').trim();
        const message = String(trainingData.message || '').trim();
        const targets = Array.isArray(trainingData.targets) ? trainingData.targets : [];
        const currentSkills = getCurrentSkillMap();

        if (!profile) {
            wrap.innerHTML = `<div style="font-size:11px;line-height:1.45;color:#666;"><div style="margin-bottom:8px;"><b>${tr.profile}:</b> ${tr.noProfile}</div></div>`;
            return;
        }

        const evaluatedTargets = targets.map(target => evaluateTrainingTarget(target, currentSkills));
        const countableTargets = evaluatedTargets.filter(t => t.status === 'done' || t.status === 'open');
        const doneTargets = countableTargets.filter(t => t.status === 'done');
        const progressPercent = countableTargets.length ? Math.round((doneTargets.length / countableTargets.length) * 100) : 0;

        let html = `
            <div style="font-size:11px;line-height:1.45;color:#666;">
                <div style="margin-bottom:8px;"><b>${tr.profile}:</b> ${profile}</div>
                <div style="margin-bottom:4px;font-weight:bold;">${tr.progress}: ${doneTargets.length}/${countableTargets.length} ${tr.goalsDone} (${progressPercent}%)</div>
                <div style="margin-bottom:10px;">${buildProgressBar(progressPercent)}</div>
        `;

        if (evaluatedTargets.length) {
            html += `<div style="font-weight:bold;margin-bottom:6px;">${tr.goals}:</div>`;
            html += `<div style="display:flex;flex-direction:column;gap:5px;margin-bottom:10px;">`;

            let numberIndex = 0;
            evaluatedTargets.forEach(evaluation => {
                let icon = '➖';
                let color = '#666';
                let numberLabel = '';

                if (evaluation.status === 'done') {
                    icon = '🟩';
                    color = '#2e7d32';
                    numberIndex++;
                    numberLabel = numberIndex + '.';
                } else if (evaluation.status === 'open') {
                    icon = '⬜';
                    color = '#333';
                    numberIndex++;
                    numberLabel = numberIndex + '.';
                }

                let extraInfo = '';
                if (evaluation.status === 'done') {
                    extraInfo = ` <span style="color:#2e7d32;">(${tr.done})</span>`;
                } else if (evaluation.status === 'open' && evaluation.current !== null && evaluation.current !== undefined && evaluation.target !== undefined) {
                    const popsLeft = Math.max(0, evaluation.target - evaluation.current);
                    extraInfo = ` <span style="color:#888;">(${popsLeft} ${tr.popsLeft})</span>`;
                }

                html += `
                    <div style="display:flex;align-items:flex-start;gap:6px;color:${color};">
                        <span style="min-width:18px;font-weight:bold;">${numberLabel}</span>
                        <span style="min-width:18px;">${icon}</span>
                        <span>${evaluation.text}${extraInfo}</span>
                    </div>
                `;
            });

            html += `</div>`;
        } else {
            html += `<div style="margin-bottom:10px;">${tr.noPlan}</div>`;
        }

        html += `
            <div style="margin-bottom:6px;">💡 <b>${tr.tipLabel}:</b> ${tr.tipFw}</div>
            <div style="margin-bottom:6px;">💡 <b>${tr.tipLabel}:</b> ${tr.tipMinutes}</div>
        `;

        if (progressPercent >= 50) {
            html += `<div style="color:#2e7d32;font-weight:bold;">📨 <b>${tr.noteLabel}:</b> ${tr.noteContact}</div>`;
        } else {
            html += `<div style="color:#888;">📨 <b>${tr.noteLabel}:</b> ${tr.noteContactAt}</div>`;
        }

        if (message && evaluatedTargets.length === 0) {
            html += `<div style="margin-top:8px;">${message}</div>`;
        }

        html += `</div>`;
        wrap.innerHTML = html;
    }

    function renderUploadInfo({ noteWrap, playerName, age, country, isEligible, scout, mailLink }) {
        const scoutHtml = isEligible
            ? `<div style="margin-bottom:6px;">${uploadText('scout')} <b>${scout}</b>${mailLink ? `<a href="${mailLink.startsWith('http') ? mailLink : new URL(mailLink, window.location.origin).href}" target="_blank" title="Nachricht an Scout" style="margin-left:6px;text-decoration:none;font-size:12px;">✉️</a>` : ''}</div>`
            : `<div style="margin-bottom:6px;color:#888;">${uploadText('scout')} <b>-</b></div>`;

        noteWrap.innerHTML = `
            <div>${uploadText('playerDetected')}</div>
            <div><b>${playerName}</b> | ${age}</div>
            <div style="margin-bottom:6px;"><b>${country}</b> ${getCountryFlagImg()}</div>
            ${scoutHtml}
            <span id="bb-upload-last-update">${isEligible ? uploadText('lastUpdateLoading') : `${uploadText('lastUpdate')} <span style="color:#777;">-</span>`}</span>
        `;
    }

    async function buildSidebarContent() {
        const shell = createShell();
        if (!shell) return;

        const uploadBox = createUploadBox(shell);
        createTrainingBox(shell);

        const actionsWrap = uploadBox.querySelector('#bb-upload-actions');
        const noteWrap = uploadBox.querySelector('#bb-upload-note');
        if (!actionsWrap || !noteWrap || actionsWrap.dataset.ready === '1') return;

        const playerName = getPlayerName() || uploadText('unknownPlayer');
        const country = getCountryName() || uploadText('unknownPlayer');
        const age = getPlayerAge() || '?';
        const playerLink = getPlayerLink();
        const isEligible = isEligibleU21(country, age);

        actionsWrap.appendChild(createButton({
            text: uploadText('uploadButton'),
            color: '#1565c0',
            onClick: uploadToDatabase,
            disabled: !isEligible,
            title: isEligible ? uploadText('uploadButton') : uploadText('uploadOnlySwiss')
        }));

        let scout = '-';
        let mailLink = '';

        if (isEligible) {
            const scoutData = await fetchScout(playerName, age, playerLink);
            scout = scoutData.scout;
            mailLink = scoutData.mailLink;
        }

        renderUploadInfo({ noteWrap, playerName, age, country, isEligible, scout, mailLink });

        const updateLine = document.getElementById('bb-upload-last-update');
        if (updateLine && isEligible) {
            const lastUpdate = await fetchLastUpdate(playerName, age, playerLink);
            if (lastUpdate) {
                updateLine.innerHTML = `${uploadText('lastUpdate')} <b style="color:${getUpdateColor(lastUpdate)};">${lastUpdate}</b>`;
            } else {
                updateLine.innerHTML = `${uploadText('lastUpdate')} <span style="color:#777;">${uploadText('notFound')}</span>`;
            }
        }

        if (isEligible) {
            const trainingData = await fetchTrainingPlan(playerName, age, playerLink);
            renderTrainingPlan(trainingData);
        } else {
            const wrap = document.getElementById('bb-training-plan-content');
            if (wrap) wrap.innerHTML = `<div style="color:#888;">${trainingText().onlyU21}</div>`;
        }

        actionsWrap.dataset.ready = '1';
    }

    function initPlayerPage() {
        setTimeout(buildSidebarContent, CONFIG.initDelayMs);
    }

    if (isPlayerPage()) {
        window.addEventListener('load', initPlayerPage);
    }
})();
