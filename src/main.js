// src/main.js

// 1. Import the Farcaster Mini-App SDK using the ES Module syntax.
// This is what Vite needs to correctly bundle the library.
import { sdk } from '@farcaster/miniapp-sdk';

// 2. Import your snake game logic.
// This tells Vite to include your snake.js file in the final bundle.
import './snake.js';

// 3. Expose the SDK globally so your existing snake.js file can access it.
// Your snake.js code checks for `window.miniapp`, so we assign the imported
// `sdk` object to that global variable.
window.miniapp = sdk;

console.log("Main entry point loaded. Farcaster Mini-App SDK is now available globally.");

// Your game's DOMContentLoaded listener in snake.js will handle the rest.
// The browser will automatically run the snake.js code once it's loaded.
