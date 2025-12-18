import { useState, useEffect, useRef } from "react";
import { FullKeys } from "../../../../App";
import { Nucleotide } from "../../Nucleotide";
import Color, { BLACK } from "../../../../data_structures/Color";
import { ColorEditor } from "../../../generic/editors/ColorEditor";
import "./SequenceConnectorEditMenu.css";

const ARROW_SHAPES: Nucleotide.SequenceConnector.ArrowShape[] = ['triangle', 'chevron', 'line', 'diamond'];

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
};

export function SequenceConnectorEditMenu(props: SequenceConnectorEditMenuProps) {
  const { fullKeys, connector, onUpdate } = props;
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
  const [localArrowSize, setLocalArrowSize] = useState(connector.arrowSize ?? 3);
  const [localLockedBreakpoints, setLocalLockedBreakpoints] = useState<number[]>(connector.lockedBreakpoints ?? []);
  const [localBreakpointGroups, setLocalBreakpointGroups] = useState<Nucleotide.SequenceConnector.BreakpointGroup[]>(connector.breakpointGroups ?? []);
  const [selectedBreakpoints, setSelectedBreakpoints] = useState<Set<number>>(new Set());

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
      setLocalArrowSize(connector.arrowSize ?? 3);
      setLocalLockedBreakpoints(connector.lockedBreakpoints ?? []);
      setLocalBreakpointGroups(connector.breakpointGroups ?? []);
      setSelectedBreakpoints(new Set());
    }
  }, [currentConnectorId, connector]);

  const breakpointCount = connector.breakpoints?.length ?? 0;

  return (
    <div className="sequence-connector-edit-menu">
      <div className="menu-header">
        <h3>Sequence Connector</h3>
        <span className="connector-badge">
          {nucleotideIndex} → {nucleotideIndex + 1}
        </span>
      </div>
      
      {/* Line Style Section */}
      <div className="section-group">
        <div className="section-title">Line Style</div>
        
        <div className="edit-row">
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

        {/* Width and Pattern side by side */}
        <div className="edit-row-pair">
          <div className="edit-row compact">
            <label>Width</label>
            <div className="input-with-unit">
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
              <span className="unit">px</span>
            </div>
          </div>
          <div className="edit-row compact">
            <label>Pattern</label>
            <select
              value={DASH_PRESETS.find(p => p.value === localDashArray)?.value ?? 'custom'}
              onChange={(e) => {
                const val = e.target.value;
                if (val !== 'custom') {
                  setLocalDashArray(val);
                  connector.dashArray = val || undefined;
                  onUpdate();
                }
              }}
            >
              {DASH_PRESETS.map((preset) => (
                <option key={preset.label} value={preset.value}>
                  {preset.label}
                </option>
              ))}
              {!DASH_PRESETS.find(p => p.value === localDashArray) && (
                <option value="custom">Custom</option>
              )}
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
                connector.opacity = num;
                onUpdate();
              }}
            />
            <span className="value">{Math.round(localOpacity * 100)}%</span>
          </div>
        </div>

        <div className="edit-row">
          <label>Curvature</label>
          <div className="slider-row">
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
            <span className="value">{localCurvature === 0 ? 'Straight' : localCurvature.toFixed(1)}</span>
          </div>
        </div>
      </div>

      {/* Arrow Section - not indented */}
      <div className="section-group">
        <div className="section-title">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={localShowArrow}
              onChange={(e) => {
                setLocalShowArrow(e.target.checked);
                connector.showDirectionArrow = e.target.checked;
                onUpdate();
              }}
            />
            Direction Arrow
          </label>
        </div>

        {localShowArrow && (
          <>
            <div className="edit-row">
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

            <div className="edit-row">
              <label>Color</label>
              <div className="color-with-action">
                <ColorEditor.Inline
                  color={localArrowColor}
                  setColorHelper={(newColor: Color) => {
                    setLocalArrowColor(newColor);
                    connector.arrowColor = newColor;
                    onUpdate();
                  }}
                />
                <button
                  className="use-line-color-btn"
                  onClick={() => {
                    setLocalArrowColor(localColor);
                    connector.arrowColor = localColor;
                    onUpdate();
                  }}
                  title="Use line color for arrow"
                >
                  = Line
                </button>
              </div>
            </div>

            <div className="edit-row-pair">
              <div className="edit-row compact">
                <label>Position</label>
                <div className="slider-row">
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
                  <span className="value">{Math.round(localArrowPosition * 100)}%</span>
                </div>
              </div>
              <div className="edit-row compact">
                <label>Size</label>
                <div className="input-with-unit">
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
                  <span className="unit">px</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Breakpoints Section */}
      <div className="section-group">
        <div className="section-title">
          <label className="toggle-label">
            <input
              type="checkbox"
              checked={localShowBreakpoints}
              onChange={(e) => {
                setLocalShowBreakpoints(e.target.checked);
                connector.showBreakpoints = e.target.checked;
                onUpdate();
              }}
            />
            Breakpoints
            {breakpointCount > 0 && <span className="count-badge">{breakpointCount}</span>}
          </label>
        </div>
        
        {breakpointCount > 0 && (
          <>
            <div className="breakpoint-list">
              {connector.breakpoints.map((bp, idx) => {
                const isLocked = localLockedBreakpoints.includes(idx);
                const group = localBreakpointGroups.find(g => g.indices.includes(idx));
                const isSelected = selectedBreakpoints.has(idx);
                return (
                  <div key={idx} className={`breakpoint-item ${isLocked ? 'locked' : ''} ${group ? 'grouped' : ''} ${isSelected ? 'selected' : ''}`}>
                    <input
                      type="checkbox"
                      className="bp-select"
                      checked={isSelected}
                      onChange={(e) => {
                        const newSelected = new Set(selectedBreakpoints);
                        if (e.target.checked) {
                          newSelected.add(idx);
                        } else {
                          newSelected.delete(idx);
                        }
                        setSelectedBreakpoints(newSelected);
                      }}
                      title="Select for grouping"
                    />
                    <span className="bp-index">#{idx + 1}</span>
                    <span className="bp-coords">({bp.x.toFixed(1)}, {bp.y.toFixed(1)})</span>
                    {group && <span className="bp-group-tag" title={`Group: ${group.name}`}>{group.name}</span>}
                    <button
                      className={`bp-lock-btn ${isLocked ? 'active' : ''}`}
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
                      title={isLocked ? 'Unlock breakpoint' : 'Lock breakpoint'}
                    >
                      <span className={`lock-icon ${isLocked ? 'locked' : ''}`} />
                    </button>
                  </div>
                );
              })}
            </div>
            
            {/* Selection actions */}
            {selectedBreakpoints.size > 0 && (
              <div className="selection-actions">
                <span className="selection-info">{selectedBreakpoints.size} selected</span>
                <button
                  className="action-btn primary"
                  onClick={() => {
                    // Create group from selected breakpoints
                    const selectedIndices = Array.from(selectedBreakpoints).sort((a, b) => a - b);
                    // Remove selected indices from existing groups
                    const updatedGroups = localBreakpointGroups.map(g => ({
                      ...g,
                      indices: g.indices.filter(i => !selectedBreakpoints.has(i))
                    })).filter(g => g.indices.length > 0);
                    
                    const newGroup: Nucleotide.SequenceConnector.BreakpointGroup = {
                      id: `group-${Date.now()}`,
                      name: `G${updatedGroups.length + 1}`,
                      indices: selectedIndices,
                      locked: false
                    };
                    const newGroups = [...updatedGroups, newGroup];
                    setLocalBreakpointGroups(newGroups);
                    connector.breakpointGroups = newGroups;
                    setSelectedBreakpoints(new Set());
                    onUpdate();
                  }}
                  title="Group selected breakpoints"
                >
                  <span className="icon-link" /> Group
                </button>
                <button
                  className="action-btn"
                  onClick={() => {
                    // Remove selected breakpoints from their groups
                    const updatedGroups = localBreakpointGroups.map(g => ({
                      ...g,
                      indices: g.indices.filter(i => !selectedBreakpoints.has(i))
                    })).filter(g => g.indices.length > 0);
                    setLocalBreakpointGroups(updatedGroups);
                    connector.breakpointGroups = updatedGroups;
                    setSelectedBreakpoints(new Set());
                    onUpdate();
                  }}
                  title="Remove selected from groups"
                >
                  <span className="icon-unlink" /> Ungroup
                </button>
                <button
                  className="action-btn subtle"
                  onClick={() => setSelectedBreakpoints(new Set())}
                  title="Clear selection"
                >
                  <span className="icon-x" /> Clear
                </button>
              </div>
            )}
            
            <div className="breakpoint-actions">
              <button
                className="action-btn"
                onClick={() => {
                  // Select all breakpoints
                  setSelectedBreakpoints(new Set(connector.breakpoints.map((_, i) => i)));
                }}
                title="Select all breakpoints"
              >
                <span className="icon-check-square" /> Select All
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  // Lock all breakpoints
                  const allIndices = connector.breakpoints.map((_, i) => i);
                  setLocalLockedBreakpoints(allIndices);
                  connector.lockedBreakpoints = allIndices;
                  onUpdate();
                }}
                title="Lock all breakpoints"
              >
                <span className="icon-lock" /> Lock All
              </button>
              <button
                className="action-btn"
                onClick={() => {
                  // Unlock all breakpoints
                  setLocalLockedBreakpoints([]);
                  connector.lockedBreakpoints = [];
                  onUpdate();
                }}
                title="Unlock all breakpoints"
              >
                <span className="icon-unlock" /> Unlock All
              </button>
            </div>
          </>
        )}
        
        <p className="helper-text">
          <strong>Ctrl+click</strong> on line to add • <strong>Drag</strong> to move • <strong>Ctrl+click</strong> point to delete
        </p>
      </div>
    </div>
  );
}
