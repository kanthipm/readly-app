# Unity Games Directory

This directory is for storing Unity WebGL builds.

## How to Add a Unity Game

1. Build your Unity game to WebGL format
2. Create a folder with your game name (e.g., `my-game`)
3. Copy the `Build` folder from your Unity build into this directory
4. Your structure should look like:
   ```
   unity-games/
   └── my-game/
       └── Build/
           ├── my-game.loader.js
           ├── my-game.data
           ├── my-game.framework.js
           └── my-game.wasm
   ```

5. Use the `UnityGame` component in your React pages:
   ```tsx
   <UnityGame
     buildPath="/unity-games/my-game"
     gameName="my-game"
   />
   ```

See `UNITY_SETUP.md` in the project root for detailed instructions.


