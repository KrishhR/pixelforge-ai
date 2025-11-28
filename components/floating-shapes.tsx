'use client';

import useParallax from '@/hooks/useParallax';

type shapeType = {
    id: number;
    size: string;
    position: string;
    gradient: string;
}[];

const FloatingShapes = () => {
    const scrollY = useParallax();

    const shapes: shapeType = [
        {
            id: 1,
            size: 'w-72 h-72',
            position: 'top-20 left-10',
            gradient: 'from-blue-500 to-purple-600',
        },
        {
            id: 2,
            size: 'w-96 h-96',
            position: 'top-1/3 right-10',
            gradient: 'from-cyan-400 to-blue-500',
        },
        {
            id: 3,
            size: 'w-64 h-64',
            position: 'bottom-20 left-1/4',
            gradient: 'from-lime-300 to-sky-400',
        },
        {
            id: 4,
            size: 'w-80 h-80',
            position: 'bottom-1/3 right-1/4',
            gradient: 'from-purple-500 to-pink-600',
        },
    ];
    return (
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
            {shapes.map((shape) => {
                return (
                    <div
                        key={shape.id}
                        className={`absolute ${shape.size} ${shape.position} bg-linear-to-r ${shape.gradient} 
                        rounded-full blur-3xl opacity-20 animate-pulse`}
                        style={{
                            transform: `translateY(${scrollY * 0.5}px) rotate(${scrollY * 0.1}deg)`,
                        }}
                    />
                );
            })}
        </div>
    );
};

export default FloatingShapes;
