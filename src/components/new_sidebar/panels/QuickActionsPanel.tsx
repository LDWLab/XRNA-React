import React from "react";
import { PanelContainer } from "../layout/PanelContainer";
import { Settings, Info, TableProperties, Cable } from "lucide-react";
import { useTheme } from '../../../context/ThemeContext';

export type QuickActionsCallbacks = {
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
};

export const CompactButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  disabled?: boolean;
  variant?: "primary" | "secondary";
}> = ({ onClick, icon, label, disabled = false, variant = "secondary" }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        padding: "8px 6px",
        border: "none",
        borderRadius: "6px",
        fontSize: "9px",
        fontWeight: "600",
        cursor: disabled ? "not-allowed" : "pointer",
        transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: disabled ? 0.5 : 1,
        flex: 1,
        minWidth: "0",
        background: disabled
          ? theme.colors.surfaceHover
          : variant === "primary"
          ? isPressed
            ? theme.colors.primary
            : isHovered
            ? theme.colors.primaryHover
            : theme.colors.primary
          : isPressed
          ? theme.colors.surfaceHover
          : isHovered
          ? theme.colors.surfaceHover
          : theme.colors.background,
        color: disabled ? theme.colors.textMuted : variant === "primary" ? theme.colors.textInverse : theme.colors.text,
        boxShadow: disabled
          ? "none"
          : variant === "primary"
          ? isPressed
            ? theme.shadows.sm
            : theme.shadows.md
          : isPressed
          ? theme.shadows.sm
          : theme.shadows.sm,
        transform: disabled
          ? "none"
          : isPressed
          ? "scale(0.95)"
          : isHovered
          ? "translateY(-1px)"
          : "translateY(0)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "14px",
          opacity: disabled ? 0.5 : 1,
        }}
      >
        {icon}
      </div>
      <span
        style={{
          textAlign: "center",
          letterSpacing: "0.3px",
          lineHeight: "1.2",
          fontSize: "9px",
          fontWeight: "600",
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    </button>
  );
};

export const QuickActionsPanel: React.FC<QuickActionsCallbacks> = ({
  onToggleBasePairEditor,
  onTogglePropertiesDrawer,
  onToggleSettingsDrawer,
  onToggleAboutDrawer,
}) => {
  const { theme } = useTheme();
  return (
    <PanelContainer title="Utilities" borderRadius={8}>
      {(onToggleBasePairEditor || onTogglePropertiesDrawer) && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.colors.text,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            Editors
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {onToggleBasePairEditor && (
              <CompactButton
                onClick={onToggleBasePairEditor}
                icon={<Cable size={12} />}
                label="Base Pairs"
              />
            )}
            {onTogglePropertiesDrawer && (
              <CompactButton
                onClick={onTogglePropertiesDrawer}
                icon={<TableProperties size={12} />}
                label="Properties"
              />
            )}
          </div>
        </div>
      )}
      {(onToggleSettingsDrawer || onToggleAboutDrawer) && (
        <div style={{ marginTop: 8 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: theme.colors.text,
              marginBottom: 6,
              textTransform: "uppercase",
              letterSpacing: "0.5px",
            }}
          >
            App
          </div>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {onToggleSettingsDrawer && (
              <CompactButton
                onClick={onToggleSettingsDrawer}
                icon={<Settings size={12}/>}
                label="Settings"
              />
            )}
            {onToggleAboutDrawer && (
              <CompactButton
                onClick={onToggleAboutDrawer}
                icon={<Info size={12} />}
                label="About"
              />
            )}
          </div>
        </div>
      )}
    </PanelContainer>
  );
};
