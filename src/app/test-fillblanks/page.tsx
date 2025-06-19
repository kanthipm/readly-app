"use client"

import FillInTheBlank from "@/src/components/FillInTheBlank";

const questions = [
  {
    sentenceParts: ["The ", " fox jumps over the ", " dog."],
    options: ["quick", "lazy"],
  },
  {
    sentenceParts: ["I love ", " and ", "."],
    options: ["coffee", "tea"],
  },
];

export default function TestFillBlankMultiple() {
  return (
    <FillInTheBlank
      questions={questions}
      onComplete={(totalScore, totalBlanks) =>
        alert(`Your total score: ${totalScore} / ${totalBlanks}`)
      }
    />
  );
}
