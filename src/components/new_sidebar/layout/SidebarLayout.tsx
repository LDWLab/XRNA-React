import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PencilRuler } from 'lucide-react';
import { LEFT_PANEL_WIDTH } from '../../../App';
type SidebarLayoutProps = {
  width?: number | string;
  children: React.ReactNode;
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ width = LEFT_PANEL_WIDTH, children }) => {
  const { theme } = useTheme();
  
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: theme.colors.background,
        borderRight: `2px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.xl,
        position: 'relative',
        overflow: 'hidden',
        transition: theme.transitions.default,
        zIndex: 1000,
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: '4px',
          background: `linear-gradient(90deg, ${theme.colors.primary}, ${theme.colors.accent})`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      />
      
      {/* Sidebar header */}
      <div
        style={{
          padding: '7px 10px 7px 20px',
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          background: theme.colors.surface,
          flexShrink: 0,
        }}
      >
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
        }}>
          <PencilRuler size={24} /> 
          <div>
            <h1 style={{
              fontSize: theme.typography.fontSize.xl,
              fontWeight: '700',
              color: theme.colors.text,
              margin: '0 0 2px 0',
            }}>
              XRNA-React
            </h1>
            <p style={{
              fontSize: theme.typography.fontSize.md,
              fontWeight: '500',
              color: theme.colors.textSecondary,
              margin: 0,
            }}>
              Visualize, Edit, Repeat
            </p>
          </div>
        </div>
      </div>
      
      
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '6px',
          overflow: 'auto',
          background: theme.colors.backgroundSecondary,
        }}
      >
        {children}
      </div>
      
      {/* Bottom accent */}
      <div
        style={{
          height: '4px',
          background: `linear-gradient(90deg, ${theme.colors.borderLight}, ${theme.colors.border})`,
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      />
    </div>
  );
}; 