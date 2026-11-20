import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import App from './App';
import { RapportProvider } from './context/RapportContext';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <RapportProvider>
        <App />
      </RapportProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
