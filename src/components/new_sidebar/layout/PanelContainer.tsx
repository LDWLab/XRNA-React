import { useState } from 'react';

type PanelContainerProps = {
  title: string;
  initialCollapsed?: boolean;
  children: React.ReactNode;
  borderRadius?: number;
};

export const PanelContainer: React.FC<PanelContainerProps> = ({ 
  title, 
  children, 
  borderRadius = 12
}) => {
  return (
    <div
      style={{
        background: '#ffffff',
        border: '1px solid #e5e7eb',
        borderRadius: borderRadius,
        margin: '0 0 10px 0',
        boxShadow: '0 1px 2px rgba(16, 24, 40, 0.04)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '10px 14px',
          background: '#f8fafc',
          fontSize: '12px',
          fontWeight: 700,
          letterSpacing: '0.4px',
          color: '#0f172a',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid #e5e7eb',
        }}
      >
        <span style={{ 
          textTransform: 'uppercase',
          fontSize: '11px',
          fontWeight: 700,
        }}>
          {title}
        </span>
      </div>
      <div
        style={{
          padding: 14,
          minHeight: '48px',
          background: '#ffffff',
        }}
      >
        {children}
      </div>
    </div>
  );
}; 