import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useTheme } from '../../context/ThemeContext';
import { X, Upload, Sparkles, Plus, RefreshCw, Database, Loader2, ChevronDown } from 'lucide-react';
import { inputFileExtensions, InputFileExtension } from '../../io/InputUI';

export type ImportMode = 'new' | 'add';

export interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportPaste: (content: string, mode: ImportMode) => void;
  onImportFile: (file: File, mode: ImportMode) => void;
  onLoadExample: (mode: ImportMode) => void;
  onImportFR3D: (pdbId: string, chainId: string, mode: ImportMode) => Promise<void>;
  errorMessage?: string;
}

const SAMPLE_FASTA = `> molecule_name
UGAAGAACGCAGCGAAAUGCGAUACGUAAUGUGAAUUGCAGAAUUCCGUGAAUCAUCGAAUCUUUGAAC
....(((((((......)))).....(.(((......................)))..)...)))....`;

export const ImportModal: React.FC<ImportModalProps> = ({
  isOpen,
  onClose,
  onImportPaste,
  onImportFile,
  onLoadExample,
  onImportFR3D,
  errorMessage,
}) => {
  const { theme } = useTheme();
  const [mode, setMode] = useState<ImportMode>('new');
  const [pasteContent, setPasteContent] = useState('');
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [pdbId, setPdbId] = useState('');
  const [chainId, setChainId] = useState('');
  const [fr3dLoading, setFr3dLoading] = useState(false);
  const [showFR3D, setShowFR3D] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setPasteContent('');
      setLocalError(null);
      setPdbId('');
      setChainId('');
      setFr3dLoading(false);
      setShowFR3D(false);
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

  const handleFR3DSubmit = useCallback(async () => {
    const trimmedPdbId = pdbId.trim().toUpperCase();
    const trimmedChainId = chainId.trim();
    
    if (!trimmedPdbId) {
      setLocalError('Please enter a PDB ID.');
      return;
    }
    if (!trimmedChainId) {
      setLocalError('Please enter a Chain ID.');
      return;
    }
    
    setLocalError(null);
    setFr3dLoading(true);
    
    try {
      await onImportFR3D(trimmedPdbId, trimmedChainId, mode);
    } catch (error) {
      // Error is handled by parent component
    } finally {
      setFr3dLoading(false);
    }
  }, [pdbId, chainId, mode, onImportFR3D]);

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
          maxWidth: '480px',
          maxHeight: '90vh',
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
            padding: '14px 18px',
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

        {/* Content */}
        <div style={{ padding: '16px 18px', flex: 1, overflow: 'auto' }}>
          {/* Mode Toggle at top */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              padding: '3px',
              marginBottom: '14px',
              background: theme.colors.background,
              borderRadius: theme.borderRadius.md,
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
                gap: '6px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                transition: 'all 0.15s',
                background: mode === 'new' ? theme.colors.primary : 'transparent',
                color: mode === 'new' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              <RefreshCw size={12} />
              New Canvas
            </button>
            <button
              onClick={() => setMode('add')}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                padding: '8px 12px',
                border: 'none',
                borderRadius: theme.borderRadius.sm,
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                transition: 'all 0.15s',
                background: mode === 'add' ? theme.colors.accent : 'transparent',
                color: mode === 'add' ? theme.colors.textInverse : theme.colors.textSecondary,
              }}
            >
              <Plus size={12} />
              Add to Existing
            </button>
          </div>

          {/* File Upload + Example Row */}
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px' }}>
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                border: `1.5px dashed ${dragOver ? theme.colors.primary : theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                padding: '10px 12px',
                cursor: 'pointer',
                transition: 'all 0.15s',
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
              <Upload size={16} color={dragOver ? theme.colors.primary : theme.colors.textMuted} />
              <span style={{ fontSize: theme.typography.fontSize.sm, color: theme.colors.text }}>
                Drop file or browse
              </span>
            </div>
            <button
              onClick={() => { setLocalError(null); onLoadExample(mode); }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '10px 12px',
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
                color: theme.colors.accent,
                backgroundColor: 'transparent',
                border: `1.5px solid ${theme.colors.accent}50`,
                borderRadius: theme.borderRadius.md,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = `${theme.colors.accent}10`;
                e.currentTarget.style.borderColor = theme.colors.accent;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent';
                e.currentTarget.style.borderColor = `${theme.colors.accent}50`;
              }}
            >
              <Sparkles size={14} />
              Example
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept={inputFileExtensions.map(e => `.${e}`).join(',')}
            onChange={handleFileInputChange}
            style={{ display: 'none' }}
          />

          {/* Paste FASTA - Main Input */}
          <div style={{ marginBottom: '12px' }}>
            <label style={{
              display: 'block',
              fontSize: theme.typography.fontSize.xs,
              fontWeight: theme.typography.fontWeight.medium,
              color: theme.colors.textSecondary,
              marginBottom: '6px',
            }}>
              Paste Extended FASTA
            </label>
            <textarea
              value={pasteContent}
              onChange={(e) => { setPasteContent(e.target.value); setLocalError(null); }}
              placeholder={SAMPLE_FASTA}
              style={{
                width: '100%',
                height: '120px',
                padding: '10px 12px',
                fontSize: theme.typography.fontSize.sm,
                fontFamily: 'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Monaco, Consolas, monospace',
                backgroundColor: theme.colors.background,
                color: theme.colors.text,
                border: `1px solid ${theme.colors.border}`,
                borderRadius: theme.borderRadius.md,
                resize: 'vertical',
                outline: 'none',
                boxSizing: 'border-box',
                lineHeight: 1.4,
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = theme.colors.primary;
                e.currentTarget.style.boxShadow = `0 0 0 2px ${theme.colors.primary}20`;
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = theme.colors.border;
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
            <button
              onClick={handlePasteSubmit}
              disabled={!pasteContent.trim()}
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
                backgroundColor: !pasteContent.trim() 
                  ? theme.colors.textMuted 
                  : (mode === 'new' ? theme.colors.primary : theme.colors.accent),
                border: 'none',
                borderRadius: theme.borderRadius.md,
                cursor: !pasteContent.trim() ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
                opacity: !pasteContent.trim() ? 0.6 : 1,
              }}
              onMouseEnter={(e) => {
                if (pasteContent.trim()) e.currentTarget.style.opacity = '0.9';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.opacity = !pasteContent.trim() ? '0.6' : '1';
              }}
            >
              {mode === 'new' ? <RefreshCw size={14} /> : <Plus size={14} />}
              Import FASTA
            </button>
          </div>

          {/* FR3D Collapsible Section */}
          <div style={{
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            overflow: 'hidden',
          }}>
            <button
              onClick={() => setShowFR3D(!showFR3D)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 12px',
                background: theme.colors.background,
                border: 'none',
                cursor: 'pointer',
                color: theme.colors.textSecondary,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Database size={14} />
                Fetch from PDB (FR3D)
              </span>
              <ChevronDown 
                size={14} 
                style={{ 
                  transform: showFR3D ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s',
                }} 
              />
            </button>
            {showFR3D && (
              <div style={{ padding: '12px', borderTop: `1px solid ${theme.colors.border}` }}>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '10px' }}>
                  <input
                    type="text"
                    value={pdbId}
                    onChange={(e) => { setPdbId(e.target.value.toUpperCase()); setLocalError(null); }}
                    placeholder="PDB ID (e.g. 1GID)"
                    style={{
                      flex: 1,
                      padding: '8px 10px',
                      fontSize: theme.typography.fontSize.sm,
                      fontFamily: 'monospace',
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      outline: 'none',
                      boxSizing: 'border-box',
                      textTransform: 'uppercase',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = theme.colors.border; }}
                  />
                  <input
                    type="text"
                    value={chainId}
                    onChange={(e) => { setChainId(e.target.value); setLocalError(null); }}
                    placeholder="Chain"
                    style={{
                      width: '70px',
                      padding: '8px 10px',
                      fontSize: theme.typography.fontSize.sm,
                      fontFamily: 'monospace',
                      backgroundColor: theme.colors.surface,
                      color: theme.colors.text,
                      border: `1px solid ${theme.colors.border}`,
                      borderRadius: theme.borderRadius.sm,
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                    onFocus={(e) => { e.currentTarget.style.borderColor = theme.colors.primary; }}
                    onBlur={(e) => { e.currentTarget.style.borderColor = theme.colors.border; }}
                  />
                </div>
                <button
                  onClick={handleFR3DSubmit}
                  disabled={fr3dLoading || !pdbId.trim() || !chainId.trim()}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    padding: '8px 12px',
                    fontSize: theme.typography.fontSize.xs,
                    fontWeight: theme.typography.fontWeight.medium,
                    color: theme.colors.textInverse,
                    backgroundColor: (fr3dLoading || !pdbId.trim() || !chainId.trim())
                      ? theme.colors.textMuted 
                      : (mode === 'new' ? theme.colors.primary : theme.colors.accent),
                    border: 'none',
                    borderRadius: theme.borderRadius.sm,
                    cursor: (fr3dLoading || !pdbId.trim() || !chainId.trim()) ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                    opacity: (fr3dLoading || !pdbId.trim() || !chainId.trim()) ? 0.6 : 1,
                  }}
                >
                  {fr3dLoading ? (
                    <>
                      <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
                      Fetching...
                    </>
                  ) : (
                    <>
                      <Database size={12} />
                      Fetch
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Error Display */}
          {displayError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginTop: '12px',
                padding: '10px 12px',
                backgroundColor: `${theme.colors.error}10`,
                borderRadius: theme.borderRadius.md,
                border: `1px solid ${theme.colors.error}20`,
              }}
            >
              <span style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.error, lineHeight: 1.4 }}>
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
