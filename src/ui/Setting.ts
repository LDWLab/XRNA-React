import { BasePairsEditor } from "../components/app_specific/editors/BasePairsEditor";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";

export enum Setting {
  COPY_FILE_NAME = "copy_file_name",
  COPY_FILE_EXTENSION = "copy_file_extension",
  RESET_VIEWPORT_AFTER_FILE_UPLOAD = "reset_viewport_after_file_upload",
  USE_DEGREES = "use_degrees",
  REPOSITION_NUCLEOTIDES_WHEN_FORMATTING = "reposition_nucleotides_when_formatting",
  AUTOMATICALLY_REPOSITION_ANNOTATIONS = "automatically_reposition_annotations",
  BASE_PAIRS_EDITOR_TYPE = "base_pairs_editor_type",
  CANONICAL_BASE_PAIR_DISTANCE = "canonical_base_pair_distance",
  WOBBLE_BASE_PAIR_DISTANCE = "wobble_base_pair_distance",
  MISMATCH_BASE_PAIR_DISTANCE = "mismatch_base_pair_distance",
  DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS = "distance_between_contiguous_base_pairs",
  REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE = "replace_nucleotides_with_contour_line",
  CONTOUR_LINE_WIDTH = "contour_line_width",
  DARK_MODE = "dark_mode",
  DISABLE_NAVIGATE_AWAY_PROMPT = "disable_navigate_away_prompt",
  TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED = "treat_non_canonical_base_pairs_as_unpaired"
}

export const settings = Object.values(Setting);

export const settingsShortDescriptionsMap : Record<Setting, string> = {
  [Setting.COPY_FILE_NAME] : "Copy input-file names to output-file names",
  [Setting.COPY_FILE_EXTENSION] : "Copy input-file extensions to output-file extensions",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "Reset viewport after file upload",
  [Setting.USE_DEGREES] : "Use degrees",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "Reposition annotations when editing",
  [Setting.BASE_PAIRS_EDITOR_TYPE] : "Format-tab base-pairs editor type",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "Reposition nucleotides when formatting",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "Canonical base-pair distance",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "Wobble base-pair distance",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "Mismatch base-pair distance",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "Distance between contiguous base pairs",
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : "Replace nucleotides with contour line",
  [Setting.CONTOUR_LINE_WIDTH] : "Contour-line width",
  [Setting.DARK_MODE] : "Dark mode",
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : "Disable the navigate-away prompt",
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : "Treat non-canonical base pairs as unpaired (for editing and formatting)"
};

export const settingsLongDescriptionsMap : Record<Setting, string> = {
  [Setting.COPY_FILE_NAME] : "Copy the name from uploaded input files to downloadable output files",
  [Setting.COPY_FILE_EXTENSION] : "Copy the extension from uploaded input files to downloadable output files (when supported)",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "Reset the viewport translation and scale after parsing an input file",
  [Setting.USE_DEGREES] : "Use degrees (instead of radians) when editing angles",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "Reposition annotations when their parent nucleotides are repositioned",
  [Setting.BASE_PAIRS_EDITOR_TYPE] : "Type of the base-pairs editor within the format menu",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "Reposition nucleotides when formatting",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"canonical.\" (i.e. Watson-Crick). Applied when formatting base pairs",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"wobble.\" Applied when formatting base pairs",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"mismatch.\" Applied when formatting base pairs",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "The default distance between base pairs which are contiguous. Applied when formatting base pairs",
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : "Display only a countour line per RNA molecule, instead of individual nucleotides",
  [Setting.CONTOUR_LINE_WIDTH] : "Width of the contour line (applied when replacing nucleotides with a contour line)",
  [Setting.DARK_MODE] : "Change background colors and scene colors to darken the scene",
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : "Disable the prompt asking you to save your work, when you navigate away from this page",
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : "Disable editing and formatting of non-canonical base pairs."
};

export const settingsTypeMap : Record<Setting, "boolean" | "number" | "BasePairsEditorType"> = {
  [Setting.COPY_FILE_NAME] : "boolean",
  [Setting.COPY_FILE_EXTENSION] : "boolean",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "boolean",
  [Setting.USE_DEGREES] : "boolean",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "boolean",
  [Setting.BASE_PAIRS_EDITOR_TYPE] : "BasePairsEditorType",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "boolean",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "number",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "number",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "number",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "number",
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : "boolean",
  [Setting.CONTOUR_LINE_WIDTH] : "number",
  [Setting.DARK_MODE] : "boolean",
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : "boolean",
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : "boolean"
};

export function isSetting(candidateSetting : string) : candidateSetting is Setting {
  return (settings as Array<string>).includes(candidateSetting);
}

export type SettingValue = boolean | number | BasePairsEditor.EditorType;

export type SettingsRecord = Record<Setting, SettingValue>;

export const DEFAULT_SETTINGS : SettingsRecord = {
  [Setting.COPY_FILE_NAME] : true,
  [Setting.COPY_FILE_EXTENSION] : true,
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : true,
  [Setting.USE_DEGREES] : true,
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : true,
  [Setting.BASE_PAIRS_EDITOR_TYPE] : BasePairsEditor.EditorType.TABLE_BASED,
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : true,
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : NaN,
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : NaN,
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : NaN,
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : NaN,
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : false,
  [Setting.CONTOUR_LINE_WIDTH] : DEFAULT_STROKE_WIDTH,
  [Setting.DARK_MODE] : false,
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : false,
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : true
};