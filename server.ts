import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { SEED_QUESTIONS, Question } from './src/data/questions.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PORT = 3000;
const isProduction = process.env.NODE_ENV === 'production';

// Initialize Gemini Client
const geminiApiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI(geminiApiKey ? { apiKey: geminiApiKey } : {});

// In-memory data store for sessions and candidate profile
interface Profile {
  display_name: string;
  target_role: string;
  experience_level: 'student' | 'fresher' | 'experienced';
  created_at: string;
}

interface UserMe {
  id: string;
  email: string;
  profile: Profile;
}

interface Improvement {
  issue: string;
  suggestion: string;
}

interface Answer {
  id: string;
  question_id: string;
  transcript: string;
  feedback_status: 'scored' | 'failed';
  scores: {
    structure: number;
    relevance: number;
    clarity: number;
    depth: number;
    overall: number;
  } | null;
  feedback: {
    overall: string;
    improvements: Improvement[];
  } | null;
  model: string | null;
  created_at: string;
}

interface Session {
  id: string;
  round_type: 'hr' | 'behavioural' | 'technical' | 'aptitude';
  status: 'in_progress' | 'completed';
  started_at: string;
  completed_at: string | null;
  answer_count: number;
  average_score: number | null;
  answers: Answer[];
}

let currentUser: UserMe = {
  id: 'cand-001',
  email: 'candidate@placement.prep',
  profile: {
    display_name: 'Arjun Sharma',
    target_role: 'Software Development Engineer (SDE-1)',
    experience_level: 'student',
    created_at: new Date(Date.now() - 7 * 86400000).toISOString(),
  },
};

const sessions: Session[] = [
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
  {
    id: 'demo-sess-2',
    round_type: 'hr',
    status: 'completed',
    started_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    completed_at: new Date(Date.now() - 2 * 86400000 + 600000).toISOString(),
    answer_count: 1,
    average_score: 7.5,
    answers: [],
  },
];

let dailyFeedbackCount = 3;

// Gemini evaluation prompt
const SYSTEM_PROMPT = `You are an expert interview coach for Indian placement interviews (campus and off-campus placements for top tech firms and IT services like Google, Microsoft, Amazon, TCS, Infosys, Wipro, and high-growth startups). The candidate has answered an interview question. Your job:

1. Score the answer on four dimensions, each 1-10 (integers only):
   - **structure**: Does it follow a clear format (STAR framework for behavioural/HR: Situation, Task, Action, Result; step-by-step for technical; systematic reasoning for aptitude)?
   - **relevance**: Does it actually address the exact question asked without wandering?
   - **clarity**: Is the language precise, concise, and free of filler words or vague claims?
   - **depth**: Does it show genuine engineering/domain understanding, concrete technical details, real metrics, or logical proofs?

2. Give a one-paragraph overall assessment (2-4 sentences) highlighting the candidate's core strength and main missed opportunity.

3. List 1-3 specific, actionable improvements. Each improvement MUST quote the exact weak phrase or gap from candidate's answer and suggest a concrete replacement or addition.

Respond ONLY with valid JSON matching this schema — no markdown fences, no preamble:
{
  "scores": {
    "structure": 7,
    "relevance": 8,
    "clarity": 7,
    "depth": 6
  },
  "overall": "Your answer demonstrates good foundational knowledge...",
  "improvements": [
    {
      "issue": "Weak explanation of trade-offs: 'it is faster'",
      "suggestion": "Quantify or explain mechanism: 'B-tree index reduces search complexity from O(N) to O(log N) at the expense of write overhead.'"
    }
  ]
}`;

function clampScore(val: any): number {
  const n = parseInt(String(val), 10);
  if (isNaN(n)) return 6;
  return Math.max(1, Math.min(10, n));
}

// Fallback evaluator when LLM is unavailable or for testing
function generateFallbackFeedback(question: Question, transcript: string) {
  const wordCount = transcript.trim().split(/\s+/).length;
  const isHRorBeh = question.round_type === 'hr' || question.round_type === 'behavioural';
  
  let structure = 6;
  let relevance = 7;
  let clarity = 6;
  let depth = 6;

  if (wordCount < 25) {
    structure = 4;
    depth = 4;
    clarity = 5;
  } else if (wordCount > 75) {
    depth = 7;
    structure = 7;
  }

  // Check STAR keywords
  const lower = transcript.toLowerCase();
  const hasSTAR = lower.includes('situation') || lower.includes('task') || lower.includes('action') || lower.includes('result') || lower.includes('project') || lower.includes('led');
  if (hasSTAR && isHRorBeh) {
    structure = Math.min(9, structure + 2);
    depth = Math.min(9, depth + 1);
  }

  const overall = `Solid answer covering the core prompt. ${
    wordCount < 40
      ? 'However, it felt somewhat brief for an interview setting — expand on your specific contribution and quantifiable results.'
      : 'Good structure and explanation. Ensure you crisply conclude with the measurable outcome or impact.'
  }`;

  const improvements: Improvement[] = [
    {
      issue: wordCount < 40 ? 'Answer lacked detailed context' : 'Could highlight more concrete metrics',
      suggestion: isHRorBeh
        ? 'Structure strictly with STAR: Situation (10%), Task (10%), Action (60%), Result (20% with metrics like % faster or bug reduction).'
        : `Include standard terminology from the reference answer (e.g. ${question.topic}).`,
    },
  ];

  const overallAvg = Number(((structure + relevance + clarity + depth) / 4).toFixed(1));
  return {
    scores: { structure, relevance, clarity, depth, overall: overallAvg },
    overall,
    improvements,
    model: 'gemini-fallback',
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '5mb' }));

  // API Routes (/v1 and /api/v1)
  const router = express.Router();

  // 1. Health check & Code Download
  router.get('/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', app: 'PrepMate AI', timestamp: new Date().toISOString() });
  });

  router.get('/download-code', (_req: Request, res: Response) => {
    const filePath = path.join(__dirname, 'public', 'prepmate-ai.tar.gz');
    res.download(filePath, 'prepmate-ai.tar.gz');
  });

  // 2. Profile Me endpoints
  router.get('/me', (_req: Request, res: Response) => {
    res.json(currentUser);
  });

  router.patch('/me', (req: Request, res: Response) => {
    const { display_name, target_role, experience_level } = req.body;
    if (display_name !== undefined) currentUser.profile.display_name = display_name;
    if (target_role !== undefined) currentUser.profile.target_role = target_role;
    if (experience_level !== undefined) currentUser.profile.experience_level = experience_level;
    res.json(currentUser);
  });

  // 3. Questions
  router.get('/questions', (req: Request, res: Response) => {
    const { round_type } = req.query;
    let list = SEED_QUESTIONS;
    if (round_type) {
      list = list.filter((q) => q.round_type === round_type);
    }
    res.json(list);
  });

  router.get('/questions/next', (req: Request, res: Response) => {
    const { round_type } = req.query;
    let candidates = SEED_QUESTIONS;
    if (round_type) {
      candidates = candidates.filter((q) => q.round_type === round_type);
    }

    if (candidates.length === 0) {
      return res.status(404).json({ error: `No questions found for round type ${round_type}` });
    }

    // Pick random question from candidate pool
    const selected = candidates[Math.floor(Math.random() * candidates.length)];
    res.json({
      id: selected.id,
      round_type: selected.round_type,
      topic: selected.topic,
      difficulty: selected.difficulty,
      prompt: selected.prompt,
      reference_answer: selected.reference_answer,
    });
  });

  // 4. Usage Quota
  router.get('/usage', (_req: Request, res: Response) => {
    res.json({
      feedback_calls: dailyFeedbackCount,
      feedback_limit: 50,
      audio_seconds: 140,
      audio_seconds_limit: 1800,
    });
  });

  // 5. Sessions
  router.get('/sessions', (_req: Request, res: Response) => {
    res.json(
      sessions.map((s) => ({
        id: s.id,
        round_type: s.round_type,
        status: s.status,
        started_at: s.started_at,
        completed_at: s.completed_at,
        answer_count: s.answer_count,
        average_score: s.average_score,
      }))
    );
  });

  router.post('/sessions', (req: Request, res: Response) => {
    const { round_type } = req.body;
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
    res.status(201).json(newSession);
  });

  // 6. Submit Answer and get STAR Feedback
  router.post('/sessions/:id/answers', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { question_id, transcript } = req.body;

    const session = sessions.find((s) => s.id === id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    if (!transcript || typeof transcript !== 'string' || !transcript.trim()) {
      return res.status(400).json({ error: 'Answer transcript cannot be empty' });
    }

    const question = SEED_QUESTIONS.find((q) => q.id === question_id) || {
      id: question_id,
      round_type: session.round_type,
      topic: 'Interview Practice',
      difficulty: 2 as const,
      prompt: 'Interview question prompt',
      reference_answer: '',
      source: 'placement',
    };

    let feedbackResult: any = null;

    if (geminiApiKey) {
      try {
        const userPromptText = `Round type: ${session.round_type}
Topic: ${question.topic}
Question prompt: ${question.prompt}
Reference Model Answer: ${question.reference_answer || 'N/A'}

Candidate's Answer:
"""
${transcript.trim()}
"""`;

        let responseText = '';
        let modelUsed = 'gemini-3.8-flash';

        // Check if GROQ_API_KEY is configured
        const groqApiKey = process.env.GROQ_API_KEY;
        if (groqApiKey) {
          try {
            const groqRes = await fetch('https://api.groq.com/openai/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${groqApiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                model: process.env.GROQ_MODEL || 'llama-3.3-70b-versatile',
                messages: [
                  { role: 'system', content: SYSTEM_PROMPT },
                  { role: 'user', content: userPromptText },
                ],
                temperature: 0.3,
                max_tokens: 1024,
                response_format: { type: 'json_object' },
              }),
            });
            if (groqRes.ok) {
              const groqData = await groqRes.json();
              responseText = groqData.choices?.[0]?.message?.content || '';
              modelUsed = 'groq/' + (process.env.GROQ_MODEL || 'llama-3.3-70b-versatile');
            }
          } catch (gErr: any) {
            console.warn('[PrepMate] Groq API call failed:', gErr.message);
          }
        }

        // Try Gemini models if Groq was not used
        if (!responseText && geminiApiKey) {
          const candidateModels = ['gemini-3.8-flash', 'gemini-3.1-flash-lite'];
          for (const m of candidateModels) {
            try {
              const response = await ai.models.generateContent({
                model: m,
                contents: userPromptText,
                config: {
                  systemInstruction: SYSTEM_PROMPT,
                  responseMimeType: 'application/json',
                  temperature: 0.3,
                },
              });
              if (response.text) {
                responseText = response.text;
                modelUsed = m;
                break;
              }
            } catch (mErr: any) {
              console.warn(`[PrepMate] ${m} error:`, mErr.message);
            }
          }
        }

        if (!responseText) {
          throw new Error('All configured LLM providers failed or high demand');
        }

        let cleaned = responseText.trim();
        if (cleaned.startsWith('```')) {
          cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
        }

        const parsed = JSON.parse(cleaned);
        const s = parsed.scores || {};
        const structure = clampScore(s.structure);
        const relevance = clampScore(s.relevance);
        const clarity = clampScore(s.clarity);
        const depth = clampScore(s.depth);
        const overall = Number(((structure + relevance + clarity + depth) / 4).toFixed(1));

        feedbackResult = {
          scores: { structure, relevance, clarity, depth, overall },
          overall: parsed.overall || 'Answer reviewed.',
          improvements: Array.isArray(parsed.improvements)
            ? parsed.improvements.slice(0, 3).map((imp: any) => ({
                issue: String(imp.issue || 'Opportunity for improvement'),
                suggestion: String(imp.suggestion || ''),
              }))
            : [],
          model: modelUsed,
        };
      } catch (err: any) {
        console.warn('[PrepMate] Gemini feedback API call failed, falling back:', err.message);
        feedbackResult = generateFallbackFeedback(question, transcript);
      }
    } else {
      feedbackResult = generateFallbackFeedback(question, transcript);
    }

    dailyFeedbackCount += 1;

    const answerRecord: Answer = {
      id: 'ans-' + Date.now(),
      question_id: question.id,
      transcript,
      feedback_status: 'scored',
      scores: feedbackResult.scores,
      feedback: {
        overall: feedbackResult.overall,
        improvements: feedbackResult.improvements,
      },
      model: feedbackResult.model,
      created_at: new Date().toISOString(),
    };

    session.answers.push(answerRecord);
    session.answer_count = session.answers.length;

    // Recalculate average score
    const scoredAnswers = session.answers.filter((a) => a.scores !== null);
    if (scoredAnswers.length > 0) {
      const sum = scoredAnswers.reduce((acc, a) => acc + (a.scores?.overall || 0), 0);
      session.average_score = Number((sum / scoredAnswers.length).toFixed(1));
    }

    res.json(answerRecord);
  });

  // 7. Complete Session
  router.post('/sessions/:id/complete', (req: Request, res: Response) => {
    const { id } = req.params;
    const session = sessions.find((s) => s.id === id);
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    session.status = 'completed';
    session.completed_at = new Date().toISOString();
    res.json(session);
  });

  // Mount router on /v1 and /api/v1
  app.use('/v1', router);
  app.use('/api/v1', router);
  app.use('/api', router);

  // In development, hook up Vite middleware
  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // In production, serve dist folder
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`PrepMate AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start PrepMate AI server:', err);
  process.exit(1);
});
