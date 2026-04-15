import type { Metadata } from "next";
import { headers } from "next/headers";
import "./globals.css";
import { Syne, Space_Grotesk, JetBrains_Mono, Geist } from "next/font/google";
import AnalyticsProvider from "@/components/AnalyticsProvider";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const syne = Syne({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["400", "500", "600", "700", "800"],
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
  weight: ["400", "500", "600"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover' as const,
};

const META_TITLE = "AIR - AI Replacement Risk: Displacement, Creation, and Your Future";
const META_DESC = "Comprehensive data-driven insights on AI's impact on employment. Calculate your AI replacement risk, view job displacement data, industry analysis, and personalized action recommendations. Data from MIT, McKinsey, WEF, PwC.";

async function resolveMetadataBaseFromHeaders() {
  const h = await headers();
  const host = h.get('x-forwarded-host') ?? h.get('host');
  if (!host) {
    return process.env.NEXT_PUBLIC_BASE_URL || 'https://air.democra.ai';
  }
  const proto = h.get('x-forwarded-proto') ?? (host.includes('localhost') || host.startsWith('127.0.0.1') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export async function generateMetadata(): Promise<Metadata> {
  const metadataBase = new URL(await resolveMetadataBaseFromHeaders());

  return {
    metadataBase,
    title: META_TITLE,
    description: META_DESC,
    keywords: ["AI", "employment", "jobs", "automation", "replacement risk", "job creation", "data protection", "AI training data", "WEF", "PwC", "MIT", "McKinsey"],
    openGraph: {
      title: "AIR - How Fast Is AI Replacing Human Jobs?",
      description: "Calculate your AI replacement risk. MIT: 11.7% replaceable now. McKinsey: 57% technically possible. Your data is training AI to replace you.",
      siteName: "AIR",
      type: "website",
      url: metadataBase.toString(),
      locale: "en_US",
      images: [{ url: "/share-card.png", width: 1200, height: 630, alt: "AIR - AI Replacement Risk Platform" }],
    },
    twitter: {
      card: "summary_large_image",
      title: "AIR - How Fast Is AI Replacing Human Jobs?",
      description: "Calculate your AI replacement risk. MIT: 11.7% replaceable now. McKinsey: 57% technically possible.",
      images: ["/share-card.png"],
    },
    robots: { index: true, follow: true },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={cn(syne.variable, spaceGrotesk.variable, jetbrainsMono.variable, "font-sans", geist.variable, "dark")} suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=localStorage.getItem('air-style');if(s)document.documentElement.setAttribute('data-style',s);var t=localStorage.getItem('air-theme');document.documentElement.setAttribute('data-theme',t||'dark')}catch(e){}})()`,
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@graph': [
                {
                  '@type': 'Organization',
                  '@id': 'https://air.democra.ai/#organization',
                  name: 'Democra AI',
                  url: 'https://democra.ai',
                  logo: 'https://air.democra.ai/share-card.png',
                },
                {
                  '@type': 'WebSite',
                  '@id': 'https://air.democra.ai/#website',
                  url: 'https://air.democra.ai',
                  name: 'AIR — AI Replacement Risk Index',
                  description: 'A research-grade calculator measuring AI job replacement probability across 798 occupations, based on BLS OES, O*NET, and Anthropic Economic Index.',
                  publisher: { '@id': 'https://air.democra.ai/#organization' },
                  inLanguage: ['en', 'zh', 'ja', 'ko', 'de'],
                },
                {
                  '@type': 'Quiz',
                  '@id': 'https://air.democra.ai/#quiz',
                  name: 'AI Kill Threshold — AI Replacement Risk Test',
                  description: 'A 16-question quiz across 4 dimensions (Learnability, Evaluation Objectivity, Risk Tolerance, Human Presence) that maps your profession to one of 16 profile types with calibrated AI replacement probability.',
                  educationalLevel: 'professional',
                  typicalAgeRange: '18-',
                  numberOfQuestions: 16,
                  timeRequired: 'PT3M',
                  inLanguage: ['en', 'zh', 'ja', 'ko', 'de'],
                  about: {
                    '@type': 'Thing',
                    name: 'AI Replacement Risk',
                    description: 'The probability an occupation will be replaced by artificial intelligence',
                  },
                  isBasedOn: [
                    { '@type': 'Dataset', name: 'BLS Occupational Employment and Wage Statistics 2023', url: 'https://www.bls.gov/oes/' },
                    { '@type': 'Dataset', name: 'O*NET Occupational Information Network', url: 'https://www.onetonline.org/' },
                    { '@type': 'ScholarlyArticle', name: 'GPTs are GPTs: Labor Market Impact Potential of LLMs', url: 'https://arxiv.org/abs/2303.10130', author: 'Eloundou et al.' },
                    { '@type': 'Dataset', name: 'OpenAI GDPval Leaderboard', url: 'https://evals.openai.com/gdpval/leaderboard' },
                    { '@type': 'Report', name: 'Future of Jobs Report 2025', publisher: 'World Economic Forum', url: 'https://www.weforum.org/publications/the-future-of-jobs-report-2025/' },
                  ],
                },
                {
                  '@type': 'FAQPage',
                  '@id': 'https://air.democra.ai/#faq',
                  mainEntity: [
                    {
                      '@type': 'Question',
                      name: 'What is the AI Kill Threshold?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'The AI Kill Threshold is a probability (0-100%) indicating how likely your occupation will be replaced by AI. It is calculated using the Swiss Cheese Barrier Model across four independent dimensions: Learnability, Evaluation Objectivity, Risk Tolerance, and Human Presence.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How is the replacement probability calculated?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'Using a Weighted Power Mean with r=-2 across four dimensions. Learnability has weight 0.30, Evaluation Objectivity 0.25, Risk Tolerance 0.20, Human Presence 0.25. An additional E+O interaction bonus applies when both knowledge is explicit and evaluation is objective.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What data sources does AIR use?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'AIR aggregates from BLS OES 2023 (798 occupations employment data), O*NET (task structure labels), Eloundou et al. 2023 (LLM exposure measurement across 19,265 tasks), OpenAI GDPval (AI vs human expert blind evaluation), and the World Economic Forum Future of Jobs Report 2025.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'How does AIR differ from MBTI?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'MBTI measures personality. AIR measures occupational AI-replacement risk. Both use four binary dimensions producing a 4-letter code, but AIR\'s dimensions are grounded in automation economics literature and the output is backed by employment data from 798 real occupations.',
                      },
                    },
                    {
                      '@type': 'Question',
                      name: 'What is the current industry-wide AI replacement rate?',
                      acceptedAnswer: {
                        '@type': 'Answer',
                        text: 'As of 2026, the employment-weighted industry-wide AI replacement rate is 24.7%, calculated as Task Exposure (34.8%, Eloundou et al. 2023) times AI Win Rate vs human experts (71.3%, OpenAI GDPval).',
                      },
                    },
                  ],
                },
              ],
            }),
          }}
        />
      </head>
      <body className="antialiased font-body bg-background text-foreground transition-colors duration-300">
        <AnalyticsProvider />
        {children}
      </body>
    </html>
  );
}
