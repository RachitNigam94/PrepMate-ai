import React from 'react';
import { Wordmark } from './Wordmark.tsx';
import { BookOpen, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  currentTab: 'home' | 'practice';
  onNavigate: (tab: 'home' | 'practice') => void;
  onOpenQuestionBank?: () => void;
  onSignOut?: () => void;
  userName?: string;
  isDark: boolean;
  onToggleTheme: () => void;
}

export function Header({
  currentTab,
  onNavigate,
  onOpenQuestionBank,
  onSignOut,
  userName,
  isDark,
  onToggleTheme,
}: HeaderProps) {
  return (
    <header className="border-b border-rule bg-paper-raised/80 backdrop-blur-xs sticky top-0 z-30 transition-colors">
      <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
        <div onClick={() => onNavigate('home')} className="cursor-pointer">
          <Wordmark />
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {/* Light / Dark Mode Toggle */}
          <button
            type="button"
            onClick={onToggleTheme}
            className="btn btn-quiet text-xs py-1.5 px-2.5 h-8 flex items-center gap-1.5 transition-colors"
            title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle theme"
          >
            {isDark ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline font-semibold">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-slate-700" />
                <span className="hidden sm:inline font-semibold">Dark</span>
              </>
            )}
          </button>

          {/* Question Bank Modal Button */}
          {onOpenQuestionBank && (
            <button
              type="button"
              onClick={onOpenQuestionBank}
              className="btn btn-quiet text-xs py-1.5 px-2.5 h-8 flex items-center gap-1.5 transition-colors"
              title="Browse Question Bank"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Questions</span>
            </button>
          )}

          {/* Navigation Button */}
          <button
            type="button"
            onClick={() => onNavigate(currentTab === 'home' ? 'practice' : 'home')}
            className={`btn ${
              currentTab === 'home' ? 'btn-primary' : 'btn-quiet'
            } text-xs py-1.5 px-3 h-8`}
          >
            {currentTab === 'home' ? 'Start Practising' : 'Dashboard'}
          </button>

          {/* Sign Out */}
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
