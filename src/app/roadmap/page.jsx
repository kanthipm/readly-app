"use client";

import { useSearchParams } from "next/navigation";

const lessons = [
  { id: 1, title: "Letter Sounds", progress: 0.25 },
  { id: 2, title: "Simple Words", progress: 0 },
  { id: 3, title: "Reading Sentences", progress: 0 },
  // Add more lessons here
];

export default function Roadmap() {
  const searchParams = useSearchParams();
  const grade = searchParams.get("grade");

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <nav className="w-48 bg-indigo-700 text-white flex flex-col items-start py-8 px-4 space-y-6">
        <div className="text-2xl font-bold mb-10 ml-2">Readly</div>
        <button className="flex items-center gap-3 px-2 py-3 rounded hover:bg-indigo-600 w-full">
          <span className="text-xl">🏠</span>
          <span className="font-semibold">Home</span>
        </button>
        <button className="flex items-center gap-3 px-2 py-3 rounded hover:bg-indigo-600 w-full">
          <span className="text-xl">📚</span>
          <span className="font-semibold">Lessons</span>
        </button>
        <button className="flex items-center gap-3 px-2 py-3 rounded hover:bg-indigo-600 w-full">
          <span className="text-xl">⚙️</span>
          <span className="font-semibold">Settings</span>
        </button>
      </nav>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="flex justify-between items-center bg-indigo-700 p-4 shadow text-white">
          <div></div> {/* Empty placeholder so layout stays consistent */}
          <div className="flex items-center gap-6">
            <div>Points: 1200</div>
            <div className="rounded-full bg-indigo-900 text-white w-10 h-10 flex items-center justify-center font-bold">
              K
            </div>
          </div>
        </header>

        {/* Roadmap lessons */}
        <main className="flex-1 pt-30 px-8 pb-8 overflow-auto">
          <div className="relative max-w-xl mx-auto" style={{ height: "600px" }}>
            {lessons.map((lesson, i) => {
              const top = i * 130;
              const offsetX = 30 * Math.sin(i * 1.5);

              return (
                <div
                  key={lesson.id}
                  className="absolute flex items-center gap-4 cursor-pointer"
                  style={{ top, left: 100 + offsetX }}
                  title={lesson.title}
                >
                  <div
                    className={`w-20 h-20 rounded-full flex items-center justify-center font-bold text-white shadow-lg
                        ${lesson.progress > 0 ? "bg-gradient-to-tr from-yellow-400 to-yellow-600" : "bg-gradient-to-tr from-gray-400 to-gray-600"}`}
                    style={{
                        boxShadow: '0 4px 6px rgba(0,0,0,0.3), inset 0 -3px 5px rgba(255,255,255,0.3)'
                    }}
                    >
                    {lesson.id}
                  </div>

                  <span className="font-semibold text-gray-800">{lesson.title}</span>
                </div>
              );
            })}
          </div>
        </main>
      </div>
    </div>
  );
}
