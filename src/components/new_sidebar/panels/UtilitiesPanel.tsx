import React from 'react';
import { PanelContainer } from '../layout/PanelContainer';
import { Cable, Settings, Info, TableProperties } from 'lucide-react';
import { useTheme } from '../../../context/ThemeContext';

export interface UtilitiesPanelProps {
  onToggleBasePairEditor?: () => void;
  onTogglePropertiesDrawer?: () => void;
  onToggleSettingsDrawer?: () => void;
  onToggleAboutDrawer?: () => void;
}

const UtilityButton: React.FC<{
  onClick?: () => void;
  icon: React.ReactNode;
  label: string;
  description?: string;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'accent';
}> = ({ onClick, icon, label, description, disabled = false, variant = 'secondary' }) => {
  const { theme } = useTheme();
  const [isHovered, setIsHovered] = React.useState(false);
  const [isPressed, setIsPressed] = React.useState(false);

  const getVariantStyles = () => {
    switch (variant) {
      case 'primary':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.primaryActive : (isHovered ? theme.colors.primaryHover : theme.colors.primary)),
          color: theme.colors.textInverse,
          border: `1px solid ${theme.colors.primary}`,
        };
      case 'accent':
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.accent : (isHovered ? theme.colors.accentHover : 'transparent')),
          color: disabled ? theme.colors.textMuted : (isHovered ? theme.colors.accent : theme.colors.textSecondary),
          border: `1px solid ${isHovered ? theme.colors.accent : theme.colors.border}`,
        };
      default:
        return {
          background: disabled ? theme.colors.surfaceHover : (isPressed ? theme.colors.surfaceHover : (isHovered ? theme.colors.surfaceHover : 'transparent')),
          color: disabled ? theme.colors.textMuted : theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '8px',
        padding: '12px 8px',
        borderRadius: '8px',
        fontSize: '10px',
        fontWeight: '600',
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: disabled ? 0.4 : 1,
        flex: 1,
        minWidth: '0',
        ...variantStyles,
        boxShadow: disabled ? 'none' : (isPressed ? theme.shadows.sm : (isHovered ? theme.shadows.sm : 'none')),
        transform: disabled ? 'none' : (isPressed ? 'scale(0.95)' : (isHovered ? 'translateY(-1px)' : 'translateY(0)')),
      }}
    >
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '18px',
        opacity: disabled ? 0.5 : 1,
      }}>
        {icon}
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          fontSize: '10px',
          fontWeight: '600',
          textTransform: 'uppercase',
          letterSpacing: '0.5px',
          marginBottom: '2px',
        }}>
          {label}
        </div>
        {description && (
          <div style={{
            fontSize: '8px',
            color: disabled ? theme.colors.textMuted : (variant === 'primary' ? theme.colors.textInverse + '80' : theme.colors.textMuted),
            lineHeight: '1.2',
            maxWidth: '60px',
          }}>
            {description}
          </div>
        )}
      </div>
    </button>
  );
};

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
              {onToggleBasePairEditor && (
                <UtilityButton
                  onClick={onToggleBasePairEditor}
                  icon={<Cable size={16} />}
                  label="Base Pairs Editor"
                  description=""
                  variant="secondary"
                />
              )}
              {onToggleSettingsDrawer && (
                <UtilityButton
                  onClick={onToggleSettingsDrawer}
                  icon={<Settings size={16} />}
                  label="Settings"
                  description=""
                  variant="secondary"
                />
              )}
              {onToggleAboutDrawer && (
                <UtilityButton
                  onClick={onToggleAboutDrawer}
                  icon={<Info size={16} />}
                  label="About"
                  description=""
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
