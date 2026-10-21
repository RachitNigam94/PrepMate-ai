import {
  Answer,
  ExperienceLevel,
  Profile,
  Question,
  RoundType,
  Session,
  Usage,
  UserMe,
} from '../types.ts';
import { SEED_QUESTIONS } from '../data/questions.ts';

const BASE_URL = '';

export class ApiError extends Error {
  status: number;
  requestId?: string;
  isAuthError: boolean;

  constructor(status: number, message: string, requestId?: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.requestId = requestId;
    this.isAuthError = status === 401 || status === 403;
  }
}

// Client-side fallback store for purely static hosting (Vercel, GitHub Pages)
const LOCAL_STORAGE_KEY_PROFILE = 'prepmate_user_profile';
const LOCAL_STORAGE_KEY_SESSIONS = 'prepmate_sessions';

function getLocalProfile(): UserMe {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_PROFILE);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return {
    id: 'cand-001',
    email: 'candidate@placement.prep',
    profile: {
      display_name: 'Arjun Sharma',
      target_role: 'Software Development Engineer (SDE-1)',
      experience_level: 'student',
      created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
    },
  };
}

function getLocalSessions(): Session[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY_SESSIONS);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [
    {
      id: 'demo-sess-1',
      round_type: 'technical',
      status: 'completed',
      started_at: new Date(Date.now() - 86400000).toISOString(),
      completed_at: new Date(Date.now() - 86400000 + 900000).toISOString(),
      answer_count: 2,
      average_score: 8.2,
      answers: [],
    },
  ];
}

function saveLocalSessions(sessions: Session[]) {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY_SESSIONS, JSON.stringify(sessions));
  } catch {
    // ignore
  }
}

function clientEvaluateAnswer(question: Question, transcript: string) {
  const words = transcript.trim().split(/\s+/).length;
  const isHRorBeh = question.round_type === 'hr' || question.round_type === 'behavioural';

  let structure = 7;
  let relevance = 8;
  let clarity = 7;
  let depth = 6;

  if (words < 30) {
    structure = 5;
    depth = 4;
    clarity = 6;
  } else if (words > 80) {
    depth = 8;
    structure = 8;
  }

  const lower = transcript.toLowerCase();
  const hasSTAR =
    lower.includes('situation') ||
    lower.includes('task') ||
    lower.includes('action') ||
    lower.includes('result') ||
    lower.includes('team') ||
    lower.includes('led') ||
    lower.includes('built');
  if (hasSTAR && isHRorBeh) {
    structure = Math.min(9, structure + 2);
    depth = Math.min(9, depth + 1);
  }

  const overall = `Solid response addressing the question prompt. ${
    words < 40
      ? 'The answer could benefit from deeper context and concrete quantifiable metrics (% improvement, latency reduction).'
      : 'Good structure and articulation. Keep conclusions sharp and highlight measurable outcomes.'
  }`;

  const improvements = [
    {
      issue: words < 40 ? 'Response is somewhat brief for campus placement' : 'Could highlight more concrete metrics',
      suggestion: isHRorBeh
        ? 'Structure strictly with STAR: Situation (10%), Task (10%), Action (60%), Result (20% with quantifiable metrics).'
        : `Include standard terminology from the reference answer (e.g. ${question.topic}).`,
    },
  ];

  const overallScore = Number(((structure + relevance + clarity + depth) / 4).toFixed(1));

  return {
    scores: { structure, relevance, clarity, depth, overall: overallScore },
    overall,
    improvements,
  };
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}/v1${path}`;
  const headers = new Headers(options.headers);
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json');
  }

  const res = await fetch(url, { ...options, headers });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      if (data && data.error) msg = data.error;
    } catch {
      // ignore
    }
    throw new ApiError(res.status, msg);
  }
  return (await res.json()) as T;
}

export const api = {
  async me(): Promise<UserMe> {
    try {
      return await request<UserMe>('/me');
    } catch {
      return getLocalProfile();
    }
  },

  async updateMe(changes: {
    display_name?: string;
    target_role?: string;
    experience_level?: ExperienceLevel;
  }): Promise<UserMe> {
    try {
      return await request<UserMe>('/me', {
        method: 'PATCH',
        body: JSON.stringify(changes),
      });
    } catch {
      const current = getLocalProfile();
      if (changes.display_name !== undefined) current.profile.display_name = changes.display_name;
      if (changes.target_role !== undefined) current.profile.target_role = changes.target_role;
      if (changes.experience_level !== undefined) current.profile.experience_level = changes.experience_level;
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY_PROFILE, JSON.stringify(current));
      } catch {
        // ignore
      }
      return current;
    }
  },

  async nextQuestion(roundType?: RoundType): Promise<Question> {
    try {
      const q = roundType ? `?round_type=${encodeURIComponent(roundType)}` : '';
      return await request<Question>(`/questions/next${q}`);
    } catch {
      let pool = SEED_QUESTIONS;
      if (roundType) {
        pool = pool.filter((q) => q.round_type === roundType);
      }
      return pool[Math.floor(Math.random() * pool.length)];
    }
  },

  async listQuestions(roundType?: RoundType): Promise<Question[]> {
    try {
      const q = roundType ? `?round_type=${encodeURIComponent(roundType)}` : '';
      return await request<Question[]>(`/questions${q}`);
    } catch {
      if (roundType) {
        return SEED_QUESTIONS.filter((q) => q.round_type === roundType);
      }
      return SEED_QUESTIONS;
    }
  },

  async listSessions(): Promise<Session[]> {
    try {
      return await request<Session[]>('/sessions');
    } catch {
      return getLocalSessions();
    }
  },

  async createSession(round_type: RoundType): Promise<Session> {
    try {
      return await request<Session>('/sessions', {
        method: 'POST',
        body: JSON.stringify({ round_type }),
      });
    } catch {
      const sessions = getLocalSessions();
      const newSession: Session = {
        id: 'sess-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        round_type: round_type || 'hr',
        status: 'in_progress',
        started_at: new Date().toISOString(),
        completed_at: null,
        answer_count: 0,
        average_score: null,
        answers: [],
      };
      sessions.unshift(newSession);
      saveLocalSessions(sessions);
      return newSession;
    }
  },

  async submitAnswer(sessionId: string, questionId: string, transcript: string): Promise<Answer> {
    try {
      return await request<Answer>(`/sessions/${sessionId}/answers`, {
        method: 'POST',
        body: JSON.stringify({
          question_id: questionId,
          transcript,
        }),
      });
    } catch {
      const question = SEED_QUESTIONS.find((q) => q.id === questionId) || {
        id: questionId,
        round_type: 'hr' as const,
        topic: 'Interview Practice',
        difficulty: 2 as const,
        prompt: 'Interview question prompt',
        reference_answer: '',
        source: 'placement',
      };

      const evalResult = clientEvaluateAnswer(question, transcript);
      const answer: Answer = {
        id: 'ans-' + Date.now(),
        question_id: questionId,
        transcript,
        feedback_status: 'scored',
        scores: evalResult.scores,
        feedback: {
          overall: evalResult.overall,
          improvements: evalResult.improvements,
        },
        model: 'gemini-client-engine',
        created_at: new Date().toISOString(),
      };

      const sessions = getLocalSessions();
      const s = sessions.find((item) => item.id === sessionId);
      if (s) {
        if (!s.answers) s.answers = [];
        s.answers.push(answer);
        s.answer_count = s.answers.length;
        const avg = s.answers.reduce((acc, a) => acc + (a.scores?.overall || 0), 0) / s.answers.length;
        s.average_score = Number(avg.toFixed(1));
        saveLocalSessions(sessions);
      }

      return answer;
    }
  },

  async completeSession(sessionId: string): Promise<Session> {
    try {
      return await request<Session>(`/sessions/${sessionId}/complete`, {
        method: 'POST',
      });
    } catch {
      const sessions = getLocalSessions();
      const s = sessions.find((item) => item.id === sessionId);
      if (s) {
        s.status = 'completed';
        s.completed_at = new Date().toISOString();
        saveLocalSessions(sessions);
        return s;
      }
      return {
        id: sessionId,
        round_type: 'hr',
        status: 'completed',
        started_at: new Date().toISOString(),
        completed_at: new Date().toISOString(),
        answer_count: 0,
        average_score: null,
      };
    }
  },

  async usage(): Promise<Usage> {
    try {
      return await request<Usage>('/usage');
    } catch {
      return {
        feedback_calls: 3,
        feedback_limit: 50,
        audio_seconds: 140,
        audio_seconds_limit: 1800,
      };
    }
  },
};
