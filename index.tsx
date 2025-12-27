import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  document.body.innerHTML = '<div style="color:red; font-size: 20px; padding: 20px;">CRITICAL: Root element not found!</div>';
  throw new Error("Could not find root element to mount to");
}

try {
  console.log("Mounting React App...");
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
  console.log("React App Mount Success");
} catch (err: any) {
  console.error("React Internal Error:", err);
  rootElement.innerHTML = `<div style="color:red; padding: 20px; border: 2px solid red;">
    <h1>App Crash Check</h1>
    <pre>${err?.message || String(err)}</pre>
    <pre>${err?.stack || ''}</pre>
  </div>`;
}

// Global Error Handler for unhandled promise rejections or script errors
window.addEventListener('error', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; top: 0; left: 0; width: 100%; background: rgba(255,0,0,0.9); color: white; padding: 10px; z-index: 9999;';
  errorDiv.textContent = `Global Error: ${event.message}`;
  document.body.appendChild(errorDiv);
});

window.addEventListener('unhandledrejection', (event) => {
  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = 'position: fixed; bottom: 0; left: 0; width: 100%; background: rgba(255,100,0,0.9); color: white; padding: 10px; z-index: 9999;';
  errorDiv.textContent = `Promise Rejection: ${event.reason}`;
  document.body.appendChild(errorDiv);
});