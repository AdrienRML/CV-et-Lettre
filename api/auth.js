import { supabase, setCors } from './lib/supabase.js';
import crypto from 'crypto';

function hashPassword(password, salt) {
    return crypto.pbkdf2Sync(password, salt, 10000, 64, 'sha512').toString('hex');
}

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function generateReferralCode() {
    return crypto.randomBytes(4).toString('hex').toUpperCase();
}

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const { action, email, password, referralCode } = req.body;

    if (!action || !email || !password) {
        return res.status(400).json({ error: 'Missing action, email or password' });
    }

    const emailLower = email.toLowerCase().trim();

    try {
        if (action === 'register') {
            // Check if user exists
            const { data: existing } = await supabase
                .from('users')
                .select('id')
                .eq('email', emailLower)
                .single();

            if (existing) {
                return res.status(400).json({ error: 'Un compte existe deja avec cet email' });
            }

            const salt = crypto.randomBytes(16).toString('hex');
            const passwordHash = hashPassword(password, salt);
            const sessionToken = generateToken();
            const myReferralCode = generateReferralCode();

            // Start with 1 free letter credit
            let initialCredits = 1;
            let referredBy = null;

            // Check referral code
            if (referralCode) {
                const { data: referrer } = await supabase
                    .from('users')
                    .select('id, referral_code')
                    .eq('referral_code', referralCode.toUpperCase())
                    .single();

                if (referrer) {
                    referredBy = referrer.id;
                }
            }

            const { data: newUser, error } = await supabase
                .from('users')
                .insert({
                    email: emailLower,
                    password_hash: passwordHash,
                    password_salt: salt,
                    session_token: sessionToken,
                    credits: initialCredits,
                    plan: 'free',
                    plan_expires: null,
                    referral_code: myReferralCode,
                    referred_by: referredBy,
                    letters_generated: 0
                })
                .select()
                .single();

            if (error) {
                console.error('Register error:', error);
                return res.status(500).json({ error: 'Erreur lors de la creation du compte' });
            }

            return res.status(200).json({
                token: sessionToken,
                user: {
                    email: newUser.email,
                    credits: newUser.credits,
                    plan: newUser.plan,
                    referralCode: newUser.referral_code
                }
            });

        } else if (action === 'login') {
            const { data: user, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', emailLower)
                .single();

            if (error || !user) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            const passwordHash = hashPassword(password, user.password_salt);
            if (passwordHash !== user.password_hash) {
                return res.status(401).json({ error: 'Email ou mot de passe incorrect' });
            }

            // Check if plan is expired
            let plan = user.plan;
            if (user.plan_expires && new Date(user.plan_expires) < new Date()) {
                plan = 'free';
                await supabase
                    .from('users')
                    .update({ plan: 'free', monthly_letters: 0 })
                    .eq('id', user.id);
            }

            // Refresh session token
            const sessionToken = generateToken();
            await supabase
                .from('users')
                .update({ session_token: sessionToken })
                .eq('id', user.id);

            return res.status(200).json({
                token: sessionToken,
                user: {
                    email: user.email,
                    credits: user.credits,
                    plan: plan,
                    planExpires: user.plan_expires,
                    referralCode: user.referral_code,
                    lettersGenerated: user.letters_generated
                }
            });

        } else {
            return res.status(400).json({ error: 'Invalid action' });
        }
    } catch (err) {
        console.error('Auth error:', err);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}
