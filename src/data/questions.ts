export interface Question {
  id: string;
  round_type: "hr" | "behavioural" | "technical" | "aptitude";
  topic: string;
  difficulty: 1 | 2 | 3;
  prompt: string;
  reference_answer: string;
  source: string;
}

import questionsData from "./questions.json";

export const SEED_QUESTIONS: Question[] = questionsData as Question[];
