"use client";

import { useState } from "react";
import UnityGame from "@/components/UnityGame";

export default function UnityGamePage() {
  const [gameLoaded, setGameLoaded] = useState(false);

  // Example: Replace with your actual Unity game details
  // After building your Unity game to WebGL, place it in:
  // public/unity-games/my-game/Build/
  const gameName = "my-game"; // Change this to your Unity build name
  const buildPath = "/unity-games/my-game"; // Change this to match your folder structure

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-4 text-gray-900">Unity Game</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates how to embed Unity games in your Next.js application.
          </p>

          {gameLoaded && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-800">✓ Game loaded successfully!</p>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-lg p-6">
            <UnityGame
              buildPath={buildPath}
              gameName={gameName}
              width="960px"
              height="600px"
              onLoad={() => {
                console.log("Unity game loaded!");
                setGameLoaded(true);
              }}
              onError={(error) => {
                console.error("Unity game error:", error);
              }}
            />
          </div>

          <div className="mt-8 p-6 bg-blue-50 border border-blue-200 rounded-lg">
            <h2 className="text-xl font-semibold mb-2 text-blue-900">
              How to add your Unity game:
            </h2>
            <ol className="list-decimal list-inside space-y-2 text-blue-800">
              <li>Build your Unity game to WebGL format</li>
              <li>
                Copy the entire Build folder to:{" "}
                <code className="bg-blue-100 px-2 py-1 rounded">public/unity-games/your-game-name/Build/</code>
              </li>
              <li>Update the <code className="bg-blue-100 px-2 py-1 rounded">gameName</code> and <code className="bg-blue-100 px-2 py-1 rounded">buildPath</code> props in this component</li>
              <li>Your game should load automatically!</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}


