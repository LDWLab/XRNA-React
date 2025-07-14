import React, { useState, useRef, useEffect } from 'react';

export interface PropertiesDrawerProps {
  open: boolean;
  onClose: () => void;
  content?: JSX.Element;
}

export const PropertiesDrawer: React.FC<PropertiesDrawerProps> = ({
  open,
  onClose,
  content,
}) => {
  const [width, setWidth] = useState(400);
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
      setWidth(Math.max(300, Math.min(800, newWidth)));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

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
        boxShadow: '-4px 0 20px rgba(0,0,0,0.08)',
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: 'transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: '1px solid #e2e8f0',
      }}
    >
      {/* Resize Handle */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
          width: '4px',
          cursor: 'ew-resize',
          background: 'transparent',
          zIndex: 10,
        }}
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
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
          flexShrink: 0,
          position: 'relative',
        }}
      >
        {/* Subtle top accent */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '3px',
            background: '#3b82f6',
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: '#3b82f6',
              boxShadow: '0 1px 2px rgba(59, 130, 246, 0.3)',
            }}
          />
          <span
            style={{
              fontSize: '12px',
              fontWeight: 700,
              letterSpacing: '0.5px',
              textTransform: 'uppercase',
              color: '#ffffff',
            }}
          >
            Properties
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none',
            background: 'rgba(255, 255, 255, 0.1)',
            cursor: 'pointer',
            fontSize: '14px',
            color: '#ffffff',
            padding: '6px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0' }}>
        {content ? (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Selected Element Header */}
            <div style={{
              padding: '12px 16px',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              borderBottom: '1px solid #e2e8f0',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexShrink: 0,
            }}>
              <div style={{
                width: '6px',
                height: '6px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                boxShadow: '0 1px 2px rgba(16, 185, 129, 0.3)',
              }} />
              <span style={{
                fontSize: '11px',
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: '#475569',
              }}>
                Selected Element
              </span>
            </div>
            
            {/* Content - Scrollable within drawer */}
            <div style={{
              flex: 1,
              padding: '16px',
              background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
              fontSize: '13px',
              lineHeight: '1.5',
              color: '#475569',
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
            color: '#64748b',
            height: '100%',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            }}>
              <svg width="20" height="20" viewBox="0 0 16 16" fill="none">
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
              fontSize: '15px',
              fontWeight: '500',
              color: '#475569',
              marginBottom: '8px',
            }}>
              No Selection
            </div>
            <div style={{
              fontSize: '13px',
              color: '#64748b',
              lineHeight: '1.4',
              maxWidth: '240px',
            }}>
              Right-click on elements in the canvas to view and edit their properties
            </div>
          </div>
        )}
      </div>
    </div>
  );
}; 