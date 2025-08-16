import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { BasePairsEditor } from '../../app_specific/editors/BasePairsEditor';
import { RnaComplexProps } from '../../../App';
import { useTheme } from '../../../context/ThemeContext';
import { Cable, ExternalLink } from 'lucide-react';

export interface BasePairEditorProps {
  rnaComplexProps: RnaComplexProps;
  approveBasePairs: (bps: BasePairsEditor.BasePair[]) => void;
  initialBasePairs?: BasePairsEditor.InitialBasePairs;
}

export const BasePairEditorPanel: React.FC<BasePairEditorProps> = ({
  rnaComplexProps,
  approveBasePairs,
  initialBasePairs,
}) => {
  const { theme } = useTheme();
  
  return (
    <PanelContainer title="Base Pair Editor" borderRadius={12}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Header with description */}
        <div style={{
          padding: '16px',
          background: theme.colors.backgroundSecondary,
          borderRadius: '8px',
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            marginBottom: '12px',
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: theme.colors.primary + '20',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: theme.colors.primary,
            }}>
              <Cable size={18} />
            </div>
            <div>
              <h3 style={{
                fontSize: '14px',
                fontWeight: '600',
                color: theme.colors.text,
                margin: '0 0 2px 0',
              }}>
                Base Pair Management
              </h3>
              <p style={{
                fontSize: '12px',
                color: theme.colors.textSecondary,
                margin: 0,
                lineHeight: '1.4',
              }}>
                Edit and manage base pair interactions in your RNA structure
              </p>
            </div>
          </div>
          
          {/* Action buttons */}
          <div style={{
            display: 'flex',
            gap: '8px',
            flexWrap: 'wrap',
          }}>
            <button
              onClick={() => window.dispatchEvent(new CustomEvent('openBasepairBottomSheet'))}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.colors.primary}`,
                background: theme.colors.primary,
                color: theme.colors.textInverse,
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: theme.transitions.default,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.primaryHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.primary;
              }}
            >
              <ExternalLink size={14} />
              Open Full Editor
            </button>
            
            <button
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                color: theme.colors.textSecondary,
                fontSize: '12px',
                fontWeight: '500',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: theme.transitions.default,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.colors.surfaceHover;
                e.currentTarget.style.color = theme.colors.text;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = theme.colors.surface;
                e.currentTarget.style.color = theme.colors.textSecondary;
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M21 12c0 4.97-4.03 9-9 9s-9-4.03-9-9 4.03-9 9-9 9 4.03 9 9z" stroke="currentColor" strokeWidth="2"/>
              </svg>
              Quick View
            </button>
          </div>
        </div>
        
        {/* Editor component */}
        <div style={{
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '8px',
          overflow: 'hidden',
        }}>
          <BasePairsEditor.Component
            rnaComplexProps={rnaComplexProps}
            approveBasePairs={approveBasePairs}
            initialBasePairs={initialBasePairs}
          />
        </div>
        
        {/* Help text */}
        <div style={{
          padding: '12px',
          background: theme.colors.backgroundSecondary,
          borderRadius: '6px',
          border: `1px solid ${theme.colors.borderLight}`,
        }}>
          <div style={{
            fontSize: '11px',
            color: theme.colors.textMuted,
            lineHeight: '1.4',
            textAlign: 'center',
          }}>
            <strong>Tip:</strong> Use the full editor for advanced base pair management and bulk operations
          </div>
        </div>
      </div>
    </PanelContainer>
  );
}; 