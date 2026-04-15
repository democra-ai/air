import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PROFILE_TYPES, RISK_TIER_INFO, QUIZ_DIMENSIONS } from '@/lib/air_quiz_data';
import { getProfileCalibration } from '@/lib/air_quiz_calculator';
import { PROFILE_CAREERS } from '@/lib/air_career_data';

type Lang = 'en' | 'zh' | 'ja' | 'ko' | 'de';
const LANGS: Lang[] = ['en', 'zh', 'ja', 'ko', 'de'];
const BASE_URL = 'https://air.democra.ai';

type PageProps = {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ lang?: string }>;
};

function resolveLang(raw: string | undefined): Lang {
  if (raw && (LANGS as string[]).includes(raw)) return raw as Lang;
  return 'en';
}

function L<T extends Record<string, unknown>>(obj: T, lang: Lang): string {
  const v = (obj as Record<string, string | undefined>)[lang] ?? (obj as Record<string, string>)['en'];
  return v ?? '';
}

// ─── Static generation ──────────────────────────────────────────────────────

export async function generateStaticParams() {
  return Object.keys(PROFILE_TYPES).map((code) => ({ code }));
}

// ─── Metadata ───────────────────────────────────────────────────────────────

export async function generateMetadata({ params, searchParams }: PageProps): Promise<Metadata> {
  const { code } = await params;
  const { lang: rawLang } = await searchParams;
  const lang = resolveLang(rawLang);
  const profile = PROFILE_TYPES[code.toUpperCase()];
  if (!profile) return {};

  const archetype = L(profile.archetype, lang);
  const tagline = L(profile.tagline, lang);
  const riskLabel = L(RISK_TIER_INFO[profile.riskTier].label, lang);
  const calibration = getProfileCalibration(code.toUpperCase());
  const probRange = calibration ? `${calibration.prob[0]}-${calibration.prob[1]}%` : '';

  const titles: Record<Lang, string> = {
    en: `${archetype} (${profile.code}) — AI Replacement Risk: ${riskLabel} ${probRange} | AIR`,
    zh: `${archetype}（${profile.code}）— AI 替代风险：${riskLabel} ${probRange} | AIR 斩杀线`,
    ja: `${archetype}（${profile.code}）— AI代替リスク：${riskLabel} ${probRange} | AIR`,
    ko: `${archetype}(${profile.code}) — AI 대체 리스크: ${riskLabel} ${probRange} | AIR`,
    de: `${archetype} (${profile.code}) — KI-Ersetzungsrisiko: ${riskLabel} ${probRange} | AIR`,
  };

  const descriptions: Record<Lang, string> = {
    en: `${tagline} Profile type ${profile.code} analysis: AI replacement probability ${probRange}, barrier dimensions, typical occupations, and protection strategies. Based on BLS OES + O*NET + Anthropic Economic Index.`,
    zh: `${tagline}。画像 ${profile.code} 深度解读：AI 替代概率 ${probRange}、四维屏障分析、典型职业、护城河策略。基于 BLS OES + O*NET + Anthropic 经济指数。`,
    ja: `${tagline}。プロファイル ${profile.code}：AI代替確率 ${probRange}、バリア次元、典型的な職業、防御戦略。`,
    ko: `${tagline}. 프로파일 ${profile.code}: AI 대체 확률 ${probRange}, 장벽 차원, 대표 직업, 보호 전략.`,
    de: `${tagline}. Profil ${profile.code}: KI-Ersetzungswahrscheinlichkeit ${probRange}, Barriere-Dimensionen, typische Berufe, Schutzstrategien.`,
  };

  const languageAlternates = Object.fromEntries(
    LANGS.map((l) => [l, `${BASE_URL}/profile/${code.toUpperCase()}?lang=${l}`]),
  );

  return {
    title: titles[lang],
    description: descriptions[lang],
    alternates: {
      canonical: `${BASE_URL}/profile/${code.toUpperCase()}?lang=${lang}`,
      languages: languageAlternates,
    },
    openGraph: {
      title: titles[lang],
      description: descriptions[lang],
      url: `${BASE_URL}/profile/${code.toUpperCase()}?lang=${lang}`,
      siteName: 'AIR',
      type: 'article',
      locale: lang === 'zh' ? 'zh_CN' : lang === 'ja' ? 'ja_JP' : lang === 'ko' ? 'ko_KR' : lang === 'de' ? 'de_DE' : 'en_US',
      images: [{ url: `/characters/${profile.code}.webp`, width: 800, height: 800, alt: archetype }],
    },
    twitter: {
      card: 'summary_large_image',
      title: titles[lang],
      description: descriptions[lang],
      images: [`/characters/${profile.code}.webp`],
    },
    robots: { index: true, follow: true },
  };
}

// ─── i18n strings for page body ─────────────────────────────────────────────

const UI: Record<string, Record<Lang, string>> = {
  backToHome: { en: '← Take the AI Replacement Risk Test', zh: '← 测测你的 AI 替代风险', ja: '← AI代替リスクテストを受ける', ko: '← AI 대체 리스크 테스트 받기', de: '← KI-Ersetzungsrisiko-Test machen' },
  probability: { en: 'Replacement Probability', zh: '替代概率', ja: '代替確率', ko: '대체 확률', de: 'Ersetzungswahrscheinlichkeit' },
  predictedYear: { en: 'Predicted Year Range', zh: '预测年份区间', ja: '予測年範囲', ko: '예측 연도 범위', de: 'Prognostizierter Jahresbereich' },
  riskTier: { en: 'Risk Tier', zh: '风险等级', ja: 'リスク等級', ko: '리스크 등급', de: 'Risikostufe' },
  superpower: { en: 'Superpower', zh: '超能力', ja: '超能力', ko: '초능력', de: 'Superkraft' },
  kryptonite: { en: 'Kryptonite', zh: '弱点', ja: '弱点', ko: '약점', de: 'Schwäche' },
  fourDimensions: { en: 'Four Barrier Dimensions', zh: '四个屏障维度', ja: '4つのバリア次元', ko: '네 가지 장벽 차원', de: 'Vier Barriere-Dimensionen' },
  vulnerabilities: { en: 'Why This Profile Is Exposed', zh: '为何暴露于风险', ja: 'なぜ脆弱なのか', ko: '왜 노출되었는가', de: 'Warum exponiert' },
  strengths: { en: 'Natural Defenses', zh: '天然防御', ja: '自然な防御', ko: '자연 방어', de: 'Natürliche Verteidigung' },
  typicalJobs: { en: 'Typical Occupations', zh: '典型职业', ja: '典型的な職業', ko: '대표 직업', de: 'Typische Berufe' },
  careerRisks: { en: 'Sample Career Risk Scores', zh: '代表职业风险评分', ja: '代表的な職業リスク', ko: '대표 직업 리스크', de: 'Beispielberufe-Risiko' },
  cta: { en: 'Take the test to find your profile', zh: '做测试，找到你的画像', ja: 'テストを受けてプロファイルを知る', ko: '테스트로 프로파일 찾기', de: 'Test machen, Profil finden' },
};

function t(key: string, lang: Lang): string {
  return UI[key]?.[lang] ?? UI[key]?.en ?? key;
}

// ─── Page ───────────────────────────────────────────────────────────────────

export default async function ProfilePage({ params, searchParams }: PageProps) {
  const { code: rawCode } = await params;
  const { lang: rawLang } = await searchParams;
  const code = rawCode.toUpperCase();
  const lang = resolveLang(rawLang);
  const profile = PROFILE_TYPES[code];
  if (!profile) notFound();

  const calibration = getProfileCalibration(code);
  const careers = PROFILE_CAREERS[code] ?? [];
  const riskLabel = L(RISK_TIER_INFO[profile.riskTier].label, lang);
  const archetype = L(profile.archetype, lang);
  const tagline = L(profile.tagline, lang);
  const description = L(profile.description, lang);
  const superpower = L(profile.superpower, lang);
  const kryptonite = L(profile.kryptonite, lang);
  const typicalJobs = L(profile.typicalJobs, lang);

  const probRange = calibration ? `${calibration.prob[0]}%–${calibration.prob[1]}%` : '—';
  const yearRange = calibration?.year ? `${calibration.year[0]}–${calibration.year[1]}` : '∞';

  // JSON-LD structured data
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: `${archetype} (${code}) — ${tagline}`,
    description: description,
    author: { '@type': 'Organization', name: 'Democra AI', url: 'https://democra.ai' },
    publisher: { '@type': 'Organization', name: 'AIR', url: BASE_URL },
    inLanguage: lang,
    url: `${BASE_URL}/profile/${code}?lang=${lang}`,
    image: `${BASE_URL}/characters/${code}.webp`,
    about: {
      '@type': 'Thing',
      name: 'AI Replacement Risk',
      description: 'Probability that a given occupation profile will be replaced by AI',
    },
    mainEntity: {
      '@type': 'Rating',
      ratingValue: calibration ? (calibration.prob[0] + calibration.prob[1]) / 2 : 50,
      bestRating: 100,
      worstRating: 0,
      ratingExplanation: riskLabel,
    },
  };

  const dimensionDetails = QUIZ_DIMENSIONS.map((dim, i) => {
    const letter = code[i];
    const isFavorable = letter === dim.favorableLetter;
    const label = isFavorable ? L(dim.favorableLabel, lang) : L(dim.resistantLabel, lang);
    return {
      name: L(dim.name, lang),
      letter,
      isFavorable,
      label,
      description: L(dim.description, lang),
    };
  });

  return (
    <main style={{ background: '#0a0908', color: '#e5e5e5', minHeight: '100vh', padding: '40px 20px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div style={{ maxWidth: 880, margin: '0 auto' }}>
        <Link href={`/?lang=${lang}`} style={{ color: '#888', textDecoration: 'none', fontSize: 14 }}>
          {t('backToHome', lang)}
        </Link>

        <header style={{ marginTop: 32, marginBottom: 40, textAlign: 'center' }}>
          <div style={{ fontSize: 14, color: profile.color, letterSpacing: 2, marginBottom: 8 }}>
            {code}
          </div>
          <h1 style={{ fontSize: 48, fontWeight: 800, margin: '0 0 12px', color: profile.color }}>
            {archetype}
          </h1>
          <p style={{ fontSize: 18, fontStyle: 'italic', color: '#aaa', margin: '0 0 24px' }}>
            &ldquo;{tagline}&rdquo;
          </p>
          <div style={{ display: 'inline-block', padding: '6px 16px', borderRadius: 100, background: `${profile.color}20`, border: `1px solid ${profile.color}60`, color: profile.color, fontSize: 13, fontWeight: 600 }}>
            {riskLabel}
          </div>
        </header>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{t('probability', lang)}</div>
            <div style={{ fontSize: 32, fontWeight: 800, color: profile.color }}>{probRange}</div>
          </div>
          <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{t('predictedYear', lang)}</div>
            <div style={{ fontSize: 32, fontWeight: 800 }}>{yearRange}</div>
          </div>
          <div style={{ padding: 24, background: 'rgba(255,255,255,0.03)', borderRadius: 16, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 11, color: '#888', textTransform: 'uppercase', letterSpacing: 1.5, marginBottom: 8 }}>{t('riskTier', lang)}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: profile.color }}>{riskLabel}</div>
          </div>
        </section>

        <p style={{ fontSize: 16, lineHeight: 1.7, color: '#ccc', marginBottom: 40 }}>
          {description}
        </p>

        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20, marginBottom: 40 }}>
          <div style={{ padding: 24, background: 'rgba(52,211,153,0.05)', borderRadius: 16, border: '1px solid rgba(52,211,153,0.2)' }}>
            <h3 style={{ fontSize: 12, color: '#34d399', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px' }}>{t('superpower', lang)}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: '#e5e5e5' }}>{superpower}</p>
          </div>
          <div style={{ padding: 24, background: 'rgba(244,63,94,0.05)', borderRadius: 16, border: '1px solid rgba(244,63,94,0.2)' }}>
            <h3 style={{ fontSize: 12, color: '#f43f5e', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 10px' }}>{t('kryptonite', lang)}</h3>
            <p style={{ fontSize: 15, lineHeight: 1.6, margin: 0, color: '#e5e5e5' }}>{kryptonite}</p>
          </div>
        </section>

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 20px' }}>{t('fourDimensions', lang)}</h2>
          <div style={{ display: 'grid', gap: 12 }}>
            {dimensionDetails.map((d, i) => (
              <div key={i} style={{ padding: 18, background: 'rgba(255,255,255,0.03)', borderRadius: 12, border: '1px solid rgba(255,255,255,0.06)', display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ minWidth: 48, height: 48, borderRadius: 10, background: d.isFavorable ? 'rgba(244,63,94,0.15)' : 'rgba(52,211,153,0.15)', color: d.isFavorable ? '#f43f5e' : '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22 }}>
                  {d.letter}
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 600 }}>{d.name} — {d.label}</div>
                  <div style={{ fontSize: 13, color: '#888', marginTop: 2 }}>{d.description}</div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {calibration && (
          <section style={{ marginBottom: 40, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
            <div style={{ padding: 20, background: 'rgba(244,63,94,0.04)', borderRadius: 12, border: '1px solid rgba(244,63,94,0.15)' }}>
              <h3 style={{ fontSize: 13, color: '#f43f5e', margin: '0 0 10px', fontWeight: 700 }}>{t('vulnerabilities', lang)}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: '#ccc' }}>{L(calibration.vulnerabilities, lang)}</p>
            </div>
            <div style={{ padding: 20, background: 'rgba(52,211,153,0.04)', borderRadius: 12, border: '1px solid rgba(52,211,153,0.15)' }}>
              <h3 style={{ fontSize: 13, color: '#34d399', margin: '0 0 10px', fontWeight: 700 }}>{t('strengths', lang)}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.6, margin: 0, color: '#ccc' }}>{L(calibration.strengths, lang)}</p>
            </div>
          </section>
        )}

        <section style={{ marginBottom: 40 }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, margin: '0 0 12px' }}>{t('typicalJobs', lang)}</h2>
          <p style={{ fontSize: 14, color: '#aaa', marginBottom: 20 }}>{typicalJobs}</p>
          {careers.length > 0 && (
            <div>
              <h3 style={{ fontSize: 14, color: '#888', textTransform: 'uppercase', letterSpacing: 1.5, margin: '0 0 12px' }}>{t('careerRisks', lang)}</h3>
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'grid', gap: 8 }}>
                {careers.slice(0, 6).map((c, i) => (
                  <li key={i} style={{ padding: 14, background: 'rgba(255,255,255,0.03)', borderRadius: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>{L(c.title, lang)}</div>
                      <div style={{ fontSize: 12, color: '#888', marginTop: 2 }}>{L(c.reason, lang)}</div>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: c.riskScore >= 40 ? '#f43f5e' : c.riskScore >= 20 ? '#ffa500' : '#34d399', minWidth: 48, textAlign: 'right' }}>
                      {c.riskScore}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </section>

        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Link href={`/?lang=${lang}`} style={{ display: 'inline-block', padding: '14px 32px', background: profile.color, color: '#0a0908', fontWeight: 700, borderRadius: 100, textDecoration: 'none', fontSize: 15 }}>
            {t('cta', lang)}
          </Link>
        </div>
      </div>
    </main>
  );
}
