import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  variant?: 'button' | 'switch' | 'icon';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'md',
  showLabel = true,
  variant = 'switch',
}) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  const sizes = {
    sm: {
      width: '36px',
      height: '20px',
      padding: '2px',
      fontSize: theme.typography.fontSize.xs,
    },
    md: {
      width: '44px',
      height: '24px',
      padding: '2px',
      fontSize: theme.typography.fontSize.sm,
    },
    lg: {
      width: '52px',
      height: '28px',
      padding: '3px',
      fontSize: theme.typography.fontSize.md,
    },
  };

  const currentSize = sizes[size];

  if (variant === 'button') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-button ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: theme.spacing.sm,
          background: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.borderRadius.md,
          padding: `${theme.spacing.sm} ${theme.spacing.md}`,
          fontSize: currentSize.fontSize,
          fontWeight: theme.typography.fontWeight.medium,
          cursor: 'pointer',
          transition: theme.transitions.default,
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = theme.colors.surface;
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}25`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center' }}>
          {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
        </span>
        {showLabel && (
          <span>{isDarkMode ? 'Dark Mode' : 'Light Mode'}</span>
        )}
      </button>
    );
  }

  if (variant === 'icon') {
    return (
      <button
        onClick={toggleTheme}
        className={`theme-toggle-icon ${className}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: currentSize.height,
          height: currentSize.height,
          background: 'transparent',
          color: theme.colors.text,
          border: 'none',
          borderRadius: theme.borderRadius.md,
          fontSize: '16px',
          cursor: 'pointer',
          transition: theme.transitions.default,
          outline: 'none',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = theme.colors.surfaceHover;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'transparent';
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}25`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
        title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      >
        {isDarkMode ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    );
  }

  // Default: switch variant
  return (
    <div
      className={`theme-toggle-switch ${className}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing.md,
      }}
    >
      {showLabel && (
        <span
          style={{
            fontSize: currentSize.fontSize,
            fontWeight: theme.typography.fontWeight.medium,
            color: theme.colors.text,
          }}
        >
          {isDarkMode ? 'Dark' : 'Light'}
        </span>
      )}
      
      <button
        onClick={toggleTheme}
        role="switch"
        aria-checked={isDarkMode}
        aria-label={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        style={{
          position: 'relative',
          width: currentSize.width,
          height: currentSize.height,
          background: isDarkMode ? theme.colors.primary : theme.colors.border,
          border: 'none',
          borderRadius: theme.borderRadius.full,
          cursor: 'pointer',
          transition: theme.transitions.default,
          outline: 'none',
          padding: currentSize.padding,
        }}
        onFocus={(e) => {
          e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}25`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.boxShadow = 'none';
        }}
      >
        {/* Switch indicator */}
        <div
          style={{
            position: 'absolute',
            top: currentSize.padding,
            left: isDarkMode
              ? `calc(100% - ${parseInt(currentSize.height) - parseInt(currentSize.padding) * 2}px - ${currentSize.padding})`
              : currentSize.padding,
            width: `${parseInt(currentSize.height) - parseInt(currentSize.padding) * 2}px`,
            height: `${parseInt(currentSize.height) - parseInt(currentSize.padding) * 2}px`,
            background: theme.colors.background,
            borderRadius: theme.borderRadius.full,
            transition: theme.transitions.default,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: `${parseInt(currentSize.height) - parseInt(currentSize.padding) * 4}px`,
            boxShadow: theme.shadows.sm,
          }}
        >
          {isDarkMode ? <Moon size={12} /> : <Sun size={12} />}
        </div>
      </button>
    </div>
  );
};

// Alternative toggle component with more subtle styling
export const MinimalThemeToggle: React.FC<Omit<ThemeToggleProps, 'variant'>> = (props) => {
  const { theme, isDarkMode, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`minimal-theme-toggle ${props.className || ''}`}
      style={{
        background: 'transparent',
        border: 'none',
        color: theme.colors.textSecondary,
        fontSize: '18px',
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
