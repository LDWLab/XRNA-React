import React from 'react';
import { SidebarLayout } from './layout/SidebarLayout';
import {
  QuickActionsPanel,
  QuickActionsCallbacks,
} from './panels/QuickActionsPanel';
import { ToolPalettePanel, ToolPaletteCallbacks } from './panels/ToolPalettePanel';
import { InformationPanel, ElementInfo } from './panels/InformationPanel';

export type SidebarProps = QuickActionsCallbacks & ToolPaletteCallbacks & {
  fileName?: string;
  onFileNameChange?: (filename: string) => void;
  exportFormats?: Array<{ value: string; label: string }>;
  exportFormat?: string;
  onExportFormatChange?: (format: string) => void;
  onExportWithFormat?: (filename: string, format: string) => void;
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
  elementInfo?: ElementInfo;
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    onUndo,
    onRedo,
    onResetViewport,
    mode,
    onModeChange,
    constraint,
    onConstraintChange,
    onToggleBasePairEditor,
    onTogglePropertiesDrawer,
    elementInfo,
    onToggleSettingsDrawer,
    onToggleAboutDrawer,
  } = props;

  return (
    <SidebarLayout>
      {/* IO & Actions - Always visible, compact */}
      <div>
        <QuickActionsPanel
          onToggleBasePairEditor={onToggleBasePairEditor}
          onTogglePropertiesDrawer={onTogglePropertiesDrawer}
          onToggleSettingsDrawer={onToggleSettingsDrawer}
          onToggleAboutDrawer={onToggleAboutDrawer}
        />
      </div>
      {/* Tools - Smart grouped interface */}
      <div style={{ flex: 0, display: 'flex', flexDirection: 'column' }}>
        <ToolPalettePanel
          mode={mode}
          onModeChange={onModeChange}
          constraint={constraint}
          onConstraintChange={onConstraintChange}
          onUndo={onUndo}
          onRedo={onRedo}
          onResetViewport={onResetViewport}
        />
        {/* Space for info panel if needed in future */}
      </div>
    </SidebarLayout>
  );
}; 