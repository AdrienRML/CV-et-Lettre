import Stripe from 'stripe';
import { getUserFromToken, setCors } from './lib/supabase.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const PLANS = {
    monthly: {
        name: 'Abonnement Mensuel',
        price: 600, // 6.00 EUR in cents
        mode: 'subscription',
        interval: 'month'
    },
    annual: {
        name: 'Abonnement Annuel',
        price: 4000, // 40.00 EUR in cents
        mode: 'subscription',
        interval: 'year'
    },
    pack10: {
        name: 'Pack 10 Lettres',
        price: 200, // 2.00 EUR in cents
        mode: 'payment'
    }
};

export default async function handler(req, res) {
    setCors(res);
    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const user = await getUserFromToken(req);
    if (!user) {
        return res.status(401).json({ error: 'Non authentifie' });
    }

    const { planId } = req.body;
    const plan = PLANS[planId];

    if (!plan) {
        return res.status(400).json({ error: 'Plan invalide' });
    }

    try {
        const baseUrl = `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

        let sessionConfig = {
            payment_method_types: ['card'],
            customer_email: user.email,
            metadata: {
                userId: user.id,
                planId: planId
            },
            success_url: `${baseUrl}/pricing.html?success=true`,
            cancel_url: `${baseUrl}/pricing.html?canceled=true`
        };

        if (plan.mode === 'subscription') {
            sessionConfig.mode = 'subscription';
            sessionConfig.line_items = [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: plan.name },
                    unit_amount: plan.price,
                    recurring: { interval: plan.interval }
                },
                quantity: 1
            }];
        } else {
            sessionConfig.mode = 'payment';
            sessionConfig.line_items = [{
                price_data: {
                    currency: 'eur',
                    product_data: { name: plan.name },
                    unit_amount: plan.price
                },
                quantity: 1
            }];
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

        return res.status(200).json({ url: session.url });
    } catch (error) {
        console.error('Checkout error:', error);
        return res.status(500).json({ error: 'Erreur lors de la creation du paiement' });
    }
}
