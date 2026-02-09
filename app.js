// ===== State Management =====
let currentStep = 1;
let authMode = 'login'; // 'login' or 'register'

// ===== Auth System =====
function getToken() {
    return localStorage.getItem('auth_token');
}

function setToken(token) {
    localStorage.setItem('auth_token', token);
}

function clearToken() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_data');
}

function getUserData() {
    try {
        return JSON.parse(localStorage.getItem('user_data') || 'null');
    } catch { return null; }
}

function setUserData(data) {
    localStorage.setItem('user_data', JSON.stringify(data));
}

function showAuthModal() {
    document.getElementById('auth-modal').style.display = 'flex';
    document.getElementById('auth-error').style.display = 'none';
}

function closeAuthModal() {
    document.getElementById('auth-modal').style.display = 'none';
}

function toggleAuthMode(e) {
    e.preventDefault();
    authMode = authMode === 'login' ? 'register' : 'login';
    document.getElementById('auth-modal-title').textContent =
        authMode === 'login' ? 'Se connecter' : 'Créer un compte';
    document.getElementById('auth-submit-btn').textContent =
        authMode === 'login' ? 'Se connecter' : 'Créer mon compte';
    document.getElementById('auth-toggle-text').textContent =
        authMode === 'login' ? 'Pas encore de compte ?' : 'Déjà un compte ?';
    document.getElementById('auth-toggle-link').textContent =
        authMode === 'login' ? 'Créer un compte' : 'Se connecter';
    document.getElementById('auth-referral-group').style.display =
        authMode === 'register' ? 'block' : 'none';
    document.getElementById('auth-error').style.display = 'none';
}

async function submitAuth() {
    const email = document.getElementById('auth-email').value.trim();
    const password = document.getElementById('auth-password').value;
    const referralCode = document.getElementById('auth-referral').value.trim();
    const errorEl = document.getElementById('auth-error');

    if (!email || !password) {
        errorEl.textContent = 'Veuillez remplir tous les champs';
        errorEl.style.display = 'block';
        return;
    }

    if (authMode === 'register' && password.length < 6) {
        errorEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères';
        errorEl.style.display = 'block';
        return;
    }

    try {
        const resp = await fetch('/api/auth', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action: authMode === 'login' ? 'login' : 'register',
                email,
                password,
                referralCode: authMode === 'register' ? referralCode : undefined
            })
        });

        const data = await resp.json();

        if (!resp.ok) {
            errorEl.textContent = data.error || 'Erreur';
            errorEl.style.display = 'block';
            return;
        }

        setToken(data.token);
        setUserData(data.user);
        closeAuthModal();
        updateAuthUI();
        loadCredits();

    } catch (err) {
        errorEl.textContent = 'Erreur de connexion au serveur';
        errorEl.style.display = 'block';
    }
}

function logout() {
    clearToken();
    updateAuthUI();
    document.getElementById('credit-bar').style.display = 'none';
}

function updateAuthUI() {
    const headerAuth = document.getElementById('header-auth');
    const user = getUserData();
    const token = getToken();

    if (token && user) {
        headerAuth.innerHTML = `
            <span class="header-user">${user.email}</span>
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);" onclick="logout()">Déconnexion</button>
        `;
        loadCredits();
    } else {
        headerAuth.innerHTML = `
            <button class="btn btn-sm" style="background:rgba(255,255,255,0.15);color:white;border:1px solid rgba(255,255,255,0.3);" onclick="showAuthModal()">Se connecter</button>
        `;
    }
}

async function loadCredits() {
    const token = getToken();
    if (!token) return;

    try {
        const resp = await fetch('/api/credits', {
            headers: { 'Authorization': 'Bearer ' + token }
        });

        if (!resp.ok) {
            if (resp.status === 401) { clearToken(); updateAuthUI(); }
            return;
        }

        const data = await resp.json();
        const creditBar = document.getElementById('credit-bar');
        creditBar.style.display = 'flex';
        document.getElementById('credit-count').textContent = data.totalAvailable;

        let planLabel = '';
        if (data.plan === 'monthly') planLabel = '(Mensuel)';
        else if (data.plan === 'annual') planLabel = '(Annuel)';
        else planLabel = '(Gratuit)';
        document.getElementById('credit-plan').textContent = planLabel;

    } catch (e) {}
}

async function useCredit() {
    const token = getToken();
    if (!token) return false;

    try {
        const resp = await fetch('/api/credits', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({ action: 'use' })
        });

        if (!resp.ok) {
            const data = await resp.json();
            if (data.needsUpgrade) return 'needs_upgrade';
            return false;
        }

        loadCredits(); // Refresh display
        return true;
    } catch (e) {
        return false;
    }
}

// ===== Navigation =====
function nextStep(step) {
    document.getElementById(`step-${currentStep}`).classList.remove('active');
    document.getElementById(`step-${step}`).classList.add('active');
    updateStepIndicator(step);
    currentStep = step;
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function prevStep(step) {
    nextStep(step);
}

function updateStepIndicator(step) {
    document.querySelectorAll('.step').forEach((el, i) => {
        el.classList.remove('active', 'completed');
        if (i + 1 < step) el.classList.add('completed');
        if (i + 1 === step) el.classList.add('active');
    });
}

// ===== Dynamic Form Entries =====
let educationCount = 1;
let experienceCount = 1;

function addEducation() {
    const list = document.getElementById('education-list');
    const index = educationCount++;
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.index = index;
    card.innerHTML = `
        <div class="entry-header">
            <h3>Formation ${index + 1}</h3>
            <button class="btn-remove" onclick="removeEntry('education', ${index})" title="Supprimer">&times;</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Établissement *</label>
                <input type="text" class="edu-school" placeholder="HEC Paris, ESSEC, Dauphine...">
            </div>
            <div class="form-group">
                <label>Diplôme *</label>
                <input type="text" class="edu-degree" placeholder="Master en Finance">
            </div>
            <div class="form-group">
                <label>Spécialité</label>
                <input type="text" class="edu-field" placeholder="Finance de marche">
            </div>
            <div class="form-group">
                <label>GPA / Mention</label>
                <input type="text" class="edu-gpa" placeholder="Mention Bien, 15.2/20">
            </div>
            <div class="form-group">
                <label>Date début</label>
                <input type="text" class="edu-start" placeholder="Sept 2020">
            </div>
            <div class="form-group">
                <label>Date fin</label>
                <input type="text" class="edu-end" placeholder="Juin 2023">
            </div>
            <div class="form-group full-width">
                <label>Cours / details pertinents</label>
                <textarea class="edu-details" rows="2" placeholder="Cours : Valorisation, M&A, Modélisation financière..."></textarea>
            </div>
        </div>
    `;
    list.appendChild(card);
}

function addExperience() {
    const list = document.getElementById('experience-list');
    const index = experienceCount++;
    const card = document.createElement('div');
    card.className = 'entry-card';
    card.dataset.index = index;
    card.innerHTML = `
        <div class="entry-header">
            <h3>Expérience ${index + 1}</h3>
            <button class="btn-remove" onclick="removeEntry('experience', ${index})" title="Supprimer">&times;</button>
        </div>
        <div class="form-grid">
            <div class="form-group">
                <label>Entreprise *</label>
                <input type="text" class="exp-company" placeholder="Goldman Sachs, Rothschild...">
            </div>
            <div class="form-group">
                <label>Poste *</label>
                <input type="text" class="exp-title" placeholder="Analyste M&A">
            </div>
            <div class="form-group">
                <label>Lieu</label>
                <input type="text" class="exp-location" placeholder="Paris, France">
            </div>
            <div class="form-group">
                <label>Type</label>
                <select class="exp-type">
                    <option value="Stage">Stage</option>
                    <option value="Alternance">Alternance</option>
                    <option value="CDI">CDI</option>
                    <option value="CDD">CDD</option>
                    <option value="Freelance">Freelance</option>
                </select>
            </div>
            <div class="form-group">
                <label>Date début</label>
                <input type="text" class="exp-start" placeholder="Jan 2023">
            </div>
            <div class="form-group">
                <label>Date fin</label>
                <input type="text" class="exp-end" placeholder="Juin 2023 ou Present">
            </div>
            <div class="form-group full-width">
                <label>Description (une ligne par bullet point) *</label>
                <textarea class="exp-description" rows="4" placeholder="Réalisation de modèles de valorisation DCF..."></textarea>
            </div>
        </div>
    `;
    list.appendChild(card);
}

function addLanguage() {
    const list = document.getElementById('languages-list');
    const entry = document.createElement('div');
    entry.className = 'inline-entry';
    entry.innerHTML = `
        <input type="text" class="lang-name" placeholder="Espagnol">
        <select class="lang-level">
            <option value="Langue maternelle">Langue maternelle</option>
            <option value="Courant (C1/C2)">Courant (C1/C2)</option>
            <option value="Avancé (B2)" selected>Avancé (B2)</option>
            <option value="Intermédiaire (B1)">Intermédiaire (B1)</option>
            <option value="Débutant (A1/A2)">Débutant (A1/A2)</option>
        </select>
        <button class="btn-remove-inline" onclick="this.parentElement.remove()">&times;</button>
    `;
    list.appendChild(entry);
}

function removeEntry(type, index) {
    const list = document.getElementById(`${type}-list`);
    const cards = list.querySelectorAll('.entry-card');
    if (cards.length <= 1) return;
    const card = list.querySelector(`.entry-card[data-index="${index}"]`);
    if (card) card.remove();
}

// ===== Data Collection =====
function collectData() {
    const data = {};

    // Personal info
    data.firstName = document.getElementById('firstName').value.trim();
    data.lastName = document.getElementById('lastName').value.trim();
    data.email = document.getElementById('email').value.trim();
    data.phone = document.getElementById('phone').value.trim();
    data.address = document.getElementById('address').value.trim();
    data.linkedin = document.getElementById('linkedin').value.trim();
    data.nationality = document.getElementById('nationality').value.trim();
    data.birthDate = document.getElementById('birthDate').value;
    data.drivingLicense = document.getElementById('drivingLicense').value.trim();

    // Education
    data.education = [];
    document.querySelectorAll('#education-list .entry-card').forEach(card => {
        const edu = {
            school: card.querySelector('.edu-school').value.trim(),
            degree: card.querySelector('.edu-degree').value.trim(),
            field: card.querySelector('.edu-field').value.trim(),
            gpa: card.querySelector('.edu-gpa').value.trim(),
            start: card.querySelector('.edu-start').value.trim(),
            end: card.querySelector('.edu-end').value.trim(),
            details: card.querySelector('.edu-details').value.trim()
        };
        if (edu.school || edu.degree) data.education.push(edu);
    });

    // Experience
    data.experience = [];
    document.querySelectorAll('#experience-list .entry-card').forEach(card => {
        const exp = {
            company: card.querySelector('.exp-company').value.trim(),
            title: card.querySelector('.exp-title').value.trim(),
            location: card.querySelector('.exp-location').value.trim(),
            type: card.querySelector('.exp-type').value,
            start: card.querySelector('.exp-start').value.trim(),
            end: card.querySelector('.exp-end').value.trim(),
            description: card.querySelector('.exp-description').value.trim()
        };
        if (exp.company || exp.title) data.experience.push(exp);
    });

    // Skills
    data.technicalSkills = document.getElementById('technicalSkills').value.trim();
    data.certifications = document.getElementById('certifications').value.trim();
    data.financeSkills = document.getElementById('financeSkills').value.trim();

    // Languages
    data.languages = [];
    document.querySelectorAll('#languages-list .inline-entry').forEach(entry => {
        const name = entry.querySelector('.lang-name').value.trim();
        const level = entry.querySelector('.lang-level').value;
        if (name) data.languages.push({ name, level });
    });

    // Interests
    data.interests = document.getElementById('interests').value.trim();

    // Job offer
    data.jobTitle = document.getElementById('jobTitle').value.trim();
    data.companyName = document.getElementById('companyName').value.trim();
    data.jobDuration = document.getElementById('jobDuration').value.trim();
    data.jobRef = document.getElementById('jobRef').value.trim();
    data.letterLanguage = document.getElementById('letterLanguage').value;
    data.recipientName = document.getElementById('recipientName').value.trim();
    data.jobOffer = document.getElementById('jobOffer').value.trim();
    data.whyThisFirm = document.getElementById('whyThisFirm').value.trim();
    data.additionalNotes = document.getElementById('additionalNotes').value.trim();

    return data;
}

// ===== Keyword Extraction from Job Offer =====
function extractKeywords(jobOffer) {
    const financeKeywords = [
        'M&A', 'fusions-acquisitions', 'fusions acquisitions', 'DCF', 'LBO',
        'valorisation', 'valuation', 'due diligence', 'pitch book', 'pitch books',
        'modelisation', 'modelisation financiere', 'financial modeling',
        'Excel', 'VBA', 'PowerPoint', 'Bloomberg', 'Capital IQ', 'FactSet', 'Refinitiv',
        'Python', 'SQL', 'analyse financiere', 'financial analysis',
        'private equity', 'leveraged finance', 'debt capital markets', 'DCM',
        'equity capital markets', 'ECM', 'structured finance', 'project finance',
        'asset management', 'gestion d\'actifs', 'portfolio management',
        'trading', 'sales', 'research', 'equity research',
        'risk management', 'gestion des risques', 'compliance',
        'audit', 'conseil', 'advisory', 'restructuring', 'restructuration',
        'transaction services', 'corporate finance',
        'comps', 'comparables', 'multiples', 'accretion', 'dilution',
        'CFA', 'AMF', 'DSCR', 'EBITDA', 'EV', 'IRR', 'TRI', 'NPV', 'VAN',
        'credit', 'fixed income', 'derivatives', 'produits derives',
        'IPO', 'introduction en bourse', 'levee de fonds', 'fundraising',
        'reporting', 'consolidation', 'IFRS', 'normes comptables',
        'anglais', 'english', 'bilingue', 'courant',
        'rigueur', 'rigoureux', 'analytique', 'esprit analytique',
        'autonomie', 'autonome', 'equipe', 'travail en equipe', 'team',
        'communication', 'presentation', 'redaction',
        'detail', 'attention au detail', 'proactif', 'dynamique',
        'Grande Ecole', 'grande ecole', 'Bac+5', 'Master',
        'stage', 'alternance', 'CDI', 'VIE',
        'Bloomberg Market Concepts', 'BMC',
        'comptabilite', 'accounting', 'tresorerie', 'treasury',
        'marches financiers', 'financial markets',
        'investissement', 'investment', 'banking', 'banque'
    ];

    const offerLower = jobOffer.toLowerCase();
    const found = [];

    financeKeywords.forEach(kw => {
        if (offerLower.includes(kw.toLowerCase())) {
            found.push(kw);
        }
    });

    const unique = [...new Set(found.map(k => k.toLowerCase()))];
    return unique.map(k => found.find(f => f.toLowerCase() === k));
}

// ===== CV Generation =====
function generateCV(data, keywords) {
    const fullName = `${data.firstName} ${data.lastName}`;

    // Contact line
    const contactParts = [];
    if (data.email) contactParts.push(data.email);
    if (data.phone) contactParts.push(data.phone);
    if (data.address) contactParts.push(data.address);
    if (data.linkedin) contactParts.push(data.linkedin);
    if (data.nationality) contactParts.push(data.nationality);
    if (data.drivingLicense) contactParts.push(data.drivingLicense);
    const contactLine = contactParts.join(' <span class="sep">|</span> ');

    // Education section
    let educationHTML = '';
    data.education.forEach(edu => {
        const dateLine = [edu.start, edu.end].filter(Boolean).join(' - ');
        educationHTML += `
            <div class="cv-entry">
                <div class="cv-entry-header">
                    <span class="cv-entry-title">${esc(edu.school)}</span>
                    <span class="cv-entry-date">${esc(dateLine)}</span>
                </div>
                <div class="cv-entry-subtitle">
                    <span>${esc(edu.degree)}${edu.field ? ', ' + esc(edu.field) : ''}</span>
                    ${edu.gpa ? '<span>' + esc(edu.gpa) + '</span>' : ''}
                </div>
                ${edu.details ? '<div style="font-size:8.5pt;margin-top:1pt;">' + esc(edu.details) + '</div>' : ''}
            </div>
        `;
    });

    // Experience section
    let experienceHTML = '';
    data.experience.forEach(exp => {
        const dateLine = [exp.start, exp.end].filter(Boolean).join(' - ');
        const bullets = exp.description.split('\n').filter(b => b.trim());
        let bulletsHTML = '';
        if (bullets.length > 0) {
            bulletsHTML = '<ul class="cv-bullets">' +
                bullets.map(b => `<li>${esc(b.trim())}</li>`).join('') +
                '</ul>';
        }
        experienceHTML += `
            <div class="cv-entry">
                <div class="cv-entry-header">
                    <span class="cv-entry-title">${esc(exp.company)}${exp.location ? ', ' + esc(exp.location) : ''}</span>
                    <span class="cv-entry-date">${esc(dateLine)}</span>
                </div>
                <div class="cv-entry-subtitle">
                    <span>${esc(exp.title)} (${esc(exp.type)})</span>
                </div>
                ${bulletsHTML}
            </div>
        `;
    });

    // Skills section
    let skillsHTML = '<div class="cv-inline-list">';
    if (data.technicalSkills) {
        skillsHTML += `<div class="cv-inline-item"><span class="cv-inline-label">Logiciels & Outils : </span>${esc(data.technicalSkills)}</div>`;
    }
    if (data.financeSkills) {
        skillsHTML += `<div class="cv-inline-item"><span class="cv-inline-label">Compétences Finance : </span>${esc(data.financeSkills)}</div>`;
    }
    if (data.certifications) {
        skillsHTML += `<div class="cv-inline-item"><span class="cv-inline-label">Certifications : </span>${esc(data.certifications)}</div>`;
    }
    skillsHTML += '</div>';

    // Languages section
    let languagesHTML = '<div class="cv-inline-list"><div class="cv-inline-item">';
    languagesHTML += data.languages.map(l => `${esc(l.name)} (${esc(l.level)})`).join(' <span class="sep">|</span> ');
    languagesHTML += '</div></div>';

    // Interests section
    let interestsHTML = '';
    if (data.interests) {
        const lines = data.interests.split('\n').filter(l => l.trim());
        interestsHTML = '<div class="cv-inline-list">' +
            lines.map(l => `<div class="cv-inline-item">${esc(l.trim())}</div>`).join('') +
            '</div>';
    }

    // Assemble CV
    return `
        <div class="cv-header">
            <div class="cv-name">${esc(fullName)}</div>
            <div class="cv-contact">${contactLine}</div>
        </div>

        ${educationHTML ? `
        <div class="cv-section">
            <div class="cv-section-title">Formation</div>
            ${educationHTML}
        </div>` : ''}

        ${experienceHTML ? `
        <div class="cv-section">
            <div class="cv-section-title">Expériences professionnelles</div>
            ${experienceHTML}
        </div>` : ''}

        ${data.technicalSkills || data.financeSkills || data.certifications ? `
        <div class="cv-section">
            <div class="cv-section-title">Compétences</div>
            ${skillsHTML}
        </div>` : ''}

        ${data.languages.length > 0 ? `
        <div class="cv-section">
            <div class="cv-section-title">Langues</div>
            ${languagesHTML}
        </div>` : ''}

        ${data.interests ? `
        <div class="cv-section">
            <div class="cv-section-title">Centres d'intérêt & activités</div>
            ${interestsHTML}
        </div>` : ''}
    `;
}

// ===== Cover Letter Generation — FR =====
function generateCoverLetterFR(data, keywords) {
    const fullName = `${data.firstName} ${data.lastName}`;
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    const city = data.address ? data.address.split(',')[0].trim() : 'Paris';

    // Sender block (top-left): name, phone, email
    const senderLines = [fullName];
    if (data.phone) senderLines.push(data.phone);
    if (data.email) senderLines.push(data.email);

    // Recipient block (top-right)
    const recipientLines = [esc(data.companyName)];
    if (data.recipientName) recipientLines.push(esc(data.recipientName));
    recipientLines.push('Service Recrutement');

    // Object line
    let objectLine = '';
    if (data.jobRef) {
        objectLine = `Objet : Réponse à l'offre de ${esc(data.jobTitle)} ref. ${esc(data.jobRef)}`;
    } else if (data.jobDuration) {
        objectLine = `Objet : Candidature pour un ${esc(data.jobTitle)} pour une durée de ${esc(data.jobDuration)}`;
    } else {
        objectLine = `Objet : Candidature au poste de ${esc(data.jobTitle)}`;
    }

    // Build paragraphs — AlumnEye structure
    const latestEdu = data.education.length > 0 ? data.education[0] : null;
    const latestExp = data.experience.length > 0 ? data.experience[0] : null;

    // P1: Intro — situation + interest
    let introLine = '';
    if (latestEdu) {
        introLine = `Actuellement ${latestEdu.degree}${latestEdu.field ? ' en ' + latestEdu.field : ''} a ${latestEdu.school}, je`;
    } else {
        introLine = 'Je';
    }
    const p1 = `${introLine} souhaite vous faire part de ma candidature pour le poste de ${esc(data.jobTitle)} au sein de ${esc(data.companyName)}.`;

    // P2: Why this firm — specific, not generic
    let p2 = '';
    if (data.whyThisFirm) {
        p2 = data.whyThisFirm;
    } else {
        p2 = `${esc(data.companyName)} se distingue par son positionnement unique dans le secteur. La qualité de ses équipes et l'envergure de ses opérations constituent pour moi un environnement d'apprentissage et de contribution idéal. C'est pourquoi j'ai choisi de candidater spécifiquement auprès de votre institution.`;
    }

    // P3: The candidate — experiences, skills, concrete examples
    let p3Parts = [];
    if (latestExp) {
        const bullets = latestExp.description.split('\n').filter(b => b.trim());
        const topBullet = bullets.length > 0 ? bullets[0].trim().toLowerCase() : '';
        p3Parts.push(`Mon expérience chez ${esc(latestExp.company)} en tant que ${esc(latestExp.title)} m'a permis de développer des compétences opérationnelles solides${topBullet ? ', notamment en ayant ' + topBullet : ''}.`);
    }
    if (data.experience.length > 1) {
        const exp2 = data.experience[1];
        p3Parts.push(`J'ai également eu l'opportunité de travailler chez ${esc(exp2.company)} (${esc(exp2.title)}), ce qui a renforcé ma compréhension du secteur et ma capacité à évoluer dans des environnements exigeants.`);
    }
    if (latestEdu && latestEdu.details) {
        p3Parts.push(`Ma formation m'a donné des bases solides en ${latestEdu.details.substring(0, 100).toLowerCase()}.`);
    }
    if (data.technicalSkills) {
        p3Parts.push(`Je maîtrise ${esc(data.technicalSkills)}.`);
    }
    const langLine = data.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(', ');
    if (langLine) {
        p3Parts.push(`Je parle ${langLine}.`);
    }
    const p3 = p3Parts.join(' ');

    // P4: Fit — why this match works, closing
    const p4 = `Convaincu que mon parcours et mes compétences correspondent aux attentes de votre équipe, je serais ravi de pouvoir échanger avec vous lors d'un entretien. Je reste à votre entière disposition et vous prie d'agréer, ${data.recipientName ? esc(data.recipientName) : 'Madame, Monsieur'}, l'expression de mes salutations distinguées.`;

    return `
        <div class="letter-header-fr">
            <div class="letter-sender-fr">
                ${senderLines.map(l => esc(l)).join('<br>')}
            </div>
            <div class="letter-recipient-fr">
                ${recipientLines.join('<br>')}
            </div>
        </div>

        <div class="letter-date-fr">
            ${esc(city)}, le ${dateStr}
        </div>

        <div class="letter-object">
            ${objectLine}
        </div>

        <div class="letter-salutation">
            ${data.recipientName ? esc(data.recipientName) + ',' : 'Madame, Monsieur,'}
        </div>

        <div class="letter-body">
            <p>${p1}</p>

            <p>${p2}</p>

            <p>${p3}</p>

            <p>${p4}</p>
        </div>

        <div class="letter-signature">
            ${esc(fullName)}
        </div>
    `;
}

// ===== Cover Letter Generation — EN =====
function generateCoverLetterEN(data, keywords) {
    const fullName = `${data.firstName} ${data.lastName}`;
    const today = new Date();
    const dateStr = today.toLocaleDateString('en-US', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Sender block (centered): name, email, phone
    const senderLines = [fullName];
    if (data.email) senderLines.push(data.email);
    if (data.phone) senderLines.push(data.phone);

    // Recipient block (left)
    const recipientLines = [esc(data.companyName)];
    if (data.recipientName) recipientLines.push(esc(data.recipientName));
    if (data.address) recipientLines.push(esc(data.address));

    // Subject line
    let subjectLine = '';
    if (data.jobRef) {
        subjectLine = `Subject: Application to offer "${esc(data.jobTitle)}" ref. ${esc(data.jobRef)}`;
    } else if (data.jobDuration) {
        subjectLine = `Subject: Application for an internship as ${esc(data.jobTitle)} for ${esc(data.jobDuration)}`;
    } else {
        subjectLine = `Subject: Application for ${esc(data.jobTitle)} position`;
    }

    const latestEdu = data.education.length > 0 ? data.education[0] : null;
    const latestExp = data.experience.length > 0 ? data.experience[0] : null;

    // P1: Intro
    let introLine = '';
    if (latestEdu) {
        introLine = `Currently pursuing a ${latestEdu.degree}${latestEdu.field ? ' in ' + latestEdu.field : ''} at ${latestEdu.school}, I`;
    } else {
        introLine = 'I';
    }
    const p1 = `${introLine} am writing to express my strong interest in the ${esc(data.jobTitle)} position at ${esc(data.companyName)}.`;

    // P2: Why this firm
    let p2 = '';
    if (data.whyThisFirm) {
        p2 = data.whyThisFirm;
    } else {
        p2 = `${esc(data.companyName)} stands out through its unique positioning in the industry. The quality of its teams and the scope of its operations represent an ideal environment for both learning and contributing. This is precisely why I have chosen to apply to your institution.`;
    }

    // P3: The candidate
    let p3Parts = [];
    if (latestExp) {
        const bullets = latestExp.description.split('\n').filter(b => b.trim());
        const topBullet = bullets.length > 0 ? bullets[0].trim().toLowerCase() : '';
        p3Parts.push(`During my experience at ${esc(latestExp.company)} as ${esc(latestExp.title)}, I developed strong operational skills${topBullet ? ', including ' + topBullet : ''}.`);
    }
    if (data.experience.length > 1) {
        const exp2 = data.experience[1];
        p3Parts.push(`I also had the opportunity to work at ${esc(exp2.company)} (${esc(exp2.title)}), which strengthened my understanding of the sector.`);
    }
    if (data.technicalSkills) {
        p3Parts.push(`I am proficient in ${esc(data.technicalSkills)}.`);
    }
    const langLine = data.languages.filter(l => l.name).map(l => `${l.name} (${l.level})`).join(', ');
    if (langLine) {
        p3Parts.push(`I speak ${langLine}.`);
    }
    const p3 = p3Parts.join(' ');

    // P4: Closing
    const p4 = `I am confident that my profile matches your team's expectations, and I would welcome the opportunity to discuss my application further in an interview. I remain at your disposal for any additional information.`;

    return `
        <div class="letter-sender-en">
            ${senderLines.map(l => esc(l)).join('<br>')}
        </div>

        <div class="letter-recipient-en">
            ${recipientLines.join('<br>')}
        </div>

        <div class="letter-date-en">
            ${dateStr}
        </div>

        <div class="letter-object">
            ${subjectLine}
        </div>

        <div class="letter-salutation">
            ${data.recipientName ? 'Dear ' + esc(data.recipientName) + ',' : 'Dear Hiring Manager,'}
        </div>

        <div class="letter-body">
            <p>${p1}</p>

            <p>${p2}</p>

            <p>${p3}</p>

            <p>${p4}</p>
        </div>

        <div class="letter-closing">
            Yours sincerely,
        </div>

        <div class="letter-signature">
            ${esc(fullName)}
        </div>
    `;
}

// ===== Auto-detect language from job offer text =====
function detectLanguage(text) {
    if (!text) return 'fr';
    const lower = text.toLowerCase();
    // Count French and English indicator words
    const frWords = ['nous recherchons', 'vous serez', 'poste', 'stage', 'missions', 'profil recherche',
        'candidat', 'entreprise', 'equipe', 'competences', 'formation', 'experience',
        'rejoindre', 'sein de', 'dans le cadre', 'rattache', 'responsabilites',
        'souhaitez', 'maitrise', 'bac+', 'diplome', 'alternance', 'obligatoire'];
    const enWords = ['we are looking', 'you will', 'position', 'internship', 'responsibilities', 'requirements',
        'candidate', 'company', 'team', 'skills', 'education', 'experience',
        'join', 'within', 'as part of', 'reporting to', 'duties',
        'apply', 'proficiency', 'degree', 'bachelor', 'mandatory', 'the ideal'];

    let frCount = 0;
    let enCount = 0;
    frWords.forEach(w => { if (lower.includes(w)) frCount++; });
    enWords.forEach(w => { if (lower.includes(w)) enCount++; });

    return enCount > frCount ? 'en' : 'fr';
}

// ===== Main Generation =====
async function generateDocuments() {
    const data = collectData();

    if (!data.firstName || !data.lastName) {
        alert('Veuillez renseigner votre prénom et nom.');
        return;
    }
    if (!data.jobTitle || !data.companyName) {
        alert('Veuillez renseigner le poste et l\'entreprise cible.');
        return;
    }

    const keywords = extractKeywords(data.jobOffer);

    // === CV is always FREE — generate immediately ===
    const cvHTML = generateCV(data, keywords);
    document.getElementById('cv-output').innerHTML = cvHTML;
    showATSAnalysis(data, keywords);
    nextStep(6);

    // === Letter requires auth + credits ===
    const letterOutput = document.getElementById('letter-output');
    const token = getToken();

    // Not logged in → show login CTA in letter area
    if (!token) {
        letterOutput.innerHTML = `
            <div class="no-credits-banner">
                <h3>Connectez-vous pour générer votre lettre</h3>
                <p>Votre CV est prêt ! Pour générer une lettre de motivation personnalisée par IA, créez un compte gratuit (1 lettre offerte).</p>
                <button class="btn btn-primary" onclick="showAuthModal()" style="margin-top:0.5rem;">Se connecter / Créer un compte</button>
            </div>
        `;
        return;
    }

    // Check and consume a credit
    const creditResult = await useCredit();

    if (creditResult === 'needs_upgrade') {
        letterOutput.innerHTML = `
            <div class="no-credits-banner">
                <h3>Plus de crédits disponibles</h3>
                <p>Votre CV est prêt ! Pour générer une lettre de motivation par IA, ajoutez des crédits.</p>
                <a href="pricing.html"><button class="btn btn-primary">Voir les offres</button></a>
                <p style="margin-top:0.75rem;font-size:0.8rem;color:#78350f;">Pack 10 lettres à seulement 2€ — ou abonnement dès 6€/mois</p>
            </div>
        `;
        return;
    }

    if (creditResult === false) {
        letterOutput.innerHTML = `
            <div class="no-credits-banner">
                <h3>Erreur de connexion</h3>
                <p>Impossible de vérifier vos crédits. Veuillez vous reconnecter.</p>
                <button class="btn btn-primary" onclick="logout();showAuthModal();" style="margin-top:0.5rem;">Se reconnecter</button>
            </div>
        `;
        return;
    }

    // Credit consumed — generate letter via AI
    let resolvedLanguage = data.letterLanguage;
    if (resolvedLanguage === 'auto') {
        resolvedLanguage = detectLanguage(data.jobOffer);
    }

    const langLabel = resolvedLanguage === 'en' ? 'English' : 'Français';
    letterOutput.innerHTML = `
        <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:200px;padding:40px;font-family:Calibri,Arial,sans-serif;">
            <div class="spinner"></div>
            <p style="margin-top:16px;font-size:12pt;color:#4a5568;">Génération de la lettre de motivation par IA en cours...</p>
            <p style="font-size:10pt;color:#718096;margin-top:6px;">Langue détectée : ${langLabel} — Analyse de l'offre et personnalisation (~15 secondes)</p>
        </div>
    `;

    const candidat = {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email,
        phone: data.phone,
        address: data.address,
        linkedin: data.linkedin,
        education: data.education,
        experience: data.experience,
        technicalSkills: data.technicalSkills,
        financeSkills: data.financeSkills,
        certifications: data.certifications,
        languages: data.languages,
        interests: data.interests
    };

    const offre = {
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        jobDuration: data.jobDuration,
        jobRef: data.jobRef,
        recipientName: data.recipientName,
        jobOffer: data.jobOffer,
        whyThisFirm: data.whyThisFirm,
        additionalNotes: data.additionalNotes
    };

    try {
        const response = await fetch('/api/generate-letter', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                candidat,
                offre,
                langue: resolvedLanguage
            })
        });

        if (!response.ok) {
            const err = await response.json().catch(() => ({}));
            throw new Error(err.error || `HTTP ${response.status}`);
        }

        const result = await response.json();
        letterOutput.innerHTML = result.letter;

    } catch (error) {
        console.error('Letter generation failed:', error);
        // Fallback to client-side template
        const fallbackHTML = resolvedLanguage === 'en'
            ? generateCoverLetterEN(data, keywords)
            : generateCoverLetterFR(data, keywords);
        letterOutput.innerHTML = fallbackHTML;

        const notice = document.createElement('div');
        notice.style.cssText = 'background:#fef3c7;border:1px solid #f59e0b;border-radius:6px;padding:8px 12px;margin-bottom:10px;font-size:9pt;color:#92400e;font-family:Calibri,Arial,sans-serif;';
        notice.textContent = 'La génération IA a échoué (' + error.message + '). Lettre générée en mode template. Vous pouvez la modifier directement.';
        letterOutput.insertBefore(notice, letterOutput.firstChild);
    }
}

// ===== ATS Keywords Analysis =====
function showATSAnalysis(data, keywords) {
    const container = document.getElementById('ats-keywords');

    const allUserContent = [
        data.technicalSkills, data.financeSkills, data.certifications,
        ...data.experience.map(e => e.description + ' ' + e.title),
        ...data.education.map(e => e.degree + ' ' + e.field + ' ' + e.details),
        data.interests
    ].join(' ').toLowerCase();

    let html = '<p style="margin-bottom:0.5rem;font-size:0.85rem;">Mots-clés détectés dans l\'offre et leur présence dans votre profil :</p>';

    if (keywords.length === 0) {
        html += '<p style="font-size:0.85rem;color:#718096;">Aucun mot-clé spécifique détecté. Assurez-vous de coller le texte complet de l\'offre.</p>';
    } else {
        keywords.forEach(kw => {
            const matched = allUserContent.includes(kw.toLowerCase());
            html += `<span class="keyword-tag ${matched ? 'matched' : 'missing'}">${esc(kw)} ${matched ? '&#10003;' : '&#10007;'}</span>`;
        });
        html += '<p style="margin-top:0.75rem;font-size:0.8rem;color:#4a5568;"><strong>Vert</strong> = présent dans votre profil | <strong>Rouge</strong> = absent - pensez à l\'ajouter si pertinent</p>';
    }

    container.innerHTML = html;
}

// ===== Tab Switching =====
function switchTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
    if (tab === 'cv') {
        document.getElementById('cv-preview-container').classList.remove('hidden');
        document.getElementById('letter-preview-container').classList.add('hidden');
        document.querySelector('.tab-btn:first-child').classList.add('active');
    } else {
        document.getElementById('cv-preview-container').classList.add('hidden');
        document.getElementById('letter-preview-container').classList.remove('hidden');
        document.querySelector('.tab-btn:last-child').classList.add('active');
    }
}

// ===== PDF Export — fixed margins =====
function exportPDF(type) {
    const element = type === 'cv'
        ? document.getElementById('cv-output')
        : document.getElementById('letter-output');

    const data = collectData();

    // Clean company name for filename
    const cleanCompany = data.companyName.replace(/[^a-zA-Z0-9]/g, '_').replace(/_+/g, '_');

    const filename = type === 'cv'
        ? `CV_${data.firstName}_${data.lastName}.pdf`
        : `Lettre_Motivation_${data.firstName}_${data.lastName}_${cleanCompany}.pdf`;

    // Temporarily remove contenteditable outline
    element.blur();

    // Clone element for PDF to avoid capturing editability styles
    const clone = element.cloneNode(true);
    clone.removeAttribute('contenteditable');
    clone.style.width = '210mm';
    clone.style.minHeight = '297mm';
    clone.style.maxHeight = '297mm';
    clone.style.overflow = 'hidden';
    clone.style.boxShadow = 'none';
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    document.body.appendChild(clone);

    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true,
            width: clone.scrollWidth,
            height: Math.min(clone.scrollHeight, 1122), // A4 height in px at 96dpi
            windowWidth: clone.scrollWidth
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all'] }
    };

    html2pdf().set(opt).from(clone).save().then(() => {
        document.body.removeChild(clone);
    }).catch(() => {
        document.body.removeChild(clone);
    });
}

// ===== Utilities =====
function esc(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

// ===== Local Storage: Save & Restore =====
function saveToLocalStorage() {
    const data = collectData();
    localStorage.setItem('financeCV_data', JSON.stringify(data));
}

function restoreFromLocalStorage() {
    const saved = localStorage.getItem('financeCV_data');
    if (!saved) return;

    try {
        const data = JSON.parse(saved);

        const fields = ['firstName', 'lastName', 'email', 'phone', 'address', 'linkedin',
            'nationality', 'birthDate', 'drivingLicense', 'technicalSkills', 'certifications',
            'financeSkills', 'interests', 'jobTitle', 'companyName', 'jobDuration', 'jobRef',
            'letterLanguage', 'recipientName', 'jobOffer', 'whyThisFirm', 'additionalNotes'];

        fields.forEach(id => {
            const el = document.getElementById(id);
            if (el && data[id]) el.value = data[id];
        });
    } catch (e) {
        // Silently fail
    }
}

// Auto-save on input changes
document.addEventListener('input', (e) => {
    // Don't save when editing the contenteditable preview
    if (e.target.closest('.a4-page')) return;
    clearTimeout(window._saveTimeout);
    window._saveTimeout = setTimeout(saveToLocalStorage, 1000);
});

// Restore on page load + init auth
document.addEventListener('DOMContentLoaded', () => {
    restoreFromLocalStorage();
    updateAuthUI();
});
