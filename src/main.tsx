import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import '@fontsource/vazirmatn/arabic-400.css';
import '@fontsource/vazirmatn/arabic-500.css';
import '@fontsource/vazirmatn/arabic-700.css';
import '@fontsource/vazirmatn/arabic-800.css';
import '@fontsource/vazirmatn/latin-400.css';
import '@fontsource/vazirmatn/latin-700.css';
import './index.css';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
