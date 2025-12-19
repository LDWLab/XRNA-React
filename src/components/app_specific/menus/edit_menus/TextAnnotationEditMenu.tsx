import { useState, useEffect, useRef } from "react";
import { TextAnnotation } from "../../TextAnnotation";
import Color, { BLACK } from "../../../../data_structures/Color";
import Font from "../../../../data_structures/Font";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import "./TextAnnotationEditMenu.css";

export type TextAnnotationEditMenuProps = {
  annotation: TextAnnotation.Props;
  onUpdate: () => void;
  onDelete: () => void;
};

export function TextAnnotationEditMenu(props: TextAnnotationEditMenuProps) {
  const { annotation, onUpdate, onDelete } = props;

  const annotationIdRef = useRef(annotation.id);

  // Local state
  const [localContent, setLocalContent] = useState(annotation.content);
  const [localX, setLocalX] = useState(annotation.x);
  const [localY, setLocalY] = useState(annotation.y);
  const [localColor, setLocalColor] = useState<Color>(annotation.color ?? BLACK);
  const [localFontSize, setLocalFontSize] = useState(annotation.font?.size ?? Font.DEFAULT.size);
  const [localFontFamily, setLocalFontFamily] = useState(annotation.font?.family ?? Font.DEFAULT.family);
  const [localFontWeight, setLocalFontWeight] = useState(annotation.font?.weight ?? Font.DEFAULT.weight);
  const [localFontStyle, setLocalFontStyle] = useState(annotation.font?.style ?? Font.DEFAULT.style);
  const [localOpacity, setLocalOpacity] = useState(annotation.opacity ?? 1);
  const [localRotation, setLocalRotation] = useState(annotation.rotation ?? 0);
  const [localHasBackground, setLocalHasBackground] = useState(annotation.backgroundColor !== undefined);
  const [localBackgroundColor, setLocalBackgroundColor] = useState<Color>(annotation.backgroundColor ?? { red: 255, green: 255, blue: 255, alpha: 1 });
  const [localHasBorder, setLocalHasBorder] = useState(annotation.borderColor !== undefined);
  const [localBorderColor, setLocalBorderColor] = useState<Color>(annotation.borderColor ?? BLACK);
  const [localPadding, setLocalPadding] = useState(annotation.padding ?? 4);
  const [localHasStroke, setLocalHasStroke] = useState(annotation.strokeColor !== undefined);
  const [localStrokeColor, setLocalStrokeColor] = useState<Color>(annotation.strokeColor ?? BLACK);
  const [localStrokeWidth, setLocalStrokeWidth] = useState(annotation.strokeWidth ?? 1);
  const [localStrokeOpacity, setLocalStrokeOpacity] = useState(annotation.strokeOpacity ?? 1);

  // Sync when switching annotations
  useEffect(() => {
    if (annotationIdRef.current !== annotation.id) {
      annotationIdRef.current = annotation.id;
      setLocalContent(annotation.content);
      setLocalX(annotation.x);
      setLocalY(annotation.y);
      setLocalColor(annotation.color ?? BLACK);
      setLocalFontSize(annotation.font?.size ?? Font.DEFAULT.size);
      setLocalFontFamily(annotation.font?.family ?? Font.DEFAULT.family);
      setLocalFontWeight(annotation.font?.weight ?? Font.DEFAULT.weight);
      setLocalFontStyle(annotation.font?.style ?? Font.DEFAULT.style);
      setLocalOpacity(annotation.opacity ?? 1);
      setLocalRotation(annotation.rotation ?? 0);
      setLocalHasBackground(annotation.backgroundColor !== undefined);
      setLocalBackgroundColor(annotation.backgroundColor ?? { red: 255, green: 255, blue: 255, alpha: 1 });
      setLocalHasBorder(annotation.borderColor !== undefined);
      setLocalBorderColor(annotation.borderColor ?? BLACK);
      setLocalPadding(annotation.padding ?? 4);
      setLocalHasStroke(annotation.strokeColor !== undefined);
      setLocalStrokeColor(annotation.strokeColor ?? BLACK);
      setLocalStrokeWidth(annotation.strokeWidth ?? 1);
      setLocalStrokeOpacity(annotation.strokeOpacity ?? 1);
    }
  }, [annotation.id, annotation]);

  const updateFont = () => {
    annotation.font = {
      size: localFontSize,
      family: localFontFamily,
      weight: localFontWeight,
      style: localFontStyle
    };
    onUpdate();
  };

  return (
    <div className="text-annotation-edit-menu">
      <div className="menu-header">
        <h3>Text Annotation</h3>
        <button
          className="delete-btn"
          onClick={onDelete}
          title="Delete annotation"
        >
          <span className="icon-trash" />
        </button>
      </div>

      {/* Content Section */}
      <div className="section-group">
        <div className="section-title">Content</div>
        <div className="edit-row">
          <textarea
            className="content-input"
            value={localContent}
            onChange={(e) => {
              setLocalContent(e.target.value);
              annotation.content = e.target.value;
              onUpdate();
            }}
            rows={3}
            placeholder="Enter text..."
          />
        </div>
      </div>

      {/* Position Section */}
      <div className="section-group">
        <div className="section-title">Position</div>
        <div className="edit-row-pair">
          <div className="edit-row compact">
            <label>X</label>
            <input
              type="number"
              value={localX.toFixed(1)}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  setLocalX(num);
                  annotation.x = num;
                  onUpdate();
                }
              }}
            />
          </div>
          <div className="edit-row compact">
            <label>Y</label>
            <input
              type="number"
              value={localY.toFixed(1)}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                if (!isNaN(num)) {
                  setLocalY(num);
                  annotation.y = num;
                  onUpdate();
                }
              }}
            />
          </div>
        </div>
        <div className="edit-row">
          <label>Rotation</label>
          <div className="slider-row">
            <input
              type="range"
              min="-180"
              max="180"
              step="5"
              value={localRotation}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                setLocalRotation(num);
                annotation.rotation = num;
                onUpdate();
              }}
            />
            <span className="value">{localRotation}°</span>
          </div>
        </div>
      </div>

      {/* Text Style Section */}
      <div className="section-group">
        <div className="section-title">Text Style</div>
        <div className="edit-row">
          <label>Color</label>
          <ColorEditor.Inline
            color={localColor}
            setColorHelper={(newColor: Color) => {
              setLocalColor(newColor);
              annotation.color = newColor;
              onUpdate();
            }}
          />
        </div>
        <div className="edit-row-pair">
          <div className="edit-row compact">
            <label>Size</label>
            <div className="input-with-unit">
              <input
                type="number"
                min="6"
                max="72"
                step="1"
                value={localFontSize}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num) && num > 0) {
                    setLocalFontSize(num);
                    updateFont();
                  }
                }}
              />
              <span className="unit">px</span>
            </div>
          </div>
          <div className="edit-row compact">
            <label>Family</label>
            <select
              value={localFontFamily}
              onChange={(e) => {
                setLocalFontFamily(e.target.value);
                annotation.font = {
                  ...annotation.font,
                  size: localFontSize,
                  family: e.target.value,
                  weight: localFontWeight,
                  style: localFontStyle
                };
                onUpdate();
              }}
            >
              <option value="Arial">Arial</option>
              <option value="Helvetica">Helvetica</option>
              <option value="Times New Roman">Times New Roman</option>
              <option value="Courier New">Courier New</option>
              <option value="Georgia">Georgia</option>
              <option value="Verdana">Verdana</option>
            </select>
          </div>
        </div>
        <div className="edit-row-pair">
          <div className="edit-row compact">
            <label>Weight</label>
            <select
              value={localFontWeight}
              onChange={(e) => {
                setLocalFontWeight(e.target.value);
                annotation.font = {
                  ...annotation.font,
                  size: localFontSize,
                  family: localFontFamily,
                  weight: e.target.value,
                  style: localFontStyle
                };
                onUpdate();
              }}
            >
              <option value="normal">Normal</option>
              <option value="bold">Bold</option>
              <option value="lighter">Light</option>
            </select>
          </div>
          <div className="edit-row compact">
            <label>Style</label>
            <select
              value={localFontStyle}
              onChange={(e) => {
                setLocalFontStyle(e.target.value);
                annotation.font = {
                  ...annotation.font,
                  size: localFontSize,
                  family: localFontFamily,
                  weight: localFontWeight,
                  style: e.target.value
                };
                onUpdate();
              }}
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </select>
          </div>
        </div>
        <div className="edit-row">
          <label>Opacity</label>
          <div className="slider-row">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={localOpacity}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                setLocalOpacity(num);
                annotation.opacity = num;
                onUpdate();
              }}
            />
            <span className="value">{Math.round(localOpacity * 100)}%</span>
          </div>
        </div>
      </div>

      {/* Background Section */}
      <div className="section-group">
        <div className="section-header">
          <div className="section-title">Background</div>
          <label className="toggle" title="Enable background">
            <input
              type="checkbox"
              checked={localHasBackground}
              onChange={(e) => {
                setLocalHasBackground(e.target.checked);
                if (e.target.checked) {
                  annotation.backgroundColor = localBackgroundColor;
                } else {
                  delete annotation.backgroundColor;
                }
                onUpdate();
              }}
              aria-label="Enable background"
            />
            <span className="toggle-track" />
          </label>
        </div>
        {localHasBackground && (
          <>
            <div className="edit-row">
              <label>Color</label>
              <ColorEditor.Inline
                color={localBackgroundColor}
                setColorHelper={(newColor: Color) => {
                  setLocalBackgroundColor(newColor);
                  annotation.backgroundColor = newColor;
                  onUpdate();
                }}
              />
            </div>
            <div className="edit-row">
              <label>Padding</label>
              <div className="input-with-unit">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="1"
                  value={localPadding}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    if (!isNaN(num) && num >= 0) {
                      setLocalPadding(num);
                      annotation.padding = num;
                      onUpdate();
                    }
                  }}
                />
                <span className="unit">px</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Text Outline/Stroke Section */}
      <div className="section-group">
        <div className="section-header">
          <div className="section-title">Text Outline</div>
          <label className="toggle" title="Enable text outline">
            <input
              type="checkbox"
              checked={localHasStroke}
              onChange={(e) => {
                setLocalHasStroke(e.target.checked);
                if (e.target.checked) {
                  annotation.strokeColor = localStrokeColor;
                  annotation.strokeWidth = localStrokeWidth;
                  annotation.strokeOpacity = localStrokeOpacity;
                } else {
                  delete annotation.strokeColor;
                  delete annotation.strokeWidth;
                  delete annotation.strokeOpacity;
                }
                onUpdate();
              }}
              aria-label="Enable text outline"
            />
            <span className="toggle-track" />
          </label>
        </div>
        {localHasStroke && (
          <>
            <div className="edit-row">
              <label>Color</label>
              <ColorEditor.Inline
                color={localStrokeColor}
                setColorHelper={(newColor: Color) => {
                  setLocalStrokeColor(newColor);
                  annotation.strokeColor = newColor;
                  onUpdate();
                }}
              />
            </div>
            <div className="edit-row">
              <label>Width</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="0.5"
                  max="5"
                  step="0.5"
                  value={localStrokeWidth}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    setLocalStrokeWidth(num);
                    annotation.strokeWidth = num;
                    onUpdate();
                  }}
                />
                <span className="value">{localStrokeWidth}px</span>
              </div>
            </div>
            <div className="edit-row">
              <label>Opacity</label>
              <div className="slider-row">
                <input
                  type="range"
                  min="0.1"
                  max="1"
                  step="0.1"
                  value={localStrokeOpacity}
                  onChange={(e) => {
                    const num = parseFloat(e.target.value);
                    setLocalStrokeOpacity(num);
                    annotation.strokeOpacity = num;
                    onUpdate();
                  }}
                />
                <span className="value">{Math.round(localStrokeOpacity * 100)}%</span>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Border Section */}
      <div className="section-group">
        <div className="section-header">
          <div className="section-title">Border</div>
          <label className="toggle" title="Enable border">
            <input
              type="checkbox"
              checked={localHasBorder}
              onChange={(e) => {
                setLocalHasBorder(e.target.checked);
                if (e.target.checked) {
                  annotation.borderColor = localBorderColor;
                } else {
                  delete annotation.borderColor;
                }
                onUpdate();
              }}
              aria-label="Enable border"
            />
            <span className="toggle-track" />
          </label>
        </div>
        {localHasBorder && (
          <div className="edit-row">
            <label>Color</label>
            <ColorEditor.Inline
              color={localBorderColor}
              setColorHelper={(newColor: Color) => {
                setLocalBorderColor(newColor);
                annotation.borderColor = newColor;
                onUpdate();
              }}
            />
          </div>
        )}
      </div>

      <p className="helper-text">
        <strong>Drag</strong> to move • <strong>Ctrl+click</strong> to delete
      </p>
    </div>
  );
}
