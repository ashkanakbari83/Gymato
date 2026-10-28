// App entry point: mounts <App /> and loads the style parts in cascade order.
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import './styles/tokens.css';
import './styles/layout.css';
import './styles/ui.css';
import './styles/pages.css';
import './styles/marketplace.css';
import './styles/modal.css';
import './styles/stickman.css';
import './styles/player.css';
import './styles/auth.css';
import './styles/responsive.css';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
