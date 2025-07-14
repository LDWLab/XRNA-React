import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Tab, tabs } from '../../../app_data/Tab';
import { InteractionConstraint } from '../../../ui/InteractionConstraint/InteractionConstraints';
import { CompactButton } from './QuickActionsPanel';

export interface ToolPaletteCallbacks {
  mode: Tab;
  onModeChange?: (tab: Tab) => void;
  constraint?: InteractionConstraint.Enum;
  onConstraintChange?: (constraint: InteractionConstraint.Enum) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetViewport?: () => void;
}

const ModeTab: React.FC<{
  tab: Tab;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ tab, isActive, onClick, disabled = false }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getModeIcon = (mode: Tab) => {
    switch (mode) {
      case Tab.EDIT:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M10.5 1.5l2 2L5 11H3v-2l7.5-7.5z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        );
      case Tab.FORMAT:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M3 3h8M3 7h8M3 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      case Tab.ANNOTATE:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 3v8M3 7h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        );
      default:
        return (
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="2" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        );
    }
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '6px',
        padding: '8px 12px',
        border: 'none',
        borderRadius: '6px',
        fontSize: '11px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.4 : 1,
        flex: 1,
        background: disabled 
          ? '#f1f5f9' 
          : isActive 
            ? ' #4f46e5'
            : (isHovered ? '#f1f5f9' : 'transparent'),
        color: disabled 
          ? '#94a3b8' 
          : isActive 
            ? '#ffffff' 
            : (isHovered ? '#4f46e5' : '#64748b'),
        boxShadow: isActive 
          ? '0 2px 8px rgba(79, 70, 229, 0.25)' 
          : 'none',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {getModeIcon(tab)}
      </div>
      <span style={{ fontSize: '10px', fontWeight: '700' }}>
        {tab.split('/')[0]}
      </span>
    </button>
  );
};

// Smart constraint grouping
const constraintGroups = {
  'Basic': [
    InteractionConstraint.Enum.SINGLE_NUCLEOTIDE,
    InteractionConstraint.Enum.SINGLE_BASE_PAIR,
  ],
  'Structures': [
    InteractionConstraint.Enum.RNA_SINGLE_STRAND,
    InteractionConstraint.Enum.RNA_HELIX,
    InteractionConstraint.Enum.RNA_STACKED_HELIX,
    InteractionConstraint.Enum.RNA_SUB_DOMAIN,
  ],
  'Advanced': [
    InteractionConstraint.Enum.RNA_CYCLE,
    InteractionConstraint.Enum.SINGLE_COLOR,
  ],
  'Scope': [
    InteractionConstraint.Enum.RNA_MOLECULE,
    InteractionConstraint.Enum.RNA_COMPLEX,
    InteractionConstraint.Enum.ENTIRE_SCENE,
  ],
};

const ConstraintChip: React.FC<{
  constraint: InteractionConstraint.Enum;
  isActive: boolean;
  onClick?: () => void;
  disabled?: boolean;
}> = ({ constraint, isActive, onClick, disabled = false }) => {
  const [isHovered, setIsHovered] = React.useState(false);

  const getConstraintIcon = (constraint: InteractionConstraint.Enum) => {
    const iconMap: Record<string, React.ReactNode> = {
      [InteractionConstraint.Enum.RNA_COMPLEX]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="4" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="6" cy="6" r="1.5" fill="currentColor"/>
          <circle cx="3" cy="3" r="0.8" fill="currentColor" opacity="0.6"/>
          <circle cx="9" cy="9" r="0.8" fill="currentColor" opacity="0.6"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_MOLECULE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <circle cx="6" cy="6" r="1" fill="currentColor"/>
          <circle cx="3" cy="6" r="0.5" fill="currentColor"/>
          <circle cx="9" cy="6" r="0.5" fill="currentColor"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_SINGLE_STRAND]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 6c1-1 2-1 3 0s2 1 3 0 2-1 3 0" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" fill="none"/>
          <circle cx="2" cy="6" r="0.5" fill="currentColor"/>
          <circle cx="11" cy="6" r="0.5" fill="currentColor"/>
        </svg>
      ),
      [InteractionConstraint.Enum.SINGLE_BASE_PAIR]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="4" width="8" height="4" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="4" cy="6" r="0.8" fill="currentColor"/>
          <circle cx="8" cy="6" r="0.8" fill="currentColor"/>
          <path d="M4.8 6h2.4" stroke="currentColor" strokeWidth="1"/>
        </svg>
      ),
      [InteractionConstraint.Enum.SINGLE_NUCLEOTIDE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="6" cy="6" r="1.2" fill="currentColor"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_HELIX]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M3 2c0 2 0 4 0 6M9 2c0 2 0 4 0 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M3 3h6M3 5h6M3 7h6" stroke="currentColor" strokeWidth="0.8" opacity="0.7"/>
          <circle cx="3" cy="2" r="0.5" fill="currentColor"/>
          <circle cx="9" cy="2" r="0.5" fill="currentColor"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_STACKED_HELIX]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="2" y="2" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
          <rect x="2" y="5" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
          <rect x="2" y="8" width="8" height="2" rx="0.5" stroke="currentColor" strokeWidth="1" fill="none"/>
          <circle cx="3" cy="3" r="0.3" fill="currentColor"/>
          <circle cx="9" cy="3" r="0.3" fill="currentColor"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_SUB_DOMAIN]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2h8v8H2z" stroke="currentColor" strokeWidth="1.2" strokeDasharray="2,1" fill="none"/>
          <circle cx="4" cy="4" r="1" fill="currentColor" opacity="0.7"/>
          <circle cx="8" cy="4" r="1" fill="currentColor" opacity="0.7"/>
          <circle cx="6" cy="8" r="1" fill="currentColor" opacity="0.7"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_CYCLE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="3.5" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M8.5 4.5L10 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
          <path d="M9.5 3.5L10 3L9.5 2.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
        </svg>
      ),
      [InteractionConstraint.Enum.SINGLE_COLOR]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <circle cx="6" cy="6" r="3" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <path d="M6 3v6" stroke="currentColor" strokeWidth="1"/>
          <path d="M3 6h6" stroke="currentColor" strokeWidth="1"/>
          <circle cx="6" cy="6" r="1" fill="currentColor"/>
        </svg>
      ),
      [InteractionConstraint.Enum.ENTIRE_SCENE]: (
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <rect x="1" y="1" width="10" height="10" rx="1" stroke="currentColor" strokeWidth="1.2" fill="none"/>
          <circle cx="4" cy="4" r="0.8" fill="currentColor"/>
          <circle cx="8" cy="4" r="0.8" fill="currentColor"/>
          <circle cx="4" cy="8" r="0.8" fill="currentColor"/>
          <circle cx="8" cy="8" r="0.8" fill="currentColor"/>
          <circle cx="6" cy="6" r="0.5" fill="currentColor" opacity="0.5"/>
        </svg>
      ),
    };
    return iconMap[constraint] || (
      <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
        <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
      </svg>
    );
  };

  const getShortName = (constraint: InteractionConstraint.Enum) => {
    const nameMap: Record<string, string> = {
      [InteractionConstraint.Enum.SINGLE_NUCLEOTIDE]: 'Nucleotide',
      [InteractionConstraint.Enum.SINGLE_BASE_PAIR]: 'Base Pair',
      [InteractionConstraint.Enum.RNA_SINGLE_STRAND]: 'Strand',
      [InteractionConstraint.Enum.RNA_HELIX]: 'Helix',
      [InteractionConstraint.Enum.RNA_STACKED_HELIX]: 'Stacked',
      [InteractionConstraint.Enum.RNA_SUB_DOMAIN]: 'Domain',
      [InteractionConstraint.Enum.RNA_CYCLE]: 'Cycle',
      [InteractionConstraint.Enum.RNA_MOLECULE]: 'Molecule',
      [InteractionConstraint.Enum.RNA_COMPLEX]: 'Complex',
      [InteractionConstraint.Enum.SINGLE_COLOR]: 'Color',
      [InteractionConstraint.Enum.ENTIRE_SCENE]: 'Scene',
    };
    return nameMap[constraint] || constraint;
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        border: isActive ? '2px solid #4f46e5' : '1px solid #e2e8f0',
        borderRadius: '16px',
        fontSize: '10px',
        fontWeight: '500',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.4 : 1,
        background: disabled 
          ? '#f1f5f9' 
          : isActive 
            ? 'rgba(79, 70, 229, 0.1)'
            : (isHovered ? '#f8fafc' : '#ffffff'),
        color: disabled 
          ? '#94a3b8' 
          : isActive 
            ? '#4f46e5' 
            : (isHovered ? '#475569' : '#64748b'),
        boxShadow: isActive 
          ? '0 0 0 2px rgba(79, 70, 229, 0.1)' 
          : (isHovered ? '0 1px 3px rgba(0, 0, 0, 0.1)' : 'none'),
        transform: isActive ? 'scale(1.05)' : 'scale(1)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center' }}>
        {getConstraintIcon(constraint)}
      </div>
      <span style={{ fontSize: '11px', fontWeight: '600' }}>
        {getShortName(constraint)}
      </span>
    </button>
  );
};

export const ToolPalettePanel: React.FC<ToolPaletteCallbacks> = ({
  mode,
  onModeChange,
  constraint,
  onConstraintChange,
  onUndo,
  onRedo,
  onResetViewport,
}) => {
  const [activeGroup, setActiveGroup] = React.useState<string>('Basic');

  return (
    <PanelContainer title="Tools" borderRadius={0}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Edit & View Controls */}
        <div style={{ display: 'flex', gap: '4px', marginBottom: '8px' }}>
          <CompactButton
            onClick={onUndo}
            disabled={!onUndo}
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2.5 5h4.5a3 3 0 110 6H5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M4.5 3L2.5 5l2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Undo"
          />
          <CompactButton
            onClick={onRedo}
            disabled={!onRedo}
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M9.5 5H5a3 3 0 100 6h2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M7.5 3l2 2-2 2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            }
            label="Redo"
          />
          <CompactButton
            onClick={onResetViewport}
            disabled={!onResetViewport}
            icon={
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 6h8M6 2v8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round"/>
                <circle cx="6" cy="6" r="2" stroke="currentColor" strokeWidth="1.2" fill="none"/>
              </svg>
            }
            label="Reset"
          />
        </div>
        {/* Mode Selection - Compact Tabs */}
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            background: '#f1f5f9',
            padding: '3px',
            borderRadius: '8px',
          }}>
            {tabs.filter(tab => [Tab.EDIT, Tab.FORMAT, Tab.ANNOTATE].includes(tab)).map((tab) => (
              <ModeTab
                key={tab}
                tab={tab}
                isActive={mode === tab}
                onClick={() => onModeChange?.(tab)}
                disabled={!onModeChange}
              />
            ))}
          </div>
        </div>

        {/* Constraint Groups - Smart Tabs */}
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            marginBottom: '12px',
            borderBottom: '1px solid #e2e8f0',
          }}>
            {Object.keys(constraintGroups).map((groupName) => (
              <button
                key={groupName}
                onClick={() => setActiveGroup(groupName)}
                style={{
                  padding: '6px 12px',
                  border: 'none',
                  background: activeGroup === groupName ? '#4f46e5' : 'transparent',
                  color: activeGroup === groupName ? '#ffffff' : '#64748b',
                  borderRadius: '6px 6px 0 0',
                  fontSize: '10px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px',
                }}
              >
                {groupName}
              </button>
            ))}
          </div>
          
          {/* Active Group Constraints */}
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px',
            minHeight: '60px',
            alignItems: 'flex-start',
            alignContent: 'flex-start',
          }}>
            {constraintGroups[activeGroup as keyof typeof constraintGroups]?.map((c) => (
              <ConstraintChip
                key={c}
                constraint={c}
                isActive={constraint === c}
                onClick={() => onConstraintChange?.(c)}
                disabled={!onConstraintChange}
              />
            ))}
          </div>
        </div>
      </div>
    </PanelContainer>
  );
}; 