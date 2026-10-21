import React from 'react';
import { Wordmark } from './Wordmark.tsx';
import { BookOpen, User, Sparkles, Download } from 'lucide-react';
import { Usage } from '../types.ts';

interface HeaderProps {
  currentTab: 'home' | 'practice';
  onNavigate: (tab: 'home' | 'practice') => void;
  onOpenQuestionBank?: () => void;
  onSignOut?: () => void;
  usage?: Usage | null;
  userName?: string;
}

export function Header({
  currentTab,
  onNavigate,
  onOpenQuestionBank,
  onSignOut,
  usage,
  userName,
}: HeaderProps) {
  return (
    <header className="border-b border-rule bg-paper-raised/70 backdrop-blur-xs sticky top-0 z-30">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div onClick={() => onNavigate('home')} className="cursor-pointer">
          <Wordmark />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {usage && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-[3px] bg-blue-50 border border-blue-200 text-xs font-medium text-ink">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>
                {usage.feedback_limit - usage.feedback_calls} feedback credits left
              </span>
            </div>
          )}

          <a
            href="/v1/download-code"
            download="prepmate-ai.tar.gz"
            className="btn btn-quiet text-xs py-1.5 px-2.5 h-8 flex items-center gap-1.5 text-graphite hover:text-ink"
            title="Download Full Project Archive (.tar.gz)"
          >
            <Download className="w-3.5 h-3.5 text-ink" />
            <span className="hidden sm:inline">Export Code</span>
          </a>

          {onOpenQuestionBank && (
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="btn btn-quiet text-xs py-1.5 px-2.5 h-8 flex items-center gap-1.5 text-graphite hover:text-ink"
              title="Browse Question Bank"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Questions</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate(currentTab === 'home' ? 'practice' : 'home')}
            className={`btn ${
              currentTab === 'home' ? 'btn-primary' : 'btn-quiet'
            } text-xs py-1.5 px-3 h-8`}
          >
            {currentTab === 'home' ? 'Start Practising' : 'Dashboard'}
          </button>

          {onSignOut && (
            <button
              type="button"
              onClick={onSignOut}
              className="text-xs text-pencil hover:text-graphite px-2 py-1 transition-colors"
            >
              Sign out
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
