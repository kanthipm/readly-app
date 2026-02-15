"use client";

import React, { useEffect, useState, useRef } from "react";
import UnityGame from "@/components/UnityGame";
import { QuizQuestion } from "@/lib/api/questions";
import { GameConfig, GameCallbacks } from "../types";

interface QuizRunnerGameProps {
  questions: QuizQuestion[];
  config?: GameConfig;
  callbacks?: GameCallbacks;
}

export default function QuizRunnerGame({
  questions,
  config = {},
  callbacks = {},
}: QuizRunnerGameProps) {
  const [gameLoaded, setGameLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unityContextRef = useRef<{ sendMessage: (gameObject: string, method: string, value?: string) => void } | null>(null);
  const questionsSentRef = useRef(false);

  const {
    width = "960px",
    height = "600px",
  } = config;

  const {
    onQuestionAnswered,
    onGameComplete,
    onGameStart,
    onGameError,
  } = callbacks;

  type UnityWindow = Window & {
    RegisterUnityInstance?: (instanceName: string) => void;
    OnQuestionAnswered?: (isCorrect: boolean, questionIndex: number) => void;
    OnGameComplete?: (score: number, totalQuestions: number) => void;
  };

  // Register global functions for Unity to call
  useEffect(() => {
    const win = window as UnityWindow;
    // Function called when Unity is ready
    win.RegisterUnityInstance = (instanceName: string) => {
      console.log("Unity instance registered:", instanceName);
    };

    // Function called when a question is answered
    win.OnQuestionAnswered = (isCorrect: boolean, questionIndex: number) => {
      console.log(`Question ${questionIndex} answered: ${isCorrect ? "Correct" : "Wrong"}`);
      if (onQuestionAnswered) {
        onQuestionAnswered(isCorrect, questionIndex);
      }
    };

    // Function called when game is complete
    win.OnGameComplete = (score: number, totalQuestions: number) => {
      console.log(`Game complete! Score: ${score}/${totalQuestions}`);
      if (onGameComplete) {
        onGameComplete(score, totalQuestions);
      }
    };

    // Cleanup
    return () => {
      delete win.RegisterUnityInstance;
      delete win.OnQuestionAnswered;
      delete win.OnGameComplete;
    };
  }, [onQuestionAnswered, onGameComplete]);

  // Send questions to Unity when game is loaded
  useEffect(() => {
    if (gameLoaded && questions.length > 0 && !questionsSentRef.current && unityContextRef.current) {
      sendQuestionsToUnity();
      questionsSentRef.current = true;
      if (onGameStart) {
        onGameStart();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- send once when loaded; ref guards re-send
  }, [gameLoaded, questions, onGameStart]);

  const sendQuestionsToUnity = () => {
    try {
      // Format questions for Unity (Unity expects a specific JSON structure)
      const questionsForUnity = {
        questions: questions.map((q) => ({
          question: q.question,
          options: q.options,
          answer: q.answer,
          explanation: q.explanation || "No explanation available",
        })),
      };

      const questionsJson = JSON.stringify(questionsForUnity);
      console.log("Sending questions to Unity:", questionsJson);

      // Send to Unity using sendMessage
      if (unityContextRef.current?.sendMessage) {
        unityContextRef.current.sendMessage(
          "QuizGameManager", // GameObject name
          "LoadQuestions", // Method name
          questionsJson // Parameter
        );
        console.log("Questions sent successfully to Unity");
      } else {
        // Retry after a short delay
        console.warn("Unity context not ready, retrying...");
        setTimeout(() => {
          if (unityContextRef.current?.sendMessage) {
            sendQuestionsToUnity();
          }
        }, 1000);
      }
    } catch (err) {
      console.error("Error sending questions to Unity:", err);
      const errorMsg = "Failed to send questions to Unity game";
      setError(errorMsg);
      if (onGameError) {
        onGameError(errorMsg);
      }
    }
  };

  const handleGameLoad = () => {
    console.log("Unity game loaded!");
    setGameLoaded(true);
  };

  const handleGameError = (errorMsg: string) => {
    console.error("Unity game error:", errorMsg);
    setError(errorMsg);
    if (onGameError) {
      onGameError(errorMsg);
    }
  };

  // Get Unity context reference
  const handleUnityContext = (context: { sendMessage: (gameObject: string, method: string, value?: string) => void }) => {
    unityContextRef.current = context;
    // Try sending questions immediately if game is already loaded
    if (gameLoaded && questions.length > 0 && !questionsSentRef.current) {
      setTimeout(sendQuestionsToUnity, 500); // Small delay to ensure Unity is ready
    }
  };

  if (questions.length === 0) {
    return (
      <div className="p-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <p className="text-yellow-800">No questions available. Please load questions first.</p>
      </div>
    );
  }

  return (
    <div className="quiz-runner-game">
      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {gameLoaded && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            ✓ Game loaded! {questions.length} question{questions.length !== 1 ? "s" : ""} ready.
          </p>
        </div>
      )}

      <UnityGame
        buildPath="/unity-games/quiz-runner"
        gameName="quiz-runner"
        width={width}
        height={height}
        onLoad={handleGameLoad}
        onError={handleGameError}
        onContextReady={handleUnityContext}
      />
    </div>
  );
}


