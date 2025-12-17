import { useContext } from "react";
import Color, { BLACK } from "../../../data_structures/Color";
import { Context } from "../../../context/Context";
import { DEFAULT_STROKE_WIDTH } from "../../../utils/Constants";
import { ColorEditor } from "./ColorEditor";

export namespace PathEditor {
  export type PathStyle = {
    pathColor?: Color;
    pathLineWidth?: number;
    pathCurvature?: number; // 0 = straight, 1 = very curvy
  };

  export type Props = {
    pathStyle: PathStyle;
    setPathStyle: (style: PathStyle) => void;
  };

  // Inline path editor (no Collapsible wrapper)
  export function Inline(props: Props) {
    const {
      pathStyle,
      setPathStyle
    } = props;

    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
    
    const pathColor = pathStyle.pathColor ?? BLACK;
    const pathLineWidth = pathStyle.pathLineWidth ?? DEFAULT_STROKE_WIDTH;
    const pathCurvature = pathStyle.pathCurvature ?? 0;

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Path Color */}
        <ColorEditor.Inline
          color={pathColor}
          setColorHelper={(newColor) => {
            setPathStyle({
              ...pathStyle,
              pathColor: newColor
            });
          }}
        />

        {/* Line Width + Curvature in compact row */}
        <div style={{ display: "flex", gap: 12, alignItems: "flex-start" }}>
          {/* Line Width */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#666" }}>Width</span>
              <input
                type="range"
                min={0.5}
                max={10}
                step={0.5}
                value={pathLineWidth}
                onChange={(e) => {
                  setPathStyle({
                    ...pathStyle,
                    pathLineWidth: parseFloat(e.target.value)
                  });
                }}
                onMouseDown={() => pushToUndoStack()}
                style={{ width: 60, height: 4, cursor: "pointer" }}
              />
              <input
                type="number"
                min={0.5}
                max={10}
                step={0.5}
                value={pathLineWidth}
                onChange={(e) => {
                  setPathStyle({
                    ...pathStyle,
                    pathLineWidth: parseFloat(e.target.value) || 1
                  });
                }}
                style={{ 
                  width: 36, 
                  textAlign: "center", 
                  fontSize: 10,
                  padding: "2px 4px",
                  border: "1px solid #ddd",
                  borderRadius: 3
                }}
              />
            </div>
          </div>

          {/* Curvature */}
          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 10, color: "#666" }}>Curve</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={pathCurvature}
                onChange={(e) => {
                  setPathStyle({
                    ...pathStyle,
                    pathCurvature: parseFloat(e.target.value)
                  });
                }}
                onMouseDown={() => pushToUndoStack()}
                style={{ width: 60, height: 4, cursor: "pointer" }}
              />
              <span style={{ fontSize: 10, color: "#888", width: 45 }}>
                {pathCurvature === 0 ? 'Straight' : pathCurvature < 0.5 ? 'Slight' : 'Curvy'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  export function Component(props: Props) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 2 }}>Path</div>
        <Inline {...props} />
      </div>
    );
  }
}

