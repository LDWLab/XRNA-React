import React from 'react';
import { useTheme } from '../../../context/ThemeContext';

export interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export const RightDrawer: React.FC<RightDrawerProps> = ({ open, onClose, children }) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        position: 'fixed',
        top: 56,
        right: 0,
        height: '100%',
        width: '480px',
        background: theme.colors.backgroundSecondary,
        // boxShadow: theme.shadows.lg,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: theme.transitions.default,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.colors.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: theme.colors.primary }} />
          <span style={{ fontSize: theme.typography.fontSize.sm, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: theme.colors.text }}>
            Properties Panel
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: theme.colors.surfaceHover,
            cursor: 'pointer',
            fontSize: theme.typography.fontSize.md,
            color: theme.colors.text,
            padding: '6px 8px',
            borderRadius: theme.borderRadius.md,
            width: '28px',
            height: '28px',
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
};

export const MemoizedRightDrawer = React.memo(RightDrawer);