import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Setting } from '../ui/Setting';

// Define theme colors for light and dark modes
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
  
  // Additional colors for better UI
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
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  xxl: string;
  xxxl: string;
}

export interface ThemeTypography {
  fontFamily: string;
  fontSize: {
    xs: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    xxl: string;
  };
  fontWeight: {
    light: string;
    normal: string;
    medium: string;
    semibold: string;
    bold: string;
  };
  lineHeight: {
    tight: string;
    normal: string;
    relaxed: string;
  };
}

export interface ThemeBorderRadius {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  full: string;
}

export interface ThemeShadows {
  none: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  inner: string;
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  transitions: {
    default: string;
    fast: string;
    slow: string;
  };
}

// Light theme
const lightTheme: Theme = {
  colors: {
    // Primary colors
    primary: '#4f46e5',
    primaryHover: '#4338ca',
    primaryActive: '#3730a3',
    
    // Background colors
    background: '#ffffff',
    backgroundSecondary: '#f8fafc',
    surface: '#ffffff',
    surfaceHover: '#f1f5f9',
    
    // Border colors
    border: '#e2e8f0',
    borderLight: '#f1f5f9',
    borderDark: '#cbd5e1',
    
    // Text colors
    text: '#0f172a',
    textSecondary: '#475569',
    textMuted: '#64748b',
    textInverse: '#ffffff',
    
    // State colors
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    info: '#3b82f6',
    
    // Accent colors
    accent: '#8b5cf6',
    accentHover: '#7c3aed',
    
    // Component specific
    shadow: 'rgba(0, 0, 0, 0.1)',
    overlay: 'rgba(0, 0, 0, 0.5)',
    highlight: '#f0f9ff',
    
    // Additional colors for better UI
    successLight: '#d1fae5',
    warningLight: '#fef3c7',
    errorLight: '#fee2e2',
    infoLight: '#dbeafe',
    
    // Enhanced contrast colors
    textStrong: '#020617',
    textWeak: '#94a3b8',
    surfaceStrong: '#f8fafc',
    surfaceWeak: '#f1f5f9',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '12px',
    lg: '16px',
    xl: '20px',
    xxl: '24px',
    xxxl: '32px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '11px',
      sm: '12px',
      md: '14px',
      lg: '16px',
      xl: '18px',
      xxl: '20px',
    },
    fontWeight: {
      light: '300',
      normal: '400',
      medium: '500',
      semibold: '600',
      bold: '700',
    },
    lineHeight: {
      tight: '1.25',
      normal: '1.5',
      relaxed: '1.75',
    },
  },
  borderRadius: {
    none: '0',
    sm: '4px',
    md: '6px',
    lg: '8px',
    xl: '12px',
    full: '9999px',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px rgba(0, 0, 0, 0.07), 0 2px 4px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1), 0 4px 6px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.1), 0 10px 10px rgba(0, 0, 0, 0.04)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.06)',
  },
  transitions: {
    default: 'all 0.2s ease-in-out',
    fast: 'all 0.15s ease-in-out',
    slow: 'all 0.3s ease-in-out',
  },
};

// Dark theme
const darkTheme: Theme = {
  colors: {
    // Primary colors
    primary: '#6366f1',
    primaryHover: '#7c3aed',
    primaryActive: '#8b5cf6',
    
    // Background colors
    background: '#0f172a',
    backgroundSecondary: '#1e293b',
    surface: '#1e293b',
    surfaceHover: '#334155',
    
    // Border colors
    border: '#334155',
    borderLight: '#475569',
    borderDark: '#1e293b',
    
    // Text colors
    text: '#f8fafc',
    textSecondary: '#e2e8f0',
    textMuted: '#cbd5e1',
    textInverse: '#0f172a',
    
    // State colors
    success: '#22c55e',
    warning: '#fbbf24',
    error: '#f87171',
    info: '#60a5fa',
    
    // Accent colors
    accent: '#a78bfa',
    accentHover: '#c4b5fd',
    
    // Component specific
    shadow: 'rgba(0, 0, 0, 0.4)',
    overlay: 'rgba(0, 0, 0, 0.8)',
    highlight: '#1e293b',
    
    // Additional colors for better UI
    successLight: '#14532d',
    warningLight: '#451a03',
    errorLight: '#450a0a',
    infoLight: '#0c4a6e',
    
    // Enhanced contrast colors
    textStrong: '#ffffff',
    textWeak: '#e2e8f0',
    surfaceStrong: '#1e293b',
    surfaceWeak: '#334155',
  },
  spacing: lightTheme.spacing, // Same spacing for both themes
  typography: lightTheme.typography, // Same typography for both themes
  borderRadius: lightTheme.borderRadius, // Same border radius for both themes
  shadows: {
    none: 'none',
    sm: '0 1px 3px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
    md: '0 4px 6px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.4), 0 4px 6px rgba(0, 0, 0, 0.2)',
    xl: '0 20px 25px rgba(0, 0, 0, 0.4), 0 10px 10px rgba(0, 0, 0, 0.2)',
    inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
  },
  transitions: lightTheme.transitions, // Same transitions for both themes
};

// Theme context
interface ThemeContextType {
  theme: Theme;
  isDarkMode: boolean;
  toggleTheme: () => void;
  setTheme: (isDark: boolean) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Theme provider props
interface ThemeProviderProps {
  children: ReactNode;
  settingsRecord?: Record<Setting, any>;
  updateSettings?: (settings: Partial<Record<Setting, any>>) => void;
}

// Theme provider component
export const ThemeProvider: React.FC<ThemeProviderProps> = ({
  children,
  settingsRecord,
  updateSettings,
}) => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Initialize theme from settings if available
  useEffect(() => {
    if (settingsRecord && settingsRecord[Setting.DARK_MODE] !== undefined) {
      setIsDarkMode(settingsRecord[Setting.DARK_MODE]);
    }
  }, [settingsRecord]);

  // Update settings when theme changes
  const setTheme = (isDark: boolean) => {
    setIsDarkMode(isDark);
    if (updateSettings) {
      updateSettings({ [Setting.DARK_MODE]: isDark });
    }
  };

  const toggleTheme = () => {
    setTheme(!isDarkMode);
  };

  const theme = isDarkMode ? darkTheme : lightTheme;

  // Apply CSS custom properties to document root
  useEffect(() => {
    const root = document.documentElement;
    
    // Set CSS custom properties for theme colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--color-${key}`, value);
    });
    
    // Set CSS custom properties for spacing
    Object.entries(theme.spacing).forEach(([key, value]) => {
      root.style.setProperty(`--spacing-${key}`, value);
    });
    
    // Set CSS custom properties for typography
    root.style.setProperty('--font-family', theme.typography.fontFamily);
    Object.entries(theme.typography.fontSize).forEach(([key, value]) => {
      root.style.setProperty(`--font-size-${key}`, value);
    });
    Object.entries(theme.typography.fontWeight).forEach(([key, value]) => {
      root.style.setProperty(`--font-weight-${key}`, value);
    });
    Object.entries(theme.typography.lineHeight).forEach(([key, value]) => {
      root.style.setProperty(`--line-height-${key}`, value);
    });
    
    // Set CSS custom properties for border radius
    Object.entries(theme.borderRadius).forEach(([key, value]) => {
      root.style.setProperty(`--border-radius-${key}`, value);
    });
    
    // Set CSS custom properties for shadows
    Object.entries(theme.shadows).forEach(([key, value]) => {
      root.style.setProperty(`--shadow-${key}`, value);
    });
    
    // Set CSS custom properties for transitions
    Object.entries(theme.transitions).forEach(([key, value]) => {
      root.style.setProperty(`--transition-${key}`, value);
    });
    
    // Set data attribute for theme-aware styling
    root.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
    
  }, [theme, isDarkMode]);

  const contextValue: ThemeContextType = {
    theme,
    isDarkMode,
    toggleTheme,
    setTheme,
  };

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

// Custom hook to use theme
export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

// Utility function to get theme-aware styles
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
        ':hover': {
          background: theme.colors.primaryHover,
        },
        ':active': {
          background: theme.colors.primaryActive,
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
        ':hover': {
          background: theme.colors.surfaceHover,
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
        borderColor: theme.colors.primary,
        outline: 'none',
        boxShadow: `0 0 0 3px ${theme.colors.primary}25`,
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
