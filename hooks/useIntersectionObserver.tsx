'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * A small React hook that reports whether an element is visible in the
 * viewport using the browser's IntersectionObserver API.
 *
 * The hook is generic so you can specify the element type when calling it
 * (for example `useIntersectionObserver<HTMLDivElement>()`). It returns a
 * tuple with a `ref` suitable for attaching to a DOM element and a
 * boolean `isVisible` flag that updates as the element enters/exits the
 * viewport.
 *
 * @template T - Element type for the returned `ref` (defaults to HTMLDivElement)
 * @param {number} [threshold=0.1] - Intersection threshold.
 * @returns {[React.RefObject<T>, boolean]} A tuple containing the `ref` and
 * a boolean indicating visibility.
 *
 * @example
 * const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>(0.25);
 * return <div ref={ref}>{isVisible ? 'Shown' : 'Hidden'}</div>;
 */

const useIntersectionObserver = <T extends Element = HTMLDivElement>(
    threshold: number = 0.1
): [React.RefObject<T>, boolean] => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const observer = new IntersectionObserver(([entry]) => setIsVisible(entry.isIntersecting), {
            threshold,
        });

        if (ref.current) observer.observe(ref.current);

        return () => observer.disconnect();
    }, [threshold]);

    return [ref as React.RefObject<T>, isVisible];
};

export default useIntersectionObserver;
