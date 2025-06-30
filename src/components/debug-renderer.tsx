import { useState, useEffect } from 'react';

export function DebugRenderer() {
  const [errors, setErrors] = useState<string[]>([]);
  const [authState, setAuthState] = useState<any>(null);
  const [renderCount, setRenderCount] = useState(0);

  // Capture errors
  useEffect(() => {
    const originalConsoleError = console.error;
    console.error = (...args) => {
      setErrors(prev => [...prev, args.join(' ')]);
      originalConsoleError(...args);
    };

    const originalOnError = window.onerror;
    window.onerror = (message, source, lineno, colno, error) => {
      setErrors(prev => [...prev, `${message} (${source}:${lineno}:${colno})`]);
      if (originalOnError) {
        return originalOnError(message, source, lineno, colno, error);
      }
      return false;
    };

    return () => {
      console.error = originalConsoleError;
      window.onerror = originalOnError;
    };
  }, []);

  // Increment render count on each render
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  });

  // Try to get auth state if available
  useEffect(() => {
    try {
      // @ts-ignore - attempt to access auth store if it exists
      const authStore = window.authStore || {};
      setAuthState(authStore);
    } catch (e) {
      console.log('Could not access auth store');
    }
  }, []);

  return (
    <div className="fixed top-0 left-0 right-0 bottom-0 z-50 overflow-auto p-4 bg-white text-black">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-red-600 mb-4">Debug Information</h1>
        
        <div className="mb-4 p-2 border border-gray-300 rounded">
          <p><strong>Render count:</strong> {renderCount}</p>
          <p><strong>Current time:</strong> {new Date().toISOString()}</p>
        </div>

        <h2 className="text-xl font-bold mb-2">Errors:</h2>
        {errors.length > 0 ? (
          <div className="p-2 mb-4 bg-red-50 border border-red-200 rounded">
            {errors.map((error, index) => (
              <div key={index} className="mb-2 p-2 border-b border-red-100">
                <pre className="whitespace-pre-wrap text-sm font-mono">{error}</pre>
              </div>
            ))}
          </div>
        ) : (
          <p className="mb-4 p-2 bg-green-50 border border-green-200 rounded">No errors captured</p>
        )}

        <h2 className="text-xl font-bold mb-2">Auth State:</h2>
        <pre className="p-2 bg-gray-50 border border-gray-200 rounded overflow-auto max-h-40">
          {JSON.stringify(authState, null, 2)}
        </pre>
      </div>
    </div>
  );
}
