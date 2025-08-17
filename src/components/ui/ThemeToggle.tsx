import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'button' | 'switch' | 'icon';
}

export const ThemeToggle: React.FC<Omit<ThemeToggleProps, 'variant'>> = (props) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`minimal-theme-toggle ${props.className || ''}`}
      style={{
        background: 'transparent',
        border: 'none',
        color: theme.colors.textSecondary,
        fontSize: theme.typography.fontSize.md,
        cursor: 'pointer',
        padding: theme.spacing.sm,
        borderRadius: theme.borderRadius.md,
        transition: theme.transitions.default,
        outline: 'none',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = theme.colors.text;
        e.currentTarget.style.background = theme.colors.surfaceHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = theme.colors.textSecondary;
        e.currentTarget.style.background = 'transparent';
      }}
      onFocus={(e) => {
        e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}25`;
      }}
      onBlur={(e) => {
        e.currentTarget.style.boxShadow = 'none';
      }}
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
    >
      {isDarkMode ? <Moon size={18} /> : <Sun size={18} />}
    </button>
  );
};

export default ThemeToggle;
