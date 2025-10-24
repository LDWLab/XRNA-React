import React from "react";
import { PanelContainer } from "../layout/PanelContainer";
import { Tab, tabs } from "../../../app_data/Tab";
import { useTheme } from "../../../context/ThemeContext";
import { ActionsPanel } from "./ActionsPanel";
import { InteractionConstraint } from "../../../ui/InteractionConstraint/InteractionConstraints";
import { Circle, Move, Pencil, Cable } from "lucide-react";

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
  onFreezeSelected?: () => void;
  onUnfreezeSelected?: () => void;
  onUnfreezeAll?: () => void;
  hasFrozenNucleotides?: boolean;
  hasSelectedNucleotides?: boolean;
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
        return <Move size={12} />;
      case Tab.FORMAT:
        return <Cable size={12} />;
      case Tab.ANNOTATE:
        return <Pencil size={12} />;
      default:
        return <Circle size={12} />;
    }
  };

  const getModeLabel = (mode: Tab) => {
    switch (mode) {
      case Tab.EDIT:
        return "Edit";
      case Tab.FORMAT:
        return "Format";
      case Tab.ANNOTATE:
        return "Annotate";
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
        display: "flex",
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        gap: "6px",
        height: theme.buttonSizes.sm.height,
        padding: theme.buttonSizes.sm.padding,
        border: "none",
        borderRadius: theme.buttonSizes.sm.borderRadius,
        fontSize: theme.buttonSizes.sm.fontSize,
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: disabled ? 0.4 : 1,
        flex: 1,
        background: disabled
          ? theme.colors.surfaceHover
          : isActive
          ? theme.colors.primary
          : isHovered
          ? theme.colors.surfaceHover
          : "transparent",
        color: disabled
          ? theme.colors.textMuted
          : isActive
          ? theme.colors.textInverse
          : isHovered
          ? theme.colors.primary
          : theme.colors.textSecondary,
        boxShadow: isActive ? theme.shadows.md : "none",
        transform: isActive ? "scale(1.02)" : "scale(1)",
      }}
    >
      {getModeIcon(tab)}
      <span
        style={{
          fontSize: theme.typography.fontSize.sm,
          fontWeight: "600",
          textAlign: "center",
        }}
      >
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
  onFreezeSelected,
  onUnfreezeSelected,
  onUnfreezeAll,
  hasFrozenNucleotides,
  hasSelectedNucleotides,
}) => {
  const { theme } = useTheme();

  const handleModeChange = (tab: Tab) => {
    if (tab === Tab.FORMAT && onFormatModeClick) {
      onFormatModeClick();
    } else if (onModeChange) {
      onModeChange(tab);
    }
  };

  return (
    <PanelContainer title="drawing tools" borderRadius={8}>
      <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
        <div>
          <div
            style={{
              display: "flex",
              gap: "6px",
              background: theme.colors.surfaceHover,
              padding: "4px",
              borderRadius: theme.borderRadius.lg,
            }}
          >
            {tabs
              .filter((tab) =>
                [Tab.EDIT, Tab.FORMAT, Tab.ANNOTATE].includes(tab)
              )
              .map((tab) => (
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
          onFreezeSelected={onFreezeSelected}
          onUnfreezeSelected={onUnfreezeSelected}
          onUnfreezeAll={onUnfreezeAll}
          hasFrozenNucleotides={hasFrozenNucleotides}
          hasSelectedNucleotides={hasSelectedNucleotides}
        />
      </div>
    </PanelContainer>
  );
};
