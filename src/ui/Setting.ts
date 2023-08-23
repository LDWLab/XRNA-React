export enum Setting {
  SYNC_FILE_NAME = "sync_file_name",
  SYNC_FILE_EXTENSION = "sync_file_extension",
  RESET_VIEWPORT_AFTER_FILE_UPLOAD = "reset_viewport_after_file_upload",
  USE_DEGREES = "use_degrees",
  REPOSITION_NUCLEOTIDES_WHEN_FORMATTING = "reposition_nucleotides_when_formatting",
  TEXT_BASED_FORMAT_MENU = "text_based_format_menu",
  CANONICAL_BASE_PAIR_DISTANCE = "canonical_base_pair_distance",
  WOBBLE_BASE_PAIR_DISTANCE = "wobble_base_pair_distance",
  MISMATCH_BASE_PAIR_DISTANCE = "mismatch_base_pair_distance",
  DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS = "distance_between_contiguous_base_pairs"
}

export const settings = Object.values(Setting);

export const settingsShortDescriptionsMap : Record<Setting, string> = {
  [Setting.SYNC_FILE_NAME] : "Synchronize input/output file names",
  [Setting.SYNC_FILE_EXTENSION] : "Synchronize input/output file extensions",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "Reset viewport after file upload",
  [Setting.USE_DEGREES] : "Use degrees",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "Reposition nucleotides when formatting",
  [Setting.TEXT_BASED_FORMAT_MENU] : "New format menu",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "Canonical base-pair distance",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "Wobble base-pair distance",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "Mismatch base-pair distance",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "Distance between contiguous base pairs"
};

export const settingsLongDescriptionsMap : Record<Setting, string> = {
  [Setting.SYNC_FILE_NAME] : "Synchronize the name from uploaded input files to downloadable output files",
  [Setting.SYNC_FILE_EXTENSION] : "Synchronize the extension from uploaded input files to downloadable output files (when supported)",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "Reset the viewport translation and scale after parsing an input file",
  [Setting.USE_DEGREES] : "Use degrees (instead of radians) when editing angles",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "Reposition nucleotides when formatting",
  [Setting.TEXT_BASED_FORMAT_MENU] : "Display a text-based formatting menu",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"canonical.\" (i.e. Watson-Crick). Applied when formatting base pairs",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"wobble.\" Applied when formatting base pairs",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"mismatch.\" Applied when formatting base pairs",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "The default distance between base pairs which are contiguous. Applied when formatting base pairs"
};

export const settingsTypeMap : Record<Setting, "boolean" | "number"> = {
  [Setting.SYNC_FILE_NAME] : "boolean",
  [Setting.SYNC_FILE_EXTENSION] : "boolean",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "boolean",
  [Setting.USE_DEGREES] : "boolean",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "boolean",
  [Setting.TEXT_BASED_FORMAT_MENU] : "boolean",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "number",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "number",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "number",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "number"
};

export type SettingValue = boolean | number;

const DEFAULT_CANONICAL_BASE_PAIR_DISTANCE = 16;
const DEFAULT_NON_CANONICAL_BASE_PAIR_DISTANCE = 21;

export const DEFAULT_SETTINGS : Record<Setting, SettingValue> = {
  [Setting.SYNC_FILE_NAME] : true,
  [Setting.SYNC_FILE_EXTENSION] : true,
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : true,
  [Setting.USE_DEGREES] : true,
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : true,
  [Setting.TEXT_BASED_FORMAT_MENU] : true,
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : DEFAULT_CANONICAL_BASE_PAIR_DISTANCE,
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : DEFAULT_NON_CANONICAL_BASE_PAIR_DISTANCE,
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : DEFAULT_NON_CANONICAL_BASE_PAIR_DISTANCE,
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : 6
};