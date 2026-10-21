import React, { useState, useEffect } from 'react';
import { UserMe, Session, RoundType, Usage, Question } from './types.ts';
import { api } from './lib/api.ts';
import { Header } from './components/Header.tsx';
import { PageStatus } from './components/PageStatus.tsx';
import { Home } from './pages/Home.tsx';
import { Practice } from './pages/Practice.tsx';
import { SignIn } from './pages/SignIn.tsx';
import { QuestionBankModal } from './components/QuestionBankModal.tsx';

export default function App() {
  const [user, setUser] = useState<UserMe | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<'home' | 'practice'>('home');
  const [selectedRound, setSelectedRound] = useState<RoundType>('hr');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [isQuestionBankOpen, setIsQuestionBankOpen] = useState(false);

  useEffect(() => {
    // Check if user session exists or initialize
    loadAppData();
  }, []);

  async function loadAppData() {
    setLoading(true);
    try {
      const [meData, sessionsData, usageData] = await Promise.all([
        api.me().catch(() => null),
        api.listSessions().catch(() => []),
        api.usage().catch(() => null),
      ]);

      if (meData) {
        setUser(meData);
      }
      setSessions(sessionsData);
      setUsage(usageData);
    } catch (err) {
      console.warn('App initialization warning:', err);
    } finally {
      setLoading(false);
    }
  }

  async function refreshMe() {
    try {
      const updated = await api.me();
      setUser(updated);
    } catch (err) {
      console.error(err);
    }
  }

  async function refreshUsage() {
    try {
      const [usageData, sessionsData] = await Promise.all([
        api.usage(),
        api.listSessions(),
      ]);
      setUsage(usageData);
      setSessions(sessionsData);
    } catch (err) {
      console.error(err);
    }
  }

  function handleStartRound(roundType: RoundType) {
    setSelectedRound(roundType);
    setCurrentTab('practice');
  }

  function handleSignIn(demoUser?: { name: string; role: string; level: 'student' | 'fresher' | 'experienced' }) {
    if (demoUser) {
      api.updateMe({
        display_name: demoUser.name,
        target_role: demoUser.role,
        experience_level: demoUser.level,
      }).then((updated) => {
        setUser(updated);
      }).catch(() => {
        // Fallback local user
        setUser({
          id: 'user-cand',
          email: `${demoUser.name.toLowerCase().replace(/\s+/g, '')}@placement.edu`,
          profile: {
            display_name: demoUser.name,
            target_role: demoUser.role,
            experience_level: demoUser.level,
            created_at: new Date().toISOString(),
          },
        });
      });
    } else {
      loadAppData();
    }
  }

  function handleSignOut() {
    setUser(null);
  }

  if (loading) {
    return <PageStatus title="Opening your ruled answer sheet..." />;
  }

  if (!user) {
    return <SignIn onSignIn={handleSignIn} />;
  }

  return (
    <div className="min-h-dvh flex flex-col bg-paper text-graphite antialiased">
      {/* Top Header */}
      <Header
        currentTab={currentTab}
        onNavigate={(tab) => setCurrentTab(tab)}
        onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
        onSignOut={handleSignOut}
        usage={usage}
        userName={user.profile.display_name}
      />

      {/* Main Content Area */}
      <div className="flex-1">
        {currentTab === 'home' ? (
          <Home
            me={user}
            sessions={sessions}
            usage={usage}
            onStartRound={handleStartRound}
            onRefreshMe={refreshMe}
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
          />
        ) : (
          <Practice
            initialRoundType={selectedRound}
            onFinish={() => {
              setCurrentTab('home');
              refreshUsage();
            }}
            onOpenQuestionBank={() => setIsQuestionBankOpen(true)}
            usage={usage}
            onRefreshUsage={refreshUsage}
          />
        )}
      </div>

      {/* Question Bank Modal */}
      <QuestionBankModal
        isOpen={isQuestionBankOpen}
        onClose={() => setIsQuestionBankOpen(false)}
        onSelectQuestion={(q: Question) => {
          setSelectedRound(q.round_type);
          setCurrentTab('practice');
        }}
      />
    </div>
  );
}
