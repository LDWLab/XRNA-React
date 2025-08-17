import React, { useState } from "react";
import { useTheme } from "../../context/ThemeContext";
import { Setting, SettingsRecord } from "../../ui/Setting";
import {
  Settings,
  Grid,
  ZoomIn,
  ZoomOut,
  X,
  RotateCcw,
  Circle,
  Minus,
  MoveUpLeft,
  MoveUpRight,  
  Grip,
  MoveVertical,
  MoveHorizontal,
} from "lucide-react";

export interface FloatingControlsProps {
  settings: SettingsRecord;
  setSettings: (settings: SettingsRecord) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetViewport: () => void;
  position?: { top: number; right: number };
}

export const FloatingControls: React.FC<FloatingControlsProps> = ({
  settings,
  setSettings,
  onZoomIn,
  onZoomOut,
  onResetViewport,
  position = { top: 80, right: 20 },
}) => {
  const { theme, isDarkMode } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleExpanded = () => setIsExpanded(!isExpanded);

  // Grid type toggle function
  const toggleGridType = (setting: Setting) => {
    setSettings({
      ...settings,
      [setting]: !settings[setting],
    });
  };

  // Color change function
  const handleColorChange = (setting: Setting, color: string) => {
    setSettings({
      ...settings,
      [setting]: color,
    });
  };

  // Simple color swatches component
  const ColorSwatches = ({
    currentColor,
    onColorChange,
    label,
  }: {
    currentColor: string;
    onColorChange: (color: string) => void;
    label: string;
  }) => {
    // Different color palettes for grid vs canvas
    const isGridColor = label === "Grid Lines";

    if (isGridColor) {
      // Muted colors for grid - good contrast, not too bright
      const gridColors = isDarkMode
        ? [
            "#FFB3BA", // Soft pink
            "#BAFFC9", // Soft mint
            "#BAE1FF", // Soft blue
            "#FFFFBA", // Soft yellow
          ]
        : [
            "#FF6B6B", // Coral red
            "#4ECDC4", // Turquoise
            "#45B7D1", // Sky blue
            "#96CEB4", // Sage green
          ];
      return (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label
              style={{
                color: theme.colors.text,
                fontSize: "13px",
              }}
            >
              {label}
            </label>
          </div>

          {/* Hex input */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder="Auto (theme-based)"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                color: theme.colors.text,
                fontSize: "12px",
              }}
            />
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: currentColor || "transparent",
                border: `2px solid ${theme.colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: theme.colors.textSecondary,
              }}
            >
              {currentColor ? "" : "A"}
            </div>
          </div>

          {/* Color swatches */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}
          >
            {gridColors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                style={{
                  width: "24px",
                  height: "24px",
                  background: color,
                  border: `2px solid ${
                    currentColor === color ? "#007AFF" : "transparent"
                  }`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      );
    } else {
      // Pastel colors for canvas - nice looking, good contrast
      const canvasColors = isDarkMode
        ? [
            "#E0E0E0", // Light gray
            "#B0B0B0", // Medium light gray
            "#808080", // Medium gray
            "#404040", // Dark gray
          ]
        : [
            "#404040", // Dark gray
            "#606060", // Medium dark gray
            "#808080", // Medium gray
            "#A0A0A0", // Light gray
          ];
      return (
        <div style={{ marginBottom: "16px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "8px",
            }}
          >
            <label
              style={{
                color: theme.colors.text,
                fontSize: "13px",
              }}
            >
              {label}
            </label>
          </div>

          {/* Hex input */}
          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              marginBottom: "12px",
            }}
          >
            <input
              type="text"
              value={currentColor}
              onChange={(e) => onColorChange(e.target.value)}
              placeholder="Auto (theme-based)"
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: `1px solid ${theme.colors.border}`,
                background: theme.colors.surface,
                color: theme.colors.text,
                fontSize: "12px",
              }}
            />
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "6px",
                background: currentColor || "transparent",
                border: `2px solid ${theme.colors.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "10px",
                color: theme.colors.textSecondary,
              }}
            >
              {currentColor ? "" : "A"}
            </div>
          </div>

          {/* Color swatches */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "8px",
            }}
          >
            {canvasColors.map((color) => (
              <button
                key={color}
                onClick={() => onColorChange(color)}
                style={{
                  width: "24px",
                  height: "24px",
                  background: color,
                  border: `2px solid ${
                    currentColor === color ? "#007AFF" : "transparent"
                  }`,
                  borderRadius: "6px",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                title={color}
              />
            ))}
          </div>
        </div>
      );
    }
  };

  // Grid type button component
  const GridTypeButton = ({
    setting,
    icon: Icon,
    label,
    isActive,
  }: {
    setting: Setting;
    icon: React.ComponentType<any>;
    label: string;
    isActive: boolean;
  }) => (
    <button
      onClick={() => toggleGridType(setting)}
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "4px",
        padding: "8px",
        borderRadius: "8px",
        border: "none",
        background: isActive ? theme.colors.primary : "transparent",
        color: isActive ? "#FFFFFF" : theme.colors.text,
        cursor: "pointer",
        transition: "all 0.2s ease",
        minWidth: "48px",
        minHeight: "48px",
        justifyContent: "center",
      }}
      title={label}
    >
      <Icon size={20} />
      <span style={{ fontSize: "10px", textAlign: "center" }}>{label}</span>
    </button>
  );

  return (
    <div
      style={{
        position: "absolute",
        top: position.top,
        right: position.right,
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "12px",
        alignItems: "flex-end",
      }}
    >
      {/* Zoom Controls - Above Settings Button */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "8px",
          alignItems: "center",
        }}
      >
        <button
          onClick={onZoomIn}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            border: "none",
            background: theme.colors.surface,
            color: theme.colors.text,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
          }}
          title="Zoom In"
        >
          <ZoomIn size={20} />
        </button>

        <button
          onClick={onZoomOut}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            border: "none",
            background: theme.colors.surface,
            color: theme.colors.text,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
          }}
          title="Zoom Out"
        >
          <ZoomOut size={20} />
        </button>

        <button
          onClick={onResetViewport}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            border: "none",
            background: theme.colors.surface,
            color: theme.colors.text,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            transition: "all 0.2s ease",
          }}
          title="Reset View"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Settings Button */}
      <div style={{ position: "relative" }}>
        <button
          onClick={toggleExpanded}
          style={{
            width: "35px",
            height: "35px",
            borderRadius: "50%",
            border: "none",
            background: theme.colors.primary,
            color: "#FFFFFF",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 4px 16px rgba(0,0,0,0.2)",
            transition: "all 0.2s ease",
            transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)",
          }}
          title="Grid Settings"
        >
          <Settings size={20} />
        </button>

        {/* Expanded Settings Panel */}
        {isExpanded && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              right: 0,
              marginTop: "12px",
              background: theme.colors.surface,
              border: `1px solid ${theme.colors.border}`,
              borderRadius: "16px",
              padding: "20px",
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              minWidth: "320px",
              zIndex: 1000,
            }}
          >
            {/* Header */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "20px",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  color: theme.colors.text,
                  fontSize: "18px",
                  fontWeight: "600",
                }}
              >
                Grid Settings
              </h3>
              <button
                onClick={toggleExpanded}
                style={{
                  background: "none",
                  border: "none",
                  color: theme.colors.text,
                  cursor: "pointer",
                  padding: "4px",
                  borderRadius: "4px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Grid Type Selection */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  color: theme.colors.text,
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Grid Types
              </h4>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "8px",
                }}
              >
                <GridTypeButton
                  setting={Setting.GRID_HORIZONTAL_LINES}
                  icon={MoveHorizontal}
                  label="Horizontal"
                  isActive={settings[Setting.GRID_HORIZONTAL_LINES] as boolean}
                />
                <GridTypeButton
                  setting={Setting.GRID_VERTICAL_LINES}
                  icon={MoveVertical}
                  label="Vertical"
                  isActive={settings[Setting.GRID_VERTICAL_LINES] as boolean}
                />
                <GridTypeButton
                  setting={Setting.GRID_DOTTED}
                  icon={Grip}
                  label="Crosshatch"
                  isActive={settings[Setting.GRID_DOTTED] as boolean}
                />
                <GridTypeButton
                  setting={Setting.GRID_LEFT_RIGHT_DIAGONAL}
                  icon={MoveUpLeft}
                  label="LR Diagonal"
                  isActive={
                    settings[Setting.GRID_LEFT_RIGHT_DIAGONAL] as boolean
                  }
                />
                <GridTypeButton
                  setting={Setting.GRID_RIGHT_LEFT_DIAGONAL}
                  icon={MoveUpRight}
                  label="RL Diagonal"
                  isActive={
                    settings[Setting.GRID_RIGHT_LEFT_DIAGONAL] as boolean
                  }
                />
                <GridTypeButton
                  setting={Setting.GRID_CONCENTRIC_CIRCLES}
                  icon={Circle}
                  label="Circles"
                  isActive={
                    settings[Setting.GRID_CONCENTRIC_CIRCLES] as boolean
                  }
                />
              </div>
            </div>

            {/* Grid Spacing */}
            <div style={{ marginBottom: "24px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <label
                  style={{
                    color: theme.colors.text,
                    fontSize: "14px",
                    fontWeight: "500",
                  }}
                >
                  Grid Spacing
                </label>
                <span
                  style={{
                    color: theme.colors.textSecondary,
                    fontSize: "12px",
                  }}
                >
                  {settings[Setting.GRID_SPACING]}
                </span>
              </div>
              <input
                type="range"
                min="5"
                max="100"
                step="2"
                value={settings[Setting.GRID_SPACING] as number}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    [Setting.GRID_SPACING]: parseInt(e.target.value),
                  })
                }
                style={{
                  width: "100%",
                  height: "6px",
                  borderRadius: "3px",
                  background: theme.colors.border,
                  outline: "none",
                  cursor: "pointer",
                }}
              />
            </div>

            {/* Color Settings */}
            <div style={{ marginBottom: "24px" }}>
              <h4
                style={{
                  margin: "0 0 12px 0",
                  color: theme.colors.text,
                  fontSize: "14px",
                  fontWeight: "500",
                }}
              >
                Colors
              </h4>

              {/* Canvas Color */}
              <ColorSwatches
                currentColor={settings[Setting.CANVAS_COLOR] as string}
                onColorChange={(color) =>
                  handleColorChange(Setting.CANVAS_COLOR, color)
                }
                label="Canvas Background"
              />

              {/* Grid Color */}
              <ColorSwatches
                currentColor={settings[Setting.GRID_COLOR] as string}
                onColorChange={(color) =>
                  handleColorChange(Setting.GRID_COLOR, color)
                }
                label="Grid Lines"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
