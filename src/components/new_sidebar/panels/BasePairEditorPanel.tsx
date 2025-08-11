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
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontSize: 12, color: '#64748b' }}>Use the bottom Base-Pair Editor for a tabular experience</div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('openBasepairBottomSheet'))}
          style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', fontSize: 12, fontWeight: 600, color: '#0f172a' }}
        >Open Bottom Editor</button>
      </div>
      <BasePairsEditor.Component
        rnaComplexProps={rnaComplexProps}
        approveBasePairs={approveBasePairs}
        initialBasePairs={initialBasePairs}
      />
    </PanelContainer>
  );
}; 