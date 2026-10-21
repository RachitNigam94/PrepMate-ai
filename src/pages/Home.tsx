import React, { useState } from 'react';
import { UserMe, Session, ExperienceLevel, RoundType, Usage } from '../types.ts';
import { api } from '../lib/api.ts';
import { Check, Edit2, Play, Target, BookOpen } from 'lucide-react';

interface HomeProps {
  me: UserMe;
  sessions: Session[];
  usage: Usage | null;
  onStartRound: (roundType: RoundType) => void;
  onRefreshMe: () => void;
  onOpenQuestionBank: () => void;
}

const LEVELS: { value: ExperienceLevel; label: string; hint: string }[] = [
  { value: 'student', label: 'Student', hint: 'Preparing for campus placements (final/pre-final year)' },
  { value: 'fresher', label: 'Fresher', hint: 'Graduated, actively looking for entry-level SDE/analyst roles' },
  { value: 'experienced', label: 'Experienced', hint: 'Working professional switching roles or companies' },
];

const ROUNDS_INFO: {
  type: RoundType;
  title: string;
  tag: string;
  desc: string;
  sample: string;
}[] = [
  {
    type: 'hr',
    title: 'HR & Personality',
    tag: '10 Core Questions',
    desc: 'Introduce yourself, career goals, strengths & weaknesses, salary expectations, why this company.',
    sample: '"Tell me about yourself and why you chose software engineering."',
  },
  {
    type: 'behavioural',
    title: 'STAR Behavioural',
    tag: '10 Scenarios',
    desc: 'Leadership, failure recovery, initiative, resolving teammate conflicts, tight deadlines.',
    sample: '"Describe a situation where you had to lead a team through a crisis."',
  },
  {
    type: 'technical',
    title: 'Technical Concepts',
    tag: '12 Deep Dives',
    desc: 'Database indexing, Git rebase vs merge, OS Coffman deadlock conditions, TCP vs UDP, React hooks.',
    sample: '"Explain deadlock. What are the four Coffman conditions and how can you prevent it?"',
  },
  {
    type: 'aptitude',
    title: 'Quantitative & Logic',
    tag: '8 Challenges',
    desc: 'Percentages, probability, time & work, permutations, speed & distance, logical sequences.',
    sample: '"A shopkeeper marks an item 30% above cost and offers 10% discount. What is profit %?"',
  },
];

export function Home({
  me,
  sessions,
  usage,
  onStartRound,
  onRefreshMe,
  onOpenQuestionBank,
}: HomeProps) {
  const firstName = me.profile.display_name?.split(' ')[0] || 'Guest';
  const [editingProfile, setEditingProfile] = useState(false);
  const [displayName, setDisplayName] = useState(me.profile.display_name || 'Guest');
  const [targetRole, setTargetRole] = useState(me.profile.target_role || 'Software Engineer');
  const [level, setLevel] = useState<ExperienceLevel>(me.profile.experience_level || 'student');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateMe({
        display_name: displayName.trim() || 'Guest',
        target_role: targetRole.trim() || 'Software Engineer',
        experience_level: level,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
      setEditingProfile(false);
      onRefreshMe();
    } catch (err) {
      console.error('Failed to update profile:', err);
    } finally {
      setSaving(false);
    }
  }

  // Calculate statistics
  const completedSessions = sessions.filter((s) => s.status === 'completed');
  const scoredSessions = sessions.filter((s) => s.average_score !== null);
  const avgOverall =
    scoredSessions.length > 0
      ? (
          scoredSessions.reduce((acc, s) => acc + (s.average_score || 0), 0) / scoredSessions.length
        ).toFixed(1)
      : null;
  const totalQuestionsAnswered = sessions.reduce((acc, s) => acc + (s.answer_count || 0), 0);

  return (
    <main className="mx-auto max-w-4xl px-4 py-8 md:py-12 bg-[#fafbfd]">
      {/* Ruled Sheet Header */}
      <div className="sheet pr-4 mb-8">
        <h1 className="sheet-title text-blue-900 font-bold">Hello, {firstName}.</h1>
        <p className="rules-1 max-w-2xl text-slate-800 text-base leading-relaxed">
          Ready for placement season? You answer real interview questions out loud or typed, and get
          scored STAR feedback on structure, relevance, clarity, and depth.
        </p>
      </div>

      {/* Profile & Target Role Card */}
      <div className="rounded-[4px] border border-slate-200 bg-white p-6 mb-10 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-800" />
            <h2 className="font-display text-lg font-bold text-slate-900">Your Target Placement</h2>
          </div>
          <button
            type="button"
            onClick={() => setEditingProfile(!editingProfile)}
            className="btn btn-quiet text-xs py-1 px-3 h-8 flex items-center gap-1.5 text-blue-900 hover:bg-slate-100"
          >
            <Edit2 className="w-3.5 h-3.5" />
            <span>{editingProfile ? 'Cancel' : 'Edit Placement Goals'}</span>
          </button>
        </div>

        {editingProfile ? (
          <form onSubmit={handleSaveProfile} className="space-y-4 pt-1">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="field-label text-xs text-slate-900">Your Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="field-input text-sm bg-white text-slate-900 border-slate-300"
                  placeholder="e.g. Guest"
                  required
                />
              </div>

              <div>
                <label className="field-label text-xs text-slate-900">Target Job Role</label>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="field-input text-sm bg-white text-slate-900 border-slate-300"
                  placeholder="e.g. SDE-1 / Software Engineer"
                  required
                />
              </div>
            </div>

            <div>
              <label className="field-label text-xs text-slate-900">Experience Level</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-1">
                {LEVELS.map((lvl) => (
                  <label
                    key={lvl.value}
                    className={`flex flex-col p-3 rounded-[3px] border cursor-pointer transition-colors ${
                      level === lvl.value
                        ? 'border-blue-800 bg-blue-50/70 text-blue-900 ring-1 ring-blue-800'
                        : 'border-slate-200 bg-white hover:border-slate-400 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs">{lvl.label}</span>
                      <input
                        type="radio"
                        name="level"
                        value={lvl.value}
                        checked={level === lvl.value}
                        onChange={() => setLevel(lvl.value)}
                        className="accent-blue-800"
                      />
                    </div>
                    <span className="text-[11px] text-slate-600 leading-tight">{lvl.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button type="submit" disabled={saving} className="btn btn-primary text-xs py-1.5 px-4 h-9">
                {saving ? 'Saving...' : 'Save Goals'}
              </button>
              {saveSuccess && (
                <span className="text-xs text-emerald-700 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Saved!
                </span>
              )}
            </div>
          </form>
        ) : (
          <div className="flex flex-wrap items-center gap-y-3 gap-x-8 text-sm text-slate-800">
            <div>
              <span className="text-xs text-slate-500 block font-medium">Candidate</span>
              <span className="font-bold text-slate-900">{me.profile.display_name}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Target Role</span>
              <span className="font-bold text-blue-900">{me.profile.target_role}</span>
            </div>
            <div>
              <span className="text-xs text-slate-500 block font-medium">Level</span>
              <span className="capitalize font-semibold text-slate-800">{me.profile.experience_level}</span>
            </div>
          </div>
        )}
      </div>

      {/* Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 text-center shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Sessions Done</span>
          <span className="text-2xl font-bold text-slate-900 font-display mt-0.5 block">
            {completedSessions.length}
          </span>
        </div>
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 text-center shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Questions Answered</span>
          <span className="text-2xl font-bold text-blue-900 font-display mt-0.5 block">
            {totalQuestionsAnswered}
          </span>
        </div>
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 text-center shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Average STAR Score</span>
          <span className="text-2xl font-bold text-emerald-700 font-display mt-0.5 block">
            {avgOverall ? `${avgOverall}/10` : '—'}
          </span>
        </div>
        <div className="rounded-[4px] border border-slate-200 bg-white p-4 text-center shadow-xs">
          <span className="text-xs text-slate-500 block font-medium">Daily AI Quota</span>
          <span className="text-2xl font-bold text-blue-900 font-display mt-0.5 block">
            {usage ? `${usage.feedback_limit - usage.feedback_calls}` : '50'}
          </span>
          <span className="text-[10px] text-slate-500 block">free credits left</span>
        </div>
      </div>

      {/* Practice Rounds Selection */}
      <section className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-display text-2xl font-bold text-blue-900">Interview Practice Rounds</h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Choose a round to begin. Questions are tailored to Indian campus placements and top tech firms.
            </p>
          </div>
          <button
            type="button"
            onClick={onOpenQuestionBank}
            className="text-xs text-blue-800 hover:underline font-bold flex items-center gap-1"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Browse All 40 Questions</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {ROUNDS_INFO.map((round) => (
            <div
              key={round.type}
              className="rounded-[4px] border border-slate-200 bg-white p-5 hover:border-blue-700 transition-all shadow-xs flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="uppercase text-[11px] font-bold tracking-wider px-2 py-0.5 rounded bg-blue-100 text-blue-950">
                    {round.title}
                  </span>
                  <span className="text-xs font-mono font-medium text-slate-600">{round.tag}</span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed mt-2">{round.desc}</p>
                <div className="mt-3 p-3 rounded bg-slate-50 border border-slate-200 text-xs text-slate-800 italic">
                  {round.sample}
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-500 font-medium">Instant STAR Evaluation</span>
                <button
                  type="button"
                  onClick={() => onStartRound(round.type)}
                  className="btn btn-primary text-xs py-1 px-3.5 h-8 gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Start Round</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Past Sessions List */}
      {sessions.length > 0 && (
        <section className="border-t border-slate-200 pt-8">
          <h2 className="font-display text-xl font-bold text-blue-900 mb-3">Your Session History</h2>
          <div className="space-y-2">
            {sessions.map((sess) => (
              <div
                key={sess.id}
                className="flex items-center justify-between rounded-[4px] border border-slate-200 bg-white px-4 py-3 shadow-xs hover:border-slate-400 transition-colors"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-800">
                      {sess.round_type}
                    </span>
                    <span className="font-bold text-sm text-slate-900">
                      {sess.round_type.toUpperCase()} Round
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {sess.answer_count} question{sess.answer_count !== 1 ? 's' : ''} answered ·{' '}
                    {new Date(sess.started_at).toLocaleDateString(undefined, {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </p>
                </div>

                <div className="text-right">
                  {sess.average_score !== null ? (
                    <span
                      className={`font-bold text-sm ${
                        sess.average_score >= 7
                          ? 'text-emerald-700'
                          : sess.average_score >= 4
                          ? 'text-blue-900'
                          : 'text-rose-700'
                      }`}
                    >
                      {sess.average_score} / 10
                    </span>
                  ) : (
                    <span className="text-xs text-slate-400">—</span>
                  )}
                  <span className="block text-[11px] text-slate-500 capitalize">{sess.status}</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
