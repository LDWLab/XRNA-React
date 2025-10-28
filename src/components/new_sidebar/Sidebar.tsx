import React from 'react';
import { SidebarLayout } from './layout/SidebarLayout';
import { SelectionPanel } from './panels/SelectionPanel';
import { ToolsPanel } from './panels/ToolsPanel';
import { UtilitiesPanel } from './panels/UtilitiesPanel';
import { InteractionConstraint } from '../../ui/InteractionConstraint/InteractionConstraints';
import { Tab } from '../../app_data/Tab';

export interface SidebarProps {
  constraint?: InteractionConstraint.Enum;
  onConstraintChange?: (constraint: InteractionConstraint.Enum) => void;
  mode?: Tab;
  onModeChange?: (mode: Tab) => void;
  onUndo?: () => void;
  onRedo?: () => void;
  canUndo : boolean;
  canRedo : boolean;
  onResetViewport?: () => void;
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
  onOpenDocs?: () => void;
  onLoadExample?: () => void;
  undoStack?: Array<{ data: any; dataType: string }>;
  redoStack?: Array<{ data: any; dataType: string }>;
  onJumpToHistory?: (index: number) => void;
  onResetToLastCheckpoint?: () => void;
  onFormatModeClick?: () => void;
  onFreezeSelected?: () => void;
  onUnfreezeSelected?: () => void;
  onUnfreezeAll?: () => void;
  hasFrozenNucleotides?: boolean;
  hasSelectedNucleotides?: boolean;
}

export const Sidebar: React.FC<SidebarProps> = (props) => {
  const {
    constraint, onConstraintChange, mode, onModeChange,
    onUndo, onRedo, canUndo, canRedo, onResetViewport,
    onToggleBasePairEditor, onTogglePropertiesDrawer,
    onToggleSettingsDrawer, onToggleAboutDrawer,
    onOpenDocs,
    onLoadExample,
    undoStack, redoStack, onJumpToHistory, onResetToLastCheckpoint, onFormatModeClick,
    onFreezeSelected, onUnfreezeSelected, onUnfreezeAll,
    hasFrozenNucleotides, hasSelectedNucleotides,
  } = props;

  return (
    <SidebarLayout>
      <SelectionPanel constraint={constraint} onConstraintChange={onConstraintChange} />
      <ToolsPanel mode={mode || Tab.EDIT} 
        onModeChange={onModeChange} onUndo={onUndo} onRedo={onRedo} canUndo = {canUndo} canRedo = {canRedo} onResetViewport={onResetViewport} undoStack={undoStack}
        redoStack={redoStack}
        onJumpToHistory={onJumpToHistory}
        onResetToLastCheckpoint={onResetToLastCheckpoint}
        constraint={constraint}
        onFormatModeClick={onFormatModeClick}
        onFreezeSelected={onFreezeSelected}
        onUnfreezeSelected={onUnfreezeSelected}
        onUnfreezeAll={onUnfreezeAll}
        hasFrozenNucleotides={hasFrozenNucleotides}
        hasSelectedNucleotides={hasSelectedNucleotides}
      />
      
      <UtilitiesPanel
        onToggleBasePairEditor={onToggleBasePairEditor}
        onTogglePropertiesDrawer={onTogglePropertiesDrawer}
        onToggleSettingsDrawer={onToggleSettingsDrawer}
        onToggleAboutDrawer={onToggleAboutDrawer}
        onOpenDocs={onOpenDocs}
        onLoadExample={onLoadExample}
      />
    </SidebarLayout>
  );
}; 