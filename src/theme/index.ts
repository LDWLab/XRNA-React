export interface EnhancedTheme {
  colors: {
    primary: ColorScale;
    secondary: ColorScale;
    accent: ColorScale;
    success: ColorScale;
    warning: ColorScale;
    error: ColorScale;
    neutral: ColorScale;
    molecular: MolecularColors;
    gradients: GradientColors;
    semantic: SemanticColors;
  };
  typography: Typography;
  spacing: Spacing;
  shadows: Shadows;
  borders: Borders;
  animations: Animations;
  breakpoints: Breakpoints;
  zIndex: ZIndex;
  effects: Effects;
}

interface ColorScale {
  50: string;
  100: string;
  200: string;
  300: string;
  400: string;
  500: string;
  600: string;
  700: string;
  800: string;
  900: string;
  950: string;
}

interface MolecularColors {
  carbon: string;
  nitrogen: string;
  oxygen: string;
  phosphorus: string;
  sulfur: string;
  hydrogen: string;
  backbone: string;
  basePair: string;
  nucleotide: {
    adenine: string;
    thymine: string;
    guanine: string;
    cytosine: string;
    uracil: string;
  };
}

interface GradientColors {
  primary: string;
  secondary: string;
  accent: string;
  surface: string;
  glass: string;
  molecular: string;
  aurora: string;
  sunset: string;
  ocean: string;
}

interface SemanticColors {
  background: {
    primary: string;
    secondary: string;
    tertiary: string;
    overlay: string;
    glass: string;
  };
  text: {
    primary: string;
    secondary: string;
    tertiary: string;
    inverse: string;
    gradient: string;
  };
  border: {
    light: string;
    medium: string;
    dark: string;
    focus: string;
    error: string;
  };
  interactive: {
    hover: string;
    active: string;
    disabled: string;
    focus: string;
  };
}

interface Typography {
  fontFamily: {
    sans: string[];
    serif: string[];
    mono: string[];
    display: string[];
  };
  fontSize: {
    xs: [string, { lineHeight: string; letterSpacing: string }];
    sm: [string, { lineHeight: string; letterSpacing: string }];
    base: [string, { lineHeight: string; letterSpacing: string }];
    lg: [string, { lineHeight: string; letterSpacing: string }];
    xl: [string, { lineHeight: string; letterSpacing: string }];
    '2xl': [string, { lineHeight: string; letterSpacing: string }];
    '3xl': [string, { lineHeight: string; letterSpacing: string }];
    '4xl': [string, { lineHeight: string; letterSpacing: string }];
    '5xl': [string, { lineHeight: string; letterSpacing: string }];
    '6xl': [string, { lineHeight: string; letterSpacing: string }];
  };
  fontWeight: {
    thin: number;
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
    black: number;
  };
}

interface Spacing {
  px: string;
  0: string;
  0.5: string;
  1: string;
  1.5: string;
  2: string;
  2.5: string;
  3: string;
  3.5: string;
  4: string;
  5: string;
  6: string;
  7: string;
  8: string;
  9: string;
  10: string;
  11: string;
  12: string;
  14: string;
  16: string;
  20: string;
  24: string;
  28: string;
  32: string;
  36: string;
  40: string;
  44: string;
  48: string;
  52: string;
  56: string;
  60: string;
  64: string;
  72: string;
  80: string;
  96: string;
}

interface Shadows {
  none: string;
  sm: string;
  base: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  glow: {
    primary: string;
    accent: string;
    success: string;
    warning: string;
    error: string;
  };
  elevated: string;
  floating: string;
}

interface Borders {
  radius: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    full: string;
  };
  width: {
    0: string;
    1: string;
    2: string;
    4: string;
    8: string;
  };
}

interface Animations {
  duration: {
    75: string;
    100: string;
    150: string;
    200: string;
    300: string;
    500: string;
    700: string;
    1000: string;
  };
  timing: {
    linear: string;
    ease: string;
    easeIn: string;
    easeOut: string;
    easeInOut: string;
    bounce: string;
    elastic: string;
  };
  keyframes: {
    fadeIn: string;
    fadeOut: string;
    slideUp: string;
    slideDown: string;
    slideLeft: string;
    slideRight: string;
    scaleIn: string;
    scaleOut: string;
    spin: string;
    pulse: string;
    bounce: string;
    glow: string;
    float: string;
    shimmer: string;
    gradient: string;
  };
}

interface Breakpoints {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
}

interface ZIndex {
  auto: string;
  0: number;
  10: number;
  20: number;
  30: number;
  40: number;
  50: number;
  dropdown: number;
  sticky: number;
  fixed: number;
  modal: number;
  popover: number;
  tooltip: number;
  toast: number;
}

interface Effects {
  blur: {
    none: string;
    sm: string;
    base: string;
    md: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
  };
  brightness: {
    50: string;
    75: string;
    90: string;
    95: string;
    100: string;
    105: string;
    110: string;
    125: string;
    150: string;
    200: string;
  };
  saturate: {
    0: string;
    50: string;
    100: string;
    150: string;
    200: string;
  };
}

export const enhancedTheme: EnhancedTheme = {
  colors: {
    primary: {
      50: '#eff6ff',
      100: '#dbeafe',
      200: '#bfdbfe',
      300: '#93c5fd',
      400: '#60a5fa',
      500: '#3b82f6',
      600: '#2563eb',
      700: '#1d4ed8',
      800: '#1e40af',
      900: '#1e3a8a',
      950: '#172554',
    },
    secondary: {
      50: '#f8fafc',
      100: '#f1f5f9',
      200: '#e2e8f0',
      300: '#cbd5e1',
      400: '#94a3b8',
      500: '#64748b',
      600: '#475569',
      700: '#334155',
      800: '#1e293b',
      900: '#0f172a',
      950: '#020617',
    },
    accent: {
      50: '#fdf4ff',
      100: '#fae8ff',
      200: '#f5d0fe',
      300: '#f0abfc',
      400: '#e879f9',
      500: '#d946ef',
      600: '#c026d3',
      700: '#a21caf',
      800: '#86198f',
      900: '#701a75',
      950: '#4a044e',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
      950: '#451a03',
    },
    error: {
      50: '#fef2f2',
      100: '#fee2e2',
      200: '#fecaca',
      300: '#fca5a5',
      400: '#f87171',
      500: '#ef4444',
      600: '#dc2626',
      700: '#b91c1c',
      800: '#991b1b',
      900: '#7f1d1d',
      950: '#450a0a',
    },
    neutral: {
      50: '#fafafa',
      100: '#f5f5f5',
      200: '#e5e5e5',
      300: '#d4d4d4',
      400: '#a3a3a3',
      500: '#737373',
      600: '#525252',
      700: '#404040',
      800: '#262626',
      900: '#171717',
      950: '#0a0a0a',
    },
    molecular: {
      carbon: '#2d3748',
      nitrogen: '#3182ce',
      oxygen: '#e53e3e',
      phosphorus: '#d69e2e',
      sulfur: '#38a169',
      hydrogen: '#f7fafc',
      backbone: '#4a5568',
      basePair: '#805ad5',
      nucleotide: {
        adenine: '#e53e3e',
        thymine: '#3182ce',
        guanine: '#38a169',
        cytosine: '#d69e2e',
        uracil: '#805ad5',
      },
    },
    gradients: {
      primary: 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 50%, #3b82f6 100%)',
      secondary: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 50%, #e2e8f0 100%)',
      accent: 'linear-gradient(135deg, #d946ef 0%, #c026d3 50%, #d946ef 100%)',
      surface: 'linear-gradient(135deg, rgba(255, 255, 255, 0.9) 0%, rgba(248, 250, 252, 0.9) 100%)',
      glass: 'linear-gradient(135deg, rgba(255, 255, 255, 0.8) 0%, rgba(255, 255, 255, 0.4) 100%)',
      molecular: 'linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 50%, #bae6fd 100%)',
      aurora: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 50%, #ec4899 100%)',
      sunset: 'linear-gradient(135deg, #f59e0b 0%, #ef4444 50%, #ec4899 100%)',
      ocean: 'linear-gradient(135deg, #0ea5e9 0%, #3b82f6 50%, #8b5cf6 100%)',
    },
    semantic: {
      background: {
        primary: '#ffffff',
        secondary: '#f8fafc',
        tertiary: '#f1f5f9',
        overlay: 'rgba(0, 0, 0, 0.6)',
        glass: 'rgba(255, 255, 255, 0.8)',
      },
      text: {
        primary: '#0f172a',
        secondary: '#475569',
        tertiary: '#64748b',
        inverse: '#f8fafc',
        gradient: 'linear-gradient(135deg, #0ea5e9 0%, #d946ef 100%)',
      },
      border: {
        light: 'rgba(229, 231, 235, 0.6)',
        medium: 'rgba(203, 213, 225, 0.6)',
        dark: 'rgba(148, 163, 184, 0.6)',
        focus: 'rgba(59, 130, 246, 0.6)',
        error: 'rgba(239, 68, 68, 0.6)',
      },
      interactive: {
        hover: 'rgba(59, 130, 246, 0.1)',
        active: 'rgba(59, 130, 246, 0.2)',
        disabled: 'rgba(156, 163, 175, 0.5)',
        focus: 'rgba(59, 130, 246, 0.15)',
      },
    },
  },
  typography: {
    fontFamily: {
      sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      serif: ['Georgia', 'Cambria', 'Times New Roman', 'Times', 'serif'],
      mono: ['JetBrains Mono', 'Fira Code', 'Monaco', 'Consolas', 'monospace'],
      display: ['Poppins', 'Inter', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
    },
    fontSize: {
      xs: ['0.75rem', { lineHeight: '1rem', letterSpacing: '0.025em' }],
      sm: ['0.875rem', { lineHeight: '1.25rem', letterSpacing: '0.025em' }],
      base: ['1rem', { lineHeight: '1.5rem', letterSpacing: '0' }],
      lg: ['1.125rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      xl: ['1.25rem', { lineHeight: '1.75rem', letterSpacing: '-0.025em' }],
      '2xl': ['1.5rem', { lineHeight: '2rem', letterSpacing: '-0.025em' }],
      '3xl': ['1.875rem', { lineHeight: '2.25rem', letterSpacing: '-0.025em' }],
      '4xl': ['2.25rem', { lineHeight: '2.5rem', letterSpacing: '-0.025em' }],
      '5xl': ['3rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
      '6xl': ['3.75rem', { lineHeight: '1', letterSpacing: '-0.025em' }],
    },
    fontWeight: {
      thin: 100,
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800,
      black: 900,
    },
  },
  spacing: {
    px: '1px',
    0: '0px',
    0.5: '0.125rem',
    1: '0.25rem',
    1.5: '0.375rem',
    2: '0.5rem',
    2.5: '0.625rem',
    3: '0.75rem',
    3.5: '0.875rem',
    4: '1rem',
    5: '1.25rem',
    6: '1.5rem',
    7: '1.75rem',
    8: '2rem',
    9: '2.25rem',
    10: '2.5rem',
    11: '2.75rem',
    12: '3rem',
    14: '3.5rem',
    16: '4rem',
    20: '5rem',
    24: '6rem',
    28: '7rem',
    32: '8rem',
    36: '9rem',
    40: '10rem',
    44: '11rem',
    48: '12rem',
    52: '13rem',
    56: '14rem',
    60: '15rem',
    64: '16rem',
    72: '18rem',
    80: '20rem',
    96: '24rem',
  },
  shadows: {
    none: 'none',
    sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    base: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)',
    glow: {
      primary: '0 0 30px rgba(59, 130, 246, 0.3)',
      accent: '0 0 30px rgba(217, 70, 239, 0.3)',
      success: '0 0 30px rgba(34, 197, 94, 0.3)',
      warning: '0 0 30px rgba(245, 158, 11, 0.3)',
      error: '0 0 30px rgba(239, 68, 68, 0.3)',
    },
    elevated: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 10px 10px -5px rgba(0, 0, 0, 0.1)',
    floating: '0 10px 40px -10px rgba(0, 0, 0, 0.15), 0 4px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  borders: {
    radius: {
      none: '0px',
      sm: '0.125rem',
      base: '0.25rem',
      md: '0.375rem',
      lg: '0.5rem',
      xl: '0.75rem',
      '2xl': '1rem',
      '3xl': '1.5rem',
      full: '9999px',
    },
    width: {
      0: '0px',
      1: '1px',
      2: '2px',
      4: '4px',
      8: '8px',
    },
  },
  animations: {
    duration: {
      75: '75ms',
      100: '100ms',
      150: '150ms',
      200: '200ms',
      300: '300ms',
      500: '500ms',
      700: '700ms',
      1000: '1000ms',
    },
    timing: {
      linear: 'linear',
      ease: 'ease',
      easeIn: 'ease-in',
      easeOut: 'ease-out',
      easeInOut: 'ease-in-out',
      bounce: 'cubic-bezier(0.68, -0.55, 0.265, 1.55)',
      elastic: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)',
    },
    keyframes: {
      fadeIn: `
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `,
      fadeOut: `
        @keyframes fadeOut {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(-10px); }
        }
      `,
      slideUp: `
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,
      slideDown: `
        @keyframes slideDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `,
      slideLeft: `
        @keyframes slideLeft {
          from { transform: translateX(20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `,
      slideRight: `
        @keyframes slideRight {
          from { transform: translateX(-20px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `,
      scaleIn: `
        @keyframes scaleIn {
          from { transform: scale(0.9); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `,
      scaleOut: `
        @keyframes scaleOut {
          from { transform: scale(1); opacity: 1; }
          to { transform: scale(0.9); opacity: 0; }
        }
      `,
      spin: `
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `,
      pulse: `
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `,
      bounce: `
        @keyframes bounce {
          0%, 100% { transform: translateY(-25%); animation-timing-function: cubic-bezier(0.8, 0, 1, 1); }
          50% { transform: translateY(0); animation-timing-function: cubic-bezier(0, 0, 0.2, 1); }
        }
      `,
      glow: `
        @keyframes glow {
          from { box-shadow: 0 0 20px rgba(59, 130, 246, 0.3); }
          to { box-shadow: 0 0 30px rgba(59, 130, 246, 0.6), 0 0 40px rgba(59, 130, 246, 0.4); }
        }
      `,
      float: `
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
      `,
      shimmer: `
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
      `,
      gradient: `
        @keyframes gradient {
          0%, 100% { background-position: left center; }
          50% { background-position: right center; }
        }
      `,
    },
  },
  breakpoints: {
    xs: '475px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
  zIndex: {
    auto: 'auto',
    0: 0,
    10: 10,
    20: 20,
    30: 30,
    40: 40,
    50: 50,
    dropdown: 1000,
    sticky: 1020,
    fixed: 1030,
    modal: 1040,
    popover: 1050,
    tooltip: 1060,
    toast: 1070,
  },
  effects: {
    blur: {
      none: 'blur(0)',
      sm: 'blur(4px)',
      base: 'blur(8px)',
      md: 'blur(12px)',
      lg: 'blur(16px)',
      xl: 'blur(24px)',
      '2xl': 'blur(40px)',
      '3xl': 'blur(64px)',
    },
    brightness: {
      50: 'brightness(0.5)',
      75: 'brightness(0.75)',
      90: 'brightness(0.9)',
      95: 'brightness(0.95)',
      100: 'brightness(1)',
      105: 'brightness(1.05)',
      110: 'brightness(1.1)',
      125: 'brightness(1.25)',
      150: 'brightness(1.5)',
      200: 'brightness(2)',
    },
    saturate: {
      0: 'saturate(0)',
      50: 'saturate(0.5)',
      100: 'saturate(1)',
      150: 'saturate(1.5)',
      200: 'saturate(2)',
    },
  },
};

export const getColor = (path: string): string => {
  const keys = path.split('.');
  let value: any = enhancedTheme.colors;
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  return value || '#000000';
};

export const getSpacing = (size: keyof Spacing): string => {
  return enhancedTheme.spacing[size];
};

export const getFontSize = (size: keyof Typography['fontSize']): [string, { lineHeight: string; letterSpacing: string }] => {
  return enhancedTheme.typography.fontSize[size];
};

export const getShadow = (type: keyof Shadows): string => {
  const shadow = enhancedTheme.shadows[type];
  return typeof shadow === 'string' ? shadow : '';
};

export const getRadius = (size: keyof Borders['radius']): string => {
  return enhancedTheme.borders.radius[size];
};

export const getAnimation = (name: keyof Animations['keyframes']): string => {
  return enhancedTheme.animations.keyframes[name];
};

export const getBreakpoint = (size: keyof Breakpoints): string => {
  return enhancedTheme.breakpoints[size];
};

export const getZIndex = (layer: keyof ZIndex): string | number => {
  return enhancedTheme.zIndex[layer];
};

export const getEffect = (type: keyof Effects, intensity: string): string => {
  const effectGroup = enhancedTheme.effects[type] as any;
  return effectGroup?.[intensity] || 'none';
};

// Enhanced CSS-in-JS style helpers
export const createGradient = (direction: string, ...colors: string[]): string => {
  return `linear-gradient(${direction}, ${colors.join(', ')})`;
};

export const createBoxShadow = (...shadows: string[]): string => {
  return shadows.join(', ');
};

export const createTransition = (properties: string[], duration?: string, timing?: string): string => {
  const dur = duration || enhancedTheme.animations.duration[300];
  const tim = timing || enhancedTheme.animations.timing.easeInOut;
  return properties.map(prop => `${prop} ${dur} ${tim}`).join(', ');
};


export const mediaQueries = {
  xs: `@media (min-width: ${enhancedTheme.breakpoints.xs})`,
  sm: `@media (min-width: ${enhancedTheme.breakpoints.sm})`,
  md: `@media (min-width: ${enhancedTheme.breakpoints.md})`,
  lg: `@media (min-width: ${enhancedTheme.breakpoints.lg})`,
  xl: `@media (min-width: ${enhancedTheme.breakpoints.xl})`,
  '2xl': `@media (min-width: ${enhancedTheme.breakpoints['2xl']})`,
  dark: '@media (prefers-color-scheme: dark)',
  light: '@media (prefers-color-scheme: light)',
  reducedMotion: '@media (prefers-reduced-motion: reduce)',
  highContrast: '@media (prefers-contrast: high)',
  print: '@media print',
};

export const darkTheme: Partial<EnhancedTheme> = {
  colors: {
    ...enhancedTheme.colors,
    semantic: {
      background: {
        primary: '#0f172a',
        secondary: '#1e293b',
        tertiary: '#334155',
        overlay: 'rgba(0, 0, 0, 0.8)',
        glass: 'rgba(15, 23, 42, 0.8)',
      },
      text: {
        primary: '#f8fafc',
        secondary: '#cbd5e1',
        tertiary: '#94a3b8',
        inverse: '#0f172a',
        gradient: 'linear-gradient(135deg, #60a5fa 0%, #f472b6 100%)',
      },
      border: {
        light: 'rgba(55, 65, 81, 0.6)',
        medium: 'rgba(75, 85, 99, 0.6)',
        dark: 'rgba(107, 114, 128, 0.6)',
        focus: 'rgba(96, 165, 250, 0.6)',
        error: 'rgba(248, 113, 113, 0.6)',
      },
      interactive: {
        hover: 'rgba(96, 165, 250, 0.1)',
        active: 'rgba(96, 165, 250, 0.2)',
        disabled: 'rgba(107, 114, 128, 0.5)',
        focus: 'rgba(96, 165, 250, 0.15)',
      },
    },
    gradients: {
      ...enhancedTheme.colors.gradients,
      surface: 'linear-gradient(135deg, rgba(31, 41, 55, 0.9) 0%, rgba(17, 24, 39, 0.9) 100%)',
      glass: 'linear-gradient(135deg, rgba(15, 23, 42, 0.8) 0%, rgba(15, 23, 42, 0.4) 100%)',
      molecular: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)',
    },
  },
};


export const createThemeVariables = (theme: EnhancedTheme = enhancedTheme): Record<string, string> => {
  const variables: Record<string, string> = {};
  
  // Add color variables
  Object.entries(theme.colors).forEach(([colorName, colorValue]) => {
    if (typeof colorValue === 'object' && colorValue !== null) {
      Object.entries(colorValue).forEach(([shade, value]) => {
        if (typeof value === 'string') {
          variables[`--color-${colorName}-${shade}`] = value;
        }
      });
    }
  });
  
  // Add spacing variables
  Object.entries(theme.spacing).forEach(([size, value]) => {
    variables[`--spacing-${size}`] = value;
  });
  
  // Add shadow variables
  Object.entries(theme.shadows).forEach(([name, value]) => {
    if (typeof value === 'string') {
      variables[`--shadow-${name}`] = value;
    }
  });
  
  return variables;
};

export default enhancedTheme; 