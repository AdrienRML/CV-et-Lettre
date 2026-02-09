import { supabase, getUserFromToken, setCors } from './lib/supabase.js';

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();

    const user = await getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ error: 'Non authentifie' });
    }

    if (req.method === 'GET') {
        // Check plan expiration
        let plan = user.plan;
        let credits = user.credits;

        if (user.plan_expires && new Date(user.plan_expires) < new Date()) {
            plan = 'free';
            await supabase.from('users').update({ plan: 'free' }).eq('id', user.id);
        }

        // For subscription plans, calculate remaining letters
        let planLettersRemaining = 0;
        if (plan === 'monthly') {
            planLettersRemaining = Math.max(0, 100 - (user.monthly_letters || 0));
        } else if (plan === 'annual') {
            planLettersRemaining = Math.max(0, 1000 - (user.annual_letters || 0));
        }

        return res.status(200).json({
            credits: credits,
            plan: plan,
            planExpires: user.plan_expires,
            planLettersRemaining: planLettersRemaining,
            totalAvailable: credits + planLettersRemaining,
            referralCode: user.referral_code,
            lettersGenerated: user.letters_generated
        });
    }

    if (req.method === 'POST') {
        const { action } = req.body;

        if (action === 'use') {
            // Try to use a credit: first from plan, then from credits
            let plan = user.plan;

            if (user.plan_expires && new Date(user.plan_expires) < new Date()) {
                plan = 'free';
                await supabase.from('users').update({ plan: 'free' }).eq('id', user.id);
            }

            // Check plan quota first
            if (plan === 'monthly' && (user.monthly_letters || 0) < 100) {
                await supabase
                    .from('users')
                    .update({
                        monthly_letters: (user.monthly_letters || 0) + 1,
                        letters_generated: (user.letters_generated || 0) + 1
                    })
                    .eq('id', user.id);

                return res.status(200).json({ success: true, source: 'plan_monthly' });
            }

            if (plan === 'annual' && (user.annual_letters || 0) < 1000) {
                await supabase
                    .from('users')
                    .update({
                        annual_letters: (user.annual_letters || 0) + 1,
                        letters_generated: (user.letters_generated || 0) + 1
                    })
                    .eq('id', user.id);

                return res.status(200).json({ success: true, source: 'plan_annual' });
            }

            // Use bonus credits
            if (user.credits > 0) {
                await supabase
                    .from('users')
                    .update({
                        credits: user.credits - 1,
                        letters_generated: (user.letters_generated || 0) + 1
                    })
                    .eq('id', user.id);

                return res.status(200).json({ success: true, source: 'credits' });
            }

            return res.status(403).json({
                error: 'Plus de credits disponibles',
                needsUpgrade: true
            });
        }

        return res.status(400).json({ error: 'Invalid action' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
