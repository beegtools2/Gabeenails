// Gabee Studio - Live Application Entry Point (Forced Re-compilation Build v2.5)
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { SiteImagesProvider } from './context/SiteImagesContext';
import './index.css';

createRoot(document.getElementById('root')!).render(<SiteImagesProvider><App /></SiteImagesProvider>);
