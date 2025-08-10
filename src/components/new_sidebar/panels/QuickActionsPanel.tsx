import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';

export type QuickActionsCallbacks = {
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
};

export const CompactButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}> = ({ onClick, icon, label, disabled = false, variant = 'secondary' }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 6px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '9px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        flex: 1,
        minWidth: '0',
        background: disabled 
          ? '#f1f5f9' 
          : isPrimary
            ? (isPressed ? '#2563eb' : isHovered ? '#3b82f6' : '#4f46e5')
            : (isPressed ? '#e2e8f0' : isHovered ? '#f1f5f9' : '#ffffff'),
        color: disabled 
          ? '#94a3b8' 
          : isPrimary 
            ? '#ffffff' 
            : '#475569',
        boxShadow: disabled 
          ? 'none' 
          : isPrimary
            ? (isPressed ? '0 1px 3px rgba(79, 70, 229, 0.3)' : '0 2px 6px rgba(79, 70, 229, 0.2)')
            : (isPressed ? '0 1px 2px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.08)'),
        transform: disabled 
          ? 'none' 
          : (isPressed ? 'scale(0.95)' : isHovered ? 'translateY(-1px)' : 'translateY(0)'),
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '14px',
        opacity: disabled ? 0.5 : 1,
      }}>
        {icon}
      </div>
      <span style={{ 
        textAlign: 'center',
        letterSpacing: '0.3px',
        lineHeight: '1.2',
        fontSize: '9px',
        fontWeight: '600',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </button>
  );
};

export const QuickActionsPanel: React.FC<QuickActionsCallbacks> = ({
  onToggleBasePairEditor,
  onTogglePropertiesDrawer,
  onToggleSettingsDrawer,
  onToggleAboutDrawer,
}) => {
  return (
    <PanelContainer title="Utilities" borderRadius={8}>
      {(onToggleBasePairEditor || onTogglePropertiesDrawer) && (
        <div>
          <div
            style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}
          >
            Editors
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {onToggleBasePairEditor && (
              <CompactButton
                onClick={onToggleBasePairEditor}
                icon={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M4 5h4M4 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                }
                label="Base Pairs"
              />
            )}
            {onTogglePropertiesDrawer && (
              <CompactButton
                onClick={onTogglePropertiesDrawer}
                icon={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M4 4h4M4 6h4M4 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                }
                label="Properties"
              />
            )}
          </div>
        </div>
      )}
      {(onToggleSettingsDrawer || onToggleAboutDrawer) && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#334155', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            App
          </div>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {onToggleSettingsDrawer && (
              <CompactButton
                onClick={onToggleSettingsDrawer}
                icon={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M5 1h2l.3 1.2a3.5 3.5 0 011 .6l1.2-.3 1 1- .3 1.2c.2.3.4.7.6 1l1.2.3v2l-1.2.3a3.5 3.5 0 01-.6 1l.3 1.2-1 1-1.2-.3a3.5 3.5 0 01-1 .6L7 11H5l-.3-1.2a3.5 3.5 0 01-1-.6L2.5 9.5l-1-1 .3-1.2a3.5 3.5 0 01-.6-1L0 5V3l1.2-.3a3.5 3.5 0 01.6-1L1.5.5l1-1 1.2.3a3.5 3.5 0 011-.6L5 1z" stroke="currentColor" strokeWidth="1" fill="none"/>
                    <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1" fill="none"/>
                  </svg>
                }
                label="Settings"
              />
            )}
            {onToggleAboutDrawer && (
              <CompactButton
                onClick={onToggleAboutDrawer}
                icon={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M6 4v4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                    <circle cx="6" cy="3" r=".7" fill="currentColor"/>
                  </svg>
                }
                label="About"
              />
            )}
          </div>
        </div>
      )}
    </PanelContainer>
  );
}; 