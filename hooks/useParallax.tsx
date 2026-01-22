import { useEffect, useState } from 'react';

/**
 * Custom hook to track the vertical scroll position of the window.
 *
 * Useful for implementing parallax effects, scroll-based animations,
 * or UI changes based on scroll position.
 *
 * @returns The current vertical scroll position (`window.scrollY`)
 */
const useParallax = () => {
    const [scrollY, setScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => setScrollY(window.scrollY); // Updates the scroll position state on window scroll.

        window.addEventListener('scroll', handleScroll);

        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    return scrollY;
};

export default useParallax;
