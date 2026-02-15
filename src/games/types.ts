/**
 * Shared types for game modules
 */

import { QuizQuestion } from "@/lib/api/questions";

export type GameConfig = {
  width?: string;
  height?: string;
  timePerQuestion?: number;
  pointsPerCorrect?: number;
};

export type GameCallbacks = {
  onQuestionAnswered?: (isCorrect: boolean, questionIndex: number) => void;
  onGameComplete?: (score: number, totalQuestions: number) => void;
  onGameStart?: () => void;
  onGameError?: (error: string) => void;
};

export type GameProps = {
  questions: QuizQuestion[];
  config?: GameConfig;
  callbacks?: GameCallbacks;
};

export type GameStatus = "idle" | "loading" | "ready" | "playing" | "completed" | "error";

export type GameScore = {
  current: number;
  total: number;
  correct: number;
  wrong: number;
};


