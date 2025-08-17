import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Cable, Settings, Info } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';
import { Button } from '../layout/Button';

export interface UtilitiesPanelProps {
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
}


export const UtilitiesPanel: React.FC<UtilitiesPanelProps> = ({
  onToggleBasePairEditor,
  onTogglePropertiesDrawer,
  onToggleSettingsDrawer,
  onToggleAboutDrawer,
}) => {
  const { theme } = useTheme();

  return (
    <PanelContainer title="Utilities" borderRadius={8}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Editors Section */}
        {(onToggleBasePairEditor || onTogglePropertiesDrawer) && (
          <div>
            <div style={{ display: 'flex', gap: '6px' }}>
              {/* {onToggleBasePairEditor && (
                <Button
                  onClick={onToggleBasePairEditor}
                  icon={<Cable size={12} />}
                  label="Editor"
                  hint="Edit base pairs"
                  variant="secondary"
                />
              )} */}
              {onToggleSettingsDrawer && (
                <Button
                  onClick={onToggleSettingsDrawer}
                  icon={<Settings size={12} />}
                  label="Settings"
                  hint="Edit settings"
                  variant="secondary"
                />
              )}
              {onToggleAboutDrawer && (
                <Button
                  onClick={onToggleAboutDrawer}
                  icon={<Info size={12} />}
                  label="About"
                  hint="About the app"
                  variant="secondary"
                />
              )}
              
            </div>
          </div>
        )}

      </div>
    </PanelContainer>
  );
};
