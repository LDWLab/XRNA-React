import { BasePairsEditor } from "../components/app_specific/editors/BasePairsEditor";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";

export enum Setting {
  COPY_FILE_NAME = "copy_file_name",
  COPY_FILE_EXTENSION = "copy_file_extension",
  RESET_VIEWPORT_AFTER_FILE_UPLOAD = "reset_viewport_after_file_upload",
  USE_DEGREES = "use_degrees",
  REPOSITION_NUCLEOTIDES_WHEN_FORMATTING = "reposition_nucleotides_when_formatting",
  AUTOMATICALLY_REPOSITION_ANNOTATIONS = "automatically_reposition_annotations",
  CANONICAL_BASE_PAIR_DISTANCE = "canonical_base_pair_distance",
  WOBBLE_BASE_PAIR_DISTANCE = "wobble_base_pair_distance",
  MISMATCH_BASE_PAIR_DISTANCE = "mismatch_base_pair_distance",
  DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS = "distance_between_contiguous_base_pairs",
  REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE = "replace_nucleotides_with_contour_line",
  CONTOUR_LINE_WIDTH = "contour_line_width",
  PATH_MODE = "path_mode",
  PATH_LINE_WIDTH = "path_line_width",
  DARK_MODE = "dark_mode",
  DISABLE_NAVIGATE_AWAY_PROMPT = "disable_navigate_away_prompt",
  TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED = "treat_non_canonical_base_pairs_as_unpaired",
  
  // Grid settings
  GRID_ENABLED = "grid_enabled",
  GRID_HORIZONTAL_LINES = "grid_horizontal_lines",
  GRID_VERTICAL_LINES = "grid_vertical_lines",
  GRID_LEFT_RIGHT_DIAGONAL = "grid_left_right_diagonal",
  GRID_RIGHT_LEFT_DIAGONAL = "grid_right_left_diagonal",
  GRID_CONCENTRIC_CIRCLES = "grid_concentric_circles",
  GRID_DOTTED = "grid_dotted",
  GRID_SPACING = "grid_spacing",
  GRID_COLOR = "grid_color",
  CANVAS_COLOR = "canvas_color"
}

export const settings = Object.values(Setting);

export const settingsShortDescriptionsMap : Record<Setting, string> = {
  [Setting.COPY_FILE_NAME] : "Copy input-file names to output-file names",
  [Setting.COPY_FILE_EXTENSION] : "Copy input-file extensions to downloadable output files",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "Reset viewport after file upload",
  [Setting.USE_DEGREES] : "Use degrees",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "Reposition annotations when editing",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "Reposition nucleotides when formatting",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "Canonical base-pair distance",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "Wobble base-pair distance",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "Mismatch base-pair distance",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "Distance between contiguous base pairs",
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : "Replace nucleotides with contour line",
  [Setting.CONTOUR_LINE_WIDTH] : "Contour-line width",
  [Setting.PATH_MODE] : "Path mode (show lines, hide nucleotide text)",
  [Setting.PATH_LINE_WIDTH] : "Path-line width",
  [Setting.DARK_MODE] : "Dark mode",
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : "Disable the navigate-away prompt",
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : "Treat non-canonical base pairs as unpaired (when editing and formatting)",
  // Grid settings
  [Setting.GRID_ENABLED] : "Enable canvas grid",
  [Setting.GRID_HORIZONTAL_LINES] : "Show horizontal grid lines",
  [Setting.GRID_VERTICAL_LINES] : "Show vertical grid lines",
  [Setting.GRID_LEFT_RIGHT_DIAGONAL] : "Show left-to-right diagonal lines",
  [Setting.GRID_RIGHT_LEFT_DIAGONAL] : "Show right-to-left diagonal lines",
  [Setting.GRID_CONCENTRIC_CIRCLES] : "Show concentric circles",
  [Setting.GRID_DOTTED] : "Show dotted grid pattern",
  [Setting.GRID_SPACING] : "Grid line spacing",
  [Setting.GRID_COLOR] : "Grid color",
  [Setting.CANVAS_COLOR] : "Canvas background color"
};

export const settingsLongDescriptionsMap : Record<Setting, string> = {
  [Setting.COPY_FILE_NAME] : "Copy the name from uploaded input files to downloadable output files",
  [Setting.COPY_FILE_EXTENSION] : "Copy the extension from uploaded input files to downloadable output files (when supported)",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "Reset the viewport translation and scale after parsing an input file",
  [Setting.USE_DEGREES] : "Use degrees (instead of radians) when editing angles",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "Reposition annotations when their parent nucleotides are repositioned",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "Reposition nucleotides when formatting",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"canonical.\" (i.e. Watson-Crick). Applied when formatting base pairs",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"wobble.\" Applied when formatting base pairs",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "The default distance between base pairs which are \"mismatch.\" Applied when formatting base pairs",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "The default distance between base pairs which are contiguous. Applied when formatting base pairs",
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : "Display only a countour line per RNA molecule, instead of individual nucleotides",
  [Setting.CONTOUR_LINE_WIDTH] : "Width of the contour line (applied when replacing nucleotides with a contour line)",
  [Setting.PATH_MODE] : "Display lines tracing the centers of nucleotides while hiding the nucleotide text. This provides an abstracted view ideal for visualizing larger structures efficiently while keeping base pairs, labels, and other features visible.",
  [Setting.PATH_LINE_WIDTH] : "Width of the path line (applied when path mode is enabled)",
  [Setting.DARK_MODE] : "Change background colors and scene colors to darken the scene",
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : "Disable the prompt asking you to save your work, when you navigate away from this page",
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : "Disable editing and formatting of non-canonical base pairs.",
  // Grid settings
  [Setting.GRID_ENABLED] : "Enable or disable the canvas grid system. When enabled, you can choose which grid types to display.",
  [Setting.GRID_HORIZONTAL_LINES] : "Display horizontal parallel lines across the canvas. These lines move with the viewport pan but maintain their spacing.",
  [Setting.GRID_VERTICAL_LINES] : "Display vertical parallel lines across the canvas. These lines move with the viewport pan but maintain their spacing.",
  [Setting.GRID_LEFT_RIGHT_DIAGONAL] : "Display diagonal lines from top-left to bottom-right. These lines move with the viewport pan but maintain their spacing.",
  [Setting.GRID_RIGHT_LEFT_DIAGONAL] : "Display diagonal lines from top-right to bottom-left. These lines move with the viewport pan but maintain their spacing.",
  [Setting.GRID_CONCENTRIC_CIRCLES] : "Display concentric circles centered on the canvas. The radius between circles is controlled by the grid spacing setting.",
  [Setting.GRID_DOTTED] : "Display a dotted grid pattern across the canvas. The spacing between dots is controlled by the grid spacing setting.",
  [Setting.GRID_SPACING] : "Control the distance between parallel grid lines or the radius increment for concentric circles. Higher values create more spaced out grids.",
  [Setting.GRID_COLOR] : "Customize the color of all grid elements. Leave empty to use automatic theme-based colors.",
  [Setting.CANVAS_COLOR] : "Customize the canvas background color. Leave empty to use automatic theme-based colors."
};

export const settingsTypeMap : Record<Setting, "boolean" | "number" | "string"> = {
  [Setting.COPY_FILE_NAME] : "boolean",
  [Setting.COPY_FILE_EXTENSION] : "boolean",
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : "boolean",
  [Setting.USE_DEGREES] : "boolean",
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : "boolean",
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : "boolean",
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : "number",
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : "number",
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : "number",
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : "number",
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : "boolean",
  [Setting.CONTOUR_LINE_WIDTH] : "number",
  [Setting.PATH_MODE] : "boolean",
  [Setting.PATH_LINE_WIDTH] : "number",
  [Setting.DARK_MODE] : "boolean",
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : "boolean",
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : "boolean",
  // Grid settings
  [Setting.GRID_ENABLED] : "boolean",
  [Setting.GRID_HORIZONTAL_LINES] : "boolean",
  [Setting.GRID_VERTICAL_LINES] : "boolean",
  [Setting.GRID_LEFT_RIGHT_DIAGONAL] : "boolean",
  [Setting.GRID_RIGHT_LEFT_DIAGONAL] : "boolean",
  [Setting.GRID_CONCENTRIC_CIRCLES] : "boolean",
  [Setting.GRID_DOTTED] : "boolean",
  [Setting.GRID_SPACING] : "number",
  [Setting.GRID_COLOR] : "string",
  [Setting.CANVAS_COLOR] : "string"
};

export function isSetting(candidateSetting : string) : candidateSetting is Setting {
  return (settings as Array<string>).includes(candidateSetting);
}

export type SettingValue = boolean | number | string;

export type SettingsRecord = Record<Setting, SettingValue>;

export const DEFAULT_SETTINGS : SettingsRecord = {
  [Setting.COPY_FILE_NAME] : true,
  [Setting.COPY_FILE_EXTENSION] : true,
  [Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD] : true,
  [Setting.USE_DEGREES] : true,
  [Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] : true,
  [Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] : true,
  [Setting.CANONICAL_BASE_PAIR_DISTANCE] : NaN,
  [Setting.WOBBLE_BASE_PAIR_DISTANCE] : NaN,
  [Setting.MISMATCH_BASE_PAIR_DISTANCE] : NaN,
  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] : NaN,
  [Setting.REPLACE_NUCLEOTIDES_WITH_CONTOUR_LINE] : false,
  [Setting.CONTOUR_LINE_WIDTH] : DEFAULT_STROKE_WIDTH,
  [Setting.PATH_MODE] : false,
  [Setting.PATH_LINE_WIDTH] : DEFAULT_STROKE_WIDTH,
  [Setting.DARK_MODE] : false,
  [Setting.DISABLE_NAVIGATE_AWAY_PROMPT] : false,
  [Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] : true,
  // Grid settings
  [Setting.GRID_ENABLED] : false,
  [Setting.GRID_HORIZONTAL_LINES] : true,
  [Setting.GRID_VERTICAL_LINES] : true,
  [Setting.GRID_LEFT_RIGHT_DIAGONAL] : false,
  [Setting.GRID_RIGHT_LEFT_DIAGONAL] : false,
  [Setting.GRID_CONCENTRIC_CIRCLES] : false,
  [Setting.GRID_DOTTED] : false,
  [Setting.GRID_SPACING] : 50,
  [Setting.GRID_COLOR] : "",
  [Setting.CANVAS_COLOR] : ""
};