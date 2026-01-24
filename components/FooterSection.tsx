'use client';

import Link from 'next/link';

const Footer = () => {
    return (
        <footer className="w-full border-t border-white/10 mt-32">
            <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-white/60">
                {/* Left */}
                <p>© {new Date().getFullYear()} Pixelforge AI. All rights reserved.</p>

                {/* Right */}
                <p className="flex gap-1">
                    Made with ❤️ by
                    <Link className="underline italic" href={'https://www.github.com/KrishhR'}>
                        Krishnam!
                    </Link>
                </p>
            </div>
        </footer>
    );
};

export default Footer;
