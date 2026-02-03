import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { SignedIn, SignedOut, useAuth, useClerk } from '@clerk/nextjs';
import { useState } from 'react';
import { Button } from './ui/button';
import { CheckoutButton } from '@clerk/nextjs/experimental';
import { toast } from 'sonner';
import { PlansType } from './PricingSection';
import { shadcn } from '@clerk/themes';

const PricingCard = ({
    id,
    plan,
    price,
    features,
    featured = false,
    buttonText,
    planId,
}: PlansType) => {
    const [ref, isVisible] = useIntersectionObserver();
    const [isHovered, setIsHovered] = useState(false);

    const { has } = useAuth();

    const isCurrentPlan = id ? has?.({ plan: id }) : false;
    const clerk = useClerk();

    const handlePopup = () => {
        if (isCurrentPlan) return;
        try {
            clerk.openSignIn({
                fallbackRedirectUrl: window.location.href,
            });
        } catch (error) {
            console.error('Checkout Error', error);
            toast.error('Something went wrong' + error);
        }
    };

    return (
        <div
            ref={ref}
            className={`relative backdrop-blur-lg  border  rounded-3xl p-8 transition-all duration-700 cursor-pointer 
                flex flex-col h-full
                ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}
                ${isHovered ? 'transform scale-105 rotate-1 z-10' : ''}
                ${
                    featured
                        ? 'bg-linear-to-b from-blue-500/20 to-purple-600/20 border-blue-400/50 scale-105'
                        : 'bg-white/5 border-white/10'
                }
                `}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {featured && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <div className="bg-linear-to-r from-blue-500 to-purple-600 text-white px-6 py-2 rounded-full text-sm font-bold">
                        Most Popular
                    </div>
                </div>
            )}

            <div className="text-center flex flex-col flex-1">
                <h3 className="text-2xl font-bold text-white mb-2">{plan}</h3>
                <div className="text-4xl font-bold bg-linear-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent mb-6">
                    ${price} {price > 0 && <span className="text-lg text-gray-400">/month</span>}
                </div>

                <ul className="space-y-3 mb-8">
                    {features.map((feature, idx) => (
                        <li key={idx} className="flex items-center text-gray-300">
                            <span className="text-green-400 mr-3">✓</span>
                            {feature}
                        </li>
                    ))}
                </ul>

                <div className="mt-auto">
                    <SignedIn>
                        <CheckoutButton
                            planId={planId!}
                            planPeriod="month"
                            for="user"
                            checkoutProps={{
                                appearance: {
                                    elements: {
                                        drawerRoot: {
                                            zIndex: 20000,
                                        },
                                    },
                                    baseTheme: shadcn,
                                },
                            }}
                        >
                            <Button
                                variant={featured ? 'primary' : 'glass'}
                                size="xl"
                                className="w-full"
                                disabled={isCurrentPlan || !planId}
                            >
                                {isCurrentPlan ? 'Current Plan' : buttonText}
                            </Button>
                        </CheckoutButton>
                    </SignedIn>

                    <SignedOut>
                        <Button
                            onClick={handlePopup}
                            variant={featured ? 'primary' : 'glass'}
                            size="xl"
                            className="w-full"
                            disabled={isCurrentPlan || !planId}
                        >
                            {isCurrentPlan ? 'Current Plan' : buttonText}
                        </Button>
                    </SignedOut>
                </div>
            </div>
        </div>
    );
};

export default PricingCard;
