import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import { X, FileText, Upload, Sparkles, Plus, RefreshCw } from 'lucide-react';
import { inputFileExtensions, InputFileExtension } from '../../io/InputUI';

export type ImportMode = 'new' | 'add';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPaste: (content: string, mode: ImportMode) => void;
  onImportFile: (file: File, mode: ImportMode) => void;
  onLoadExample: (mode: ImportMode) => void;
  errorMessage?: string;
}

const SAMPLE_FASTA = `> sample_molecule
CCCCAAAAGGGG
((((....))))`;

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportPaste,
  onImportFile,
  onLoadExample,
  errorMessage,
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<ImportMode>('new');
  const [pasteContent, setPasteContent] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showPasteArea, setShowPasteArea] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasteContent('');
      setLocalError(null);
      setShowPasteArea(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (errorMessage) {
      setLocalError(errorMessage);
    }
  }, [errorMessage]);

  const handlePasteSubmit = useCallback(() => {
    const trimmed = pasteContent.trim();
    if (!trimmed) {
      setLocalError('Please enter content to import.');
      return;
    }
    if (!trimmed.startsWith('>')) {
      setLocalError('Extended FASTA must start with ">" followed by the molecule name.');
      return;
    }
    setLocalError(null);
    onImportPaste(trimmed, mode);
  }, [pasteContent, mode, onImportPaste]);

  const handleFileSelect = useCallback((file: File) => {
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!extension || !inputFileExtensions.includes(extension as InputFileExtension)) {
      setLocalError(`Unsupported file type. Supported: ${inputFileExtensions.join(', ')}`);
      return;
    }
    setLocalError(null);
    onImportFile(file, mode);
  }, [mode, onImportFile]);

  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
    e.target.value = '';
  }, [handleFileSelect]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  }, [onClose]);

  if (!isOpen) return null;

  const displayError = localError || errorMessage;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
      role="dialog"
      aria-modal="true"
      aria-label="Import structure"
    >
      <div
        style={{
          backgroundColor: theme.colors.surface,
          borderRadius: theme.borderRadius.xl,
          boxShadow: theme.shadows.xl,
          width: '90%',
          maxWidth: '520px',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          border: `1px solid ${theme.colors.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            background: `linear-gradient(135deg, ${theme.colors.primary}08, ${theme.colors.accent}08)`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: theme.typography.fontSize.lg,
              fontWeight: theme.typography.fontWeight.semibold,
              color: theme.colors.text,
            }}
          >
            Import Structure
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: theme.borderRadius.md,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.textMuted,
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
              e.currentTarget.style.color = theme.colors.text;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = theme.colors.textMuted;
            }}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        {/* Mode Toggle */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${theme.colors.border}`,
            background: theme.colors.background,
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '4px',
              background: theme.colors.surface,
              borderRadius: theme.borderRadius.lg,
              border: `1px solid ${theme.colors.border}`,
            }}
          >
            <button
              onClick={() => setMode('new')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                transition: 'all 0.2s',
                background: mode === 'new' ? theme.colors.primary : 'transparent',
                color: mode === 'new' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              <RefreshCw size={14} />
              New Canvas
            </button>
            <button
              onClick={() => setMode('add')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '10px 16px',
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                transition: 'all 0.2s',
                background: mode === 'add' ? theme.colors.accent : 'transparent',
                color: mode === 'add' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              <Plus size={14} />
              Add to Existing
            </button>
          </div>
          <p
            style={{
              margin: '8px 0 0 0',
              fontSize: theme.typography.fontSize.xs,
              color: theme.colors.textMuted,
              textAlign: 'center',
            }}
          >
            {mode === 'new' 
              ? 'Clears canvas and loads new structure' 
              : 'Adds structure on top of existing content'}
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '20px', flex: 1, overflow: 'auto' }}>
          {/* File Upload Section */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? theme.colors.primary : theme.colors.border}`,
              borderRadius: theme.borderRadius.lg,
              padding: '24px 20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s',
              background: dragOver ? `${theme.colors.primary}10` : theme.colors.background,
            }}
            onMouseEnter={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = theme.colors.textSecondary;
                e.currentTarget.style.background = theme.colors.surfaceHover;
              }
            }}
            onMouseLeave={(e) => {
              if (!dragOver) {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.background = theme.colors.background;
              }
            }}
          >
            <Upload 
              size={32} 
              color={dragOver ? theme.colors.primary : theme.colors.textMuted}
              style={{ marginBottom: '8px' }}
            />
            <p
              style={{
                margin: '0 0 4px 0',
                fontSize: theme.typography.fontSize.sm,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.text,
              }}
            >
              Drop file here or click to browse
            </p>
            <p
              style={{
                margin: 0,
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textMuted,
              }}
            >
              {inputFileExtensions.map(e => `.${e}`).join(', ')}
            </p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={inputFileExtensions.map(e => `.${e}`).join(',')}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {/* Example Button */}
          <button
            onClick={() => {
              setLocalError(null);
              onLoadExample(mode);
            }}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              marginTop: '12px',
              fontSize: theme.typography.fontSize.sm,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.accent,
              backgroundColor: 'transparent',
              border: `1px solid ${theme.colors.accent}40`,
              borderRadius: theme.borderRadius.md,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = `${theme.colors.accent}10`;
              e.currentTarget.style.borderColor = theme.colors.accent;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.borderColor = `${theme.colors.accent}40`;
            }}
          >
            <Sparkles size={16} />
            Load Example (7K00 5S rRNA)
          </button>

          {/* Divider with Paste toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '16px 0',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: theme.colors.border }} />
            <button
              onClick={() => {
                setShowPasteArea(!showPasteArea);
                setLocalError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                fontSize: theme.typography.fontSize.xs,
                color: theme.colors.textSecondary,
                backgroundColor: 'transparent',
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.full,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = theme.colors.surfaceHover;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              <FileText size={12} />
              {showPasteArea ? 'Hide' : 'Paste FASTA'}
            </button>
            <div style={{ flex: 1, height: '1px', background: theme.colors.border }} />
          </div>

          {/* Paste Area (collapsible) */}
          {showPasteArea && (
            <div>
              <textarea
                value={pasteContent}
                onChange={(e) => {
                  setPasteContent(e.target.value);
                  setLocalError(null);
                }}
                placeholder={SAMPLE_FASTA}
                style={{
                  width: '100%',
                  height: '120px',
                  padding: '12px',
                  fontSize: theme.typography.fontSize.sm,
                  fontFamily: 'monospace',
                  backgroundColor: theme.colors.background,
                  color: theme.colors.text,
                  border: `1px solid ${displayError ? theme.colors.error : theme.colors.border}`,
                  borderRadius: theme.borderRadius.md,
                  resize: 'vertical',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                  boxSizing: 'border-box',
                }}
                onFocus={(e) => {
                  if (!displayError) {
                    e.currentTarget.style.borderColor = theme.colors.primary;
                  }
                }}
                onBlur={(e) => {
                  if (!displayError) {
                    e.currentTarget.style.borderColor = theme.colors.border;
                  }
                }}
                autoFocus
              />
              <button
                onClick={handlePasteSubmit}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 16px',
                  marginTop: '8px',
                  fontSize: theme.typography.fontSize.sm,
                  fontWeight: theme.typography.fontWeight.medium,
                  color: theme.colors.textInverse,
                  backgroundColor: mode === 'new' ? theme.colors.primary : theme.colors.accent,
                  border: 'none',
                  borderRadius: theme.borderRadius.md,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-1px)';
                  e.currentTarget.style.boxShadow = theme.shadows.md;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
              >
                {mode === 'new' ? <RefreshCw size={14} /> : <Plus size={14} />}
                {mode === 'new' ? 'Import FASTA' : 'Add FASTA'}
              </button>
            </div>
          )}

          {/* Error Display */}
          {displayError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '8px',
                marginTop: '16px',
                padding: '12px 14px',
                backgroundColor: `${theme.colors.error}15`,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.error}30`,
              }}
            >
              <span
                style={{
                  fontSize: theme.typography.fontSize.sm,
                  color: theme.colors.error,
                  lineHeight: 1.4,
                }}
              >
                {displayError}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
};
