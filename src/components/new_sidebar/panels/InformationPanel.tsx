import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';

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
}) => (
  <div style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    background: highlight ? 'rgba(79, 70, 229, 0.05)' : 'transparent',
    borderRadius: '6px',
    borderLeft: highlight ? '3px solid #4f46e5' : 'none',
    marginLeft: highlight ? '0' : '3px',
    transition: 'all 0.2s ease',
  }}>
    <span style={{
      fontSize: '11px',
      fontWeight: '600',
      color: '#64748b',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
    }}>
      {label}
    </span>
    <span style={{
      fontSize: '12px',
      fontWeight: highlight ? '600' : '500',
      color: highlight ? '#4f46e5' : '#475569',
      fontFamily: typeof value === 'number' ? 'monospace' : 'inherit',
    }}>
      {value}
    </span>
  </div>
);

const NucleotideDisplay: React.FC<{ elementInfo: ElementInfo }> = ({ elementInfo }) => (
  <div style={{
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
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
        background: '#059669',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(16, 185, 129, 0.3)',
        flexShrink: 0,
      }}>
        {elementInfo.nucleotideSymbol}
      </div>
      
      {/* Information text */}
      <div style={{
        flex: 1,
        lineHeight: '1.6',
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '8px',
        }}>
          Nucleotide #{elementInfo.nucleotideIndex} ({elementInfo.nucleotideSymbol})
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
        }}>
          in RNA molecule <span style={{ color: '#059669', fontWeight: '600' }}>"{elementInfo.moleculeName}"</span>
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
        }}>
          in RNA complex <span style={{ color: '#059669', fontWeight: '600' }}>"{elementInfo.complexName}"</span>
        </div>
        
        {/* Base pair information */}
        {elementInfo.basePairPartner && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
            borderRadius: '8px',
            border: '1px solid #f59e0b',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#92400e',
              marginBottom: '4px',
            }}>
              Base paired to:
            </div>
            <div style={{
              fontSize: '14px',
              color: '#1f2937',
              fontWeight: '500',
            }}>
              Nucleotide #{elementInfo.basePairPartner.nucleotideIndex} ({elementInfo.basePairPartner.nucleotideSymbol})
            </div>
            <div style={{
              fontSize: '12px',
              color: '#92400e',
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
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            borderRadius: '8px',
            border: '1px solid #6366f1',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#4338ca',
              marginBottom: '4px',
            }}>
              Part of {elementInfo.structureInfo.type.replace('_', ' ')}:
            </div>
            <div style={{
              fontSize: '14px',
              color: '#1f2937',
              fontWeight: '500',
            }}>
              Positions {elementInfo.structureInfo.range?.start}-{elementInfo.structureInfo.range?.end}
            </div>
            {elementInfo.structureInfo.helixInfo && (
              <div style={{
                fontSize: '12px',
                color: '#4338ca',
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

const BasePairDisplay: React.FC<{ elementInfo: ElementInfo }> = ({ elementInfo }) => (
  <div style={{
    background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
    border: '1px solid #e2e8f0',
    borderRadius: '16px',
    padding: '20px',
    boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
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
      background: 'linear-gradient(90deg, #f59e0b 0%, #d97706 100%)',
    }} />
    
    {/* Main content */}
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      gap: '16px',
    }}>
      {/* Base pair icon
      <div style={{
        width: '48px',
        height: '48px',
        borderRadius: '50%',
        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '20px',
        fontWeight: '700',
        boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)',
        flexShrink: 0,
      }}>
        🔗
      </div> */}
      
      {/* Information text */}
      <div style={{
        flex: 1,
        lineHeight: '1.6',
      }}>
        <div style={{
          fontSize: '16px',
          fontWeight: '600',
          color: '#1f2937',
          marginBottom: '8px',
        }}>
          Base pair between:
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
          marginBottom: '4px',
        }}>
          Nucleotide #{elementInfo.nucleotideIndex} ({elementInfo.nucleotideSymbol})
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
          marginBottom: '12px',
        }}>
          and Nucleotide #{elementInfo.basePairPartner?.nucleotideIndex} ({elementInfo.basePairPartner?.nucleotideSymbol})
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
        }}>
          in RNA molecule <span style={{ color: '#d97706', fontWeight: '600' }}>"{elementInfo.moleculeName}"</span>
        </div>
        <div style={{
          fontSize: '14px',
          color: '#6b7280',
          fontWeight: '500',
        }}>
          in RNA complex <span style={{ color: '#d97706', fontWeight: '600' }}>"{elementInfo.complexName}"</span>
        </div>
        
        {/* Base pair type */}
        <div style={{
          marginTop: '12px',
          padding: '8px 12px',
          background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
          borderRadius: '6px',
          border: '1px solid #f59e0b',
          display: 'inline-block',
        }}>
          <span style={{
            fontSize: '12px',
            color: '#92400e',
            fontWeight: '600',
          }}>
            Type: {elementInfo.basePairType}
          </span>
        </div>
        
        {/* Structure information */}
        {elementInfo.structureInfo && elementInfo.structureInfo.type !== 'unknown' && (
          <div style={{
            marginTop: '12px',
            padding: '12px',
            background: 'linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%)',
            borderRadius: '8px',
            border: '1px solid #6366f1',
          }}>
            <div style={{
              fontSize: '13px',
              fontWeight: '600',
              color: '#4338ca',
              marginBottom: '4px',
            }}>
              Part of {elementInfo.structureInfo.type.replace('_', ' ')}:
            </div>
            <div style={{
              fontSize: '14px',
              color: '#1f2937',
              fontWeight: '500',
            }}>
              Positions {elementInfo.structureInfo.range?.start}-{elementInfo.structureInfo.range?.end}
            </div>
            {elementInfo.structureInfo.helixInfo && (
              <div style={{
                fontSize: '12px',
                color: '#4338ca',
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

export const InformationPanel: React.FC<InformationPanelProps> = ({ elementInfo }) => {
  if (!elementInfo) {
    return (
      <PanelContainer title="Information">
        <div style={{
          background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
          border: '1px solid #e2e8f0',
          borderRadius: '16px',
          padding: '20px',
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
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
            background: 'linear-gradient(90deg, #6b7280 0%, #4b5563 100%)',
          }} />
          
          {/* Main content */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}>
            
            <div style={{
              flex: 1,
              lineHeight: '1.6',
            }}>
              <div style={{
                fontSize: '16px',
                fontWeight: '600',
                color: '#1f2937',
                marginBottom: '8px',
              }}>
                No Element Selected
              </div>
              <div style={{
                fontSize: '14px',
                color: '#6b7280',
                fontWeight: '500',
              }}>
                Right-click on any nucleotide or base pair to view detailed information
              </div>
            </div>
          </div>
        </div>
      </PanelContainer>
    );
  }

  return (
    <PanelContainer title="Information">
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
      }}>
        {/* Element Type Badge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '8px',
        }}>
  
        </div>
        <NucleotideDisplay elementInfo={elementInfo} />
        {/* Dynamic Content Based on Element Type */}
        {/* {elementInfo.type === 'nucleotide' && <NucleotideDisplay elementInfo={elementInfo} />}
        {elementInfo.type === 'basepair' && <BasePairDisplay elementInfo={elementInfo} />} */}
        
        {/* Fallback for other types */}
        {!['nucleotide', 'basepair'].includes(elementInfo.type) && (
          <div style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            padding: '16px',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
            textAlign: 'center',
            color: '#64748b',
          }}>
            <div style={{
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
            }}>
              {elementInfo.type === 'label' ? 'Label Element' : 'Unknown Element'}
            </div>
            {elementInfo.labelContent && (
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: '#1f2937',
              }}>
                "{elementInfo.labelContent}"
              </div>
            )}
          </div>
        )}
      </div>
    </PanelContainer>
  );
}; 