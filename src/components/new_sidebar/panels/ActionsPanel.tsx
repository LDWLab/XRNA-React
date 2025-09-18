import React from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  Undo2,
  Redo2,
  RotateCcw,
  History,
  Save,
  Clock,
  ChevronDown,
  ChevronRight,
  Lock,
  LockOpen,
} from "lucide-react";
import { Tab } from "../../../app_data/Tab";
import { InteractionConstraint } from "../../../ui/InteractionConstraint/InteractionConstraints";
import { Button } from "../layout/Button";

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
  onFreezeSelected?: () => void;
  onUnfreezeSelected?: () => void;
  onUnfreezeAll?: () => void;
  hasFrozenNucleotides?: boolean;
  hasSelectedNucleotides?: boolean;
}

const HistoryViewer: React.FC<{
  undoStack: Array<{ data: any; dataType: string }>;
  redoStack: Array<{ data: any; dataType: string }>;
  onJumpToHistory: (index: number) => void;
  onResetToLastCheckpoint: () => void;
  mode?: Tab;
  constraint?: InteractionConstraint.Enum;
}> = ({
  undoStack,
  redoStack,
  onJumpToHistory,
  onResetToLastCheckpoint,
  mode,
  constraint,
}) => {
  const { theme } = useTheme();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [checkpoints, setCheckpoints] = React.useState<number[]>([]);

  React.useEffect(() => {
    const newCheckpoints: number[] = [];
    for (let i = 4; i < undoStack.length; i += 5) {
      newCheckpoints.push(i);
    }
    setCheckpoints(newCheckpoints);
  }, [undoStack]);

  const getActionName = (dataType: string, index: number) => {
    if (dataType === "RnaComplexProps") {
      if (mode === Tab.EDIT) {
        if (constraint) {
          switch (constraint) {
            case InteractionConstraint.Enum.SINGLE_NUCLEOTIDE:
              return "Nucleotide Moved";
            case InteractionConstraint.Enum.SINGLE_BASE_PAIR:
              return "Base Pair Moved";
            case InteractionConstraint.Enum.RNA_HELIX:
              return "Helix Moved";
            case InteractionConstraint.Enum.RNA_CYCLE:
              return "Cycle Moved";
            case InteractionConstraint.Enum.RNA_STACKED_HELIX:
              return "Stacked Helix Moved";
            case InteractionConstraint.Enum.RNA_SUB_DOMAIN:
              return "Subdomain Moved";
            case InteractionConstraint.Enum.RNA_COMPLEX:
              return "Complex Moved";
            case InteractionConstraint.Enum.RNA_MOLECULE:
              return "Molecule Moved";
            case InteractionConstraint.Enum.RNA_SINGLE_STRAND:
              return "Single Strand Moved";
            case InteractionConstraint.Enum.ENTIRE_SCENE:
              return "Scene Modified";
            default:
              return "Structure Moved";
          }
        }
        return "Structure Modified";
      } else if (mode === Tab.FORMAT) {
        return "Formatting Applied";
      } else if (mode === Tab.ANNOTATE) {
        return "Annotation Added";
      }
      return "Structure Changed";
    } else if (dataType === "IndicesOfFrozenNucleotides") {
      return "Nucleotides Frozen/Unfrozen";
    }
    return "Action";
  };

  const totalActions = undoStack.length + redoStack.length;
  const currentPosition = undoStack.length;

  return (
    <div
      style={{
        border: `1px solid ${theme.colors.border}`,
        borderRadius: theme.borderRadius.lg,
        overflow: "hidden",
        background: theme.colors.surface,
      }}
    >
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        style={{
          width: "100%",
          padding: "8px 12px",
          background: theme.colors.surfaceHover,
          border: "none",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          cursor: "pointer",
          color: theme.colors.text,
          fontSize: theme.typography.fontSize.xs,
          fontWeight: "600",
          textTransform: "uppercase",
          letterSpacing: "0.5px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <History size={12} />
          History ({totalActions})
        </div>
        {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
      </button>

      {isExpanded && (
        <div style={{ padding: "12px" }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
              padding: "8px 12px",
              background: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.md,
              fontSize: theme.typography.fontSize.xs,
            }}
          >
            <span style={{ color: theme.colors.textSecondary }}>
              Position: {currentPosition} / {totalActions}
            </span>
          </div>

          <div style={{ maxHeight: "200px", overflowY: "auto" }}>
            {undoStack.map((action, index) => {
              const isCheckpoint = checkpoints.includes(index);
              const isCurrentPosition = index === currentPosition - 1;

              return (
                <div
                  key={`undo-${index}`}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    padding: "6px 8px",
                    marginBottom: "4px",
                    borderRadius: theme.borderRadius.sm,
                    background: isCurrentPosition
                      ? theme.colors.primary + "20"
                      : "transparent",
                    border: `1px solid ${
                      isCheckpoint ? theme.colors.success : theme.colors.border
                    }`,
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background =
                      theme.colors.surfaceHover;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = isCurrentPosition
                      ? theme.colors.primary + "20"
                      : "transparent";
                  }}
                  onClick={() => onJumpToHistory(index)}
                >
                  <div
                    style={{
                      width: "8px",
                      height: "8px",
                      borderRadius: "50%",
                      background: isCheckpoint
                        ? theme.colors.success
                        : theme.colors.primary,
                      flexShrink: 0,
                    }}
                  />
                  <div
                    style={{ flex: 1, fontSize: theme.typography.fontSize.xs }}
                  >
                    <div
                      style={{
                        color: theme.colors.text,
                        fontWeight: isCurrentPosition ? "600" : "400",
                      }}
                    >
                      {getActionName(action.dataType, index)}
                    </div>
                    <div
                      style={{
                        color: theme.colors.textSecondary,
                        fontSize: "9px",
                        marginTop: "2px",
                      }}
                    >
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

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px",
                margin: "8px 0",
                background: theme.colors.primary + "10",
                border: `2px solid ${theme.colors.primary}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: "600",
              }}
            >
              <div
                style={{
                  width: "10px",
                  height: "10px",
                  borderRadius: "50%",
                  background: theme.colors.primary,
                }}
              />
              <span style={{ color: theme.colors.primary }}>Current State</span>
            </div>

            {redoStack.map((action, index) => (
              <div
                key={`redo-${index}`}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "6px 8px",
                  marginBottom: "4px",
                  borderRadius: theme.borderRadius.sm,
                  background: "transparent",
                  border: `1px solid ${theme.colors.border}`,
                  cursor: "pointer",
                  opacity: 0.6,
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = theme.colors.surfaceHover;
                  e.currentTarget.style.opacity = "1";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                  e.currentTarget.style.opacity = "0.6";
                }}
                onClick={() => onJumpToHistory(undoStack.length + index)}
              >
                <div
                  style={{
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: theme.colors.textMuted,
                    flexShrink: 0,
                  }}
                />
                <div
                  style={{ flex: 1, fontSize: theme.typography.fontSize.xs }}
                >
                  <div style={{ color: theme.colors.textMuted }}>
                    Redo {index + 1}
                  </div>
                  <div
                    style={{
                      color: theme.colors.textSecondary,
                      fontSize: "9px",
                    }}
                  >
                    {action.dataType}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div
            style={{
              marginTop: "12px",
              padding: "8px 12px",
              background: theme.colors.backgroundSecondary,
              borderRadius: theme.borderRadius.sm,
              fontSize: "9px",
              color: theme.colors.textSecondary,
              lineHeight: "1.4",
            }}
          >
            <strong>Tip:</strong> Click on any action to jump to that point in
            history.
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
  onFreezeSelected,
  onUnfreezeSelected,
  onUnfreezeAll,
  hasFrozenNucleotides = false,
  hasSelectedNucleotides = false,
}) => {
  const { theme } = useTheme();

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
      <div style={{ display: "flex", gap: "6px" }}>
        <Button
          onClick={onUndo}
          disabled={!onUndo}
          icon={<Undo2 size={14} />}
          label="Undo"
          hint="Undo last action"
          variant="secondary"
        />
        <Button
          onClick={onRedo}
          disabled={!onRedo}
          icon={<Redo2 size={14} />}
          label="Redo"
          hint="Redo last action"
          variant="secondary"
        />
        <Button
          onClick={onResetToLastCheckpoint}
          disabled={!onResetToLastCheckpoint}
          icon={<RotateCcw size={14} />}
          label="Restore"
          hint="Restore to last checkpoint"
          variant="danger"
        />
        <Button
            onClick={onUnfreezeAll}
            disabled={!onUnfreezeAll || !hasFrozenNucleotides}
            icon={<LockOpen size={14} />}
            label="Unlock"
            hint="Unlock all nucleotides (allows movement)"
            variant="danger"
          />

      </div>

      {/* Freeze Controls Section */}
      
        {/* <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}> */}
          {/* <Button
            onClick={onFreezeSelected}
            disabled={!onFreezeSelected || !hasSelectedNucleotides}
            icon={<Lock size={12} />}
            label="Freeze"
            hint="Lock selected nucleotides in place (prevents movement)"
            variant="secondary"
          /> */}
          {/* <Button
            onClick={onUnfreezeSelected}
            disabled={!onUnfreezeSelected || !hasSelectedNucleotides}
            icon={<LockOpen size={12} />}
            label="Unfreeze"
            hint="Unlock selected nucleotides (allows movement)"
            variant="secondary"
          /> */}
          
        {/* </div> */}
        <div
          style={{
            fontSize: "12px",
            color: theme.colors.textSecondary,
            marginTop: "8px",
            lineHeight: "1.4",
          }}
        >
          <strong>Tip:</strong> Use Middle-click to toggle (lock/unlock) nucleotides in place while moving others.
        </div>
      

      {/* <HistoryViewer
        undoStack={undoStack}
        redoStack={redoStack}
        onJumpToHistory={onJumpToHistory || (() => {})}
        onResetToLastCheckpoint={onResetToLastCheckpoint || (() => {})}
        mode={mode}
        constraint={constraint}
      /> */}
    </div>
  );
};
