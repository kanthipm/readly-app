"use client";

import React, { useState } from "react";

type Question = {
  question: string;
  options: string[];
  correctAnswer: string;
};

type MultipleChoiceQuizProps = {
  questions: Question[];
  onComplete?: (score: number) => void;
};

export default function MultipleChoiceQuiz({ questions, onComplete }: MultipleChoiceQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);

  const currentQuestion = questions[currentIndex];

  function handleOptionClick(option: string) {
    if (selectedOption) return; // prevent multiple selections

    setSelectedOption(option);
    setShowFeedback(true);

    if (option === currentQuestion.correctAnswer) {
      setScore((prev) => prev + 1);
    }
  }

  function handleNext() {
    setSelectedOption(null);
    setShowFeedback(false);

    if (currentIndex + 1 < questions.length) {
      setCurrentIndex(currentIndex + 1);
    } else {
      if (onComplete) onComplete(score);
    }
  }

  return (
    <div className="max-w-3xl mx-auto p-6 bg-white rounded shadow-lg">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-900">{currentQuestion.question}</h2>

      <div className="flex flex-col gap-4 mb-6">
        {currentQuestion.options.map((option) => {
          const isSelected = option === selectedOption;
          const isCorrect = option === currentQuestion.correctAnswer;

          let bgClasses = "bg-white text-indigo-700 hover:bg-indigo-100";
          if (showFeedback) {
            if (isSelected) {
              bgClasses = isCorrect ? "bg-green-400 text-white" : "bg-red-400 text-white";
            } else if (isCorrect) {
              bgClasses = "bg-green-300 text-indigo-900";
            } else {
              bgClasses = "bg-gray-100 text-gray-500";
            }
          }

          return (
            <button
              key={option}
              onClick={() => handleOptionClick(option)}
              disabled={!!selectedOption}
              className={`px-4 py-3 rounded shadow font-semibold transition ${bgClasses}`}
            >
              {option}
            </button>
          );
        })}
      </div>

      {showFeedback && (
        <button
          onClick={handleNext}
          className="bg-indigo-600 text-white px-6 py-3 rounded font-semibold hover:bg-indigo-700 transition"
        >
          {currentIndex + 1 < questions.length ? "Next" : "Finish"}
        </button>
      )}
    </div>
  );
}
