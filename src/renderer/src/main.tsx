import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

import { CreditProvider } from './contexts/CreditContext';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <CreditProvider>
      <App />
    </CreditProvider>
  </React.StrictMode>
);


