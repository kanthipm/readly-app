/**
 * Quiz Runner Game Configuration
 */

import { GameConfig } from "../types";

export const defaultConfig: GameConfig = {
  width: "960px",
  height: "600px",
  timePerQuestion: 30,
  pointsPerCorrect: 10,
};

export const gameInfo = {
  id: "quiz-runner",
  name: "Quiz Runner",
  description: "Answer questions correctly to progress through the game!",
  unityBuildPath: "/unity-games/quiz-runner",
  unityGameName: "quiz-runner",
};


