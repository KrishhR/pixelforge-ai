'use client';

import PricingCard from './PricingCard';

export type PlansType = {
    id: string;
    plan: string;
    price: number;
    features: string[];
    buttonText: string;
    featured?: boolean | undefined;
    planId?: string | undefined;
};

const CUSTOM_PLAN_ID_FROM_CLERK = 'cplan_36Ogb3Etsoy6oZsi699asYksINc';

const Pricing = () => {
    const plans: PlansType[] = [
        {
            id: 'free_user',
            plan: 'Free',
            price: 0,
            features: [
                '3 projects maximum',
                '20 exports per month',
                'Basic crop & resize',
                'Color adjustments',
                'Text Tool',
            ],
            buttonText: 'Get Started Free',
        },
        {
            id: 'pro_user',
            plan: 'Pro',
            price: 11.99,
            features: [
                'Unlimited projects',
                'Unlimited exports',
                'All Editing Tools',
                'AI Background Remover',
                'AI Image Extender',
                'AI Retouch, Upscaler and more',
            ],
            featured: true,
            planId: CUSTOM_PLAN_ID_FROM_CLERK,
            buttonText: 'Upgrade to Pro',
        },
    ];

    return (
        <section id="pricing" className="py-20">
            {/* Enable the <PricingTable /> componant, if you want default pricing cards provided by Clerk */}
            {/* <PricingTable /> */}

            <div className="max-w-4xl mx-auto px-6">
                <div className="text-center mb-16">
                    <h2 className="text-5xl font-bold mb-6">
                        Simple{' '}
                        <span className="bg-linear-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent ">
                            Pricing
                        </span>
                    </h2>

                    <p className="text-xl text-gray-300">
                        Start free and upgrade when you need more power. No hidden fees, cancel
                        anytime.
                    </p>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 max-w-4xl mx-auto">
                {plans.map((plan, idx) => (
                    <PricingCard key={idx} {...plan} />
                ))}
            </div>
        </section>
    );
};

export default Pricing;
