import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PencilRuler } from 'lucide-react';
type SidebarLayoutProps = {
  width?: number | string;
  children: React.ReactNode;
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ width = 420, children }) => {
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
          // flexShrink: 0,
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
              fontSize: '18px',
              fontWeight: '700',
              color: theme.colors.text,
              margin: '0 0 2px 0',
            }}>
              XRNA React
            </h1>
            <p style={{
              fontSize: '12px',
              color: theme.colors.textSecondary,
              margin: 0,
            }}>
              Your one stop shop for 
              RNA Structure Editing & Visualizing
            </p>
          </div>
        </div>
      </div>
      
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          overflow: 'auto',
          background: theme.colors.backgroundSecondary,
        }}
      >
        {children}
      </div>
      
      {/* Bottom accent */}
      <div
        style={{
          height: '2px',
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