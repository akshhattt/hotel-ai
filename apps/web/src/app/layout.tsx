import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
    title: 'Hotel Capital AI — Investor Acquisition Platform',
    description: 'AI-driven investor acquisition and qualification infrastructure for hospitality private equity',
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
