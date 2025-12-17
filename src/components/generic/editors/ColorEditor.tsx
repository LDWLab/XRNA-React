import { useContext, useEffect, useState } from "react";
import Color, { BLACK, DEFAULT_ALPHA } from "../../../data_structures/Color";
import Wheel from '@uiw/react-color-wheel';
import ShadeSlider from '@uiw/react-color-shade-slider';
import { rgbaToHsva, hsvaToRgba } from '@uiw/color-convert';
import { Context } from "../../../context/Context";

export namespace ColorEditor {
  export type Props = {
    setColorHelper : (color : Color) => void,
    color? : Color,
    children? : React.ReactNode,
    title?: string
  };

  // Convert RGB to hex string
  function rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => Math.max(0, Math.min(255, n)).toString(16).padStart(2, '0').toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }

  // Parse hex to RGB
  function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const match = /^#?([a-fA-F0-9]{6})$/.exec(hex);
    if (!match) return null;
    return {
      r: parseInt(match[1].substring(0, 2), 16),
      g: parseInt(match[1].substring(2, 4), 16),
      b: parseInt(match[1].substring(4, 6), 16)
    };
  }

  // Inline color picker content
  export function Inline(props : Props) {
    const {
      setColorHelper : _setColorHelper,
      color,
      children
    } = props;
    const [red, setRed] = useState(color?.red ?? 0);
    const [green, setGreen] = useState(color?.green ?? 0);
    const [blue, setBlue] = useState(color?.blue ?? 0);
    const [alpha, setAlpha] = useState(color?.alpha ?? 255);
    const [hexadecimal, setHexadecimal] = useState(() => rgbToHex(color?.red ?? 0, color?.green ?? 0, color?.blue ?? 0));
    const [hsva, setHsva] = useState(() => rgbaToHsva({ r: color?.red ?? 0, g: color?.green ?? 0, b: color?.blue ?? 0, a: (color?.alpha ?? 255) / 255 }));
    const [showPicker, setShowPicker] = useState(false);
    const [pushedColorStateFlag, setPushedColorStateFlag] = useState(false);

    const pushToUndoStack = useContext(Context.App.PushToUndoStack);

    function updateColor(r: number, g: number, b: number, a: number) {
      setRed(r);
      setGreen(g);
      setBlue(b);
      setAlpha(a);
      setHexadecimal(rgbToHex(r, g, b));
      setHsva(rgbaToHsva({ r, g, b, a: a / 255 }));
      if (!pushedColorStateFlag) {
        pushToUndoStack();
        setPushedColorStateFlag(true);
      }
      _setColorHelper({ red: r, green: g, blue: b, alpha: a });
    }

    function handleMouseUp() {
      setPushedColorStateFlag(false);
    }

    useEffect(function() {
      const localColor = color ?? BLACK;
      setRed(localColor.red);
      setGreen(localColor.green);
      setBlue(localColor.blue);
      setAlpha(localColor.alpha ?? DEFAULT_ALPHA);
      setHexadecimal(rgbToHex(localColor.red, localColor.green, localColor.blue));
      setHsva(rgbaToHsva({ r: localColor.red, g: localColor.green, b: localColor.blue, a: (localColor.alpha ?? DEFAULT_ALPHA) / 255 }));
    }, [color]);

    const sliderStyle = { width: 60, height: 4, cursor: "pointer" };
    const numInputStyle = { width: 36, textAlign: "center" as const, fontSize: 10, padding: "2px 4px", border: "1px solid #ddd", borderRadius: 3 };

    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {children}
        <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
          <div
            onClick={() => setShowPicker(!showPicker)}
            style={{
              width: 48, height: 48, borderRadius: 8,
              backgroundColor: `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`,
              border: "2px solid #ccc", flexShrink: 0, cursor: "pointer",
              boxShadow: "0 1px 4px rgba(0,0,0,0.12)",
            }}
            title="Click for color wheel"
          />
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            {/* Red */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, fontSize: 10, fontWeight: 600, color: "#e53935" }}>R</span>
              <input type="range" min={0} max={255} value={red}
                onChange={(e) => updateColor(parseInt(e.target.value), green, blue, alpha)}
                onMouseUp={handleMouseUp}
                style={{ ...sliderStyle, accentColor: "#e53935" }}
              />
              <input type="number" min={0} max={255} value={red}
                onChange={(e) => updateColor(parseInt(e.target.value) || 0, green, blue, alpha)}
                style={numInputStyle}
              />
            </div>
            {/* Green */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, fontSize: 10, fontWeight: 600, color: "#43a047" }}>G</span>
              <input type="range" min={0} max={255} value={green}
                onChange={(e) => updateColor(red, parseInt(e.target.value), blue, alpha)}
                onMouseUp={handleMouseUp}
                style={{ ...sliderStyle, accentColor: "#43a047" }}
              />
              <input type="number" min={0} max={255} value={green}
                onChange={(e) => updateColor(red, parseInt(e.target.value) || 0, blue, alpha)}
                style={numInputStyle}
              />
            </div>
            {/* Blue */}
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ width: 14, fontSize: 10, fontWeight: 600, color: "#1e88e5" }}>B</span>
              <input type="range" min={0} max={255} value={blue}
                onChange={(e) => updateColor(red, green, parseInt(e.target.value), alpha)}
                onMouseUp={handleMouseUp}
                style={{ ...sliderStyle, accentColor: "#1e88e5" }}
              />
              <input type="number" min={0} max={255} value={blue}
                onChange={(e) => updateColor(red, green, parseInt(e.target.value) || 0, alpha)}
                style={numInputStyle}
              />
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "#666" }}>#</span>
              <input
                type="text"
                value={hexadecimal.replace('#', '')}
                onChange={(e) => {
                  const newHex = '#' + e.target.value;
                  setHexadecimal(newHex);
                  const rgb = hexToRgb(newHex);
                  if (rgb) updateColor(rgb.r, rgb.g, rgb.b, alpha);
                }}
                style={{ width: 52, fontFamily: "monospace", fontSize: 10, padding: "2px 4px", border: "1px solid #ddd", borderRadius: 3 }}
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <span style={{ fontSize: 10, color: "#666" }}>A</span>
              <input
                type="number"
                min={0}
                max={255}
                value={alpha}
                onChange={(e) => updateColor(red, green, blue, parseInt(e.target.value) || 0)}
                style={{ width: 52, textAlign: "center", fontSize: 10, padding: "2px 4px", border: "1px solid #ddd", borderRadius: 3 }}
              />
            </div>
          </div>
        </div>
        {showPicker && (
          <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: 10, border: "1px solid #e0e0e0", borderRadius: 8, backgroundColor: "#fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <Wheel
                color={hsva}
                onChange={(wheelColor) => {
                  const newHsva = { ...hsva, ...wheelColor.hsva };
                  setHsva(newHsva);
                  updateColor(wheelColor.rgba.r, wheelColor.rgba.g, wheelColor.rgba.b, alpha);
                }}
                width={140}
                height={140}
              />
            </div>
            <ShadeSlider
              hsva={hsva}
              onChange={(newShade) => {
                const newHsva = { ...hsva, v: newShade.v };
                setHsva(newHsva);
                const rgba = hsvaToRgba(newHsva);
                updateColor(rgba.r, rgba.g, rgba.b, alpha);
              }}
              style={{ width: "100%", borderRadius: 4 }}
            />
          </div>
        )}
      </div>
    );
  }

  // Component with section header (no collapsible)
  export function Component(props : Props) {
    const { title = "Color" } = props;
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: "#555", marginBottom: 2 }}>{title}</div>
        <Inline {...props} />
      </div>
    );
  }
}