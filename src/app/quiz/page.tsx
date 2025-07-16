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
  const [isGenerating, setIsGenerating] = useState(false);

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

  const generateMoreQuestions = async () => {
    if (!subtopic) return;
    
    setIsGenerating(true);
    try {
      console.log("🔄 Generating questions for:", subtopic.title);
      
      const response = await fetch("http://localhost:5000/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: subtopic.title,
          description: subtopic.description,
          key_concepts: subtopic.key_concepts,
          num_questions: 3,
        }),
      });

      console.log("📡 Response status:", response.status);

      if (response.ok) {
        const data = await response.json();
        console.log("📦 Received data:", data);
        
        if (data.questions && Array.isArray(data.questions)) {
          const newQuestions = data.questions;
          
          // Add new questions to the existing quiz
          const updatedSubtopic = {
            ...subtopic,
            quiz: [...subtopic.quiz, ...newQuestions],
          };
          
          setSubtopic(updatedSubtopic);
          setCurrent(subtopic.quiz.length); // Move to the first new question
          setSelected(null);
          setChecked(false);
          console.log("✅ Added", newQuestions.length, "new questions");
        } else {
          console.error("❌ Invalid response format:", data);
          alert("Failed to generate questions: Invalid response format");
        }
      } else {
        const errorText = await response.text();
        console.error("❌ Server error:", response.status, errorText);
        alert(`Failed to generate questions: ${response.status} - ${errorText}`);
      }
    } catch (error) {
      console.error("❌ Network error:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      alert(`Failed to generate questions: ${errorMessage}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!subtopic) return <div className="p-6">Loading...</div>;

  const quiz = subtopic.quiz || [];
  const currentQuestion = quiz[current];

  console.log("Current question object:", currentQuestion);

  // Check if we need to generate more questions
  if (!currentQuestion && !isGenerating) {
    generateMoreQuestions();
    return <div className="p-6 text-center">🔄 Generating more questions...</div>;
  }

  // Show loading while generating
  if (isGenerating) {
    return <div className="p-6 text-center">🔄 Generating more questions...</div>;
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
            {currentQuestion.options.map((opt: string, i: number) => {
                const isCorrect = opt === currentQuestion.answer;
                const isSelected = opt === selected;

                let style = "bg-white text-black hover:bg-gray-100"; // default

                if (checked) {
                    if (isCorrect) {
                    style = "bg-green-800 text-white"; // correct = green
                    } else if (isSelected) {
                    style = "bg-red-800 text-white"; // selected wrong = red
                    }
                } else if (isSelected) {
                    style = "bg-blue-600 text-white"; // current selection before check
                }

                return (
                    <button
                    key={i}
                    onClick={() => {
                        if (!checked) setSelected(opt); // only allow selection before checking
                    }}
                    disabled={checked} // disable all buttons after checking
                    className={`block w-full text-left px-4 py-2 rounded border ${style}`}
                    >
                    {opt}
                    </button>
                );
                })}

          </div>

          {checked && (
            <p className="mt-4 text-sm text-gray-500 italic">
                Explanation: {currentQuestion.explanation}
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
            ) : (
              <button
                onClick={handleNext}
                className="bg-yellow-500 text-white px-4 py-2 rounded"
              >
                Next
              </button>
            )}
          </div>

          {/* Manual end quiz option */}
          <div className="mt-4 text-center">
            <button
              onClick={handleEndQuiz}
              className="text-gray-400 hover:text-white text-sm underline"
            >
              End Quiz
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <h2 className="text-xl font-bold mb-4 text-white">🎉 Quiz Complete!</h2>
          <p className="text-lg text-gray-500">
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

