import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { InteractionConstraint } from '../../../ui/InteractionConstraint/InteractionConstraints';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../layout/Button';

export interface SelectionPanelProps {
  constraint?: InteractionConstraint.Enum;
  onConstraintChange?: (constraint: InteractionConstraint.Enum) => void;
}

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
  const { theme } = useTheme();
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
    <Button label={getShortName(constraint)} onClick={onClick} disabled={disabled} variant={isActive ? 'primary' : 'secondary'} icon={getConstraintIcon(constraint)}/>
  );
};

export const SelectionPanel: React.FC<SelectionPanelProps> = ({
  constraint,
  onConstraintChange,
}) => {
  const { theme } = useTheme();
  const [activeGroup, setActiveGroup] = React.useState<string>('Basic');

  return (
    <PanelContainer title="Selection" borderRadius={8}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '4px',
            marginBottom: '4px',
            borderBottom: `1px solid ${theme.colors.border}`,
          }}>
            {Object.keys(constraintGroups).map((groupName) => (
              <button
                key={groupName}
                onClick={() => setActiveGroup(groupName)}
                style={{
                  height: theme.buttonSizes.md.height,
                  padding: theme.buttonSizes.md.padding,
                  border: 'none',
                  background: activeGroup === groupName ? theme.colors.primary : 'transparent',
                  color: activeGroup === groupName ? theme.colors.textInverse : theme.colors.text,
                  borderRadius: `${theme.borderRadius.md} ${theme.borderRadius.md} 0 0`,
                  fontSize: theme.buttonSizes.sm.fontSize,
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                }}
              >
                {groupName}
              </button>
            ))}
          </div>
          
          <div style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: '6px',
            minHeight: '30px',
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
