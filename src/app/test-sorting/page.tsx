"use client";

import SortingGame from "@/components/SortingGame";

export default function TestSortingPage() {
  const items = ["First", "Second", "Third", "Fourth"];

  return (
    <div className="p-10">
      <h1 className="text-3xl font-bold mb-6">Sorting Game Test</h1>
      <SortingGame items={items} onComplete={(correct) => alert(correct ? "✅ Correct!" : "❌ Not quite yet!")} />
    </div>
  );
}
