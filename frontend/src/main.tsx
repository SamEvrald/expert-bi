declare module "*.css" {
  const content: { [className: string]: string };
}

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // <- ensure this is present and points to your compiled CSS (Tailwind or plain CSS)

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
