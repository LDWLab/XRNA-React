import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import { Setting } from '../ui/Setting';

const palette = {
  gardenia: '#EFE8E0',
  cornflower: '#7491C8',
  mochaMousse: '#A47764',
  willow: '#899F6A',
};

export interface ThemeColors {
  primary: string;
  primaryHover: string;
  primaryActive: string;
  background: string;
  backgroundSecondary: string;
  surface: string;
  surfaceHover: string;
  border: string;
  borderLight: string;
  borderDark: string;
  text: string;
  textSecondary: string;
  textMuted: string;
  textInverse: string;
  success: string;
  warning: string;
  error: string;
  info: string;
  accent: string;
  accentHover: string;
  shadow: string;
  overlay: string;
  highlight: string;
  successLight: string;
  warningLight: string;
  errorLight: string;
  infoLight: string;
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
  colorPalleteCircleFills: [string, string, string];
}

const lightTheme: Theme = {
  colors: {
    primary: palette.cornflower,
    primaryHover: '#6683BA',
    primaryActive: '#5A78AF',
    background: palette.gardenia,
    backgroundSecondary: '#EAE2DA',
    surface: '#F4EEE7',
    surfaceHover: '#EDE5DD',
    border: '#D9CFC8',
    borderLight: '#E7DFD7',
    borderDark: '#C9BFB7',
    text: '#2C2320',
    textSecondary: '#5B4E48',
    textMuted: '#8E847E',
    textInverse: '#FFFFFF',
    success: palette.willow,
    warning: '#D1A56C',
    error: '#C96B5A',
    info: palette.cornflower,
    accent: palette.mochaMousse,
    accentHover: '#8F6657',
    shadow: 'rgba(61, 35, 19, 0.06)',
    overlay: 'rgba(40, 26, 18, 0.40)',
    highlight: '#F2E9E2',
    successLight: '#EDF2E6',
    warningLight: '#FFF1DB',
    errorLight: '#F6E6E4',
    infoLight: '#E8EFF9',
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
  colorPalleteCircleFills: ["#E8C26A", "#A9E890", "#E890C0"]
};

const darkTheme: Theme = {
  colors: {
    primary: '#C89B85',
    primaryHover: '#BE8F79',
    primaryActive: '#B4836D',
    background: '#25211F',
    backgroundSecondary: '#292421',
    surface: '#2E2826',
    surfaceHover: '#352E2B',
    border: '#3A332F',
    borderLight: '#473F3B',
    borderDark: '#2E2724',
    text: '#F3EEEA',
    textSecondary: '#D9CFC8',
    textMuted: '#B7AAA4',
    textInverse: '#0F0E0D',
    success: '#94B17E',
    warning: '#D2A274',
    error: '#C77C6F',
    info: '#A1BDE6',
    accent: palette.mochaMousse,
    accentHover: '#B78976',
    shadow: 'rgba(0, 0, 0, 0.45)',
    overlay: 'rgba(14, 10, 8, 0.68)',
    highlight: '#302A27',
    successLight: '#1E261C',
    warningLight: '#272016',
    errorLight: '#261A18',
    infoLight: '#182231',
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
  colorPalleteCircleFills: ["#4E7DA6", "#7A9E3E", "#C84E4E"]
};

interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_COOKIE_NAME = 'exornata_dark_mode';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

function getThemeFromCookie(): boolean | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === THEME_COOKIE_NAME) {
      return value === 'true';
    }
  }
  return null;
}

function setThemeCookie(isDark: boolean): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${THEME_COOKIE_NAME}=${isDark}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

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
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const cookieValue = getThemeFromCookie();
    return cookieValue ?? false;
  });
  const isDarkModeReference = React.useRef(isDarkMode);
  isDarkModeReference.current = isDarkMode;
  const updateSettingsReference = React.useRef(updateSettings);
  updateSettingsReference.current = updateSettings;

  useEffect(() => {
    const cookieValue = getThemeFromCookie();
    if (cookieValue !== null) {
      setIsDarkMode(cookieValue);
      return;
    }
    if (settingsRecord && settingsRecord[Setting.DARK_MODE] !== undefined) {
      setIsDarkMode(!!settingsRecord[Setting.DARK_MODE]);
      return;
    }
    if (typeof window !== 'undefined' && window.matchMedia) {
      const m = window.matchMedia('(prefers-color-scheme: dark)');
      setIsDarkMode(m.matches);
    }
  }, [settingsRecord]);

  useEffect(() => {
    if (getThemeFromCookie() !== null) return;
    if (settingsRecord && settingsRecord[Setting.DARK_MODE] !== undefined) return;
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const m = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    m.addEventListener?.('change', handler);
    return () => m.removeEventListener?.('change', handler);
  }, [settingsRecord]);

  const setTheme = useCallback(
    (isDark : boolean) => {
      const updateSettings = updateSettingsReference.current;
      setIsDarkMode(isDark);
      setThemeCookie(isDark);
      if (updateSettings) updateSettings({ [Setting.DARK_MODE]: isDark });
    },
    []
  );
  const toggleTheme = useCallback(
    () => setTheme(!isDarkModeReference.current),
    []
  );

  const theme = isDarkMode ? darkTheme : lightTheme;

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

  const contextValue: ThemeContextType = useMemo(
    () => ({
      theme,
      isDarkMode,
      toggleTheme,
      setTheme
    }),
    [
      theme,
      isDarkMode,
      toggleTheme,
      setTheme
    ]
  );
  return <ThemeContext.Provider value={contextValue}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const getThemeStyles = (theme: Theme) => {
  return {
    button: {
      primary: {
        background: theme.colors.primary,
        color: theme.colors.textInverse,
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
