import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { BasePairsEditor } from '../../app_specific/editors/BasePairsEditor';
import { RnaComplexProps } from '../../../App';

export interface BasePairEditorProps {
  rnaComplexProps: RnaComplexProps;
  approveBasePairs: (bps: BasePairsEditor.BasePair[]) => void;
  initialBasePairs?: BasePairsEditor.InitialBasePairs;
}

// For now, render the existing BasePairsEditor directly; filtering & advanced views
// will be added in later iterations.
export const BasePairEditorPanel: React.FC<BasePairEditorProps> = ({
  rnaComplexProps,
  approveBasePairs,
  initialBasePairs,
}) => {
  return (
    <PanelContainer title="Base-Pairs Editor">
      <BasePairsEditor.Component
        rnaComplexProps={rnaComplexProps}
        approveBasePairs={approveBasePairs}
        initialBasePairs={initialBasePairs}
      />
    </PanelContainer>
  );
}; 