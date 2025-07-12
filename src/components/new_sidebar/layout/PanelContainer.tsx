import { useState } from 'react';

type PanelContainerProps = {
  title: string;
  initialCollapsed?: boolean;
  children: React.ReactNode;
};

export const PanelContainer: React.FC<PanelContainerProps> = ({ title, initialCollapsed = false, children }) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  return (
    <div
      style={{
        borderBottom: '1px solid #ccc',
        resize: 'vertical',
        overflow: 'auto',
        minHeight: collapsed ? undefined : 100,
      }}
    >
      <div
        style={{
          padding: '4px 8px',
          background: '#f3f3f3',
          cursor: 'pointer',
          userSelect: 'none',
          fontWeight: 'bold',
        }}
        onClick={() => setCollapsed(!collapsed)}
      >
        {title} {collapsed ? '▼' : '▲'}
      </div>
      {!collapsed && <div style={{ padding: 8 }}>{children}</div>}
    </div>
  );
}; 