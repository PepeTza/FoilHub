import '@fontsource/chakra-petch/600.css';
import '@fontsource/chakra-petch/700.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import './styles/theme.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('No se encontró el elemento #root');
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
