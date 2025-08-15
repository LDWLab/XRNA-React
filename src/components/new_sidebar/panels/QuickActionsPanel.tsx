import React from "react";
import { PanelContainer } from "../layout/PanelContainer";
import { Settings, Info, TableProperties, Cable } from "lucide-react";

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
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const isPrimary = variant === "primary";

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
        justifyContent: "center",
        gap: "4px",
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
          ? "#f1f5f9"
          : isPrimary
          ? isPressed
            ? "#2563eb"
            : isHovered
            ? "#3b82f6"
            : "#4f46e5"
          : isPressed
          ? "#e2e8f0"
          : isHovered
          ? "#f1f5f9"
          : "#ffffff",
        color: disabled ? "#94a3b8" : isPrimary ? "#ffffff" : "#475569",
        boxShadow: disabled
          ? "none"
          : isPrimary
          ? isPressed
            ? "0 1px 3px rgba(79, 70, 229, 0.3)"
            : "0 2px 6px rgba(79, 70, 229, 0.2)"
          : isPressed
          ? "0 1px 2px rgba(0, 0, 0, 0.1)"
          : "0 1px 3px rgba(0, 0, 0, 0.08)",
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
  return (
    <PanelContainer title="Utilities" borderRadius={8}>
      {(onToggleBasePairEditor || onTogglePropertiesDrawer) && (
        <div>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: "#334155",
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
              color: "#334155",
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
