import React from 'react';
import { createPortal } from 'react-dom';
import { Theme, useTheme } from '../../../context/ThemeContext';

export interface ButtonProps {
  onClick?: () => void;
  icon?: React.ReactNode;
  label: string;
  description?: string;
  hint?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent' | 'danger' | "simpleHighlight";
}

const Tooltip = ({ hint, position, theme }: { hint: string, position: { left: number, top: number }, theme: Theme }) => {
  const portalRoot = document.body;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        left: `${position.left}px`,
        top: `${position.top}px`,
        transform: 'translate(-30%, -20%)',
        padding: '6px 10px',
        borderRadius: '6px',
        background: theme.colors.surface,
        color: theme.colors.text,
        fontSize: theme.typography.fontSize.md,
        fontWeight: 600,
        whiteSpace: 'nowrap',
        zIndex: 1000,
        boxShadow: theme.shadows.md,
        animation: 'fadeIn 0.2s ease-out',
        pointerEvents: 'none',
      }}
    >
      {hint}
    </div>,
    portalRoot
  );
};
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(({ onClick, icon, label, description, hint, disabled = false, variant = 'secondary' }, forwardedRef) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);
  const buttonRef = React.useRef<HTMLButtonElement>(null);
  const [tooltipPosition, setTooltipPosition] = React.useState({ top: 0, left: 0 });

  const handleMouseEnter = () => {
    if (buttonRef.current && hint && !disabled) {
      const rect = buttonRef.current.getBoundingClientRect();
      setTooltipPosition({
        top: rect.top + rect.height + 10,
        left: rect.right + 10,
      });
    }
    setIsHovered(true);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.primaryActive : (isHovered ? theme.colors.primaryHover : theme.colors.primary)),
          color: theme.colors.textInverse,
          border: `1px solid ${theme.colors.primary}`,
        };
      case 'accent':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.accent : (isHovered ? theme.colors.accentHover : 'transparent')),
          color: disabled ? theme.colors.textMuted : (isHovered ? theme.colors.accent : theme.colors.textSecondary),
          border: `1px solid ${isHovered ? theme.colors.accent : theme.colors.border}`,
        };
      case 'danger':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.error : (isHovered ? theme.colors.error + '20' : 'transparent')),
          color: disabled ? theme.colors.textMuted : (isHovered ? theme.colors.error : theme.colors.text),
          border: `1px solid ${isHovered ? theme.colors.error : theme.colors.border}`,
        };
      case 'simpleHighlight' : 
        return {
          background: "transparent",
          color: disabled ? theme.colors.textMuted : theme.colors.text,
          border: `2px solid ${theme.colors.primary}`,
        };
      default:
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.surfaceHover : (isHovered ? theme.colors.surfaceHover : 'transparent')),
          color: disabled ? theme.colors.textMuted : theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <>
      <button
        ref={forwardedRef || buttonRef}
        onClick={onClick}
        disabled={disabled}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsHovered(false)}
        onMouseDown={() => setIsPressed(true)}
        onMouseUp={() => setIsPressed(false)}
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          height: theme.buttonSizes.md.height,
          padding: theme.buttonSizes.md.padding,
          borderRadius: theme.buttonSizes.md.borderRadius,
          fontSize: theme.buttonSizes.md.fontSize,
          fontWeight: '600',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          opacity: disabled ? 0.4 : 1,
          flex: 1,
          minWidth: '0',
          ...variantStyles,
          boxShadow: disabled ? 'none' : (isPressed ? theme.shadows.sm : (isHovered ? theme.shadows.sm : 'none')),
          transform: disabled ? 'none' : (isPressed ? 'scale(0.95)' : (isHovered ? 'translateY(-1px)' : 'translateY(0)')),
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: theme.buttonSizes.md.iconSize,
          opacity: disabled ? 0.5 : 1,
        }}>
          {icon && icon}
        </div>
        <div style={{ textAlign: 'center', opacity: isHovered ? 1 : 0.9 }}>
          <div style={{
            fontSize: theme.typography.fontSize.sm,
            fontWeight: '600',
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            maxWidth: '120px',
            opacity: isHovered ? 1 : 0.9,
          }}>
            {label}
          </div>
          {description && (
            <div style={{
              fontSize: theme.typography.fontSize.xs,
              color: disabled ? theme.colors.textMuted : (variant === 'primary' ? theme.colors.textInverse + '80' : theme.colors.textMuted),
              lineHeight: '1.2',
              maxWidth: '120px',
              opacity: isHovered ? 1 : 0.9,
            }}>
              {description}
            </div>
          )}
        </div>
      </button>

      {isHovered && hint && !disabled && (
        <Tooltip hint={hint} position={tooltipPosition} theme={theme} />
      )}
    </>
  );
});
