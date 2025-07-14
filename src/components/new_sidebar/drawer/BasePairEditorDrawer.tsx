import React from 'react';
import { BasePairsEditor } from '../../app_specific/editors/BasePairsEditor';
import { RnaComplexProps } from '../../../App';

export interface BasePairEditorDrawerProps {
  open: boolean;
  onClose: () => void;
  rnaComplexProps: RnaComplexProps;
  approveBasePairs: (bps: BasePairsEditor.BasePair[]) => void;
}

export const BasePairEditorDrawer: React.FC<BasePairEditorDrawerProps> = ({
  open,
  onClose,
  rnaComplexProps,
  approveBasePairs,
}) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '480px',
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <span
          style={{
            fontSize: '14px',
            fontWeight: 600,
            letterSpacing: '0.5px',
            textTransform: 'uppercase',
            color: '#475569',
          }}
        >
          Base-Pair Editor
        </span>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: '16px',
            color: '#475569',
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