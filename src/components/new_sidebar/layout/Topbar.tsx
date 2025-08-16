import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { MinimalThemeToggle } from '../../ui/ThemeToggle';

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
  const { theme } = useTheme();
  const ActionButton: React.FC<{ onClick?: () => void; label: string; primary?: boolean; disabled?: boolean }>
    = ({ onClick, label, primary = false, disabled = false }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        height: 32,
        padding: '0 12px',
        borderRadius: theme.borderRadius.md,
        border: primary ? `1px solid ${theme.colors.primary}` : `1px solid ${theme.colors.border}`,
        background: primary ? theme.colors.primary : theme.colors.surface,
        color: primary ? theme.colors.textInverse : theme.colors.text,
        fontSize: theme.typography.fontSize.sm,
        fontWeight: theme.typography.fontWeight.semibold,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: theme.transitions.default,
        opacity: disabled ? 0.5 : 1,
      }}
      onMouseEnter={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = primary ? theme.colors.primaryHover : theme.colors.surfaceHover;
          e.currentTarget.style.transform = 'translateY(-1px)';
        }
      }}
      onMouseLeave={(e) => {
        if (!disabled) {
          e.currentTarget.style.background = primary ? theme.colors.primary : theme.colors.surface;
          e.currentTarget.style.transform = 'translateY(0)';
        }
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
        background: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        // boxShadow: theme.shadows.sm,
        zIndex: 1200,
        transition: theme.transitions.default,
      }}
    >
      {/* Top accent bar */}
      <div
        style={{
          height: '4px',
          background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.primary})`,
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      />
      
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <ActionButton label="Open" onClick={onOpenFile} />
        <input
          type="text"
          placeholder="Filename"
          value={fileName}
          onChange={(e) => onFileNameChange?.(e.target.value)}
          style={{
            height: 32,
            padding: '0 10px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            background: theme.colors.background,
            color: theme.colors.text,
            minWidth: 180,
            transition: theme.transitions.default,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}25`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.boxShadow = 'none';
          }}
        />
        <select
          value={exportFormat}
          onChange={(e) => onExportFormatChange?.(e.target.value)}
          style={{
            height: 32,
            padding: '0 10px',
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
            background: theme.colors.background,
            color: theme.colors.text,
            minWidth: 60,
            transition: theme.transitions.default,
          }}
        >
          {exportFormats.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
        <ActionButton label="Save" onClick={onSave} />
        <ActionButton
          label="Export"
          primary
          disabled={!fileName || !exportFormat}
          onClick={() => onExportWithFormat?.(fileName, exportFormat)}
        />
      </div>
      <MinimalThemeToggle />
    </div>
  );
};


