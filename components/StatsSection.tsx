'use client';

import useIntersectionObserver from '@/hooks/useIntersectionObserver';
import { useEffect, useState } from 'react';

const StatsSection = () => {
    const statistics: {
        label: string;
        value: number;
        suffix: string;
    }[] = [
        { label: 'Active Users', value: 250, suffix: '+' },
        { label: 'Images Processed', value: 9500, suffix: '+' },
        { label: 'AI Transformations', value: 45000, suffix: '+' },
        { label: 'User Satisfaction', value: 98, suffix: '%' },
    ];
    const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>(0.25);
    const [count, setCount] = useState(statistics.map(() => 100));

    useEffect(() => {
        if (!isVisible) return;

        const duration = 700;
        const start = performance.now();

        const animate = (time: number) => {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);

            setCount(statistics.map((stat) => Math.floor(stat.value * progress)));

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                setCount(statistics.map((stat) => stat.value));
            }
        };
        requestAnimationFrame(animate);
    }, [isVisible, statistics]);

    return (
        <section ref={ref} className="py-20">
            <div className="max-w-6xl mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                    {statistics.map((stat, idx) => (
                        <div key={idx} className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold mb-2 bg-linear-to-r from-cyan-300 to-blue-600 bg-clip-text text-transparent">
                                {count[idx].toLocaleString()}
                                {stat.suffix}
                            </div>
                            <div className="text-gray-400 uppercase text-sm tracking-wider">
                                {stat.label}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default StatsSection;
