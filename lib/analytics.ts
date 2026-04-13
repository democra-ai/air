/**
 * AIR Analytics — event tracking layer
 *
 * Dual-writes to:
 * 1. Firebase Analytics (GA4) — for aggregated insights, funnels, retention
 * 2. Firestore — for individual quiz session records (structured, queryable)
 *
 * All functions are safe to call server-side (they no-op).
 * All functions are fire-and-forget (never throw, never block UI).
 */

import { logEvent } from 'firebase/analytics';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import {
  getFirebaseAnalytics,
  getFirebaseFirestore,
  getAnonymousUid,
  isFirebaseConfigured,
} from './firebase';
import type { QuizResult } from './air_quiz_calculator';
import type { QuizAnswer } from './air_quiz_data';

// ─── Types ───────────────────────────────────────────────────────────────────

type Language = 'en' | 'zh' | 'ja' | 'ko' | 'de';
type Theme = 'dark' | 'light';

interface QuizSessionData {
  uid: string | null;
  sessionId: string;
  timestamp: ReturnType<typeof serverTimestamp>;
  language: Language;
  preset: string | null;
  answers: {
    core: Record<string, QuizAnswer>;
    snapshot: Record<string, QuizAnswer>;
    survey: Record<string, number>;
  };
  dimensions: Record<string, { score: number; letter: string; isFavorable: boolean }>;
  result: {
    profileCode: string;
    profileName: string;
    riskTier: string;
    probability: number;
    year: number;
    aiCapability: number;
    confidenceInterval: { earliest: number; latest: number };
  };
  durationSeconds: number;
  userAgent: string;
  screenSize: string;
  referrer: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateSessionId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

/** Safe wrapper — never throws, never blocks */
async function safeLogEvent(eventName: string, params?: Record<string, unknown>) {
  if (!isFirebaseConfigured()) return;
  try {
    const analytics = await getFirebaseAnalytics();
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  } catch {
    // Silent — analytics should never break the app
  }
}

// ─── Session tracking ────────────────────────────────────────────────────────

let _quizStartTime: number | null = null;
let _selectedPreset: string | null = null;
let _sessionId: string | null = null;
let _questionViewTime: number | null = null;
let _previousAnswers: Record<string, number> = {};

// ─── Public API ──────────────────────────────────────────────────────────────

/** Track page view */
export function trackPageView(pagePath: string) {
  safeLogEvent('page_view', {
    page_path: pagePath,
    page_title: document.title,
  });
}

/** Track section scroll into view */
export function trackSectionView(sectionName: string) {
  safeLogEvent('section_view', { section_name: sectionName });
}

/** Track quiz start */
export function trackQuizStart(lang: Language) {
  _quizStartTime = Date.now();
  _sessionId = generateSessionId();
  _selectedPreset = null;
  _previousAnswers = {};
  _questionViewTime = null;
  safeLogEvent('quiz_start', {
    language: lang,
    session_id: _sessionId,
    device: typeof navigator !== 'undefined' ? (
      /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
    ) : 'unknown',
    screen_size: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : '',
  });
}

/** Track preset career selection */
export function trackPresetSelect(presetName: string, lang: Language) {
  _selectedPreset = presetName;
  safeLogEvent('preset_select', {
    preset_name: presetName,
    language: lang,
    session_id: _sessionId,
  });
}

/** Track individual question answer */
export function trackQuizAnswer(
  questionId: string,
  answer: number,
  phase: 'core' | 'snapshot' | 'survey',
  questionIndex: number,
) {
  safeLogEvent('quiz_answer', {
    question_id: questionId,
    answer,
    phase,
    question_index: questionIndex,
    session_id: _sessionId,
  });
}

/** Track quiz completion — writes to both Analytics and Firestore */
export async function trackQuizComplete(
  result: QuizResult,
  answers: {
    core: Record<string, QuizAnswer>;
    snapshot: Record<string, QuizAnswer>;
    survey: Record<string, number>;
  },
  lang: Language,
) {
  const durationSeconds = _quizStartTime
    ? Math.round((Date.now() - _quizStartTime) / 1000)
    : 0;

  // 1. Firebase Analytics event
  safeLogEvent('quiz_complete', {
    profile_code: result.profileCode,
    risk_tier: result.profile.riskTier,
    probability: result.replacementProbability,
    year: result.predictedReplacementYear,
    ai_capability: result.currentAICapability,
    favorable_count: result.favorableCount,
    duration_seconds: durationSeconds,
    language: lang,
    preset: _selectedPreset,
    session_id: _sessionId,
  });

  // 2. Firestore detailed record
  if (!isFirebaseConfigured()) return;
  try {
    const db = getFirebaseFirestore();
    if (!db) return;
    const uid = await getAnonymousUid();
    const sessionId = _sessionId || generateSessionId();

    const sessionData: QuizSessionData = {
      uid,
      sessionId,
      timestamp: serverTimestamp(),
      language: lang,
      preset: _selectedPreset,
      answers,
      dimensions: Object.fromEntries(
        result.dimensions.map((d) => [
          d.dimensionId,
          { score: d.rawAverage, letter: d.letter, isFavorable: d.isFavorable },
        ]),
      ),
      result: {
        profileCode: result.profileCode,
        profileName: (result.profile.name as Record<string, string>)[lang] ?? result.profile.name['en'],
        riskTier: result.profile.riskTier,
        probability: result.replacementProbability,
        year: result.predictedReplacementYear,
        aiCapability: result.currentAICapability,
        confidenceInterval: result.confidenceInterval,
      },
      durationSeconds,
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      screenSize:
        typeof window !== 'undefined'
          ? `${window.innerWidth}x${window.innerHeight}`
          : '',
      referrer: typeof document !== 'undefined' ? document.referrer : '',
    };

    const docRef = doc(collection(db, 'quiz_sessions'), sessionId);
    await setDoc(docRef, sessionData);
  } catch (err) {
    console.error('[AIR Analytics] Firestore quiz_sessions write failed:', err);
  }
}

/** Track share action */
export function trackShareClick(channel: string, lang: Language) {
  safeLogEvent('share_click', {
    channel,
    language: lang,
    session_id: _sessionId,
  });
}

/** Track theme toggle */
export function trackThemeToggle(newTheme: Theme) {
  safeLogEvent('theme_toggle', { theme: newTheme });
}

/** Track language toggle */
export function trackLangToggle(newLang: Language) {
  safeLogEvent('lang_toggle', { language: newLang });
}

/** Track CTA / button click */
export function trackCtaClick(ctaId: string, location: string) {
  safeLogEvent('cta_click', { cta_id: ctaId, location });
}

/** Track navigation (mobile bottom nav) */
export function trackNavigation(section: string) {
  safeLogEvent('nav_click', { section });
}

/** Track quiz abandon (user leaves mid-quiz) */
export function trackQuizAbandon(
  phase: string,
  questionIndex: number,
  lang: Language,
) {
  safeLogEvent('quiz_abandon', {
    phase,
    question_index: questionIndex,
    language: lang,
    session_id: _sessionId,
    duration_seconds: _quizStartTime
      ? Math.round((Date.now() - _quizStartTime) / 1000)
      : 0,
  });
}

/** Track external link click */
export function trackExternalLink(url: string, label: string) {
  safeLogEvent('external_link_click', { url, label });
}

/** Track internal navigation (e.g. link to /analysis, /data-protection) */
export function trackInternalNavigation(destination: string, source: string) {
  safeLogEvent('internal_navigation', { destination, source });
}

/** Track scroll depth milestones (25%, 50%, 75%, 100%) */
export function trackScrollDepth(depth: number) {
  safeLogEvent('scroll_depth', { depth_percent: depth });
}

/** Track SOC occupation group selection */
export function trackSOCSelect(socCode: number, socName: string, lang: Language) {
  safeLogEvent('soc_select', {
    soc_code: socCode,
    soc_name: socName,
    language: lang,
    session_id: _sessionId,
  });
}

/** Track progress bar stage interaction (hover/click on AI kill line stages) */
export function trackStageInteraction(stageId: number, stageName: string, action: 'hover' | 'click') {
  safeLogEvent('stage_interaction', {
    stage_id: stageId,
    stage_name: stageName,
    action,
  });
}

/** Track expandable section toggle */
export function trackExpandToggle(sectionId: string, expanded: boolean) {
  safeLogEvent('expand_toggle', {
    section_id: sectionId,
    expanded,
  });
}

/** Track timeline milestone interaction */
export function trackTimelineInteraction(milestoneId: string, milestoneName: string, action: 'select' | 'deselect') {
  safeLogEvent('timeline_interaction', {
    milestone_id: milestoneId,
    milestone_name: milestoneName,
    action,
  });
}

/** Track quiz back button click */
export function trackQuizBack(phase: string, fromIndex: number) {
  safeLogEvent('quiz_back', {
    phase,
    from_index: fromIndex,
    session_id: _sessionId,
  });
}

/** Track share panel open/close */
export function trackSharePanelToggle(opened: boolean) {
  safeLogEvent('share_panel_toggle', {
    opened,
    session_id: _sessionId,
  });
}

/** Track info popup open (e.g. kill line calculation explanation) */
export function trackInfoPopup(popupId: string, opened: boolean) {
  safeLogEvent('info_popup', { popup_id: popupId, opened });
}

/** Track hero stat card expand (mobile) */
export function trackStatCardExpand(statIndex: number, label: string) {
  safeLogEvent('stat_card_expand', { stat_index: statIndex, label });
}

/** Track page visibility change (tab switch) */
export function trackVisibilityChange(visible: boolean) {
  safeLogEvent('visibility_change', { visible });
}

/** Track session engagement time */
export function trackEngagementTime(totalSeconds: number) {
  safeLogEvent('engagement_time', { total_seconds: totalSeconds });
}

/** Track UTM parameters from URL */
export function trackUtmParams(params: Record<string, string>) {
  if (Object.keys(params).length === 0) return;
  safeLogEvent('utm_captured', params);
}

/** Track preset career panel open/close */
export function trackPresetPanelToggle(opened: boolean, lang: Language) {
  safeLogEvent('preset_panel_toggle', { opened, language: lang });
}

// ─── Enhanced Quiz Analytics ────────────────────────────────────────────────

/** Track when a question is displayed to the user (for time-per-question) */
export function trackQuestionView(questionId: string, phase: 'core' | 'snapshot' | 'survey', questionIndex: number) {
  _questionViewTime = Date.now();
  safeLogEvent('question_view', {
    question_id: questionId,
    phase,
    question_index: questionIndex,
    session_id: _sessionId,
  });
}

/** Track answer with time spent and revision detection */
export function trackQuizAnswerDetailed(
  questionId: string,
  answer: number,
  phase: 'core' | 'snapshot' | 'survey',
  questionIndex: number,
) {
  const timeSpentMs = _questionViewTime ? Date.now() - _questionViewTime : null;
  const previousAnswer = _previousAnswers[questionId];
  const isRevision = previousAnswer !== undefined && previousAnswer !== answer;

  _previousAnswers[questionId] = answer;

  safeLogEvent('quiz_answer_detailed', {
    question_id: questionId,
    answer,
    phase,
    question_index: questionIndex,
    session_id: _sessionId,
    time_spent_ms: timeSpentMs,
    is_revision: isRevision,
    previous_answer: isRevision ? previousAnswer : null,
  });
}

/** Track quiz phase transition (intro → core → confirm → result) */
export function trackQuizPhase(fromPhase: string, toPhase: string) {
  const elapsedMs = _quizStartTime ? Date.now() - _quizStartTime : null;
  safeLogEvent('quiz_phase', {
    from_phase: fromPhase,
    to_phase: toPhase,
    elapsed_ms: elapsedMs,
    session_id: _sessionId,
  });
}

/** Track result section engagement (user viewing specific parts of result) */
export function trackResultInteraction(action: string, detail?: string) {
  safeLogEvent('result_interaction', {
    action,
    detail: detail ?? null,
    session_id: _sessionId,
  });
}

/** Track quiz mode selection (quick vs comprehensive) */
export function trackQuizModeSelect(mode: 'compact' | 'full', lang: Language) {
  safeLogEvent('quiz_mode_select', {
    mode,
    language: lang,
    session_id: _sessionId,
  });
}

/** Track quiz retake */
export function trackQuizRetake(previousProfileCode: string, lang: Language) {
  safeLogEvent('quiz_retake', {
    previous_profile: previousProfileCode,
    language: lang,
    session_id: _sessionId,
  });
  // Reset tracking state for new session
  _quizStartTime = Date.now();
  _sessionId = generateSessionId();
  _previousAnswers = {};
  _questionViewTime = null;
}

/** Track per-question answer distribution (written to Firestore for aggregation) */
export async function trackAnswerDistribution(
  answers: Record<string, number>,
  profileCode: string,
  lang: Language,
) {
  if (!isFirebaseConfigured()) return;
  try {
    const db = getFirebaseFirestore();
    if (!db) return;
    const sessionId = _sessionId || generateSessionId();
    const docRef = doc(collection(db, 'answer_distributions'), sessionId);
    await setDoc(docRef, {
      sessionId,
      timestamp: serverTimestamp(),
      language: lang,
      profileCode,
      answers, // { "Q1": 3, "Q2": 5, ... }
      device: typeof navigator !== 'undefined' ? (
        /Mobile|Android|iPhone/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
      ) : 'unknown',
    });
  } catch (err) {
    console.error('[AIR Analytics] Firestore answer_distributions write failed:', err);
  }
}

/**
 * Initialize analytics on app mount.
 * Call once from the root client component.
 */
export async function initAnalytics() {
  if (!isFirebaseConfigured()) return;
  // Warm up anonymous auth + analytics in parallel
  await Promise.all([getAnonymousUid(), getFirebaseAnalytics()]);
  // Track initial page view
  if (typeof window !== 'undefined') {
    trackPageView(window.location.pathname);
  }
}
