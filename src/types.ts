export type RoundType = 'hr' | 'behavioural' | 'technical' | 'aptitude';
export type ExperienceLevel = 'student' | 'fresher' | 'experienced';

export interface Profile {
  display_name: string;
  target_role: string;
  experience_level: ExperienceLevel;
  created_at: string;
}

export interface UserMe {
  id: string;
  email: string;
  profile: Profile;
}

export interface Question {
  id: string;
  round_type: RoundType;
  topic: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  reference_answer?: string;
  source?: string;
}

export interface Improvement {
  issue: string;
  suggestion: string;
}

export interface Scores {
  structure: number;
  relevance: number;
  clarity: number;
  depth: number;
  overall: number;
}

export interface Answer {
  id: string;
  question_id: string;
  transcript: string;
  feedback_status: 'scored' | 'failed';
  scores: Scores | null;
  feedback: {
    overall: string;
    improvements: Improvement[];
  } | null;
  model: string | null;
  created_at: string;
}

export interface Session {
  id: string;
  round_type: RoundType;
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  answer_count: number;
  average_score: number | null;
  answers?: Answer[];
}

export interface Usage {
  feedback_calls: number;
  feedback_limit: number;
  audio_seconds: number;
  audio_seconds_limit: number;
}
