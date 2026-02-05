import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import ChartComparison from './components/ChartComparison';
import './index.css';
import './styles/tokens.css';

// Simple hash-based router
function Router() {
    const [route, setRoute] = useState(window.location.hash);

    useEffect(() => {
        const handleHashChange = () => setRoute(window.location.hash);
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, []);

    if (route === '#/chart-comparison') {
        return <ChartComparison />;
    }
    return <App />;
}

const rootEl = document.getElementById('root');
if (!rootEl) {
    throw new Error('Root element #root not found in index.html');
}

createRoot(rootEl).render(
    <React.StrictMode>
        <Router />
    </React.StrictMode>
);
