import React, { useState } from 'react';
import { Wordmark } from '../components/Wordmark.tsx';
import { ArrowRight, CheckCircle2, Mic, Sparkles, BookOpen, UserCheck } from 'lucide-react';

interface SignInProps {
  onSignIn: (demoUser?: { name: string; role: string; level: 'student' | 'fresher' | 'experienced' }) => void;
}

export function SignIn({ onSignIn }: SignInProps) {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) {
      setSent(true);
      setTimeout(() => {
        onSignIn({ name: email.split('@')[0], role: 'Software Engineer', level: 'student' });
      }, 800);
    }
  }

  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] bg-[#fafbfd] text-slate-900">
      {/* Left side: Exam hall ruled paper pitch */}
      <section
        aria-labelledby="pitch"
        className="sheet border-b border-slate-200 pr-6 md:border-r md:border-b-0 md:pr-12 flex flex-col justify-between bg-[#fafbfd]"
      >
        <div>
          <Wordmark />
          <div className="rules-2 max-w-xl md:rules-4">
            <h1 id="pitch" className="sheet-title text-blue-900 font-bold">
              Practise the answer before the interview asks for it.
            </h1>
            <p className="rules-1 max-w-md text-slate-800 text-base leading-relaxed">
              Answer real placement questions out loud or typed. Get scored on structure, clarity,
              and pace, with the exact sentences to fix before your dream campus interview.
            </p>
          </div>

          <div className="rules-2 space-y-3 max-w-md">
            <div className="flex items-center gap-2.5 text-xs text-slate-800">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span><strong className="text-slate-900">STAR Framework:</strong> Scored on Structure, Relevance, Clarity & Depth</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-800">
              <Mic className="w-4 h-4 text-blue-800 shrink-0" />
              <span><strong className="text-slate-900">Real-time Voice:</strong> Practice answering out loud with pacing meter</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-slate-800">
              <BookOpen className="w-4 h-4 text-blue-800 shrink-0" />
              <span><strong className="text-slate-900">40 Real Questions:</strong> HR, Behavioural, Concurrency, SQL, Git & Aptitude</span>
            </div>
          </div>
        </div>

        <div className="py-6 text-xs text-slate-600">
          Engineered for Indian campus placements & tech interviews.
        </div>
      </section>

      {/* Right side: Instant Access */}
      <main className="flex items-start px-6 py-12 md:items-center md:px-12 bg-white">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-800 block mb-1">
              Placement Season 2026
            </span>
            <h2 className="font-display text-2xl font-bold text-slate-900">Enter Workspace</h2>
            <p className="text-xs text-slate-600 mt-1">
              Start immediately as a Guest candidate or enter your email.
            </p>
          </div>

          {/* Quick Demo Login (Recommended) */}
          <div className="p-5 rounded-[4px] border border-blue-200 bg-blue-50/70 space-y-3 shadow-xs">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <UserCheck className="w-4 h-4 text-blue-800" />
              <span>Instant Placement Candidate Demo</span>
            </div>
            <p className="text-xs text-slate-700 leading-relaxed">
              Logs you in as <strong>Guest</strong> (Candidate preparing for SDE-1 campus placement).
            </p>
            <button
              type="button"
              onClick={() => onSignIn({ name: 'Guest', role: 'SDE-1 (Campus Placement)', level: 'student' })}
              className="btn btn-primary w-full text-xs py-2.5 h-10 gap-2 shadow-xs"
            >
              <span>Continue as Guest</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-200 w-full" />
            <span className="bg-white px-2 text-[11px] text-slate-500 uppercase font-semibold">
              Or sign in with email
            </span>
          </div>

          {/* Email form */}
          {sent ? (
            <div className="p-4 rounded-[4px] bg-emerald-50 border border-emerald-200 text-xs text-emerald-950 space-y-1">
              <p className="font-semibold text-emerald-900">Signing you in...</p>
              <p className="text-emerald-800">Opening your ruled answer sheet.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="email-input" className="field-label text-xs text-slate-900">
                  College or Personal Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input text-xs bg-white text-slate-900 placeholder:text-slate-400 border-slate-300"
                />
              </div>
              <button type="submit" className="btn btn-quiet w-full text-xs py-2 h-9 text-slate-800 hover:bg-slate-50">
                Sign In With Email
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
