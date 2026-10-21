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
      }, 1000);
    }
  }

  return (
    <div className="grid min-h-dvh md:grid-cols-[minmax(0,7fr)_minmax(0,5fr)]">
      {/* Left side: Exam hall ruled paper pitch */}
      <section
        aria-labelledby="pitch"
        className="sheet border-b border-rule pr-6 md:border-r md:border-b-0 md:pr-12 flex flex-col justify-between"
      >
        <div>
          <Wordmark />
          <div className="rules-2 max-w-xl md:rules-4">
            <h1 id="pitch" className="sheet-title">
              Practise the answer before the interview asks for it.
            </h1>
            <p className="rules-1 max-w-md text-graphite text-base leading-relaxed">
              Answer real placement questions out loud or typed. Get scored on structure, clarity,
              and pace, with the exact sentences to fix before your dream campus interview.
            </p>
          </div>

          <div className="rules-2 space-y-3 max-w-md">
            <div className="flex items-center gap-2.5 text-xs text-graphite">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
              <span><strong>STAR Framework:</strong> Scored on Structure, Relevance, Clarity & Depth</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-graphite">
              <Mic className="w-4 h-4 text-ink shrink-0" />
              <span><strong>Real-time Voice:</strong> Practice answering out loud with pacing meter</span>
            </div>
            <div className="flex items-center gap-2.5 text-xs text-graphite">
              <BookOpen className="w-4 h-4 text-ink shrink-0" />
              <span><strong>40 Real Questions:</strong> HR, Behavioural, Concurrency, SQL, Git & Aptitude</span>
            </div>
          </div>
        </div>

        <div className="py-6 text-xs text-pencil">
          Engineered for Indian campus placements & tech interviews.
        </div>
      </section>

      {/* Right side: Instant Access */}
      <main className="flex items-start px-6 py-12 md:items-center md:px-12 bg-paper-raised">
        <div className="w-full max-w-sm space-y-6">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink block mb-1">
              Placement Season 2026
            </span>
            <h2 className="font-display text-2xl font-bold text-graphite">Enter Workspace</h2>
            <p className="text-xs text-pencil mt-1">
              Start immediately with a realistic student candidate profile or enter your email.
            </p>
          </div>

          {/* Quick Demo Login (Recommended) */}
          <div className="p-4 rounded-[4px] border-2 border-ink/30 bg-blue-50/40 space-y-3">
            <div className="flex items-center gap-2 text-ink font-semibold text-xs">
              <UserCheck className="w-4 h-4 text-ink" />
              <span>Instant Placement Candidate Demo</span>
            </div>
            <p className="text-[11px] text-graphite leading-relaxed">
              Logs you in as <strong>Arjun Sharma</strong> (Final-Year Student, preparing for SDE-1 campus placement).
            </p>
            <button
              type="button"
              onClick={() => onSignIn({ name: 'Arjun Sharma', role: 'SDE-1 (Campus Placement)', level: 'student' })}
              className="btn btn-primary w-full text-xs py-2 h-10 gap-2"
            >
              <span>Continue as Arjun Sharma</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-rule w-full" />
            <span className="bg-paper-raised px-2 text-[11px] text-pencil uppercase font-semibold">
              Or your email
            </span>
          </div>

          {/* Email form */}
          {sent ? (
            <div className="p-4 rounded-[4px] bg-green-50 border border-green-200 text-xs text-green-900 space-y-1">
              <p className="font-semibold">Signing you in...</p>
              <p>Opening your ruled answer sheet.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label htmlFor="email-input" className="field-label text-xs">
                  College or Personal Email
                </label>
                <input
                  id="email-input"
                  type="email"
                  required
                  placeholder="name@college.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="field-input text-xs"
                />
              </div>
              <button type="submit" className="btn btn-quiet w-full text-xs py-2 h-9">
                Sign In With Email
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
