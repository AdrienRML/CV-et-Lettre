// ===== State Management =====
let currentStep = 1;

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
                <label>Etablissement *</label>
                <input type="text" class="edu-school" placeholder="HEC Paris, ESSEC, Dauphine...">
            </div>
            <div class="form-group">
                <label>Diplome *</label>
                <input type="text" class="edu-degree" placeholder="Master en Finance">
            </div>
            <div class="form-group">
                <label>Specialite</label>
                <input type="text" class="edu-field" placeholder="Finance de marche">
            </div>
            <div class="form-group">
                <label>GPA / Mention</label>
                <input type="text" class="edu-gpa" placeholder="Mention Bien, 15.2/20">
            </div>
            <div class="form-group">
                <label>Date debut</label>
                <input type="text" class="edu-start" placeholder="Sept 2020">
            </div>
            <div class="form-group">
                <label>Date fin</label>
                <input type="text" class="edu-end" placeholder="Juin 2023">
            </div>
            <div class="form-group full-width">
                <label>Cours / details pertinents</label>
                <textarea class="edu-details" rows="2" placeholder="Cours : Valorisation, M&A, Modelisation financiere..."></textarea>
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
            <h3>Experience ${index + 1}</h3>
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
                <label>Date debut</label>
                <input type="text" class="exp-start" placeholder="Jan 2023">
            </div>
            <div class="form-group">
                <label>Date fin</label>
                <input type="text" class="exp-end" placeholder="Juin 2023 ou Present">
            </div>
            <div class="form-group full-width">
                <label>Description (une ligne par bullet point) *</label>
                <textarea class="exp-description" rows="4" placeholder="Realisation de modeles de valorisation DCF..."></textarea>
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
            <option value="Avance (B2)" selected>Avance (B2)</option>
            <option value="Intermediaire (B1)">Intermediaire (B1)</option>
            <option value="Debutant (A1/A2)">Debutant (A1/A2)</option>
        </select>
        <button class="btn-remove-inline" onclick="this.parentElement.remove()">&times;</button>
    `;
    list.appendChild(entry);
}

function removeEntry(type, index) {
    const list = document.getElementById(`${type}-list`);
    const cards = list.querySelectorAll('.entry-card');
    if (cards.length <= 1) return; // Keep at least one
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
    data.jobOffer = document.getElementById('jobOffer').value.trim();
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
    const notFound = [];

    financeKeywords.forEach(kw => {
        if (offerLower.includes(kw.toLowerCase())) {
            found.push(kw);
        }
    });

    // Deduplicate similar keywords
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
                    <span class="cv-entry-title">${escapeHTML(edu.school)}</span>
                    <span class="cv-entry-date">${escapeHTML(dateLine)}</span>
                </div>
                <div class="cv-entry-subtitle">
                    <span>${escapeHTML(edu.degree)}${edu.field ? ', ' + escapeHTML(edu.field) : ''}</span>
                    ${edu.gpa ? '<span>' + escapeHTML(edu.gpa) + '</span>' : ''}
                </div>
                ${edu.details ? '<div style="font-size:9.5pt;margin-top:1pt;">' + escapeHTML(edu.details) + '</div>' : ''}
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
                bullets.map(b => `<li>${escapeHTML(b.trim())}</li>`).join('') +
                '</ul>';
        }
        experienceHTML += `
            <div class="cv-entry">
                <div class="cv-entry-header">
                    <span class="cv-entry-title">${escapeHTML(exp.company)}${exp.location ? ', ' + escapeHTML(exp.location) : ''}</span>
                    <span class="cv-entry-date">${escapeHTML(dateLine)}</span>
                </div>
                <div class="cv-entry-subtitle">
                    <span>${escapeHTML(exp.title)} (${escapeHTML(exp.type)})</span>
                </div>
                ${bulletsHTML}
            </div>
        `;
    });

    // Skills section
    let skillsHTML = '<div class="cv-inline-list">';
    if (data.technicalSkills) {
        skillsHTML += `<div class="cv-inline-item"><span class="cv-inline-label">Logiciels & Outils : </span>${escapeHTML(data.technicalSkills)}</div>`;
    }
    if (data.financeSkills) {
        skillsHTML += `<div class="cv-inline-item"><span class="cv-inline-label">Competences Finance : </span>${escapeHTML(data.financeSkills)}</div>`;
    }
    if (data.certifications) {
        skillsHTML += `<div class="cv-inline-item"><span class="cv-inline-label">Certifications : </span>${escapeHTML(data.certifications)}</div>`;
    }
    skillsHTML += '</div>';

    // Languages section
    let languagesHTML = '<div class="cv-inline-list"><div class="cv-inline-item">';
    languagesHTML += data.languages.map(l => `${escapeHTML(l.name)} (${escapeHTML(l.level)})`).join(' <span class="sep">|</span> ');
    languagesHTML += '</div></div>';

    // Interests section
    let interestsHTML = '';
    if (data.interests) {
        const lines = data.interests.split('\n').filter(l => l.trim());
        interestsHTML = '<div class="cv-inline-list">' +
            lines.map(l => `<div class="cv-inline-item">${escapeHTML(l.trim())}</div>`).join('') +
            '</div>';
    }

    // Assemble CV
    const cv = `
        <div class="cv-header">
            <div class="cv-name">${escapeHTML(fullName)}</div>
            <div class="cv-contact">${contactLine}</div>
        </div>

        ${educationHTML ? `
        <div class="cv-section">
            <div class="cv-section-title">Formation</div>
            ${educationHTML}
        </div>` : ''}

        ${experienceHTML ? `
        <div class="cv-section">
            <div class="cv-section-title">Experiences professionnelles</div>
            ${experienceHTML}
        </div>` : ''}

        ${data.technicalSkills || data.financeSkills || data.certifications ? `
        <div class="cv-section">
            <div class="cv-section-title">Competences</div>
            ${skillsHTML}
        </div>` : ''}

        ${data.languages.length > 0 ? `
        <div class="cv-section">
            <div class="cv-section-title">Langues</div>
            ${languagesHTML}
        </div>` : ''}

        ${data.interests ? `
        <div class="cv-section">
            <div class="cv-section-title">Centres d'interet & activites</div>
            ${interestsHTML}
        </div>` : ''}
    `;

    return cv;
}

// ===== Cover Letter Generation =====
function generateCoverLetter(data, keywords) {
    const fullName = `${data.firstName} ${data.lastName}`;
    const today = new Date();
    const dateStr = today.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    // Determine the city from address
    const city = data.address ? data.address.split(',')[0].trim() : 'Paris';

    // Build sender block
    const senderLines = [fullName];
    if (data.address) senderLines.push(data.address);
    if (data.phone) senderLines.push(data.phone);
    if (data.email) senderLines.push(data.email);

    // Determine key elements for the letter
    const latestEdu = data.education.length > 0 ? data.education[0] : null;
    const latestExp = data.experience.length > 0 ? data.experience[0] : null;

    // Build education description
    let eduDesc = '';
    if (latestEdu) {
        eduDesc = `actuellement en ${latestEdu.degree}${latestEdu.field ? ' specialise(e) en ' + latestEdu.field : ''} a ${latestEdu.school}`;
    }

    // Build experience highlights
    let expHighlights = '';
    if (latestExp) {
        const bullets = latestExp.description.split('\n').filter(b => b.trim());
        const topBullets = bullets.slice(0, 2);
        if (topBullets.length > 0) {
            expHighlights = `Lors de mon experience chez ${latestExp.company} en tant que ${latestExp.title}, j'ai notamment ${topBullets[0].trim().toLowerCase()}`;
            if (topBullets[1]) {
                expHighlights += `, ainsi que ${topBullets[1].trim().toLowerCase()}`;
            }
            expHighlights += '.';
        }
    }

    // Build skills mention
    const skillsList = [];
    if (data.technicalSkills) skillsList.push(data.technicalSkills);
    if (data.financeSkills) skillsList.push(data.financeSkills);
    const skillsDesc = skillsList.length > 0 ?
        `Je maitrise ${skillsList.join(', ')}` : '';

    // Languages mention
    const langDesc = data.languages.length > 0 ?
        data.languages.map(l => `${l.name} (${l.level})`).join(' et ') : '';

    // Generate paragraphs
    const introParagraph = `${eduDesc ? 'Etudiant(e) ' + eduDesc + ', je' : 'Je'} me permets de vous adresser ma candidature pour le poste de ${data.jobTitle} au sein de ${data.companyName}. Votre entreprise represente pour moi une reference dans le secteur et cette opportunite correspond pleinement a mon projet professionnel.`;

    let motivationParagraph = `Mon parcours academique m'a permis de developper de solides competences en finance et en analyse.`;
    if (latestEdu && latestEdu.details) {
        motivationParagraph += ` Au cours de ma formation, j'ai suivi des enseignements en ${latestEdu.details.substring(0, 120).toLowerCase()}, ce qui m'a donne une base solide pour aborder les problematiques auxquelles votre equipe fait face.`;
    }

    let experienceParagraph = '';
    if (expHighlights) {
        experienceParagraph = `${expHighlights} Cette experience m'a permis de developper mon sens de la rigueur, ma capacite d'analyse et mon aptitude a travailler sous pression dans un environnement exigeant.`;
    }

    // Additional experiences
    if (data.experience.length > 1) {
        const otherExp = data.experience[1];
        experienceParagraph += ` J'ai egalement eu l'opportunite de travailler chez ${otherExp.company} en tant que ${otherExp.title}, ce qui a renforce ma polyvalence et ma comprehension du secteur financier.`;
    }

    let skillsParagraph = '';
    if (skillsDesc || langDesc) {
        skillsParagraph = `Sur le plan technique, ${skillsDesc ? skillsDesc.toLowerCase() + '.' : ''} ${langDesc ? 'Je parle ' + langDesc + ', ce qui me permet d\'evoluer dans un environnement international.' : ''}`;
    }

    const closingParagraph = `Convaincu(e) que mon profil correspond aux attentes de votre equipe, je serais ravi(e) de pouvoir echanger avec vous lors d'un entretien afin de vous presenter plus en detail ma motivation et mes competences. Je reste a votre entiere disposition pour toute information complementaire.`;

    const letter = `
        <div class="letter-sender">
            ${senderLines.map(l => escapeHTML(l)).join('<br>')}
        </div>

        <div class="letter-recipient">
            ${escapeHTML(data.companyName)}<br>
            Service Recrutement
        </div>

        <div class="letter-date">
            ${escapeHTML(city)}, le ${dateStr}
        </div>

        <div class="letter-object">
            Objet : Candidature au poste de ${escapeHTML(data.jobTitle)}
        </div>

        <div class="letter-salutation">
            Madame, Monsieur,
        </div>

        <div class="letter-body">
            <p>${introParagraph}</p>
            <p>${motivationParagraph}</p>
            ${experienceParagraph ? `<p>${experienceParagraph}</p>` : ''}
            ${skillsParagraph ? `<p>${skillsParagraph}</p>` : ''}
            <p>${closingParagraph}</p>
        </div>

        <div class="letter-closing">
            Je vous prie d'agreer, Madame, Monsieur, l'expression de mes salutations distinguees.
        </div>

        <div class="letter-signature">
            ${escapeHTML(fullName)}
        </div>
    `;

    return letter;
}

// ===== Main Generation =====
function generateDocuments() {
    const data = collectData();

    // Basic validation
    if (!data.firstName || !data.lastName) {
        alert('Veuillez renseigner votre prenom et nom.');
        return;
    }
    if (!data.jobTitle || !data.companyName) {
        alert('Veuillez renseigner le poste et l\'entreprise cible.');
        return;
    }

    // Extract keywords
    const keywords = extractKeywords(data.jobOffer);

    // Generate CV
    const cvHTML = generateCV(data, keywords);
    document.getElementById('cv-output').innerHTML = cvHTML;

    // Generate Cover Letter
    const letterHTML = generateCoverLetter(data, keywords);
    document.getElementById('letter-output').innerHTML = letterHTML;

    // Show ATS keywords analysis
    showATSAnalysis(data, keywords);

    // Navigate to results
    nextStep(6);
}

// ===== ATS Keywords Analysis =====
function showATSAnalysis(data, keywords) {
    const container = document.getElementById('ats-keywords');

    // Combine all user content
    const allUserContent = [
        data.technicalSkills, data.financeSkills, data.certifications,
        ...data.experience.map(e => e.description + ' ' + e.title),
        ...data.education.map(e => e.degree + ' ' + e.field + ' ' + e.details),
        data.interests
    ].join(' ').toLowerCase();

    let html = '<p style="margin-bottom:0.5rem;font-size:0.85rem;">Mots-cles detectes dans l\'offre et leur presence dans votre profil :</p>';

    if (keywords.length === 0) {
        html += '<p style="font-size:0.85rem;color:#718096;">Aucun mot-cle specifique detecte. Assurez-vous de coller le texte complet de l\'offre.</p>';
    } else {
        keywords.forEach(kw => {
            const matched = allUserContent.includes(kw.toLowerCase());
            html += `<span class="keyword-tag ${matched ? 'matched' : 'missing'}">${escapeHTML(kw)} ${matched ? '&#10003;' : '&#10007;'}</span>`;
        });
        html += '<p style="margin-top:0.75rem;font-size:0.8rem;color:#4a5568;"><strong>Vert</strong> = present dans votre profil | <strong>Rouge</strong> = absent - pensez a l\'ajouter si pertinent</p>';
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

// ===== PDF Export =====
function exportPDF(type) {
    const element = type === 'cv'
        ? document.getElementById('cv-output')
        : document.getElementById('letter-output');

    const data = collectData();
    const filename = type === 'cv'
        ? `CV_${data.firstName}_${data.lastName}.pdf`
        : `Lettre_${data.firstName}_${data.lastName}.pdf`;

    const opt = {
        margin: 0,
        filename: filename,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: {
            scale: 2,
            useCORS: true,
            letterRendering: true
        },
        jsPDF: {
            unit: 'mm',
            format: 'a4',
            orientation: 'portrait'
        },
        pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    html2pdf().set(opt).from(element).save();
}

// ===== Utilities =====
function escapeHTML(str) {
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

        // Personal info
        if (data.firstName) document.getElementById('firstName').value = data.firstName;
        if (data.lastName) document.getElementById('lastName').value = data.lastName;
        if (data.email) document.getElementById('email').value = data.email;
        if (data.phone) document.getElementById('phone').value = data.phone;
        if (data.address) document.getElementById('address').value = data.address;
        if (data.linkedin) document.getElementById('linkedin').value = data.linkedin;
        if (data.nationality) document.getElementById('nationality').value = data.nationality;
        if (data.birthDate) document.getElementById('birthDate').value = data.birthDate;
        if (data.drivingLicense) document.getElementById('drivingLicense').value = data.drivingLicense;

        // Skills
        if (data.technicalSkills) document.getElementById('technicalSkills').value = data.technicalSkills;
        if (data.certifications) document.getElementById('certifications').value = data.certifications;
        if (data.financeSkills) document.getElementById('financeSkills').value = data.financeSkills;
        if (data.interests) document.getElementById('interests').value = data.interests;

        // Job offer
        if (data.jobTitle) document.getElementById('jobTitle').value = data.jobTitle;
        if (data.companyName) document.getElementById('companyName').value = data.companyName;
        if (data.jobOffer) document.getElementById('jobOffer').value = data.jobOffer;
        if (data.additionalNotes) document.getElementById('additionalNotes').value = data.additionalNotes;
    } catch (e) {
        // Silently fail if data is corrupted
    }
}

// Auto-save on input changes
document.addEventListener('input', () => {
    clearTimeout(window._saveTimeout);
    window._saveTimeout = setTimeout(saveToLocalStorage, 1000);
});

// Restore on page load
document.addEventListener('DOMContentLoaded', restoreFromLocalStorage);
