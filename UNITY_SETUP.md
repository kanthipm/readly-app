# Unity Game Integration Guide

This guide explains how to integrate Unity games into your Next.js application.

## Prerequisites

- Unity Hub and Unity Editor installed
- Your Unity game project ready to build
- Node.js and npm installed (already set up)

## Step 1: Build Your Unity Game for WebGL

1. Open your Unity project in Unity Editor
2. Go to **File → Build Settings**
3. Select **WebGL** platform (if not already selected, click it and click "Switch Platform")
4. Click **Player Settings** and configure:
   - **Compression Format**: Brotli (recommended) or Gzip
   - **Resolution and Presentation**: Set your preferred default canvas size
5. Click **Build** and select a temporary build folder (e.g., `C:\UnityBuilds\my-game`)
6. Unity will create a folder with your game files

## Step 2: Copy Unity Build to Public Folder

1. Unity creates a build folder structure like this:
   ```
   my-game/
   ├── Build/
   │   ├── my-game.loader.js
   │   ├── my-game.data
   │   ├── my-game.framework.js
   │   └── my-game.wasm
   └── TemplateData/ (optional, not needed for react-unity-webgl)
   ```

2. Copy the entire `Build` folder to your Next.js project:
   ```
   public/
   └── unity-games/
       └── my-game/
           └── Build/
               ├── my-game.loader.js
               ├── my-game.data
               ├── my-game.framework.js
               └── my-game.wasm
   ```

## Step 3: Use the UnityGame Component

The `UnityGame` component is already created at `src/components/UnityGame.tsx`. You can use it in any page or component:

```tsx
import UnityGame from "@/src/components/UnityGame";

export default function MyPage() {
  return (
    <UnityGame
      buildPath="/unity-games/my-game"
      gameName="my-game"
      width="960px"
      height="600px"
      onLoad={() => console.log("Game loaded!")}
      onError={(error) => console.error(error)}
    />
  );
}
```

### Component Props

- **buildPath** (required): Path to your Unity build directory in the public folder
  - Example: `"/unity-games/my-game"`
- **gameName** (required): Name of your Unity build (without extension)
  - Example: `"my-game"` (will look for `my-game.loader.js`, `my-game.data`, etc.)
- **width** (optional): Canvas width, defaults to `"960px"`
- **height** (optional): Canvas height, defaults to `"600px"`
- **onLoad** (optional): Callback when game finishes loading
- **onError** (optional): Callback when an error occurs
- **className** (optional): Additional CSS classes for the container

## Step 4: Example Pages

- **Example Unity Game Page**: `src/app/unity-game/page.tsx`
  - Visit `/unity-game` to see a working example
  - Update the `gameName` and `buildPath` to match your Unity build

## Communication Between Unity and React

### Calling JavaScript from Unity

In your Unity C# scripts, you can call JavaScript functions:

```csharp
using UnityEngine;

public class MyScript : MonoBehaviour
{
    void Start()
    {
        // Call a JavaScript function
        Application.ExternalCall("GameLoaded", "Hello from Unity!");
    }
}
```

In your React component:

```tsx
useEffect(() => {
  // Create a global function for Unity to call
  (window as any).GameLoaded = (message: string) => {
    console.log(message); // "Hello from Unity!"
  };
}, []);
```

### Calling Unity from JavaScript

In your React component, use the Unity instance:

```tsx
import { useUnityContext } from "react-unity-webgl";

function MyComponent() {
  const { sendMessage } = useUnityContext({
    // ... unity context config
  });

  const handleButtonClick = () => {
    // Send message to Unity GameObject
    sendMessage("GameObjectName", "MethodName", "parameter");
  };

  return <button onClick={handleButtonClick}>Send to Unity</button>;
}
```

## Troubleshooting

### Game doesn't load
- Check browser console for errors
- Verify all build files are in the correct location
- Ensure file names match (case-sensitive on Linux/Mac servers)
- Check that `gameName` prop matches your actual build filename

### Build files are too large
- Enable compression in Unity Build Settings (Brotli recommended)
- Consider code splitting or reducing game assets
- Use Unity's Asset Bundle system for large games

### CORS errors
- Unity builds served from Next.js public folder shouldn't have CORS issues
- If hosting builds on external CDN, ensure proper CORS headers

### Performance issues
- WebGL games can be resource-intensive
- Test on target devices/browsers
- Consider using Unity's Performance Profiler

## Best Practices

1. **File Naming**: Use consistent, lowercase names for your Unity builds
2. **Organizing Games**: Place each game in its own folder under `public/unity-games/`
3. **Loading States**: Always show loading indicators while the game loads
4. **Error Handling**: Handle errors gracefully with user-friendly messages
5. **Responsive Design**: Consider using responsive units or media queries for mobile

## Additional Resources

- [Unity WebGL Documentation](https://docs.unity3d.com/Manual/webgl.html)
- [react-unity-webgl Documentation](https://react-unity-webgl.dev/)
- [Unity WebGL Optimization Guide](https://docs.unity3d.com/Manual/webgl-performance.html)


