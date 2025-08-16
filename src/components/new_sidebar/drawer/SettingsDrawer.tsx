import React, { useMemo, useRef } from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { PanelContainer } from '../layout/PanelContainer';
import { settings as allSettings, settingsLongDescriptionsMap, settingsShortDescriptionsMap, settingsTypeMap, type SettingsRecord, Setting, isSetting } from '../../../ui/Setting';
import InputWithValidator from '../../generic/InputWithValidator';
import { Upload, Download, X } from 'lucide-react';

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: SettingsRecord;
  setSettings: (s: SettingsRecord) => void;
  getDistanceDefaults?: () => Partial<SettingsRecord>;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose, settings, setSettings, getDistanceDefaults }) => {
  const { theme, isDarkMode } = useTheme();
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const downloadAnchorRef = useRef<HTMLAnchorElement>(null);

  const onUpload = () => uploadInputRef.current?.click();
  const onDownload = () => {
    const anchor = downloadAnchorRef.current!;
    let derived: Partial<SettingsRecord> = {};
    if (getDistanceDefaults) {
      try { derived = getDistanceDefaults() || {}; } catch { /* ignore */ }
    }
    const obj: Partial<SettingsRecord> = { ...derived };
    for (const key of Object.keys(settings) as Array<Setting>) {
      const value = settings[key];
      // avoid NaN in JSON
      obj[key] = (typeof value === 'number' && Number.isNaN(value)) ? 1 as any : value;
    }
    anchor.href = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(obj))}`;
    anchor.click();
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        right: 0,
        height: '100%',
        width: '600px',
        background: theme.colors.background,
        boxShadow: theme.shadows.xl,
        transform: open ? 'translateX(0)' : 'translateX(100%)',
        transition: theme.transitions.default,
        zIndex: 2000,
        display: 'flex',
        flexDirection: 'column',
        borderLeft: `2px solid ${theme.colors.border}`,
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '24px 28px 20px 28px',
          borderBottom: `1px solid ${theme.colors.borderLight}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: theme.colors.surface,
          flexShrink: 0,
          position: 'relative',
        }}
      >
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            background: `linear-gradient(135deg, ${theme.colors.primary}20, ${theme.colors.accent}20)`,
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: theme.colors.primary,
            border: `1px solid ${theme.colors.primary}30`,
          }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73v.18a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.51a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h2 style={{ 
              fontSize: '20px', 
              fontWeight: '700', 
              color: theme.colors.text,
              margin: '0 0 4px 0',
              letterSpacing: '-0.02em',
            }}>
              Settings
            </h2>
            <p style={{ 
              fontSize: '14px', 
              color: theme.colors.textWeak || theme.colors.textSecondary,
              margin: 0,
              lineHeight: '1.4',
            }}>
              Configure your application preferences and behavior
            </p>
          </div>
        </div>
        
        <button
          onClick={onClose}
          style={{
            border: `1px solid ${theme.colors.border}`,
            background: theme.colors.surface,
            cursor: 'pointer',
            fontSize: '14px',
            color: theme.colors.textSecondary,
            padding: '10px',
            borderRadius: '10px',
            width: '40px',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: theme.transitions.default,
            boxShadow: theme.shadows.sm,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = theme.colors.surfaceHover;
            e.currentTarget.style.borderColor = theme.colors.borderDark;
            e.currentTarget.style.color = theme.colors.text;
            e.currentTarget.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = theme.colors.surface;
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.color = theme.colors.textSecondary;
            e.currentTarget.style.transform = 'scale(1)';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '28px', background: theme.colors.backgroundSecondary }}>
        {/* Import/Export Section */}
        <PanelContainer title="Import/Export" borderRadius={12}>
          <div style={{ 
            display: 'flex', 
            gap: '16px', 
            alignItems: 'center',
            flexWrap: 'wrap',
          }}>
            <button 
              onClick={onUpload} 
              style={{
                ...buttonStyle(theme),
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <Upload size={16} />
              Upload JSON
            </button>
            <button 
              onClick={onDownload} 
              style={{
                ...primaryButtonStyle(theme),
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 18px',
                fontSize: '14px',
                fontWeight: '600',
              }}
            >
              <Download size={16} />
              Download JSON
            </button>
            <input
              ref={uploadInputRef}
              type="file"
              accept=".json"
              style={{ display: 'none' }}
              onChange={(e) => {
                const files = e.target.files;
                if (!files || files.length === 0) return;
                const reader = new FileReader();
                reader.addEventListener('load', (ev) => {
                  try {
                    const json = JSON.parse((ev.target as FileReader).result as string);
                    const keys = Object.keys(json);
                    for (const key of keys) {
                      const value = json[key];
                      if (!isSetting(key) || (typeof value !== settingsTypeMap[key] && !(settingsTypeMap[key] === 'BasePairsEditorType'))) {
                        throw new Error('Unrecognized settings schema');
                      }
                    }
                    const updated: Partial<SettingsRecord> = {};
                    for (const key of keys) updated[key as Setting] = json[key];
                    setSettings({ ...settings, ...updated });
                  } catch {
                    // Silently ignore invalid file
                  }
                });
                reader.readAsText(files[0]);
              }}
            />
            <a ref={downloadAnchorRef} style={{ display: 'none' }} download={`xrna_settings.json`} />
          </div>
        </PanelContainer>

        <div style={{ height: '24px' }} />

        {/* Preferences Section */}
        <PanelContainer title="Preferences" borderRadius={12}>
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: '1fr auto', 
            rowGap: '20px', 
            columnGap: '24px',
            alignItems: 'center',
          }}>
            {allSettings.map((setting, index) => {
              let input: JSX.Element = <></>;
              switch (settingsTypeMap[setting]) {
                case 'boolean': {
                  input = (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <input
                        type="checkbox"
                        checked={settings[setting] as boolean}
                        onChange={() => setSettings({ ...settings, [setting]: !settings[setting] })}
                        style={{ 
                          width: '20px', 
                          height: '20px',
                          accentColor: theme.colors.primary,
                          cursor: 'pointer',
                        }}
                      />
                    </div>
                  );
                  break;
                }
                case 'number': {
                  input = (
                    <div style={{ minWidth: '140px' }}>
                      <InputWithValidator.Number
                        value={settings[setting] as number}
                        setValue={(v: number) => setSettings({ ...settings, [setting]: v })}
                      />
                    </div>
                  );
                  break;
                }
                case 'BasePairsEditorType': {
                  // lazy import to avoid circular
                  const { BasePairsEditor } = require('../../app_specific/editors/BasePairsEditor');
                  input = (
                    <div style={{ minWidth: '160px' }}>
                      <BasePairsEditor.EditorTypeSelector.Component
                        editorType={settings[setting]}
                        onChange={(t: any) => setSettings({ ...settings, [setting]: t })}
                      />
                    </div>
                  );
                  break;
                }
                default:
                  input = <></>;
              }
              return (
                <React.Fragment key={index}>
                  <div style={{ 
                    display: 'flex', 
                    flexDirection: 'column',
                    gap: '6px',
                  }}>
                    <label 
                      title={settingsLongDescriptionsMap[setting]} 
                      style={{ 
                        color: theme.colors.textStrong || theme.colors.text, 
                        fontSize: '15px', 
                        fontWeight: '600',
                        lineHeight: '1.4',
                        cursor: 'pointer',
                      }}
                    >
                      {settingsShortDescriptionsMap[setting]}
                    </label>
                    <div style={{
                      fontSize: '13px',
                      color: theme.colors.textWeak || theme.colors.textSecondary,
                      lineHeight: '1.4',
                      maxWidth: '400px',
                    }}>
                      {settingsLongDescriptionsMap[setting]}
                    </div>
                  </div>
                  <div>{input}</div>
                </React.Fragment>
              );
            })}
          </div>
        </PanelContainer>
      </div>
    </div>
  );
};

function buttonStyle(theme: ReturnType<typeof useTheme>['theme']): React.CSSProperties {
  return {
    padding: '10px 16px',
    borderRadius: '10px',
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.surface,
    color: theme.colors.textStrong || theme.colors.text,
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: theme.transitions.default,
    display: 'flex',
    alignItems: 'center',
    gap: '6px',
    boxShadow: theme.shadows.sm,
  };
}

function primaryButtonStyle(theme: ReturnType<typeof useTheme>['theme']): React.CSSProperties {
  return {
    ...buttonStyle(theme),
    background: theme.colors.primary,
    color: theme.colors.textInverse,
    border: `1px solid ${theme.colors.primary}`,
    fontWeight: '600',
    boxShadow: theme.shadows.md,
  };
}


