"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LandingPage() {
  const [selectedGrade, setSelectedGrade] = useState<string | null>(null);
  const router = useRouter();

  const grades = ["K", "1", "2"];

  const handleSelectGrade = (grade: string) => {
    setSelectedGrade(grade);
  };

  const handleContinue = () => {
    if (selectedGrade) {
      // Navigate to roadmap page with grade param
      router.push(`/roadmap?grade=${selectedGrade}`);
    } else {
      alert("Please select a grade to continue");
    }
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-indigo-400 to-pink-400 p-8 text-white">
      <h1 className="text-5xl font-extrabold mb-8">Readly</h1>
      <p className="mb-6 text-xl">What grade are you in?</p>

      <div className="flex space-x-8 mb-10">
        {grades.map((grade) => (
          <button
            key={grade}
            onClick={() => handleSelectGrade(grade)}
            className={`w-24 h-24 rounded-full text-3xl font-bold shadow-lg transition 
              ${
                selectedGrade === grade
                  ? "bg-yellow-400 text-indigo-900"
                  : "bg-white text-indigo-600 hover:bg-indigo-100"
              }`}
          >
            {grade}
          </button>
        ))}
      </div>

      <button
        onClick={handleContinue}
        className="bg-yellow-400 text-indigo-900 font-bold py-3 px-8 rounded-lg shadow-lg hover:bg-yellow-500 transition"
      >
        Continue
      </button>
    </main>
  );
}
