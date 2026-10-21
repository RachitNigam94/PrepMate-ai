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
  // Current user / profile
  async me(): Promise<UserMe> {
    return request<UserMe>('/me');
  },

  async updateMe(changes: {
    display_name?: string;
    target_role?: string;
    experience_level?: ExperienceLevel;
  }): Promise<UserMe> {
    return request<UserMe>('/me', {
      method: 'PATCH',
      body: JSON.stringify(changes),
    });
  },

  // Questions
  async nextQuestion(roundType?: RoundType): Promise<Question> {
    const q = roundType ? `?round_type=${encodeURIComponent(roundType)}` : '';
    return request<Question>(`/questions/next${q}`);
  },

  async listQuestions(roundType?: RoundType): Promise<Question[]> {
    const q = roundType ? `?round_type=${encodeURIComponent(roundType)}` : '';
    return request<Question[]>(`/questions${q}`);
  },

  // Sessions
  async listSessions(): Promise<Session[]> {
    return request<Session[]>('/sessions');
  },

  async createSession(round_type: RoundType): Promise<Session> {
    return request<Session>('/sessions', {
      method: 'POST',
      body: JSON.stringify({ round_type }),
    });
  },

  async submitAnswer(sessionId: string, questionId: string, transcript: string): Promise<Answer> {
    return request<Answer>(`/sessions/${sessionId}/answers`, {
      method: 'POST',
      body: JSON.stringify({
        question_id: questionId,
        transcript,
      }),
    });
  },

  async completeSession(sessionId: string): Promise<Session> {
    return request<Session>(`/sessions/${sessionId}/complete`, {
      method: 'POST',
    });
  },

  // Daily Usage
  async usage(): Promise<Usage> {
    return request<Usage>('/usage');
  },
};
