import React, { useState, useEffect } from 'react';
import { X, BookOpen, Search, CheckCircle, ChevronRight } from 'lucide-react';
import { Question, RoundType } from '../types.ts';
import { api } from '../lib/api.ts';

interface QuestionBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectQuestion?: (q: Question) => void;
}

const ROUND_TABS: { key: RoundType | 'all'; label: string }[] = [
  { key: 'all', label: 'All Questions' },
  { key: 'hr', label: 'HR' },
  { key: 'behavioural', label: 'Behavioural' },
  { key: 'technical', label: 'Technical' },
  { key: 'aptitude', label: 'Aptitude' },
];

export function QuestionBankModal({ isOpen, onClose, onSelectQuestion }: QuestionBankModalProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [activeTab, setActiveTab] = useState<RoundType | 'all'>('all');
  const [search, setSearch] = useState('');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api
        .listQuestions()
        .then((data) => setQuestions(data))
        .catch((err) => console.error(err))
        .finally(() => setLoading(false));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = questions.filter((q) => {
    const matchesTab = activeTab === 'all' || q.round_type === activeTab;
    const matchesTopic = selectedTopic === 'all' || q.topic === selectedTopic;
    const matchesSearch =
      search === '' ||
      q.prompt.toLowerCase().includes(search.toLowerCase()) ||
      q.topic.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesTopic && matchesSearch;
  });

  const topics = Array.from(new Set(questions.filter((q) => activeTab === 'all' || q.round_type === activeTab).map((q) => q.topic)));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-lg bg-paper-raised border border-rule shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-rule px-6 py-4 bg-paper">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-ink" />
            <h2 className="font-display text-xl font-semibold text-ink">
              Placement Question Bank <span className="text-sm font-sans font-normal text-pencil">({questions.length} questions)</span>
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded hover:bg-gray-200 text-pencil hover:text-graphite transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-rule bg-paper space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {ROUND_TABS.map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => {
                  setActiveTab(tab.key);
                  setSelectedTopic('all');
                }}
                className={`px-3 py-1 text-xs font-semibold rounded-[3px] transition-colors ${
                  activeTab === tab.key
                    ? 'bg-ink text-paper'
                    : 'bg-paper-raised border border-rule text-graphite hover:border-ink'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-pencil" />
              <input
                type="text"
                placeholder="Search question prompts or topics..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded border border-rule bg-paper-raised text-graphite placeholder:text-pencil focus:outline-hidden focus:border-ink"
              />
            </div>

            {topics.length > 1 && (
              <select
                value={selectedTopic}
                onChange={(e) => setSelectedTopic(e.target.value)}
                className="px-2 py-1.5 text-xs rounded border border-rule bg-paper-raised text-graphite"
              >
                <option value="all">All Topics</option>
                {topics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Questions list */}
        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {loading ? (
            <p className="text-center py-8 text-pencil text-sm">Loading questions...</p>
          ) : filtered.length === 0 ? (
            <p className="text-center py-8 text-pencil text-sm">No questions found matching your filter.</p>
          ) : (
            filtered.map((q) => (
              <div
                key={q.id}
                className="p-4 rounded border border-rule bg-paper hover:border-ink/60 transition-colors group cursor-pointer"
                onClick={() => {
                  if (onSelectQuestion) {
                    onSelectQuestion(q);
                    onClose();
                  }
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="uppercase text-[10px] font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-100 text-ink">
                    {q.round_type}
                  </span>
                  <span className="text-xs text-pencil">{q.topic}</span>
                  <span className="text-xs text-pencil">·</span>
                  <span className="text-xs font-mono text-pencil">
                    Difficulty {q.difficulty === 1 ? '⭐ Easy' : q.difficulty === 2 ? '⭐⭐ Medium' : '⭐⭐⭐ Hard'}
                  </span>
                </div>
                <p className="font-medium text-graphite text-sm group-hover:text-ink transition-colors leading-relaxed">
                  {q.prompt}
                </p>
                {q.reference_answer && (
                  <div className="mt-2 text-xs text-pencil line-clamp-2 italic bg-paper-raised p-2 rounded border border-rule/50">
                    Model guidance: {q.reference_answer.slice(0, 160)}...
                  </div>
                )}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-rule bg-paper flex items-center justify-between text-xs text-pencil">
          <span>{filtered.length} questions available</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 rounded border border-rule text-graphite hover:bg-gray-100"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
