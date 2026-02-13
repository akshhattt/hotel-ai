import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Peachtree Group — Capital AI Platform',
    description: 'AI-driven investor acquisition and capital raise automation for Peachtree Group',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="en" className="dark">
            <body>{children}</body>
        </html>
    );
}
