import React, { useState, useEffect } from 'react';
import {
  Answer,
  Question,
  RoundType,
  Session,
  Usage,
} from '../types.ts';
import { api } from '../lib/api.ts';
import { SpeechRecorder } from '../components/SpeechRecorder.tsx';
import {
  Sparkles,
  ChevronRight,
  AlertTriangle,
  Lightbulb,
  Timer,
  Eye,
  EyeOff,
} from 'lucide-react';

interface PracticeProps {
  initialRoundType?: RoundType;
  onFinish: () => void;
  onOpenQuestionBank: () => void;
  usage: Usage | null;
  onRefreshUsage: () => void;
}

const ROUND_LABELS: Record<RoundType, string> = {
  hr: 'HR & Personality',
  behavioural: 'STAR Behavioural',
  technical: 'Technical Concepts',
  aptitude: 'Quantitative & Aptitude',
};

const DIFFICULTY_LABELS: Record<number, string> = {
  1: 'Easy',
  2: 'Medium',
  3: 'Hard',
};

export function Practice({
  initialRoundType = 'hr',
  onFinish,
  onOpenQuestionBank,
  usage,
  onRefreshUsage,
}: PracticeProps) {
  const [selectedRound, setSelectedRound] = useState<RoundType>(initialRoundType);
  const [session, setSession] = useState<Session | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [startingSession, setStartingSession] = useState(false);
  const [answers, setAnswers] = useState<Answer[]>([]);

  // Answer form state
  const [answerText, setAnswerText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [latestAnswer, setLatestAnswer] = useState<Answer | null>(null);
  const [showReferenceAnswer, setShowReferenceAnswer] = useState(false);

  // Question elapsed timer
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerActive, setTimerActive] = useState(false);

  useEffect(() => {
    let interval: any = null;
    if (timerActive) {
      interval = setInterval(() => setTimerSeconds((s) => s + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [timerActive]);

  async function handleStartSession(round: RoundType) {
    setStartingSession(true);
    try {
      const sess = await api.createSession(round);
      setSession(sess);
      setAnswers([]);
      setLatestAnswer(null);
      await fetchNextQuestion(round);
    } catch (err: any) {
      console.error('Failed to create session:', err);
    } finally {
      setStartingSession(false);
    }
  }

  async function fetchNextQuestion(round: RoundType) {
    setLoadingQuestion(true);
    setAnswerText('');
    setLatestAnswer(null);
    setShowReferenceAnswer(false);
    setTimerSeconds(0);
    setTimerActive(true);
    try {
      const q = await api.nextQuestion(round);
      setCurrentQuestion(q);
    } catch (err: any) {
      console.error('Failed to fetch question:', err);
    } finally {
      setLoadingQuestion(false);
    }
  }

  async function handleSubmitAnswer(e: React.FormEvent) {
    e.preventDefault();
    if (!session || !currentQuestion) return;
    const trimmed = answerText.trim();
    if (!trimmed) return;

    setSubmitting(true);
    setSubmitError(null);
    setTimerActive(false);

    try {
      const answer = await api.submitAnswer(session.id, currentQuestion.id, trimmed);
      setLatestAnswer(answer);
      setAnswers((prev) => [...prev, answer]);
      onRefreshUsage();
    } catch (err: any) {
      setSubmitError(err.message || 'Failed to submit answer for evaluation');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleCompleteSession() {
    if (session) {
      try {
        await api.completeSession(session.id);
      } catch (err) {
        console.error('Failed to complete session:', err);
      }
    }
    onFinish();
  }

  const formatTimer = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // If no session started yet, show Round Picker
  if (!session) {
    return (
      <main className="mx-auto max-w-4xl px-4 py-8 md:py-12 bg-[#fafbfd]">
        <div className="sheet pr-4 mb-8">
          <h1 className="sheet-title text-blue-900 font-bold">Start Practising</h1>
          <p className="rules-1 max-w-xl text-slate-800 text-base leading-relaxed">
            Pick a round type and answer questions one at a time. Speak out loud or type. You will get
            scored STAR feedback on structure, relevance, clarity, and depth.
          </p>
        </div>

        <div className="max-w-xl mt-8">
          <fieldset>
            <legend className="field-label text-sm font-bold text-slate-900">Choose Round Type</legend>
            <div className="mt-2 grid gap-2.5">
              {(Object.keys(ROUND_LABELS) as RoundType[]).map((rt) => (
                <label
                  key={rt}
                  className={`flex cursor-pointer items-center justify-between rounded-[4px] border p-3.5 transition-all shadow-xs ${
                    selectedRound === rt
                      ? 'border-blue-800 bg-white ring-2 ring-blue-800 text-slate-900'
                      : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="round-type"
                      value={rt}
                      checked={selectedRound === rt}
                      onChange={() => setSelectedRound(rt)}
                      className="accent-blue-800 w-4 h-4"
                    />
                    <div>
                      <span className="font-bold text-slate-900 text-sm block">
                        {ROUND_LABELS[rt]}
                      </span>
                      <span className="text-xs text-slate-600">
                        {rt === 'hr' && 'Self-intro, motivation, conflict & career alignment'}
                        {rt === 'behavioural' && 'STAR scenarios (Situation, Task, Action, Result)'}
                        {rt === 'technical' && 'Databases, Concurrency, Git, OS, Networking & Web'}
                        {rt === 'aptitude' && 'Percentages, Speed-Time, Probability, Logic puzzles'}
                      </span>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </fieldset>

          {usage && (
            <div className="mt-5 flex items-center justify-between text-xs text-slate-700 bg-white p-3 rounded-[4px] border border-slate-200 shadow-xs">
              <span>{usage.feedback_calls} feedback calls completed today</span>
              <span className="font-bold text-blue-900">
                {usage.feedback_limit - usage.feedback_calls} remaining
              </span>
            </div>
          )}

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <button
              type="button"
              className="btn btn-primary"
              disabled={startingSession}
              onClick={() => handleStartSession(selectedRound)}
            >
              {startingSession ? 'Preparing question...' : `Begin ${ROUND_LABELS[selectedRound]}`}
            </button>
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="btn btn-quiet text-xs text-blue-900 hover:bg-slate-100"
            >
              Browse Question Bank
            </button>
          </div>
        </div>
      </main>
    );
  }

  // Active Session View
  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-10 bg-[#fafbfd]">
      {/* Question metadata strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 border-b border-slate-200 pb-3 mb-6">
        <div className="flex items-center gap-2">
          <span className="rounded bg-blue-100 px-2 py-0.5 font-bold text-blue-950 uppercase text-[11px]">
            {ROUND_LABELS[session.round_type]}
          </span>
          {currentQuestion && (
            <>
              <span>·</span>
              <span className="font-bold text-slate-900">{currentQuestion.topic}</span>
              <span>·</span>
              <span className="font-medium">Difficulty: {DIFFICULTY_LABELS[currentQuestion.difficulty] || 'Medium'}</span>
            </>
          )}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-slate-900 font-bold">
            <Timer className="w-3.5 h-3.5 text-blue-800" />
            <span>{formatTimer(timerSeconds)}</span>
          </div>
          <span className="font-bold text-blue-900">{answers.length} answered</span>
        </div>
      </div>

      {/* Ruled Sheet Question Prompt */}
      {loadingQuestion ? (
        <div className="py-12 text-center text-slate-600">
          <div className="inline-block w-6 h-6 border-2 border-blue-900 border-t-transparent rounded-full animate-spin mb-2" />
          <p className="text-sm">Drawing next interview question from database...</p>
        </div>
      ) : currentQuestion ? (
        <div className="sheet pr-4 mb-6">
          <h1 className="sheet-title text-blue-900 font-bold">{currentQuestion.prompt}</h1>
        </div>
      ) : null}

      {/* STAR Framework Guidance Strip */}
      <div className="mb-6 p-3 rounded-[4px] bg-white border border-slate-200 text-xs flex flex-wrap items-center justify-between gap-2 shadow-xs">
        <div className="flex items-center gap-1.5 font-bold text-blue-900">
          <Lightbulb className="w-4 h-4 text-amber-500" />
          <span>Recommended Interview Structure:</span>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-slate-700">
          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-900 font-semibold border border-slate-200">
            <strong>S</strong>ituation (10%)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-900 font-semibold border border-slate-200">
            <strong>T</strong>ask (10%)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-900 font-semibold border border-slate-200">
            <strong>A</strong>ction (60%)
          </span>
          <span className="px-1.5 py-0.5 rounded bg-slate-100 font-mono text-[11px] text-slate-900 font-semibold border border-slate-200">
            <strong>R</strong>esult (20%)
          </span>
        </div>
      </div>

      {/* Answer Form or Feedback Card */}
      {latestAnswer && latestAnswer.question_id === currentQuestion?.id ? (
        <div className="space-y-6">
          {/* Feedback Card */}
          <div className="rounded-[4px] border border-slate-200 bg-white p-6 shadow-xs text-slate-900">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-blue-800" />
                <h2 className="font-display text-xl font-bold text-slate-900">STAR Evaluation & Scores</h2>
              </div>
              <span className="text-xs font-mono font-medium text-slate-500">Evaluated by Gemini AI</span>
            </div>

            {/* Score Grid */}
            {latestAnswer.scores && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
                <ScoreBadge label="Structure (STAR)" value={latestAnswer.scores.structure} />
                <ScoreBadge label="Relevance" value={latestAnswer.scores.relevance} />
                <ScoreBadge label="Clarity" value={latestAnswer.scores.clarity} />
                <ScoreBadge label="Depth & Examples" value={latestAnswer.scores.depth} />
                <ScoreBadge
                  label="Overall Score"
                  value={latestAnswer.scores.overall}
                  highlight
                />
              </div>
            )}

            {/* Overall Assessment */}
            {latestAnswer.feedback?.overall && (
              <div className="mb-6 p-4 rounded-[4px] bg-slate-50 border border-slate-200">
                <h3 className="font-bold text-blue-900 text-sm mb-1">Coach Assessment</h3>
                <p className="text-sm text-slate-800 leading-relaxed font-normal">
                  {latestAnswer.feedback.overall}
                </p>
              </div>
            )}

            {/* Actionable Improvements */}
            {latestAnswer.feedback?.improvements && latestAnswer.feedback.improvements.length > 0 && (
              <div className="mb-6 space-y-3">
                <h3 className="font-bold text-blue-900 text-sm">Actionable Improvements</h3>
                {latestAnswer.feedback.improvements.map((imp, idx) => (
                  <div
                    key={idx}
                    className="p-3.5 rounded-[4px] border border-slate-200 bg-slate-50 text-xs space-y-1.5"
                  >
                    <p className="font-bold text-rose-700 flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                      <span>{imp.issue}</span>
                    </p>
                    <p className="text-slate-800 pl-5 leading-relaxed font-medium">{imp.suggestion}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Reference / Model Answer Drawer Toggle */}
            {currentQuestion?.reference_answer && (
              <div className="mt-4 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReferenceAnswer(!showReferenceAnswer)}
                  className="text-xs font-bold text-blue-800 hover:underline flex items-center gap-1.5"
                >
                  {showReferenceAnswer ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  <span>{showReferenceAnswer ? 'Hide Gold-Standard Answer' : 'Reveal Gold-Standard Answer'}</span>
                </button>

                {showReferenceAnswer && (
                  <div className="mt-3 p-4 rounded-[4px] bg-blue-50/70 border border-blue-200 text-xs text-slate-900 leading-relaxed whitespace-pre-wrap font-sans">
                    <span className="font-bold text-blue-950 block mb-1">
                      Gold-Standard Answer ({currentQuestion.topic}):
                    </span>
                    {currentQuestion.reference_answer}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-2">
            <button
              type="button"
              className="btn btn-primary"
              onClick={() => fetchNextQuestion(session.round_type)}
            >
              <span>Next Question</span>
              <ChevronRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              className="btn btn-quiet text-xs text-slate-800 hover:bg-slate-100"
              onClick={handleCompleteSession}
            >
              Finish Session ({answers.length} answered)
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitAnswer} className="space-y-4">
          {/* Speech-to-Text Microphone Recording Section */}
          <SpeechRecorder
            onTranscriptUpdate={(chunk, append) => {
              setAnswerText((prev) => (append ? prev + (prev && !prev.endsWith(' ') ? ' ' : '') + chunk : chunk));
            }}
            disabled={submitting}
          />

          {/* Candidate Written / Transcribed Answer Box */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label htmlFor="answer-box" className="field-label text-xs text-slate-900 font-bold">
                Your Answer (Speak above or type directly)
              </label>
              <span className="text-xs text-slate-500 font-mono font-medium">
                {answerText.trim().split(/\s+/).filter(Boolean).length} words · {answerText.length} / 8000
              </span>
            </div>
            <textarea
              id="answer-box"
              rows={8}
              value={answerText}
              onChange={(e) => setAnswerText(e.target.value)}
              disabled={submitting}
              placeholder="Structure your response: Situation, Task, Action, and quantifiable Result..."
              className="field-input font-sans text-sm leading-relaxed min-h-[12rem] resize-y bg-white text-slate-900 border-slate-300 placeholder:text-slate-400"
              maxLength={8000}
            />
          </div>

          {submitError && (
            <p className="text-xs text-rose-700 flex items-center gap-1.5 p-2 rounded bg-rose-50 border border-rose-200 font-medium">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{submitError}</span>
            </p>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              disabled={submitting || !answerText.trim()}
              className="btn btn-primary flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{submitting ? 'Analyzing with Gemini...' : 'Submit Answer for STAR Feedback'}</span>
            </button>

            <button
              type="button"
              onClick={handleCompleteSession}
              disabled={submitting}
              className="btn btn-quiet text-xs text-slate-800 hover:bg-slate-100"
            >
              End Practice Round
            </button>
          </div>
        </form>
      )}
    </main>
  );
}

function ScoreBadge({
  label,
  value,
  highlight,
}: {
  label: string;
  value: number;
  highlight?: boolean;
}) {
  const colour = value >= 7 ? 'text-emerald-700' : value >= 4 ? 'text-blue-900' : 'text-rose-700';
  return (
    <div
      className={`rounded-[4px] border p-3 text-center transition-all shadow-xs ${
        highlight ? 'border-blue-800 bg-blue-50/80 ring-1 ring-blue-800' : 'border-slate-200 bg-white'
      }`}
    >
      <p className="text-[11px] text-slate-600 font-bold">{label}</p>
      <p className={`text-2xl font-bold font-display mt-0.5 ${colour}`}>{value}</p>
      <p className="text-[10px] text-slate-500 font-semibold">/ 10</p>
    </div>
  );
}
