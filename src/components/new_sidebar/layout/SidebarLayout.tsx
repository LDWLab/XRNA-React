import React from 'react';

type SidebarLayoutProps = {
  width?: number | string;
  children: React.ReactNode;
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ width = 420, children }) => {
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f8fafc',
        borderRight: '1px solid #e5e7eb',
        boxShadow: '4px 0 20px rgba(0, 0, 0, 0.06)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle top accent */}
      <div
        style={{
          height: '3px',
          background: '#3b82f6',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      />
      
      {/* Main content area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '16px 14px 14px 14px',
          overflow: 'auto',
        }}
      >
        {children}
      </div>
    </div>
  );
}; 