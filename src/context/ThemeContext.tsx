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

export interface ThemeButtonSizes {
  sm: {
    height: string;
    padding: string;
    fontSize: string;
    iconSize: string;
    borderRadius: string;
  };
  md: {
    height: string;
    padding: string;
    fontSize: string;
    iconSize: string;
    borderRadius: string;
  };
  lg: {
    height: string;
    padding: string;
    fontSize: string;
    iconSize: string;
    borderRadius: string;
  };
}

export interface Theme {
  colors: ThemeColors;
  spacing: ThemeSpacing;
  typography: ThemeTypography;
  borderRadius: ThemeBorderRadius;
  shadows: ThemeShadows;
  buttonSizes: ThemeButtonSizes;
  transitions: {
      default: string;
      fast: string;
      slow: string;
  };
}

// Light theme with muted pastel colors
const lightTheme: Theme = {
  colors: {
      // Primary colors - Muted Periwinkle
      primary: '#a7b4e0',
      primaryHover: '#96a3d1',
      primaryActive: '#8592c2',

      // Background colors - Soft, cool off-white
      background: '#fdfdff',
      backgroundSecondary: '#f5f6fa',
      surface: '#ffffff',
      surfaceHover: '#f8f9fc',

      // Border colors
      border: '#e6e8f0',
      borderLight: '#f1f5f9',
      borderDark: '#d1d5db',

      // Text colors - Dark gray for soft contrast
      text: '#4a4a4a',
      textSecondary: '#6b7280',
      textMuted: '#9ca3af',
      textInverse: '#ffffff',

      // State colors - Pastel tones
      success: '#a7e0b4',
      warning: '#fde0a8',
      error: '#f8b4b4',
      info: '#a8d8fd',

      // Accent colors - Pastel Pink/Mauve
      accent: '#e0a7c3',
      accentHover: '#d196b4',

      // Component specific
      shadow: 'rgba(0, 0, 0, 0.05)',
      overlay: 'rgba(0, 0, 0, 0.4)',
      highlight: '#f0f5ff',

      // Additional colors for better UI
      successLight: '#e0f2e5',
      warningLight: '#fff8e6',
      errorLight: '#ffebeb',
      infoLight: '#e6f4ff',

      // Enhanced contrast colors
      textStrong: '#2a2a2a',
      textWeak: '#a1a1aa',
      surfaceStrong: '#f5f6fa',
      surfaceWeak: '#fdfdff',
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
      sm: '0 1px 3px rgba(0, 0, 0, 0.05), 0 1px 2px rgba(0, 0, 0, 0.03)',
      md: '0 4px 6px rgba(0, 0, 0, 0.05), 0 2px 4px rgba(0, 0, 0, 0.04)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.05), 0 4px 6px rgba(0, 0, 0, 0.03)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.05), 0 10px 10px rgba(0, 0, 0, 0.02)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.04)',
  },
  buttonSizes: {
      sm: {
          height: '28px',
          padding: '0 8px',
          fontSize: '12px',
          iconSize: '16px',
          borderRadius: '4px',
      },
      md: {
          height: '36px',
          padding: '0 12px',
          fontSize: '14px',
          iconSize: '18px',
          borderRadius: '6px',
      },
      lg: {
          height: '44px',
          padding: '0 16px',
          fontSize: '16px',
          iconSize: '20px',
          borderRadius: '8px',
      },
  },
  transitions: {
      default: 'all 0.2s ease-in-out',
      fast: 'all 0.15s ease-in-out',
      slow: 'all 0.3s ease-in-out',
  },
};

// Dark theme with high contrast colors
const darkTheme: Theme = {
  colors: {
      // Primary colors - Bright Cornflower Blue
      primary: '#809fff',
      primaryHover: '#6b8eff',
      primaryActive: '#567eff',

      // Background colors - Very dark blue/black
      background: '#0a0a10',
      backgroundSecondary: '#1a1a24',
      surface: '#1f1f29',
      surfaceHover: '#2e2e3d',

      // Border colors
      border: '#3a3a4a',
      borderLight: '#4a4a5a',
      borderDark: '#2a2a3a',

      // Text colors - Off-white for high contrast
      text: '#f0f0f5',
      textSecondary: '#d0d0d5',
      textMuted: '#a0a0a5',
      textInverse: '#0a0a10',

      // State colors - Bright and saturated
      success: '#34d399',
      warning: '#fbbF24',
      error: '#f87171',
      info: '#60a5fa',

      // Accent colors - Bright Pink
      accent: '#f472b6',
      accentHover: '#ec4899',

      // Component specific
      shadow: 'rgba(0, 0, 0, 0.5)',
      overlay: 'rgba(0, 0, 0, 0.8)',
      highlight: '#2e2e3d',

      // Additional colors for better UI
      successLight: '#052e16',
      warningLight: '#451a03',
      errorLight: '#450a0a',
      infoLight: '#0c4a6e',

      // Enhanced contrast colors
      textStrong: '#ffffff',
      textWeak: '#b0b0b5',
      surfaceStrong: '#1a1a24',
      surfaceWeak: '#2e2e3d',
  },
  spacing: lightTheme.spacing, // Same spacing for both themes
  typography: lightTheme.typography, // Same typography for both themes
  borderRadius: lightTheme.borderRadius, // Same border radius for both themes
  shadows: {
      none: 'none',
      sm: '0 1px 3px rgba(0, 0, 0, 0.4), 0 1px 2px rgba(0, 0, 0, 0.3)',
      md: '0 4px 6px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.3)',
      lg: '0 10px 15px rgba(0, 0, 0, 0.5), 0 4px 6px rgba(0, 0, 0, 0.3)',
      xl: '0 20px 25px rgba(0, 0, 0, 0.5), 0 10px 10px rgba(0, 0, 0, 0.3)',
      inner: 'inset 0 2px 4px rgba(0, 0, 0, 0.4)',
  },
  buttonSizes: {
      sm: {
          height: '28px',
          padding: '0 8px',
          fontSize: '12px',
          iconSize: '16px',
          borderRadius: '4px',
      },
      md: {
          height: '36px',
          padding: '0 12px',
          fontSize: '14px',
          iconSize: '18px',
          borderRadius: '6px'
      },
      lg: {
          height: '44px',
          padding: '0 16px',
          fontSize: '16px',
          iconSize: '20px',
          borderRadius: '8px',
      },
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

      // Helper function to flatten nested objects for CSS variables
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


      // Set CSS custom properties for the entire theme
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

      // Set data attribute for theme-aware styling in CSS files
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

// Utility function to get theme-aware styles (can be used for CSS-in-JS if needed)
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
              boxShadow: `0 0 0 3px ${theme.colors.primary}40`, 
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