import React from 'react';
import { BasePairsEditor } from '../../app_specific/editors/BasePairsEditor';
import { RnaComplexProps, FullKeysRecord } from '../../../App';
import { useTheme } from '../../../context/ThemeContext';

export interface BasePairEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  rnaComplexProps: RnaComplexProps;
  approveBasePairs: (bps: BasePairsEditor.BasePair[]) => void;
  selected?: FullKeysRecord; // Selected base pairs for Format mode
  formatMode?: boolean; // Indicates if we're in Format mode
}

export const BasePairEditorDrawer: React.FC<BasePairEditorDrawerProps> = ({
  open,
  onClose,
  rnaComplexProps,
  approveBasePairs,
  selected,
  formatMode = false,
}) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '480px',
        background: theme.colors.backgroundSecondary,
        boxShadow: theme.shadows.lg,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: theme.transitions.default,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
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
        <span
          style={{
            fontSize: '14px',
            fontWeight: '600',
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: theme.colors.text,
          }}
        >
          {formatMode ? 'Format Mode - ' : ''}Base-Pair Editor
        </span>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            color: theme.colors.text,
          }}
        >
          ✕
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <BasePairsEditor.Component
          rnaComplexProps={rnaComplexProps}
          approveBasePairs={approveBasePairs}
        />
      </div>
    </div>
  );
}; 