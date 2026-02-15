/**
 * API service for fetching and managing quiz questions
 */

import { apiUrl } from "../api";

export type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  id?: string;
  timesAsked?: number;
  timesCorrect?: number;
  timesWrong?: number;
  lastAsked?: string;
};

export type QuestionGenerationRequest = {
  title: string;
  description: string;
  key_concepts: string[];
  num_questions?: number;
  focus_on_weak_areas?: boolean;
};

export type QuestionResponse = {
  questions: QuizQuestion[];
};

/**
 * Generate additional quiz questions for a specific subtopic
 */
export async function generateQuestions(
  request: QuestionGenerationRequest
): Promise<QuizQuestion[]> {
  try {
    const response = await fetch(`${apiUrl}/api/v1/generate-questions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: request.title,
        description: request.description,
        key_concepts: request.key_concepts,
        num_questions: request.num_questions || 3,
        focus_on_weak_areas: request.focus_on_weak_areas || false,
      }),
    });

    // Check if response is actually JSON (not HTML error page)
    const contentType = response.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      const text = await response.text();
      console.error("Non-JSON response received:", text.substring(0, 200));
      throw new Error(`API returned non-JSON response. Status: ${response.status}. Check if backend is running at ${apiUrl}`);
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: "Failed to generate questions" }));
      throw new Error(error.detail || `HTTP error! status: ${response.status}`);
    }

    const data: QuestionResponse = await response.json();
    return data.questions;
  } catch (error) {
    console.error("Error generating questions:", error);
    throw error;
  }
}

/**
 * Get questions from a subtopic's existing quiz
 */
export function getQuestionsFromSubtopic(subtopic: {
  quiz?: QuizQuestion[];
}): QuizQuestion[] {
  return subtopic.quiz || [];
}

/**
 * Format questions for Unity game (ensures all required fields)
 */
export function formatQuestionsForGame(questions: QuizQuestion[]): QuizQuestion[] {
  return questions.map((q) => ({
    question: q.question,
    options: q.options || [],
    answer: q.answer,
    explanation: q.explanation || "No explanation available",
    id: q.id,
  }));
}

