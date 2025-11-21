// src/shared/components/theme/ThemePalettePicker.tsx

import React, { useState, useEffect, useRef } from 'react';
import { Palette, Moon, Sun, Check } from 'lucide-react';
import { THEME_CONFIG, migrateFromLegacyTheme } from './themeConfig';

// ============================================================
// DEFINICION DE PALETAS - GUINDA COMO PRINCIPAL
// ============================================================

export const THEME_PALETTES = {
  // GUINDA - Paleta principal (Gobierno Mexicano)
  guinda: {
    name: 'Guinda Institucional',
    primary: '#9a1f1f',
    secondary: '#d9a316',
    accent: '#c22a2a',
    colors: ['#fdf2f2', '#9a1f1f', '#801d1d', '#6b1e1e'],
    description: 'Estilo gobierno mexicano (Default)',
    shades: {
      50: '#fdf2f2',
      100: '#fde3e3',
      200: '#fbcccc',
      300: '#f8a8a8',
      400: '#f17575',
      500: '#e54949',
      600: '#c22a2a',
      700: '#9a1f1f',
      800: '#801d1d',
      900: '#6b1e1e'
    }
  },
  blue: {
    name: 'Azul Corporativo',
    primary: '#3B82F6',
    secondary: '#1E40AF',
    accent: '#60A5FA',
    colors: ['#EFF6FF', '#3B82F6', '#1E40AF', '#1E3A8A'],
    description: 'Azul profesional clasico',
    shades: {
      50: '#EFF6FF',
      100: '#DBEAFE',
      200: '#BFDBFE',
      300: '#93C5FD',
      400: '#60A5FA',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
      800: '#1E40AF',
      900: '#1E3A8A'
    }
  },
  purple: {
    name: 'Morado Elegante',
    primary: '#8B5CF6',
    secondary: '#7C3AED',
    accent: '#A78BFA',
    colors: ['#F5F3FF', '#8B5CF6', '#7C3AED', '#6D28D9'],
    description: 'Violeta sofisticado',
    shades: {
      50: '#F5F3FF',
      100: '#EDE9FE',
      200: '#DDD6FE',
      300: '#C4B5FD',
      400: '#A78BFA',
      500: '#8B5CF6',
      600: '#7C3AED',
      700: '#6D28D9',
      800: '#5B21B6',
      900: '#4C1D95'
    }
  },
  teal: {
    name: 'Verde Azulado',
    primary: '#14b8a6',
    secondary: '#0d9488',
    accent: '#2dd4bf',
    colors: ['#f0fdfa', '#14b8a6', '#0d9488', '#0f766e'],
    description: 'Verde menta empresarial',
    shades: {
      50: '#f0fdfa',
      100: '#ccfbf1',
      200: '#99f6e4',
      300: '#5eead4',
      400: '#2dd4bf',
      500: '#14b8a6',
      600: '#0d9488',
      700: '#0f766e',
      800: '#115e59',
      900: '#134e4a'
    }
  },
  orange: {
    name: 'Naranja Calido',
    primary: '#F97316',
    secondary: '#EA580C',
    accent: '#FB923C',
    colors: ['#FFF7ED', '#F97316', '#EA580C', '#C2410C'],
    description: 'Naranja energizante',
    shades: {
      50: '#FFF7ED',
      100: '#FFEDD5',
      200: '#FED7AA',
      300: '#FDBA74',
      400: '#FB923C',
      500: '#F97316',
      600: '#EA580C',
      700: '#C2410C',
      800: '#9A3412',
      900: '#7C2D12'
    }
  },
  slate: {
    name: 'Gris Ejecutivo',
    primary: '#475569',
    secondary: '#334155',
    accent: '#64748b',
    colors: ['#f8fafc', '#475569', '#334155', '#1e293b'],
    description: 'Profesional y sobrio',
    shades: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a'
    }
  },
  // Alias "red" apunta a los mismos colores que guinda
  red: {
    name: 'Rojo Institucional',
    primary: '#9a1f1f',
    secondary: '#d9a316',
    accent: '#c22a2a',
    colors: ['#fdf2f2', '#9a1f1f', '#801d1d', '#6b1e1e'],
    description: 'Estilo gobierno mexicano',
    shades: {
      50: '#fdf2f2',
      100: '#fde3e3',
      200: '#fbcccc',
      300: '#f8a8a8',
      400: '#f17575',
      500: '#e54949',
      600: '#c22a2a',
      700: '#9a1f1f',
      800: '#801d1d',
      900: '#6b1e1e'
    }
  }
} as const;

export type PaletteKey = keyof typeof THEME_PALETTES;
export type ThemeMode = 'light' | 'dark';

// ============================================================
// FUNCION PRINCIPAL: APLICAR PALETA
// ============================================================

export const applyPalette = (paletteKey: PaletteKey, mode: ThemeMode) => {
  try {
    const palette = THEME_PALETTES[paletteKey];
    const root = document.documentElement;

    // 1. Aplicar CSS custom properties principales
    root.style.setProperty('--theme-primary', palette.primary);
    root.style.setProperty('--theme-secondary', palette.secondary);
    root.style.setProperty('--theme-accent', palette.accent);

    // 2. Aplicar todos los tonos de la paleta (50-900)
    Object.entries(palette.shades).forEach(([shade, color]) => {
      root.style.setProperty(`--theme-primary-${shade}`, color);
    });

    // 3. Aplicar colores de iconos especificos para cada modo
    if (mode === 'dark') {
      root.style.setProperty('--theme-icon-primary', palette.shades[400]);
      root.style.setProperty('--theme-icon-interactive', palette.shades[300]);
      root.style.setProperty('--theme-icon-hover', palette.shades[200]);
      root.style.setProperty('--theme-text-accent', palette.shades[400]);
      root.style.setProperty('--theme-border-accent', palette.shades[500]);
    } else {
      root.style.setProperty('--theme-icon-primary', palette.shades[600]);
      root.style.setProperty('--theme-icon-interactive', palette.shades[500]);
      root.style.setProperty('--theme-icon-hover', palette.shades[700]);
      root.style.setProperty('--theme-text-accent', palette.shades[600]);
      root.style.setProperty('--theme-border-accent', palette.shades[300]);
    }

    // 4. Aplicar colores de fondo y texto segun el modo
    if (mode === 'dark') {
      root.style.setProperty('--theme-bg-primary', '#0F172A');
      root.style.setProperty('--theme-bg-secondary', '#1E293B');
      root.style.setProperty('--theme-text-primary', '#F8FAFC');
      root.style.setProperty('--theme-text-secondary', '#CBD5E1');

      // Aplicar modo oscuro al documento
      document.documentElement.setAttribute('data-theme', 'dark');
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F8FAFC';
    } else {
      root.style.setProperty('--theme-bg-primary', '#FFFFFF');
      root.style.setProperty('--theme-bg-secondary', '#F8FAFC');
      root.style.setProperty('--theme-text-primary', '#1E293B');
      root.style.setProperty('--theme-text-secondary', '#64748B');

      // Aplicar modo claro al documento
      document.documentElement.setAttribute('data-theme', 'light');
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }

    // 5. Actualizar meta theme-color para moviles
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', palette.primary);
    } else {
      const meta = document.createElement('meta');
      meta.name = 'theme-color';
      meta.content = palette.primary;
      document.getElementsByTagName('head')[0].appendChild(meta);
    }

    // 6. Forzar recalculo de estilos
    setTimeout(() => {
      document.body.offsetHeight; // Trigger repaint
    }, 50);

    // 7. Guardar en localStorage
    localStorage.setItem(THEME_CONFIG.storageKeys.palette, paletteKey);
    localStorage.setItem(THEME_CONFIG.storageKeys.mode, mode);

    console.log(`Tema aplicado: ${palette.name} (${mode})`);
  } catch (error) {
    console.error('Error applying theme:', error);
  }
};

// ============================================================
// COMPONENTE PRINCIPAL
// ============================================================

interface ThemePalettePickerProps {
  className?: string;
}

export const ThemePalettePicker: React.FC<ThemePalettePickerProps> = ({
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [currentPalette, setCurrentPalette] = useState<PaletteKey>('guinda');
  const [themeMode, setThemeMode] = useState<ThemeMode>('light');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Cargar configuracion desde localStorage
  useEffect(() => {
    try {
      migrateFromLegacyTheme();

      const savedPalette = localStorage.getItem(THEME_CONFIG.storageKeys.palette) as PaletteKey;
      const savedMode = localStorage.getItem(THEME_CONFIG.storageKeys.mode) as ThemeMode;

      if (savedPalette && THEME_PALETTES[savedPalette]) {
        setCurrentPalette(savedPalette);
      } else {
        setCurrentPalette(THEME_CONFIG.defaultPalette as PaletteKey);
      }

      if (savedMode && ['light', 'dark'].includes(savedMode)) {
        setThemeMode(savedMode);
      } else {
        setThemeMode(THEME_CONFIG.defaultMode as ThemeMode);
      }
    } catch (error) {
      console.error('Error loading theme config:', error);
    }
  }, []);

  // Cerrar dropdown al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Aplicar paleta inicial y cuando cambien los valores
  useEffect(() => {
    applyPalette(currentPalette, themeMode);
  }, [currentPalette, themeMode]);

  // Cambiar paleta
  const handlePaletteChange = (paletteKey: PaletteKey) => {
    setCurrentPalette(paletteKey);
    applyPalette(paletteKey, themeMode);

    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { palette: paletteKey, mode: themeMode }
    }));
  };

  // Alternar modo oscuro/claro
  const toggleThemeMode = () => {
    const newMode = themeMode === 'light' ? 'dark' : 'light';

    // Aplicar cambios inmediatamente
    if (newMode === 'dark') {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      document.body.style.backgroundColor = '#0F172A';
      document.body.style.color = '#F8FAFC';
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      document.body.style.backgroundColor = '';
      document.body.style.color = '';
    }

    setThemeMode(newMode);
    applyPalette(currentPalette, newMode);

    window.dispatchEvent(new CustomEvent('theme-changed', {
      detail: { palette: currentPalette, mode: newMode }
    }));
  };

  const currentPaletteConfig = THEME_PALETTES[currentPalette];

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Boton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 transition-colors bg-white dark:bg-gray-800"
        title="Cambiar paleta de colores"
      >
        <Palette className="w-4 h-4" style={{ color: currentPaletteConfig.primary }} />
        <div className="flex space-x-1">
          {currentPaletteConfig.colors.slice(1, 4).map((color, index) => (
            <div
              key={index}
              className="w-3 h-3 rounded-full border border-gray-200 dark:border-gray-600"
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-600 z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100">Paleta de Colores</h3>
              <button
                onClick={toggleThemeMode}
                className={`flex items-center space-x-1 px-3 py-2 rounded-md border text-xs transition-all duration-300 ${
                  themeMode === 'dark'
                    ? 'bg-gray-600 text-yellow-400 border-gray-500'
                    : 'bg-white text-gray-700 border-gray-300'
                }`}
                title={`Cambiar a modo ${themeMode === 'light' ? 'oscuro' : 'claro'}`}
              >
                {themeMode === 'light' ? (
                  <>
                    <Moon className="w-4 h-4 text-gray-500" />
                    <span className="font-medium">Modo Oscuro</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-4 h-4 text-yellow-400" />
                    <span className="font-medium text-yellow-400">Modo Claro</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Selecciona la paleta que prefieras
            </p>
          </div>

          {/* Lista de paletas */}
          <div className="p-2 max-h-64 overflow-y-auto">
            {(Object.entries(THEME_PALETTES) as [PaletteKey, typeof THEME_PALETTES[PaletteKey]][]).map(([key, palette]) => (
              <button
                key={key}
                onClick={() => handlePaletteChange(key)}
                className={`w-full flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                  currentPalette === key ? 'bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-500' : ''
                }`}
              >
                {/* Muestra de colores */}
                <div className="flex space-x-1">
                  {palette.colors.map((color, index) => (
                    <div
                      key={index}
                      className="w-4 h-4 rounded-full border border-gray-200 dark:border-gray-600 shadow-sm"
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>

                {/* Informacion */}
                <div className="flex-1 text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-100 flex items-center">
                    {palette.name}
                    {currentPalette === key && (
                      <Check className="w-3 h-3 ml-2" style={{ color: palette.primary }} />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{palette.description}</div>
                </div>
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
              <span>Modo: <strong className="text-gray-700 dark:text-gray-200">{themeMode === 'light' ? 'Claro' : 'Oscuro'}</strong></span>
              <span>Actual: <strong style={{ color: currentPaletteConfig.primary }}>{currentPaletteConfig.name}</strong></span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================
// HOOK: useTheme
// ============================================================

export const useTheme = () => {
  const [palette, setPalette] = useState<PaletteKey>('guinda');
  const [mode, setMode] = useState<ThemeMode>('light');

  useEffect(() => {
    const handleThemeChange = (event: CustomEvent) => {
      setPalette(event.detail.palette);
      setMode(event.detail.mode);
    };

    // Cargar estado inicial
    const savedPalette = localStorage.getItem(THEME_CONFIG.storageKeys.palette) as PaletteKey;
    const savedMode = localStorage.getItem(THEME_CONFIG.storageKeys.mode) as ThemeMode;

    if (savedPalette && THEME_PALETTES[savedPalette]) setPalette(savedPalette);
    if (savedMode) setMode(savedMode);

    window.addEventListener('theme-changed', handleThemeChange as EventListener);
    return () => window.removeEventListener('theme-changed', handleThemeChange as EventListener);
  }, []);

  return {
    palette,
    mode,
    paletteConfig: THEME_PALETTES[palette],
    isLight: mode === 'light',
    isDark: mode === 'dark'
  };
};

export default ThemePalettePicker;
