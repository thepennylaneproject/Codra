import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import './app/globals.css';
import './lib/typography.css';
import { analytics } from './lib/analytics';

analytics.init();

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <App />
    </React.StrictMode>
);