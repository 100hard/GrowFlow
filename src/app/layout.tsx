import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'GrowthFlow | Off-Peak Campaign Preparation for Independent Cafés',
  description: 'Turn slow café hours into profitable, margin-safe promotional campaigns in 3 minutes.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        {children}
      </body>
    </html>
  );
}
