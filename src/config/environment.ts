// Environment configuration for setting up the correct backend
export function setupEnvironment() {
  // Force local backend when running in production Docker
  if (window.location.hostname === 'localhost' && !import.meta.env.VITE_BACKEND_TYPE) {
    // Check if we're accessing the app on a port that suggests Docker
    const port = window.location.port;
    if (port && port !== '5173') { // 5173 is Vite dev server
      // Set global variables to force local backend
      (window as any).__FORCE_LOCAL_BACKEND__ = true;
      // Try to detect API port - assume it's current port + 139 (3001->3140, 3002->3141, etc.)
      const apiPort = parseInt(port) + 139;
      (window as any).__LOCAL_API_URL__ = `http://localhost:${apiPort}`;
      console.log(`🐳 Docker environment detected - using local backend at port ${apiPort}`);
    }
  }
}