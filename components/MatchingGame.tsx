"use client";

import React, { useState } from "react";

type Question = {
  question: string;
  choices: string[];
  correctAnswer: string;
};

type MultipleChoiceQuizProps = {
  questions: Question[];
};

export default function MultipleChoiceQuiz({ questions }: MultipleChoiceQuizProps) {
  const [current, setCurrent] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [showResults, setShowResults] = useState(false);

  const currentQuestion = questions[current];

  const handleSelect = (choice: string) => {
    const newAnswers = [...selectedAnswers];
    newAnswers[current] = choice;
    setSelectedAnswers(newAnswers);

    // Move to next or show results
    if (current + 1 < questions.length) {
      setCurrent(current + 1);
    } else {
      setShowResults(true);
    }
  };

  const calculateScore = () => {
    return questions.reduce((score, q, i) => {
      return score + (selectedAnswers[i] === q.correctAnswer ? 1 : 0);
    }, 0);
  };

  if (showResults) {
    const score = calculateScore();
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <h1 className="text-3xl font-bold mb-4 text-indigo-800">Quiz Complete!</h1>
        <p className="text-lg font-medium mb-6 text-indigo-700">
          You scored {score} out of {questions.length}
        </p>

        <div className="space-y-6">
          {questions.map((q, i) => {
            const isCorrect = selectedAnswers[i] === q.correctAnswer;
            return (
              <div
                key={i}
                className={`p-4 rounded shadow ${
                  isCorrect ? "bg-green-100" : "bg-red-100"
                }`}
              >
                <p className="font-semibold text-indigo-900 mb-2">{q.question}</p>
                <p>
                  <strong>Your answer:</strong>{" "}
                  <span className={isCorrect ? "text-green-700" : "text-red-700"}>
                    {selectedAnswers[i]}
                  </span>
                </p>
                {!isCorrect && (
                  <p>
                    <strong>Correct answer:</strong>{" "}
                    <span className="text-green-700">{q.correctAnswer}</span>
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h2 className="text-2xl font-semibold mb-4 text-indigo-900">
        {currentQuestion.question}
      </h2>
      <div className="space-y-3">
        {currentQuestion.choices.map((choice) => (
          <button
            key={choice}
            onClick={() => handleSelect(choice)}
            className="w-full text-left px-4 py-3 bg-white text-indigo-700 rounded shadow hover:bg-indigo-100 font-medium"
          >
            {choice}
          </button>
        ))}
      </div>
    </div>
  );
}
