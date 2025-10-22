import { useContext, useEffect, useState } from "react";
import Color, { BLACK, toCSS } from "../../../data_structures/Color";
import Wheel from '@uiw/react-color-wheel';
import { rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { Collapsible } from "../Collapsible";
import { Context } from "../../../context/Context";
import { DEFAULT_STROKE_WIDTH } from "../../../utils/Constants";

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

  export function Component(props: Props) {
    const {
      pathStyle,
      setPathStyle
    } = props;

    const pushToUndoStack = useContext(Context.App.PushToUndoStack);
    
    const pathColor = pathStyle.pathColor ?? BLACK;
    const pathLineWidth = pathStyle.pathLineWidth ?? DEFAULT_STROKE_WIDTH;
    const pathCurvature = pathStyle.pathCurvature ?? 0;
    
    // Color wheel state
    const [hsva, setHsva] = useState({
      h: 0,
      s: 0,
      v: 100,
      a: 1
    });
    
    const [pushedColorStateFlag, setPushedColorStateFlag] = useState(false);
    
    // Update hsva when pathColor changes
    useEffect(() => {
      const rgba = {
        r: pathColor.red,
        g: pathColor.green,
        b: pathColor.blue,
        a: pathColor.alpha ?? 1
      };
      setHsva(rgbaToHsva(rgba));
      setPushedColorStateFlag(false);
    }, [pathStyle.pathColor]);
    
    const setPathColorHelper = (newColor: Color) => {
      if (!pushedColorStateFlag) {
        pushToUndoStack();
        setPushedColorStateFlag(true);
      }
      setPathStyle({
        ...pathStyle,
        pathColor: newColor
      });
    };

    return (
      <Collapsible.Component
        title="Path"
        initialCollapsedFlag={false}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Path Color - Color Wheel */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: "500"
            }}>
              Path Color
            </label>
            <ShadeSlider
              hsva={hsva}
              onChange={(newShade) => {
                const newHsva = {
                  ...hsva,
                  v: newShade.v
                };
                setHsva(newHsva);
                const newRgba = hsvaToRgba(newHsva);
                const newColor = {
                  red: newRgba.r,
                  green: newRgba.g,
                  blue: newRgba.b,
                  alpha: pathColor.alpha
                };
                setPathColorHelper(newColor);
              }}
              style={{ width: "100%", marginBottom: "8px" }}
            />
            <Wheel
              color={hsva}
              onChange={(color) => {
                setHsva({
                  ...hsva,
                  ...color.hsva
                });
                const newColor = {
                  red: color.rgba.r,
                  green: color.rgba.g,
                  blue: color.rgba.b,
                  alpha: pathColor.alpha
                };
                setPathColorHelper(newColor);
              }}
            />
          </div>

          {/* Path Line Width */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: "500"
            }}>
              Line Width: {pathLineWidth.toFixed(1)}
            </label>
            <input
              type="range"
              min={0.5}
              max={10}
              step={0.5}
              value={pathLineWidth}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setPathStyle({
                  ...pathStyle,
                  pathLineWidth: value
                });
              }}
              onMouseDown={() => pushToUndoStack()}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              fontSize: "10px",
              color: "#666",
              marginTop: "4px"
            }}>
              <span>Thin (0.5)</span>
              <span>Thick (10)</span>
            </div>
          </div>

          {/* Path Curvature */}
          <div>
            <label style={{ 
              display: "block", 
              marginBottom: "8px",
              fontSize: "13px",
              fontWeight: "500"
            }}>
              Curvature: {pathCurvature === 0 ? 'Straight' : pathCurvature < 0.3 ? 'Slight' : pathCurvature < 0.7 ? 'Moderate' : 'High'}
            </label>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={pathCurvature}
              onChange={(e) => {
                const value = parseFloat(e.target.value);
                setPathStyle({
                  ...pathStyle,
                  pathCurvature: value
                });
              }}
              onMouseDown={() => pushToUndoStack()}
              style={{
                width: "100%",
                height: "6px",
                borderRadius: "3px",
                outline: "none",
                cursor: "pointer",
              }}
            />
            <div style={{ 
              display: "flex", 
              justifyContent: "space-between", 
              fontSize: "10px",
              color: "#666",
              marginTop: "4px"
            }}>
              <span>Straight</span>
              <span>Curvy</span>
            </div>
          </div>
        </div>
      </Collapsible.Component>
    );
  }
}

