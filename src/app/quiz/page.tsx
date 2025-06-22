"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
};

type Subtopic = {
  title: string;
  description: string;
  key_concepts: string[];
  quiz: QuizQuestion[];
  status: string; // "unmastered" or "mastered"
  answered?: number;
  correct?: number;
};

export default function QuizPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [current, setCurrent] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        setSubtopic(JSON.parse(data));
      } catch (err) {
        console.error("Invalid quiz data", err);
      }
    }
  }, [searchParams]);

  if (!subtopic) return <div className="p-6">Loading...</div>;

  const quiz = subtopic.quiz || [];
  const currentQuestion = quiz[current];

  // added cuz erroring need to fix later
  if (!currentQuestion) {
    return <div className="p-6">No more questions available.</div>;
  }


  const handleCheck = () => {
    if (!selected) return;
    if (selected === currentQuestion.answer) {
      setCorrectCount((c) => c + 1);
    }
    setChecked(true);
  };

  const handleNext = () => {
    setChecked(false);
    setSelected(null);
    setCurrent((i) => i + 1);
  };

  const handleEndQuiz = () => {
    setShowResult(true);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">🧠 Quiz: {subtopic.title}</h1>

      {!showResult ? (
        <div>
          <p className="mb-4 text-gray-600">
            Question {current + 1} of {quiz.length}
          </p>

          <p className="mb-4 font-medium text-white">{currentQuestion.question}</p>
          <div className="space-y-2 mb-4">
            {currentQuestion.options.map((opt: string, i: number) => (
              <button
                key={i}
                onClick={() => setSelected(opt)}
                className={`block w-full text-left px-4 py-2 rounded border ${
                  selected === opt
                    ? "bg-blue-600 text-white"
                    : "bg-white text-black hover:bg-gray-100"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>

          {checked && (
            <p
              className={`mb-4 font-medium ${
                selected === currentQuestion.answer ? "text-green-600" : "text-red-600"
              }`}
            >
              {selected === currentQuestion.answer ? "✅ Correct!" : "❌ Incorrect."}
              <br />
              <span className="text-gray-600 italic">
                Explanation: {currentQuestion.explanation}
              </span>
            </p>
          )}

          <div className="flex space-x-4">
            {!checked ? (
              <button
                onClick={handleCheck}
                disabled={!selected}
                className="bg-blue-600 text-white px-4 py-2 rounded"
              >
                Check
              </button>
            ) : current + 1 < quiz.length ? (
              <button
                onClick={handleNext}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleEndQuiz}
                className="bg-green-600 text-white px-4 py-2 rounded"
              >
                End Quiz
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-black">🎉 Quiz Complete!</h2>
          <p className="text-lg text-gray-800">
            You got {correctCount} out of {quiz.length} correct (
            {Math.round((correctCount / quiz.length) * 100)}%)
          </p>

            <button
                onClick={() => {
                    const totalAnswered = quiz.length;
                    const updatedSubtopic = {
                        ...subtopic,
                        answered: (subtopic.answered || 0) + totalAnswered,
                        correct: (subtopic.correct || 0) + correctCount,
                    };

                    const accuracy = updatedSubtopic.correct / updatedSubtopic.answered;
                    updatedSubtopic.status =
                        accuracy >= 0.8 && updatedSubtopic.answered >= 100
                            ? "mastered"
                            : "unmastered";

                    router.push(
                        `/?updated=${encodeURIComponent(JSON.stringify(updatedSubtopic))}`
                    );
                }}
                className="mt-6 bg-indigo-600 text-white px-6 py-2 rounded"
            >
                Back to Knowledge Map
            </button>
        </div>
      )}
    </div>
  );
}
