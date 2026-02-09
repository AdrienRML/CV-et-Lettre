import Stripe from 'stripe';
import { supabase } from './lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

export const config = {
    api: { bodyParser: false }
};

async function buffer(readable) {
    const chunks = [];
    for await (const chunk of readable) {
        chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    return Buffer.concat(chunks);
}

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).end();

    const buf = await buffer(req);
    const sig = req.headers['stripe-signature'];

    let event;
    try {
        event = stripe.webhooks.constructEvent(buf, sig, endpointSecret);
    } catch (err) {
        console.error('Webhook signature verification failed:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
        if (event.type === 'checkout.session.completed') {
            const session = event.data.object;
            const userId = session.metadata.userId;
            const planId = session.metadata.planId;

            if (!userId || !planId) {
                console.error('Missing metadata in session');
                return res.status(400).end();
            }

            if (planId === 'monthly') {
                const expires = new Date();
                expires.setMonth(expires.getMonth() + 1);

                await supabase
                    .from('users')
                    .update({
                        plan: 'monthly',
                        plan_expires: expires.toISOString(),
                        monthly_letters: 0
                    })
                    .eq('id', userId);

                // Check if this user was referred — reward the referrer
                await rewardReferrer(userId);

            } else if (planId === 'annual') {
                const expires = new Date();
                expires.setFullYear(expires.getFullYear() + 1);

                await supabase
                    .from('users')
                    .update({
                        plan: 'annual',
                        plan_expires: expires.toISOString(),
                        annual_letters: 0
                    })
                    .eq('id', userId);

                // Check if this user was referred — reward the referrer
                await rewardReferrer(userId);

            } else if (planId === 'pack10') {
                // Add 10 credits
                const { data: user } = await supabase
                    .from('users')
                    .select('credits')
                    .eq('id', userId)
                    .single();

                await supabase
                    .from('users')
                    .update({ credits: (user?.credits || 0) + 10 })
                    .eq('id', userId);
            }

            // Log transaction
            await supabase.from('transactions').insert({
                user_id: userId,
                type: planId,
                amount_cents: session.amount_total,
                stripe_session_id: session.id
            });
        }

        if (event.type === 'invoice.paid') {
            // Handle subscription renewal
            const invoice = event.data.object;
            const subscription = await stripe.subscriptions.retrieve(invoice.subscription);
            const session = await stripe.checkout.sessions.list({
                subscription: subscription.id,
                limit: 1
            });

            if (session.data.length > 0) {
                const userId = session.data[0].metadata.userId;
                const planId = session.data[0].metadata.planId;

                if (userId && planId === 'monthly') {
                    const expires = new Date();
                    expires.setMonth(expires.getMonth() + 1);
                    await supabase
                        .from('users')
                        .update({
                            plan_expires: expires.toISOString(),
                            monthly_letters: 0
                        })
                        .eq('id', userId);
                } else if (userId && planId === 'annual') {
                    const expires = new Date();
                    expires.setFullYear(expires.getFullYear() + 1);
                    await supabase
                        .from('users')
                        .update({
                            plan_expires: expires.toISOString(),
                            annual_letters: 0
                        })
                        .eq('id', userId);
                }
            }
        }
    } catch (err) {
        console.error('Webhook processing error:', err);
        return res.status(500).end();
    }

    res.status(200).json({ received: true });
}

// Reward referrer with 10 credits when their referred user subscribes
async function rewardReferrer(userId) {
    const { data: user } = await supabase
        .from('users')
        .select('referred_by, referral_rewarded')
        .eq('id', userId)
        .single();

    if (!user || !user.referred_by || user.referral_rewarded) return;

    // Get referrer and add 10 credits
    const { data: referrer } = await supabase
        .from('users')
        .select('credits')
        .eq('id', user.referred_by)
        .single();

    if (referrer) {
        await supabase
            .from('users')
            .update({ credits: (referrer.credits || 0) + 10 })
            .eq('id', user.referred_by);

        // Mark as rewarded so it only happens once
        await supabase
            .from('users')
            .update({ referral_rewarded: true })
            .eq('id', userId);

        // Log the referral reward
        await supabase.from('transactions').insert({
            user_id: user.referred_by,
            type: 'referral_reward',
            amount_cents: 0,
            credits_added: 10
        });
    }
}
