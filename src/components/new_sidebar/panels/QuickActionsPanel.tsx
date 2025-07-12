import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';

export type QuickActionsCallbacks = {
  onOpenFile?: () => void;
  onSave?: () => void;
  onExport?: () => void;
  onUndo?: () => void;
  onRedo?: () => void;
  onResetViewport?: () => void;
};

/**
 * QuickActionsPanel – Top-level toolbar for rapid access to common functions.
 * All callbacks are optional so this component can be rendered in storybooks / tests
 * without relying on the full App context. Real callbacks can be wired when the
 * sidebar is integrated into the main layout.
 */
export const QuickActionsPanel: React.FC<QuickActionsCallbacks> = ({
  onOpenFile,
  onSave,
  onExport,
  onUndo,
  onRedo,
  onResetViewport,
}) => {
  const disabled = {
    undo: !onUndo,
    redo: !onRedo,
    resetViewport: !onResetViewport,
  } as const;

  return (
    <PanelContainer title="Quick Actions">
      <button onClick={onOpenFile}>Open File</button>
      <button onClick={onSave}>Save</button>
      <button onClick={onExport}>Export</button>
      <hr />
      <button onClick={onUndo} disabled={disabled.undo}>
        Undo
      </button>
      <button onClick={onRedo} disabled={disabled.redo}>
        Redo
      </button>
      <hr />
      <button onClick={onResetViewport} disabled={disabled.resetViewport}>
        Reset Viewport
      </button>
    </PanelContainer>
  );
}; 