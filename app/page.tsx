import FeatureSection from '@/components/FeatureSection';
import HeroSection from '@/components/Hero';
import Pricing from '@/components/PricingSection';
import StatsSection from '@/components/StatsSection';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function Home() {
    return (
        <div className="pt-36">
            {/* hero */}
            <HeroSection />

            {/* stats */}
            <StatsSection />

            {/* features */}
            <FeatureSection />

            {/* pricing */}
            <Pricing />

            {/* cta */}
            <section className="text-center py-20">
                <div className="max-w-4xl mx-auto px-6">
                    <h2 className="text-5xl font-bold mb-6">
                        Ready To{' '}
                        <span className="bg-linear-to-r from-blue-400 via-purple-500 to-cyan-400 bg-clip-text text-transparent">
                            Create Something Amazing?
                        </span>
                    </h2>
                    <p className="text-xl text-gray-300 mb-8">
                        Join thousands of creaters who are already using AI to transform their
                        images and bring their vision to life.
                    </p>
                    <Link href="/dashboard">
                        <Button variant="primary" size="xl">
                            🌟 Start Creating Now
                        </Button>
                    </Link>
                </div>
            </section>

            {/* footer */}
        </div>
    );
}
