import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';

export type QuickActionsCallbacks = {
  onOpenFile?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onExportWithFormat?: (filename: string, format: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetViewport?: () => void;
  fileName?: string;
  exportFormat?: string;
  exportFormats?: Array<{ value: string; label: string }>;
  onFileNameChange?: (filename: string) => void;
  onExportFormatChange?: (format: string) => void;
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
};

export const CompactButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary';
}> = ({ onClick, icon, label, disabled = false, variant = 'secondary' }) => {
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const isPrimary = variant === 'primary';
  
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '4px',
        padding: '8px 6px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '9px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.5 : 1,
        flex: 1,
        minWidth: '0',
        background: disabled 
          ? '#f1f5f9' 
          : isPrimary
            ? (isPressed ? '#2563eb' : isHovered ? '#3b82f6' : '#4f46e5')
            : (isPressed ? '#e2e8f0' : isHovered ? '#f1f5f9' : '#ffffff'),
        color: disabled 
          ? '#94a3b8' 
          : isPrimary 
            ? '#ffffff' 
            : '#475569',
        boxShadow: disabled 
          ? 'none' 
          : isPrimary
            ? (isPressed ? '0 1px 3px rgba(79, 70, 229, 0.3)' : '0 2px 6px rgba(79, 70, 229, 0.2)')
            : (isPressed ? '0 1px 2px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.08)'),
        transform: disabled 
          ? 'none' 
          : (isPressed ? 'scale(0.95)' : isHovered ? 'translateY(-1px)' : 'translateY(0)'),
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        fontSize: '14px',
        opacity: disabled ? 0.5 : 1,
      }}>
        {icon}
      </div>
      <span style={{ 
        textAlign: 'center',
        letterSpacing: '0.3px',
        lineHeight: '1.2',
        fontSize: '9px',
        fontWeight: '600',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </button>
  );
};

export const QuickActionsPanel: React.FC<QuickActionsCallbacks> = ({
  onOpenFile,
  onSave,
  onExportWithFormat,
  fileName = '',
  exportFormat = '',
  exportFormats = [],
  onFileNameChange,
  onExportFormatChange,
  onToggleBasePairEditor,
  onTogglePropertiesDrawer,
}) => {
  return (
    <PanelContainer title="File Operations" borderRadius={0}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {/* IO Section */}
        <div>
          <div style={{ fontSize: '10px', fontWeight: '600', color: '#64748b', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            File Operations
          </div>
          <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
            <CompactButton
              onClick={onOpenFile}
              disabled={!onOpenFile}
              variant="primary"
              icon={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M2 2.5A1.5 1.5 0 013.5 1h2.086a1 1 0 01.707.293l1.414 1.414a1 1 0 00.707.293H9.5A1.5 1.5 0 0111 4.5v5A1.5 1.5 0 019.5 11h-6A1.5 1.5 0 012 9.5v-7z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                </svg>
              }
              label="Open"
            />
            <CompactButton
              onClick={onSave}
              disabled={!onSave}
              icon={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M9 1H3a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2V3a2 2 0 00-2-2z" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                  <path d="M7 1v2H5V1M5 7h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              }
              label="Save"
            />
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={fileName}
              onChange={e => onFileNameChange?.(e.target.value)}
              style={{
                flex: 2,
                fontSize: '11px',
                padding: '7px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 500,
                outline: 'none',
                minWidth: 0,
              }}
              placeholder="Filename"
            />
            <select
              value={exportFormat}
              onChange={e => onExportFormatChange?.(e.target.value)}
              style={{
                flex: 1,
                fontSize: '11px',
                padding: '7px 10px',
                border: '1px solid #e2e8f0',
                borderRadius: '4px',
                background: '#f8fafc',
                color: '#475569',
                fontWeight: 500,
                outline: 'none',
                minWidth: 0,
              }}
            >
              {exportFormats.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <CompactButton
              onClick={() => onExportWithFormat?.(fileName, exportFormat)}
              disabled={!fileName || !exportFormat}
              icon={
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                  <path d="M6 1v6m0 0l2-2m-2 2L4 5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M2 9h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                </svg>
              }
              label="Export"
            />
          </div>
        </div>
      </div>
      {/* Editor Section */}
      {(onToggleBasePairEditor || onTogglePropertiesDrawer) && (
        <div style={{ marginTop: '12px' }}>
          <div
            style={{
              fontSize: '10px',
              fontWeight: '600',
              color: '#64748b',
              marginBottom: '6px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Editors
          </div>
          <div style={{ display: 'flex', gap: '4px' }}>
            {onToggleBasePairEditor && (
              <CompactButton
                onClick={onToggleBasePairEditor}
                icon={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2" y="3" width="8" height="6" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M4 5h4M4 7h4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                }
                label="Base Pairs"
              />
            )}
            {onTogglePropertiesDrawer && (
              <CompactButton
                onClick={onTogglePropertiesDrawer}
                icon={
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <rect x="2" y="2" width="8" height="8" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
                    <path d="M4 4h4M4 6h4M4 8h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                  </svg>
                }
                label="Properties"
              />
            )}
          </div>
        </div>
      )}
    </PanelContainer>
  );
}; 