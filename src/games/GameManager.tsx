"use client";

import React, { useState, useEffect } from "react";
import { QuizQuestion, generateQuestions, formatQuestionsForGame } from "@/lib/api/questions";
import { GameConfig, GameCallbacks, GameStatus } from "./types";
import QuizRunnerGame from "./quiz-runner/QuizRunnerGame";

type GameType = "quiz-runner";

interface GameManagerProps {
  gameType: GameType;
  // Option 1: Provide questions directly
  questions?: QuizQuestion[];
  // Option 2: Generate questions from subtopic
  subtopic?: {
    title: string;
    description: string;
    key_concepts: string[];
    quiz?: QuizQuestion[];
  };
  // Option 3: Generate new questions
  generateQuestions?: {
    title: string;
    description: string;
    key_concepts: string[];
    num_questions?: number;
    focus_on_weak_areas?: boolean;
  };
  config?: GameConfig;
  callbacks?: GameCallbacks;
}

export default function GameManager({
  gameType,
  questions: providedQuestions,
  subtopic,
  generateQuestions: generateConfig,
  config,
  callbacks,
}: GameManagerProps) {
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [status, setStatus] = useState<GameStatus>("idle");
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Load questions based on provided source
  useEffect(() => {
    loadQuestions();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- loadQuestions is stable; deps are source inputs
  }, [providedQuestions, subtopic, generateConfig]);

  const loadQuestions = async () => {
    try {
      setStatus("loading");
      setError(null);

      // Priority 1: Use provided questions
      if (providedQuestions && providedQuestions.length > 0) {
        setQuestions(formatQuestionsForGame(providedQuestions));
        setStatus("ready");
        return;
      }

      // Priority 2: Use subtopic's existing quiz
      if (subtopic?.quiz && subtopic.quiz.length > 0) {
        setQuestions(formatQuestionsForGame(subtopic.quiz));
        setStatus("ready");
        return;
      }

      // Priority 3: Generate new questions
      if (generateConfig || subtopic) {
        setIsGenerating(true);
        const request = generateConfig || {
          title: subtopic!.title,
          description: subtopic!.description,
          key_concepts: subtopic!.key_concepts,
          num_questions: 5,
        };

        const generatedQuestions = await generateQuestions(request);
        setQuestions(formatQuestionsForGame(generatedQuestions));
        setStatus("ready");
        setIsGenerating(false);
        return;
      }

      // No questions available
      setError("No questions available. Please provide questions or subtopic information.");
      setStatus("error");
    } catch (err) {
      console.error("Error loading questions:", err);
      setError(err instanceof Error ? err.message : "Failed to load questions");
      setStatus("error");
      setIsGenerating(false);
    }
  };

  const handleGameStart = () => {
    setStatus("playing");
    callbacks?.onGameStart?.();
  };

  const handleGameComplete = (score: number, totalQuestions: number) => {
    setStatus("completed");
    callbacks?.onGameComplete?.(score, totalQuestions);
  };

  const handleGameError = (errorMsg: string) => {
    setStatus("error");
    setError(errorMsg);
    callbacks?.onGameError?.(errorMsg);
  };

  // Render game based on type
  const renderGame = () => {
    switch (gameType) {
      case "quiz-runner":
        return (
          <QuizRunnerGame
            questions={questions}
            config={config}
            callbacks={{
              ...callbacks,
              onGameStart: handleGameStart,
              onGameComplete: handleGameComplete,
              onGameError: handleGameError,
            }}
          />
        );
      default:
        return (
          <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">Unknown game type: {gameType}</p>
          </div>
        );
    }
  };

  if (status === "loading" || isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
        <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
        <p className="text-gray-600 font-medium">
          {isGenerating ? "Generating questions..." : "Loading game..."}
        </p>
      </div>
    );
  }

  if (status === "error" && error) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-800 font-semibold">Error:</p>
        <p className="text-red-600 mt-2">{error}</p>
        <button
          onClick={loadQuestions}
          className="mt-4 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
        >
          Retry
        </button>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No questions available.</p>
      </div>
    );
  }

  return renderGame();
}


