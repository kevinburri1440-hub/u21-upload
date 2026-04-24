// ==UserScript==
// @name         BuzzerBeater U21 Upload
// @namespace    http://tampermonkey.net/
// @version      1.4
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
        trainingPanelWidth: 430
    };

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

    function cleanPlayerName(text) {
        return String(text || '')
            .replace(/\(\d+\)/g, '')
            .replace(/\s+/g, ' ')
            .trim();
    }

    function normalizeLabel(text) {
        return String(text || '')
            .replace(/\s+/g, ' ')
            .replace(/:\s*$/, '')
            .trim()
            .toLowerCase();
    }

    function extractNumber(text) {
        if (!text) return '';
        const match = text.match(/\((\d+)\)/);
        return match ? match[1] : '';
    }

    function getBodyText(doc = document) {
        if (!doc || !doc.body) return '';
        return String(doc.body.innerText || doc.body.textContent || '');
    }

    function detectUiLanguage() {
        const text = getBodyText();

        if (
            /Alter\s*:/i.test(text) ||
            /Besitzer\s*:/i.test(text) ||
            /Gehalt/i.test(text) ||
            /Potenzial\s*:/i.test(text)
        ) {
            return 'de';
        }

        if (
            /Âge\s*:/i.test(text) ||
            /Propriétaire\s*:/i.test(text) ||
            /Salaire/i.test(text) ||
            /Potentiel\s*:/i.test(text)
        ) {
            return 'fr';
        }

        if (
            /Età\s*:/i.test(text) ||
            /Proprietario\s*:/i.test(text) ||
            /Stipendio/i.test(text) ||
            /Potenziale\s*:/i.test(text)
        ) {
            return 'it';
        }

        if (
            /Age\s*:/i.test(text) ||
            /Owner\s*:/i.test(text) ||
            /Salary/i.test(text) ||
            /Potential\s*:/i.test(text)
        ) {
            return 'en';
        }

        return 'de';
    }

    function getTranslations() {
        return {
            de: {
                title: 'U21-Upload',
                uploadButton: 'Upload to Database',
                playerDetected: 'Spieler erkannt:',
                scout: 'Scout:',
                lastUpdateLoading: 'Letztes Update wird geladen ...',
                lastUpdate: 'Letztes Update:',
                notFound: 'nicht gefunden',
                onlySwiss: 'Dieses Tool ist nur für Schweizer Spieler gedacht.',
                uploadToast: 'Upload:',
                uploadSuccessUpdated: '✅ Datenbank aktualisiert:',
                uploadSuccessInserted: '✅ Datenbank neu gespeichert:',
                uploadOnlySwiss: 'Nur für Schweizer Spieler gedacht.',
                uploadFailed: 'Upload fehlgeschlagen:'
            },
            en: {
                title: 'U21-Upload',
                uploadButton: 'Upload to Database',
                playerDetected: 'Player detected:',
                scout: 'Scout:',
                lastUpdateLoading: 'Last update is loading ...',
                lastUpdate: 'Last update:',
                notFound: 'not found',
                onlySwiss: 'This tool is only intended for Swiss players.',
                uploadToast: 'Upload:',
                uploadSuccessUpdated: '✅ Database updated:',
                uploadSuccessInserted: '✅ Saved to database:',
                uploadOnlySwiss: 'Only intended for Swiss players.',
                uploadFailed: 'Upload failed:'
            },
            fr: {
                title: 'U21-Upload',
                uploadButton: 'Upload to Database',
                playerDetected: 'Joueur détecté :',
                scout: 'Scout :',
                lastUpdateLoading: 'Dernière mise à jour en cours de chargement ...',
                lastUpdate: 'Dernière mise à jour :',
                notFound: 'introuvable',
                onlySwiss: 'Cet outil est uniquement destiné aux joueurs suisses.',
                uploadToast: 'Téléversement :',
                uploadSuccessUpdated: '✅ Base de données mise à jour :',
                uploadSuccessInserted: '✅ Enregistré dans la base :',
                uploadOnlySwiss: 'Uniquement pour les joueurs suisses.',
                uploadFailed: 'Échec du téléversement :'
            },
            it: {
                title: 'U21-Upload',
                uploadButton: 'Upload to Database',
                playerDetected: 'Giocatore rilevato:',
                scout: 'Scout:',
                lastUpdateLoading: 'Ultimo aggiornamento in caricamento ...',
                lastUpdate: 'Ultimo aggiornamento:',
                notFound: 'non trovato',
                onlySwiss: 'Questo strumento è destinato solo ai giocatori svizzeri.',
                uploadToast: 'Upload:',
                uploadSuccessUpdated: '✅ Database aggiornato:',
                uploadSuccessInserted: '✅ Salvato nel database:',
                uploadOnlySwiss: 'Solo per giocatori svizzeri.',
                uploadFailed: 'Upload fallito:'
            }
        };
    }

    function t(key) {
        const lang = detectUiLanguage();
        const translations = getTranslations();
        return (translations[lang] && translations[lang][key]) || translations.de[key] || key;
    }

    function isPlayerPage() {
        return /\/player\//i.test(window.location.pathname);
    }

    function getPlayerName() {
        const headerLink = document.querySelector('.boxheader a[href*="/player/"]');
        if (headerLink) {
            const text = cleanPlayerName(headerLink.textContent);
            if (text) return text;
        }

        const playerNameLink = document.querySelector('#cphContent_lblPlayerName a, #cphContent_playerName a');
        if (playerNameLink) {
            const text = cleanPlayerName(playerNameLink.textContent);
            if (text) return text;
        }

        const allPlayerLinks = Array.from(document.querySelectorAll('a[href*="/player/"]'));
        for (const link of allPlayerLinks) {
            const raw = String(link.textContent || '').trim();
            const cleaned = cleanPlayerName(raw);

            if (!cleaned) continue;
            if (/\(\d{6,}\)/.test(raw)) return cleaned;
        }

        const candidates = Array.from(document.querySelectorAll('h1, h2, strong, b, td, div, span'));
        for (const el of candidates) {
            const raw = String(el.textContent || '').trim();
            if (!raw) continue;
            if (raw.length > 120) continue;
            if (!/\(\d{6,}\)/.test(raw)) continue;

            const cleaned = cleanPlayerName(raw);
            if (cleaned) return cleaned;
        }

        const pageText = getBodyText();
        const lines = pageText.split('\n').map(s => s.trim()).filter(Boolean);

        for (const line of lines) {
            if (/\(\d{6,}\)/.test(line)) {
                const cleaned = cleanPlayerName(line);
                if (cleaned) return cleaned;
            }
        }

        return '';
    }

    function getPlayerAge() {
        const match = getBodyText().match(/Alter:\s*(\d+)/i) ||
            getBodyText().match(/Age:\s*(\d+)/i) ||
            getBodyText().match(/Âge\s*:\s*(\d+)/i) ||
            getBodyText().match(/Età\s*:\s*(\d+)/i);
        return match ? String(parseInt(match[1], 10)) : '';
    }
function getManagerName() {
    const text = getBodyText();

    const match =
        text.match(/Besitzer:\s*([^\n]+)/i) ||
        text.match(/Owner:\s*([^\n]+)/i) ||
        text.match(/Propriétaire\s*:\s*([^\n]+)/i) ||
        text.match(/Proprietario\s*:\s*([^\n]+)/i);

    return match ? String(match[1]).trim() : '';
}
    function getCountryName() {
        const flag = document.getElementById('cphContent_nationalFlag');
        if (flag) {
            const title = String(flag.getAttribute('title') || '').trim();
            if (title) return title;
        }

        const flags = document.querySelectorAll('img[src*="/flags/"]');
        for (const img of flags) {
            const title = String(img.getAttribute('title') || '').trim();
            if (title) return title;
        }

        return '';
    }

    function getCountryFlagImg() {
        const mainFlag = document.getElementById('cphContent_nationalFlag');
        if (mainFlag && mainFlag.src) {
            return `<img src="${mainFlag.src}" style="height:12px; vertical-align:middle; margin-left:4px;">`;
        }

        const anyFlag = document.querySelector('img[src*="/flags/"]');
        if (anyFlag && anyFlag.src) {
            return `<img src="${anyFlag.src}" style="height:12px; vertical-align:middle; margin-left:4px;">`;
        }

        return '';
    }

    function isSwissCountryName(countryName) {
        return ['schweiz', 'switzerland', 'suisse', 'svizzera', 'svizra']
            .includes(String(countryName || '').toLowerCase());
    }
    function isEligibleU21(country, age) {
    const ageNum = parseInt(age, 10);
    return isSwissCountryName(country) && !isNaN(ageNum) && ageNum <= 21;
}

    function getPlayerLink() {
        return window.location.href.split('#')[0];
    }

    function buildSkillMap() {
        const map = new Map();
        const links = document.querySelectorAll('a');

        for (const link of links) {
            const text = link.textContent.trim();
            if (!/\(\d+\)/.test(text)) continue;

            const td = link.closest('td');
            if (!td) continue;

            const labelText = td.textContent.split(':')[0]?.trim();
            if (!labelText) continue;

            map.set(normalizeLabel(labelText), extractNumber(text));
        }

        return map;
    }

    function collectSkills() {
        const skillMap = buildSkillMap();

        return [
            skillMap.get('sprungwurf') || '',
            skillMap.get('reichweite') || '',
            skillMap.get('außenvert.') || '',
            skillMap.get('dribbeln') || '',
            skillMap.get('zug zum korb') || '',
            skillMap.get('passspiel') || '',
            skillMap.get('zonenwurf') || '',
            skillMap.get('innenvert.') || '',
            skillMap.get('rebounds') || '',
            skillMap.get('blocken') || '',
            skillMap.get('kondition') || '',
            skillMap.get('freiwurf') || '',
            skillMap.get('erfahrung') || ''
        ];
    }

    function toInt(value) {
    const n = parseInt(String(value || '').trim(), 10);
    return Number.isNaN(n) ? null : n;
}

function getCurrentSkillMap() {
    const skills = collectSkills();

    return {
        SW: toInt(skills[0]),
        RW: toInt(skills[1]),
        AV: toInt(skills[2]),
        DRI: toInt(skills[3]),
        ZZK: toInt(skills[4]), // Zug zum Korb = ZzK
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

    // ZzK im Text erlauben, intern als ZZK behandeln
    const normalized = text.replace(/\bZzK\b/g, 'ZZK');

    const match = normalized.match(/\b(DRI|AV|SW|RW|ZZK|PAS|ZW|IV|REB|BLO|KON|FW|XP)\s*(\d+)\b/i);
    if (!match) {
        return null;
    }

    return {
        skill: match[1].toUpperCase(),
        target: parseInt(match[2], 10),
        raw: text
    };
}

function evaluateTrainingTarget(targetText, currentSkills) {
    const parsed = parseTrainingTarget(targetText);

    if (!parsed) {
        return {
            status: 'neutral',
            icon: '➖',
            text: targetText
        };
    }

    const current = currentSkills[parsed.skill];

    if (current === null || current === undefined) {
        return {
            status: 'neutral',
            icon: '➖',
            text: targetText
        };
    }

    if (current >= parsed.target) {
        return {
            status: 'done',
            icon: '✅',
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

        html += `<span style="
            display:inline-block;
            width:14px;
            height:8px;
            margin-right:2px;
            border-radius:2px;
            background:${color};
        "></span>`;
    }

    return html;
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
        if (!skills.length || skills.some(v => v === '')) {
            throw new Error('Mindestens ein Skill fehlt.');
        }

        return { name, age, link, country, managerName, skills };
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
                        if (data.ok) {
                            resolve(data);
                        } else {
                            reject(new Error(data.error || 'Unbekannter Fehler.'));
                        }
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

    async function fetchLastUpdate(playerName, playerAge, playerLink) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.uploadWebAppUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({
                    action: 'getSwissLastUpdate',
                    name: playerName,
                    age: playerAge,
                    link: playerLink
                }),
                onload(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        if (data && data.ok) {
                            resolve(String(data.lastUpdate || '').trim());
                        } else {
                            resolve('');
                        }
                    } catch {
                        resolve('');
                    }
                },
                onerror() {
                    resolve('');
                }
            });
        });
    }

    async function fetchScout(playerName, playerAge, playerLink) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.uploadWebAppUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({
                    action: 'getScout',
                    name: playerName,
                    age: playerAge,
                    link: playerLink
                }),
                onload(response) {
                    try {
                        const data = JSON.parse(response.responseText);
                        resolve({
                            scout: data.scout || 'Brausetablette',
                            mailLink: data.mailLink || ''
                        });
                    } catch {
                        resolve({ scout: 'Brausetablette', mailLink: '' });
                    }
                },
                onerror() {
                    resolve({ scout: 'Brausetablette', mailLink: '' });
                }
            });
        });
    }

    async function fetchTrainingPlan(playerName, playerAge, playerLink) {
        return new Promise((resolve) => {
            GM_xmlhttpRequest({
                method: 'POST',
                url: CONFIG.trainingWebAppUrl,
                headers: { 'Content-Type': 'application/json' },
                data: JSON.stringify({
                    action: 'getTrainingPlan',
                    name: playerName,
                    age: playerAge,
                    link: playerLink
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
                        resolve({
                            profile: '',
                            targets: [],
                            message: 'Trainingsvorschlag konnte nicht geladen werden'
                        });
                    }
                },
                onerror() {
                    resolve({
                        profile: '',
                        targets: [],
                        message: 'Trainingsvorschlag konnte nicht geladen werden'
                    });
                }
            });
        });
    }

    function getUpdateColor(dateStr) {
        if (!dateStr) return '#777';

        const parts = dateStr.split('.');
        if (parts.length !== 3) return '#777';

        const date = new Date(parts[2], parts[1] - 1, parts[0]);
        if (isNaN(date)) return '#777';

        const now = new Date();
        const diffDays = (now - date) / (1000 * 60 * 60 * 24);

        if (diffDays <= 14) return '#2e7d32';
        if (diffDays <= 49) return '#f9a825';
        return '#c62828';
    }

    function createShell() {
        if (document.getElementById('bb-u21-upload-shell')) {
            return document.getElementById('bb-u21-upload-shell');
        }

        const rightColumn = document.getElementById('rightColumn');
        if (!rightColumn) return null;

        const shell = document.createElement('div');
        shell.id = 'bb-u21-upload-shell';
        shell.style.position = 'relative';
        shell.style.marginTop = '12px';
        shell.style.width = '100%';
        shell.style.boxSizing = 'border-box';
        shell.style.overflow = 'visible';

        const anchor = document.getElementById('cbBuddyList');
        if (anchor && anchor.parentNode === rightColumn) {
            rightColumn.insertBefore(shell, anchor.nextSibling);
        } else {
            rightColumn.appendChild(shell);
        }

        return shell;
    }

    function createUploadBox(shell) {
        let box = document.getElementById('bb-u21-upload-box');
        if (box) return box;

        box = document.createElement('div');
        box.id = 'bb-u21-upload-box';
        box.className = 'noclass';
        box.style.width = '100%';
        box.style.boxSizing = 'border-box';

        box.innerHTML = `
            <div class="boxheader" style="
                display:flex;
                align-items:center;
                gap:6px;
                width:100%;
                box-sizing:border-box;
                padding:6px 8px;
            ">
                <span style="font-size:15px;">📤</span>
                <span>${t('title')}</span>
            </div>

            <div class="boxcontent" style="
                padding:12px;
                width:100%;
                box-sizing:border-box;
            ">
                <div id="bb-upload-actions" style="
                    display:flex;
                    flex-direction:column;
                    gap:10px;
                    margin-bottom:12px;
                "></div>

                <div id="bb-upload-note" style="
                    font-size:11px;
                    color:#666;
                    line-height:1.45;
                "></div>
            </div>
        `;

        shell.appendChild(box);
        return box;
    }

   function createTrainingBox(shell) {
    let box = document.getElementById('bb-training-plan-box');
    if (box) return box;

    box = document.createElement('div');
    box.id = 'bb-training-plan-box';
    box.className = 'noclass';
    box.style.position = 'absolute';
    box.style.left = 'calc(100% + 12px)';
    box.style.top = '0';
    box.style.width = CONFIG.trainingPanelWidth + 'px';
    box.style.boxSizing = 'border-box';

    box.innerHTML = `
        <div class="boxheader" style="
            display:flex;
            align-items:center;
            gap:6px;
            width:100%;
            box-sizing:border-box;
            padding:6px 8px;
        ">
            <span style="font-size:15px;">📋</span>
            <span>Trainingsvorschlag</span>
        </div>

        <div class="boxcontent" style="
            padding:12px;
            width:100%;
            box-sizing:border-box;
            font-size:11px;
            line-height:1.45;
            color:#666;
        ">
            <div id="bb-training-plan-content">Trainingsvorschlag wird geladen ...</div>
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
            btn.addEventListener('mouseenter', () => {
                btn.style.transform = 'translateY(-1px)';
            });
            btn.addEventListener('mouseleave', () => {
                btn.style.transform = 'translateY(0)';
            });
        }

        return btn;
    }

    async function uploadToDatabase() {
        try {
            const payload = uploadPayload();

            if (!isSwissCountryName(payload.country)) {
                showToast(t('uploadOnlySwiss'), true);
                return;
            }

            showToast(`${t('uploadToast')} ${payload.name} (${payload.age})`);
            const result = await sendJson(CONFIG.uploadWebAppUrl, payload);

            if (result.action === 'updated') {
                showToast(`${t('uploadSuccessUpdated')} ${payload.name}`);
            } else {
                showToast(`${t('uploadSuccessInserted')} ${payload.name}`);
            }

            const updateLine = document.getElementById('bb-upload-last-update');
            if (updateLine) {
                const today = new Date();
                const dd = String(today.getDate()).padStart(2, '0');
                const mm = String(today.getMonth() + 1).padStart(2, '0');
                const yyyy = today.getFullYear();
                const dateStr = `${dd}.${mm}.${yyyy}`;
                updateLine.innerHTML = t('lastUpdate') + ' <b style="color:#2e7d32;">' + dateStr + '</b>';
            }
        } catch (err) {
            alert(t('uploadFailed') + ' ' + (err.message || err));
        }
    }

  function renderTrainingPlan(trainingData) {
    const wrap = document.getElementById('bb-training-plan-content');
    if (!wrap) return;

    const profile = String(trainingData.profile || '').trim();
    const message = String(trainingData.message || '').trim();
    const targets = Array.isArray(trainingData.targets) ? trainingData.targets : [];
    const currentSkills = getCurrentSkillMap();

    if (!profile) {
        wrap.innerHTML = `
            <div style="font-size:11px; line-height:1.45; color:#666;">
                <div style="margin-bottom:8px;">
                    <b>Spielerprofil:</b> kein Spielerprofil hinterlegt, Scout kontaktieren
                </div>
            </div>
        `;
        return;
    }

    const evaluatedTargets = targets.map(target => evaluateTrainingTarget(target, currentSkills));

    const countableTargets = evaluatedTargets.filter(t => t.status === 'done' || t.status === 'open');
    const doneTargets = countableTargets.filter(t => t.status === 'done');
    const progressPercent = countableTargets.length
        ? Math.round((doneTargets.length / countableTargets.length) * 100)
        : 0;

    let html = `
        <div style="font-size:11px; line-height:1.45; color:#666;">
            <div style="margin-bottom:8px;">
                <b>Spielerprofil:</b> ${profile}
            </div>

            <div style="margin-bottom:4px; font-weight:bold;">
                Fortschritt: ${doneTargets.length}/${countableTargets.length} Ziele erfüllt (${progressPercent}%)
            </div>

            <div style="margin-bottom:10px;">
                ${buildProgressBar(progressPercent)}
            </div>
    `;

    if (evaluatedTargets.length) {
        html += `<div style="font-weight:bold; margin-bottom:6px;">Trainingsziele:</div>`;
        html += `<div style="display:flex; flex-direction:column; gap:5px; margin-bottom:10px;">`;

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
    }

    else if (evaluation.status === 'open') {
        icon = '⬜';
        color = '#333';
        numberIndex++;
        numberLabel = numberIndex + '.';
    }

    let extraInfo = '';

    if (evaluation.status === 'done') {
        extraInfo = ` <span style="color:#2e7d32;">(erfüllt)</span>`;
    }

    if (
        evaluation.status === 'open' &&
        evaluation.current !== undefined &&
        evaluation.target !== undefined
    ) {
        const popsLeft = evaluation.target - evaluation.current;
        extraInfo = ` <span style="color:#888;">(${popsLeft} Pops fehlen)</span>`;
    }

    html += `
        <div style="display:flex; align-items:flex-start; gap:6px; color:${color};">
            <span style="min-width:18px; font-weight:bold;">${numberLabel}</span>
            <span style="min-width:18px;">${icon}</span>
            <span>${evaluation.text}${extraInfo}</span>
        </div>
    `;
});
        html += `</div>`;
    } else {
        html += `<div style="margin-bottom:10px;">Kein Trainingsplan gefunden</div>`;
    }

    html += `
    <div style="margin-bottom:6px;">
        💡 <b>Tipp:</b> FW kann durch Trainingsplatz verbessert werden
    </div>

    <div style="margin-bottom:6px;">
        💡 <b>Tipp:</b> Für optimale Form 50-70 min Spielzeit pro Woche anstreben
    </div>
`;

   if (progressPercent >= 50) {
    html += `
        <div style="color:#2e7d32; font-weight:bold;">
            📨 <b>Hinweis:</b> Scout kontaktieren empfohlen
        </div>
    `;
} else {
    html += `
        <div style="color:#888;">
            📨 <b>Hinweis:</b> Scout kontaktieren ab 50% Fortschritt
        </div>
    `;
}

    if (message && evaluatedTargets.length === 0) {
        html += `<div style="margin-top:8px;">${message}</div>`;
    }

    html += `
        </div>
        </div>
    `;

    wrap.innerHTML = html;
}
    async function buildSidebarContent() {
        const shell = createShell();
        if (!shell) return;

        const uploadBox = createUploadBox(shell);
        createTrainingBox(shell);

        const actionsWrap = uploadBox.querySelector('#bb-upload-actions');
        const noteWrap = uploadBox.querySelector('#bb-upload-note');
        if (!actionsWrap || !noteWrap) return;
        if (actionsWrap.dataset.ready === '1') return;

        const playerName = getPlayerName() || 'Unbekannt';
        const country = getCountryName() || 'Unbekannt';
        const age = getPlayerAge() || '?';
        const playerLink = getPlayerLink() || '';
        const isSwiss = isSwissCountryName(country);
const isEligible = isEligibleU21(country, age);

        const uploadBtn = createButton({
            text: t('uploadButton'),
            color: '#1565c0',
            onClick: uploadToDatabase,
            disabled: !isEligible,
            title: t('uploadButton')
        });

        actionsWrap.appendChild(uploadBtn);

       let scout = '-';
let mailLink = '';

if (isEligible) {
    const scoutData = await fetchScout(playerName, age, playerLink);
    scout = scoutData.scout;
    mailLink = scoutData.mailLink;
}

        noteWrap.innerHTML = `
            <div>${t('playerDetected')}</div>

            <div>
                <b>${playerName}</b> | ${age}
            </div>

            <div style="margin-bottom:6px;">
                <b>${country}</b> ${getCountryFlagImg()}
            </div>

            <div style="margin-bottom:6px;">
               ${t('scout')}
<b>${scout}</b>
${
    mailLink
        ? `<a href="${mailLink.startsWith('http') ? mailLink : new URL(mailLink, window.location.origin).href}" target="_blank" title="Nachricht an Scout" style="margin-left:6px; text-decoration:none; font-size:12px;">✉️</a>`
        : ''
}
            </div>

            <span id="bb-upload-last-update">${t('lastUpdateLoading')}</span>
        `;

       const lastUpdate = isEligible
    ? await fetchLastUpdate(playerName, age, playerLink)
    : '';
        const updateLine = document.getElementById('bb-upload-last-update');

        if (updateLine) {
            if (lastUpdate) {
                const color = getUpdateColor(lastUpdate);
                updateLine.innerHTML = t('lastUpdate') + ' <b style="color:' + color + ';">' + lastUpdate + '</b>';
            } else {
                updateLine.innerHTML = t('lastUpdate') + ' <span style="color:#777;">' + t('notFound') + '</span>';
            }

            if (!isSwiss) {
                updateLine.innerHTML += '<div style="margin-top:8px; color:#c62828; font-weight:bold;">' + t('onlySwiss') + '</div>';
            }
        }

        if (isEligible) {
    const trainingData = await fetchTrainingPlan(playerName, age, playerLink);
    renderTrainingPlan(trainingData);
} else {
    const wrap = document.getElementById('bb-training-plan-content');
    if (wrap) {
        wrap.innerHTML = `
            <div style="color:#888;">
                Trainingsvorschlag nur verfügbar für Schweizer Spieler bis 21 Jahre.
            </div>
        `;
    }
}

        actionsWrap.dataset.ready = '1';
    }

    function initPlayerPage() {
        setTimeout(async () => {
            await buildSidebarContent();
        }, 900);
    }

    if (isPlayerPage()) {
        window.addEventListener('load', initPlayerPage);
    }
})();
