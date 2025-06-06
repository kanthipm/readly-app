export default function LessonPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-tr from-green-400 to-blue-500 p-8 text-white">
      <h1 className="text-4xl font-bold mb-4">Lesson 1: Letter Sounds</h1>
      <p className="mb-6 max-w-md text-center text-lg">
        Learn the basic sounds of letters A, B, and C with fun examples and exercises.
      </p>

      <div className="w-full max-w-md">
        <div className="mb-6">
          <label className="block mb-2 font-semibold">Progress</label>
          <div className="w-full bg-white rounded-full h-6 overflow-hidden">
            <div className="bg-yellow-400 h-6 rounded-full" style={{ width: '25%' }}></div>
          </div>
          <p className="mt-1 text-yellow-200 font-semibold">25% Complete</p>
        </div>

        <button className="w-full bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold py-3 rounded-lg shadow-lg transition">
          Start Lesson
        </button>
      </div>
    </main>
  );
}
