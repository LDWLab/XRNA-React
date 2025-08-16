import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { useTheme } from '../../../context/ThemeContext';

export interface ElementInfo {
  type: 'nucleotide' | 'basepair' | 'label' | 'unknown';
  nucleotideSymbol?: string;
  nucleotideIndex?: number;
  rnaComplexIndex?: number;
  rnaMoleculeName?: string;
  position?: { x: number; y: number };
  basePairType?: string;
  basePairPartner?: {
    nucleotideIndex: number;
    nucleotideSymbol?: string;
    rnaMoleculeName: string;
  };
  labelContent?: string;
  color?: string;
  
  // Structure information
  structureInfo?: {
    type: 'helix' | 'single_strand' | 'loop' | 'bulge' | 'junction' | 'stacked_helix' | 'unknown';
    name?: string;
    range?: {
      start: number;
      end: number;
    };
    helixInfo?: {
      length: number;
      gcContent?: number;
    };
  };
  
  // Complex and molecule names for display
  complexName?: string;
  moleculeName?: string;
  
  additionalInfo?: Record<string, any>;
}

export interface InformationPanelProps {
  elementInfo?: ElementInfo;
}

const InfoRow: React.FC<{ label: string; value: string | number | React.ReactNode; highlight?: boolean }> = ({ 
  label, 
  value, 
  highlight = false 
}) => {
  const { theme } = useTheme();
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '8px 12px',
      background: highlight ? theme.colors.primary + '10' : 'transparent',
      borderRadius: '6px',
      borderLeft: highlight ? `3px solid ${theme.colors.primary}` : 'none',
      marginLeft: highlight ? '0' : '3px',
      transition: 'all 0.2s ease',
    }}>
      <span style={{
        fontSize: '11px',
        fontWeight: '600',
        color: theme.colors.textSecondary,
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {label}
      </span>
      <span style={{
        fontSize: '12px',
        fontWeight: highlight ? '600' : '500',
        color: highlight ? theme.colors.primary : theme.colors.text,
        fontFamily: typeof value === 'number' ? 'monospace' : 'inherit',
      }}>
        {value}
      </span>
    </div>
  );
};

const NucleotideDisplay: React.FC<{ elementInfo: ElementInfo }> = ({ elementInfo }) => {
  const { theme } = useTheme();
  return (
    <div style={{
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '16px',
      padding: '20px',
      boxShadow: theme.shadows.md,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
      }}>
        {/* Nucleotide symbol */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: theme.colors.warning + '20',
          border: `2px solid ${theme.colors.warning}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '700',
          color: theme.colors.warning,
          flexShrink: 0,
        }}>
          {elementInfo.nucleotideSymbol || 'N'}
        </div>
        
        {/* Information text */}
        <div style={{
          flex: 1,
          lineHeight: '1.6',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: '8px',
          }}>
            Nucleotide #{elementInfo.nucleotideIndex} ({elementInfo.nucleotideSymbol})
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.colors.textSecondary,
            fontWeight: '500',
          }}>
            in RNA molecule <span style={{ color: theme.colors.warning, fontWeight: '600' }}>"{elementInfo.moleculeName}"</span>
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.colors.textSecondary,
            fontWeight: '500',
          }}>
            in RNA complex <span style={{ color: theme.colors.warning, fontWeight: '600' }}>"{elementInfo.complexName}"</span>
          </div>
          
          {/* Base pair information */}
          {elementInfo.basePairPartner && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: theme.colors.warning + '20',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.warning}`,
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: theme.colors.warning,
                marginBottom: '4px',
              }}>
                Base paired to:
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text,
                fontWeight: '500',
              }}>
                Nucleotide #{elementInfo.basePairPartner.nucleotideIndex} ({elementInfo.basePairPartner.nucleotideSymbol})
              </div>
              <div style={{
                fontSize: '12px',
                color: theme.colors.warning,
                fontWeight: '500',
              }}>
                Type: {elementInfo.basePairType}
              </div>
            </div>
          )}
          
          {/* Structure information */}
          {elementInfo.structureInfo && elementInfo.structureInfo.type !== 'unknown' && (
            <div style={{
              marginTop: '12px',
              padding: '12px',
              background: theme.colors.primary + '20',
              borderRadius: '8px',
              border: `1px solid ${theme.colors.primary}`,
            }}>
              <div style={{
                fontSize: '13px',
                fontWeight: '600',
                color: theme.colors.primary,
                marginBottom: '4px',
              }}>
                Part of {elementInfo.structureInfo.type.replace('_', ' ')}:
              </div>
              <div style={{
                fontSize: '14px',
                color: theme.colors.text,
                fontWeight: '500',
              }}>
                Positions {elementInfo.structureInfo.range?.start}-{elementInfo.structureInfo.range?.end}
              </div>
              {elementInfo.structureInfo.helixInfo && (
                <div style={{
                  fontSize: '12px',
                  color: theme.colors.primary,
                  fontWeight: '500',
                  marginTop: '4px',
                }}>
                  Length: {elementInfo.structureInfo.helixInfo.length} bp
                  {elementInfo.structureInfo.helixInfo.gcContent !== undefined && 
                    ` • GC: ${elementInfo.structureInfo.helixInfo.gcContent}%`
                  }
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const BasePairDisplay: React.FC<{ elementInfo: ElementInfo }> = ({ elementInfo }) => {
  const { theme } = useTheme();
  return (
    <div style={{
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '16px',
      padding: '20px',
      boxShadow: theme.shadows.md,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: theme.colors.warning,
      }} />
      
      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
      }}>
        {/* Base pair icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: theme.colors.warning + '20',
          border: `2px solid ${theme.colors.warning}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '700',
          color: theme.colors.warning,
          flexShrink: 0,
        }}>
          BP
        </div>
        
        {/* Information text */}
        <div style={{
          flex: 1,
          lineHeight: '1.6',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: '8px',
          }}>
            Base Pair #{elementInfo.nucleotideIndex} ↔ #{elementInfo.basePairPartner?.nucleotideIndex}
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.colors.textSecondary,
            fontWeight: '500',
            marginBottom: '4px',
          }}>
            Type: <span style={{ color: theme.colors.warning, fontWeight: '600' }}>{elementInfo.basePairType}</span>
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.colors.textSecondary,
            fontWeight: '500',
            marginBottom: '12px',
          }}>
            Between molecules: <span style={{ color: theme.colors.warning, fontWeight: '600' }}>"{elementInfo.moleculeName}"</span> and <span style={{ color: theme.colors.warning, fontWeight: '600' }}>"{elementInfo.basePairPartner?.rnaMoleculeName}"</span>
          </div>
          
          {/* Position information */}
          {elementInfo.position && (
            <div style={{
              fontSize: '14px',
              color: theme.colors.textSecondary,
              fontWeight: '500',
            }}>
              Position: ({elementInfo.position.x.toFixed(1)}, {elementInfo.position.y.toFixed(1)})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const LabelDisplay: React.FC<{ elementInfo: ElementInfo }> = ({ elementInfo }) => {
  const { theme } = useTheme();
  return (
    <div style={{
      background: theme.colors.surface,
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '16px',
      padding: '20px',
      boxShadow: theme.shadows.md,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* Decorative accent */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: theme.colors.primary,
      }} />
      
      {/* Main content */}
      <div style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '16px',
      }}>
        {/* Label icon */}
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '50%',
          background: theme.colors.primary + '20',
          border: `2px solid ${theme.colors.primary}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '18px',
          fontWeight: '700',
          color: theme.colors.primary,
          flexShrink: 0,
        }}>
          L
        </div>
        
        {/* Information text */}
        <div style={{
          flex: 1,
          lineHeight: '1.6',
        }}>
          <div style={{
            fontSize: '16px',
            fontWeight: '600',
            color: theme.colors.text,
            marginBottom: '8px',
          }}>
            Label
          </div>
          <div style={{
            fontSize: '14px',
            color: theme.colors.textSecondary,
            fontWeight: '500',
          }}>
            Content: <span style={{ color: theme.colors.primary, fontWeight: '600' }}>"{elementInfo.labelContent}"</span>
          </div>
          
          {/* Position information */}
          {elementInfo.position && (
            <div style={{
              fontSize: '14px',
              color: theme.colors.textSecondary,
              fontWeight: '500',
              marginTop: '8px',
            }}>
              Position: ({elementInfo.position.x.toFixed(1)}, {elementInfo.position.y.toFixed(1)})
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const InformationPanel: React.FC<InformationPanelProps> = ({ elementInfo }) => {
  const { theme } = useTheme();
  if (!elementInfo) {
    return (
      <PanelContainer title="Information">
        <div style={{
          background: theme.colors.surface,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: '16px',
          padding: '20px',
          boxShadow: theme.shadows.md,
          position: 'relative',
          overflow: 'hidden',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            textAlign: 'center',
            padding: '40px 20px',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: theme.colors.surfaceHover,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: '16px',
              boxShadow: theme.shadows.sm,
            }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
            </div>
            <div style={{
              fontSize: '16px',
              fontWeight: '600',
              color: theme.colors.text,
              marginBottom: '8px',
            }}>
              No Selection
            </div>
            <div style={{
              fontSize: '14px',
              color: theme.colors.textSecondary,
              fontWeight: '500',
            }}>
              Select an element to view its information
            </div>
          </div>
        </div>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer title="Information">
      <div style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: '8px',
        padding: '16px',
        boxShadow: theme.shadows.sm,
        textAlign: 'center',
        color: theme.colors.textSecondary,
      }}>
        <div style={{
          fontSize: '14px',
          fontWeight: '600',
          color: theme.colors.text,
        }}>
          "{elementInfo.labelContent}"
        </div>
      </div>
      
      {/* Element-specific display */}
      {elementInfo.type === 'nucleotide' && <NucleotideDisplay elementInfo={elementInfo} />}
      {elementInfo.type === 'basepair' && <BasePairDisplay elementInfo={elementInfo} />}
      {elementInfo.type === 'label' && <LabelDisplay elementInfo={elementInfo} />}
      
      {/* Additional information */}
      {elementInfo.additionalInfo && Object.keys(elementInfo.additionalInfo).length > 0 && (
        <div style={{ marginTop: '16px' }}>
          <div style={{
            fontSize: '12px',
            fontWeight: '600',
            color: theme.colors.textSecondary,
            textTransform: 'uppercase',
            letterSpacing: '0.5px',
            marginBottom: '8px',
          }}>
            Additional Properties
          </div>
          {Object.entries(elementInfo.additionalInfo).map(([key, value]) => (
            <InfoRow key={key} label={key} value={String(value)} />
          ))}
        </div>
      )}
    </PanelContainer>
  );
}; 