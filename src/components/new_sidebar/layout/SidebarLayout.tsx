import React from 'react';

type SidebarLayoutProps = {
  width?: number | string;
  children: React.ReactNode;
};

export const SidebarLayout: React.FC<SidebarLayoutProps> = ({ width = 320, children }) => {
  return (
    <div
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: '100%',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        borderRight: '5px solid black',
        background: 'white',
      }}
    >
      {children}
    </div>
  );
}; 