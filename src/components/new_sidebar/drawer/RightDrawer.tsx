import React, { useEffect, useRef, useState } from 'react';

export interface RightDrawerProps {
  open: boolean;
  onClose: () => void;
  title: string;
  startWidth?: number;
  children?: React.ReactNode;
}

export const RightDrawer: React.FC<RightDrawerProps> = ({ open, onClose, title, startWidth = 480, children }) => {
  const [width, setWidth] = useState(startWidth);
  const [isResizing, setIsResizing] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      const newWidth = window.innerWidth - e.clientX;
      setWidth(Math.max(320, Math.min(900, newWidth)));
    };
    const handleMouseUp = () => setIsResizing(false);
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isResizing]);

  return (
    <div
      ref={drawerRef}
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: `${width}px`,
        background: 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.10)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 3000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #e2e8f0',
      }}
    >
      {/* Resize Handle */}
      <div
        style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', cursor: 'ew-resize' }}
        onMouseDown={handleMouseDown}
      >
        <div
          style={{
            position: 'absolute',
            left: '1px',
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2px',
            height: '40px',
            background: 'linear-gradient(135deg, #cbd5e1 0%, #94a3b8 100%)',
            borderRadius: '1px',
            opacity: isResizing ? 1 : 0.3,
            transition: 'opacity 0.2s ease',
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#3b82f6' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ffffff' }}>
            {title}
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none', background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer', fontSize: '14px', color: '#ffffff',
            padding: '6px 8px', borderRadius: '6px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {children}
      </div>
    </div>
  );
};


