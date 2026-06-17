import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './i18n'
import App from './App.jsx'
import ErrorBoundary from './components/common/ErrorBoundary.jsx'

document.documentElement.classList.remove('dark');
localStorage.removeItem('spoken-edge-theme');

const apiUrl = import.meta.env.VITE_API_BASE_URL;
if (!apiUrl) {
  document.getElementById('root').innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;font-family:sans-serif;background:#fef2f2;padding:2rem;">
      <div style="background:white;border:1px solid #fca5a5;border-radius:12px;padding:2rem;max-width:480px;text-align:center;">
        <h2 style="color:#dc2626;font-size:1.25rem;font-weight:700;margin-bottom:0.5rem;">Configuration Error</h2>
        <p style="color:#6b7280;font-size:0.875rem;">
          <code>VITE_API_BASE_URL</code> is not set.<br/>
          Create a <code>.env</code> file in the <code>frontend/</code> directory with:<br/>
          <code style="background:#f3f4f6;padding:2px 6px;border-radius:4px;">VITE_API_BASE_URL=http://localhost:5001/api</code>
        </p>
      </div>
    </div>`;
} else {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </StrictMode>,
  );
}
