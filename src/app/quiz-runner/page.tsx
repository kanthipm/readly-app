"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import GameManager from "@/games/GameManager";
import { QuizQuestion } from "@/lib/api/questions";
import { GameConfig } from "@/games/types";

function QuizRunnerContent() {
  const searchParams = useSearchParams();
  const [score, setScore] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [gameKey, setGameKey] = useState(0); // For forcing remount

  // Get subtopic info from URL params (if coming from quiz page)
  const subtopicTitle = searchParams?.get("subtopic");
  const subtopicDescription = searchParams?.get("description");
  const keyConceptsParam = searchParams?.get("key_concepts");

  // Parse key concepts from URL
  const keyConcepts = keyConceptsParam ? keyConceptsParam.split(",") : [];

  // Sample questions for demo (when no subtopic provided)
  const sampleQuestions: QuizQuestion[] = [
    {
      question: "What is the capital of France?",
      options: ["London", "Berlin", "Paris", "Madrid"],
      answer: "Paris",
      explanation: "Paris is the capital and largest city of France.",
    },
    {
      question: "What is 2 + 2?",
      options: ["3", "4", "5", "6"],
      answer: "4",
      explanation: "2 + 2 equals 4.",
    },
    {
      question: "Which planet is known as the Red Planet?",
      options: ["Venus", "Mars", "Jupiter", "Saturn"],
      answer: "Mars",
      explanation: "Mars is called the Red Planet due to iron oxide on its surface.",
    },
    {
      question: "What is the largest ocean on Earth?",
      options: ["Atlantic Ocean", "Indian Ocean", "Arctic Ocean", "Pacific Ocean"],
      answer: "Pacific Ocean",
      explanation: "The Pacific Ocean is the largest and deepest ocean on Earth.",
    },
    {
      question: "Who wrote 'Romeo and Juliet'?",
      options: ["Charles Dickens", "William Shakespeare", "Jane Austen", "Mark Twain"],
      answer: "William Shakespeare",
      explanation: "William Shakespeare wrote the famous play 'Romeo and Juliet'.",
    },
  ];

  const gameConfig: GameConfig = {
    width: "960px",
    height: "600px",
    timePerQuestion: 30,
    pointsPerCorrect: 10,
  };

  const handleQuestionAnswered = (isCorrect: boolean, questionIndex: number) => {
    console.log(`Question ${questionIndex + 1}: ${isCorrect ? "Correct" : "Wrong"}`);
  };

  const handleGameComplete = (finalScore: number, totalQuestions: number) => {
    setScore(finalScore);
    setGameComplete(true);
    console.log(`Game Complete! Score: ${finalScore}/${totalQuestions * 10}`);
  };

  const handleRestart = () => {
    setScore(null);
    setGameComplete(false);
    // Force component remount
    setGameKey((prev) => prev + 1);
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Quiz Runner
            </h1>
            <p className="text-gray-600 text-lg">
              Answer questions correctly to progress through the game!
            </p>
          </div>

          {gameComplete && score !== null && (
            <div className="mb-6 p-6 bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg shadow-lg">
              <h2 className="text-2xl font-bold text-green-800 mb-2">🎉 Game Complete!</h2>
              <p className="text-green-700 text-lg">
                Final Score: <span className="font-bold">{score}</span> / {sampleQuestions.length * 10}
              </p>
              <button
                onClick={handleRestart}
                className="mt-4 bg-green-600 text-white px-6 py-3 rounded-lg font-semibold hover:bg-green-700 transition shadow-md"
              >
                Play Again
              </button>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-xl p-6">
            <GameManager
              key={gameKey}
              gameType="quiz-runner"
              // Use subtopic if provided, otherwise use sample questions
              {...(subtopicTitle && subtopicDescription
                ? {
                    generateQuestions: {
                      title: subtopicTitle,
                      description: subtopicDescription,
                      key_concepts: keyConcepts,
                      num_questions: 5,
                    },
                  }
                : {
                    questions: sampleQuestions,
                  })}
              config={gameConfig}
              callbacks={{
                onQuestionAnswered: handleQuestionAnswered,
                onGameComplete: handleGameComplete,
              }}
            />
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-3 text-blue-900">How to Play</h2>
            <ul className="list-disc list-inside space-y-2 text-blue-800">
              <li>Answer the questions that appear in the game</li>
              <li>You have 30 seconds per question</li>
              <li>Correct answers earn you points</li>
              <li>Read the explanations to learn more</li>
              <li>Complete all questions to see your final score!</li>
            </ul>
          </div>

          {subtopicTitle ? (
            <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-green-900">Playing with Subtopic</h2>
              <p className="text-green-800">
                Questions are being generated from: <strong>{subtopicTitle}</strong>
              </p>
            </div>
          ) : (
            <div className="mt-6 p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h2 className="text-xl font-semibold mb-2 text-yellow-900">Demo Mode</h2>
              <p className="text-yellow-800">
                This is a demo with sample questions. To use real questions, navigate here from the quiz page with a subtopic selected.
              </p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

export default function QuizRunnerPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    }>
      <QuizRunnerContent />
    </Suspense>
  );
}

