import React, { useMemo, useRef } from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { settings as allSettings, settingsLongDescriptionsMap, settingsShortDescriptionsMap, settingsTypeMap, type SettingsRecord, Setting, isSetting } from '../../../ui/Setting';
import InputWithValidator from '../../generic/InputWithValidator';

export interface SettingsDrawerProps {
  open: boolean;
  onClose: () => void;
  settings: SettingsRecord;
  setSettings: (s: SettingsRecord) => void;
  getDistanceDefaults?: () => Partial<SettingsRecord>;
}

export const SettingsDrawer: React.FC<SettingsDrawerProps> = ({ open, onClose, settings, setSettings, getDistanceDefaults }) => {
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
        width: '560px',
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
        <div
          style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '3px', background: '#3b82f6' }}
        />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase', color: '#ffffff' }}>
            Settings
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            border: 'none', background: 'rgba(255, 255, 255, 0.1)', cursor: 'pointer', fontSize: '14px', color: '#ffffff',
            padding: '6px 8px', borderRadius: '6px', width: '28px', height: '28px'
          }}
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M9 3L3 9M3 3l6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        <PanelContainer title="Import/Export" borderRadius={8}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <button onClick={onUpload} style={buttonStyle()}>
              Upload JSON
            </button>
            <button onClick={onDownload} style={primaryButtonStyle()}>
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

        <div style={{ height: 12 }} />

        <PanelContainer title="Preferences" borderRadius={8}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', rowGap: 10, columnGap: 10 }}>
            {allSettings.map((setting, index) => {
              let input: JSX.Element = <></>;
              switch (settingsTypeMap[setting]) {
                case 'boolean': {
                  input = (
                    <input
                      type="checkbox"
                      checked={settings[setting] as boolean}
                      onChange={() => setSettings({ ...settings, [setting]: !settings[setting] })}
                      style={{ width: 16, height: 16 }}
                    />
                  );
                  break;
                }
                case 'number': {
                  input = (
                    <InputWithValidator.Number
                      value={settings[setting] as number}
                      setValue={(v: number) => setSettings({ ...settings, [setting]: v })}
                    />
                  );
                  break;
                }
                case 'BasePairsEditorType': {
                  // lazy import to avoid circular
                  const { BasePairsEditor } = require('../../app_specific/editors/BasePairsEditor');
                  input = (
                    <BasePairsEditor.EditorTypeSelector.Component
                      editorType={settings[setting]}
                      onChange={(t: any) => setSettings({ ...settings, [setting]: t })}
                    />
                  );
                  break;
                }
                default:
                  input = <></>;
              }
              return (
                <React.Fragment key={index}>
                  <label title={settingsLongDescriptionsMap[setting]} style={{ color: '#334155', fontSize: 13, lineHeight: 1.2 }}>
                    {settingsShortDescriptionsMap[setting]}
                  </label>
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

function buttonStyle(): React.CSSProperties {
  return {
    padding: '8px 12px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    color: '#334155',
    cursor: 'pointer',
    fontSize: 12,
    fontWeight: 600,
  };
}

function primaryButtonStyle(): React.CSSProperties {
  return {
    ...buttonStyle(),
    background: '#4f46e5',
    color: '#ffffff',
    border: '1px solid #4338ca',
  };
}


