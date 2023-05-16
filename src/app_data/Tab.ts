export enum Tab {
    INPUT_OUTPUT = "Input/Output",
    VIEWPORT = "Viewport",
    EDIT = "Edit",
    FORMAT = "Format",
    ANNOTATE = "Annotate",
    SETTINGS = "Settings",
    DEMOS = "Demos"
  }
  
  export const tabs = Object.values(Tab);
  
  export const DEFAULT_TAB = Tab.INPUT_OUTPUT;