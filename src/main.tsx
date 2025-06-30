import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ToastProvider } from './components/ui/toast';
import { ThemeProvider } from './components/theme-provider';
import App from './App';
import './index.css';

// Maximizing debug logging
console.log('MAIN: main.tsx executing');
const rootElement = document.getElementById('root');
console.log('MAIN: Root element found:', rootElement);

try {
  console.log('MAIN: Attempting to create root and render app');
  const root = createRoot(rootElement!);
  
  console.log('MAIN: Root created, rendering app with BrowserRouter');
  root.render(
    <StrictMode>
      <ThemeProvider>
        <BrowserRouter>
          <ToastProvider>
            <App />
          </ToastProvider>
        </BrowserRouter>
      </ThemeProvider>
    </StrictMode>
  );
  console.log('MAIN: Render called successfully');
} catch (error) {
  console.error('MAIN: Fatal error in root rendering:', error);
  // Display error directly in DOM as fallback
  document.body.innerHTML = `
    <div style="padding: 20px; font-family: sans-serif; max-width: 800px; margin: 0 auto;">
      <h1 style="color: red;">React Rendering Error</h1>
      <pre style="background: #f0f0f0; padding: 10px; overflow: auto;">${error?.toString() || 'Unknown error'}</pre>
    </div>
  `;
}

console.log('MAIN: Script execution complete');