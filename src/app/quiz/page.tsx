"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type QuizQuestion = {
  question: string;
  options: string[];
  answer: string;
  explanation: string;
  id?: string; // Unique ID for tracking
  timesAsked?: number;
  timesCorrect?: number;
  timesWrong?: number;
  lastAsked?: string;
};

type Subtopic = {
  title: string;
  description: string;
  key_concepts: string[];
  quiz: QuizQuestion[];
  status: string; // "unmastered" or "mastered"
  answered?: number;
  correct?: number;
  wrongQuestions?: string[]; // IDs of questions frequently gotten wrong
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
  const [questionsAnsweredThisSession, setQuestionsAnsweredThisSession] = useState(0); // Track how many questions were actually answered
  const [hasGeneratedInBackground, setHasGeneratedInBackground] = useState(false); // Track if we're generating in background
  const [questionsAskedThisSession, setQuestionsAskedThisSession] = useState<Set<string>>(new Set()); // Track which question IDs have been asked in this session

  const generateMoreQuestions = async () => {
    if (!subtopic || isGenerating) return;
    
    setIsGenerating(true);
    try {
      // Prioritize questions from wrong questions list if available
      const wrongQuestionIds = subtopic.wrongQuestions || [];
      const wrongQuestions = subtopic.quiz.filter(q => wrongQuestionIds.includes(q.id || ''));
      const hasWrongQuestions = wrongQuestions.length > 0;
      
      console.log("🔄 Generating questions for:", subtopic.title);
      
      const response = await fetch("http://localhost:5000/api/v1/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: subtopic.title,
          description: subtopic.description,
          key_concepts: subtopic.key_concepts,
          num_questions: hasWrongQuestions ? 5 : 3, // More questions if focusing on wrong ones
          focus_on_weak_areas: hasWrongQuestions,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        
        if (data.questions && Array.isArray(data.questions)) {
          const newQuestions = data.questions.map((q: QuizQuestion, idx: number) => ({
            ...q,
            id: `q_${Date.now()}_${idx}`,
            timesAsked: 0,
            timesCorrect: 0,
            timesWrong: 0,
          }));
          
          // Save the old length to know where to set current
          const oldLength = subtopic.quiz.length;
          
          // Add new questions to the existing quiz
          const updatedSubtopic = {
            ...subtopic,
            quiz: [...subtopic.quiz, ...newQuestions],
          };
          
          setSubtopic(updatedSubtopic);
          // Move to the first new question if we were already beyond bounds
          // If user clicked Next on last question, they're now at oldLength (which is out of bounds)
          // Set it to oldLength to show the first new question
          setCurrent((prevCurrent) => {
            // If we're beyond the old array bounds, go to first new question (oldLength)
            if (prevCurrent >= oldLength) {
              return oldLength;
            }
            // Otherwise stay where we are (user hasn't reached the end yet)
            return prevCurrent;
          });
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

  // Function to prioritize questions for a new session:
  // Mostly fresh questions, with wrong questions sprinkled in occasionally
  const prioritizeQuestionsForSession = (questions: QuizQuestion[]): QuizQuestion[] => {
    const now = Date.now();
    const ONE_DAY_MS = 24 * 60 * 60 * 1000;
    
    // Categorize questions
    const neverAsked: QuizQuestion[] = [];
    const wrongQuestions: QuizQuestion[] = []; // 2+ times wrong
    const oldQuestions: QuizQuestion[] = []; // Asked > 1 day ago
    const recentQuestions: QuizQuestion[] = []; // Asked within last day
    
    questions.forEach((q) => {
      const timesAsked = q.timesAsked || 0;
      const timesWrong = q.timesWrong || 0;
      const lastAsked = q.lastAsked ? new Date(q.lastAsked).getTime() : 0;
      const daysSinceAsked = lastAsked > 0 ? (now - lastAsked) / ONE_DAY_MS : Infinity;
      
      if (timesAsked === 0) {
        neverAsked.push(q);
      } else if (timesWrong >= 2) {
        wrongQuestions.push(q);
      } else if (daysSinceAsked > 1) {
        oldQuestions.push(q);
      } else {
        recentQuestions.push(q);
      }
    });
    
    // Shuffle each category for variety
    const shuffle = <T,>(array: T[]): T[] => {
      const shuffled = [...array];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }
      return shuffled;
    };
    
    const shuffledNeverAsked = shuffle(neverAsked);
    const shuffledWrong = shuffle(wrongQuestions);
    const shuffledOld = shuffle(oldQuestions);
    const shuffledRecent = shuffle(recentQuestions);
    
    // Build prioritized array: mostly new questions, with wrong questions sprinkled in
    const prioritized: QuizQuestion[] = [];
    
    // Strategy: 
    // 1. Start with never-asked questions (most priority)
    // 2. Every 4-5 questions, sprinkle in a wrong question
    // 3. After never-asked run out, use old questions
    // 4. Use recent questions last
    
    let neverAskedIdx = 0;
    let wrongIdx = 0;
    let oldIdx = 0;
    let recentIdx = 0;
    
    const totalQuestions = questions.length;
    
    for (let i = 0; i < totalQuestions; i++) {
      // Every 5th position (starting at position 4, which is the 5th question), add a wrong question
      // But only if we've added at least a few never-asked questions first
      if (i >= 4 && i % 5 === 4 && wrongIdx < shuffledWrong.length && prioritized.length > 0) {
        prioritized.push(shuffledWrong[wrongIdx++]);
        continue;
      }
      
      // First priority: never asked questions
      if (neverAskedIdx < shuffledNeverAsked.length) {
        prioritized.push(shuffledNeverAsked[neverAskedIdx++]);
        continue;
      }
      
      // Second priority: old questions (not asked recently)
      if (oldIdx < shuffledOld.length) {
        prioritized.push(shuffledOld[oldIdx++]);
        continue;
      }
      
      // Third priority: wrong questions (if not already added via sprinkling)
      if (wrongIdx < shuffledWrong.length) {
        prioritized.push(shuffledWrong[wrongIdx++]);
        continue;
      }
      
      // Last priority: recent questions
      if (recentIdx < shuffledRecent.length) {
        prioritized.push(shuffledRecent[recentIdx++]);
        continue;
      }
      
      // If we run out of all questions, break
      break;
    }
    
    return prioritized;
  };

  // Initialize subtopic from URL params
  useEffect(() => {
    const data = searchParams.get("data");
    if (data) {
      try {
        const parsed = JSON.parse(data);
        // Ensure all questions have IDs
        const questionsWithIds = parsed.quiz.map((q: QuizQuestion, idx: number) => ({
          ...q,
          id: q.id || `q_${Date.now()}_${idx}`,
          timesAsked: q.timesAsked || 0,
          timesCorrect: q.timesCorrect || 0,
          timesWrong: q.timesWrong || 0,
        }));
        
        // Prioritize questions for new session (mostly fresh, some wrong ones)
        const prioritizedQuestions = prioritizeQuestionsForSession(questionsWithIds);
        
        setSubtopic({ ...parsed, quiz: prioritizedQuestions });
        // Reset session tracking when starting new quiz
        setQuestionsAskedThisSession(new Set());
        setQuestionsAnsweredThisSession(0);
        setCorrectCount(0);
        setCurrent(0);
      } catch (err) {
        console.error("Invalid quiz data", err);
      }
    }
  }, [searchParams]);

  // Pre-generate more questions when there are 3 questions left to ensure they're ready
  useEffect(() => {
    if (subtopic && 
        subtopic.quiz.length >= 3 &&
        current === subtopic.quiz.length - 3 && // When on 3rd-to-last question
        !isGenerating && 
        !showResult &&
        !hasGeneratedInBackground) {
      // Silently generate in background - no loading screen shown
      setHasGeneratedInBackground(true);
      generateMoreQuestions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, subtopic?.quiz.length, isGenerating, showResult]);
  
  // Reset generation flag when new questions are added (so we can generate again when needed)
  useEffect(() => {
    if (subtopic && subtopic.quiz.length > 0 && hasGeneratedInBackground) {
      // If we're now past where we generated, reset the flag
      if (current < subtopic.quiz.length - 3) {
        setHasGeneratedInBackground(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subtopic?.quiz.length, current]);
  
  // Skip to next unasked question if current was already asked this session
  // BUT only when navigating (not when checked is true, which means user just answered)
  useEffect(() => {
    if (!subtopic || subtopic.quiz.length === 0 || checked) return; // Don't skip if user just checked answer
    
    const currentQ = subtopic.quiz[current];
    if (currentQ) {
      const questionId = currentQ.id || currentQ.question;
      if (questionsAskedThisSession.has(questionId)) {
        // Current question was already asked - find next unasked
        for (let idx = current + 1; idx < subtopic.quiz.length; idx++) {
          const q = subtopic.quiz[idx];
          const qId = q.id || q.question;
          if (!questionsAskedThisSession.has(qId)) {
            setCurrent(idx);
            return;
          }
        }
        // All questions asked - will trigger generation
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [current, subtopic]);

  if (!subtopic) return <div className="p-6">Loading...</div>;

  const quiz = subtopic.quiz || [];
  const currentQuestion = quiz[current];

  console.log("Current question object:", currentQuestion);

  // Only show loading if we're truly out of questions
  // Never show loading if we have a valid question available
  if (!currentQuestion) {
    // Only show loading if we've run out of questions (current is beyond array)
    if (current >= quiz.length) {
      // Out of questions - trigger generation if not already generating
      if (!isGenerating && subtopic) {
        generateMoreQuestions();
      }
      return <div className="p-6 text-center">🔄 Generating more questions...</div>;
    }
    // If we're in bounds but no question, something's wrong
    return <div className="p-6 text-center">Loading...</div>;
  }
  
  // If we have a valid question, always show it (even if generating in background)

  const handleCheck = () => {
    if (!selected || !currentQuestion || !subtopic) return;
    
    const isCorrect = selected === currentQuestion.answer;
    if (isCorrect) {
      setCorrectCount((c) => c + 1);
    }
    
    // Track that we answered this question in this session
    const questionId = currentQuestion.id || currentQuestion.question;
    setQuestionsAnsweredThisSession((count) => count + 1);
    
    // Mark this question as asked in this session (if not already marked)
    setQuestionsAskedThisSession((prev) => {
      const newSet = new Set(prev);
      newSet.add(questionId);
      return newSet;
    });
    
    // Track performance per question
    const updatedQuestion = {
      ...currentQuestion,
      timesAsked: (currentQuestion.timesAsked || 0) + 1,
      timesCorrect: isCorrect ? (currentQuestion.timesCorrect || 0) + 1 : (currentQuestion.timesCorrect || 0),
      timesWrong: isCorrect ? (currentQuestion.timesWrong || 0) : (currentQuestion.timesWrong || 0) + 1,
      lastAsked: new Date().toISOString(),
    };
    
    // Update subtopic with performance data - find question by ID to update
    const updatedQuiz = subtopic.quiz.map((q) => {
      const qId = q.id || q.question;
      return qId === questionId ? updatedQuestion : q;
    });
    
    // Track wrong questions (if wrong 2+ times, add to priority list)
    const wrongQuestionsSet = new Set(subtopic.wrongQuestions || []);
    if (!isCorrect && (updatedQuestion.timesWrong || 0) >= 2) {
      wrongQuestionsSet.add(questionId);
    } else if (isCorrect && updatedQuestion.timesCorrect > updatedQuestion.timesWrong) {
      wrongQuestionsSet.delete(questionId); // Remove if now doing better
    }
    
    const updatedSubtopic = {
      ...subtopic,
      quiz: updatedQuiz,
      wrongQuestions: Array.from(wrongQuestionsSet),
    };
    
    setSubtopic(updatedSubtopic);
    setChecked(true);
  };

  const handleNext = () => {
    if (!subtopic) return;
    
    setChecked(false);
    setSelected(null);
    
    // Find the next question that hasn't been asked this session
    const findNextUnaskedQuestion = (startIndex: number): number => {
      for (let idx = startIndex; idx < subtopic.quiz.length; idx++) {
        const question = subtopic.quiz[idx];
        const questionId = question.id || question.question;
        if (!questionsAskedThisSession.has(questionId)) {
          return idx;
        }
      }
      // If we've asked all available questions, return -1 to trigger generation
      return -1;
    };
    
    // Use current state value, but if current question was already asked, skip it
    let startIdx = current + 1;
    const nextUnaskedIndex = findNextUnaskedQuestion(startIdx);
    
    if (nextUnaskedIndex === -1) {
      // All available questions have been asked - generate more
      if (!isGenerating) {
        generateMoreQuestions();
      }
      // Move to the next index (will show loading or wait for new questions)
      setCurrent((prev) => prev + 1);
    } else {
      // Move to next unasked question
      setCurrent(nextUnaskedIndex);
    }
  };

  const handleEndQuiz = () => {
    setShowResult(true);
  };

  return (
    <div className="max-w-xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4 text-white">🧠 Quiz: {subtopic.title}</h1>

      {!showResult ? (
        <div>
          <p className="mb-4 font-medium text-white">{currentQuestion.question}</p>
          <div className="space-y-2 mb-4">
            {currentQuestion.options.map((opt, i) => {
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
            You got {correctCount} out of {questionsAnsweredThisSession} correct (
            {questionsAnsweredThisSession > 0 ? Math.round((correctCount / questionsAnsweredThisSession) * 100) : 0}%)
          </p>

            <button
                onClick={async () => {
                    if (!subtopic) return;
                    
                    // Use the actual number of questions answered in this session
                    const totalAnswered = questionsAnsweredThisSession || current;
                    const updatedSubtopic = {
                        ...subtopic,
                        answered: (subtopic.answered || 0) + totalAnswered,
                        correct: (subtopic.correct || 0) + correctCount,
                        // Preserve all performance data
                        quiz: subtopic.quiz, // Keep all questions with performance data
                        wrongQuestions: subtopic.wrongQuestions || [],
                    };

                    // Calculate mastery with both accuracy AND question count requirements
                    const accuracy = updatedSubtopic.answered > 0 
                        ? updatedSubtopic.correct / updatedSubtopic.answered 
                        : 0;
                    
                    // Mastery calculation: requires both high accuracy (85%+) AND many questions (25+)
                    // Status: mastered if accuracy >= 85% AND answered >= 25 questions
                    updatedSubtopic.status =
                        accuracy >= 0.85 && updatedSubtopic.answered >= 25
                            ? "mastered"
                            : "unmastered";

                    // Save to localStorage immediately to prevent data loss
                    try {
                        const stored = localStorage.getItem("knowledgeMaps");
                        if (stored) {
                            const mapsData = JSON.parse(stored);
                            const updatedMaps = mapsData.map((mapGroup: any) => {
                                const updatedMaps = mapGroup.maps.map((mapStr: string) => {
                                    try {
                                        const map = JSON.parse(mapStr);
                                        map.subtopics = map.subtopics.map((sub: any) =>
                                            sub.title === updatedSubtopic.title ? updatedSubtopic : sub
                                        );
                                        return JSON.stringify(map);
                                    } catch {
                                        return mapStr;
                                    }
                                });
                                return { ...mapGroup, maps: updatedMaps };
                            });
                            localStorage.setItem("knowledgeMaps", JSON.stringify(updatedMaps));
                            
                            // Wait a moment to ensure localStorage write completes
                            await new Promise(resolve => setTimeout(resolve, 100));
                        }
                    } catch (err) {
                        console.error("Failed to save to localStorage", err);
                    }

                    // Get mapId from URL params to navigate back to correct tab
                    const mapId = searchParams.get("mapId");
                    const backUrl = mapId 
                      ? `/?updated=${encodeURIComponent(JSON.stringify(updatedSubtopic))}&mapId=${encodeURIComponent(mapId)}`
                      : `/?updated=${encodeURIComponent(JSON.stringify(updatedSubtopic))}`;
                    
                    // Navigate back with updated data and map ID
                    router.push(backUrl);
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
