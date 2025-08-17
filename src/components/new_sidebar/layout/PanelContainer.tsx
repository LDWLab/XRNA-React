import { useTheme } from '../../../context/ThemeContext';

type PanelContainerProps = {
  title: string;
  initialCollapsed?: boolean;
  children: React.ReactNode;
  borderRadius?: number;
};

export const PanelContainer: React.FC<PanelContainerProps> = ({ 
  title, 
  children, 
  borderRadius = 12
}) => {
  const { theme } = useTheme();
  return (
    <div
      style={{
        background: theme.colors.surface,
        border: `1px solid ${theme.colors.border}`,
        borderRadius: borderRadius,
        margin: '0 0 10px 0',
        boxShadow: theme.shadows.sm,
        transition: theme.transitions.default,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          background: theme.colors.surfaceHover,
          fontSize: theme.typography.fontSize.sm,
          fontWeight: '700',
          letterSpacing: '0.5px',
          color: theme.colors.text,
          display: 'flex',
          alignItems: 'center',
          borderBottom: `1px solid ${theme.colors.border}`,
          textTransform: 'uppercase',
        }}
      >
        <span style={{ 
          fontSize: theme.typography.fontSize.xs,
          fontWeight: '700',
          color: theme.colors.textSecondary,
        }}>
          {title}
        </span>
      </div>
      <div
        style={{
          padding: '16px',
          minHeight: '48px',
          background: theme.colors.surface,
        }}
      >
        {children}
      </div>
    </div>
  );
}; 