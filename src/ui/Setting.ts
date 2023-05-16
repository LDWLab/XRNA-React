export enum Setting {
    SYNC_FILE_NAME = "sync_file_name",
    SYNC_FILE_EXTENSION = "sync_file_extension",
    RESET_VIEWPORT_ON_FILE_UPLOAD = "reset_viewport_on_upload",
    USE_DEGREES = "use_degrees"
  }
  
  export const settings = Object.values(Setting);
  
  export const settingsShortDescriptionsMap : Record<Setting, string> = {
    [Setting.SYNC_FILE_NAME] : "Synchronize input/output file names",
    [Setting.SYNC_FILE_EXTENSION] : "Synchronize input/output file extensions",
    [Setting.RESET_VIEWPORT_ON_FILE_UPLOAD] : "Reset viewport on file upload",
    [Setting.USE_DEGREES] : "Use degrees"
  };
  
  export const settingsLongDescriptionsMap : Record<Setting, string> = {
    [Setting.SYNC_FILE_NAME] : "Synchronize the name from uploaded input files to downloadable output files",
    [Setting.SYNC_FILE_EXTENSION] : "Synchronize the extension from uploaded input files to downloadable output files (when supported)",
    [Setting.RESET_VIEWPORT_ON_FILE_UPLOAD] : "Reset the viewport settings upon an input-file upload",
    [Setting.USE_DEGREES] : "Use degrees (instead of radians) when editing angles"
  };
  
  export const DEFAULT_SETTINGS : Record<Setting, boolean> = {
    [Setting.SYNC_FILE_NAME] : true,
    [Setting.SYNC_FILE_EXTENSION] : true,
    [Setting.RESET_VIEWPORT_ON_FILE_UPLOAD] : true,
    [Setting.USE_DEGREES] : true
  };