import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PanelContainer } from '../layout/PanelContainer';

export interface PropertiesPanelProps {
  content?: JSX.Element;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ content }) => {
  const { theme } = useTheme();
  return (
    <PanelContainer title="Properties">
      {content ? (
        <div style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: theme.shadows.sm,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
          <div style={{
            padding: '12px 16px',
            background: theme.colors.surfaceHover,
            borderBottom: `1px solid ${theme.colors.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexShrink: 0,
          }}>
            <div style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: theme.colors.primary,
              boxShadow: theme.shadows.sm,
            }} />
            <span style={{
              fontSize: '11px',
              fontWeight: '600',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
              color: theme.colors.text,
            }}>
              Selected Element
            </span>
          </div>
          
          {/* Content - Scrollable within panel */}
          <div style={{
            flex: 1,
            padding: '16px',
            background: theme.colors.backgroundSecondary,
            fontSize: '13px',
            lineHeight: '1.5',
            color: theme.colors.text,
            overflow: 'auto',
            scrollBehavior: 'smooth',
          }}>
            {content}
          </div>
        </div>
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 16px',
          textAlign: 'center',
          color: theme.colors.textSecondary,
          height: '200px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: theme.colors.surfaceHover,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: theme.shadows.md,
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path 
                d="M8 1L12 5H10V9H6V5H4L8 1Z" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                fill="none"
              />
              <path 
                d="M3 12H13" 
                stroke="currentColor" 
                strokeWidth="1.5" 
                strokeLinecap="round"
              />
            </svg>
          </div>
          <div style={{
            fontSize: '13px',
            fontWeight: '500',
            color: theme.colors.text,
            marginBottom: '4px',
          }}>
            No Selection
          </div>
          <div style={{
            fontSize: '11px',
            color: theme.colors.textSecondary,
            lineHeight: '1.4',
            maxWidth: '180px',
          }}>
            Right-click elements to view properties
          </div>
        </div>
      )}
    </PanelContainer>
  );
}; 