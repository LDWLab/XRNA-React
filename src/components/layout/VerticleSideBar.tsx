import React, { useState, useRef, useEffect, ReactNode } from 'react';
import { 
  FolderOpen, 
  Microscope, 
  Pencil, 
  ScanEye,
  Atom, 
  Tag, 
  Settings, 
  Info,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  TestTube
} from 'lucide-react';
import { Tab } from '../../app_data/Tab';

export interface SidebarPanel {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  defaultOpen?: boolean;
  minWidth?: number;
  maxWidth?: number;
}

export interface PhotoshopSidebarProps {
  tabs: Tab[];
  activeTab: Tab | null;
  onTabChange: (tab: Tab) => void;
  tabContent: Record<Tab, ReactNode>;
  panels?: SidebarPanel[];
  minSidebarWidth?: number;
  maxSidebarWidth?: number;
  defaultSidebarWidth?: number;
  className?: string;
}

const TAB_ICONS: Record<Tab, ReactNode> = {
  [Tab.INPUT_OUTPUT]: <FolderOpen size={20} />,
  [Tab.VIEWPORT]: <Microscope size={20} />,
  [Tab.EDIT]: <Pencil size={20} />,
  [Tab.FORMAT]: <ScanEye size={20} />,
  [Tab.ANNOTATE]: <Tag size={20} />,
  [Tab.SETTINGS]: <Settings size={20} />,
  [Tab.ABOUT]: <Info size={20} />,
};

const TAB_DESCRIPTIONS: Record<Tab, string> = {
  [Tab.INPUT_OUTPUT]: 'File Operations',
  [Tab.VIEWPORT]: 'Molecular Viewport',
  [Tab.EDIT]: 'Structure Editing',
  [Tab.FORMAT]: 'Visual Formatting',
  [Tab.ANNOTATE]: 'Annotations',
  [Tab.SETTINGS]: 'Application Settings',
  [Tab.ABOUT]: 'About XRNA',
};

export const PhotoshopSidebar: React.FC<PhotoshopSidebarProps> = ({
  tabs,
  activeTab,
  onTabChange,
  tabContent,
  panels = [],
  minSidebarWidth = 250,
  maxSidebarWidth = 600,
  defaultSidebarWidth = 320,
  className = '',
}) => {
  const [sidebarWidth, setSidebarWidth] = useState(defaultSidebarWidth);
  const [isResizing, setIsResizing] = useState(false);
  const [openPanels, setOpenPanels] = useState<Set<string>>(
    new Set(panels.filter(p => p.defaultOpen).map(p => p.id))
  );
  const [collapsedSidebar, setCollapsedSidebar] = useState(false);
  const [hoveredTab, setHoveredTab] = useState<Tab | null>(null);

  
  const sidebarRef = useRef<HTMLDivElement>(null);
  const resizeHandleRef = useRef<HTMLDivElement>(null);

  // Handle sidebar resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;
      
      const newWidth = e.clientX;
      if (newWidth >= minSidebarWidth && newWidth <= maxSidebarWidth) {
        setSidebarWidth(newWidth);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ew-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, minSidebarWidth, maxSidebarWidth]);

  const togglePanel = (panelId: string) => {
    const newOpenPanels = new Set(openPanels);
    if (newOpenPanels.has(panelId)) {
      newOpenPanels.delete(panelId);
    } else {
      newOpenPanels.add(panelId);
    }
    setOpenPanels(newOpenPanels);
  };

  const toggleSidebar = () => {
    setCollapsedSidebar(!collapsedSidebar);
  };



  return (
    <div className={`photoshop-sidebar ${className}`}>
      {/* Vertical Tab Bar */}
      <div className="sidebar-tab-bar molecular-focused">
        <div className="tab-buttons">
          {tabs.map((tab) => (
            <div key={tab} className="tab-button-container">
              <button
                className={`tab-button molecular-tab ${activeTab === tab ? 'active' : ''}`}
                onClick={() => onTabChange(tab)}
                onMouseEnter={() => setHoveredTab(tab)}
                onMouseLeave={() => setHoveredTab(null)}
              >
                <span className="tab-icon molecular-icon">{TAB_ICONS[tab]}</span>
              </button>
              {hoveredTab === tab && (
                <div className="tab-tooltip">
                  <div className="tooltip-content">
                    <div className="tooltip-title">{TAB_DESCRIPTIONS[tab]}</div>
                    <div className="tooltip-subtitle">{tab}</div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
        
      </div>

      {/* Main Content Area */}
      {!collapsedSidebar && activeTab && (
        <>
          <div
            ref={sidebarRef}
            className="sidebar-content"
            style={{ width: sidebarWidth }}
          >
            {/* Active Tab Content */}
            <div className="tab-content-area molecular-workspace">
              <div className="tab-content-header molecular-header">
                <h3 className="tab-title molecular-title">
                  <span className="tab-title-icon molecular-title-icon">{TAB_ICONS[activeTab]}</span>
                  <div className="title-text">
                    <span className="title-main">{TAB_DESCRIPTIONS[activeTab]}</span>
                    <span className="title-sub">{activeTab}</span>
                  </div>
                </h3>
              </div>
              <div className="tab-content-body molecular-content custom-scrollbar">
                {tabContent[activeTab]}
              </div>
            </div>

            {/* Molecular Analysis Panels */}
            {panels.length > 0 && (
              <div className="side-panels molecular-panels">
                <div className="panels-header">
                  <h4 className="panels-title">
                    <span className="panels-icon"><TestTube size={16} /></span>
                    Molecular Analysis
                  </h4>
                </div>
                <div className="panels-content">
                  {panels.map((panel) => (
                    <div key={panel.id} className="side-panel molecular-panel">
                      <button
                        className={`panel-header molecular-panel-header ${openPanels.has(panel.id) ? 'open' : ''}`}
                        onClick={() => togglePanel(panel.id)}
                      >
                        <span className="panel-title molecular-panel-title">
                          {panel.icon && <span className="panel-icon molecular-panel-icon">{panel.icon}</span>}
                          {panel.title}
                        </span>
                        <span className="panel-toggle molecular-toggle">
                          {openPanels.has(panel.id) ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
                        </span>
                      </button>
                      {openPanels.has(panel.id) && (
                        <div className="panel-content molecular-panel-content custom-scrollbar">
                          {panel.content}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Resize Handle */}
          <div
            ref={resizeHandleRef}
            className="resize-handle"
            onMouseDown={() => setIsResizing(true)}
          />
        </>
      )}


    </div>
  );
}; 