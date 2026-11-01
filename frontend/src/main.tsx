import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

// React attaches the top-level App component to the empty root element in index.html.
// StrictMode helps reveal unsafe side effects while developing.
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
