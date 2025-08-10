import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Tab, tabs } from '../../../app_data/Tab';

export interface AboutDrawerProps {
  open: boolean;
  onClose: () => void;
  renderTabInstructions: (tab: Tab) => JSX.Element;
}

export const AboutDrawer: React.FC<AboutDrawerProps> = ({ open, onClose, renderTabInstructions }) => {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '720px',
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
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#3b82f6' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ffffff' }}>
            About XRNA
          </span>
        </div>
        <button
          onClick={onClose}
          style={{ border: 'none', background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer', fontSize: '14px', color: '#ffffff', padding: '6px 8px', borderRadius: '6px', width: '28px', height: '28px' }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <PanelContainer title="Getting Started" borderRadius={8}>
          <div style={{ fontSize: 14, color: '#334155' }}>
            {renderTabInstructions(Tab.ABOUT)}
          </div>
        </PanelContainer>

        <div style={{ height: 12 }} />

        <PanelContainer title="Tabs" borderRadius={8}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tabs.map((t) => (
              t !== Tab.ABOUT ? (
                <div key={t}>
                  <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b', marginBottom: 6 }}>{t}</div>
                  <div style={{ fontSize: 13, color: '#334155' }}>{renderTabInstructions(t)}</div>
                </div>
              ) : null
            ))}
          </div>
        </PanelContainer>
      </div>
    </div>
  );
};


