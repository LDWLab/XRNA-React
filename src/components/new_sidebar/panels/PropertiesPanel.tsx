import { PanelContainer } from '../layout/PanelContainer';

export interface PropertiesPanelProps {
  content?: JSX.Element;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({ content }) => {
  return (
    <PanelContainer title="Properties">
      {content ?? <span>Select an element to see its properties.</span>}
    </PanelContainer>
  );
}; 