export enum Tab {
    INPUT_OUTPUT = "Input/Output",
    VIEWPORT = "Viewport",
    EDIT = "Edit",
    FORMAT = "Format",
    ANNOTATE = "Annotate",
    SETTINGS = "Settings",
    ABOUT = "About"
  }
  
  export const tabs = Object.values(Tab).filter(t => t !== Tab.VIEWPORT);
  
  export const DEFAULT_TAB = Tab.INPUT_OUTPUT;