import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Setting } from '../ui/Setting';

/* -------------------------------------------------
   PANTONE-inspired palette (hex approximations)
   Extracted/eyedropped from the provided image.
   Feel free to tweak to your brand standards.
-------------------------------------------------- */
const palette = {
  gardenia: '#EFE8E0',        // PANTONE 11-0604 Gardenia
  cornflower: '#7491C8',      // PANTONE 16-4031 Cornflower Blue
  viola: '#A693B8',           // PANTONE 16-3815 Viola
  roseTan: '#BA897D',         // PANTONE 16-1511 Rose Tan
  mochaMousse: '#A47764',     // PANTONE 17-1230 Mocha Mousse
  cobblestone: '#BAB2AD',     // PANTONE 16-1407 Cobblestone
  willow: '#899F6A',          // PANTONE 16-0632 Willow
  tendril: '#A6BE82',         // PANTONE 16-0123 Tendril (harmonized to sit above Willow)

  // Utility neutrals derived from the image
  espresso900: '#11100F',
  espresso800: '#171615',
  espresso700: '#1D1B1A',
  espresso600: '#242220',
};

/* -------------------------------------------
   Theme types (unchanged)
--------------------------------------------*/
export interface ThemeColors {
  // Primary colors
  primary: string;
  primaryHover: string;
  primaryActive: string;

  // Background colors
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceHover: string;

  // Border colors
  border: string;
  borderLight: string;
  borderDark: string;

  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;

  // State colors
  success: string;
  warning: string;
  error: string;
  info: string;

  // Accent colors
  accent: string;
  accentHover: string;

  // Component specific
  shadow: string;
  overlay: string;
  highlight: string;

  // Additional for UI
  successLight: string;
  warningLight: string;
  errorLight: string;
  infoLight: string;

  // Enhanced contrast colors
  textStrong: string;
  textWeak: string;
  surfaceStrong: string;
  surfaceWeak: string;
}

export interface ThemeSpacing {
  xs: string; sm: string; md: string; lg: string; xl: string; xxl: string; xxxl: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: { xs: string; sm: string; md: string; lg: string; xl: string; xxl: string; };
  fontWeight: { light: string; normal: string; medium: string; semibold: string; bold: string; };
  lineHeight: { tight: string; normal: string; relaxed: string; };
}

export interface ThemeBorderRadius {
  none: string; sm: string; md: string; lg: string; xl: string; full: string;
}

export interface ThemeShadows {
  none: string; sm: string; md: string; lg: string; xl: string; inner: string;
}

export interface ThemeButtonSizes {
  sm: { height: string; padding: string; fontSize: string; iconSize: string; borderRadius: string; };
  md: { height: string; padding: string; fontSize: string; iconSize: string; borderRadius: string; };
  lg: { height: string; padding: string; fontSize: string; iconSize: string; borderRadius: string; };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  buttonSizes: ThemeButtonSizes;
  transitions: { default: string; fast: string; slow: string; };
}

/* ===========================================
   LIGHT — "Porcelain Latte" — PANTONE aligned
   - Soft Gardenia bases
   - Primary = Cornflower Blue (interactive)
   - Accent = Mocha Mousse (brand warmth)
=========================================== */
const lightTheme: Theme = {
  colors: {
    // Primary (interactive focus)
    primary: palette.cornflower,                 // #7491C8
    primaryHover: '#6683BA',                     // ~12% darker
    primaryActive: '#5A78AF',

    // Gardenia + warm porcelain surfaces
    background: palette.gardenia,                // app chrome
    backgroundSecondary: '#EAE2DA',              // subtle step down from Gardenia
    surface: '#F4EEE7',                          // cards / panels
    surfaceHover: '#EDE5DD',

    // Warm grey borders from Cobblestone family
    border: '#D9CFC8',
    borderLight: '#E7DFD7',
    borderDark: '#C9BFB7',

    // Espresso-on-porcelain text
    text: '#2C2320',
    textSecondary: '#5B4E48',
    textMuted: '#8E847E',
    textInverse: '#FFFFFF',

    // Semantic states — harmonized to palette
    success: palette.willow,                     // Willow
    warning: '#D1A56C',                          // warm amber that fits the set
    error:   '#C96B5A',                          // soft terracotta (kept for clarity)
    info:    palette.cornflower,

    // Accent — Mocha Mousse
    accent: palette.mochaMousse,
    accentHover: '#8F6657',

    // Components
    shadow: 'rgba(61, 35, 19, 0.06)',
    overlay: 'rgba(40, 26, 18, 0.40)',
    highlight: '#F2E9E2',

    // Tints
    successLight: '#EDF2E6',
    warningLight: '#FFF1DB',
    errorLight:   '#F6E6E4',
    infoLight:    '#E8EFF9',

    // Enhanced contrast
    textStrong: '#1E1512',
    textWeak: '#A09088',
    surfaceStrong: '#E5DBD3',
    surfaceWeak: '#FAF7F2',
  },
  spacing: {
    xs: '4px', sm: '8px', md: '12px', lg: '16px', xl: '20px', xxl: '24px', xxxl: '32px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: { xs: '12px', sm: '13px', md: '15px', lg: '17px', xl: '19px', xxl: '22px' },
    fontWeight: { light: '300', normal: '400', medium: '500', semibold: '600', bold: '700' },
    lineHeight: { tight: '1.3', normal: '1.6', relaxed: '1.8' },
  },
  borderRadius: {
    none: '0', sm: '4px', md: '8px', lg: '10px', xl: '14px', full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.05), 0 1px 1px rgba(0,0,0,0.03)',
    md: '0 3px 8px rgba(16,24,20,0.08)',
    lg: '0 8px 20px rgba(16,24,20,0.10)',
    xl: '0 16px 32px rgba(16,24,20,0.12)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.04)',
  },
  buttonSizes: {
    sm: { height: '30px', padding: '0 10px', fontSize: '13px', iconSize: '16px', borderRadius: '6px' },
    md: { height: '38px', padding: '0 14px', fontSize: '15px', iconSize: '18px', borderRadius: '8px' },
    lg: { height: '46px', padding: '0 18px', fontSize: '17px', iconSize: '20px', borderRadius: '10px' },
  },
  transitions: {
    default: 'all 0.18s ease-out', fast: 'all 0.12s ease-out', slow: 'all 0.28s ease-out',
  },
};

/* ===========================================
   DARK — "Velvet Espresso" — PANTONE aligned
   - Deep espresso layers
   - Primary = lighter Cornflower for contrast
   - Accent = Mocha Mousse
=========================================== */
const darkTheme: Theme = {
  colors: {
    // Primary — Mocha Mousse for a true coffee vibe on dark
    primary: '#C89B85',
    primaryHover: '#BE8F79',
    primaryActive: '#B4836D',

    // Espresso–taupe stack (warm, muted, not muddy)
    background: '#25211F',           // café wall
    backgroundSecondary: '#292421',  // sidebar
    surface: '#2E2826',              // cards / panels
    surfaceHover: '#352E2B',

    // Borders — warm graphite
    border: '#3A332F',
    borderLight: '#473F3B',
    borderDark: '#2E2724',

    // Text — warm porcelain on espresso
    text: '#F3EEEA',
    textSecondary: '#D9CFC8',
    textMuted: '#B7AAA4',
    textInverse: '#0F0E0D',

    // States (subtle, caffeinated undertones)
    success: '#94B17E',
    warning: '#D2A274',
    error:   '#C77C6F',
    info:    '#A1BDE6',              // gentle cornflower for clarity

    // Accent — Mocha for focus rings / chips
    accent: palette.mochaMousse,
    accentHover: '#B78976',

    // Components
    shadow: 'rgba(0, 0, 0, 0.45)',
    overlay: 'rgba(14, 10, 8, 0.68)',
    highlight: '#302A27',

    // State tints
    successLight: '#1E261C',
    warningLight: '#272016',
    errorLight:   '#261A18',
    infoLight:    '#182231',

    // Enhanced contrast
    textStrong: '#FAF7F4',
    textWeak: '#B9ADA7',
    surfaceStrong: '#292421',
    surfaceWeak: '#352E2B',
  },
  spacing: lightTheme.spacing,
  typography: lightTheme.typography,
  borderRadius: lightTheme.borderRadius,
  shadows: {
    none: 'none',
    sm: '0 1px 2px rgba(0,0,0,0.22)',
    md: '0 4px 10px rgba(0,0,0,0.32)',
    lg: '0 10px 24px rgba(0,0,0,0.38)',
    xl: '0 18px 40px rgba(0,0,0,0.44)',
    inner: 'inset 0 2px 4px rgba(0,0,0,0.28)',
  },
  buttonSizes: lightTheme.buttonSizes,
  transitions: lightTheme.transitions,
};

/* -------------------------------------------
   Theme context
--------------------------------------------*/
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

/* -------------------------------------------
   Provider (unchanged logic)
--------------------------------------------*/
interface ThemeProviderProps {
  children: ReactNode;
  settingsRecord?: Record<Setting, any>;
  updateSettings?: (settings: Partial<Record<Setting, any>>) => void;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  settingsRecord,
  updateSettings,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize from settings or OS preference
  useEffect(() => {
    if (settingsRecord && settingsRecord[Setting.DARK_MODE] !== undefined) {
      setIsDarkMode(!!settingsRecord[Setting.DARK_MODE]);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const m = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(m.matches);
    }
  }, [settingsRecord]);

  // React to OS changes when user hasn't explicitly set a pref
  useEffect(() => {
    if (settingsRecord && settingsRecord[Setting.DARK_MODE] !== undefined) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    m.addEventListener?.('change', handler);
    return () => m.removeEventListener?.('change', handler);
  }, [settingsRecord]);

  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    if (updateSettings) updateSettings({ [Setting.DARK_MODE]: isDark });
  };
  const toggleTheme = () => setTheme(!isDarkMode);

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Apply CSS custom properties to :root
  useEffect(() => {
    const root = document.documentElement;

    const flattenObject = (obj: any, prefix = '') =>
      Object.keys(obj).reduce((acc, k) => {
        const pre = prefix.length ? prefix + '-' : '';
        if (typeof obj[k] === 'object' && obj[k] !== null) {
          Object.assign(acc, flattenObject(obj[k], pre + k));
        } else {
          acc[pre + k] = obj[k];
        }
        return acc;
      }, {} as Record<string, string>);

    const themeVariables = {
      color: theme.colors,
      spacing: theme.spacing,
      'font-size': theme.typography.fontSize,
      'font-weight': theme.typography.fontWeight,
      'line-height': theme.typography.lineHeight,
      'border-radius': theme.borderRadius,
      shadow: theme.shadows,
      transition: theme.transitions,
    };

    Object.entries(themeVariables).forEach(([category, values]) => {
      const flatValues = flattenObject(values);
      Object.entries(flatValues).forEach(([key, value]) => {
        root.style.setProperty(`--${category}-${key}`, value);
      });
    });

    root.style.setProperty('--font-family', theme.typography.fontFamily);
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [theme, isDarkMode]);

  const contextValue: ThemeContextType = { theme, isDarkMode, toggleTheme, setTheme };
  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

/* -------------------------------------------
   Hook
--------------------------------------------*/
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

/* -------------------------------------------
   Optional theme-aware styles (unchanged)
--------------------------------------------*/
export const getThemeStyles = (theme: Theme) => {
  return {
    button: {
      primary: {
        background: theme.colors.primary,
        color: theme.colors.textInverse, // light: #fff; dark: espresso text
        border: `1px solid ${theme.colors.primary}`,
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        cursor: 'pointer',
        transition: theme.transitions.default,
        ':hover': { background: theme.colors.primaryHover },
        ':active': { background: theme.colors.primaryActive },
        ':focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 3px ${theme.colors.accent}40`,
        },
      },
      secondary: {
        background: theme.colors.surface,
        color: theme.colors.text,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.md,
        padding: `${theme.spacing.sm} ${theme.spacing.lg}`,
        fontSize: theme.typography.fontSize.md,
        fontWeight: theme.typography.fontWeight.medium,
        cursor: 'pointer',
        transition: theme.transitions.default,
        ':hover': { background: theme.colors.surfaceHover },
        ':focus-visible': {
          outline: 'none',
          boxShadow: `0 0 0 3px ${theme.colors.accent}33`,
        },
      },
    },
    input: {
      background: theme.colors.surface,
      color: theme.colors.text,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.md,
      padding: `${theme.spacing.sm} ${theme.spacing.md}`,
      fontSize: theme.typography.fontSize.md,
      transition: theme.transitions.default,
      ':focus': {
        borderColor: theme.colors.accent,
        outline: 'none',
        boxShadow: `0 0 0 3px ${theme.colors.accent}40`,
      },
    },
    card: {
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.lg,
      boxShadow: theme.shadows.sm,
      transition: theme.transitions.default,
    },
    panel: {
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: theme.borderRadius.md,
      boxShadow: theme.shadows.md,
    },
  };
};

export default ThemeContext;
