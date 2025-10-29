import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Settings, Info, BookOpen, CirclePlus } from 'lucide-react';
import { Button } from '../layout/Button';

export interface UtilitiesPanelProps {
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
  onOpenDocs?: () => void;
  onLoadExample?: () => void;
}


export const UtilitiesPanel: React.FC<UtilitiesPanelProps> = ({
  onToggleBasePairEditor,
  onTogglePropertiesDrawer,
  onToggleSettingsDrawer,
  onToggleAboutDrawer,
  onOpenDocs,
  onLoadExample,
}) => {

  return (
    <PanelContainer title="Utilities" borderRadius={8}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Editors Section */}
        {(onLoadExample || onToggleAboutDrawer || onToggleSettingsDrawer || onOpenDocs) && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '8px 12px' }}>
            {onLoadExample && (
              <Button
                onClick={onLoadExample}
                icon={<CirclePlus size={12} />}
                label="Load Example"
                hint="Load sample structure"
                variant="secondary"
              />
            )}
            {onToggleAboutDrawer && (
              <Button
                onClick={onToggleAboutDrawer}
                icon={<Info size={12} />}
                label="Quickstart"
                hint="Quickstart guide"
                variant="secondary"
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
            {onOpenDocs && (
              <Button
                onClick={onOpenDocs}
                icon={<BookOpen size={12} />}
                label="User Guide"
                hint="Open documentation"
                variant="primary"
              />
            )}
          </div>
        )}

      </div>
    </PanelContainer>
  );
};
