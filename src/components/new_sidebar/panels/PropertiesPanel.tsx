import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';

export interface PropertiesPanelProps {
  content?: JSX.Element;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ content }) => {
  return (
    <PanelContainer title="Properties">
      {content ? (
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '8px',
          padding: '0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Header */}
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
              background: '#3b82f6',
              boxShadow: '0 1px 2px rgba(59, 130, 246, 0.3)',
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
          
          {/* Content - Scrollable within panel */}
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
          height: '200px',
        }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '12px',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
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
            color: '#475569',
            marginBottom: '4px',
          }}>
            No Selection
          </div>
          <div style={{
            fontSize: '11px',
            color: '#64748b',
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