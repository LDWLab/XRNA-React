import { useState, useEffect, useRef } from "react";
import { Lock, Unlock } from "lucide-react";
import { FullKeys } from "../../../../App";
import { Nucleotide } from "../../Nucleotide";
import Color, { BLACK } from "../../../../data_structures/Color";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import "./SequenceConnectorEditMenu.css";

const ARROW_SHAPES: Nucleotide.SequenceConnector.ArrowShape[] = ['triangle', 'chevron', 'line'];

const DASH_PRESETS = [
  { label: 'Solid', value: '' },
  { label: 'Dashed', value: '4 2' },
  { label: 'Dotted', value: '1 2' },
  { label: 'Long Dash', value: '8 4' },
  { label: 'Dash-Dot', value: '6 2 1 2' },
];

export type SequenceConnectorEditMenuProps = {
  fullKeys: FullKeys;
  connector: Nucleotide.SequenceConnector.Props;
  onUpdate: () => void;
  onDelete: () => void;
};

export function SequenceConnectorEditMenu(props: SequenceConnectorEditMenuProps) {
  const { fullKeys, connector, onUpdate, onDelete } = props;
  const { nucleotideIndex, rnaMoleculeName, rnaComplexIndex } = fullKeys;

  // Track connector identity to only sync when switching connectors
  const connectorIdRef = useRef(`${rnaComplexIndex}-${rnaMoleculeName}-${nucleotideIndex}`);
  const currentConnectorId = `${rnaComplexIndex}-${rnaMoleculeName}-${nucleotideIndex}`;

  // Local state - synced with connector prop
  const [localColor, setLocalColor] = useState<Color>(connector.color ?? BLACK);
  const [localStrokeWidth, setLocalStrokeWidth] = useState(connector.strokeWidth ?? 1.5);
  const [localCurvature, setLocalCurvature] = useState(connector.curvature ?? 0);
  const [localOpacity, setLocalOpacity] = useState(connector.opacity ?? 1);
  const [localDashArray, setLocalDashArray] = useState(connector.dashArray ?? "4 2");
  const [localShowArrow, setLocalShowArrow] = useState(connector.showDirectionArrow ?? false);
  const [localShowBreakpoints, setLocalShowBreakpoints] = useState(connector.showBreakpoints ?? true);
  const [localArrowColor, setLocalArrowColor] = useState<Color>(connector.arrowColor ?? connector.color ?? BLACK);
  const [localArrowShape, setLocalArrowShape] = useState<Nucleotide.SequenceConnector.ArrowShape>(connector.arrowShape ?? 'triangle');
  const [localArrowPosition, setLocalArrowPosition] = useState(connector.arrowPosition ?? 0.5);
  const [localArrowPositionRight, setLocalArrowPositionRight] = useState(connector.arrowPositionRight ?? 0.5);
  const [localArrowSize, setLocalArrowSize] = useState(connector.arrowSize ?? 3);
  const [localLockedBreakpoints, setLocalLockedBreakpoints] = useState<number[]>(connector.lockedBreakpoints ?? []);
  const [localBreakpointGroups, setLocalBreakpointGroups] = useState<Nucleotide.SequenceConnector.BreakpointGroup[]>(connector.breakpointGroups ?? []);
  const [selectedBreakpoints, setSelectedBreakpoints] = useState<Set<number>>(new Set());
  const [localIsORF, setLocalIsORF] = useState(connector.isORF ?? false);

  // Only sync local state when switching to a DIFFERENT connector
  useEffect(() => {
    if (connectorIdRef.current !== currentConnectorId) {
      connectorIdRef.current = currentConnectorId;
      setLocalColor(connector.color ?? BLACK);
      setLocalStrokeWidth(connector.strokeWidth ?? 1.5);
      setLocalCurvature(connector.curvature ?? 0);
      setLocalOpacity(connector.opacity ?? 1);
      setLocalDashArray(connector.dashArray ?? "4 2");
      setLocalShowArrow(connector.showDirectionArrow ?? false);
      setLocalShowBreakpoints(connector.showBreakpoints ?? true);
      setLocalArrowColor(connector.arrowColor ?? connector.color ?? BLACK);
      setLocalArrowShape(connector.arrowShape ?? 'triangle');
      setLocalArrowPosition(connector.arrowPosition ?? 0.5);
      setLocalArrowPositionRight(connector.arrowPositionRight ?? 0.5);
      setLocalArrowSize(connector.arrowSize ?? 3);
      setLocalLockedBreakpoints(connector.lockedBreakpoints ?? []);
      setLocalBreakpointGroups(connector.breakpointGroups ?? []);
      setSelectedBreakpoints(new Set());
      setLocalIsORF(connector.isORF ?? false);
    }
  }, [currentConnectorId, connector]);

  const breakpointCount = connector.breakpoints?.length ?? 0;

  const dashPreset = DASH_PRESETS.find((p) => p.value === localDashArray);
  const dashSelectValue = dashPreset ? dashPreset.value : "custom";

  const lockAllBreakpoints = () => {
    if (!connector.breakpoints || connector.breakpoints.length === 0) return;
    const all = connector.breakpoints.map((_, idx) => idx);
    setLocalLockedBreakpoints(all);
    connector.lockedBreakpoints = all;
    onUpdate();
  };

  const unlockAllBreakpoints = () => {
    setLocalLockedBreakpoints([]);
    connector.lockedBreakpoints = [];
    onUpdate();
  };

  return (
    <div className="sequence-connector-edit-menu">
      {/* Header */}
      <div className="menu-header">
        <span className="menu-title">Connector</span>
        <span className="menu-subtitle">{nucleotideIndex} → {nucleotideIndex + 1}</span>
      </div>

      {/* Type Selector */}
      <div className="type-selector">
        <button
          className={`type-btn ${!localIsORF ? 'active' : ''}`}
          onClick={() => {
            if (localIsORF) {
              setLocalIsORF(false);
              connector.isORF = false;
              onUpdate();
            }
          }}
        >
          Continuous
        </button>
        <button
          className={`type-btn ${localIsORF ? 'active' : ''}`}
          onClick={() => {
            if (!localIsORF) {
              setLocalIsORF(true);
              connector.isORF = true;
              onUpdate();
            }
          }}
        >
          ORF
        </button>
      </div>

      {/* Appearance */}
      <div className="section">
        <div className="section-title">Appearance</div>
        <div className="row">
          <label>Color</label>
          <ColorEditor.Inline
            color={localColor}
            setColorHelper={(newColor: Color) => {
              setLocalColor(newColor);
              connector.color = newColor;
              onUpdate();
            }}
          />
        </div>

        <div className="row">
          <label>Width</label>
          <input
            type="number"
            min="0.5"
            max="10"
            step="0.5"
            value={localStrokeWidth}
            onChange={(e) => {
              const num = parseFloat(e.target.value);
              if (!isNaN(num) && num > 0) {
                setLocalStrokeWidth(num);
                connector.strokeWidth = num;
                onUpdate();
              }
            }}
          />
        </div>

        <div className="row">
          <label>Style</label>
          <select
            value={dashSelectValue}
            onChange={(e) => {
              const val = e.target.value;
              if (val !== 'custom') {
                setLocalDashArray(val);
                connector.dashArray = val || undefined;
                onUpdate();
              }
            }}
          >
            {dashSelectValue === 'custom' && (
              <option value="custom" disabled>
                {`Custom (${localDashArray})`}
              </option>
            )}
            {DASH_PRESETS.map((preset) => (
              <option key={preset.label} value={preset.value}>
                {preset.label}
              </option>
            ))}
          </select>
        </div>

        <div className="row">
          <label>Opacity</label>
          <div className="range-control">
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.1"
              value={localOpacity}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                setLocalOpacity(num);
                connector.opacity = num;
                onUpdate();
              }}
            />
            <span>{Math.round(localOpacity * 100)}%</span>
          </div>
        </div>

        <div className="row">
          <label>Curve</label>
          <div className="range-control">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={localCurvature}
              onChange={(e) => {
                const num = parseFloat(e.target.value);
                setLocalCurvature(num);
                connector.curvature = num;
                onUpdate();
              }}
            />
            <span>{localCurvature === 0 ? 'Off' : localCurvature.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Arrow */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">Arrow</div>
          <label className="toggle" title="Show arrow">
            <input
              type="checkbox"
              checked={localShowArrow}
              onChange={(e) => {
                setLocalShowArrow(e.target.checked);
                connector.showDirectionArrow = e.target.checked;
                onUpdate();
              }}
              aria-label="Show arrow"
            />
            <span className="toggle-track" />
          </label>
        </div>

        {localShowArrow && (
          <>
            <div className="row">
              <label>Shape</label>
              <select
                value={localArrowShape}
                onChange={(e) => {
                  const shape = e.target.value as Nucleotide.SequenceConnector.ArrowShape;
                  setLocalArrowShape(shape);
                  connector.arrowShape = shape;
                  onUpdate();
                }}
              >
                {ARROW_SHAPES.map((shape) => (
                  <option key={shape} value={shape}>
                    {shape.charAt(0).toUpperCase() + shape.slice(1)}
                  </option>
                ))}
              </select>
            </div>

            <div className="row">
              <label>Color</label>
              <ColorEditor.Inline
                color={localArrowColor}
                setColorHelper={(newColor: Color) => {
                  setLocalArrowColor(newColor);
                  connector.arrowColor = newColor;
                  onUpdate();
                }}
              />
            </div>

            {localIsORF ? (
              /* Dual sliders for ORF mode */
              <>
                <div className="row">
                  <label>Left ←</label>
                  <div className="range-control">
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={localArrowPosition}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        setLocalArrowPosition(num);
                        connector.arrowPosition = num;
                        onUpdate();
                      }}
                    />
                    <span>{Math.round(localArrowPosition * 100)}%</span>
                  </div>
                </div>
                <div className="row">
                  <label>Right →</label>
                  <div className="range-control">
                    <input
                      type="range"
                      min="0.1"
                      max="0.9"
                      step="0.05"
                      value={localArrowPositionRight}
                      onChange={(e) => {
                        const num = parseFloat(e.target.value);
                        setLocalArrowPositionRight(num);
                        connector.arrowPositionRight = num;
                        onUpdate();
                      }}
                    />
                    <span>{Math.round(localArrowPositionRight * 100)}%</span>
                  </div>
                </div>
              </>
            ) : (
              /* Single slider for continuous mode */
              <div className="row">
                <label>Position</label>
                <div className="range-control">
                  <input
                    type="range"
                    min="0.1"
                    max="0.9"
                    step="0.05"
                    value={localArrowPosition}
                    onChange={(e) => {
                      const num = parseFloat(e.target.value);
                      setLocalArrowPosition(num);
                      connector.arrowPosition = num;
                      onUpdate();
                    }}
                  />
                  <span>{Math.round(localArrowPosition * 100)}%</span>
                </div>
              </div>
            )}

            <div className="row">
              <label>Size</label>
              <input
                type="number"
                min="1"
                max="15"
                step="0.5"
                value={localArrowSize}
                onChange={(e) => {
                  const num = parseFloat(e.target.value);
                  if (!isNaN(num) && num > 0) {
                    setLocalArrowSize(num);
                    connector.arrowSize = num;
                    onUpdate();
                  }
                }}
              />
            </div>
          </>
        )}
      </div>

      {/* Breakpoints */}
      <div className="section">
        <div className="section-header">
          <div className="section-title">
            Breakpoints <span className="count">{breakpointCount}</span>
          </div>
          <label className="toggle" title="Show breakpoints">
            <input
              type="checkbox"
              checked={localShowBreakpoints}
              onChange={(e) => {
                setLocalShowBreakpoints(e.target.checked);
                connector.showBreakpoints = e.target.checked;
                onUpdate();
              }}
              aria-label="Show breakpoints"
            />
            <span className="toggle-track" />
          </label>
        </div>

        {breakpointCount > 0 && (
          <>
            <div className="breakpoint-tools">
              <button
                type="button"
                className="bp-tool-btn"
                onClick={lockAllBreakpoints}
                disabled={localLockedBreakpoints.length === breakpointCount}
                title="Lock all breakpoints"
              >
                Lock all
              </button>
              <button
                type="button"
                className="bp-tool-btn"
                onClick={unlockAllBreakpoints}
                disabled={localLockedBreakpoints.length === 0}
                title="Unlock all breakpoints"
              >
                Unlock all
              </button>
            </div>
            <div className="breakpoint-list">
              {connector.breakpoints.map((bp, idx) => {
                const isLocked = localLockedBreakpoints.includes(idx);
                return (
                  <div key={idx} className={`breakpoint-item ${isLocked ? 'locked' : ''}`}>
                    <span className="bp-num">{idx + 1}</span>
                    <span className="bp-pos">({bp.x.toFixed(0)}, {bp.y.toFixed(0)})</span>
                    <button
                      type="button"
                      className={`bp-lock ${isLocked ? 'active' : ''}`}
                      onClick={() => {
                        let newLocked: number[];
                        if (isLocked) {
                          newLocked = localLockedBreakpoints.filter(i => i !== idx);
                        } else {
                          newLocked = [...localLockedBreakpoints, idx];
                        }
                        setLocalLockedBreakpoints(newLocked);
                        connector.lockedBreakpoints = newLocked;
                        onUpdate();
                      }}
                      title={isLocked ? 'Unlock' : 'Lock'}
                      aria-label={isLocked ? 'Unlock breakpoint' : 'Lock breakpoint'}
                    >
                      {isLocked ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}

        <p className="hint">Ctrl+click line to add · Ctrl+click point to remove</p>
      </div>

      {/* Delete */}
      <button className="delete-btn" onClick={onDelete}>
        Delete Connector
      </button>
    </div>
  );
}
