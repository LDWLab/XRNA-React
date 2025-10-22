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
    // Use opposite theme's primary color to avoid conflicts with selection
    const iconPrimaryColor = theme.colors.primary === '#7491C8' ? '#C89B85' : '#7491C8';
    
    const iconMap: Record<InteractionConstraint.Enum, React.ReactNode> = {
      [InteractionConstraint.Enum.SINGLE_NUCLEOTIDE]: (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          <circle cx="12" cy="12" r="9" fill={iconPrimaryColor} stroke={theme.colors.borderDark} strokeWidth="1"/>
          <text x="12" y="12" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={theme.colors.textInverse} textAnchor="middle" dominantBaseline="central">N</text>
        </svg>
      ),
      [InteractionConstraint.Enum.SINGLE_BASE_PAIR]: (
        <svg width="48" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Left nucleotide */}
          <circle cx="0" cy="12" r="9" fill={iconPrimaryColor} stroke={theme.colors.borderDark} strokeWidth="1"/>
          <text x="0" y="13" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={theme.colors.textInverse} textAnchor="middle" dominantBaseline="middle">C</text>
          
          {/* Bond line (solid for covalent) */}
          <line x1="9.5" y1="12" x2="20" y2="12" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          
          {/* Right nucleotide */}
          <circle cx="25" cy="12" r="9" fill={iconPrimaryColor} stroke={theme.colors.borderDark} strokeWidth="1"/>
          <text x="25" y="13" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={theme.colors.textInverse} textAnchor="middle" dominantBaseline="middle">G</text>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_SINGLE_STRAND]: (
        <svg width="28" height="24" viewBox="0 0 64 48" xmlns="http://www.w3.org/2000/svg">
          {/* First nucleotide */}
          <circle cx="10" cy="28" r="9" fill={iconPrimaryColor} stroke={theme.colors.borderDark} strokeWidth="1"/>
          <text x="10" y="28" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={theme.colors.textInverse} textAnchor="middle" dominantBaseline="central">N</text>
          
          {/* Curved bond */}
          <path d="M 18 26 Q 26 18 32 20" stroke={theme.colors.borderDark} strokeWidth="1.5" fill="none"/>
          
          {/* Second nucleotide */}
          <circle cx="32" cy="20" r="9" fill={iconPrimaryColor} stroke={theme.colors.borderDark} strokeWidth="1"/>
          <text x="32" y="20" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={theme.colors.textInverse} textAnchor="middle" dominantBaseline="central">N</text>
          
          {/* Curved bond */}
          <path d="M 40 22 Q 46 26 54 28" stroke={theme.colors.borderDark} strokeWidth="1.5" fill="none"/>
          
          {/* Third nucleotide */}
          <circle cx="54" cy="28" r="9" fill={iconPrimaryColor} stroke={theme.colors.borderDark} strokeWidth="1"/>
          <text x="54" y="28" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill={theme.colors.textInverse} textAnchor="middle" dominantBaseline="central">N</text>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_HELIX]: (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Left strand */}
          <path d="M 6 4 Q 4 8 6 12 Q 8 16 6 20" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Right strand */}
          <path d="M 18 4 Q 20 8 18 12 Q 16 16 18 20" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Connecting rungs */}
          <line x1="6" y1="7" x2="18" y2="7" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          <line x1="6" y1="12" x2="18" y2="12" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          <line x1="6" y1="17" x2="18" y2="17" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_STACKED_HELIX]: (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Top helix - left strand */}
          <path d="M 6 3 Q 4 5 6 7" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Top helix - right strand */}
          <path d="M 18 3 Q 20 5 18 7" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Top helix - rung */}
          <line x1="6" y1="5" x2="18" y2="5" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          
          {/* Middle helix - left strand */}
          <path d="M 6 10 Q 4 12 6 14" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Middle helix - right strand */}
          <path d="M 18 10 Q 20 12 18 14" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Middle helix - rung */}
          <line x1="6" y1="12" x2="18" y2="12" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          
          {/* Bottom helix - left strand */}
          <path d="M 6 17 Q 4 19 6 21" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Bottom helix - right strand */}
          <path d="M 18 17 Q 20 19 18 21" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Bottom helix - rung */}
          <line x1="6" y1="19" x2="18" y2="19" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_SUB_DOMAIN]: (
        <svg width="32" height="24" viewBox="0 0 28 24" xmlns="http://www.w3.org/2000/svg">
          {/* Main vertical stem - left */}
          <path d="M 12 22 L 12 8" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Main vertical stem - right */}
          <path d="M 16 22 L 16 8" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Vertical stem rungs */}
          <line x1="12" y1="20" x2="16" y2="20" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          <line x1="12" y1="17" x2="16" y2="17" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          <line x1="12" y1="14" x2="16" y2="14" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          <line x1="12" y1="11" x2="16" y2="11" stroke={theme.colors.borderDark} strokeWidth="1.5"/>
          
          {/* Top loop */}
          <path d="M 12 8 A 2 2 0 0 1 16 8" stroke={iconPrimaryColor} strokeWidth="2.5" fill="none" strokeLinecap="round"/>
          
          {/* Left horizontal branch */}
          <path d="M 12 15 L 6 15 L 6 12" stroke={iconPrimaryColor} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M 12 13 L 8 13 L 8 12" stroke={iconPrimaryColor} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <line x1="6" y1="14" x2="8" y2="14" stroke={theme.colors.borderDark} strokeWidth="1"/>
          <line x1="6" y1="13" x2="8" y2="13" stroke={theme.colors.borderDark} strokeWidth="1"/>
          <path d="M 6 12 A 1 1 0 0 0 8 12" stroke={iconPrimaryColor} strokeWidth="2" fill="none"/>
          
          {/* Right horizontal branch */}
          <path d="M 16 15 L 22 15 L 22 12" stroke={iconPrimaryColor} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <path d="M 16 13 L 20 13 L 20 12" stroke={iconPrimaryColor} strokeWidth="2" fill="none" strokeLinecap="round"/>
          <line x1="20" y1="14" x2="22" y2="14" stroke={theme.colors.borderDark} strokeWidth="1"/>
          <line x1="20" y1="13" x2="22" y2="13" stroke={theme.colors.borderDark} strokeWidth="1"/>
          <path d="M 20 12 A 1 1 0 0 1 22 12" stroke={iconPrimaryColor} strokeWidth="2" fill="none"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_CYCLE]: (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="6" stroke={iconPrimaryColor} strokeWidth="2" fill="none"/>
          <circle cx="12" cy="12" r="7" stroke={theme.colors.borderDark} strokeWidth="0.5" fill="none"/>
          <circle cx="12" cy="12" r="5" stroke={theme.colors.borderDark} strokeWidth="0.5" fill="none"/>
        </svg>
      ),
      [InteractionConstraint.Enum.SINGLE_COLOR]: (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Paint palette shape */}
          <path d="M 12 4 Q 6 4 4 8 Q 2 12 4 16 Q 6 20 12 20 Q 14 20 16 19 L 18 16 Q 20 14 18 12 Q 16 10 14 11 Q 12 12 12 10 Q 12 6 12 4 Z" 
            fill={iconPrimaryColor} 
            stroke={theme.colors.borderDark} 
            strokeWidth="1.5"
          />
          
          {/* Paint wells - small circles */}
          <circle cx="8" cy="10" r="1.5" fill={theme.colors.error} stroke={theme.colors.borderDark} strokeWidth="0.8"/>
          <circle cx="10" cy="14" r="1.5" fill={theme.colors.warning} stroke={theme.colors.borderDark} strokeWidth="0.8"/>
          <circle cx="14" cy="15" r="1.5" fill={theme.colors.text} stroke={theme.colors.borderDark} strokeWidth="0.8"/>
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_MOLECULE]: (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Continuous contour of folded RNA molecule */}
          <path
            d="M 4 20 
               Q 3 16 5 12 
               Q 7 8 12 6 
               Q 17 8 19 12 
               Q 21 16 20 20 
               Q 18 18 16 16 
               Q 14 14 12 14 
               Q 10 14 8 16 
               Q 6 18 4 20 Z" 
            stroke={theme.colors.borderDark} 
            fill={iconPrimaryColor}
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      ),
      [InteractionConstraint.Enum.RNA_COMPLEX]: (
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            transform = "translate(0, 2.5) scale(0.8)"
          >
            {/* First RNA molecule - primary color (top) */}
            <path
              d="M 4 12 
                Q 3 8 5 4 
                Q 7 0 12 -2 
                Q 17 0 19 4 
                Q 21 8 20 12 
                Q 18 10 16 8 
                Q 14 6 12 6 
                Q 10 6 8 8 
                Q 6 10 4 12 Z" 
              stroke={theme.colors.borderDark} 
              fill={iconPrimaryColor}
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Second RNA molecule - accent color (bottom, fitting into groove) */}
            <path
              d="M 4 12
                Q 6 10 8 8
                Q 10 6 12 6
                Q 14 6 16 8
                Q 18 10 20 12
                Q 21 16 19 20
                Q 17 24 12 26
                Q 7 24 5 20
                Q 3 16 4 12 Z"
              stroke={theme.colors.borderDark} 
              fill={theme.colors.accent} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>
      ),
      [InteractionConstraint.Enum.ENTIRE_SCENE]: (
        <svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
          {/* Canvas border */}
          <rect x="1" y="1" width="22" height="22" stroke={theme.colors.borderDark} strokeWidth="1.5" fill="none" rx="1"/>
          
          {/* Small RNA molecule 1 - top left */}
          <path
            transform = "scale(0.5)"
            d="M 4 20 
               Q 3 16 5 12 
               Q 7 8 12 6 
               Q 17 8 19 12 
               Q 21 16 20 20 
               Q 18 18 16 16 
               Q 14 14 12 14 
               Q 10 14 8 16 
               Q 6 18 4 20 Z" 
            stroke={theme.colors.borderDark} 
            fill={iconPrimaryColor}
            strokeWidth="2.5" 
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <g
            transform = "translate(16, 7) scale(0.5) translate(0, 3.5) rotate(45)"
          >
            {/* First RNA molecule - primary color (top) */}
            <path
              d="M 4 12 
                Q 3 8 5 4 
                Q 7 0 12 -2 
                Q 17 0 19 4 
                Q 21 8 20 12 
                Q 18 10 16 8 
                Q 14 6 12 6 
                Q 10 6 8 8 
                Q 6 10 4 12 Z" 
              stroke={theme.colors.borderDark} 
              fill={iconPrimaryColor}
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            
            {/* Second RNA molecule - accent color (bottom, fitting into groove) */}
            <path
              d="M 4 12
                Q 6 10 8 8
                Q 10 6 12 6
                Q 14 6 16 8
                Q 18 10 20 12
                Q 21 16 19 20
                Q 17 24 12 26
                Q 7 24 5 20
                Q 3 16 4 12 Z"
              stroke={theme.colors.borderDark} 
              fill={theme.colors.accent} 
              strokeWidth="2.5" 
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
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
