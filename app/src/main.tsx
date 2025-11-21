import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { NextUIProvider } from '@nextui-org/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { AuthProvider } from './contexts/AuthContext';
import ErrorBoundary from './components/ErrorBoundary';
import App from './App';
import './index.css';

// Importar e inicializar sistema de temas
import { applyPalette, THEME_PALETTES, THEME_CONFIG } from './shared/components/theme';
import type { PaletteKey, ThemeMode } from './shared/components/theme';

// Aplicar tema guardado o por defecto al cargar
const initTheme = () => {
  const savedPalette = localStorage.getItem(THEME_CONFIG.storageKeys.palette) as PaletteKey;
  const savedMode = localStorage.getItem(THEME_CONFIG.storageKeys.mode) as ThemeMode;

  const palette = (savedPalette && THEME_PALETTES[savedPalette])
    ? savedPalette
    : (THEME_CONFIG.defaultPalette as PaletteKey);
  const mode = (savedMode && ['light', 'dark'].includes(savedMode))
    ? savedMode
    : (THEME_CONFIG.defaultMode as ThemeMode);

  applyPalette(palette, mode);
};

initTheme();

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos
      retry: 1,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <NextUIProvider>
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                richColors
                closeButton
                toastOptions={{
                  duration: 4000,
                }}
              />
            </AuthProvider>
          </NextUIProvider>
        </QueryClientProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </StrictMode>
);
