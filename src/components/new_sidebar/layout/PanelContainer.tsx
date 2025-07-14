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
        background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        border: '1px solid #e2e8f0',
        borderRadius: borderRadius,
        margin: '0 0 0 0',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '12px 20px',
          background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          fontSize: '14px',
          fontWeight: '600',
          letterSpacing: '0.5px',
          color: '#ffffff',
          display: 'flex',
          alignItems: 'center',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        <span style={{ 
          textTransform: 'uppercase',
          fontSize: '12px',
          fontWeight: '700',
        }}>
          {title}
        </span>
      </div>
      <div
        style={{
          padding: '20px',
          minHeight: '60px',
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        {children}
      </div>
    </div>
  );
}; 