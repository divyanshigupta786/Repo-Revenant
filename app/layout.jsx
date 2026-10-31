import { Space_Grotesk, Inter, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import CommandPalette from '../components/CommandPalette';

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata = {
  title: 'RepoRevenant | The Open-Source AI Agent That Resurrects Abandoned Software',
  description: 'Investigate abandoned repositories, uncover broken dependencies, propose targeted repairs, and verify the results with an evidence-backed open-weight AI agent.',
  keywords: ['open-source', 'AI agent', 'repository repair', 'software resurrection', 'code forensics', 'AST analysis', 'PEP 594'],
  icons: {
    icon: '/favicon.svg',
  },
  openGraph: {
    title: 'RepoRevenant - Forgotten Code. A Second Life.',
    description: 'The evidence-backed open-source AI agent that investigates and restores abandoned software projects.',
    type: 'website',
  },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: 'RepoRevenant',
  operatingSystem: 'Cross-platform',
  applicationCategory: 'DeveloperApplication',
  description: 'An open-source, evidence-backed AI agent that investigates and restores abandoned software repositories through deterministic AST forensics and verifiable sandboxed test execution.',
  offers: {
    '@type': 'Offer',
    price: '0',
    priceCurrency: 'USD',
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${inter.variable} ${jetbrainsMono.variable}`}>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="bg-[#080A0F] text-[#F0F2F5] selection:bg-[#68F0D0] selection:text-[#080A0F]">
        <CommandPalette />
        {children}
      </body>
    </html>
  );
}
