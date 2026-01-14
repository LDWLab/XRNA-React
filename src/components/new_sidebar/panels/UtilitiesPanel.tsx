import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Settings, Info, BookOpen, RefreshCw } from 'lucide-react';
import { Button } from '../layout/Button';

export interface UtilitiesPanelProps {
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
  onOpenDocs?: () => void;
  onReformatAll?: () => void;
}


export const UtilitiesPanel: React.FC<UtilitiesPanelProps> = ({
  onToggleBasePairEditor,
  onTogglePropertiesDrawer,
  onToggleSettingsDrawer,
  onToggleAboutDrawer,
  onOpenDocs,
  onReformatAll,
}) => {

  return (
    <PanelContainer title="Utilities" borderRadius={8}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {/* Row 1: Reformat All | Settings */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          {onReformatAll && (
            <Button
              onClick={onReformatAll}
              icon={<RefreshCw size={12} />}
              label="Reformat All"
              hint="Reformat all base pairs at molecule level"
              variant="primary"
            />
          )}
          {onToggleSettingsDrawer && (
            <Button
              onClick={onToggleSettingsDrawer}
              icon={<Settings size={12} />}
              label="Settings"
              hint="Edit settings"
              variant="secondary"
            />
          )}
        </div>
        {/* Row 2: Quickstart | User Guide */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px' }}>
          {onToggleAboutDrawer && (
            <Button
              onClick={onToggleAboutDrawer}
              icon={<Info size={12} />}
              label="Quickstart"
              hint="Quickstart guide"
              variant="secondary"
            />
          )}
          {onOpenDocs && (
            <Button
              onClick={onOpenDocs}
              icon={<BookOpen size={12} />}
              label="User Guide"
              hint="Open documentation"
              variant="secondary"
            />
          )}
        </div>
      </div>
    </PanelContainer>
  );
};
