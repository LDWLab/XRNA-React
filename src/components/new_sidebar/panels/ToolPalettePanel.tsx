import { PanelContainer } from '../layout/PanelContainer';
import { Tab, tabs } from '../../../app_data/Tab';
import { InteractionConstraint } from '../../../ui/InteractionConstraint/InteractionConstraints';

export interface ToolPaletteCallbacks {
  mode: Tab;
  onModeChange?: (tab: Tab) => void;
  constraint?: InteractionConstraint.Enum;
  onConstraintChange?: (constraint: InteractionConstraint.Enum) => void;
}

export const ToolPalettePanel: React.FC<ToolPaletteCallbacks> = ({
  mode,
  onModeChange,
  constraint,
  onConstraintChange,
}) => {
  return (
    <PanelContainer title="Tool Palette">
      <div style={{ marginBottom: 8 }}>
        <b>Mode:</b>
        {tabs.map((tab) => (
          <button
            key={tab}
            style={{
              marginLeft: 4,
              fontWeight: mode === tab ? 'bold' : undefined,
            }}
            onClick={() => onModeChange?.(tab)}
          >
            {tab}
          </button>
        ))}
      </div>
      <div>
        <b>Constraint:</b>&nbsp;
        <select
          value={constraint}
          onChange={(e) =>
            onConstraintChange?.(e.target.value as InteractionConstraint.Enum)
          }
        >
          <option value={undefined as any}>Select constraint</option>
          {InteractionConstraint.all.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>
    </PanelContainer>
  );
}; 