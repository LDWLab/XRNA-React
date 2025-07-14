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
  elementInfo?: ElementInfo;
};

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    onOpenFile,
    onSave,
    onExportWithFormat,
    onUndo,
    onRedo,
    onResetViewport,
    mode,
    onModeChange,
    constraint,
    onConstraintChange,
    fileName,
    onFileNameChange,
    exportFormats,
    exportFormat,
    onExportFormatChange,
    onToggleBasePairEditor,
    onTogglePropertiesDrawer,
    elementInfo,
  } = props;

  return (
    <SidebarLayout>
      {/* IO & Actions - Always visible, compact */}
      <div>
        <QuickActionsPanel
          onOpenFile={onOpenFile}
          onSave={onSave}
          onExportWithFormat={onExportWithFormat}
          fileName={fileName}
          onFileNameChange={onFileNameChange}
          exportFormats={exportFormats}
          exportFormat={exportFormat}
          onExportFormatChange={onExportFormatChange}
          onToggleBasePairEditor={onToggleBasePairEditor}
          onTogglePropertiesDrawer={onTogglePropertiesDrawer}
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
        {/* <InformationPanel elementInfo={elementInfo} /> */}
      </div>
    </SidebarLayout>
  );
}; 