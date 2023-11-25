import { BasePairsEditor } from "../components/app_specific/editors/BasePairsEditor";

export enum Setting {
  SYNC_FILE_NAME = "sync_file_name",
  SYNC_FILE_EXTENSION = "sync_file_extension",
  RESET_VIEWPORT_AFTER_FILE_UPLOAD = "reset_viewport_after_file_upload",
  USE_DEGREES = "use_degrees",
  REPOSITION_NUCLEOTIDES_WHEN_FORMATTING = "reposition_nucleotides_when_formatting",
  AUTOMATICALLY_REPOSITION_ANNOTATIONS = "automatically_reposition_annotations",
  BASE_PAIRS_EDITOR_TYPE = "base_pairs_editor_type",
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
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "Reposition annotations when editing",
  [Setting.BASE_PAIRS_EDITOR_TYPE] : "Format-tab base-pairs editor type",
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
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "Reposition annotations when their parent nucleotides are repositioned",
  [Setting.BASE_PAIRS_EDITOR_TYPE] : "Type of the base-pairs editor within the format menu",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"canonical.\" (i.e. Watson-Crick). Applied when formatting base pairs",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"wobble.\" Applied when formatting base pairs",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"mismatch.\" Applied when formatting base pairs",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "The default distance between base pairs which are contiguous. Applied when formatting base pairs"
};

export const settingsTypeMap : Record<Setting, "boolean" | "number" | "BasePairsEditorType"> = {
  [Setting.SYNC_FILE_NAME] : "boolean",
  [Setting.SYNC_FILE_EXTENSION] : "boolean",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "boolean",
  [Setting.USE_DEGREES] : "boolean",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "boolean",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "boolean",
  [Setting.BASE_PAIRS_EDITOR_TYPE] : "BasePairsEditorType",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "number",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "number",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "number",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "number"
};

export type SettingValue = boolean | number | BasePairsEditor.EditorType;

export type SettingsRecord = Record<Setting, SettingValue>;

export const DEFAULT_SETTINGS : SettingsRecord = {
  [Setting.SYNC_FILE_NAME] : true,
  [Setting.SYNC_FILE_EXTENSION] : true,
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : true,
  [Setting.USE_DEGREES] : true,
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : true,
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : true,
  [Setting.BASE_PAIRS_EDITOR_TYPE] : BasePairsEditor.EditorType.TABLE_BASED,
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : NaN,
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : NaN,
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : NaN,
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : NaN
};