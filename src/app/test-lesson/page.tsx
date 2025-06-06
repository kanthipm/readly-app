import MultipleChoiceQuiz from "@/components/MultipleChoiceQuiz";

const sampleQuestions = [
  {
    question: "What sound does the letter 'A' make?",
    options: ["ah", "buh", "cuh"],
    correctAnswer: "ah",
  },
  {
    question: "What sound does the letter 'B' make?",
    options: ["buh", "cuh", "ah"],
    correctAnswer: "buh",
  },
  {
    question: "What sound does the letter 'C' make?",
    options: ["buh", "cuh", "ah"],
    correctAnswer: "cuh",
  },
];

export default function TestQuiz() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">Multiple Choice Quiz Test</h1>
      <MultipleChoiceQuiz
        questions={sampleQuestions}
        onComplete={(score) => alert(`You scored ${score} out of ${sampleQuestions.length}`)}
      />
    </div>
  );
}

