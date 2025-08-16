import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Tab, tabs } from '../../../app_data/Tab';
import { useTheme } from '../../../context/ThemeContext';
import { ActionsPanel } from './ActionsPanel';
import { InteractionConstraint } from '../../../ui/InteractionConstraint/InteractionConstraints';

export interface ToolsPanelProps {
  mode: Tab;
  onModeChange?: (tab: Tab) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetViewport?: () => void;
  undoStack?: Array<{ data: any; dataType: string }>;
  redoStack?: Array<{ data: any; dataType: string }>;
  onJumpToHistory?: (index: number) => void;
  onResetToLastCheckpoint?: () => void;
  constraint?: InteractionConstraint.Enum;
  onFormatModeClick?: () => void;
}

const ModeTab: React.FC<{
  tab: Tab;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
}> = ({ tab, isActive, onClick, disabled = false }) => {
  const { theme } = useTheme();
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

  const getModeLabel = (mode: Tab) => {
    switch (mode) {
      case Tab.EDIT:
        return 'Edit';
      case Tab.FORMAT:
        return 'Format';
      case Tab.ANNOTATE:
        return 'Annotate';
      default:
        return mode;
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
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '12px 8px',
        border: 'none',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.4 : 1,
        flex: 1,
        background: disabled 
          ? theme.colors.surfaceHover
          : isActive 
            ? theme.colors.primary
            : (isHovered ? theme.colors.surfaceHover : 'transparent'),
        color: disabled 
          ? theme.colors.textMuted
          : isActive 
            ? theme.colors.textInverse
            : (isHovered ? theme.colors.primary : theme.colors.textSecondary),
        boxShadow: isActive 
          ? theme.shadows.md
          : 'none',
        transform: isActive ? 'scale(1.02)' : 'scale(1)',
      }}
    >
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        width: '20px',
        height: '20px',
      }}>
        {getModeIcon(tab)}
      </div>
      <span style={{ 
        fontSize: '10px', 
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: '0.5px',
      }}>
        {getModeLabel(tab)}
      </span>
    </button>
  );
};

export const ToolsPanel: React.FC<ToolsPanelProps> = ({
  mode,
  onModeChange,
  onUndo,
  onRedo,
  onResetViewport,
  undoStack,
  redoStack,
  onJumpToHistory,
  onResetToLastCheckpoint,
  constraint,
  onFormatModeClick,
}) => {
  const { theme } = useTheme();

  // Handle Format mode click
  const handleModeChange = (tab: Tab) => {
    if (tab === Tab.FORMAT && onFormatModeClick) {
      onFormatModeClick();
    } else if (onModeChange) {
      onModeChange(tab);
    }
  };

  return (
    <PanelContainer title="Tools" borderRadius={8}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Mode Selection - Compact Tabs */}
        <div>
          <div style={{ 
            display: 'flex', 
            gap: '6px',
            background: theme.colors.surfaceHover,
            padding: '4px',
            borderRadius: '8px',
          }}>
            {tabs.filter(tab => [Tab.EDIT, Tab.FORMAT, Tab.ANNOTATE].includes(tab)).map((tab) => (
              <ModeTab
                key={tab}
                tab={tab}
                isActive={mode === tab}
                onClick={() => {
                  if (tab === Tab.FORMAT && onFormatModeClick) {
                    onFormatModeClick();
                  } else if (onModeChange) {
                    onModeChange(tab);
                  }
                }}
              />
            ))}
          </div>
        </div>
        <ActionsPanel 
        onUndo={onUndo} 
        onRedo={onRedo} 
        onResetViewport={onResetViewport}
        undoStack={undoStack}
        redoStack={redoStack}
        onJumpToHistory={onJumpToHistory}
        onResetToLastCheckpoint={onResetToLastCheckpoint}
        mode={mode}
        constraint={constraint}
      />
      </div>
    </PanelContainer>
  );
};
