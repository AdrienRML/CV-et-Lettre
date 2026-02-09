import Anthropic from '@anthropic-ai/sdk';
import { getUserFromToken, setCors } from './lib/supabase.js';

const client = new Anthropic();

export default async function handler(req, res) {
    setCors(res);

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    // Verify auth
    const user = await getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ error: 'Non authentifie' });
    }

    try {
        const { candidat, offre, langue } = req.body;

        if (!candidat || !offre) {
            return res.status(400).json({ error: 'Missing candidat or offre data' });
        }

        const isEnglish = langue === 'en';

        // Build the candidate profile summary
        const educationSummary = (candidat.education || []).map(e =>
            `- ${e.degree}${e.field ? ' en ' + e.field : ''} a ${e.school} (${e.start || ''} - ${e.end || ''})${e.gpa ? ', ' + e.gpa : ''}${e.details ? '. Cours: ' + e.details : ''}`
        ).join('\n');

        const experienceSummary = (candidat.experience || []).map(e =>
            `- ${e.title} (${e.type}) chez ${e.company}${e.location ? ', ' + e.location : ''} (${e.start || ''} - ${e.end || ''})\n  ${e.description || ''}`
        ).join('\n');

        const languagesSummary = (candidat.languages || []).map(l =>
            `${l.name} (${l.level})`
        ).join(', ');

        const prompt = isEnglish
            ? buildEnglishPrompt(candidat, offre, educationSummary, experienceSummary, languagesSummary)
            : buildFrenchPrompt(candidat, offre, educationSummary, experienceSummary, languagesSummary);

        const message = await client.messages.create({
            model: 'claude-sonnet-4-5-20250929',
            max_tokens: 1500,
            messages: [
                {
                    role: 'user',
                    content: prompt
                }
            ]
        });

        const letterText = message.content[0].text;

        return res.status(200).json({ letter: letterText });
    } catch (error) {
        console.error('API Error:', error);
        return res.status(500).json({ error: 'Failed to generate letter. ' + (error.message || '') });
    }
}

function buildFrenchPrompt(candidat, offre, educationSummary, experienceSummary, languagesSummary) {
    return `Tu es un expert en recrutement finance et conseil en strategie. Tu rediges des lettres de motivation selon les standards AlumnEye / PrepFinance qui permettent de decrocher des offres chez Goldman Sachs, Rothschild, Lazard, McKinsey, BCG, etc.

REGLES DE FORMAT STRICTES :
- La lettre fait entre 12 et 15 lignes de corps de texte (hors en-tete)
- Police standard (Arial/Calibri), pas d'italique, pas de gras dans le corps
- PAS d'indentation en debut de paragraphe
- Un saut de ligne entre chaque paragraphe
- Structure en 4 paragraphes maximum
- Ton professionnel, sobre, precis. Pas de phrases creuses ou generiques
- Pas de "je suis motive" ou "votre entreprise est leader" sans argument concret

STRUCTURE ALUMNEYE :
1. INTRO (2-3 lignes) : Situation actuelle du candidat + interet pour le poste precis. Direct, pas de flatterie.
2. POURQUOI CETTE ENTREPRISE (3-4 lignes) : Arguments SPECIFIQUES a cette entreprise. Mentionner des elements concrets : deals recents, positionnement, equipe, rencontres networking. Si le candidat a fourni des raisons, les utiliser. Sinon, deduire du texte de l'offre.
3. POURQUOI MOI (4-5 lignes) : Experiences et competences du candidat mises en relation DIRECTE avec les missions de l'offre. Exemples concrets et quantifies. Montrer l'adequation profil/poste, pas juste lister le CV.
4. CONCLUSION (2-3 lignes) : Adequation mutuelle + disponibilite pour entretien + formule de politesse integree.

PROFIL DU CANDIDAT :
Nom : ${candidat.firstName} ${candidat.lastName}
Email : ${candidat.email || 'N/A'}
Telephone : ${candidat.phone || 'N/A'}
Adresse : ${candidat.address || 'N/A'}

Formation :
${educationSummary || 'Non renseignee'}

Experiences :
${experienceSummary || 'Non renseignees'}

Competences techniques : ${candidat.technicalSkills || 'N/A'}
Competences finance : ${candidat.financeSkills || 'N/A'}
Certifications : ${candidat.certifications || 'N/A'}
Langues : ${languagesSummary || 'N/A'}
Centres d'interet : ${candidat.interests || 'N/A'}

OFFRE D'EMPLOI :
Poste : ${offre.jobTitle}
Entreprise : ${offre.companyName}
Duree/Periode : ${offre.jobDuration || 'Non precisee'}
Reference : ${offre.jobRef || 'N/A'}
Destinataire : ${offre.recipientName || 'N/A'}

Texte de l'offre :
${offre.jobOffer}

Pourquoi cette entreprise (donne par le candidat) :
${offre.whyThisFirm || 'Non precise - deduis des elements pertinents du texte de l\'offre'}

INFORMATIONS PERSONNELLES DU CANDIDAT (a utiliser pour personnaliser la lettre, montrer sa singularite, ses motivations profondes, ses qualites humaines) :
${offre.additionalNotes || 'Non fournies'}

IMPORTANT : Si le candidat a fourni des informations personnelles ci-dessus (projet pro, qualites, anecdotes, rencontres, disponibilites, motivations...), tu DOIS les integrer naturellement dans la lettre. Ce sont ces details qui rendent la lettre unique et non-transposable a un autre candidat. Utilise-les dans le paragraphe "pourquoi moi" et/ou "pourquoi cette entreprise" selon leur nature.

RENVOIE UNIQUEMENT LE HTML de la lettre en utilisant exactement cette structure (pas de \`\`\`html, pas d'explication, juste le HTML brut) :

<div class="letter-header-fr">
    <div class="letter-sender-fr">
        [Prenom Nom]<br>[Telephone]<br>[Email]
    </div>
    <div class="letter-recipient-fr">
        [Nom entreprise]<br>[Destinataire si fourni]<br>Service Recrutement
    </div>
</div>
<div class="letter-date-fr">
    [Ville], le [date du jour en francais]
</div>
<div class="letter-object">
    Objet : [Candidature / Reponse a l'offre avec ref si fournie, poste, duree si fournie]
</div>
<div class="letter-salutation">
    [Madame, Monsieur, OU nom du destinataire si fourni],
</div>
<div class="letter-body">
    <p>[Paragraphe 1 : intro]</p>
    <p>[Paragraphe 2 : pourquoi cette entreprise]</p>
    <p>[Paragraphe 3 : pourquoi moi]</p>
    <p>[Paragraphe 4 : conclusion avec formule de politesse]</p>
</div>
<div class="letter-signature">
    ${candidat.firstName} ${candidat.lastName}
</div>`;
}

function buildEnglishPrompt(candidat, offre, educationSummary, experienceSummary, languagesSummary) {
    return `You are an expert in finance and strategy consulting recruitment. You write cover letters following the highest standards used to secure offers at Goldman Sachs, J.P. Morgan, Lazard, McKinsey, BCG, etc.

STRICT FORMAT RULES:
- The letter body is 12 to 15 lines (excluding header)
- Standard font (Arial/Calibri), no italic, no bold in the body
- NO indentation at the beginning of paragraphs
- One blank line between paragraphs
- Maximum 4 paragraphs
- Professional, concise, precise tone. No empty phrases or generic statements
- No "I am highly motivated" or "your company is a leader" without concrete arguments

STRUCTURE:
1. INTRO (2-3 lines): Candidate's current situation + specific interest in this role. Direct, no flattery.
2. WHY THIS FIRM (3-4 lines): SPECIFIC arguments about this company. Mention concrete elements: recent deals, positioning, team, networking contacts. If the candidate provided reasons, use them. Otherwise, deduce from the job description.
3. WHY ME (4-5 lines): Candidate's experiences and skills mapped DIRECTLY to the job requirements. Concrete, quantified examples. Show profile/role fit, don't just list the CV.
4. CONCLUSION (2-3 lines): Mutual fit + availability for interview + closing formula.

CANDIDATE PROFILE:
Name: ${candidat.firstName} ${candidat.lastName}
Email: ${candidat.email || 'N/A'}
Phone: ${candidat.phone || 'N/A'}
Address: ${candidat.address || 'N/A'}

Education:
${educationSummary || 'Not provided'}

Experience:
${experienceSummary || 'Not provided'}

Technical skills: ${candidat.technicalSkills || 'N/A'}
Finance skills: ${candidat.financeSkills || 'N/A'}
Certifications: ${candidat.certifications || 'N/A'}
Languages: ${languagesSummary || 'N/A'}
Interests: ${candidat.interests || 'N/A'}

JOB OFFER:
Position: ${offre.jobTitle}
Company: ${offre.companyName}
Duration/Period: ${offre.jobDuration || 'Not specified'}
Reference: ${offre.jobRef || 'N/A'}
Recipient: ${offre.recipientName || 'N/A'}

Job description:
${offre.jobOffer}

Why this firm (provided by candidate):
${offre.whyThisFirm || 'Not specified - deduce relevant elements from the job description'}

CANDIDATE'S PERSONAL INFORMATION (use to personalize the letter, show their uniqueness, deep motivations, human qualities):
${offre.additionalNotes || 'Not provided'}

IMPORTANT: If the candidate provided personal information above (career goals, qualities, anecdotes, networking contacts, availability, motivations...), you MUST integrate them naturally into the letter. These details are what make the letter unique and non-transferable to another candidate. Use them in the "why me" and/or "why this firm" paragraphs depending on their nature.

RETURN ONLY THE HTML of the letter using exactly this structure (no \`\`\`html, no explanation, just raw HTML):

<div class="letter-sender-en">
    [Full Name]<br>[Email]<br>[Phone]
</div>
<div class="letter-recipient-en">
    [Company name]<br>[Recipient if provided]<br>[Address if available]
</div>
<div class="letter-date-en">
    [Today's date in English format]
</div>
<div class="letter-object">
    Subject: [Application for / Response to offer with ref if provided, position, duration if provided]
</div>
<div class="letter-salutation">
    [Dear Hiring Manager, OR Dear [Recipient name] if provided],
</div>
<div class="letter-body">
    <p>[Paragraph 1: intro]</p>
    <p>[Paragraph 2: why this firm]</p>
    <p>[Paragraph 3: why me]</p>
    <p>[Paragraph 4: conclusion]</p>
</div>
<div class="letter-closing">
    Yours sincerely,
</div>
<div class="letter-signature">
    ${candidat.firstName} ${candidat.lastName}
</div>`;
}
