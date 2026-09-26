import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Komiya App Error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center font-bold text-xl">
              ⚠️
            </div>
            <h2 className="text-xl font-bold text-white">Une erreur s'est produite</h2>
            <p className="text-xs text-slate-400 leading-relaxed">
              L'application a rencontré une difficulté lors de l'affichage. Vous pouvez réinitialiser les données locales.
            </p>
            <div className="p-3 bg-slate-800 rounded-xl text-[11px] font-mono text-rose-300 overflow-x-auto max-h-32">
              {this.state.error?.toString()}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  localStorage.removeItem('komiya_app_state');
                  window.location.reload();
                }}
                className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl"
              >
                Réinitialiser & Recharger
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
