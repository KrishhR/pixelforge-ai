import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/theme-provider';
import { Toaster } from 'sonner';
import FloatingShapes from '@/components/floating-shapes';
import Header from '@/components/Header';
import { ConvexClientProvider } from './ConvexClientProvider';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
    title: 'PixelForge AI',
    description: 'A smart AI image editor for creating and customizing photos with ease.',
    icons: {
        icon: '/pixelforge-ai.ico',
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html lang="en" suppressHydrationWarning>
            <body className={`${inter.className}`}>
                <ThemeProvider
                    attribute="class"
                    defaultTheme="dark"
                    enableSystem
                    disableTransitionOnChange
                >
                    <ClerkProvider
                        appearance={{
                            baseTheme: dark,
                        }}
                    >
                        <ConvexClientProvider>
                            <Header />
                            <main className="bg-slate-900 min-h-screen text-white overflow-hidden">
                                <FloatingShapes />
                                <Toaster richColors />
                                {children}
                            </main>
                        </ConvexClientProvider>
                    </ClerkProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
