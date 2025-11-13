import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';
import './styles/tokens.css';

const rootEl = document.getElementById('root');
if (!rootEl) {
    throw new Error('Root element #root not found in index.html');
}

createRoot(rootEl).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);
