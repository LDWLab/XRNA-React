import { useContext, useEffect, useRef, useState } from "react";
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
    const isDraggingRef = useRef(false);
    const localChangeRef = useRef(false);

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
      // Mark that we made a local change to prevent useEffect from resetting state
      localChangeRef.current = true;
      _setColorHelper({ red: r, green: g, blue: b, alpha: a });
    }

    function handleMouseDown() {
      isDraggingRef.current = true;
    }

    function handleMouseUp() {
      isDraggingRef.current = false;
      setPushedColorStateFlag(false);
    }

    useEffect(function() {
      // Don't sync from prop while user is dragging a slider or just made a local change
      if (isDraggingRef.current || localChangeRef.current) {
        localChangeRef.current = false;
        return;
      }
      
      const localColor = color ?? BLACK;
      setRed(localColor.red);
      setGreen(localColor.green);
      setBlue(localColor.blue);
      setAlpha(localColor.alpha ?? DEFAULT_ALPHA);
      setHexadecimal(rgbToHex(localColor.red, localColor.green, localColor.blue));
      setHsva(rgbaToHsva({ r: localColor.red, g: localColor.green, b: localColor.blue, a: (localColor.alpha ?? DEFAULT_ALPHA) / 255 }));
    }, [color]);

    const sliderStyle = {
      width: "var(--color-editor-slider-width, 60px)",
      height: "var(--color-editor-slider-height, 4px)",
      cursor: "pointer",
    };
    const numInputStyle = {
      width: "var(--color-editor-number-width, 36px)",
      textAlign: "center" as const,
      fontSize: "var(--color-editor-number-font-size, 10px)",
      padding: "var(--color-editor-number-padding, 2px 4px)",
      border: "1px solid #ddd",
      borderRadius: 3,
    };

    const bgColor = `rgba(${red}, ${green}, ${blue}, ${alpha / 255})`;

    return (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "var(--color-editor-stack-gap, 8px)",
        }}
      >
        {children}
        <div
          style={{
            display: "flex",
            gap: "var(--color-editor-row-gap, 10px)",
            alignItems: "flex-start",
          }}
        >
          {/* Color preview with hex below */}
          <div style={{ display: "flex", flexDirection: "column", gap: 4, alignItems: "center" }}>
            <div
              onClick={() => setShowPicker(!showPicker)}
              style={{
                width: "var(--color-editor-preview-size, 48px)",
                height: "var(--color-editor-preview-size, 48px)",
                borderRadius: "var(--color-editor-preview-radius, 6px)",
                backgroundColor: bgColor,
                border: "1px solid #ccc", cursor: "pointer",
                boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
              }}
              title="Click for color wheel"
            />
            {/* Hex below preview */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              <span style={{ fontSize: "var(--color-editor-hex-prefix-font-size, 9px)", color: "#666" }}>#</span>
              <input
                type="text"
                value={hexadecimal.replace('#', '')}
                onChange={(e) => {
                  const newHex = '#' + e.target.value;
                  setHexadecimal(newHex);
                  const rgb = hexToRgb(newHex);
                  if (rgb) updateColor(rgb.r, rgb.g, rgb.b, alpha);
                }}
                style={{
                  width: "var(--color-editor-hex-width, 50px)",
                  fontFamily: "monospace",
                  fontSize: "var(--color-editor-hex-font-size, 10px)",
                  padding: "var(--color-editor-hex-padding, 3px 4px)",
                  border: "1px solid #ddd",
                  borderRadius: 3,
                  textAlign: "center",
                }}
              />
            </div>
          </div>
          {/* RGB sliders */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: "var(--color-editor-channel-stack-gap, 3px)",
              flex: 1,
            }}
          >
            {/* Red */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--color-editor-channel-row-gap, 3px)" }}>
              <span
                style={{
                  width: "var(--color-editor-channel-label-width, 12px)",
                  fontSize: "var(--color-editor-channel-label-font-size, 9px)",
                  fontWeight: 600,
                  color: "#e53935",
                }}
              >
                R
              </span>
              <input type="range" min={0} max={255} value={red}
                onChange={(e) => updateColor(parseInt(e.target.value), green, blue, alpha)}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ ...sliderStyle, accentColor: "#e53935", flex: 1 }}
              />
              <input type="number" min={0} max={255} value={red}
                onChange={(e) => updateColor(parseInt(e.target.value) || 0, green, blue, alpha)}
                style={numInputStyle}
              />
            </div>
            {/* Green */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--color-editor-channel-row-gap, 3px)" }}>
              <span
                style={{
                  width: "var(--color-editor-channel-label-width, 12px)",
                  fontSize: "var(--color-editor-channel-label-font-size, 9px)",
                  fontWeight: 600,
                  color: "#43a047",
                }}
              >
                G
              </span>
              <input type="range" min={0} max={255} value={green}
                onChange={(e) => updateColor(red, parseInt(e.target.value), blue, alpha)}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ ...sliderStyle, accentColor: "#43a047", flex: 1 }}
              />
              <input type="number" min={0} max={255} value={green}
                onChange={(e) => updateColor(red, parseInt(e.target.value) || 0, blue, alpha)}
                style={numInputStyle}
              />
            </div>
            {/* Blue */}
            <div style={{ display: "flex", alignItems: "center", gap: "var(--color-editor-channel-row-gap, 3px)" }}>
              <span
                style={{
                  width: "var(--color-editor-channel-label-width, 12px)",
                  fontSize: "var(--color-editor-channel-label-font-size, 9px)",
                  fontWeight: 600,
                  color: "#1e88e5",
                }}
              >
                B
              </span>
              <input type="range" min={0} max={255} value={blue}
                onChange={(e) => updateColor(red, green, parseInt(e.target.value), alpha)}
                onMouseDown={handleMouseDown}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
                style={{ ...sliderStyle, accentColor: "#1e88e5", flex: 1 }}
              />
              <input type="number" min={0} max={255} value={blue}
                onChange={(e) => updateColor(red, green, parseInt(e.target.value) || 0, alpha)}
                style={numInputStyle}
              />
            </div>
          </div>
        </div>
        {/* Alpha slider - full width below */}
        <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 0" }}>
          <span style={{ fontSize: 10, fontWeight: 600, color: "#666", minWidth: 40 }}>Alpha</span>
          <input
            type="range"
            min={0}
            max={255}
            value={alpha}
            onChange={(e) => updateColor(red, green, blue, parseInt(e.target.value))}
            onMouseDown={handleMouseDown}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            style={{ flex: 1, height: "var(--color-editor-alpha-slider-height, 6px)", cursor: "pointer", accentColor: "#666" }}
          />
          <span style={{ fontSize: 10, color: "#888", minWidth: 32, textAlign: "right" }}>{Math.round(alpha / 255 * 100)}%</span>
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