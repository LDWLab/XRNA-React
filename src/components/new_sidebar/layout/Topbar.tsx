import React from 'react';

export type TopbarProps = {
  onOpenFile?: () => void;
  onSave?: () => void;
  onExportWithFormat?: (filename: string, format: string) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetViewport?: () => void;
  fileName?: string;
  onFileNameChange?: (name: string) => void;
  exportFormat?: string;
  exportFormats?: Array<{ value: string; label: string }>;
  onExportFormatChange?: (format: string) => void;
};

export const TOPBAR_HEIGHT = 56;

export const Topbar: React.FC<TopbarProps> = ({
  onOpenFile,
  onSave,
  onExportWithFormat,
  onUndo,
  onRedo,
  onResetViewport,
  fileName = '',
  onFileNameChange,
  exportFormat = '',
  exportFormats = [],
  onExportFormatChange,
}) => {
  const ActionButton: React.FC<{ onClick?: () => void; label: string; primary?: boolean; disabled?: boolean }>
    = ({ onClick, label, primary = false, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 32,
        padding: '0 12px',
        borderRadius: 8,
        border: primary ? '1px solid #4338ca' : '1px solid #e5e7eb',
        background: primary ? '#4f46e5' : '#ffffff',
        color: primary ? '#ffffff' : '#0f172a',
        fontSize: 12,
        fontWeight: 600,
        cursor: disabled ? 'not-allowed' : 'pointer',
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 420,
        right: 0,
        height: TOPBAR_HEIGHT,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 16px',
        background: '#ffffff',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 1px 2px rgba(16,24,40,0.04)',
        zIndex: 1200,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ fontWeight: 800, color: '#111827', fontSize: 14, letterSpacing: 0.2 }}>XRNA</div>
        <div style={{ width: 1, height: 24, background: '#e5e7eb' }} />
        <input
          type="text"
          placeholder="Filename"
          value={fileName}
          onChange={(e) => onFileNameChange?.(e.target.value)}
          style={{
            height: 32,
            padding: '0 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 12,
            background: '#ffffff',
            color: '#0f172a',
            minWidth: 180,
          }}
        />
        <select
          value={exportFormat}
          onChange={(e) => onExportFormatChange?.(e.target.value)}
          style={{
            height: 32,
            padding: '0 10px',
            border: '1px solid #e5e7eb',
            borderRadius: 8,
            fontSize: 12,
            background: '#ffffff',
            color: '#0f172a',
            minWidth: 120,
          }}
        >
          {exportFormats.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ActionButton
          label="Export"
          primary
          disabled={!fileName || !exportFormat}
          onClick={() => onExportWithFormat?.(fileName, exportFormat)}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <ActionButton label="Open" onClick={onOpenFile} />
        <ActionButton label="Save" onClick={onSave} />
        <div style={{ width: 8 }} />
        <ActionButton label="Undo" onClick={onUndo} />
        <ActionButton label="Redo" onClick={onRedo} />
        <ActionButton label="Reset" onClick={onResetViewport} />
      </div>
    </div>
  );
};


