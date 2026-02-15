"use client";

import React from "react";
import { Unity, useUnityContext } from "react-unity-webgl";

interface UnityGameProps {
  /**
   * Path to the Unity build directory in the public folder
   * Example: "/unity-games/my-game"
   * Should contain: Build/my-game.loader.js, Build/my-game.data, Build/my-game.framework.js, Build/my-game.wasm
   */
  buildPath: string;
  /**
   * Name of your Unity build (without extension)
   * Example: "my-game" will look for "my-game.loader.js"
   */
  gameName: string;
  /**
   * Width of the game canvas
   * Defaults to "960px"
   */
  width?: string;
  /**
   * Height of the game canvas
   * Defaults to "600px"
   */
  height?: string;
  /**
   * Callback when the game is loaded
   */
  onLoad?: () => void;
  /**
   * Callback when the game encounters an error
   */
  onError?: (error: string) => void;
  /**
   * Additional CSS classes for the container
   */
  className?: string;
  /**
   * Callback to receive Unity context (for sending messages)
   */
  onContextReady?: (context: { sendMessage: (gameObject: string, method: string, value?: string) => void }) => void;
}

export default function UnityGame({
  buildPath,
  gameName,
  width = "960px",
  height = "600px",
  onLoad,
  onError,
  className = "",
  onContextReady,
}: UnityGameProps) {
  // setError reserved for future Unity loader error handling
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- reserved for Unity error callback
  const [error, setError] = React.useState<string | null>(null);
  
  const { unityProvider, isLoaded, loadingProgression, sendMessage } = useUnityContext({
    loaderUrl: `${buildPath}/Build/${gameName}.loader.js`,
    dataUrl: `${buildPath}/Build/${gameName}.data`,
    frameworkUrl: `${buildPath}/Build/${gameName}.framework.js`,
    codeUrl: `${buildPath}/Build/${gameName}.wasm`,
  });

  // Expose context when loaded
  React.useEffect(() => {
    if (isLoaded && onContextReady) {
      onContextReady({ sendMessage });
    }
  }, [isLoaded, onContextReady, sendMessage]);

  React.useEffect(() => {
    if (isLoaded && onLoad) {
      onLoad();
    }
  }, [isLoaded, onLoad]);

  React.useEffect(() => {
    if (error && onError) {
      onError(error);
    }
  }, [error, onError]);

  const loadingPercentage = Math.round(loadingProgression * 100);

  return (
    <div className={`unity-game-container ${className}`}>
      {error ? (
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-semibold">Error loading Unity game:</p>
          <p className="text-red-600 mt-2">{error}</p>
          <p className="text-sm text-red-500 mt-4">
            Make sure your Unity build is exported to WebGL and placed in the public folder at:
            <code className="block mt-1 bg-red-100 p-2 rounded">{buildPath}</code>
            <span className="block mt-2">Expected files:</span>
            <ul className="list-disc list-inside mt-1 space-y-1">
              <li>{buildPath}/Build/{gameName}.loader.js</li>
              <li>{buildPath}/Build/{gameName}.data</li>
              <li>{buildPath}/Build/{gameName}.framework.js</li>
              <li>{buildPath}/Build/{gameName}.wasm</li>
            </ul>
          </p>
        </div>
      ) : (
        <>
          {!isLoaded && (
            <div className="flex flex-col items-center justify-center p-8 bg-gray-50 border border-gray-200 rounded-lg">
              <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
              <p className="text-gray-600 font-medium">Loading Unity game...</p>
              <div className="w-64 h-2 bg-gray-200 rounded-full mt-4 overflow-hidden">
                <div
                  className="h-full bg-indigo-600 transition-all duration-300"
                  style={{ width: `${loadingPercentage}%` }}
                ></div>
              </div>
              <p className="text-sm text-gray-500 mt-2">{loadingPercentage}%</p>
            </div>
          )}
          <div
            className={`${!isLoaded ? "hidden" : ""}`}
            style={{ width, height, margin: "0 auto" }}
          >
            <Unity
              unityProvider={unityProvider}
              style={{ width: "100%", height: "100%" }}
            />
          </div>
        </>
      )}
    </div>
  );
}

