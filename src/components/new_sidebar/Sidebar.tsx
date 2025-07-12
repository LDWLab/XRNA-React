import React from 'react';
import { SidebarLayout } from './layout/SidebarLayout';
import {
  QuickActionsPanel,
  QuickActionsCallbacks,
} from './panels/QuickActionsPanel';
import { ToolPalettePanel, ToolPaletteCallbacks } from './panels/ToolPalettePanel';
import { BasePairEditorPanel, BasePairEditorProps } from './panels/BasePairEditorPanel';
import { PropertiesPanel } from './panels/PropertiesPanel';

export type SidebarProps = QuickActionsCallbacks & ToolPaletteCallbacks & BasePairEditorProps;

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    onOpenFile,
    onSave,
    onExport,
    onUndo,
    onRedo,
    onResetViewport,
    mode,
    onModeChange,
    constraint,
    onConstraintChange,
    initialBasePairs,
    rnaComplexProps,
    approveBasePairs,
  } = props;

  return (
    <SidebarLayout>
      <QuickActionsPanel
        onOpenFile={onOpenFile}
        onSave={onSave}
        onExport={onExport}
        onUndo={onUndo}
        onRedo={onRedo}
        onResetViewport={onResetViewport}
      />
      <ToolPalettePanel
        mode={mode}
        onModeChange={onModeChange}
        constraint={constraint}
        onConstraintChange={onConstraintChange}
      />
      <BasePairEditorPanel
        rnaComplexProps={rnaComplexProps}
        approveBasePairs={approveBasePairs}
        initialBasePairs={initialBasePairs}
      />
      <PropertiesPanel />
    </SidebarLayout>
  );
}; 