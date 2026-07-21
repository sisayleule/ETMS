import React from 'react' // Import React for component rendering and JSX context structures
import ReactDOM from 'react-dom/client' // Import ReactDOM for rendering to the browser DOM
import './index.css' // Import global styles including tailwind and google fonts
import App from './App' // Import the root App component with router configurations

const rootElement = document.getElementById('root') // Get the root DOM element from index.html

if (rootElement) { // Check if the root DOM element exists in the HTML document to prevent null runtime crashes
  ReactDOM.createRoot(rootElement).render( // Create a React root and render the App component inside it
    <React.StrictMode> {/* Enable StrictMode to perform development-only checks and warn about stale methods */}
      <App /> {/* Mount the primary root App component containing global routes */}
    </React.StrictMode> // Close StrictMode tags
  ) // Close render call
} // Close null check block
