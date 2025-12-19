import React, { useState, useRef, useEffect } from 'react';
import { useTheme } from '../../../context/ThemeContext';

export interface PropertiesDrawerProps {
  open: boolean;
  onClose: () => void;
  content?: JSX.Element;
  isEditMenu?: boolean;
}

export const PropertiesDrawer: React.FC<PropertiesDrawerProps> = ({
  open,
  onClose,
  content,
  isEditMenu = false,
}) => {
  const { theme } = useTheme();
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
        background: theme.colors.backgroundSecondary,
        boxShadow: theme.shadows.lg,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: theme.transitions.default,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `1px solid ${theme.colors.border}`,
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
            top: '50%',
            transform: 'translateY(-50%)',
            width: '2px',
            height: '40px',
            background: theme.colors.border,
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
          borderBottom: `1px solid ${theme.colors.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.colors.surfaceHover,
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
            background: theme.colors.primary,
          }}
        />
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              background: theme.colors.primary,
              boxShadow: theme.shadows.sm,
            }}
          />
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 2,
            }}
          >
            <span
              style={{
                fontSize: theme.typography.fontSize.sm,
                fontWeight: 700,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
                color: theme.colors.text,
              }}
            >
              {isEditMenu ? 'Edit Panel' : 'Properties'}
            </span>
            <span
              style={{
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
              }}
            >
              {isEditMenu ? 'Modify selected element properties' : 'Edit options for the selected element'}
            </span>
          </div>
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
            transition: 'all 0.2s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '28px',
            height: '28px',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = theme.colors.surface;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: 0 }}>
        {content ? (
          <div style={{
            background: theme.colors.backgroundSecondary,
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
          }}>
            {/* Selected Element Header */}
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
                background: theme.colors.success,
                boxShadow: theme.shadows.sm,
              }} />
              <span style={{
                fontSize: theme.typography.fontSize.xs,
                fontWeight: '600',
                textTransform: 'uppercase',
                letterSpacing: '0.5px',
                color: theme.colors.text,
              }}>
                Selected Element
              </span>
            </div>
            
            {/* Content - Scrollable within drawer */}
            <div style={{
              flex: 1,
              padding: '16px 20px 24px 20px',
              background: theme.colors.backgroundSecondary,
              fontSize: theme.typography.fontSize.md,
              lineHeight: '1.5',
              color: theme.colors.text,
              overflow: 'auto',
              scrollBehavior: 'smooth',
              display: 'flex',
              justifyContent: 'center',
            }}>
              <div
                style={{
                  width: '100%',
                  maxWidth: 560,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                }}
              >
                {content}
              </div>
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
            height: '100%',
          }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              background: theme.colors.surfaceHover,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: theme.shadows.md,
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
              color: theme.colors.text,
              marginBottom: '8px',
            }}>
              No Selection
            </div>
            <div style={{
              fontSize: '13px',
              color: theme.colors.textSecondary,
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