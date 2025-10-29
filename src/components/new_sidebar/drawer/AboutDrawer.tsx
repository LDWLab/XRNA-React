import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PanelContainer } from '../layout/PanelContainer';
import { Tab } from '../../../app_data/Tab';
import './AboutDrawer.css';

export interface AboutDrawerProps {
  open: boolean;
  onClose: () => void;
  renderTabInstructions: (tab: Tab) => JSX.Element;
}

export const AboutDrawer: React.FC<AboutDrawerProps> = ({ open, onClose, renderTabInstructions }) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '720px',
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
      <div
        style={{
          padding: '16px 20px',
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.colors.surfaceHover,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: theme.typography.fontSize.sm, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: theme.colors.text }}>
            Quickstart
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ 
            border: `1px solid ${theme.colors.border}`, 
            background: theme.colors.surface, 
            cursor: 'pointer', 
            fontSize: theme.typography.fontSize.md, 
            color: theme.colors.text, 
            padding: '6px 8px', 
            borderRadius: theme.borderRadius.md, 
            width: '28px', 
            height: '28px' 
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <PanelContainer title="Quickstart" borderRadius={8}>
          <div style={{ fontSize: theme.typography.fontSize.md, color: theme.colors.text }}>
            {renderTabInstructions(Tab.ABOUT)}
          </div>
        </PanelContainer>

        <div style={{ height: 12 }} />

      </div>
    </div>
  );
};


