import React from 'react';
import { useTheme } from '../../../context/ThemeContext';
import { Undo2, Redo2, RotateCcw, History, Save, Clock, ChevronDown, ChevronRight } from 'lucide-react';
import { Tab } from '../../../app_data/Tab';
import { InteractionConstraint } from '../../../ui/InteractionConstraint/InteractionConstraints';

export interface ActionsPanelProps {
  onUndo?: () => void;
  onRedo?: () => void;
  onResetViewport?: () => void;
  undoStack?: Array<{ data: any; dataType: string }>;
  redoStack?: Array<{ data: any; dataType: string }>;
  onJumpToHistory?: (index: number) => void;
  onResetToLastCheckpoint?: () => void;
  mode?: Tab;
  constraint?: InteractionConstraint.Enum;
}

const ActionButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
}> = ({ onClick, icon, label, disabled = false, variant = 'secondary' }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.primaryActive : (isHovered ? theme.colors.primaryHover : theme.colors.primary)),
          color: theme.colors.textInverse,
          border: `1px solid ${theme.colors.primary}`,
        };
      case 'danger':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.error : (isHovered ? theme.colors.error + '20' : 'transparent')),
          color: disabled ? theme.colors.textMuted : (isHovered ? theme.colors.error : theme.colors.textSecondary),
          border: `1px solid ${isHovered ? theme.colors.error : theme.colors.border}`,
        };
      default:
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.surfaceHover : (isHovered ? theme.colors.surfaceHover : 'transparent')),
          color: disabled ? theme.colors.textMuted : theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '6px',
        padding: '10px 8px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.4 : 1,
        flex: 1,
        minWidth: '0',
        ...variantStyles,
        boxShadow: disabled ? 'none' : (isPressed ? theme.shadows.sm : (isHovered ? theme.shadows.sm : 'none')),
        transform: disabled ? 'none' : (isPressed ? 'scale(0.95)' : (isHovered ? 'translateY(-1px)' : 'translateY(0)')),
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px',
        opacity: disabled ? 0.5 : 1,
      }}>
        {icon}
      </div>
      <span style={{
        textAlign: 'center',
        letterSpacing: '0.3px',
        lineHeight: '1.2',
        fontSize: '9px',
        fontWeight: '600',
        textTransform: 'uppercase',
      }}>
        {label}
      </span>
    </button>
  );
};

const HistoryViewer: React.FC<{
  undoStack: Array<{ data: any; dataType: string }>;
  redoStack: Array<{ data: any; dataType: string }>;
  onJumpToHistory: (index: number) => void;
  onResetToLastCheckpoint: () => void;
  mode?: Tab;
  constraint?: InteractionConstraint.Enum;
}> = ({ undoStack, redoStack, onJumpToHistory, onResetToLastCheckpoint, mode, constraint }) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [checkpoints, setCheckpoints] = React.useState<number[]>([]);

  // Find save operations (checkpoints) - this would need to be implemented based on your save logic
  React.useEffect(() => {
    // For now, let's assume every 5th action is a checkpoint
    // In a real implementation, you'd track when save operations happen
    const newCheckpoints: number[] = [];
    for (let i = 4; i < undoStack.length; i += 5) {
      newCheckpoints.push(i);
    }
    setCheckpoints(newCheckpoints);
  }, [undoStack]);

  // Generate descriptive action names based on mode and constraint
  const getActionName = (dataType: string, index: number) => {
    if (dataType === 'RnaComplexProps') {
      if (mode === Tab.EDIT) {
        if (constraint) {
          switch (constraint) {
            case InteractionConstraint.Enum.SINGLE_NUCLEOTIDE:
              return 'Nucleotide Moved';
            case InteractionConstraint.Enum.SINGLE_BASE_PAIR:
              return 'Base Pair Moved';
            case InteractionConstraint.Enum.RNA_HELIX:
              return 'Helix Moved';
            case InteractionConstraint.Enum.RNA_CYCLE:
              return 'Cycle Moved';
            case InteractionConstraint.Enum.RNA_STACKED_HELIX:
              return 'Stacked Helix Moved';
            case InteractionConstraint.Enum.RNA_SUB_DOMAIN:
              return 'Subdomain Moved';
            case InteractionConstraint.Enum.RNA_COMPLEX:
              return 'Complex Moved';
            case InteractionConstraint.Enum.RNA_MOLECULE:
              return 'Molecule Moved';
            case InteractionConstraint.Enum.RNA_SINGLE_STRAND:
              return 'Single Strand Moved';
            case InteractionConstraint.Enum.ENTIRE_SCENE:
              return 'Scene Modified';
            default:
              return 'Structure Moved';
          }
        }
        return 'Structure Modified';
      } else if (mode === Tab.FORMAT) {
        return 'Formatting Applied';
      } else if (mode === Tab.ANNOTATE) {
        return 'Annotation Added';
      }
      return 'Structure Changed';
    } else if (dataType === 'IndicesOfFrozenNucleotides') {
      return 'Nucleotides Frozen/Unfrozen';
    }
    return 'Action';
  };

  const totalActions = undoStack.length + redoStack.length;
  const currentPosition = undoStack.length;

  return (
    <div style={{
      border: `1px solid ${theme.colors.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
      background: theme.colors.surface,
    }}>
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: '100%',
          padding: '8px 12px',
          background: theme.colors.surfaceHover,
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
          color: theme.colors.text,
          fontSize: '11px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <History size={12} />
          History ({totalActions})
        </div>
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {/* Content */}
      {isExpanded && (
        <div style={{ padding: '12px' }}>
          {/* Current Position Indicator */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '12px',
            padding: '8px 12px',
            background: theme.colors.backgroundSecondary,
            borderRadius: '6px',
            fontSize: '11px',
          }}>
            <span style={{ color: theme.colors.textSecondary }}>
              Position: {currentPosition} / {totalActions}
            </span>
          </div>

          {/* History Timeline */}
          <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
            {undoStack.map((action, index) => {
              const isCheckpoint = checkpoints.includes(index);
              const isCurrentPosition = index === currentPosition - 1;
              
              return (
                <div
                  key={`undo-${index}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '6px 8px',
                    marginBottom: '4px',
                    borderRadius: '4px',
                    background: isCurrentPosition ? theme.colors.primary + '20' : 'transparent',
                    border: `1px solid ${isCheckpoint ? theme.colors.success : theme.colors.border}`,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrentPosition ? theme.colors.primary + '20' : 'transparent';
                  }}
                  onClick={() => onJumpToHistory(index)}
                >
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: isCheckpoint ? theme.colors.success : theme.colors.primary,
                    flexShrink: 0,
                  }} />
                  <div style={{ flex: 1, fontSize: '10px' }}>
                    <div style={{ 
                      color: theme.colors.text,
                      fontWeight: isCurrentPosition ? '600' : '400',
                    }}>
                      {getActionName(action.dataType, index)}
                    </div>
                    <div style={{ 
                      color: theme.colors.textSecondary,
                      fontSize: '9px',
                    }}>
                      {action.dataType}
                    </div>
                  </div>
                  {isCheckpoint && (
                    <Save size={10} style={{ color: theme.colors.success }} />
                  )}
                  {isCurrentPosition && (
                    <Clock size={10} style={{ color: theme.colors.primary }} />
                  )}
                </div>
              );
            })}

            {/* Current State Marker */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px',
              margin: '8px 0',
              background: theme.colors.primary + '10',
              border: `2px solid ${theme.colors.primary}`,
              borderRadius: '6px',
              fontSize: '10px',
              fontWeight: '600',
            }}>
              <div style={{
                width: '10px',
                height: '10px',
                borderRadius: '50%',
                background: theme.colors.primary,
              }} />
              <span style={{ color: theme.colors.primary }}>
                Current State
              </span>
            </div>

            {/* Redo Stack */}
            {redoStack.map((action, index) => (
              <div
                key={`redo-${index}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '6px 8px',
                  marginBottom: '4px',
                  borderRadius: '4px',
                  background: 'transparent',
                  border: `1px solid ${theme.colors.border}`,
                  cursor: 'pointer',
                  opacity: 0.6,
                  transition: 'all 0.2s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.surfaceHover;
                  e.currentTarget.style.opacity = '1';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.opacity = '0.6';
                }}
                onClick={() => onJumpToHistory(undoStack.length + index)}
              >
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  background: theme.colors.textMuted,
                  flexShrink: 0,
                }} />
                <div style={{ flex: 1, fontSize: '10px' }}>
                  <div style={{ color: theme.colors.textMuted }}>
                    Redo {index + 1}
                  </div>
                  <div style={{ 
                    color: theme.colors.textSecondary,
                    fontSize: '9px',
                  }}>
                    {action.dataType}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Help Text */}
          <div style={{
            marginTop: '12px',
            padding: '8px 12px',
            background: theme.colors.backgroundSecondary,
            borderRadius: '4px',
            fontSize: '9px',
            color: theme.colors.textSecondary,
            lineHeight: '1.4',
          }}>
            <strong>Tip:</strong> Click on any action to jump to that point in history. 
          </div>
        </div>
      )}
    </div>
  );
};

export const ActionsPanel: React.FC<ActionsPanelProps> = ({
  onUndo,
  onRedo,
  onResetViewport,
  undoStack = [],
  redoStack = [],
  onJumpToHistory,
  onResetToLastCheckpoint,
  mode,
  constraint,
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Edit & View Controls */}
      <div style={{ display: 'flex', gap: '6px' }}>
        <ActionButton
          onClick={onUndo}
          disabled={!onUndo}
          icon={<Undo2 size={14} />}
          label="Undo"
          variant="secondary"
        />
        <ActionButton
          onClick={onRedo}
          disabled={!onRedo}
          icon={<Redo2 size={14} />}
          label="Redo"
          variant="secondary"
        />
        <ActionButton
          onClick={onResetToLastCheckpoint}
          disabled={!onResetToLastCheckpoint}
          icon={<RotateCcw size={14} />}
          label="Restore"
          variant="danger"
        />
      </div>

      {/* History Viewer */}
      <HistoryViewer
        undoStack={undoStack}
        redoStack={redoStack}
        onJumpToHistory={onJumpToHistory || (() => {})}
        onResetToLastCheckpoint={onResetToLastCheckpoint || (() => {})}
        mode={mode}
        constraint={constraint}
      />
    </div>
  );
};
