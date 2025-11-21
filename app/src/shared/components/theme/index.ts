// src/shared/components/theme/index.ts

export {
  ThemePalettePicker,
  useTheme,
  applyPalette,
  THEME_PALETTES,
  type PaletteKey,
  type ThemeMode
} from './ThemePalettePicker';

export {
  THEME_CONFIG,
  isValidThemeConfig,
  migrateFromLegacyTheme,
  resetThemeToDefault
} from './themeConfig';
