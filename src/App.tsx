import React, {
  createElement,
  createRef,
  Fragment,
  FunctionComponent,
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback
} from "react";
import { DEFAULT_TAB, Tab, tabs } from "./app_data/Tab";
import { add, distance, dotProduct, negate, normalize, orthogonalize, scaleDown, scaleUp, subtract, Vector2D } from "./data_structures/Vector2D";
import { useResizeDetector } from "react-resize-detector";
import {
  compareBasePairKeys,
  RnaComplex,
  insertBasePair,
  DuplicateBasePairKeysHandler,
  isRelevantBasePairKeySetInPair,
  compareFullBasePairKeys,
} from "./components/app_specific/RnaComplex";
import {
  OutputFileExtension,
  outputFileExtensions,
  outputFileWritersMap as outputFileWritersMapRelativeJsonCoordinates,
  r2dtLegacyOutputFileWritersMap as outputFileWritersMapAbsoluteJsonCoordinates,
} from "./io/OutputUI";
import {
  SCALE_BASE,
  ONE_OVER_LOG_OF_SCALE_BASE,
  MouseButtonIndices,
  DEFAULT_STROKE_WIDTH,
} from "./utils/Constants";
import {
  inputFileExtensions,
  InputFileExtension,
  inputFileReadersRecord,
  r2dtLegacyInputFileReadersRecord,
  defaultInvertYAxisFlagRecord,
  isInputFileExtension,
} from "./io/InputUI";
import {
  DEFAULT_SETTINGS,
  isSetting,
  Setting,
  settings,
  settingsLongDescriptionsMap,
  SettingsRecord,
  settingsShortDescriptionsMap,
  settingsTypeMap,
} from "./ui/Setting";
import InputWithValidator from "./components/generic/InputWithValidator";
import {
  BasePairKeysToRerender,
  Context,
  NucleotideKeysToRerender,
  NucleotideKeysToRerenderPerRnaComplex,
} from "./context/Context";
import { HandleQueryNotFound, isEmpty, sign, sortedArraySplice, subtractNumbers } from "./utils/Utils";
import { Nucleotide } from "./components/app_specific/Nucleotide";
import { LabelContent } from "./components/app_specific/LabelContent";
import { LabelLine } from "./components/app_specific/LabelLine";
import {
  getInteractionConstraintAndFullKeys,
  Helix,
  InteractionConstraint,
  iterateOverFreeNucleotidesAndHelicesPerScene,
} from "./ui/InteractionConstraint/InteractionConstraints";
import { Collapsible } from "./components/generic/Collapsible";
import { SAMPLE_XRNA_FILE } from "./utils/sampleXrnaFile";
import { fileExtensionDescriptions } from "./io/FileExtension";
import { calculateBasePairDistances } from "./utils/BasePairDistanceCalculator";
import loadingGif from "./images/loading.svg";
import {
  SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME,
  SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG,
  SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG,
  SVG_PROPERTY_XRNA_TYPE,
  SvgPropertyXrnaType,
} from "./io/SvgInputFileHandler";
import { areEqual, BLACK } from "./data_structures/Color";
import Font from "./data_structures/Font";
import { RnaMolecule } from "./components/app_specific/RnaMolecule";
import { LabelEditMenu } from "./components/app_specific/menus/edit_menus/LabelEditMenu";
import { SequenceConnectorEditMenu } from "./components/app_specific/menus/edit_menus/SequenceConnectorEditMenu";
import { TextAnnotationEditMenu } from "./components/app_specific/menus/edit_menus/TextAnnotationEditMenu";
import { TextAnnotation } from "./components/app_specific/TextAnnotation";
import BasePair, { getBasePairType } from "./components/app_specific/BasePair";
import { repositionNucleotidesForBasePairs } from "./utils/BasePairRepositioner";
import {
  multiplyAffineMatrices,
  parseAffineMatrix,
} from "./data_structures/AffineMatrix";
import "./App.css";
import { Sidebar } from "./components/new_sidebar";
import {
  MemoizedBasePairBottomSheet,
  MemoizedCommandTerminal,
  BasePairEditorDrawer,
} from "./components/new_sidebar";
import { MemoizedRightDrawer } from "./components/new_sidebar/drawer/RightDrawer";
import { ElementInfo } from "./components/new_sidebar";
import { extractElementInfo } from "./utils/ElementInfoExtractor";
import { Topbar, TOPBAR_HEIGHT } from "./components/new_sidebar/layout/Topbar";
import { ThemeProvider } from "./context/ThemeContext";
import { SettingsDrawer } from "./components/new_sidebar/drawer/SettingsDrawer";
import { AboutDrawer } from "./components/new_sidebar/drawer/AboutDrawer";
import { StructureTooltip, Grid, FloatingControls, MemoizedFloatingControls } from "./components/ui";
import { fetchJsonWithCorsProxy } from "./utils/corsProxy";
import { ImportModal, ImportMode } from "./components/app_specific/ImportModal";

// Helper function to generate unique molecule names when adding molecules
function getUniqueMoleculeName(existingNames: Set<string>, proposedName: string): string {
  if (!existingNames.has(proposedName)) {
    return proposedName;
  }
  // Check if the name already has a numeric suffix
  const suffixMatch = proposedName.match(/^(.+)_(\d+)$/);
  let baseName = proposedName;
  let counter = 1;
  
  if (suffixMatch) {
    baseName = suffixMatch[1];
    counter = parseInt(suffixMatch[2], 10) + 1;
  }
  
  // Find the next available number
  while (existingNames.has(`${baseName}_${counter}`)) {
    counter++;
  }
  return `${baseName}_${counter}`;
}

// Helper function to rename molecule references in basePairs structure
function renameMoleculeInBasePairs(
  basePairs: RnaComplex.BasePairs,
  oldName: string,
  newName: string
): RnaComplex.BasePairs {
  const newBasePairs: RnaComplex.BasePairs = {};
  
  for (const [molName, bpPerMol] of Object.entries(basePairs)) {
    const actualMolName = molName === oldName ? newName : molName;
    newBasePairs[actualMolName] = {};
    
    for (const [nucIdx, bpArray] of Object.entries(bpPerMol)) {
      newBasePairs[actualMolName][Number(nucIdx)] = bpArray.map(bp => ({
        ...bp,
        rnaMoleculeName: bp.rnaMoleculeName === oldName ? newName : bp.rnaMoleculeName
      }));
    }
  }
  
  return newBasePairs;
}

// Helper function to merge molecules from imported complex into existing complex
function mergeMoleculesIntoComplex(
  existingComplex: RnaComplex.ExternalProps,
  importedComplex: RnaComplex.ExternalProps
): { mergedComplex: RnaComplex.ExternalProps; renamedMolecules: Map<string, string> } {
  const existingMoleculeNames = new Set(Object.keys(existingComplex.rnaMoleculeProps));
  const renamedMolecules = new Map<string, string>();
  
  const mergedRnaMoleculeProps = { ...existingComplex.rnaMoleculeProps };
  let mergedBasePairs = { ...existingComplex.basePairs };
  
  // Process each molecule from the imported complex
  for (const [originalMolName, molProps] of Object.entries(importedComplex.rnaMoleculeProps)) {
    const uniqueName = getUniqueMoleculeName(existingMoleculeNames, originalMolName);
    
    if (uniqueName !== originalMolName) {
      renamedMolecules.set(originalMolName, uniqueName);
    }
    
    // Add the molecule with its unique name
    mergedRnaMoleculeProps[uniqueName] = molProps;
    existingMoleculeNames.add(uniqueName);
  }
  
  // Now process base pairs from the imported complex
  for (const [molName, bpPerMol] of Object.entries(importedComplex.basePairs)) {
    const actualMolName = renamedMolecules.get(molName) ?? molName;
    
    if (!mergedBasePairs[actualMolName]) {
      mergedBasePairs[actualMolName] = {};
    }
    
    for (const [nucIdxStr, bpArray] of Object.entries(bpPerMol)) {
      const nucIdx = Number(nucIdxStr);
      mergedBasePairs[actualMolName][nucIdx] = bpArray.map(bp => ({
        ...bp,
        rnaMoleculeName: renamedMolecules.get(bp.rnaMoleculeName) ?? bp.rnaMoleculeName
      }));
    }
  }
  
  return {
    mergedComplex: {
      name: existingComplex.name,
      rnaMoleculeProps: mergedRnaMoleculeProps,
      basePairs: mergedBasePairs,
      textAnnotations: { ...existingComplex.textAnnotations, ...importedComplex.textAnnotations }
    },
    renamedMolecules
  };
}

const VIEWPORT_SCALE_EXPONENT_MINIMUM = -50;
const VIEWPORT_SCALE_EXPONENT_MAXIMUM = 50;
const viewportScalePowPrecalculation: Record<number, number> = {};
for (
  let viewportScaleExponent = VIEWPORT_SCALE_EXPONENT_MINIMUM;
  viewportScaleExponent <= VIEWPORT_SCALE_EXPONENT_MAXIMUM;
  viewportScaleExponent++
) {
  viewportScalePowPrecalculation[viewportScaleExponent] = Math.pow(
    SCALE_BASE,
    viewportScaleExponent
  );
}

const FLOATING_CONTROLS_POSITION = { top: 80, right: 17 };

const createDefaultExportFileName = () => {
  const now = new Date();
  const pad = (value: number) => value.toString().padStart(2, "0");
  const compactStamp = [
    now.getFullYear().toString().slice(-2),
    pad(now.getMonth() + 1),
    pad(now.getDate()),
    "_",
    pad(now.getHours()),
    pad(now.getMinutes())
  ].join("");
  return `exo_${compactStamp}`;
};

const getDefaultExportFileName = () => createDefaultExportFileName();

type AboutShortcut = {
  shortcut: string;
  action: string;
};

const ABOUT_SHORTCUTS: AboutShortcut[] = [
  {
    shortcut: "Ctrl/cmd + O",
    action: "Open file picker",
  },
  {
    shortcut: "Ctrl/cmd + S",
    action: "Save",
  },
  {
    shortcut: "Ctrl/cmd + Shift + S",
    action: "Export as",
  },
  {
    shortcut: "Ctrl/cmd + 0",
    action: "Reset viewport",
  },
  {
    shortcut: "Left Click",
    action: "Select constraint",
  },
  {
    shortcut: "Right Click",
    action: "Open constraint menu",
  },
  {
    shortcut: "Ctrl/cmd + Z",
    action: "Undo change",
  },
  {
    shortcut: "Ctrl/cmd + Y",
    action: "Redo change",
  },
  {
    shortcut: "Middle Click",
    action: "Freeze selection",
  },
  {
    shortcut: "Ctrl/cmd + Click",
    action: "Break or create pair",
  },
  {
    shortcut: "Ctrl/cmd + Shift + Click",
    action: "Create & reposition pair",
  },
  {
    shortcut: "Shift + Click (on basepair)",
    action: "Recenter constraint",
  },
];

const ABOUT_SHORTCUTS_NOTE =
  "";

export const LEFT_PANEL_WIDTH = 420;

// Cookie helpers for canvas/grid settings persistence
const SETTINGS_COOKIE_PREFIX = 'exornata_setting_';
const COOKIE_MAX_AGE = 365 * 24 * 60 * 60; // 1 year in seconds

// Settings to persist in cookies
const PERSISTED_SETTINGS: Setting[] = [
  Setting.CANVAS_COLOR,
  Setting.GRID_ENABLED,
  Setting.GRID_HORIZONTAL_LINES,
  Setting.GRID_VERTICAL_LINES,
  Setting.GRID_LEFT_RIGHT_DIAGONAL,
  Setting.GRID_RIGHT_LEFT_DIAGONAL,
  Setting.GRID_CONCENTRIC_CIRCLES,
  Setting.GRID_DOTTED,
  Setting.GRID_SPACING,
  Setting.GRID_COLOR,
];

function getSettingFromCookie(setting: Setting): string | null {
  if (typeof document === 'undefined') return null;
  const cookies = document.cookie.split(';');
  for (const cookie of cookies) {
    const [name, value] = cookie.trim().split('=');
    if (name === `${SETTINGS_COOKIE_PREFIX}${setting}`) {
      return decodeURIComponent(value);
    }
  }
  return null;
}

function setSettingCookie(setting: Setting, value: string | number | boolean): void {
  if (typeof document === 'undefined') return;
  const encodedValue = encodeURIComponent(String(value));
  document.cookie = `${SETTINGS_COOKIE_PREFIX}${setting}=${encodedValue}; path=/; max-age=${COOKIE_MAX_AGE}; SameSite=Lax`;
}

function getInitialSettingsFromCookies(): Partial<SettingsRecord> {
  const cookieSettings: Partial<SettingsRecord> = {};
  for (const setting of PERSISTED_SETTINGS) {
    const cookieValue = getSettingFromCookie(setting);
    if (cookieValue !== null) {
      const settingType = settingsTypeMap[setting];
      if (settingType === 'boolean') {
        cookieSettings[setting] = cookieValue === 'true';
      } else if (settingType === 'number') {
        const numValue = parseFloat(cookieValue);
        if (!isNaN(numValue)) {
          cookieSettings[setting] = numValue;
        }
      } else {
        cookieSettings[setting] = cookieValue;
      }
    }
  }
  return cookieSettings;
}

export const PARENT_DIV_HTML_ID = "parent_div";
export const SVG_ELEMENT_HTML_ID = "viewport";
export const TEST_SPACE_ID = "testSpace";
export const MOUSE_OVER_TEXT_HTML_ID = "mouse_over_text_group";
export const VIEWPORT_SCALE_GROUP_0_HTML_ID = "viewport_scale_group_0";
export const VIEWPORT_SCALE_GROUP_1_HTML_ID = "viewport_scale_group_1";
export const VIEWPORT_TRANSLATE_GROUP_0_HTML_ID = "viewport_translate_group_0";
export const VIEWPORT_TRANSLATE_GROUP_1_HTML_ID = "viewport_translate_group_1";
export const SVG_BACKGROUND_HTML_ID = "svg_background";
export const SVG_SCENE_GROUP_HTML_ID = "svg_scene_group";
export const MARGIN_LEFT = 7;

export const NUCLEOTIDE_CLASS_NAME = "nucleotide";
export const BASE_PAIR_CLASS_NAME = "basePair";
export const LABEL_CLASS_NAME = "label";
export const NO_STROKE_CLASS_NAME = "noStroke";

// Begin externally-facing constants.
export const HTML_ELEMENT_ID_DELIMITER = "|";

// Begin types.
export type RnaComplexKey = number;
export type RnaMoleculeKey = string;
export type NucleotideKey = number;
export type FullKeys = {
  rnaComplexIndex: RnaComplexKey;
  rnaMoleculeName: RnaMoleculeKey;
  nucleotideIndex: NucleotideKey;
};
export type FullKeysRecord = Record<
  RnaComplexKey,
  Record<RnaMoleculeKey, Set<NucleotideKey>>
>;
export type DragListener = {
  initiateDrag: () => Vector2D;
  continueDrag: (
    totalDrag: Vector2D,
    reposiitonAnnotationsFlag: boolean
  ) => void;
  terminateDrag?: () => void;
};
export type RnaComplexProps = Record<RnaComplexKey, RnaComplex.ExternalProps>;
enum UndoRedoStacksDataTypes {
  IndicesOfFrozenNucleotides = "IndicesOfFrozenNucleotides",
  RnaComplexProps = "RnaComplexProps",
}
export type UndoRedoStack = Array<FullKeysRecord | { rnaComplexProps : RnaComplexProps, globalHelicesForFormatMenu : Array<Helix> }>;

enum SceneState {
  URL_PARSING_ERROR = "URL parsing error",
  NO_DATA = "No data",
  DATA_IS_LOADING = "Data is loading",
  DATA_IS_LOADED = "Data is loaded",
  DATA_LOADING_FAILED = "Data loading failed",
}
// Begin app-specific constants.
const DIV_BUFFER_DIMENSION = 2;
const MOUSE_OVER_TEXT_FONT_SIZE = 20;
const strokesPerTab: Record<InteractionConstraint.SupportedTab, string> = {
  [Tab.EDIT]: "red",
  [Tab.FORMAT]: "blue",
  [Tab.ANNOTATE]: "rgb(0,110,51)",
};

export namespace App {
  export type Props = {
    r2dtLegacyVersionFlag: boolean;
  };

  export function Component(props: Props) {
    const { r2dtLegacyVersionFlag } = props;
    // Begin state data.
    const [complexDocumentName, setComplexDocumentName] = useState("");
    const [rnaComplexProps, setRnaComplexProps] = useState<RnaComplexProps>({});
    const [flattenedRnaComplexPropsLength, setFlattenedRnaComplexPropsLength] =
      useState<number>(0);
    const [inputFileNameAndExtension, setInputFileNameAndExtension] =
      useState("");
    const [outputFileName, setOutputFileName] = useState<string>("");
    const [outputFileExtension, setOutputFileExtension] = useState<
      OutputFileExtension | undefined
    >(OutputFileExtension.json);
    type SceneBounds = {
      x: number;
      y: number;
      width: number;
      height: number;
    };
    const [sceneBounds, setSceneBounds] = useState<SceneBounds>({
      x: 0,
      y: 0,
      width: 1,
      height: 1,
    });
    const [basePairKeysToEdit, setBasePairKeysToEdit] = useState<
      Record<RnaComplexKey, Context.BasePair.KeysToEditPerRnaComplex>
    >({});
    const [labelsOnlyFlag, setLabelsOnlyFlag] = useState(false);
    const [indicesOfFrozenNucleotides, setIndicesOfFrozenNucleotides] =
      useState<FullKeysRecord>({});
    const [undoStack, setUndoStack] = useState<UndoRedoStack>([]);
    const [redoStack, setRedoStack] = useState<UndoRedoStack>([]);
    // Import Modal state
    const [importModalOpen, setImportModalOpen] = useState(false);
    const [importModalError, setImportModalError] = useState<string | undefined>(undefined);
    // Begin UI-relevant state data.
    const [tab, setTab] = useState<Tab>(Tab.EDIT);
    const currentTabRef = useRef<Tab>(Tab.EDIT);

    // Update ref whenever tab changes
    useEffect(() => {
      currentTabRef.current = tab;
    }, [tab]);

    // Keyboard shortcut for freeze/unfreeze (F key)
    useEffect(() => {
      const handleKeyDown = (event: KeyboardEvent) => {
        // Only handle F key when not in input fields
        if (event.key === 'f' || event.key === 'F') {
          const target = event.target as HTMLElement;
          if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
            return; // Don't handle F key in input fields
          }
          
          event.preventDefault();
          
          const rightClickMenuAffectedNucleotideIndices = rightClickMenuAffectedNucleotideIndicesReference.current!;
          const indicesOfFrozenNucleotides = indicesOfFrozenNucleotidesReference.current!;
          
          const hasSelectedNucleotides = Object.keys(rightClickMenuAffectedNucleotideIndices).length > 0;
          if (!hasSelectedNucleotides) return;
          
          // Check if any selected nucleotides are frozen
          let hasFrozenSelected = false;
          for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
            const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
            if (rnaComplexIndex in indicesOfFrozenNucleotides) {
              for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                if (rnaMoleculeName in indicesOfFrozenNucleotides[rnaComplexIndex]) {
                  for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                    if (indicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].has(nucleotideIndex)) {
                      hasFrozenSelected = true;
                      break;
                    }
                  }
                }
                if (hasFrozenSelected) break;
              }
            }
            if (hasFrozenSelected) break;
          }
          
          // Toggle freeze state
          if (hasFrozenSelected) {
            // Unfreeze selected nucleotides
            const newIndicesOfFrozenNucleotides = structuredClone(indicesOfFrozenNucleotides);
            
            for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
              const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
              if (rnaComplexIndex in newIndicesOfFrozenNucleotides) {
                for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                  if (rnaMoleculeName in newIndicesOfFrozenNucleotides[rnaComplexIndex]) {
                    for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                      newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].delete(nucleotideIndex);
                    }
                    
                    // Clean up empty sets
                    if (newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].size === 0) {
                      delete newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName];
                    }
                  }
                }
                
                // Clean up empty objects
                if (Object.keys(newIndicesOfFrozenNucleotides[rnaComplexIndex]).length === 0) {
                  delete newIndicesOfFrozenNucleotides[rnaComplexIndex];
                }
              }
            }
            
            setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
          } else {
            // Freeze selected nucleotides
            const newIndicesOfFrozenNucleotides = structuredClone(indicesOfFrozenNucleotides);
            
            for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
              const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
              if (!(rnaComplexIndex in newIndicesOfFrozenNucleotides)) {
                newIndicesOfFrozenNucleotides[rnaComplexIndex] = {};
              }
              
              for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                if (!(rnaMoleculeName in newIndicesOfFrozenNucleotides[rnaComplexIndex])) {
                  newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName] = new Set<number>();
                }
                
                for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                  newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].add(nucleotideIndex);
                }
              }
            }
            
            setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
          }
          
          // Add to undo stack
          const undoStack = undoStackReference.current!;
          setUndoStack([
            ...undoStack,
            structuredClone(indicesOfFrozenNucleotides)
          ]);
          setRedoStack([]);
        }
      };
      
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);
    const [interactionConstraint, setInteractionConstraint] = useState<
      InteractionConstraint.Enum | undefined
    >(InteractionConstraint.Enum.SINGLE_NUCLEOTIDE);
    const [settingsRecord, setSettingsRecord] =
      useState<SettingsRecord>(() => {
        // Initialize with defaults, then override with cookie values
        const cookieSettings = getInitialSettingsFromCookies();
        return { ...DEFAULT_SETTINGS, ...cookieSettings };
      });
    
    // Save persisted settings to cookies when they change
    useEffect(() => {
      for (const setting of PERSISTED_SETTINGS) {
        setSettingCookie(setting, settingsRecord[setting]);
      }
    }, [settingsRecord]);
    
    const [rightClickMenuContent, _setRightClickMenuContent] = useState(<></>);
    const [nucleotideKeysToRerender, setNucleotideKeysToRerender] =
      useState<NucleotideKeysToRerender>({});
    const [basePairKeysToRerender, setBasePairKeysToRerender] =
      useState<BasePairKeysToRerender>({});
    const [sceneState, setSceneState] = useState(SceneState.NO_DATA);
    const [mouseOverText, setMouseOverText] = useState("");
    const [mouseOverTextDimensions, setMouseOverTextDimensions] = useState<{
      width: number;
      height: number;
    }>({
      width: 0,
      height: 0,
    });
    const [mouseUIPosition, setMouseUIPosition] = useState<Vector2D>({
      x: 0,
      y: 0,
    });
    const [originOfDrag, setOriginOfDrag] = useState<Vector2D>({
      x: 0,
      y: 0,
    });
    const [dataSpaceOriginOfDrag, setDataSpaceOriginOfDrag] = useState<
      Vector2D | undefined
    >(undefined);
    const [dragCache, setDragCache] = useState<Vector2D>({
      x: 0,
      y: 0,
    });
    const [dragListener, _setDragListener] = useState<DragListener | null>(
      null
    );
    const [resetOrientationDataTrigger, setResetOrientationDataTrigger] =
      useState(false);
    const [downloadButtonErrorMessage, setDownloadButtonErrorMessage] =
      useState<string>("");
    const [urlParsingErrorMessage, setUrlParsingErrorMessage] =
      useState<string>("");
    const [dataLoadingFailedErrorMessage, setDataLoadingFailedErrorMessage] =
      useState<string>("");
    const [dataLoadingFailedErrorDetails, setDataLoadingFailedErrorDetails] =
      useState<string>("");
    const [interactionConstraintOptions, setInteractionConstraintOptions] =
      useState(InteractionConstraint.DEFAULT_OPTIONS);
    const [rightClickMenuOptionsMenu, setRightClickMenuOptionsMenu] = useState(
      <></>
    );
    type BasePairAverageDistances = Record<
      RnaComplexKey,
      Context.BasePair.AllDistances
    >;
    const [basePairAverageDistances, setBasePairAverageDistances] =
      useState<BasePairAverageDistances>({});
    type LabelContentStyles = Record<
      RnaComplexKey,
      Record<RnaMoleculeKey, Context.Label.Content.Style>
    >;
    const [labelContentDefaultStyles, setLabelContentDefaultStyles] =
      useState<LabelContentStyles>({});
    const [
      rightClickMenuAffectedNucleotideIndices,
      setRightClickMenuAffectedNucleotideIndices,
    ] = useState<FullKeysRecord>({});
    const [
      dragListenerAffectedNucleotideIndices,
      setDragListenerAffectedNucleotideIndices,
    ] = useState<FullKeysRecord>({});
    const [
      autoDetectedInteractionConstraintMessage,
      setAutoDetectedInteractionConstraintMessage,
    ] = useState<"" | "Auto-detected">("");
    const [pendingPairNucleotide, setPendingPairNucleotide] = useState<
      FullKeys | undefined
    >(undefined);
    const [pendingConnectorSource, setPendingConnectorSource] = useState<
      FullKeys | undefined
    >(undefined);
    // Begin viewport-relevant state data.
    const [viewportTranslateX, setViewportTranslateX] = useState(0);
    const [viewportTranslateY, setViewportTranslateY] = useState(0);
    const [viewportScale, setViewportScale] = useState(1);
    const [viewportScaleExponent, setViewportScaleExponent] = useState(0);
    const [debugVisualElements, setDebugVisualElements] = useState<
      Array<JSX.Element>
    >([]);
    const [outputFileHandle, setOutputFileHandle] = useState<any>(undefined);
    const [averageNucleotideBoundingRectHeight, setAverageNucleotideBoundingRectHeight] = useState<number>(0);
    const [basePairRadius, setBasePairRadius] = useState<number>(0);
    enum DrawerKind {
      NONE = "none",
      PROPERTIES = "properties",
      BASEPAIR = "basepair",
      BASE_PAIR_EDITOR = "basePairEditor",
      SETTINGS = "settings",
      ABOUT = "about"
    };
    const [drawerKind, setDrawerKind] = useState<DrawerKind>(DrawerKind.NONE);
    const [basepairSheetOpen, setBasepairSheetOpen] = useState<boolean>(false);
    const [rightDrawerTitle, setRightDrawerTitle] = useState<string>("");
    const [selectedElementInfo, setSelectedElementInfo] = useState<
      ElementInfo | undefined
    >(undefined);
    const [basePairUpdateTriggers, setBasePairUpdateTriggers] = useState<
      Record<number, number>
    >({});
    const [globalHelicesForFormatMenu, setGlobalHelicesForFormatMenu] = useState<Array<Helix>>([]);
    const globalHelicesForFormatMenuReference = useRef(globalHelicesForFormatMenu);
    globalHelicesForFormatMenuReference.current = globalHelicesForFormatMenu;
    const [formatMenuErrorMessage, setFormatMenuErrorMessage] = useState<string | undefined>(undefined);
    // Initialize with identity function that returns all helices unchanged
    const [constrainRelevantHelices, setConstrainRelevantHelices] = useState<(helices: Array<Helix>) => Array<Helix>>(() => (helices: Array<Helix>) => helices);
    const constrainRelevantHelicesReference = useRef<(helices: Array<Helix>) => Array<Helix>>(constrainRelevantHelices);
    constrainRelevantHelicesReference.current = constrainRelevantHelices;
    const [unsavedWorkFlag, setUnsavedWorkFlag] = useState(false);
    const unsavedWorkFlagReference = useRef(unsavedWorkFlag);
    unsavedWorkFlagReference.current = unsavedWorkFlag;
    const [xKeyPressedFlag, setXKeyPressedFlag] = useState(false);
    const xKeyPressedFlagReference = useRef(xKeyPressedFlag);
    xKeyPressedFlagReference.current = xKeyPressedFlag;
    // Begin state-relevant helper functions.
    function setDragListener(
      dragListener: DragListener | null,
      newDragListenerAffectedNucleotideIndices: FullKeysRecord
    ) {
      if (dragListener !== null) {
        setDragCache(dragListener.initiateDrag());
      }
      _setDragListener(dragListener);
      setDragListenerAffectedNucleotideIndices(
        newDragListenerAffectedNucleotideIndices
      );
    }
    // Begin reference data.
    const downloadOutputFileHtmlButtonReference = useRef<HTMLButtonElement>(null);
    const mouseOverTextSvgTextElementReference = createRef<SVGTextElement>();
    const parentDivResizeDetector = useResizeDetector();
    const interactionConstraintReference = useRef<
      InteractionConstraint.Enum | undefined
    >(interactionConstraint);
    interactionConstraintReference.current = interactionConstraint;
    const tabReference = useRef<Tab>();
    tabReference.current = tab;
    const viewportTranslateXReference = useRef<number>(NaN);
    viewportTranslateXReference.current = viewportTranslateX;
    const viewportTranslateYReference = useRef<number>(NaN);
    viewportTranslateYReference.current = viewportTranslateY;
    const rnaComplexPropsReference = useRef<RnaComplexProps>();
    rnaComplexPropsReference.current = rnaComplexProps;
    const sceneSvgGElementReference = useRef<SVGGElement>();
    const interactionConstraintOptionsReference =
      useRef<InteractionConstraint.Options>();
    interactionConstraintOptionsReference.current =
      interactionConstraintOptions;
    const basePairAverageDistancesReference =
      useRef<BasePairAverageDistances>();
    basePairAverageDistancesReference.current = basePairAverageDistances;
    const labelContentDefaultStylesReference = useRef<LabelContentStyles>();
    labelContentDefaultStylesReference.current = labelContentDefaultStyles;
    const dragListenerReference = useRef<DragListener | null>();
    dragListenerReference.current = dragListener;
    const originOfDragReference = useRef<Vector2D>();
    originOfDragReference.current = originOfDrag;
    const dragCacheReference = useRef<Vector2D>();
    dragCacheReference.current = dragCache;
    const sceneBoundsScaleMinReference = useRef<number>();
    const viewportScaleReference = useRef<number>();
    viewportScaleReference.current = viewportScale;
    const repositionAnnotationsFlagReference = useRef<boolean>();
    const triggerRightClickMenuFlagReference = useRef<boolean>();
    const viewportScaleExponentReference = useRef<number>();
    viewportScaleExponentReference.current = viewportScaleExponent;
    type TotalScale = {
      positiveScale: number;
      negativeScale: number;
      asTransform: string[];
    };
    const totalScaleReference = useRef<TotalScale>();
    const sceneBoundsReference = useRef<SceneBounds>();
    sceneBoundsReference.current = sceneBounds;
    const resetOrientationDataTriggerReference = useRef<boolean>();
    resetOrientationDataTriggerReference.current = resetOrientationDataTrigger;
    const rightClickMenuOptionsMenuReference = useRef<JSX.Element>();
    rightClickMenuOptionsMenuReference.current = rightClickMenuOptionsMenu;
    const settingsRecordReference = useRef<SettingsRecord>();
    settingsRecordReference.current = settingsRecord;
    const outputFileNameReference = useRef<string>();
    outputFileNameReference.current = outputFileName;
    const outputFileExtensionReference = useRef<
      OutputFileExtension | undefined
    >();
    outputFileExtensionReference.current = outputFileExtension;
    const defaultExportFileNameRef = useRef<string | null>(null);
    const downloadButtonErrorMessageReference = useRef<string>();
    downloadButtonErrorMessageReference.current = downloadButtonErrorMessage;
    const uploadInputFileHtmlInputReference = useRef<HTMLInputElement>(null);
    const flattenedRnaComplexPropsLengthReference = useRef<number>(0);
    flattenedRnaComplexPropsLengthReference.current =
      flattenedRnaComplexPropsLength;
    const transformTranslate0Reference = useRef<{
      asVector: Vector2D;
      asString: string;
    }>();
    const transformTranslate1Reference = useRef<{
      asVector: Vector2D;
      asString: string;
    }>();
    const dataSpaceOriginOfDragReference = useRef<Vector2D>();
    dataSpaceOriginOfDragReference.current = dataSpaceOriginOfDrag;
    const flattenedRnaComplexPropsReference =
      useRef<Array<[string, RnaComplex.ExternalProps]>>();
    const inputFileNameAndExtensionReference = useRef<string>();
    const indicesOfFrozenNucleotidesReference =
      useRef<typeof indicesOfFrozenNucleotides>();
    indicesOfFrozenNucleotidesReference.current = indicesOfFrozenNucleotides;
    const rightClickMenuAffectedNucleotideIndicesReference =
      useRef<typeof rightClickMenuAffectedNucleotideIndices>();
    rightClickMenuAffectedNucleotideIndicesReference.current =
      rightClickMenuAffectedNucleotideIndices;
    const undoStackReference = useRef<typeof undoStack>();
    undoStackReference.current = undoStack;
    const redoStackReference = useRef<typeof redoStack>();
    redoStackReference.current = redoStack;
    const basePairKeysToEditReference = useRef<typeof basePairKeysToEdit>();
    basePairKeysToEditReference.current = basePairKeysToEdit;
    const complexDocumentNameReference = useRef<typeof complexDocumentName>();
    complexDocumentNameReference.current = complexDocumentName;
    const outputFileHandleReference = useRef<typeof outputFileHandle>();
    outputFileHandleReference.current = outputFileHandle;
    const pendingPairNucleotideReference = useRef<FullKeys | undefined>();
    pendingPairNucleotideReference.current = pendingPairNucleotide;
    const pendingConnectorSourceReference = useRef<FullKeys | undefined>();
    pendingConnectorSourceReference.current = pendingConnectorSource;

    useEffect(() => {
      if (isEmpty(rnaComplexProps)) {
        defaultExportFileNameRef.current = null;
        if (outputFileName !== "") {
          setOutputFileName("");
          outputFileNameReference.current = "";
        }
        return;
      }

    }, [rnaComplexProps]);

    useEffect(() => {
      if (!isEmpty(rnaComplexProps) && outputFileExtension === undefined) {
        setOutputFileExtension(OutputFileExtension.json);
        outputFileExtensionReference.current = OutputFileExtension.json;
      }
    }, [rnaComplexProps, outputFileExtension]);

    const outputFileWritersMap = r2dtLegacyVersionFlag
      ? outputFileWritersMapAbsoluteJsonCoordinates
      : outputFileWritersMapRelativeJsonCoordinates;
    // Begin memo data.
    const viewportDragListener: DragListener = useMemo(function () {
      return {
        initiateDrag() {
          return {
            x: viewportTranslateXReference.current,
            y: viewportTranslateYReference.current,
          };
        },
        continueDrag(totalDrag: Vector2D) {
          setViewportTranslateX(totalDrag.x);
          setViewportTranslateY(totalDrag.y);
        },
      };
    }, []);
    const flattenedRnaComplexProps = useMemo(
      function () {
        const flattenedRnaComplexProps = Object.entries(rnaComplexProps);
        setFlattenedRnaComplexPropsLength(flattenedRnaComplexProps.length);
        flattenedRnaComplexPropsReference.current = flattenedRnaComplexProps;
        return flattenedRnaComplexProps;
      },
      [rnaComplexProps]
    );
    const svgWidth = useMemo(
      () => Math.max((parentDivResizeDetector.width ?? 0) - LEFT_PANEL_WIDTH, 0),
      [
        parentDivResizeDetector.width,
        LEFT_PANEL_WIDTH
      ]
    );
    const svgHeight = useMemo(
      () => Math.max((parentDivResizeDetector.height ?? 0) - TOPBAR_HEIGHT, 0),
      [
        parentDivResizeDetector.height,
        TOPBAR_HEIGHT
      ]
    );
    const sceneDimensionsReciprocals = useMemo(
      function () {
        return {
          width: 1 / (sceneBounds.width + MARGIN_LEFT),
          height: 1 / sceneBounds.height,
        };
      },
      [sceneBounds]
    );
    const sceneBoundsScaleMin = useMemo(
      function () {
        (window as any).widthScale = svgWidth;
        (window as any).heightScale = svgHeight;
        return Math.min(
          svgWidth * sceneDimensionsReciprocals.width,
          svgHeight * sceneDimensionsReciprocals.height
        );
      },
      [
        svgWidth,
        svgHeight,
        sceneDimensionsReciprocals
      ]
    );
    sceneBoundsScaleMinReference.current = sceneBoundsScaleMin;
    const transformTranslate0 = useMemo(
      function () {
        const asVector = {
          x: -sceneBounds.x,
          y: -(sceneBounds.y + sceneBounds.height),
        };
        const returnValue = {
          asVector,
          asString: `translate(${asVector.x}, ${asVector.y})`,
        };
        transformTranslate0Reference.current = returnValue;
        return returnValue;
      },
      [sceneBounds]
    );
    const transformTranslate1 = useMemo(
      function () {
        const asVector = {
          x: viewportTranslateX,
          y: viewportTranslateY,
        };
        const returnValue = {
          asVector,
          asString: `translate(${asVector.x}, ${asVector.y})`,
        };
        transformTranslate1Reference.current = returnValue;
        return returnValue;
      },
      [viewportTranslateX, viewportTranslateY]
    );
    const totalScale: TotalScale = useMemo(
      function () {
        const positiveScale = viewportScale * sceneBoundsScaleMin;
        return {
          positiveScale,
          negativeScale: 1 / positiveScale,
          asTransform: [
            `scale(${sceneBoundsScaleMin})`,
            `scale(${viewportScale})`,
          ],
        };
      },
      [viewportScale, sceneBoundsScaleMin]
    );
    totalScaleReference.current = totalScale;
    const pendingPairOverlayElement = useMemo(function () {
      if (!pendingPairNucleotide) return null;
      const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } =
        pendingPairNucleotide;
      const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
      if (!rnaComplexProps || !(rnaComplexIndex in rnaComplexProps)) return null;
      const complex = rnaComplexProps[rnaComplexIndex];
      const mol = complex.rnaMoleculeProps[rnaMoleculeName];
      if (!mol || !(nucleotideIndex in mol.nucleotideProps)) return null;
      const np = mol.nucleotideProps[nucleotideIndex];
      const r = Math.max(basePairRadius * 1.5, DEFAULT_STROKE_WIDTH * 6);
      return (
        <g>
          {/* Outer glow effect */}
          <circle
            cx={np.x}
            cy={np.y}
            r={r + 1}
            fill="rgba(99, 102, 241, 0.12)"
            stroke="rgba(99, 102, 241, 0.25)"
            strokeWidth={1}
            pointerEvents="none"
          />
          {/* Main highlight circle */}
          <circle
            cx={np.x}
            cy={np.y}
            r={r}
            fill="rgba(99, 102, 241, 0.15)"
            stroke="none"
            strokeWidth={0}
            opacity={0.8}
            pointerEvents="none"
          />
        </g>
      );
    }, [pendingPairNucleotide, basePairRadius]);
    const labelOnMouseDownRightClickHelper = useMemo(function () {
      return function (
        fullKeys: FullKeys,
        interactionConstraint = interactionConstraintReference.current
      ) {
        switch (tabReference.current) {
          case Tab.EDIT: {
            if (
              interactionConstraint === undefined ||
              !InteractionConstraint.isEnum(interactionConstraint)
            ) {
              setRightClickMenuContent(
                <b
                  style={{
                    color: "red",
                  }}
                >
                  Select a constraint first!
                </b>,
                {}
              );
              return;
            }
            const rnaComplexProps =
              rnaComplexPropsReference.current as RnaComplexProps;
            const interactionConstraintOptions =
              interactionConstraintOptionsReference.current!;
            try {
              const indicesOfFrozenNucleotides =
                indicesOfFrozenNucleotidesReference.current!;
              const helper = new InteractionConstraint.record[
                interactionConstraint
              ](
                rnaComplexProps,
                setNucleotideKeysToRerender,
                setBasePairKeysToRerender,
                setDebugVisualElements,
                tab,
                indicesOfFrozenNucleotides,
                interactionConstraintOptions,
                fullKeys
              );
              setRightClickMenuContent(
                <LabelEditMenu.Component
                  rnaComplexProps={rnaComplexProps}
                  indicesOfAffectedNucleotides={
                    helper.indicesOfAffectedNucleotides
                  }
                  setNucleotideKeysToRerender={setNucleotideKeysToRerender}
                />,
                helper.indicesOfAffectedNucleotides
              );
            } catch (error: any) {
              if (typeof error === "object" && "errorMessage" in error) {
                setDrawerKind(DrawerKind.PROPERTIES);
                setRightClickMenuContent(
                  <b
                    style={{
                      color: "red",
                    }}
                  >
                    {error.errorMessage}
                  </b>,
                  {}
                );
              } else {
                throw error;
              }
            }
            break;
          }
        }
      };
    }, []);
    const labelContentOnMouseDownHelper = useMemo(function () {
      return function (
        e: React.MouseEvent<LabelContent.SvgRepresentation>,
        fullKeys: FullKeys
      ) {
        const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } = fullKeys;
        
        // Check for Ctrl+click to delete annotation
        if (e.ctrlKey && e.button === MouseButtonIndices.Left) {
          e.preventDefault();
          e.stopPropagation();
          
          pushToUndoStack();
          const singularNucleotideProps = (
            rnaComplexPropsReference.current as RnaComplexProps
          )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName]
            .nucleotideProps[nucleotideIndex];
          
          // Delete both label content and label line
          let hasChanges = false;
          if (singularNucleotideProps.labelContentProps !== undefined) {
            delete singularNucleotideProps.labelContentProps;
            hasChanges = true;
          }
          if (singularNucleotideProps.labelLineProps !== undefined) {
            delete singularNucleotideProps.labelLineProps;
            hasChanges = true;
          }
          
          if (hasChanges) {
            setNucleotideKeysToRerender({
              [rnaComplexIndex]: {
                [rnaMoleculeName]: [nucleotideIndex],
              },
            });
          }
          return;
        }
        
        switch (e.button) {
          case MouseButtonIndices.Left: {
            let newDragListener: DragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT) {
              const singularNucleotideProps = (
                rnaComplexPropsReference.current as RnaComplexProps
              )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName]
                .nucleotideProps[nucleotideIndex];
              const labelContentProps = singularNucleotideProps.labelContentProps;
              // Only set up drag listener if labelContentProps exists
              if (labelContentProps !== undefined) {
                newDragListener = {
                  initiateDrag() {
                    return {
                      x: labelContentProps.x,
                      y: labelContentProps.y,
                    };
                  },
                  continueDrag(totalDrag: Vector2D) {
                    singularNucleotideProps.labelContentProps = {
                      ...labelContentProps,
                      ...totalDrag,
                    };
                    labelContentProps.x = totalDrag.x;
                    labelContentProps.y = totalDrag.y;
                    setNucleotideKeysToRerender({
                      [rnaComplexIndex]: {
                        [rnaMoleculeName]: [nucleotideIndex],
                      },
                    });
                  },
                };
              }
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(newDragListener, {
              [rnaComplexIndex]: {
                [rnaMoleculeName]: setPerRnaMolecule,
              },
            });
            break;
          }
          case MouseButtonIndices.Right: {
            labelOnMouseDownRightClickHelper(fullKeys);
            break;
          }
        }
      };
    }, []);
    const labelLineBodyOnMouseDownHelper = useMemo(function () {
      return function (
        e: React.MouseEvent<LabelLine.BodySvgRepresentation>,
        fullKeys: FullKeys,
        helper: () => void
      ) {
        const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } = fullKeys;
        
        // Check for Ctrl+click to delete annotation
        if (e.ctrlKey && e.button === MouseButtonIndices.Left) {
          e.preventDefault();
          e.stopPropagation();
          
          pushToUndoStack();
          const singularNucleotideProps = (
            rnaComplexPropsReference.current as RnaComplexProps
          )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
            nucleotideIndex
          ];
          
          // Delete both label content and label line
          let hasChanges = false;
          if (singularNucleotideProps.labelContentProps !== undefined) {
            delete singularNucleotideProps.labelContentProps;
            hasChanges = true;
          }
          if (singularNucleotideProps.labelLineProps !== undefined) {
            delete singularNucleotideProps.labelLineProps;
            hasChanges = true;
          }
          
          if (hasChanges) {
            setNucleotideKeysToRerender({
              [rnaComplexIndex]: {
                [rnaMoleculeName]: [nucleotideIndex],
              },
            });
          }
          return;
        }
        
        const singularNucleotideProps = (
          rnaComplexPropsReference.current as RnaComplexProps
        )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
          nucleotideIndex
        ];
        const labelLineProps = singularNucleotideProps.labelLineProps;
        // Only proceed if labelLineProps exists
        if (labelLineProps === undefined) {
          return;
        }
        switch (e.button) {
          case MouseButtonIndices.Left: {
            let newDragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT) {
              const point0 = labelLineProps.points[0];
              const displacementsPerPoint = labelLineProps.points.map(function (
                point
              ) {
                return subtract(point, point0);
              });
              newDragListener = {
                initiateDrag() {
                  return {
                    x: point0.x,
                    y: point0.y,
                  };
                },
                continueDrag(totalDrag) {
                  for (let i = 0; i < labelLineProps.points.length; i++) {
                    const point = labelLineProps.points[i];
                    const newPosition = add(
                      totalDrag,
                      displacementsPerPoint[i]
                    );
                    point.x = newPosition.x;
                    point.y = newPosition.y;
                  }
                  helper();
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName]: [nucleotideIndex],
                    },
                  });
                },
              };
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(newDragListener, {
              [rnaComplexIndex]: {
                [rnaMoleculeName]: setPerRnaMolecule,
              },
            });
            break;
          }
          case MouseButtonIndices.Right: {
            labelOnMouseDownRightClickHelper(fullKeys);
            break;
          }
        }
      };
    }, []);
    const labelLineEndpointOnMouseDownHelper = useMemo(function () {
      return function (
        e: React.MouseEvent<LabelLine.EndpointSvgRepresentation>,
        fullKeys: FullKeys,
        pointIndex: number,
        helper: () => void
      ) {
        const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } = fullKeys;
        
        // Check for Ctrl+click to delete annotation
        if (e.ctrlKey && e.button === MouseButtonIndices.Left) {
          e.preventDefault();
          e.stopPropagation();
          
          pushToUndoStack();
          const singularNucleotideProps = (
            rnaComplexPropsReference.current as RnaComplexProps
          )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
            nucleotideIndex
          ];
          
          // Delete both label content and label line
          let hasChanges = false;
          if (singularNucleotideProps.labelContentProps !== undefined) {
            delete singularNucleotideProps.labelContentProps;
            hasChanges = true;
          }
          if (singularNucleotideProps.labelLineProps !== undefined) {
            delete singularNucleotideProps.labelLineProps;
            hasChanges = true;
          }
          
          if (hasChanges) {
            setNucleotideKeysToRerender({
              [rnaComplexIndex]: {
                [rnaMoleculeName]: [nucleotideIndex],
              },
            });
          }
          return;
        }
        
        const singularNucleotideProps = (
          rnaComplexPropsReference.current as RnaComplexProps
        )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
          nucleotideIndex
        ];
        const labelLineProps = singularNucleotideProps.labelLineProps;
        // Only proceed if labelLineProps exists
        if (labelLineProps === undefined) {
          return;
        }
        switch (e.button) {
          case MouseButtonIndices.Left: {
            let newDragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT) {
              const point = labelLineProps.points[pointIndex];
              newDragListener = {
                initiateDrag() {
                  return {
                    x: point.x,
                    y: point.y,
                  };
                },
                continueDrag(totalDrag) {
                  point.x = totalDrag.x;
                  point.y = totalDrag.y;
                  helper();
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName]: [nucleotideIndex],
                    },
                  });
                },
              };
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(newDragListener, {
              [rnaComplexIndex]: {
                [rnaMoleculeName]: setPerRnaMolecule,
              },
            });
            break;
          }
          case MouseButtonIndices.Right: {
            if (tabReference.current === Tab.EDIT) {
              labelOnMouseDownRightClickHelper(fullKeys);
            }
            break;
          }
        }
      };
    }, []);
    
    // Sequence Connector handlers
    const sequenceConnectorBodyOnMouseDownHelper = useMemo(function() {
      return function(
        e: React.MouseEvent<SVGPathElement>,
        fullKeys: FullKeys,
        updateRenderData: () => void
      ) {
        const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } = fullKeys;
        
        const singularNucleotideProps = (
          rnaComplexPropsReference.current as RnaComplexProps
        )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
          nucleotideIndex
        ];
        const connector = singularNucleotideProps.sequenceConnectorToNext;
        if (!connector) return;
        
        switch (e.button) {
          case MouseButtonIndices.Left: {
            // Ctrl+click to add a new breakpoint at click location
            if (e.ctrlKey && tabReference.current === Tab.EDIT) {
              e.preventDefault();
              e.stopPropagation();
              
              pushToUndoStack();
              
              // Transform screen coordinates to data space
              const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
              const viewportScale = viewportScaleReference.current as number;
              const transformTranslate0 = transformTranslate0Reference.current!;
              const transformTranslate1 = transformTranslate1Reference.current!;
              
              let transformedCoordinates = { x: e.clientX, y: e.clientY };
              transformedCoordinates.x -= LEFT_PANEL_WIDTH;
              transformedCoordinates = scaleDown(
                transformedCoordinates,
                sceneBoundsScaleMin * viewportScale
              );
              transformedCoordinates.y -= TOPBAR_HEIGHT;
              transformedCoordinates.y = -transformedCoordinates.y;
              transformedCoordinates = subtract(
                transformedCoordinates,
                add(transformTranslate0.asVector, transformTranslate1.asVector)
              );
              
              // Get start and end points
              const startNuc = singularNucleotideProps;
              const nextNuc = (rnaComplexPropsReference.current as RnaComplexProps)
                [rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex + 1];
              
              if (!nextNuc) return;
              
              const start = { x: startNuc.x, y: startNuc.y };
              const end = { x: nextNuc.x, y: nextNuc.y };
              const breakpoints = connector.breakpoints ?? [];
              const allPoints = [start, ...breakpoints, end];
              
              // Find closest segment to insert breakpoint
              let minDist = Infinity;
              let insertIndex = 0;
              
              for (let i = 0; i < allPoints.length - 1; i++) {
                const p1 = allPoints[i];
                const p2 = allPoints[i + 1];
                // Calculate distance from point to line segment
                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const len2 = dx * dx + dy * dy;
                let t = Math.max(0, Math.min(1, ((transformedCoordinates.x - p1.x) * dx + (transformedCoordinates.y - p1.y) * dy) / len2));
                const projX = p1.x + t * dx;
                const projY = p1.y + t * dy;
                const dist = Math.sqrt((transformedCoordinates.x - projX) ** 2 + (transformedCoordinates.y - projY) ** 2);
                if (dist < minDist) {
                  minDist = dist;
                  insertIndex = i;
                }
              }
              
              // Insert new breakpoint
              if (!connector.breakpoints) {
                connector.breakpoints = [];
              }
              connector.breakpoints.splice(insertIndex, 0, { x: transformedCoordinates.x, y: transformedCoordinates.y });
              
              updateRenderData();
              setNucleotideKeysToRerender({
                [rnaComplexIndex]: {
                  [rnaMoleculeName]: [nucleotideIndex],
                },
              });
            }
            break;
          }
          case MouseButtonIndices.Right: {
            // Open edit menu
            setDrawerKind(DrawerKind.PROPERTIES);
            setRightClickMenuContent(
              <SequenceConnectorEditMenu
                fullKeys={fullKeys}
                connector={connector}
                onUpdate={() => {
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName]: [nucleotideIndex],
                    },
                  });
                }}
                onDelete={() => {
                  pushToUndoStack();
                  connector.deleted = true;
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName]: [nucleotideIndex],
                    },
                  });
                  setDrawerKind(DrawerKind.NONE);
                }}
              />,
              {}
            );
            break;
          }
        }
      };
    }, []);
    
    const sequenceConnectorBreakpointOnMouseDownHelper = useMemo(function() {
      return function(
        e: React.MouseEvent<SVGElement>,
        fullKeys: FullKeys,
        pointIndex: number,
        updateRenderData: () => void
      ) {
        const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } = fullKeys;
        
        // Ctrl+click to delete breakpoint
        if (e.ctrlKey && e.button === MouseButtonIndices.Left) {
          e.preventDefault();
          e.stopPropagation();
          
          pushToUndoStack();
          const singularNucleotideProps = (
            rnaComplexPropsReference.current as RnaComplexProps
          )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
            nucleotideIndex
          ];
          const connector = singularNucleotideProps.sequenceConnectorToNext;
          if (connector?.breakpoints) {
            connector.breakpoints.splice(pointIndex, 1);
            updateRenderData();
            setNucleotideKeysToRerender({
              [rnaComplexIndex]: {
                [rnaMoleculeName]: [nucleotideIndex],
              },
            });
          }
          return;
        }
        
        const singularNucleotideProps = (
          rnaComplexPropsReference.current as RnaComplexProps
        )[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[
          nucleotideIndex
        ];
        const connector = singularNucleotideProps.sequenceConnectorToNext;
        if (!connector?.breakpoints) return;
        
        // Check if breakpoint is locked
        const isLocked = connector.lockedBreakpoints?.includes(pointIndex) ?? false;
        
        switch (e.button) {
          case MouseButtonIndices.Left: {
            let newDragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT && !isLocked) {
              const point = connector.breakpoints[pointIndex];
              
              // Check if breakpoint belongs to a group for collective movement
              const group = connector.breakpointGroups?.find(g => g.indices.includes(pointIndex));
              
              if (group && !group.locked) {
                // Group movement - move all breakpoints in group together
                const groupPoints = group.indices.map(idx => ({
                  idx,
                  point: connector.breakpoints[idx],
                  startX: connector.breakpoints[idx].x,
                  startY: connector.breakpoints[idx].y
                }));
                const startX = point.x;
                const startY = point.y;
                
                newDragListener = {
                  initiateDrag() {
                    return { x: startX, y: startY };
                  },
                  continueDrag(totalDrag) {
                    const dx = totalDrag.x - startX;
                    const dy = totalDrag.y - startY;
                    // Move all points in group by the delta
                    for (const gp of groupPoints) {
                      gp.point.x = gp.startX + dx;
                      gp.point.y = gp.startY + dy;
                    }
                    updateRenderData();
                    setNucleotideKeysToRerender({
                      [rnaComplexIndex]: {
                        [rnaMoleculeName]: [nucleotideIndex],
                      },
                    });
                  },
                };
              } else {
                // Single point movement
                newDragListener = {
                  initiateDrag() {
                    return { x: point.x, y: point.y };
                  },
                  continueDrag(totalDrag) {
                    point.x = totalDrag.x;
                    point.y = totalDrag.y;
                    updateRenderData();
                    setNucleotideKeysToRerender({
                      [rnaComplexIndex]: {
                        [rnaMoleculeName]: [nucleotideIndex],
                      },
                    });
                  },
                };
              }
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(newDragListener, {
              [rnaComplexIndex]: {
                [rnaMoleculeName]: setPerRnaMolecule,
              },
            });
            break;
          }
          case MouseButtonIndices.Right: {
            // Open edit menu
            setDrawerKind(DrawerKind.PROPERTIES);
            setRightClickMenuContent(
              <SequenceConnectorEditMenu
                fullKeys={fullKeys}
                connector={connector}
                onUpdate={() => {
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName]: [nucleotideIndex],
                    },
                  });
                }}
                onDelete={() => {
                  pushToUndoStack();
                  connector.deleted = true;
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName]: [nucleotideIndex],
                    },
                  });
                  setDrawerKind(DrawerKind.NONE);
                }}
              />,
              {}
            );
            break;
          }
        }
      };
    }, []);

    // Text annotation handler
    const textAnnotationOnMouseDownHelper = useMemo(function() {
      return function(
        e: React.MouseEvent,
        rnaComplexIndex: number,
        annotationId: string
      ) {
        const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
        const complex = rnaComplexProps[rnaComplexIndex];
        if (!complex.textAnnotations?.[annotationId]) return;
        
        const annotation = complex.textAnnotations[annotationId];
        
        switch (e.button) {
          case MouseButtonIndices.Left: {
            // Ctrl+click to delete
            if (e.ctrlKey && tabReference.current === Tab.ANNOTATE) {
              e.preventDefault();
              e.stopPropagation();
              pushToUndoStack();
              delete complex.textAnnotations[annotationId];
              setNucleotideKeysToRerender({});
              setRightClickMenuContent(<></>, {});
              return;
            }
            
            // Drag to move
            if (tabReference.current === Tab.ANNOTATE) {
              const newDragListener: DragListener = {
                initiateDrag() {
                  return { x: annotation.x, y: annotation.y };
                },
                continueDrag(totalDrag: Vector2D) {
                  annotation.x = totalDrag.x;
                  annotation.y = totalDrag.y;
                  setNucleotideKeysToRerender({});
                },
              };
              setDragListener(newDragListener, {});
            }
            break;
          }
          case MouseButtonIndices.Right: {
            // Open edit menu
            setDrawerKind(DrawerKind.PROPERTIES);
            setRightClickMenuContent(
              <TextAnnotationEditMenu
                annotation={annotation}
                onUpdate={() => setNucleotideKeysToRerender({})}
                onDelete={() => {
                  pushToUndoStack();
                  if (complex.textAnnotations) {
                    delete complex.textAnnotations[annotationId];
                  }
                  setNucleotideKeysToRerender({});
                  setRightClickMenuContent(<></>, {});
                }}
              />,
              {}
            );
            break;
          }
        }
      };
    }, []);
    
    const nucleotideOnMouseDownRightClickHelper = useMemo(function () {
      return function (
        fullKeys: FullKeys,
        interactionConstraint: InteractionConstraint.Enum,
        tab: InteractionConstraint.SupportedTab
      ) {
        const indicesOfFrozenNucleotides =
          indicesOfFrozenNucleotidesReference.current!;
        const interactionConstraintOptions =
          interactionConstraintOptionsReference.current!;
        try {
          const helper = new InteractionConstraint.record[
            interactionConstraint
          ](
            rnaComplexPropsReference.current as RnaComplexProps,
            setNucleotideKeysToRerender,
            setBasePairKeysToRerender,
            setDebugVisualElements,
            tab,
            indicesOfFrozenNucleotides,
            interactionConstraintOptions,
            fullKeys
          );
          if (tab === Tab.FORMAT) {
            setBasepairSheetOpen(true);
            setFormatMenuErrorMessage(undefined);
            // Bind the helper method via arrow function to preserve this context
            setConstrainRelevantHelices(() => (helices: Array<Helix>) => helper.constrainRelevantHelices(helices));
            return;
          }
          const rightClickMenu = helper.createRightClickMenu(tab);
          setResetOrientationDataTrigger(!resetOrientationDataTrigger);
          setRightClickMenuContent(
            rightClickMenu,
            helper.indicesOfAffectedNucleotides
          );
        } catch (error: any) {
          if (typeof error === "object" && "errorMessage" in error) {
            if (tab === Tab.FORMAT) {
              setBasepairSheetOpen(true);
              // setGlobalHelicesForFormatMenu([]);
              setFormatMenuErrorMessage(error.errorMessage);
            } else {
              setDrawerKind(DrawerKind.PROPERTIES);
              setRightClickMenuContent(
                <b
                  style={{
                    color: "red",
                  }}
                >
                  {error.errorMessage}
                </b>,
                {}
              );
            }
          } else {
            throw error;
          }
          return;
        }
      };
    }, []);
    const insertBasePairIntoGlobalHelices = useCallback(
      function(
        newKeys0 : FullKeys,
        newKeys1 : FullKeys
      ) {
        resetGlobalHelicesForFormatMenu(rnaComplexPropsReference.current!);
        // const globalHelicesForFormatMenu = globalHelicesForFormatMenuReference.current!;
        // [ newKeys0, newKeys1 ] = [ newKeys0, newKeys1 ].sort(compareBasePairKeys);

        // // NOTE: newKeys and helices are BOTH listed in sorted order. This simplifies implementation details.
        // let indexOfLesserContiguousHelix = -1;
        // let indexOfGreaterContiguousHelix = -1;
        // // let lookingForLesserHelix = true;
        // const helixIndexToDirectionalityIndicators : Array<1 | -1> = [];
        // for (let helixIndex = 0; helixIndex < globalHelicesForFormatMenu.length; helixIndex++) {
        //   const {
        //     rnaComplexIndex,
        //     rnaMoleculeName0,
        //     rnaMoleculeName1,
        //     start,
        //     stop
        //   } = globalHelicesForFormatMenu[helixIndex];
        //   if (rnaComplexIndex !== newKeys0.rnaComplexIndex) {
        //     continue;
        //   }
        //   if ((
        //     rnaMoleculeName0 !== newKeys0.rnaMoleculeName ||
        //     rnaMoleculeName1 !== newKeys1.rnaMoleculeName
        //   )) {
        //     continue;
        //   }
        //   const length = Math.abs(stop[0] - start[0]) + 1;
        //   let increment0 : 1 | -1;
        //   let increment1 : 1 | -1;
        //   if (length === 1) {
        //     const difference0 = stop[0] - newKeys0.nucleotideIndex;
        //     if (Math.abs(difference0) !== 1) {
        //       continue;
        //     }
        //     increment0 = difference0 as 1 | -1;
        //     const difference1 = stop[1] - newKeys1.nucleotideIndex;
        //     if (Math.abs(difference1) !== 1) {
        //       continue;
        //     }
        //     increment1 = difference1 as 1 | -1;
        //   } else {
        //     increment0 = Math.sign(stop[0] - start[0]) as 1 | -1;
        //     increment1 = Math.sign(stop[1] - start[1]) as 1 | -1;
        //   }
        //   let targets = {
        //     lesser : [
        //       stop[0] + increment0,
        //       stop[1] + increment1
        //     ],
        //     greater : [
        //       start[0] - increment0,
        //       start[1] - increment1
        //     ]
        //   };
        //   if ((
        //     newKeys0.nucleotideIndex === targets.lesser[0] &&
        //     newKeys1.nucleotideIndex === targets.lesser[1] &&
        //     (
        //       length !== -1 ||
        //       indexOfLesserContiguousHelix === -1
        //     )
        //   )) {
        //     indexOfLesserContiguousHelix = helixIndex;
        //   } else if ((
        //     newKeys0.nucleotideIndex === targets.greater[0] &&
        //     newKeys1.nucleotideIndex === targets.greater[1] &&
        //     (
        //       length !== -1 ||
        //       indexOfGreaterContiguousHelix === -1  
        //     )
        //   )) {
        //     indexOfGreaterContiguousHelix = helixIndex;
        //   }
        //   helixIndexToDirectionalityIndicators[helixIndex] = (increment0 * increment1) as 1 | -1;
        // }
        // if (
        //   indexOfLesserContiguousHelix !== -1 &&
        //   indexOfGreaterContiguousHelix !== -1 &&
        //   helixIndexToDirectionalityIndicators[indexOfLesserContiguousHelix] * helixIndexToDirectionalityIndicators[indexOfGreaterContiguousHelix] < 0
        // ) {
        //   // Incompatible helices.
        //   // Preferrentially retain the helix with the expected directionality indicator.
        //   if (helixIndexToDirectionalityIndicators[indexOfLesserContiguousHelix] < 0) {
        //     indexOfGreaterContiguousHelix = -1;
        //   } else {
        //     indexOfLesserContiguousHelix = -1;
        //   }
        // }
        // if (
        //   indexOfLesserContiguousHelix === -1 &&
        //   indexOfGreaterContiguousHelix === -1
        // ) {
        //   const newHelix : Helix = {
        //     rnaComplexIndex : newKeys0.rnaComplexIndex,
        //     rnaMoleculeName0 : newKeys0.rnaMoleculeName,
        //     rnaMoleculeName1 : newKeys1.rnaMoleculeName,
        //     start : { 0 : newKeys0.nucleotideIndex, 1 : newKeys1.nucleotideIndex },
        //     stop : { 0 : newKeys0.nucleotideIndex, 1 : newKeys1.nucleotideIndex }
        //   };
        //   // This base pair should not be already present in the globalHelices array. 
        //   // It would be if the basepair (with identical keys) already existed.
        //   sortedArraySplice(
        //     globalHelicesForFormatMenu,
        //     ({ rnaComplexIndex, rnaMoleculeName0, rnaMoleculeName1, start, stop } : Helix) => (
        //       (rnaComplexIndex - newHelix.rnaComplexIndex) ||
        //       rnaMoleculeName0.localeCompare(newHelix.rnaMoleculeName0) ||
        //       rnaMoleculeName1.localeCompare(newHelix.rnaMoleculeName1) ||
        //       (start[0] - newHelix.start[0]) ||
        //       (start[1] - newHelix.start[1])
        //       // Ignore stop; it is irrelevant.
        //     ),
        //     0,
        //     [newHelix],
        //     HandleQueryNotFound.ADD
        //   );
        // } else if (
        //   indexOfLesserContiguousHelix !== -1 &&
        //   indexOfGreaterContiguousHelix !== -1
        // ) {
        //   // Merge the 2 helices and new base pair into 1 helix.
        //   const lesserHelix = globalHelicesForFormatMenu[indexOfLesserContiguousHelix];
        //   const greaterHelix = globalHelicesForFormatMenu[indexOfGreaterContiguousHelix];
        //   lesserHelix.stop = structuredClone(greaterHelix.stop);
        //   globalHelicesForFormatMenu.splice(
        //     indexOfGreaterContiguousHelix,
        //     1
        //   );
        // } else if (
        //   indexOfLesserContiguousHelix !== -1
        // ) {
        //   const lesserHelix = globalHelicesForFormatMenu[indexOfLesserContiguousHelix];
        //   const { start, stop } = lesserHelix;
        //   const length = Math.abs(stop[0] - start[0]) + 1;
        //   if (length === 1) {
        //     const [ min0, max0 ] = [start[0], newKeys0.nucleotideIndex].sort(subtractNumbers);
        //     const [ min1, max1 ] = [start[1], newKeys1.nucleotideIndex].sort(subtractNumbers);
        //     lesserHelix.start = [min0, max1];
        //     lesserHelix.stop = [max0, min1];
        //   } else {
        //     lesserHelix.stop = [newKeys0.nucleotideIndex, newKeys1.nucleotideIndex];
        //   }
        // } else {
        //   const greaterHelix = globalHelicesForFormatMenu[indexOfGreaterContiguousHelix];
        //   const { start, stop } = greaterHelix;
        //   const length = Math.abs(stop[0] - start[0]) + 1;
        //   if (length === 1) {
        //     const [ min0, max0 ] = [start[0], newKeys0.nucleotideIndex].sort(subtractNumbers);
        //     const [ min1, max1 ] = [start[1], newKeys1.nucleotideIndex].sort(subtractNumbers);
        //     greaterHelix.start = [min0, max1];
        //     greaterHelix.stop = [max0, min1];
        //   } else {
        //     greaterHelix.start = [newKeys0.nucleotideIndex, newKeys1.nucleotideIndex];
        //   }
        // }
        // // Force an update of the format menu.
        // const newGlobalHelicesForFormatMenu = structuredClone(globalHelicesForFormatMenu);
        // setGlobalHelicesForFormatMenu(newGlobalHelicesForFormatMenu);
      },
      []
    );
    const removeBasePairFromGlobalHelices = useCallback(
      (
        rnaComplexIndex : RnaComplexKey,
        rnaMoleculeName0 : RnaMoleculeKey,
        rnaMoleculeName1 : RnaMoleculeKey,
        nucleotideIndex0 : NucleotideKey,
        nucleotideIndex1 : NucleotideKey
      ) => {
        const globalHelicesForFormatMenu = globalHelicesForFormatMenuReference.current;
        if (globalHelicesForFormatMenu.length === 0) {
          // No point in deleting base pairs from the data structure if the menu isn't open.
          return;
        }
        const newHelices = structuredClone(globalHelicesForFormatMenu);
        const indexOfAffectedHelix = newHelices.findIndex((helix : Helix) => (
          helix.rnaComplexIndex === rnaComplexIndex &&
          helix.rnaMoleculeName0 === rnaMoleculeName0 &&
          helix.rnaMoleculeName1 === rnaMoleculeName1 &&
          (nucleotideIndex0 - helix.start[0]) * (nucleotideIndex0 - helix.stop[0]) <= 0 &&
          (nucleotideIndex1 - helix.start[1]) * (nucleotideIndex1 - helix.stop[1]) <= 0
        ));
        if (indexOfAffectedHelix === -1) {
          // Base pair not found in global helices, nothing to remove
          return;
        }
        const affectedHelix = newHelices[indexOfAffectedHelix];
        const affectedHelixLength = Math.abs(affectedHelix.stop[0] - affectedHelix.start[0]) + 1;
        if (affectedHelixLength === 1) {
          newHelices.splice(indexOfAffectedHelix, 1);
        } else {
          const affectedHelixIncrement0 = Math.sign(affectedHelix.stop[0] - affectedHelix.start[0]);
          const affectedHelixIncrement1 = Math.sign(affectedHelix.stop[1] - affectedHelix.start[1]);
          if (nucleotideIndex0 === affectedHelix.start[0]) {
            affectedHelix.start[0] += affectedHelixIncrement0;
            affectedHelix.start[1] += affectedHelixIncrement1;
          } else if (nucleotideIndex0 === affectedHelix.stop[0]) {
            affectedHelix.stop[0] -= affectedHelixIncrement0;
            affectedHelix.stop[1] -= affectedHelixIncrement1;
          } else {
            const newHelix0 = structuredClone(affectedHelix);
            const newHelix1 = structuredClone(affectedHelix);
            newHelix0.stop = {
              0 : nucleotideIndex0 - affectedHelixIncrement0,
              1 : nucleotideIndex1 - affectedHelixIncrement1
            };
            newHelix1.start = {
              0 : nucleotideIndex0 + affectedHelixIncrement0,
              1 : nucleotideIndex1 + affectedHelixIncrement1
            };
            newHelices.splice(
              indexOfAffectedHelix,
              1,
              newHelix0,
              newHelix1
            );
          }
        }
        setGlobalHelicesForFormatMenu(newHelices);
        globalHelicesForFormatMenuReference.current = newHelices;
      },
      []
    );
    const pushToUndoStack = useMemo(function () {
      return function () {
        const rnaComplexProps = rnaComplexPropsReference.current!;
        const globalHelicesForFormatMenu = globalHelicesForFormatMenuReference.current;
        const undoStack = undoStackReference.current!;
        setUndoStack([
          ...undoStack,
          { 
            rnaComplexProps : structuredClone(rnaComplexProps),
            globalHelicesForFormatMenu : structuredClone(globalHelicesForFormatMenu)
          },
        ]);
        setRedoStack([]);
        setUnsavedWorkFlag(true);
      };
    }, []);
    const nucleotideOnMouseDownHelper = useMemo(function () {
      return function (
        e: React.MouseEvent<Nucleotide.SvgRepresentation>,
        fullKeys: FullKeys
      ) {
        const settingsRecord = settingsRecordReference.current!;
        
        // Shift+click (without Ctrl) to create inter-molecular connectors
        if (e.button === MouseButtonIndices.Left && e.shiftKey && !e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
          
          const pendingSource = pendingConnectorSourceReference.current;
          if (!pendingSource) {
            // First click - store as source
            setPendingConnectorSource(fullKeys);
            return;
          }
          
          // Second click - create connector
          if (pendingSource.rnaComplexIndex !== fullKeys.rnaComplexIndex) {
            // Different complex - reset and store new source
            setPendingConnectorSource(fullKeys);
            return;
          }
          
          if (
            pendingSource.rnaMoleculeName === fullKeys.rnaMoleculeName &&
            pendingSource.nucleotideIndex === fullKeys.nucleotideIndex
          ) {
            // Same nucleotide - cancel
            setPendingConnectorSource(undefined);
            return;
          }
          
          // Create connector from pendingSource to fullKeys
          pushToUndoStack();
          const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
          const complex = rnaComplexProps[fullKeys.rnaComplexIndex];
          if (!complex) {
            setPendingConnectorSource(undefined);
            return;
          }
          
          const sourceMolProps = complex.rnaMoleculeProps[pendingSource.rnaMoleculeName];
          if (!sourceMolProps) {
            setPendingConnectorSource(undefined);
            return;
          }
          
          const sourceNucProps = sourceMolProps.nucleotideProps[pendingSource.nucleotideIndex];
          if (!sourceNucProps) {
            setPendingConnectorSource(undefined);
            return;
          }
          
          // Create the inter-molecular connector
          sourceNucProps.sequenceConnectorToNext = {
            breakpoints: [],
            targetMoleculeName: fullKeys.rnaMoleculeName,
            targetNucleotideIndex: fullKeys.nucleotideIndex
          };
          
          // Trigger re-render
          setNucleotideKeysToRerender({
            [fullKeys.rnaComplexIndex]: {
              [pendingSource.rnaMoleculeName]: [pendingSource.nucleotideIndex]
            }
          });
          
          setPendingConnectorSource(undefined);
          return;
        }
        
        if (e.button === MouseButtonIndices.Left && e.ctrlKey) {
          e.preventDefault();
          e.stopPropagation();
          
          pushToUndoStack();
          const pending = pendingPairNucleotideReference.current;
          if (!pending) {
            setPendingPairNucleotide(fullKeys);
            return;
          }

          if (pending.rnaComplexIndex !== fullKeys.rnaComplexIndex) {
            setPendingPairNucleotide(fullKeys);
            return;
          }
          const rnaComplexProps =
            rnaComplexPropsReference.current as RnaComplexProps;
          const singularRnaComplexProps =
            rnaComplexProps[fullKeys.rnaComplexIndex];
          if (
            !singularRnaComplexProps ||
            (
              pending.rnaMoleculeName === fullKeys.rnaMoleculeName &&
              pending.nucleotideIndex === fullKeys.nucleotideIndex
            )
          ) {
            setPendingPairNucleotide(undefined);
            return;
          }
          if (e.shiftKey) {
            try {
              const indicesOfFrozen = indicesOfFrozenNucleotidesReference.current!;
              const rnaComplexIndex = fullKeys.rnaComplexIndex;
              const rnaMoleculeName0 = pending.rnaMoleculeName;
              const rnaMoleculeName1 = fullKeys.rnaMoleculeName;
              const nucleotideIndex0 = pending.nucleotideIndex;
              const nucleotideIndex1 = fullKeys.nucleotideIndex;
              const complex = singularRnaComplexProps;
              const mol0 = complex.rnaMoleculeProps[rnaMoleculeName0];
              const mol1 = complex.rnaMoleculeProps[rnaMoleculeName1];
              if (mol0 && mol1) {
                const frozen0 = (indicesOfFrozen[rnaComplexIndex]?.[rnaMoleculeName0]?.has(nucleotideIndex0)) ?? false;
                const frozen1 = (indicesOfFrozen[rnaComplexIndex]?.[rnaMoleculeName1]?.has(nucleotideIndex1)) ?? false;
                if (!frozen0 && !frozen1) {
                  const settingsRecord = settingsRecordReference.current!;
                  repositionNucleotidesForBasePairs(
                    complex,
                    rnaMoleculeName0,
                    rnaMoleculeName1,
                    nucleotideIndex0,
                    nucleotideIndex1,
                    1,
                    undefined,
                    settingsRecord
                  );
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex]: {
                      [rnaMoleculeName0]: [nucleotideIndex0],
                      [rnaMoleculeName1]: [nucleotideIndex1],
                    },
                  });
                }
              }
            } catch {}
          }
          
          // Delete all existing base pairs on both nucleotides before creating new one
          const basePairsToDelete: Array<RnaComplex.FullBasePairKeys> = [];
          
          // Collect all base pairs from pending nucleotide
          const basePairsPerRnaMolecule0 = singularRnaComplexProps.basePairs[pending.rnaMoleculeName];
          if (basePairsPerRnaMolecule0) {
            const basePairsPerNucleotide0 = basePairsPerRnaMolecule0[pending.nucleotideIndex];
            if (basePairsPerNucleotide0) {
              for (const basePair of basePairsPerNucleotide0) {
                const [keys0, keys1] = [
                  { rnaMoleculeName: pending.rnaMoleculeName, nucleotideIndex: pending.nucleotideIndex },
                  { rnaMoleculeName: basePair.rnaMoleculeName, nucleotideIndex: basePair.nucleotideIndex }
                ].sort(compareBasePairKeys);
                basePairsToDelete.push({ keys0, keys1 });
              }
            }
          }
          
          // Collect all base pairs from fullKeys nucleotide
          const basePairsPerRnaMolecule1 = singularRnaComplexProps.basePairs[fullKeys.rnaMoleculeName];
          if (basePairsPerRnaMolecule1) {
            const basePairsPerNucleotide1 = basePairsPerRnaMolecule1[fullKeys.nucleotideIndex];
            if (basePairsPerNucleotide1) {
              for (const basePair of basePairsPerNucleotide1) {
                const [keys0, keys1] = [
                  { rnaMoleculeName: fullKeys.rnaMoleculeName, nucleotideIndex: fullKeys.nucleotideIndex },
                  { rnaMoleculeName: basePair.rnaMoleculeName, nucleotideIndex: basePair.nucleotideIndex }
                ].sort(compareBasePairKeys);
                basePairsToDelete.push({ keys0, keys1 });
              }
            }
          }
          
          // Deduplicate basePairsToDelete (in case A and B are already paired to each other)
          const uniqueBasePairsToDelete: Array<RnaComplex.FullBasePairKeys> = [];
          const seenPairs = new Set<string>();
          for (const pair of basePairsToDelete) {
            const pairKey = `${pair.keys0.rnaMoleculeName}:${pair.keys0.nucleotideIndex}-${pair.keys1.rnaMoleculeName}:${pair.keys1.nucleotideIndex}`;
            if (!seenPairs.has(pairKey)) {
              seenPairs.add(pairKey);
              uniqueBasePairsToDelete.push(pair);
            }
          }
          
          // Delete all collected base pairs from BOTH sides of the symmetric structure
          for (const { keys0, keys1 } of uniqueBasePairsToDelete) {
            // Delete from keys0 side
            const basePairsPerMol0 = singularRnaComplexProps.basePairs[keys0.rnaMoleculeName];
            if (basePairsPerMol0 && basePairsPerMol0[keys0.nucleotideIndex]) {
              const basePairsPerNuc0 = basePairsPerMol0[keys0.nucleotideIndex];
              const indexToRemove0 = basePairsPerNuc0.findIndex(bp => 
                bp.rnaMoleculeName === keys1.rnaMoleculeName && bp.nucleotideIndex === keys1.nucleotideIndex
              );
              if (indexToRemove0 !== -1) {
                if (basePairsPerNuc0.length === 1) {
                  delete basePairsPerMol0[keys0.nucleotideIndex];
                } else {
                  basePairsPerNuc0.splice(indexToRemove0, 1);
                }
              }
            }
            
            // Delete from keys1 side
            const basePairsPerMol1 = singularRnaComplexProps.basePairs[keys1.rnaMoleculeName];
            if (basePairsPerMol1 && basePairsPerMol1[keys1.nucleotideIndex]) {
              const basePairsPerNuc1 = basePairsPerMol1[keys1.nucleotideIndex];
              const indexToRemove1 = basePairsPerNuc1.findIndex(bp => 
                bp.rnaMoleculeName === keys0.rnaMoleculeName && bp.nucleotideIndex === keys0.nucleotideIndex
              );
              if (indexToRemove1 !== -1) {
                if (basePairsPerNuc1.length === 1) {
                  delete basePairsPerMol1[keys1.nucleotideIndex];
                } else {
                  basePairsPerNuc1.splice(indexToRemove1, 1);
                }
              }
            }
          }
          
          // Remove all deleted base pairs from global helices
          for (const { keys0, keys1 } of uniqueBasePairsToDelete) {
            removeBasePairFromGlobalHelices(
              fullKeys.rnaComplexIndex,
              keys0.rnaMoleculeName,
              keys1.rnaMoleculeName,
              keys0.nucleotideIndex,
              keys1.nucleotideIndex
            );
          }
          
          // Now create the new base pair
          insertBasePair(
            singularRnaComplexProps,
            pending.rnaMoleculeName,
            pending.nucleotideIndex,
            fullKeys.rnaMoleculeName,
            fullKeys.nucleotideIndex,
            DuplicateBasePairKeysHandler.DO_NOTHING,
            {}
          );
          const foundBasePair = singularRnaComplexProps.basePairs[pending.rnaMoleculeName]?.[pending.nucleotideIndex]?.find(basePair => (
            basePair.rnaMoleculeName === fullKeys.rnaMoleculeName &&
            basePair.nucleotideIndex === fullKeys.nucleotideIndex
          ));
          const basePairType = foundBasePair?.basePairType;
          if (
            basePairType === undefined ||
            BasePair.isCanonicalType(basePairType) ||
            !settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED]
          ) {
            insertBasePairIntoGlobalHelices(pending, fullKeys);
          }
          const [keys0, keys1] = [
            {
              rnaMoleculeName: pending.rnaMoleculeName,
              nucleotideIndex: pending.nucleotideIndex,
            },
            {
              rnaMoleculeName: fullKeys.rnaMoleculeName,
              nucleotideIndex: fullKeys.nucleotideIndex,
            },
          ].sort(compareBasePairKeys);
          setBasePairKeysToEdit({
            [fullKeys.rnaComplexIndex]: { 
              add: [{ keys0, keys1 }], 
              delete: uniqueBasePairsToDelete 
            },
          });
          
          // Trigger rerender for all affected base pair positions
          const allAffectedKeys = [
            { rnaMoleculeName: pending.rnaMoleculeName, nucleotideIndex: pending.nucleotideIndex },
            { rnaMoleculeName: fullKeys.rnaMoleculeName, nucleotideIndex: fullKeys.nucleotideIndex }
          ];
          // Add all partner nucleotides from deleted pairs
          for (const { keys0: k0, keys1: k1 } of uniqueBasePairsToDelete) {
            allAffectedKeys.push(k0, k1);
          }
          setBasePairKeysToRerender({
            [fullKeys.rnaComplexIndex]: allAffectedKeys
          });
          
          setPendingPairNucleotide(undefined);
          return;
        }
        const interactionConstraint = interactionConstraintReference.current;
        if (
          interactionConstraint === undefined ||
          !InteractionConstraint.isEnum(interactionConstraint)
        ) {
          setRightClickMenuContent(
            <b
              style={{
                color: "red",
              }}
            >
              Select a constraint first!
            </b>,
            {}
          );
          return;
        }
        const indicesOfFrozenNucleotides =
          indicesOfFrozenNucleotidesReference.current!;
        const tab = tabReference.current as Tab;
        const interactionConstraintOptions =
          interactionConstraintOptionsReference.current!;
        let newDragListenerAffectedNucleotideIndices = {};
        switch (e.button) {
          case MouseButtonIndices.Left: {
            let newDragListener: DragListener = viewportDragListener;
            if (tab === Tab.EDIT) {
              try {
                const helper = new InteractionConstraint.record[
                  interactionConstraint
                ](
                  rnaComplexPropsReference.current as RnaComplexProps,
                  setNucleotideKeysToRerender,
                  setBasePairKeysToRerender,
                  setDebugVisualElements,
                  tab,
                  indicesOfFrozenNucleotides,
                  interactionConstraintOptions,
                  fullKeys
                );
                const newDragListenerAttempt = helper.drag();
                newDragListenerAffectedNucleotideIndices =
                  helper.indicesOfAffectedNucleotides;
                if (newDragListenerAttempt != undefined) {
                  newDragListener = newDragListenerAttempt;
                }
              } catch (error: any) {
                if (typeof error === "object" && "errorMessage" in error) {
                  setDrawerKind(DrawerKind.PROPERTIES);
                  setRightClickMenuContent(
                    <b
                      style={{
                        color: "red",
                      }}
                    >
                      {error.errorMessage}
                    </b>,
                    {}
                  );
                } else {
                  throw error;
                }
                return;
              }
            }
            setDragListener(
              newDragListener,
              newDragListenerAffectedNucleotideIndices
            );
            break;
          }
          case MouseButtonIndices.Middle: {
            try {
              const interactionConstraintOptions =
                interactionConstraintOptionsReference.current!;
              const helper = new InteractionConstraint.record[
                interactionConstraint
              ](
                rnaComplexPropsReference.current as RnaComplexProps,
                setNucleotideKeysToRerender,
                setBasePairKeysToRerender,
                setDebugVisualElements,
                tab,
                indicesOfFrozenNucleotides,
                interactionConstraintOptions,
                fullKeys
              );
              const helperIndicesOfAffectedNucleotides =
                helper.indicesOfAffectedNucleotides;
              const rightClickMenuAffectedNucleotideIndices =
                rightClickMenuAffectedNucleotideIndicesReference.current!;
              const newIndicesOfFrozenNucleotides = structuredClone(
                indicesOfFrozenNucleotides
              );
              let freezeNucleotidesFlag = true;
              const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } =
                fullKeys;
              if (rnaComplexIndex in indicesOfFrozenNucleotides) {
                const indicesOfFrozenNucleotidesPerRnaComplex =
                  indicesOfFrozenNucleotides[rnaComplexIndex];
                if (
                  rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex
                ) {
                  const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule =
                    indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName];
                  if (
                    indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(
                      nucleotideIndex
                    )
                  ) {
                    freezeNucleotidesFlag = false;
                  }
                }
              }
              let clearRightClickMenuFlag = false;
              for (const [
                rnaComplexIndexAsString,
                helperIndicesOfAffectedNucleotidesPerRnaComplex,
              ] of Object.entries(helperIndicesOfAffectedNucleotides)) {
                const rnaComplexIndex = Number.parseInt(
                  rnaComplexIndexAsString
                );
                for (const [
                  rnaMoleculeName,
                  helperIndicesOfAffectedNucleotidesPerRnaComplexPerRnaMolecule,
                ] of Object.entries(
                  helperIndicesOfAffectedNucleotidesPerRnaComplex
                )) {
                  for (const nucleotideIndex of Array.from(
                    helperIndicesOfAffectedNucleotidesPerRnaComplexPerRnaMolecule
                  )) {
                    if (!(rnaComplexIndex in newIndicesOfFrozenNucleotides)) {
                      newIndicesOfFrozenNucleotides[rnaComplexIndex] = {};
                    }
                    const newIndicesOfFrozenNucleotidesPerRnaComplex =
                      newIndicesOfFrozenNucleotides[rnaComplexIndex];
                    if (
                      !(
                        rnaMoleculeName in
                        newIndicesOfFrozenNucleotidesPerRnaComplex
                      )
                    ) {
                      newIndicesOfFrozenNucleotidesPerRnaComplex[
                        rnaMoleculeName
                      ] = new Set<number>();
                    }
                    const newIndicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule =
                      newIndicesOfFrozenNucleotidesPerRnaComplex[
                        rnaMoleculeName
                      ];
                    if (freezeNucleotidesFlag) {
                      newIndicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.add(
                        nucleotideIndex
                      );
                    } else if (
                      newIndicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(
                        nucleotideIndex
                      )
                    ) {
                      newIndicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.delete(
                        nucleotideIndex
                      );
                    }
                    if (
                      rnaComplexIndex in rightClickMenuAffectedNucleotideIndices
                    ) {
                      const rightClickMenuAffectedNucleotideIndicesPerRnaComplex =
                        rightClickMenuAffectedNucleotideIndices[
                          rnaComplexIndex
                        ];
                      if (
                        rnaMoleculeName in
                        rightClickMenuAffectedNucleotideIndicesPerRnaComplex
                      ) {
                        const rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule =
                          rightClickMenuAffectedNucleotideIndicesPerRnaComplex[
                            rnaMoleculeName
                          ];
                        if (
                          rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule.has(
                            nucleotideIndex
                          )
                        ) {
                          clearRightClickMenuFlag = true;
                        }
                      }
                    }
                  }
                }
              }
              setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
              const undoStack = undoStackReference.current!;
              setUndoStack([
                ...undoStack,
                structuredClone(indicesOfFrozenNucleotides)
              ]);
              setRedoStack([]);
              if (clearRightClickMenuFlag) {
                setRightClickMenuContent(
                  <b
                    style={{
                      color: "red",
                    }}
                  >
                    The current right-click menu is no longer valid, due to a
                    newly frozen nucleotide
                  </b>,
                  {}
                );
              }
            } catch (error: any) {
              if (typeof error === "object" && "errorMessage" in error) {
                setDrawerKind(DrawerKind.PROPERTIES);
                setRightClickMenuContent(
                  <b
                    style={{
                      color: "red",
                    }}
                  >
                    {error.errorMessage}
                  </b>,
                  {}
                );
              } else {
                throw error;
              }
            }
            break;
          }
          case MouseButtonIndices.Right: {
            if (InteractionConstraint.isSupportedTab(tab)) {
              nucleotideOnMouseDownRightClickHelper(
                fullKeys,
                interactionConstraint,
                tab
              );
            }
            break;
          }
        }
      };
    }, [
      insertBasePairIntoGlobalHelices,
      pushToUndoStack
    ]);
    const basePairOnMouseDownHelper = useMemo(function () {
      return function (
        e: React.MouseEvent,
        fullKeys0: FullKeys,
        fullKeys1: FullKeys
      ) {
        // Check if base pair still exists in data structure (could have been deleted)
        const currentRnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
        const currentSingularRnaComplexProps = currentRnaComplexProps[fullKeys0.rnaComplexIndex];
        
        if (!currentSingularRnaComplexProps) {
          return;
        }
        const basePairs0 = currentSingularRnaComplexProps.basePairs[fullKeys0.rnaMoleculeName];
        const basePairs1 = currentSingularRnaComplexProps.basePairs[fullKeys1.rnaMoleculeName];
        const basePairExists = 
          basePairs0?.[fullKeys0.nucleotideIndex]?.some(bp => 
            bp.rnaMoleculeName === fullKeys1.rnaMoleculeName && bp.nucleotideIndex === fullKeys1.nucleotideIndex
          ) ?? false;
        
        if (!basePairExists) {
          // Base pair was deleted, ignore this click
          return;
        }
        
        if (e.ctrlKey && e.button === MouseButtonIndices.Left) {
          const interactionConstraint = interactionConstraintReference.current!;
          const rnaComplexProps =
            rnaComplexPropsReference.current as RnaComplexProps;
          const tab = tabReference.current!;
          const settingsRecord = settingsRecordReference.current!;
          const { rnaComplexIndex, rnaMoleculeName: rnaMoleculeName0, nucleotideIndex: nucleotideIndex0 } = fullKeys0;
          const { rnaMoleculeName: rnaMoleculeName1, nucleotideIndex: nucleotideIndex1 } = fullKeys1;
          pushToUndoStack();
          const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
          if (singularRnaComplexProps) {
            let basePairType : BasePair.Type | undefined;
            const basePairs0 = singularRnaComplexProps.basePairs[rnaMoleculeName0];
            if (basePairs0 && nucleotideIndex0 in basePairs0) {
              const arr0 = basePairs0[nucleotideIndex0];
              const idx0 = arr0.findIndex(
                (m) => m.rnaMoleculeName === rnaMoleculeName1 && m.nucleotideIndex === nucleotideIndex1
              );
              if (idx0 !== -1) {
                basePairType = arr0[idx0]?.basePairType;
                if (arr0.length === 1) {
                  delete basePairs0[nucleotideIndex0];
                } else {
                  arr0.splice(idx0, 1);
                }
              }
            }
            const basePairs1 = singularRnaComplexProps.basePairs[rnaMoleculeName1];
            if (basePairs1 && nucleotideIndex1 in basePairs1) {
              const arr1 = basePairs1[nucleotideIndex1];
              const idx1 = arr1.findIndex(
                (m) => m.rnaMoleculeName === rnaMoleculeName0 && m.nucleotideIndex === nucleotideIndex0
              );
              if (idx1 !== -1) {
                if (arr1.length === 1) {
                  delete basePairs1[nucleotideIndex1];
                } else {
                  arr1.splice(idx1, 1);
                }
              }
            }
            const [keys0, keys1] = [
              { rnaMoleculeName: rnaMoleculeName0, nucleotideIndex: nucleotideIndex0 },
              { rnaMoleculeName: rnaMoleculeName1, nucleotideIndex: nucleotideIndex1 },
            ].sort(compareBasePairKeys);
            setBasePairKeysToEdit({
              [rnaComplexIndex]: {
                add: [],
                delete: [{ keys0, keys1 }],
              },
            });
            if (
              basePairType === undefined ||
              BasePair.isCanonicalType(basePairType) ||
              !(settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] as boolean)
            ) {
              removeBasePairFromGlobalHelices(
                rnaComplexIndex,
                rnaMoleculeName0,
                rnaMoleculeName1,
                nucleotideIndex0,
                nucleotideIndex1
              );
            }
          }
          return;
        }
        const interactionConstraint = interactionConstraintReference.current!;
        const rnaComplexProps =
          rnaComplexPropsReference.current as RnaComplexProps;
        const indicesOfFrozenNucleotides =
          indicesOfFrozenNucleotidesReference.current!;
        const interactionConstraintOptions =
          interactionConstraintOptionsReference.current!;
        const tab = tabReference.current!;
        const settingsRecord = settingsRecordReference.current!;
        switch (e.button) {
          case MouseButtonIndices.Left: {
            if (e.shiftKey) {
              // Perform the helix-reformatting shortcut with Shift+Left Click.
              try {
                const helices = new InteractionConstraint.record[
                  InteractionConstraint.Enum.RNA_HELIX
                ](
                  rnaComplexProps,
                  setNucleotideKeysToRerender,
                  setBasePairKeysToRerender,
                  setDebugVisualElements,
                  tab,
                  indicesOfFrozenNucleotides,
                  interactionConstraintOptions,
                  fullKeys0,
                  fullKeys1
                ).getHelices();
                reformatSelectedHelices(helices);
              } catch (error: any) {
                // Helix constraint doesn't support this base pair (e.g., non-canonical pairs)
                console.warn('Cannot create helix constraint for this base pair:', error?.errorMessage || error);
              }
            } else {
              let newDragListener: DragListener = viewportDragListener;
              let newDragListenerAffectedNucleotideIndices = {};
              // As of now, dragging base pairs is not an option.
              setDragListener(
                newDragListener,
                newDragListenerAffectedNucleotideIndices
              );
            }
            break;
          }
          case MouseButtonIndices.Middle: {
            // Delete base pair on middle-click
            const { rnaComplexIndex, rnaMoleculeName: rnaMoleculeName0, nucleotideIndex: nucleotideIndex0 } = fullKeys0;
            const { rnaMoleculeName: rnaMoleculeName1, nucleotideIndex: nucleotideIndex1 } = fullKeys1;
              
              // Push to undo stack before making changes
              pushToUndoStack();
              
              // Get the RNA complex
              const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
              if (!singularRnaComplexProps) {
                break;
              }
              
              // Delete base pair from both directions
              let basePairType : BasePair.Type | undefined;
              const basePairs0 = singularRnaComplexProps.basePairs[rnaMoleculeName0];
              if (basePairs0 && nucleotideIndex0 in basePairs0) {
                const arr0 = basePairs0[nucleotideIndex0];
                const idx0 = arr0.findIndex(
                  (m) => m.rnaMoleculeName === rnaMoleculeName1 && m.nucleotideIndex === nucleotideIndex1
                );
                if (idx0 !== -1 && arr0[idx0]) {
                  basePairType = arr0[idx0].basePairType;
                  if (arr0.length === 1) {
                    delete basePairs0[nucleotideIndex0];
                  } else {
                    arr0.splice(idx0, 1);
                  }
                }
              }
              
              const basePairs1 = singularRnaComplexProps.basePairs[rnaMoleculeName1];
              if (basePairs1 && nucleotideIndex1 in basePairs1) {
                const arr1 = basePairs1[nucleotideIndex1];
                const idx1 = arr1.findIndex(
                  (m) => m.rnaMoleculeName === rnaMoleculeName0 && m.nucleotideIndex === nucleotideIndex0
                );
                if (idx1 !== -1) {
                  if (arr1.length === 1) {
                    delete basePairs1[nucleotideIndex1];
                  } else {
                    arr1.splice(idx1, 1);
                  }
                }
              }
              
              // Update base pair keys to rerender
              const [keys0, keys1] = [
                { rnaMoleculeName: rnaMoleculeName0, nucleotideIndex: nucleotideIndex0 },
                { rnaMoleculeName: rnaMoleculeName1, nucleotideIndex: nucleotideIndex1 }
              ].sort(compareBasePairKeys);
              
              setBasePairKeysToEdit({
                [rnaComplexIndex]: {
                  add: [],
                  delete: [{ keys0, keys1 }]
                }
              });
              if (
                basePairType === undefined ||
                BasePair.isCanonicalType(basePairType) ||
                !(settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] as boolean)
              ) {
                removeBasePairFromGlobalHelices(
                  rnaComplexIndex,
                  rnaMoleculeName0,
                  rnaMoleculeName1,
                  nucleotideIndex0,
                  nucleotideIndex1
                );
              }
            break;
          }
          case MouseButtonIndices.Right: {
            if (InteractionConstraint.isSupportedTab(tab)) {
              try {
                const indicesOfFrozenNucleotides =
                  indicesOfFrozenNucleotidesReference.current!;
                const helper = new InteractionConstraint.record[
                  interactionConstraint
                ](
                  rnaComplexProps,
                  setNucleotideKeysToRerender,
                  setBasePairKeysToRerender,
                  setDebugVisualElements,
                  tab,
                  indicesOfFrozenNucleotides,
                  interactionConstraintOptions,
                  fullKeys0,
                  fullKeys1
                );
                if (tab === Tab.FORMAT) {
                  setBasepairSheetOpen(true);
                  setFormatMenuErrorMessage(undefined);
                  // Bind the helper method via arrow function to preserve this context
                  setConstrainRelevantHelices(() => (helices: Array<Helix>) => helper.constrainRelevantHelices(helices));
                  return;
                }
                setResetOrientationDataTrigger(!resetOrientationDataTrigger);
                const rightClickMenu = helper.createRightClickMenu(tab);
                setRightClickMenuContent(
                  rightClickMenu,
                  helper.indicesOfAffectedNucleotides
                );
              } catch (error: any) {
                if (typeof error === "object" && "errorMessage" in error) {
                  if (tab === Tab.FORMAT) {
                    setBasepairSheetOpen(true);
                    // setGlobalHelicesForFormatMenu([]);
                    setFormatMenuErrorMessage(error.errorMessage);
                  } else {
                    setDrawerKind(DrawerKind.PROPERTIES);
                    setRightClickMenuContent(
                      <b
                        style={{
                          color: "red",
                        }}
                      >
                        {error.errorMessage}
                      </b>,
                      {}
                    );
                  }
                } else {
                  throw error;
                }
              }
            }
            break;
          }
        }
      };
    }, []);
    const updateRnaMoleculeNameHelper = useMemo(function () {
      return function (
        rnaComplexIndex: RnaComplexKey,
        oldRnaMoleculeName: RnaMoleculeKey,
        newRnaMoleculeName: RnaMoleculeKey
      ) {
        const rnaComplexProps =
          rnaComplexPropsReference.current as RnaComplexProps;
        const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
        const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;

        for (let rnaMoleculeName of Object.keys(
          singularRnaComplexProps.rnaMoleculeProps
        )) {
          if (!(rnaMoleculeName in basePairsPerRnaComplex)) {
            continue;
          }
          let basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
          for (let basePairsPerNucleotide of Object.values(
            basePairsPerRnaMolecule
          )) {
            for (const basePairPerNucleotide of basePairsPerNucleotide) {
              if (
                basePairPerNucleotide.rnaMoleculeName === oldRnaMoleculeName
              ) {
                basePairPerNucleotide.rnaMoleculeName = newRnaMoleculeName;
              }
            }
          }
        }

        singularRnaComplexProps.rnaMoleculeProps[newRnaMoleculeName] =
          singularRnaComplexProps.rnaMoleculeProps[oldRnaMoleculeName];
        delete singularRnaComplexProps.rnaMoleculeProps[oldRnaMoleculeName];

        const basePairsPerRnaMolecule =
          basePairsPerRnaComplex[oldRnaMoleculeName];
        delete basePairsPerRnaComplex[oldRnaMoleculeName];
        basePairsPerRnaComplex[newRnaMoleculeName] = basePairsPerRnaMolecule;

        setNucleotideKeysToRerender({
          [rnaComplexIndex]: {},
        });
      };
    }, []);
    const updateBasePairAverageDistances = useMemo(function () {
      return function (
        rnaComplexKey: RnaComplexKey,
        basePairDistances: Context.BasePair.AllDistances
      ) {
        const basePairAverageDistances =
          basePairAverageDistancesReference.current;
        setBasePairAverageDistances({
          ...basePairAverageDistances,
          [rnaComplexKey]: basePairDistances,
        });
      };
    }, []);
    const updateLabelContentDefaultStyles = useMemo(function () {
      return function (
        rnaComplexKey: RnaComplexKey,
        rnaMoleculeKey: RnaMoleculeKey,
        defaultStyle: Partial<Context.Label.Content.Style>
      ) {
        const labelContentDefaultStyles =
          labelContentDefaultStylesReference.current as LabelContentStyles;
        const newLabelContentDefaultStyles = structuredClone(
          labelContentDefaultStyles
        );
        if (!(rnaComplexKey in newLabelContentDefaultStyles)) {
          newLabelContentDefaultStyles[rnaComplexKey] = {};
        }
        const newLabelContentDefaultStylesPerRnaComplex =
          newLabelContentDefaultStyles[rnaComplexKey];
        newLabelContentDefaultStylesPerRnaComplex[rnaMoleculeKey] = {
          ...newLabelContentDefaultStylesPerRnaComplex[rnaMoleculeKey],
          ...defaultStyle,
        };
        setLabelContentDefaultStyles(newLabelContentDefaultStyles);
      };
    }, []);
    const updateInteractionConstraintOptions = useMemo(function () {
      return function (
        newInteractionConstraintOptions: Partial<InteractionConstraint.Options>
      ) {
        setRightClickMenuContent(
          <b
            style={{
              color: "red",
            }}
          >
            The current right-click menu is no longer valid, due to updated
            interaction-constraint options.
          </b>,
          {}
        );
        setInteractionConstraintOptions({
          ...(interactionConstraintOptionsReference.current as InteractionConstraint.Options),
          ...newInteractionConstraintOptions,
        });
      };
    }, []);
    const setRightClickMenuContent = useCallback(
      function(
        rightClickMenuContent: JSX.Element,
        rightClickMenuAffectedNucleotides: FullKeysRecord
      ) {
        const rnaComplexProps = rnaComplexPropsReference.current!;
        _setRightClickMenuContent(
          <div
            style={{
              width: "100%",
              display: "block",
              boxSizing: "border-box",
            }}
          >
            {rightClickMenuContent}
          </div>
        );
        setRightClickMenuAffectedNucleotideIndices(
          rightClickMenuAffectedNucleotides
        );

        // Extract element information from the first affected nucleotide
        if (Object.keys(rightClickMenuAffectedNucleotides).length > 0) {
          try {
            const rnaComplexIndex = parseInt(
              Object.keys(rightClickMenuAffectedNucleotides)[0]
            );
            const rnaMoleculeName = Object.keys(
              rightClickMenuAffectedNucleotides[rnaComplexIndex]
            )[0];
            const nucleotideIndices = Array.from(
              rightClickMenuAffectedNucleotides[rnaComplexIndex][rnaMoleculeName]
            );

            if (nucleotideIndices.length > 0) {
              const fullKeys = {
                rnaComplexIndex,
                rnaMoleculeName,
                nucleotideIndex: nucleotideIndices[0],
              };

              // Determine element type based on context
              let elementType: "nucleotide" | "basepair" | "label" = "nucleotide";
              // Check if this is a base pair interaction by looking at the right-click menu content
              const menuString = rightClickMenuContent.toString();
              if (
                menuString.includes("basepair") ||
                menuString.includes("BasePair")
              ) {
                elementType = "basepair";
              }

              const elementInfo = extractElementInfo(
                fullKeys,
                rnaComplexProps,
                elementType
              );
              setSelectedElementInfo(elementInfo);
            }
          } catch (error) {
            console.warn("Error extracting element info:", error);
            setSelectedElementInfo(undefined);
          }

          if (currentTabRef.current !== Tab.FORMAT) {
            setRightDrawerTitle("Properties");
            setDrawerKind(DrawerKind.PROPERTIES);
          }
        } else {
          setSelectedElementInfo(undefined);
        }
      },
      []
    );
    
    const renderedRnaComplexes = useMemo(
      function () {
        const basePairKeysToEdit = basePairKeysToEditReference.current!;
        return (
          <Context.App.RnaComplexProps.Provider value={rnaComplexProps}>
            <Context.Nucleotide.LabelsOnlyFlag.Provider
              value={labelsOnlyFlag && tab == Tab.EDIT}
            >
              <Context.App.SetMouseOverText.Provider value={setMouseOverText}>
                <Context.Nucleotide.OnMouseDownHelper.Provider
                  value={nucleotideOnMouseDownHelper}
                >
                  <Context.Label.Content.OnMouseDownHelper.Provider
                    value={labelContentOnMouseDownHelper}
                  >
                    <Context.Label.Line.Body.OnMouseDownHelper.Provider
                      value={labelLineBodyOnMouseDownHelper}
                    >
                      <Context.Label.Line.Endpoint.OnMouseDownHelper.Provider
                        value={labelLineEndpointOnMouseDownHelper}
                      >
                        <Context.SequenceConnector.Body.OnMouseDownHelper.Provider
                          value={sequenceConnectorBodyOnMouseDownHelper}
                        >
                          <Context.SequenceConnector.Breakpoint.OnMouseDownHelper.Provider
                            value={sequenceConnectorBreakpointOnMouseDownHelper}
                          >
                            <Context.TextAnnotation.OnMouseDownHelper.Provider
                              value={textAnnotationOnMouseDownHelper}
                            >
                        <g
                          id={SVG_SCENE_GROUP_HTML_ID}
                          {...{
                            [SVG_PROPERTY_XRNA_TYPE]: SvgPropertyXrnaType.SCENE,
                            [SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME]:
                              complexDocumentName,
                            [SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG]: true,
                            [SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG]: false,
                          }}
                          ref={function (svgGElement: SVGGElement | null) {
                            if (svgGElement === null) {
                              return;
                            }
                            sceneSvgGElementReference.current = svgGElement;
                          }}
                        >
                          {flattenedRnaComplexProps.map(function ([
                            rnaComplexIndexAsString,
                            singularRnaComplexProps,
                          ]) {
                            const rnaComplexIndex = Number.parseInt(
                              rnaComplexIndexAsString
                            );
                            return (
                              <Context.RnaComplex.Index.Provider
                                key={rnaComplexIndex}
                                value={rnaComplexIndex}
                              >
                                <Context.BasePair.DataToEditPerRnaComplex.Provider
                                  value={basePairKeysToEdit[rnaComplexIndex]}
                                >
                                  <RnaComplex.Component
                                    key={rnaComplexIndex}
                                    {...singularRnaComplexProps}
                                    nucleotideKeysToRerenderPerRnaComplex={
                                      nucleotideKeysToRerender[
                                        rnaComplexIndex
                                      ] ?? {}
                                    }
                                    basePairKeysToRerenderPerRnaComplex={
                                      basePairKeysToRerender[rnaComplexIndex] ??
                                      []
                                    }
                                    basePairUpdateTrigger={
                                      basePairUpdateTriggers[rnaComplexIndex] ??
                                      0
                                    }
                                  />
                                </Context.BasePair.DataToEditPerRnaComplex.Provider>
                              </Context.RnaComplex.Index.Provider>
                            );
                          })}
                        </g>
                            </Context.TextAnnotation.OnMouseDownHelper.Provider>
                          </Context.SequenceConnector.Breakpoint.OnMouseDownHelper.Provider>
                        </Context.SequenceConnector.Body.OnMouseDownHelper.Provider>
                      </Context.Label.Line.Endpoint.OnMouseDownHelper.Provider>
                    </Context.Label.Line.Body.OnMouseDownHelper.Provider>
                  </Context.Label.Content.OnMouseDownHelper.Provider>
                </Context.Nucleotide.OnMouseDownHelper.Provider>
              </Context.App.SetMouseOverText.Provider>
            </Context.Nucleotide.LabelsOnlyFlag.Provider>
          </Context.App.RnaComplexProps.Provider>
        );
      },
      [
        rnaComplexProps,
        nucleotideKeysToRerender,
        basePairKeysToRerender,
        labelsOnlyFlag && tab == Tab.EDIT,
        basePairKeysToEdit,
        basePairUpdateTriggers,
      ]
    );
    const triggerRightClickMenuFlag = useMemo(
      function () {
        for (const [
          rnaComplexIndexAsString,
          dragListenerAffectedNucleotideIndicesPerRnaComplex,
        ] of Object.entries(dragListenerAffectedNucleotideIndices)) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          if (!(rnaComplexIndex in rightClickMenuAffectedNucleotideIndices)) {
            continue;
          }
          const rightClickMenuAffectedNucleotideIndicesPerRnaComplex =
            rightClickMenuAffectedNucleotideIndices[rnaComplexIndex];
          for (const [
            rnaMoleculeName,
            dragListenerAffectedNucleotideIndicesPerRnaMolecule,
          ] of Object.entries(
            dragListenerAffectedNucleotideIndicesPerRnaComplex
          )) {
            if (
              !(
                rnaMoleculeName in
                rightClickMenuAffectedNucleotideIndicesPerRnaComplex
              )
            ) {
              continue;
            }
            const rightClickMenuAffectedNucleotideIndicesPerRnaMolecule =
              rightClickMenuAffectedNucleotideIndicesPerRnaComplex[
                rnaMoleculeName
              ];
            for (const nucleotideIndex of dragListenerAffectedNucleotideIndicesPerRnaMolecule.values()) {
              if (
                rightClickMenuAffectedNucleotideIndicesPerRnaMolecule.has(
                  nucleotideIndex
                )
              ) {
                return true;
              }
            }
          }
        }
        return false;
      },
      [
        rightClickMenuAffectedNucleotideIndices,
        dragListenerAffectedNucleotideIndices,
      ]
    );
    triggerRightClickMenuFlagReference.current = triggerRightClickMenuFlag;
    const repositionAnnotationsFlag = useMemo(
      function () {
        return settingsRecord[
          Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS
        ] as boolean;
      },
      [settingsRecord]
    );
    repositionAnnotationsFlagReference.current = repositionAnnotationsFlag;
    const resetViewport = useMemo(function () {
      return function () {
        setSceneBounds(
          (sceneSvgGElementReference.current as SVGGElement).getBBox()
        );
        setViewportTranslateX(0);
        setViewportTranslateY(0);
        setViewportScaleExponent(0);
        setViewportScale(1);
      };
    }, []);
    const parseInputFileContent = useMemo(
      function () {
        return function (
          inputFileContent: string,
          inputFileExtension: InputFileExtension,
          invertYAxisFlag?: boolean
        ) {
          const settingsRecord = settingsRecordReference.current!;
          try {
            const parsedInput = (
              r2dtLegacyVersionFlag
                ? r2dtLegacyInputFileReadersRecord
                : inputFileReadersRecord
            )[inputFileExtension](inputFileContent);
            const rnaComplexNames = new Set<string>();
            for (const singularRnaComplexProps of Object.values(
              parsedInput.rnaComplexProps
            )) {
              const { name, basePairs } = singularRnaComplexProps;
              if (rnaComplexNames.has(name)) {
                throw `RNA complexes must have distinct names.`;
              }
              rnaComplexNames.add(name);

              for (const [
                rnaMoleculeName,
                singularRnaMoleculeProps,
              ] of Object.entries(singularRnaComplexProps.rnaMoleculeProps)) {
                if (!(rnaMoleculeName in basePairs)) {
                  basePairs[rnaMoleculeName] = {};
                }
                for (const singularNucleotideProps of Object.values(
                  singularRnaMoleculeProps.nucleotideProps
                )) {
                  if (singularNucleotideProps.color === undefined) {
                    singularNucleotideProps.color = structuredClone(BLACK);
                  }
                  if (singularNucleotideProps.labelContentProps !== undefined) {
                    const labelContentProps =
                      singularNucleotideProps.labelContentProps;
                    if (labelContentProps.color === undefined) {
                      labelContentProps.color = structuredClone(BLACK);
                    }
                  }
                  if (singularNucleotideProps.labelLineProps !== undefined) {
                    const labelLineProps =
                      singularNucleotideProps.labelLineProps;
                    if (labelLineProps.color === undefined) {
                      labelLineProps.color = structuredClone(BLACK);
                    }
                  }
                }
              }
            }
            if (invertYAxisFlag === undefined) {
              invertYAxisFlag =
                defaultInvertYAxisFlagRecord[inputFileExtension];
            }
            if (invertYAxisFlag) {
              for (const singularRnaComplexProps of parsedInput.rnaComplexProps) {
                Object.values(singularRnaComplexProps.rnaMoleculeProps).forEach(
                  (singularRnaMoleculeProps: RnaMolecule.ExternalProps) => {
                    Object.values(
                      singularRnaMoleculeProps.nucleotideProps
                    ).forEach(
                      (singularNucleotideProps: Nucleotide.ExternalProps) => {
                        singularNucleotideProps.y *= -1;
                        if (
                          singularNucleotideProps.labelLineProps !== undefined
                        ) {
                          for (
                            let i = 0;
                            i <
                            singularNucleotideProps.labelLineProps.points
                              .length;
                            i++
                          ) {
                            singularNucleotideProps.labelLineProps.points[
                              i
                            ].y *= -1;
                          }
                        }
                        if (
                          singularNucleotideProps.labelContentProps !==
                          undefined
                        ) {
                          singularNucleotideProps.labelContentProps.y *= -1;
                        }
                      }
                    );
                  }
                );
              }
            }
            setUndoStack([]);
            setRedoStack([]);
            setBasePairKeysToEdit({});
            
            // Calculate and update base pair distance settings
            const calculatedDistances = calculateBasePairDistances(parsedInput.rnaComplexProps);
            setSettingsRecord(prevSettings => ({
              ...prevSettings,
              [Setting.CANONICAL_BASE_PAIR_DISTANCE]: calculatedDistances.canonicalDistance,
              [Setting.WOBBLE_BASE_PAIR_DISTANCE]: calculatedDistances.wobbleDistance,
              [Setting.MISMATCH_BASE_PAIR_DISTANCE]: calculatedDistances.mismatchDistance,
              [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS]: calculatedDistances.contiguousDistance
            }));
            
            setDrawerKind(DrawerKind.NONE);
            setBasepairSheetOpen(false);
            setBasePairKeysToEdit({});
            setRnaComplexProps(parsedInput.rnaComplexProps);
            resetGlobalHelicesForFormatMenu(parsedInput.rnaComplexProps);
            if (Object.keys(parsedInput.rnaComplexProps).length > 0) {
              setTimeout(
                function () {
                  if (settingsRecord[Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD]) {
                    resetViewport();
                  }
                  let boundingRectHeightsSum = 0;
                  let numberOfBoundingRects = 0;
                  const nucleotideElements = Array.from(
                    document.querySelectorAll(
                      `.${NUCLEOTIDE_CLASS_NAME}`
                    ) as NodeListOf<SVGGraphicsElement>
                  );
                  for (const nucleotideElement of nucleotideElements) {
                    const boundingClientRect = nucleotideElement.getBBox();
                    boundingRectHeightsSum += boundingClientRect.height;
                    numberOfBoundingRects++;
                  }
                  const averageBoundingRectHeight =
                    numberOfBoundingRects == 0
                      ? 1
                      : (boundingRectHeightsSum / numberOfBoundingRects);
                  const newBasePairRadius = averageBoundingRectHeight * 0.3; // font 6 -> bp 1.8
                  setAverageNucleotideBoundingRectHeight(averageBoundingRectHeight);
                  setBasePairRadius(newBasePairRadius);
                  setSettingsRecord(prevSettings => ({
                    ...prevSettings,
                    [Setting.BASE_PAIR_RADIUS] : newBasePairRadius
                  }));
                  setTimeout(
                    () => {
                      resetViewport();
                      setSceneState(SceneState.DATA_IS_LOADED);
                    },
                    0
                  );
                },
                2000
              );
            } else {
              setSceneState(SceneState.NO_DATA);
            }
            setComplexDocumentName(parsedInput.complexDocumentName);
          } catch (error) {
            setDrawerKind(DrawerKind.PROPERTIES);
            setSceneState(SceneState.DATA_LOADING_FAILED);
            if (typeof error === "string") {
              setDataLoadingFailedErrorMessage(error);
              setDataLoadingFailedErrorDetails(error);
            } else if (error && typeof (error as any).message === "string") {
              setDataLoadingFailedErrorMessage((error as any).message);
              setDataLoadingFailedErrorDetails(
                (error as any).stack ?? String(error)
              );
            } else {
              setDataLoadingFailedErrorMessage(
                "Failed to load data. The file may be in an unsupported format or contain invalid data."
              );
              setDataLoadingFailedErrorDetails(String(error ?? ""));
            }
          }
        };
      },
      [r2dtLegacyVersionFlag]
    );
    const parseJson = useMemo(function () {
      return function (url: string) {
        let promise = fetch(url, {
          method: "GET",
        });
        promise.then((data) => {
          data.text().then((dataAsText) => {
            parseInputFileContent(dataAsText, InputFileExtension.json);
          });
        });
      };
    }, []);
    const undoRedoHelper = useMemo(function () {
      return function (
        fromStack: UndoRedoStack,
        toStack: UndoRedoStack,
        setFromStack: (fromStack: UndoRedoStack) => void,
        setToStack: (toStack: UndoRedoStack) => void
      ) {
        const indicesOfFrozenNucleotides =
          indicesOfFrozenNucleotidesReference.current!;
        const rnaComplexProps = rnaComplexPropsReference.current!;
        const rightClickMenuAffectedNucleotideIndices =
          rightClickMenuAffectedNucleotideIndicesReference.current!;
        const globalHelicesForFormatMenu = globalHelicesForFormatMenuReference.current;

        if (fromStack.length > 0) {
          const newFromStack = [...fromStack];
          const copiedState = newFromStack.pop()!;
          setFromStack(newFromStack);
          if ("rnaComplexProps" in copiedState) {
            setToStack([
              ...toStack,
              { 
                rnaComplexProps : structuredClone(rnaComplexProps),
                globalHelicesForFormatMenu : structuredClone(globalHelicesForFormatMenu)
              }
            ]);
          } else {
            setToStack([
              ...toStack,
              structuredClone(indicesOfFrozenNucleotides)
            ]);
          }

          if ("rnaComplexProps" in copiedState) {
            const { rnaComplexProps, globalHelicesForFormatMenu } = copiedState;
            setBasePairKeysToEdit({});
            setRnaComplexProps(rnaComplexProps);
            setGlobalHelicesForFormatMenu(globalHelicesForFormatMenu);
          } else {
            setIndicesOfFrozenNucleotides(copiedState);
          }
        }
      };
    }, []);
    const undo = useMemo(function () {
      return function () {
        undoRedoHelper(
          undoStackReference.current!,
          redoStackReference.current!,
          setUndoStack,
          setRedoStack
        );
      };
    }, []);
    const redo = useMemo(function () {
      return function () {
        undoRedoHelper(
          redoStackReference.current!,
          undoStackReference.current!,
          setRedoStack,
          setUndoStack
        );
      };
    }, []);
    const canUndoFlag = useMemo(
      () => undoStackReference.current!.length > 0,
      [undoStackReference.current]
    );
    const canRedoFlag = useMemo(
      () => redoStackReference.current!.length > 0,
      [redoStackReference.current]
    );
    const onMouseMove = useMemo(function () {
      return function (e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
        // Track UI-space mouse position relative to the SVG for tooltip placement
        const boundingRect = (
          e.currentTarget as SVGSVGElement
        ).getBoundingClientRect();
        setMouseUIPosition({
          x: e.clientX - boundingRect.left,
          y: e.clientY - boundingRect.top,
        });

        const flattenedRnaComplexPropsLength =
          flattenedRnaComplexPropsLengthReference.current;
        if (flattenedRnaComplexPropsLength === 0) {
          return;
        }

        const mouseCoordinates = {
          x: e.clientX,
          y: e.clientY,
        };

        const dragListener =
          dragListenerReference.current as DragListener | null;
        if (dragListener !== null) {
          const originOfDrag = originOfDragReference.current as Vector2D;
          const dragCache = dragCacheReference.current as Vector2D;
          const viewportScale = viewportScaleReference.current as number;
          const sceneBoundsScaleMin =
            sceneBoundsScaleMinReference.current as number;
          const repositionAnnotationsFlag =
            repositionAnnotationsFlagReference.current as boolean;
          const triggerRightClickMenuFlag =
            triggerRightClickMenuFlagReference.current as boolean;
          const resetOrientationDataTrigger =
            resetOrientationDataTriggerReference.current as boolean;
          const translation = subtract(mouseCoordinates, originOfDrag);
          translation.y = -translation.y;
          dragListener.continueDrag(
            add(
              dragCache,
              scaleDown(translation, viewportScale * sceneBoundsScaleMin)
            ),
            repositionAnnotationsFlag
          );
          if (triggerRightClickMenuFlag) {
            setResetOrientationDataTrigger(!resetOrientationDataTrigger);
          }
        }

        const dataSpaceOriginOfDrag = dataSpaceOriginOfDragReference.current;
        const tab = tabReference.current as Tab;
        if (
          dataSpaceOriginOfDrag !== undefined &&
          InteractionConstraint.isSupportedTab(tab)
        ) {
          const mouseDataSpaceCoordinates =
            transformIntoDataSpace(mouseCoordinates);
          const xCoordinates = [
            dataSpaceOriginOfDrag.x,
            mouseDataSpaceCoordinates.x,
          ].sort(subtractNumbers);
          const yCoordinates = [
            dataSpaceOriginOfDrag.y,
            mouseDataSpaceCoordinates.y,
          ].sort(subtractNumbers);
          const minX = xCoordinates[0];
          const minY = yCoordinates[0];
          setDebugVisualElements([
            <rect
              key={0}
              x={minX}
              y={minY}
              width={xCoordinates[1] - minX}
              height={yCoordinates[1] - minY}
              fill="none"
              stroke={strokesPerTab[tab]}
              strokeWidth={DEFAULT_STROKE_WIDTH}
            />,
          ]);
        }
        e.preventDefault();
      };
    }, []);
    const onMouseDown = useMemo(function () {
      return function (e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
        const clickedOnCoordinates = {
          x: e.clientX,
          y: e.clientY,
        };
        switch (e.button) {
          case MouseButtonIndices.Left: {
            setOriginOfDrag(clickedOnCoordinates);
            break;
          }
          case MouseButtonIndices.Right: {
            const clickedOnCoordinatesInDataSpace =
              transformIntoDataSpace(clickedOnCoordinates);
            setDataSpaceOriginOfDrag(clickedOnCoordinatesInDataSpace);
            break;
          }
        }
      };
    }, []);
    const onMouseUp = useMemo(function () {
      return function (e: React.MouseEvent<SVGSVGElement, MouseEvent>) {
        const settingsRecord = settingsRecordReference.current!;
        const treatNoncanonicalBasePairsAsUnpairedFlag = settingsRecord[
          Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED
        ] as boolean;
        const dragListener =
          dragListenerReference.current as DragListener | null;
        if (dragListener !== null) {
          if (dragListener.terminateDrag !== undefined) {
            dragListener.terminateDrag();
          }
          setDragListener(null, {});

          // Auto-trigger sequence connectors check after drag
          const sequenceConnectorAutoTrigger = settingsRecord[
            Setting.SEQUENCE_CONNECTOR_AUTO_TRIGGER
          ] as boolean;
          
          if (sequenceConnectorAutoTrigger) {
            const distanceThresholdMultiplier = settingsRecord[Setting.SEQUENCE_CONNECTOR_DISTANCE_THRESHOLD] as number;
            const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
            const keysToRerender: NucleotideKeysToRerender = {};
            let hasChanges = false;

            for (const [complexIndexStr, complex] of Object.entries(rnaComplexProps)) {
              const complexIndex = Number.parseInt(complexIndexStr);
              for (const [molName, molecule] of Object.entries(complex.rnaMoleculeProps)) {
                const sortedIndices = Object.keys(molecule.nucleotideProps).map(Number).sort((a,b) => a-b);
                let totalDist = 0;
                let count = 0;
                
                // Calculate average distance between adjacent nucleotides
                for(let i=0; i<sortedIndices.length-1; i++) {
                  const idx1 = sortedIndices[i];
                  const idx2 = sortedIndices[i+1];
                  if (idx2 === idx1 + 1) {
                    const n1 = molecule.nucleotideProps[idx1];
                    const n2 = molecule.nucleotideProps[idx2];
                    const dx = n2.x - n1.x;
                    const dy = n2.y - n1.y;
                    totalDist += Math.sqrt(dx*dx + dy*dy);
                    count++;
                  }
                }

                if (count === 0) continue;
                
                const avgDist = totalDist / count;
                const threshold = avgDist * distanceThresholdMultiplier;

                // Check for gaps that exceed threshold
                for(let i=0; i<sortedIndices.length-1; i++) {
                  const idx1 = sortedIndices[i];
                  const idx2 = sortedIndices[i+1];
                  
                  if (idx2 !== idx1 + 1) continue;

                  const n1 = molecule.nucleotideProps[idx1];
                  const n2 = molecule.nucleotideProps[idx2];
                  const dx = n2.x - n1.x;
                  const dy = n2.y - n1.y;
                  const d = Math.sqrt(dx*dx + dy*dy);

                  if (d > threshold) {
                    // Only create connector if it doesn't exist
                    // If it exists with deleted=true, it acts as a marker to prevent re-creation
                    if (!n1.sequenceConnectorToNext) {
                      n1.sequenceConnectorToNext = {
                        breakpoints: []
                      };
                      
                      if(!keysToRerender[complexIndex]) keysToRerender[complexIndex] = {};
                      if(!keysToRerender[complexIndex][molName]) keysToRerender[complexIndex][molName] = [];
                      keysToRerender[complexIndex][molName].push(idx1);
                      hasChanges = true;
                    }
                  } else {
                    // Remove connector if distance is back to normal, but only if not manually deleted
                    // (deleted connectors stay as markers to prevent re-creation)
                    if (n1.sequenceConnectorToNext && !n1.sequenceConnectorToNext.deleted) {
                      delete n1.sequenceConnectorToNext;
                      
                      if(!keysToRerender[complexIndex]) keysToRerender[complexIndex] = {};
                      if(!keysToRerender[complexIndex][molName]) keysToRerender[complexIndex][molName] = [];
                      keysToRerender[complexIndex][molName].push(idx1);
                      hasChanges = true;
                    }
                  }
                }
              }
            }

            if (hasChanges) {
              setNucleotideKeysToRerender(keysToRerender);
            }
          }
        }
        const dataSpaceOriginOfDrag = dataSpaceOriginOfDragReference.current;
        const tab = tabReference.current as Tab;
        if (
          dataSpaceOriginOfDrag !== undefined &&
          InteractionConstraint.isSupportedTab(tab)
        ) {
          setDebugVisualElements([]);
          const mouseCoordinates = {
            x: e.clientX,
            y: e.clientY,
          };
          const mouseDataSpaceCoordinates =
            transformIntoDataSpace(mouseCoordinates);
          const xCoordinates = [
            dataSpaceOriginOfDrag.x,
            mouseDataSpaceCoordinates.x,
          ].sort(subtractNumbers);
          const yCoordinates = [
            dataSpaceOriginOfDrag.y,
            mouseDataSpaceCoordinates.y,
          ].sort(subtractNumbers);
          const minX = xCoordinates[0];
          const minY = yCoordinates[0];
          const maxX = xCoordinates[1];
          const maxY = yCoordinates[1];
          if (
            // Attempt to avoid unnecessary click-and-drag, which is unintuitive to users. These metrics are arbitrary.
            maxX - minX > 0.5 ||
            maxY - minY > 0.5
          ) {
            const fullKeysOfCapturedNucleotides = new Array<FullKeys>();
            const labelsEncounteredKeysRecord: Record<
              RnaMoleculeKey,
              Set<NucleotideKey>
            > = {};
            const fullKeysOfCapturedLabels = new Array<FullKeys>();
            const rnaComplexProps =
              rnaComplexPropsReference.current as RnaComplexProps;
            function validateLabel(
              { rnaMoleculeName, nucleotideIndex }: RnaComplex.BasePairKeys,
              { x, y }: Vector2D
            ) {
              if (x < minX || x > maxX || y < minY || y > maxY) {
                return false;
              }

              if (!(rnaMoleculeName in labelsEncounteredKeysRecord)) {
                labelsEncounteredKeysRecord[rnaMoleculeName] =
                  new Set<NucleotideKey>();
              }
              const labelsEncounteredKeysRecordPerRnaMolecule =
                labelsEncounteredKeysRecord[rnaMoleculeName];
              if (
                labelsEncounteredKeysRecordPerRnaMolecule.has(nucleotideIndex)
              ) {
                return false;
              }
              labelsEncounteredKeysRecordPerRnaMolecule.add(nucleotideIndex);
              return true;
            }
            for (const [
              rnaComplexIndexAsString,
              { rnaMoleculeProps },
            ] of Object.entries(rnaComplexProps)) {
              const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
              for (const [
                rnaMoleculeName,
                { nucleotideProps },
              ] of Object.entries(rnaMoleculeProps)) {
                for (const [
                  nucleotideIndexAsString,
                  singularNucleotideProps,
                ] of Object.entries(nucleotideProps)) {
                  const { labelContentProps, labelLineProps } =
                    singularNucleotideProps;
                  const nucleotideIndex = Number.parseInt(
                    nucleotideIndexAsString
                  );

                  const fullKeys = {
                    rnaComplexIndex,
                    rnaMoleculeName,
                    nucleotideIndex,
                  };

                  if (validateLabel(fullKeys, singularNucleotideProps)) {
                    fullKeysOfCapturedNucleotides.push(fullKeys);
                  }
                  if (labelContentProps !== undefined) {
                    const absolutePosition = add(
                      singularNucleotideProps,
                      labelContentProps
                    );
                    if (validateLabel(fullKeys, absolutePosition)) {
                      fullKeysOfCapturedLabels.push(fullKeys);
                    }
                  }
                  if (labelLineProps !== undefined) {
                    for (const point of labelLineProps.points) {
                      const absolutePosition = add(
                        singularNucleotideProps,
                        point
                      );
                      if (validateLabel(fullKeys, absolutePosition)) {
                        fullKeysOfCapturedLabels.push(fullKeys);
                      }
                    }
                  }
                }
              }
            }
            let interactionConstraintAndFullKeys =
              getInteractionConstraintAndFullKeys(
                fullKeysOfCapturedNucleotides,
                rnaComplexProps,
                treatNoncanonicalBasePairsAsUnpairedFlag
              );
            setAutoDetectedInteractionConstraintMessage("Auto-detected");
            if (interactionConstraintAndFullKeys !== undefined) {
              const { fullKeys, interactionConstraint } =
                interactionConstraintAndFullKeys;
              setInteractionConstraint(interactionConstraint);
              nucleotideOnMouseDownRightClickHelper(
                fullKeys,
                interactionConstraint,
                tab as InteractionConstraint.SupportedTab
              );
            } else {
              interactionConstraintAndFullKeys =
                getInteractionConstraintAndFullKeys(
                  fullKeysOfCapturedLabels,
                  rnaComplexProps,
                  treatNoncanonicalBasePairsAsUnpairedFlag
                );
              if (interactionConstraintAndFullKeys !== undefined) {
                const { fullKeys, interactionConstraint } =
                  interactionConstraintAndFullKeys;
                setInteractionConstraint(interactionConstraint);
                labelOnMouseDownRightClickHelper(
                  fullKeys,
                  interactionConstraint
                );
              }
            }
          }
        }
        setDataSpaceOriginOfDrag(undefined);
      };
    }, []);
    const onMouseLeave = useMemo(function () {
      return function () {
        setDragListener(null, {});
        setDebugVisualElements([]);
        setDataSpaceOriginOfDrag(undefined);
        // Hide hover tooltip when leaving the SVG
        setMouseOverText("");
      };
    }, []);
    const onWheel = useMemo(function () {
      return function (e: React.WheelEvent<SVGSVGElement>) {
        const flattenedRnaComplexPropsLength =
          flattenedRnaComplexPropsLengthReference.current;
        if (flattenedRnaComplexPropsLength === 0) {
          return;
        }

        const viewportScaleExponent =
          viewportScaleExponentReference.current as number;
        const totalScale = totalScaleReference.current as TotalScale;
        const sceneBounds = sceneBoundsReference.current as SceneBounds;
        const viewportTranslateX =
          viewportTranslateXReference.current as number;
        const viewportTranslateY =
          viewportTranslateYReference.current as number;
        const sceneBoundsScaleMin =
          sceneBoundsScaleMinReference.current as number;

        // Apparently, the sign of <event.deltaY> needs to be negated in order to support intuitive scrolling...
        let newScaleExponent = viewportScaleExponent - sign(e.deltaY);
        let newScale =
          newScaleExponent in viewportScalePowPrecalculation
            ? viewportScalePowPrecalculation[newScaleExponent]
            : Math.pow(SCALE_BASE, newScaleExponent);
        setViewportScale(newScale);
        setViewportScaleExponent(newScaleExponent);
        let uiVector = {
          x: e.clientX - LEFT_PANEL_WIDTH - DIV_BUFFER_DIMENSION,
          y: e.clientY - TOPBAR_HEIGHT,
        };
        let reciprocal = totalScale.negativeScale;
        let inputVector = {
          x: uiVector.x * reciprocal + sceneBounds.x - viewportTranslateX,
          y:
            uiVector.y * reciprocal -
            sceneBounds.y +
            viewportTranslateY -
            sceneBounds.height,
        };
        reciprocal = 1 / (newScale * sceneBoundsScaleMin);
        let newOriginDeltaX =
          uiVector.x * reciprocal - inputVector.x + sceneBounds.x;
        let newOriginDeltaY = -(
          uiVector.y * reciprocal -
          inputVector.y -
          sceneBounds.y -
          sceneBounds.height
        );
        setViewportTranslateX(newOriginDeltaX);
        setViewportTranslateY(newOriginDeltaY);
      };
    }, []);

    // Zoom in/out functions for the floating controls
    const onZoomIn = useMemo(() => {
      return () => {
        const flattenedRnaComplexPropsLength =
          flattenedRnaComplexPropsLengthReference.current;
        if (flattenedRnaComplexPropsLength === 0) {
          return;
        }

        const viewportScaleExponent =
          viewportScaleExponentReference.current as number;
        let newScaleExponent = viewportScaleExponent + 1;
        let newScale =
          newScaleExponent in viewportScalePowPrecalculation
            ? viewportScalePowPrecalculation[newScaleExponent]
            : Math.pow(SCALE_BASE, newScaleExponent);
        
        if (newScaleExponent <= VIEWPORT_SCALE_EXPONENT_MAXIMUM) {
          setViewportScale(newScale);
          setViewportScaleExponent(newScaleExponent);
        }
      };
    }, []);

    const onZoomOut = useMemo(() => {
      return () => {
        const flattenedRnaComplexPropsLength =
          flattenedRnaComplexPropsLengthReference.current;
        if (flattenedRnaComplexPropsLength === 0) {
          return;
        }

        const viewportScaleExponent =
          viewportScaleExponentReference.current as number;
        let newScaleExponent = viewportScaleExponent - 1;
        let newScale =
          newScaleExponent in viewportScalePowPrecalculation
            ? viewportScalePowPrecalculation[newScaleExponent]
            : Math.pow(SCALE_BASE, newScaleExponent);
        
        if (newScaleExponent >= VIEWPORT_SCALE_EXPONENT_MINIMUM) {
          setViewportScale(newScale);
          setViewportScaleExponent(newScaleExponent);
        }
      };
    }, []);

    const onKeyDown = useMemo(
      function () {
        return function (event: React.KeyboardEvent<Element>) {
          switch (event.key.toLowerCase()) {
            case "0": {
              if (event.ctrlKey) {
                event.preventDefault();
                resetViewport();
              }
              break;
            }
            case "o": {
              if (event.ctrlKey) {
                event.preventDefault();
                uploadInputFileHtmlInputReference.current!.click();
              }
              break;
            }
            case "s": {
              if (event.ctrlKey) {
                event.preventDefault();
                if (downloadButtonErrorMessage == "") {
                  downloadOutputFileHtmlButtonReference.current!.click();
                } else {
                  setDataLoadingFailedErrorMessage(downloadButtonErrorMessage);
                }
              }
              break;
            }
            case "y": {
              redo();
              break;
            }
            case "z": {
              if (event.shiftKey) {
                redo();
              } else {
                undo();
              }
              break;
            }
            case "escape" : {
              setBasepairSheetOpen(false);
              setDrawerKind(DrawerKind.NONE);
              break;
            }
            case "x" : {
              setXKeyPressedFlag(true);
              break;
            }
            case "t" : {
              if (event.altKey) {
                event.preventDefault();
                // Switch to Annotate tab
                setTab(Tab.ANNOTATE);
                
                // Create text annotation in center of viewport
                const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
                const complexIndices = Object.keys(rnaComplexProps).map(Number);
                if (complexIndices.length === 0) return;
                
                const complexIndex = complexIndices[0];
                const complex = rnaComplexProps[complexIndex];
                
                // Initialize textAnnotations if needed
                if (!complex.textAnnotations) {
                  complex.textAnnotations = {};
                }
                
                // Calculate center of viewport in data space
                const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
                const viewportScale = viewportScaleReference.current as number;
                const transformTranslate0 = transformTranslate0Reference.current!;
                const transformTranslate1 = transformTranslate1Reference.current!;
                
                const viewportWidth = (parentDivResizeDetector.width ?? 0) - LEFT_PANEL_WIDTH;
                const viewportHeight = (parentDivResizeDetector.height ?? 0) - TOPBAR_HEIGHT;
                
                let centerCoords = { x: viewportWidth / 2, y: viewportHeight / 2 };
                centerCoords = scaleDown(centerCoords, sceneBoundsScaleMin * viewportScale);
                centerCoords.y = -centerCoords.y;
                centerCoords = subtract(
                  centerCoords,
                  add(transformTranslate0.asVector, transformTranslate1.asVector)
                );
                
                // Create new annotation
                const annotationId = `text-${Date.now()}`;
                const newAnnotation: TextAnnotation.Props = {
                  id: annotationId,
                  content: "New Text",
                  x: centerCoords.x,
                  y: centerCoords.y,
                };
                
                pushToUndoStack();
                complex.textAnnotations[annotationId] = newAnnotation;
                setNucleotideKeysToRerender({});
                
                // Open edit menu for the new annotation
                setDrawerKind(DrawerKind.PROPERTIES);
                setRightClickMenuContent(
                  <TextAnnotationEditMenu
                    annotation={newAnnotation}
                    onUpdate={() => setNucleotideKeysToRerender({})}
                    onDelete={() => {
                      pushToUndoStack();
                      if (complex.textAnnotations) {
                        delete complex.textAnnotations[annotationId];
                      }
                      setNucleotideKeysToRerender({});
                      setRightClickMenuContent(<></>, {});
                    }}
                  />,
                  {}
                );
              }
              break;
            }
          }
        };
      },
      [
        uploadInputFileHtmlInputReference.current,
        downloadOutputFileHtmlButtonReference.current,
        downloadButtonErrorMessage,
        parentDivResizeDetector.width,
        parentDivResizeDetector.height,
      ]
    );
    const onKeyUp = useCallback(
      (event : React.KeyboardEvent<Element>) => {
        switch (event.key.toLowerCase()) {
          case "x" : {
            setXKeyPressedFlag(false);
            break;
          }
        }
      },
      []
    );
    const labelClassName = useMemo(
      function () {
        return tab === Tab.EDIT ? LABEL_CLASS_NAME : NO_STROKE_CLASS_NAME;
      },
      [tab]
    );
    const basePairClassName = useMemo(
      function () {
        return tab in strokesPerTab
          ? BASE_PAIR_CLASS_NAME
          : NO_STROKE_CLASS_NAME;
      },
      [tab]
    );
    const transformIntoDataSpace = useCallback(
      function (clickedOnCoordinates: Vector2D) {
        const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
        const viewportScale = viewportScaleReference.current as number;
        const transformTranslate0 = transformTranslate0Reference.current!;
        const transformTranslate1 = transformTranslate1Reference.current!;

        let transformedCoordinates = structuredClone(clickedOnCoordinates);
        transformedCoordinates.x -= LEFT_PANEL_WIDTH;
        transformedCoordinates = scaleDown(
          transformedCoordinates,
          sceneBoundsScaleMin * viewportScale
        );
        transformedCoordinates.y -= TOPBAR_HEIGHT;
        transformedCoordinates.y = -transformedCoordinates.y;
        transformedCoordinates = subtract(
          transformedCoordinates,
          add(transformTranslate0.asVector, transformTranslate1.asVector)
        );
        return transformedCoordinates;
      },
      []
    );
    const resetRightClickMenuContent = useMemo(function () {
      return function () {
        const flattenedRnaComplexProps =
          flattenedRnaComplexPropsReference.current as Array<
            [string, RnaComplex.ExternalProps]
          >;
        const tab = tabReference.current as Tab;
        let rightClickPrompt = "";
        if (flattenedRnaComplexProps.length === 0) {
          const promptStart =
            "You must load a non-empty input file before attempting to ";
          switch (tab) {
            case Tab.EDIT: {
              rightClickPrompt = promptStart + "edit.";
              break;
            }
            case Tab.FORMAT: {
              rightClickPrompt = promptStart + "format.";
              break;
            }
            case Tab.ANNOTATE: {
              rightClickPrompt = promptStart + "annotate.";
              break;
            }
          }
        } else {
          const promptStart = "Right-click on a constraint to begin ";
          switch (tab) {
            case Tab.EDIT: {
              rightClickPrompt = promptStart + "editing.";
              break;
            }
            case Tab.FORMAT: {
              rightClickPrompt = promptStart + "formating.";
              break;
            }
            case Tab.ANNOTATE: {
              rightClickPrompt = promptStart + "annotating.";
              break;
            }
          }
        }
        setRightClickMenuContent(
          <b
            style={{
              color: "red",
              width: "100%",
            }}
          >
            {rightClickPrompt}
          </b>,
          {}
        );
      };
    }, []);
    
    const canvasFill = useMemo(() => {
      const darkModeFlag = settingsRecord[Setting.DARK_MODE];
      return darkModeFlag ? "#514646" : "#F0F0F0";
    }, [settingsRecord]);
    const saveFile = useMemo(
      () => {
        if (
          !("showSaveFilePicker" in window) ||
          typeof window.showSaveFilePicker !== "function"
        ) {
          return undefined;
        }
        const windowShowSaveFilePicker = window.showSaveFilePicker;
        async function getOutputFileHandle() {
          const outputFileName = outputFileNameReference.current!;
          const outputFileExtension = outputFileExtensionReference.current!;
          return await windowShowSaveFilePicker({
            suggestedName: `${outputFileName}.${outputFileExtension}`,
            types: [
              {
                description: "",
                accept: {
                  "text/plain": [`.${outputFileExtension}`],
                },
              },
            ],
          });
        }
        return async function () {
          const outputFileHandle = outputFileHandleReference.current!;
          let localOutputFileHandle = outputFileHandle;
          if (outputFileHandle === undefined) {
            localOutputFileHandle = await getOutputFileHandle();
            setOutputFileHandle(localOutputFileHandle);
          }
          const outputFileExtension = outputFileExtensionReference.current!;
          const rnaComplexProps = rnaComplexPropsReference.current!;
          const complexDocumentName = complexDocumentNameReference.current!;

          const writable = await localOutputFileHandle.createWritable();
          await writable.write(
            outputFileWritersMap[outputFileExtension](
              rnaComplexProps,
              complexDocumentName
            )
          );
          await writable.close();
          setUnsavedWorkFlag(false);
        }
      },
      []
    );
    const downloadFile = useCallback(
      () => {
        const outputFileName = outputFileNameReference.current;
        const outputFileExtension = outputFileExtensionReference.current!;
        const rnaComplexProps = rnaComplexPropsReference.current!;
        const complexDocumentName = complexDocumentNameReference.current!;
        const blob = new Blob([
          outputFileWritersMap[outputFileExtension](
            rnaComplexProps,
            complexDocumentName
          )
        ], {
          type : "text/plain"
        });
        const url = URL.createObjectURL(blob);
        const downloadAnchor = document.createElement("a");
        downloadAnchor.href = url;
        downloadAnchor.download = `${outputFileName}.${outputFileExtension}`;
        document.body.appendChild(downloadAnchor);
        downloadAnchor.click();
        document.body.removeChild(downloadAnchor);
        URL.revokeObjectURL(url);
        setUnsavedWorkFlag(false);
      },
      []
    );
    const renderedRightDrawer = useMemo(
      function () {
        const settingsRecord = settingsRecordReference.current!;
        const basePairAverageDistances = basePairAverageDistancesReference.current!;
        
        let children : JSX.Element;
        switch (drawerKind) {
          case DrawerKind.NONE : {
            children = <></>;
            break;
          }
          case DrawerKind.PROPERTIES : {
            children = <div
              style={{
                display: "flex",
                flexDirection: "column",
                height: "100%",
              }}
            >
              <div
                style={{
                  padding: "12px 10px",
                  background:
                    "var(--color-surface)",
                  borderBottom:
                    "1px solid var(--color-border)",
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform:
                    "uppercase",
                  color:
                    "var(--color-text)",
                }}
              >
                Selected Element
              </div>
              <div
                style={{
                  flex: 1,
                  overflow: "auto",
                  padding: 12,
                }}
              >
                {rightClickMenuContent}
              </div>
            </div>;
            break;
          }
          case DrawerKind.SETTINGS : {
            children = <SettingsDrawer
              open={true}
              onClose={() =>
                setDrawerKind(DrawerKind.NONE)
              }
              settings={settingsRecord}
              setSettings={
                setSettingsRecord
              }
              getDistanceDefaults={() => {
                const flattened =
                  flattenedRnaComplexPropsReference.current as Array<
                    [
                      string,
                      RnaComplex.ExternalProps
                    ]
                  >;
                if (
                  flattened &&
                  flattened.length > 0
                ) {
                  const rnaComplexIndex =
                    Number.parseInt(
                      flattened[0][0]
                    );
                  const {
                    helixDistance,
                    distances,
                  } =
                    basePairAverageDistances[
                      rnaComplexIndex
                    ];
                  if (
                    helixDistance != null &&
                    distances
                  ) {
                    return {
                      [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS]:
                        helixDistance,
                      [Setting.CANONICAL_BASE_PAIR_DISTANCE]:
                        distances[
                          BasePair.Type
                            .CANONICAL
                        ],
                      [Setting.MISMATCH_BASE_PAIR_DISTANCE]:
                        distances[
                          BasePair.Type
                            .MISMATCH
                        ],
                      [Setting.WOBBLE_BASE_PAIR_DISTANCE]:
                        distances[
                          BasePair.Type
                            .WOBBLE
                        ],
                    };
                  }
                }
                return {};
              }}
            />;
            break;
          }
          case DrawerKind.ABOUT : {
            children = <AboutDrawer
              open={true}
              onClose={() =>
                setDrawerKind(DrawerKind.NONE)
              }
              renderTabInstructions={(
                tab
              ) => {
                switch (tab) {
                  case Tab.INPUT_OUTPUT:
                    return (
                      <div>
                        <p>
                          Upload and
                          download RNA
                          structure files in
                          various formats
                          including JSON,
                          SVG, and more.
                        </p>
                        <ul>
                          <li>
                            Upload files to
                            import RNA
                            structures
                          </li>
                          <li>
                            Download files
                            to save your
                            work
                          </li>
                          <li>
                            Support for
                            multiple file
                            formats
                          </li>
                        </ul>
                      </div>
                    );
                  case Tab.VIEWPORT:
                    return (
                      <div>
                        <p>
                          Control the
                          viewport and
                          navigation of your
                          RNA structure.
                        </p>
                        <ul>
                          <li>
                            Zoom in/out with
                            mouse wheel
                          </li>
                          <li>
                            Pan by dragging
                            the canvas
                          </li>
                          <li>
                            Reset viewport
                            to default
                            position
                          </li>
                        </ul>
                      </div>
                    );
                  case Tab.EDIT:
                    return (
                      <div>
                        <p>
                          Edit RNA
                          structures by
                          modifying
                          nucleotides,
                          positions, and
                          properties.
                        </p>
                        <ul>
                          <li>
                            Move nucleotides
                            by dragging
                          </li>
                          <li>
                            Edit nucleotide
                            properties
                          </li>
                          <li>
                            Modify labels
                            and annotations
                          </li>
                        </ul>
                      </div>
                    );
                  case Tab.FORMAT:
                    return (
                      <div>
                        <p>
                          Format RNA
                          structures by
                          adjusting base
                          pairs and
                          structural
                          elements.
                        </p>
                        <ul>
                          <li>
                            Add/remove base
                            pairs
                          </li>
                          <li>
                            Adjust base pair
                            distances
                          </li>
                          <li>
                            Optimize
                            structure layout
                          </li>
                        </ul>
                      </div>
                    );
                  case Tab.ANNOTATE:
                    return (
                      <div>
                        <p>
                          Add annotations
                          and labels to your
                          RNA structure.
                        </p>
                        <ul>
                          <li>
                            Add text labels
                          </li>
                          <li>
                            Create
                            annotation
                            regions
                          </li>
                          <li>
                            Customize
                            annotation
                            styles
                          </li>
                        </ul>
                      </div>
                    );
                  case Tab.SETTINGS:
                    return (
                      <div>
                        <p>
                          Configure
                          application
                          preferences and
                          behavior.
                        </p>
                        <ul>
                          <li>
                            Adjust display
                            settings
                          </li>
                          <li>
                            Configure
                            interaction
                            constraints
                          </li>
                          <li>
                            Import/export
                            settings
                          </li>
                        </ul>
                      </div>
                    );
                  case Tab.ABOUT:
                    return (
                      <div className="quickstart-panel">
                        <section className="quickstart-section">
                          <div className="quickstart-section__header">
                            <h4 className="quickstart-section__title">Key shortcuts</h4>
                            <span className="quickstart-section__subtitle">Stay on the keyboard for faster edits.</span>
                          </div>
                          <div className="quickstart-shortcut-grid">
                            {ABOUT_SHORTCUTS.map((entry) => (
                              <article className="quickstart-shortcut-card" key={entry.shortcut}>
                                <div className="quickstart-shortcut-hotkey">{entry.shortcut}</div>
                                <p className="quickstart-shortcut-behavior">{entry.action}</p>
                              </article>
                            ))}
                          </div>
                          {ABOUT_SHORTCUTS_NOTE ? (
                            <p className="quickstart-shortcut-note">{ABOUT_SHORTCUTS_NOTE}</p>
                          ) : null}
                        </section>

                        <section className="quickstart-section">
                          <p className="quickstart-paragraph">
                            Exornata is an interactive web app for editing, formatting, and annotating 2D RNA diagrams.
                          </p>
                          <h4 className="quickstart-section__title">Quickstart checklist</h4>
                          <ol className="quickstart-ordered-list">
                            <li>Start in Edit mode on the blank canvas that opens by default.</li>
                            <li>Use <em>Load example</em> to pull in the 5S rRNA reference structure.</li>
                            <li>Review the Units/Complex constraint and tighten it if you only need a subset.</li>
                            <li>Drag, pan, or zoom to orient the structure before detailed edits.</li>
                            <li>Jump to Format mode to refine base pairs and structural geometry.</li>
                            <li>Switch into Annotate mode to apply labels or callouts.</li>
                            <li>Export your edits as JSON, XRna, SVG, or other supported formats.</li>
                            <li>Re-import the exported file later to resume exactly where you stopped.</li>
                          </ol>
                        </section>

                        <section className="quickstart-section">
                          <a
                              className="quickstart-link"
                              href="https://github.com/LDWLab/XRNA-React/issues"
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                          <h4 className="quickstart-section__title">Something went wrong?</h4>
                          </a>
                        </section>
                      </div>
                    );
                  default:
                    return (
                      <div>
                        No instructions
                        available for this
                        tab.
                      </div>
                    );
                }
              }}
            />;
            break;
          }
          default : {
            throw "Unhandled switch case.";
          }
        }
        return <MemoizedRightDrawer
          open={drawerKind !== DrawerKind.NONE}
          onClose={() => {
            setDrawerKind(DrawerKind.NONE);
            setRightClickMenuContent(
              <></>,
              {}
            );
            setSelectedElementInfo(
              undefined
            );
          }}
          isEditMenu={drawerKind === DrawerKind.PROPERTIES}
          // title={rightDrawerTitle}
          // startWidth={drawerKind === 'about' ? 720 : drawerKind === 'settings' ? 560 : 480}
        >
          {children}
        </MemoizedRightDrawer>;
      },
      [
        settingsRecord,
        basePairAverageDistances,
        drawerKind,
        rightClickMenuContent
      ]
    );
    const reformatSelectedHelices = useCallback(
      (selectedHelices : Array<Helix>) => {
        pushToUndoStack();
        const settingsRecord = settingsRecordReference.current!;
        const rnaComplexProps = rnaComplexPropsReference.current!;
        // const setBasePairKeysToEdit = setBasePairKeysToEditReference.current;
        const basePairAverageDistances = basePairAverageDistancesReference.current!;
        const basePairKeysToEdit : Context.BasePair.KeysToEdit = {};
        for (const { rnaComplexIndex, rnaMoleculeName0, rnaMoleculeName1, start, stop } of selectedHelices) {
          const averageDistancesPerRnaComplex = basePairAverageDistances[rnaComplexIndex];
          const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
          const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
          if (!(rnaComplexIndex in basePairKeysToEdit)) {
            basePairKeysToEdit[rnaComplexIndex] = {
              add : [],
              delete : []
            };
          }
          const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[rnaComplexIndex];
          const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
          const basePairsPerRnaMolecule0 = basePairsPerRnaComplex[rnaMoleculeName0];
          const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
          const rangeIndexToSingularRnaMoleculeProps = {
            0 : singularRnaMoleculeProps0,
            1 : singularRnaMoleculeProps1
          };
          const helixStart0 = singularRnaMoleculeProps0.nucleotideProps[start[0]];
          const helixStart1 = singularRnaMoleculeProps1.nucleotideProps[start[1]];
          let center = scaleUp(add(helixStart0, helixStart1), 0.5);
          const dv = subtract(helixStart0, helixStart1);
          const normalizedDv = normalize(dv);
          let normalOrthogonal = orthogonalize(normalizedDv);
          
          const rangeIndexToMinMax : Record<number, {min : number, max : number}> = {};
          let orientationVote = 0;
          for (const rangeIndex of [0, 1] as Array<0 | 1>) {
            const min = Math.min(start[rangeIndex], stop[rangeIndex]);
            const max = Math.max(start[rangeIndex], stop[rangeIndex]);
            rangeIndexToMinMax[rangeIndex] = { min, max };
            for (let nucleotideIndex = min; nucleotideIndex <= max; nucleotideIndex++) {
              const singularNucleotideProps = rangeIndexToSingularRnaMoleculeProps[rangeIndex].nucleotideProps[nucleotideIndex];
              orientationVote += Math.sign(dotProduct(subtract(singularNucleotideProps, center), normalOrthogonal));
            }
          }
          if (orientationVote < 0) {
            normalOrthogonal = negate(normalOrthogonal);
          }
          const helixDistanceFromSettings = settingsRecord[Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] as number;
          const helixDistance = Number.isNaN(helixDistanceFromSettings) ? averageDistancesPerRnaComplex.helixDistance : helixDistanceFromSettings;
          const helixCenterIncrement = scaleUp(normalOrthogonal, helixDistance);
          let nucleotideIndex0 = start[0];
          let nucleotideIndex1 = start[1];
          const nucleotideIndexIncrement0 = Math.sign(stop[0] - start[0]);
          const nucleotideIndexIncrement1 = Math.sign(stop[1] - start[1]);
          const length = rangeIndexToMinMax[0].max - rangeIndexToMinMax[0].min + 1;
          for (let i = 0; i < length; i++) {
            const singularNucleotideProps0 = rangeIndexToSingularRnaMoleculeProps[0].nucleotideProps[nucleotideIndex0];
            const singularNucleotideProps1 = rangeIndexToSingularRnaMoleculeProps[1].nucleotideProps[nucleotideIndex1];
            const basePairsPerNucleotide0 = basePairsPerRnaMolecule0[nucleotideIndex0];
            const relevantBasePair = basePairsPerNucleotide0?.find(basePair => (
              basePair.rnaMoleculeName === rnaMoleculeName1 &&
              basePair.nucleotideIndex === nucleotideIndex1
            ));
            let basePairType = relevantBasePair?.basePairType;
            if (basePairType === undefined) {
              try {
                basePairType = getBasePairType(singularNucleotideProps0.symbol, singularNucleotideProps1.symbol);
              } catch (e) {
                basePairType = undefined;
              }
            }
            let basePairDistance : number;
            switch (basePairType) {
              case BasePair.Type.CIS_WATSON_CRICK_WATSON_CRICK :
              case BasePair.Type.TRANS_WATSON_CRICK_WATSON_CRICK :
              case BasePair.Type.CANONICAL : {
                const basePairDistanceFromSettings = settingsRecord[Setting.CANONICAL_BASE_PAIR_DISTANCE] as number;
                basePairDistance = Number.isNaN(basePairDistanceFromSettings) ? averageDistancesPerRnaComplex.distances[basePairType] : basePairDistanceFromSettings;
                break;
              }
              case BasePair.Type.WOBBLE : {
                const basePairDistanceFromSettings = settingsRecord[Setting.WOBBLE_BASE_PAIR_DISTANCE] as number;
                basePairDistance = Number.isNaN(basePairDistanceFromSettings) ? averageDistancesPerRnaComplex.distances[basePairType] : basePairDistanceFromSettings;
                break;
              }
              default : {
                const basePairDistanceFromSettings = settingsRecord[Setting.MISMATCH_BASE_PAIR_DISTANCE] as number;
                basePairDistance = Number.isNaN(basePairDistanceFromSettings) ? averageDistancesPerRnaComplex.distances[BasePair.Type.MISMATCH] : basePairDistanceFromSettings;
                break;
              } 
            }
            const basePairFullKeys = {
              keys0 : {
                rnaMoleculeName : rnaMoleculeName0,
                nucleotideIndex : nucleotideIndex0
              },
              keys1 : {
                rnaMoleculeName : rnaMoleculeName1,
                nucleotideIndex : nucleotideIndex1
              }
            };
            basePairKeysToEditPerRnaComplex.add.push(basePairFullKeys);
            basePairKeysToEditPerRnaComplex.delete.push(basePairFullKeys);
            const scaledUpDv = scaleUp(normalizedDv, basePairDistance * 0.5);
            const newPosition0 = add(center, scaledUpDv);
            const newPosition1 = subtract(center, scaledUpDv);
            singularNucleotideProps0.x = newPosition0.x;
            singularNucleotideProps0.y = newPosition0.y;
            singularNucleotideProps1.x = newPosition1.x;
            singularNucleotideProps1.y = newPosition1.y;
  
            center = add(center, helixCenterIncrement);
            nucleotideIndex0 += nucleotideIndexIncrement0;
            nucleotideIndex1 += nucleotideIndexIncrement1;
          }
        }
        for (const basePairKeysToEditPerRnaComplex of Object.values(basePairKeysToEdit)) {
          basePairKeysToEditPerRnaComplex.add.sort(compareFullBasePairKeys);
          basePairKeysToEditPerRnaComplex.delete.sort(compareFullBasePairKeys);
        }
        setBasePairKeysToEdit(basePairKeysToEdit);
      },
      []
    );
    const renderedBasePairBottomSheet = useMemo(
      function () {
        const constrainRelevantHelices = constrainRelevantHelicesReference.current;
        return (<MemoizedBasePairBottomSheet
          open={basepairSheetOpen}
          onClose={() => {
            setBasepairSheetOpen(false);
            // setTab(Tab.EDIT);
          }}
          rnaComplexProps={rnaComplexProps}
          globalHelices = {globalHelicesForFormatMenu}
          errorMessage = {formatMenuErrorMessage}
          constrainRelevantHelices = {constrainRelevantHelices}
          handleNewBasePair = {insertBasePairIntoGlobalHelices}
          removeBasePair = {removeBasePairFromGlobalHelices}
          reformatSelectedHelices = {reformatSelectedHelices}
        />);
      },
      [
        basepairSheetOpen,
        rnaComplexProps,
        globalHelicesForFormatMenu,
        formatMenuErrorMessage,
        constrainRelevantHelices
      ]
    );
    const renderedGrid = useMemo(
      function() {
        return <Grid
          settings={settingsRecord}
          viewportWidth={svgWidth}
          viewportHeight={Math.max((parentDivResizeDetector.height ?? 0) - TOPBAR_HEIGHT, 0)}
          viewportScale={viewportScale}
        />;
      },
      [
        settingsRecord,
        svgWidth,
        parentDivResizeDetector.height,
        TOPBAR_HEIGHT,
        viewportScale
      ]
    );
    const hasStructureLoaded = !isEmpty(rnaComplexProps);
    const topbarFileName = outputFileName === ""
      ? defaultExportFileNameRef.current ?? ""
      : outputFileName;

    const renderedTopBar = useMemo(
      () => {
        return <Topbar
          onImport={() => {
            setImportModalError(undefined);
            setImportModalOpen(true);
          }}
          onSave={saveFile}
          onExportWithFormat={function (
            filename,
            format
          ) {
            setOutputFileName(filename);
            setOutputFileExtension(
              format as OutputFileExtension
            );
            // Clear cached file handle to force new file picker with updated name
            setOutputFileHandle(undefined);
            // Update references directly to avoid race condition
            outputFileNameReference.current = filename;
            outputFileExtensionReference.current = format as OutputFileExtension;
            // Use setTimeout to ensure state updates are processed
            setTimeout(() => {
              (
                downloadOutputFileHtmlButtonReference.current as HTMLButtonElement
              )?.click();
            }, 0);
          }}
          onDownload={downloadFile}
          fileName={topbarFileName}
          onFileNameChange={setOutputFileName}
          exportFormat={outputFileExtension}
          onExportFormatChange={setOutputFileExtension}
          downloadButtonReference={downloadOutputFileHtmlButtonReference}
          saveButtonsDisabledFlag = {!hasStructureLoaded}
        />;
      },
      [
        topbarFileName,
        outputFileExtension,
        hasStructureLoaded,
        rnaComplexProps
      ]
    );
    const singularRnaComplexFlag = useMemo(
      () => flattenedRnaComplexProps.length === 1,
      [flattenedRnaComplexProps]
    );
    const resetGlobalHelicesForFormatMenu = useCallback(
      (rnaComplexProps : RnaComplexProps) => {
        const settingsRecord = settingsRecordReference.current!;
        const helicesPerScene : Array<Helix> = [];
        const helicesPerSceneIterationData = iterateOverFreeNucleotidesAndHelicesPerScene(
          rnaComplexProps,
          settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED] as boolean
        );
        for (const { rnaComplexIndex, helixDataPerRnaMolecules } of helicesPerSceneIterationData) {
          for (const { rnaMoleculeName0, helixData } of helixDataPerRnaMolecules) {
            for (const { rnaMoleculeName1, start, stop } of helixData) {
              helicesPerScene.push({
                rnaComplexIndex,
                rnaMoleculeName0,
                rnaMoleculeName1,
                start,
                stop
              });
            }
          }
        }
        setGlobalHelicesForFormatMenu(helicesPerScene);
      },
      []
    );
    // Global event hooks for bottom-sheet UX
    useEffect(() => {
      function onOpenSheet() {
        setBasepairSheetOpen(true);
      }
      function onTriggerReformatAll() {
        const btn = document.getElementById(
          "__hidden_reformat_button__"
        ) as HTMLButtonElement | null;
        btn?.click();
      }
      function onTriggerReformatRange(
        e: CustomEvent<{ start?: number; end?: number }>
      ) {
        const range = e.detail || {};
        // Build a minimal BasePairs array to request a positioning update for the desired range.
        // We will reuse BasePairsEditor.setBasePairs by synthesizing a selection spanning start..end.
        // If either bound is missing, we fall back to full reformat via the existing hook.
        if (range.start === undefined || range.end === undefined) {
          onTriggerReformatAll();
          return;
        }
        const start = Math.min(range.start, range.end);
        const end = Math.max(range.start, range.end);
        const btn = document.getElementById(
          "__hidden_reformat_button__"
        ) as HTMLButtonElement | null;
        // Fallback to full if hidden hook is not available
        if (!btn) {
          onTriggerReformatAll();
          return;
        }
        // We cannot directly pass a range to BasePairsEditor's hidden hook without refactoring; do full for now.
        // This keeps UI consistent and avoids partial repositioning bugs.
        btn.click();
      }
      window.addEventListener("openBasepairBottomSheet", onOpenSheet as any);
      window.addEventListener(
        "triggerReformatAll",
        onTriggerReformatAll as any
      );
      window.addEventListener(
        "triggerReformatRange",
        onTriggerReformatRange as any
      );
      return () => {
        window.removeEventListener(
          "openBasepairBottomSheet",
          onOpenSheet as any
        );
        window.removeEventListener(
          "triggerReformatAll",
          onTriggerReformatAll as any
        );
        window.removeEventListener(
          "triggerReformatRange",
          onTriggerReformatRange as any
        );
      };
    }, []);
    // Begin effects.
    useEffect(
      function () {
        const handleBeforeUnload = (e : BeforeUnloadEvent) => {
          const settingsRecord = settingsRecordReference.current!;
          const unsavedWorkFlag = unsavedWorkFlagReference.current;
          if (
            unsavedWorkFlag &&
            !settingsRecord[Setting.DISABLE_NAVIGATE_AWAY_PROMPT]
          ) {
            // Custom messages aren't allowed anymore.
            const returnValue = "";
            e.preventDefault();
            e.returnValue = returnValue;
            return returnValue;
          }
        }
        window.addEventListener(
          "beforeunload",
          handleBeforeUnload
        );
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
      },
      []
    );
    useEffect(function () {
      let documentUrl = document.URL;
      let index = documentUrl.indexOf("?");
      if (index != -1) {
        let params: Record<string, string> = {};
        let pairs = documentUrl
          .substring(index + 1, documentUrl.length)
          .split("&");
        for (let i = 0; i < pairs.length; i++) {
          let nameVal = pairs[i].split("=");
          params[nameVal[0]] = nameVal[1];
        }
        let r2dt_key = "r2dt_job_id";
        if (r2dt_key in params) {
          parseJson(
            `https://www.ebi.ac.uk/Tools/services/rest/r2dt/result/r2dt-${params[r2dt_key]}/json`
          );
        }
        let url_key = "source_url";
        if (url_key in params) {
          parseJson(params[url_key]);
        }
        let tab_key = "tab";
        if (tab_key in params) {
          const tab = params[tab_key];
          const lowercase_tab = tab.toLocaleLowerCase();
          const foundTab = tabs.find(
            (tabI) => tabI.toLocaleLowerCase() === lowercase_tab
          );
          if (foundTab === undefined) {
            setUrlParsingErrorMessage(
              `"${tab}" is not a valid, recognized Tab value.`
            );
            setSceneState(SceneState.URL_PARSING_ERROR);
          } else {
            setTab(foundTab);
          }
        }
      }
    }, []);
    useEffect(
      function () {
        const current = mouseOverTextSvgTextElementReference.current;
        const newMouseOverTextDimensions =
          current === null
            ? {
                width: 0,
                height: 0,
              }
            : (current as SVGTextElement).getBBox();
        setMouseOverTextDimensions(newMouseOverTextDimensions);
      },
      [mouseOverText]
    );
    useEffect(resetRightClickMenuContent, [tab, rnaComplexProps]);

    useEffect(
      function () {
        if (Object.keys(basePairKeysToEdit).length === 0) return;
        const nucleotideKeysToRerender: NucleotideKeysToRerender = {};
        const basePairKeysToRerender: BasePairKeysToRerender = {};
        function pushNucleotideKeysToRerender(
          nucleotideKeysToRerenderPerRnaComplex: NucleotideKeysToRerenderPerRnaComplex,
          keys: RnaComplex.BasePairKeys
        ) {
          const { rnaMoleculeName, nucleotideIndex } = keys;
          if (!(rnaMoleculeName in nucleotideKeysToRerenderPerRnaComplex)) {
            nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
          }
          const nucleotideKeysToRerenderPerRnaComplexPerRnaMolecule =
            nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
          if (
            !nucleotideKeysToRerenderPerRnaComplexPerRnaMolecule.includes(
              nucleotideIndex
            )
          ) {
            nucleotideKeysToRerenderPerRnaComplexPerRnaMolecule.push(
              nucleotideIndex
            );
          }
        }
        for (const [
          rnaComplexIndexAsString,
          basePairKeysToEditPerRnaComplex,
        ] of Object.entries(basePairKeysToEdit)) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          nucleotideKeysToRerender[rnaComplexIndex] = {};
          basePairKeysToRerender[rnaComplexIndex] = [];
          const nucleotideKeysToRerenderPerRnaComplex =
            nucleotideKeysToRerender[rnaComplexIndex];
          const basePairKeysToRerenderPerRnaComplex =
            basePairKeysToRerender[rnaComplexIndex];

          for (const basePairDatumToAdd of basePairKeysToEditPerRnaComplex.add) {
            const { keys0, keys1 } = basePairDatumToAdd;
            pushNucleotideKeysToRerender(
              nucleotideKeysToRerenderPerRnaComplex,
              keys0
            );
            pushNucleotideKeysToRerender(
              nucleotideKeysToRerenderPerRnaComplex,
              keys1
            );
            basePairKeysToRerenderPerRnaComplex.push(keys0, keys1);
          }
          for (const basePairDatumToDelete of basePairKeysToEditPerRnaComplex.delete) {
            const { keys0, keys1 } = basePairDatumToDelete;
            pushNucleotideKeysToRerender(
              nucleotideKeysToRerenderPerRnaComplex,
              keys0
            );
            pushNucleotideKeysToRerender(
              nucleotideKeysToRerenderPerRnaComplex,
              keys1
            );
            basePairKeysToRerenderPerRnaComplex.push(keys0, keys1);
          }

          for (let nucleotideKeysToRerenderPerRnaMolecule of Object.values(
            nucleotideKeysToRerenderPerRnaComplex
          )) {
            nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
          }
          basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
        }
        setBasePairKeysToRerender(basePairKeysToRerender);
        const newTriggers = { ...basePairUpdateTriggers };
        for (const rnaComplexIndexAsString of Object.keys(basePairKeysToEdit)) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          newTriggers[rnaComplexIndex] =
            (newTriggers[rnaComplexIndex] ?? 0) + 1;
        }
        setBasePairUpdateTriggers(newTriggers);
        setNucleotideKeysToRerender({});
        setBasePairKeysToRerender({});
        setBasePairKeysToEdit({});
      },
      [basePairKeysToEdit, basePairUpdateTriggers] // Add basePairUpdateTriggers to deps if needed
    );
    useEffect(
      function () {
        let downloadButtonErrorMessage = "";
        if (isEmpty(rnaComplexProps)) {
          downloadButtonErrorMessage = "Import data to enable downloads.";
        } else if (outputFileExtension === undefined) {
          downloadButtonErrorMessage =
            "Select an export format to enable downloads.";
        }
        setDownloadButtonErrorMessage(downloadButtonErrorMessage);
      },
      [rnaComplexProps, outputFileExtension]
    );
    useEffect(
      function () {
        setResetOrientationDataTrigger((prev) => !prev);
      },
      [rightClickMenuContent]
    );
    useEffect(
      function () {
        if (dragListener !== null && dragListener !== viewportDragListener) {
          pushToUndoStack();
        }
      },
      [dragListener]
    );
    useEffect(
      function () {
        const interactionConstraintOptions =
          interactionConstraintOptionsReference.current!;
        setInteractionConstraintOptions({
          ...interactionConstraintOptions,
          treatNoncanonicalBasePairsAsUnpairedFlag: settingsRecord[
            Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED
          ] as boolean,
        });
      },
      [settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED]]
    );
    useEffect(
      () => {
        setBasePairRadius(settingsRecord[Setting.BASE_PAIR_RADIUS] as number);
        const basePairKeysToEdit : Context.BasePair.KeysToEdit = {};
        for (const [rnaComplexIndexAsString, { basePairs : basePairsPerRnaComplex }] of Object.entries(rnaComplexProps)) {
          const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
          basePairKeysToEdit[rnaComplexIndex] = {
            add : [],
            delete : []
          };
          const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[rnaComplexIndex];
          for (const [rnaMoleculeName, basePairsPerRnaMolecule] of Object.entries(basePairsPerRnaComplex)) {
            for (const [nucleotideIndexAsString, basePairsPerNucleotide] of Object.entries(basePairsPerRnaMolecule)) {
              const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
              const keys0 = {
                rnaMoleculeName,
                nucleotideIndex
              };
              for (const basePair of basePairsPerNucleotide) {
                if (!isRelevantBasePairKeySetInPair(
                  keys0,
                  basePair
                )) {
                  basePairKeysToEditPerRnaComplex.delete.push({
                    keys0,
                    keys1 : basePair
                  });
                  basePairKeysToEditPerRnaComplex.add.push({
                    keys0,
                    keys1 : basePair
                  });
                }
              }
            }
          }
        }
        for (const basePairKeysToEditPerRnaComplex of Object.values(basePairKeysToEdit)) {
          basePairKeysToEditPerRnaComplex.add.sort(compareFullBasePairKeys);
          basePairKeysToEditPerRnaComplex.delete.sort(compareFullBasePairKeys);
        }
        setBasePairKeysToEdit(basePairKeysToEdit);
      },
      [settingsRecord[Setting.BASE_PAIR_RADIUS]]
    );
    useEffect(
      () => {
        setDrawerKind(DrawerKind.NONE);
        setBasepairSheetOpen(false);
      },
      [tabReference.current]
    );
    useEffect(
      () => setBasepairSheetOpen(false),
      [interactionConstraint]
    );
    useEffect(
      () => resetGlobalHelicesForFormatMenu(rnaComplexPropsReference.current!),
      [
        settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED]
      ]
    );
    return (
      <Context.MemoizedComponent
        settingsRecord = {settingsRecord}
        setSettingsRecord = {setSettingsRecord}
        basePairOnMouseDownHelper = {basePairOnMouseDownHelper}
        labelClassName = {labelClassName}
        basePairClassName = {basePairClassName}
        pushToUndoStack = {pushToUndoStack}
        basePairRadius = {basePairRadius}
        indicesOfFrozenNucleotides = {indicesOfFrozenNucleotides}
        labelContentDefaultStyles = {labelContentDefaultStyles}
        basePairAverageDistances = {basePairAverageDistances}
        updateBasePairAverageDistances = {updateBasePairAverageDistances}
        updateLabelContentDefaultStyles = {updateLabelContentDefaultStyles}
        interactionConstraintOptions = {interactionConstraintOptions}
        updateInteractionConstraintOptions = {updateInteractionConstraintOptions}
        setNucleotideKeysToRerender = {setNucleotideKeysToRerender}
        setBasePairKeysToRerender = {setBasePairKeysToRerender}
        updateRnaMoleculeNameHelper = {updateRnaMoleculeNameHelper}
        setBasePairKeysToEdit = {setBasePairKeysToEdit}
        singularRnaComplexFlag = {singularRnaComplexFlag}
        averageNucleotideBoundingRectHeight = {averageNucleotideBoundingRectHeight}
        resetOrientationDataTrigger = {resetOrientationDataTrigger}
      >
        <div
          id={PARENT_DIV_HTML_ID}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          ref={parentDivResizeDetector.ref}
          style={{
            position: "absolute",
            display: "block",
            width: "100%",
            height: "100%",
            overflow: "hidden",
            background:
              "var(--color-background)",
            color: "var(--color-text)",
            marginLeft: `${MARGIN_LEFT}px`,
            transition:
              "var(--transition-default)",
          }}
        >
          {/* NEW Sidebar - docked left */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              height: "100%",
              width: LEFT_PANEL_WIDTH,
              zIndex: 1000,
            }}
          >
            {/* Freeze/Unfreeze functionality */}
            {(() => {
              // Helper function to check if there are any frozen nucleotides
              const hasFrozenNucleotides = Object.keys(indicesOfFrozenNucleotides).length > 0;
              
              // Helper function to check if there are any selected nucleotides
              const hasSelectedNucleotides = Object.keys(rightClickMenuAffectedNucleotideIndices).length > 0;
              
              // Freeze selected nucleotides
              const freezeSelected = () => {
                if (!hasSelectedNucleotides) return;
                
                const newIndicesOfFrozenNucleotides = structuredClone(indicesOfFrozenNucleotides);
                
                for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
                  const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
                  if (!(rnaComplexIndex in newIndicesOfFrozenNucleotides)) {
                    newIndicesOfFrozenNucleotides[rnaComplexIndex] = {};
                  }
                  
                  for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                    if (!(rnaMoleculeName in newIndicesOfFrozenNucleotides[rnaComplexIndex])) {
                      newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName] = new Set<number>();
                    }
                    
                    for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                      newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].add(nucleotideIndex);
                    }
                  }
                }
                
                setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
                
                // Add to undo stack
                const undoStack = undoStackReference.current!;
                setUndoStack([
                  ...undoStack,
                  structuredClone(indicesOfFrozenNucleotides)
                ]);
                setRedoStack([]);
              };
              
              // Unfreeze selected nucleotides
              const unfreezeSelected = () => {
                if (!hasSelectedNucleotides) return;
                
                const newIndicesOfFrozenNucleotides = structuredClone(indicesOfFrozenNucleotides);
                
                for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
                  const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
                  if (rnaComplexIndex in newIndicesOfFrozenNucleotides) {
                    for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                      if (rnaMoleculeName in newIndicesOfFrozenNucleotides[rnaComplexIndex]) {
                        for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                          newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].delete(nucleotideIndex);
                        }
                        
                        // Clean up empty sets
                        if (newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].size === 0) {
                          delete newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName];
                        }
                      }
                    }
                    
                    // Clean up empty objects
                    if (Object.keys(newIndicesOfFrozenNucleotides[rnaComplexIndex]).length === 0) {
                      delete newIndicesOfFrozenNucleotides[rnaComplexIndex];
                    }
                  }
                }
                
                setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
                
                // Add to undo stack
                const undoStack = undoStackReference.current!;
                setUndoStack([
                  ...undoStack,
                  structuredClone(indicesOfFrozenNucleotides)
                ]);
                setRedoStack([]);
              };
              
              // Unfreeze all nucleotides
              const unfreezeAll = () => {
                if (!hasFrozenNucleotides) return;
                
                if (window.confirm("Are you sure you want to unfreeze all nucleotides?")) {
                  // Add to undo stack
                  const undoStack = undoStackReference.current!;
                  setUndoStack([
                    ...undoStack,
                    structuredClone(indicesOfFrozenNucleotides)
                  ]);
                  setRedoStack([]);
                  
                  setIndicesOfFrozenNucleotides({});
                }
              };
              
              return null; // This is just for the helper functions, no JSX
            })()}
            
            <Sidebar
              onUndo={undo}
              onRedo={redo}
              canUndo={canUndoFlag}
              canRedo={canRedoFlag}
              onResetViewport={resetViewport}
              mode={tab}
              onModeChange={setTab}
              constraint={interactionConstraint}
              onConstraintChange={setInteractionConstraint}
              onToggleBasePairEditor={() => {
                setRightClickMenuContent(<></>, {});
                setBasepairSheetOpen((prev) => !prev);
              }}
              onTogglePropertiesDrawer={() => {
                if (drawerKind === "properties") {
                  setDrawerKind(DrawerKind.NONE);
                } else {
                  setRightDrawerTitle("Properties");
                  setDrawerKind(DrawerKind.PROPERTIES);
                }
              }}
              onToggleSettingsDrawer={() => {
                if (drawerKind === "settings") {
                  setDrawerKind(DrawerKind.NONE);
                } else {
                  setRightClickMenuContent(<></>, {});
                  setRightDrawerTitle("Settings");
                  setDrawerKind(DrawerKind.SETTINGS);
                }
              }}
              onToggleAboutDrawer={() => {
                if (drawerKind === "about") {
                  setDrawerKind(DrawerKind.NONE);
                } else {
                  setRightClickMenuContent(<></>, {});
                  setRightDrawerTitle("About XRNA");
                  setDrawerKind(DrawerKind.ABOUT);
                }
              }}
              onOpenDocs={() => {
                window.location.hash = "#/docs";
              }}
              undoStack={undoStack}
              redoStack={redoStack}
              onJumpToHistory={(index) => {
                const currentUndoStack = undoStackReference.current!;
                const currentRedoStack = redoStackReference.current!;

                if (
                  index < 0 ||
                  index >
                    currentUndoStack.length + currentRedoStack.length
                ) {
                  return;
                }

                if (index === currentUndoStack.length) {
                  return;
                }

                if (index < currentUndoStack.length) {
                  const targetState = currentUndoStack[index];
                  if (targetState) {
                    if ("rnaComplexProps" in targetState) {
                      const { rnaComplexProps, globalHelicesForFormatMenu } = targetState;
                      setBasePairKeysToEdit({});
                      setRnaComplexProps(rnaComplexProps);
                      setGlobalHelicesForFormatMenu(globalHelicesForFormatMenu);
                    } else {
                      setIndicesOfFrozenNucleotides(targetState);
                    }

                    const newUndoStack = currentUndoStack.slice(0, index + 1);
                    const newRedoStack = [
                      ...currentRedoStack,
                      ...currentUndoStack.slice(index + 1).reverse(),
                    ];

                    setUndoStack(newUndoStack);
                    setRedoStack(newRedoStack);
                  }
                } else {
                  const redoIndex = index - currentUndoStack.length;
                  const targetState = currentRedoStack[redoIndex];
                  if (targetState) {
                    if ("rnaComplexProps" in targetState) {
                      const { rnaComplexProps, globalHelicesForFormatMenu } = targetState;
                      setBasePairKeysToEdit({});
                      setRnaComplexProps(rnaComplexProps);
                      setGlobalHelicesForFormatMenu(globalHelicesForFormatMenu);
                    } else {
                      setIndicesOfFrozenNucleotides(targetState);
                    }

                    const newUndoStack = [
                      ...currentUndoStack,
                      ...currentRedoStack.slice(0, redoIndex + 1),
                    ];
                    const newRedoStack = currentRedoStack.slice(redoIndex + 1);

                    setUndoStack(newUndoStack);
                    setRedoStack(newRedoStack);
                  }
                }
              }}
              onResetToLastCheckpoint={() => {
                const currentUndoStack = undoStackReference.current!;

                if (currentUndoStack.length > 0) {
                  const initialState = currentUndoStack[0];
                  if (initialState) {
                    if ("rnaComplexProps" in initialState) {
                      const { rnaComplexProps, globalHelicesForFormatMenu } = initialState;
                      setBasePairKeysToEdit({});
                      setRnaComplexProps(rnaComplexProps);
                      setGlobalHelicesForFormatMenu(globalHelicesForFormatMenu);
                    } else {
                      setIndicesOfFrozenNucleotides(initialState);
                    }

                    const newRedoStack = [
                      ...redoStackReference.current!,
                      ...currentUndoStack.slice(1).reverse(),
                    ];

                    setUndoStack([initialState]);
                    setRedoStack(newRedoStack);
                  }
                }
              }}
              onFreezeSelected={(() => {
                const hasSelectedNucleotides = Object.keys(rightClickMenuAffectedNucleotideIndices).length > 0;
                if (!hasSelectedNucleotides) return undefined;
                
                return () => {
                  const newIndicesOfFrozenNucleotides = structuredClone(indicesOfFrozenNucleotides);
                  
                  for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
                    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
                    if (!(rnaComplexIndex in newIndicesOfFrozenNucleotides)) {
                      newIndicesOfFrozenNucleotides[rnaComplexIndex] = {};
                    }
                    
                    for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                      if (!(rnaMoleculeName in newIndicesOfFrozenNucleotides[rnaComplexIndex])) {
                        newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName] = new Set<number>();
                      }
                      
                      for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                        newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].add(nucleotideIndex);
                      }
                    }
                  }
                  
                  setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
                  
                  // Add to undo stack
                  const undoStack = undoStackReference.current!;
                  setUndoStack([
                    ...undoStack,
                    structuredClone(indicesOfFrozenNucleotides),
                  ]);
                  setRedoStack([]);
                };
              })()}
              onUnfreezeSelected={(() => {
                const hasSelectedNucleotides = Object.keys(rightClickMenuAffectedNucleotideIndices).length > 0;
                if (!hasSelectedNucleotides) return undefined;
                
                return () => {
                  const newIndicesOfFrozenNucleotides = structuredClone(indicesOfFrozenNucleotides);
                  
                  for (const [rnaComplexIndexAsString, rightClickMenuAffectedNucleotideIndicesPerRnaComplex] of Object.entries(rightClickMenuAffectedNucleotideIndices)) {
                    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
                    if (rnaComplexIndex in newIndicesOfFrozenNucleotides) {
                      for (const [rnaMoleculeName, rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule] of Object.entries(rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
                        if (rnaMoleculeName in newIndicesOfFrozenNucleotides[rnaComplexIndex]) {
                          for (const nucleotideIndex of rightClickMenuAffectedNucleotideIndicesPerRnaComplexPerRnaMolecule) {
                            newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].delete(nucleotideIndex);
                          }
                          
                          // Clean up empty sets
                          if (newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName].size === 0) {
                            delete newIndicesOfFrozenNucleotides[rnaComplexIndex][rnaMoleculeName];
                          }
                        }
                      }
                      
                      // Clean up empty objects
                      if (Object.keys(newIndicesOfFrozenNucleotides[rnaComplexIndex]).length === 0) {
                        delete newIndicesOfFrozenNucleotides[rnaComplexIndex];
                      }
                    }
                  }
                  
                  setIndicesOfFrozenNucleotides(newIndicesOfFrozenNucleotides);
                  
                  // Add to undo stack
                  const undoStack = undoStackReference.current!;
                  setUndoStack([
                    ...undoStack,
                    structuredClone(indicesOfFrozenNucleotides)
                  ]);
                  setRedoStack([]);
                };
              })()}
              onUnfreezeAll={(() => {
                const hasFrozenNucleotides = Object.keys(indicesOfFrozenNucleotides).length > 0;
                if (!hasFrozenNucleotides) return undefined;
                
                return () => {
                  if (window.confirm("Are you sure you want to unfreeze all nucleotides?")) {
                    // Add to undo stack
                    const undoStack = undoStackReference.current!;
                    setUndoStack([
                      ...undoStack,
                      structuredClone(indicesOfFrozenNucleotides)
                    ]);
                    setRedoStack([]);
                    
                    setIndicesOfFrozenNucleotides({});
                  }
                };
              })()}
              hasFrozenNucleotides={Object.keys(indicesOfFrozenNucleotides).length > 0}
              hasSelectedNucleotides={Object.keys(rightClickMenuAffectedNucleotideIndices).length > 0}
            />
          </div>

          {/* Topbar */}
          {renderedTopBar}

          <svg
            id={SVG_ELEMENT_HTML_ID}
            style={{
              top: TOPBAR_HEIGHT,
              left: LEFT_PANEL_WIDTH,
              position: "absolute",
            }}
            xmlns="http://www.w3.org/2000/svg"
            viewBox={`0 0 ${Math.max(
              (parentDivResizeDetector.width ??
                0) - LEFT_PANEL_WIDTH,
              0
            )} ${Math.max(
              (parentDivResizeDetector.height ??
                0) - TOPBAR_HEIGHT,
              0
            )}`}
            tabIndex={1}
            onMouseDown={onMouseDown}
            onMouseMove={onMouseMove}
            onMouseUp={onMouseUp}
            onMouseLeave={onMouseLeave}
            onContextMenu={function (event) {
              event.preventDefault();
            }}
            onDoubleClick={function (event: React.MouseEvent<SVGSVGElement>) {
              // Create text annotation on double-click in Annotate mode
              if (tabReference.current !== Tab.ANNOTATE) return;
              
              // Transform screen coordinates to data space
              const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
              const viewportScale = viewportScaleReference.current as number;
              const transformTranslate0 = transformTranslate0Reference.current!;
              const transformTranslate1 = transformTranslate1Reference.current!;
              
              let transformedCoordinates = { x: event.clientX, y: event.clientY };
              transformedCoordinates.x -= LEFT_PANEL_WIDTH;
              transformedCoordinates = scaleDown(
                transformedCoordinates,
                sceneBoundsScaleMin * viewportScale
              );
              transformedCoordinates.y -= TOPBAR_HEIGHT;
              transformedCoordinates.y = -transformedCoordinates.y;
              transformedCoordinates = subtract(
                transformedCoordinates,
                add(transformTranslate0.asVector, transformTranslate1.asVector)
              );
              
              // Find first complex to add annotation to
              const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
              const complexIndices = Object.keys(rnaComplexProps).map(Number);
              if (complexIndices.length === 0) return;
              
              const complexIndex = complexIndices[0];
              const complex = rnaComplexProps[complexIndex];
              
              // Initialize textAnnotations if needed
              if (!complex.textAnnotations) {
                complex.textAnnotations = {};
              }
              
              // Create new annotation
              const annotationId = `text-${Date.now()}`;
              const newAnnotation: TextAnnotation.Props = {
                id: annotationId,
                content: "New Text",
                x: transformedCoordinates.x,
                y: transformedCoordinates.y,
              };
              
              pushToUndoStack();
              complex.textAnnotations[annotationId] = newAnnotation;
              setNucleotideKeysToRerender({});
              
              // Open edit menu for the new annotation
              setDrawerKind(DrawerKind.PROPERTIES);
              setRightClickMenuContent(
                <TextAnnotationEditMenu
                  annotation={newAnnotation}
                  onUpdate={() => setNucleotideKeysToRerender({})}
                  onDelete={() => {
                    pushToUndoStack();
                    if (complex.textAnnotations) {
                      delete complex.textAnnotations[annotationId];
                    }
                    setNucleotideKeysToRerender({});
                    setRightClickMenuContent(<></>, {});
                  }}
                />,
                {}
              );
            }}
            onWheel={onWheel}
            fill={canvasFill}
            stroke={
              InteractionConstraint.isSupportedTab(
                tab
              )
                ? strokesPerTab[tab]
                : "none"
            }
            filter="none"
            overflow="hidden"
          >
            {/* Having this here, rather than in an external App.css file, allows these to be directly exported to .SVG files. */}
            <style>{`
              .${NUCLEOTIDE_CLASS_NAME} { stroke:none; }
              .${NUCLEOTIDE_CLASS_NAME}:hover { stroke:inherit; }
              .${BASE_PAIR_CLASS_NAME} { stroke:none; }
              .${BASE_PAIR_CLASS_NAME}:hover { stroke:inherit; stroke-dasharray:0.5,0.5;}
              .${LABEL_CLASS_NAME} { stroke:none; }
              .${LABEL_CLASS_NAME}:hover { stroke:inherit; }
              .${NO_STROKE_CLASS_NAME} { stroke:none; }
            `}</style>
            <defs>
              <filter
                id="xrTooltipShadow"
                x="-20%"
                y="-20%"
                width="140%"
                height="140%"
              >
                <feDropShadow
                  dx="0"
                  dy="4"
                  stdDeviation="3"
                  floodColor="#000000"
                  floodOpacity="0.15"
                />
                <feDropShadow
                  dx="0"
                  dy="2"
                  stdDeviation="2"
                  floodColor="#000000"
                  floodOpacity="0.05"
                />
              </filter>
              <filter
                id="xrTooltipGlow"
                x="-50%"
                y="-50%"
                width="200%"
                height="200%"
              >
                <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <rect
              id={SVG_BACKGROUND_HTML_ID}
              width="100%"
              height="100%"
              stroke="none"
              fill={
                settingsRecord[Setting.CANVAS_COLOR] as string
                  ? settingsRecord[Setting.CANVAS_COLOR] as string
                  : "var(--color-background)"
              }
              onMouseDown={function (e) {
                switch (e.button) {
                  case MouseButtonIndices.Left: {
                    if (!e.ctrlKey && pendingPairNucleotide !== undefined) {
                      setPendingPairNucleotide(undefined);
                    }
                    setDragListener(
                      viewportDragListener,
                      {}
                    );
                    break;
                  }
                }
              }}
            />
            {/* Grid component - always visible, zooms with canvas but doesn't move with pan */}
            {renderedGrid}
            <g
              style={{
                visibility:
                  sceneState ===
                  SceneState.DATA_IS_LOADED
                    ? "visible"
                    : "hidden",
              }}
              id={
                VIEWPORT_SCALE_GROUP_0_HTML_ID
              }
              transform={
                totalScale.asTransform[0]
              }
            >
              <g
                id={
                  VIEWPORT_SCALE_GROUP_1_HTML_ID
                }
                transform={
                  totalScale.asTransform[1]
                }
              >
                <g
                  id={
                    VIEWPORT_TRANSLATE_GROUP_0_HTML_ID
                  }
                  transform={
                    "scale(1, -1) " +
                    transformTranslate0.asString
                  }
                >
                  <g
                    id={VIEWPORT_TRANSLATE_GROUP_1_HTML_ID}
                    transform={transformTranslate1.asString}
                  >
                    {debugVisualElements}
                    {renderedRnaComplexes}
                    {pendingPairOverlayElement}
                  </g>
                </g>
              </g>
            </g>
            <StructureTooltip
              mouseOverText={mouseOverText}
              mouseOverTextDimensions={mouseOverTextDimensions}
              mouseUIPosition={mouseUIPosition}
              parentDivResizeDetector={parentDivResizeDetector}
              TOPBAR_HEIGHT={TOPBAR_HEIGHT}
              MOUSE_OVER_TEXT_FONT_SIZE={MOUSE_OVER_TEXT_FONT_SIZE}
              mouseOverTextSvgTextElementReference={mouseOverTextSvgTextElementReference}
            />
          </svg>
          
          {/* Floating Controls */}
          <MemoizedFloatingControls
            settings={settingsRecord}
            setSettings={setSettingsRecord}
            onZoomIn={onZoomIn}
            onZoomOut={onZoomOut}
            onResetViewport={resetViewport}
            position={FLOATING_CONTROLS_POSITION}
          />
          {sceneState ===
            SceneState.DATA_IS_LOADING && (
            <img
              style={{
                top: (parentDivResizeDetector.height ?? 0) * 0.5 - 100,
                left: (parentDivResizeDetector.width ?? 0) * 0.5 - 50,
                position: "absolute",
              }}
              src={loadingGif}
              alt="Loading..."
            />
          )}
          {sceneState === SceneState.DATA_LOADING_FAILED && (
            <div
              style={{
                position: "absolute",
                top: (parentDivResizeDetector.height ?? 0) * 0.5 - 60,
                left: (parentDivResizeDetector.width ?? 0) * 0.5 - 240,
                width: 480,
                maxWidth: "90%",
                padding: "12px 16px",
                borderRadius: 8,
                border: "1px solid #cc0000",
                background: "#fff5f5",
                color: "#7a1212",
                boxShadow: "0 4px 16px rgba(0,0,0,0.15)",
                zIndex: 2000,
                textAlign: "center",
                fontSize: 13,
                lineHeight: 1.4,
              }}
            >
              <div style={{ fontWeight: 600, marginBottom: 4 }}>Failed to open file</div>
              <div>{dataLoadingFailedErrorMessage || "Unsupported file format or invalid file contents."}</div>
              <div style={{ marginTop: 10 }}>
                <button
                  onClick={() => {
                    const details = dataLoadingFailedErrorDetails?.trim();
                    const text = details || "No additional error details available.";
                    navigator.clipboard.writeText(text).catch(() => {
                      /* no-op */
                    });
                  }}
                  style={{
                    marginTop: 6,
                    padding: "6px 10px",
                    fontSize: 12,
                    borderRadius: 6,
                    border: "1px solid #b02a2a",
                    background: "#ffe3e3",
                    color: "#7a1212",
                    cursor: "pointer",
                  }}
                >
                  Copy error details
                </button>
              </div>
            </div>
          )}
          <div
            style={{
              position: "absolute",
              visibility: "hidden",
              height: "auto",
              width: "auto",
              whiteSpace: "nowrap",
              background: "inherit",
            }}
            id={TEST_SPACE_ID}
          />
          {/* Unified Right Drawer */}
          {renderedRightDrawer}

          {/* Bottom Sheet: Base-Pair Editor */}
          {renderedBasePairBottomSheet}

          {/* Bottom-docked command terminal (hidden by default, toggle with ~) */}
          <MemoizedCommandTerminal
            rnaComplexProps={rnaComplexProps}
          />

          {/* Import Modal */}
          <ImportModal
            isOpen={importModalOpen}
            onClose={() => {
              setImportModalOpen(false);
              setImportModalError(undefined);
            }}
            onImportPaste={(content: string, mode: ImportMode, format: InputFileExtension) => {
              try {
                const handler = inputFileReadersRecord[format];
                const parsedInput = handler(content);
                
                // Apply default colors and fonts to nucleotides
                for (const singularRnaComplexProps of parsedInput.rnaComplexProps) {
                  for (const singularRnaMoleculeProps of Object.values(singularRnaComplexProps.rnaMoleculeProps)) {
                    for (const singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
                      if (singularNucleotideProps.color === undefined) {
                        singularNucleotideProps.color = structuredClone(BLACK);
                      }
                      if (singularNucleotideProps.font === undefined) {
                        singularNucleotideProps.font = structuredClone(Font.DEFAULT);
                      }
                    }
                  }
                }

                let finalRnaComplexProps: RnaComplexProps;
                
                if (mode === 'new') {
                  // Replace everything - convert array to record
                  finalRnaComplexProps = {};
                  parsedInput.rnaComplexProps.forEach((complexProps, index) => {
                    finalRnaComplexProps[index] = complexProps;
                  });
                } else {
                  // Add molecules to existing complex (merge into first complex)
                  finalRnaComplexProps = structuredClone(rnaComplexProps);
                  
                  // If no existing complex, create one
                  if (Object.keys(finalRnaComplexProps).length === 0) {
                    finalRnaComplexProps[0] = {
                      name: 'Complex',
                      rnaMoleculeProps: {},
                      basePairs: {}
                    };
                  }
                  
                  // Merge all imported molecules into the first complex
                  const firstComplexIndex = Number(Object.keys(finalRnaComplexProps)[0]);
                  for (const importedComplex of parsedInput.rnaComplexProps) {
                    const { mergedComplex } = mergeMoleculesIntoComplex(
                      finalRnaComplexProps[firstComplexIndex],
                      importedComplex
                    );
                    finalRnaComplexProps[firstComplexIndex] = mergedComplex;
                  }
                }

                // Calculate and prefill base pair distance settings
                const calculatedDistances = calculateBasePairDistances(parsedInput.rnaComplexProps);
                
                // Calculate average font size and most common font family
                let fontSizeSum = 0;
                let fontCount = 0;
                const fontFamilyCounts: Record<string, number> = {};
                for (const complexProps of parsedInput.rnaComplexProps) {
                  for (const molProps of Object.values(complexProps.rnaMoleculeProps)) {
                    for (const nucProps of Object.values(molProps.nucleotideProps)) {
                      if (nucProps.font?.size) {
                        fontSizeSum += typeof nucProps.font.size === 'number' ? nucProps.font.size : parseFloat(nucProps.font.size);
                        fontCount++;
                      }
                      if (nucProps.font?.family) {
                        fontFamilyCounts[nucProps.font.family] = (fontFamilyCounts[nucProps.font.family] || 0) + 1;
                      }
                    }
                  }
                }
                const avgFontSize = fontCount > 0 ? fontSizeSum / fontCount : Font.DEFAULT_SIZE;
                const mostCommonFontFamily = Object.entries(fontFamilyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || Font.DEFAULT.family;
                
                setSettingsRecord(prevSettings => ({
                  ...prevSettings,
                  [Setting.CANONICAL_BASE_PAIR_DISTANCE]: calculatedDistances.canonicalDistance,
                  [Setting.WOBBLE_BASE_PAIR_DISTANCE]: calculatedDistances.wobbleDistance,
                  [Setting.MISMATCH_BASE_PAIR_DISTANCE]: calculatedDistances.mismatchDistance,
                  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS]: calculatedDistances.contiguousDistance,
                  [Setting.DEFAULT_FONT_SIZE]: avgFontSize,
                  [Setting.DEFAULT_FONT_FAMILY]: mostCommonFontFamily
                }));

                setRnaComplexProps(finalRnaComplexProps);
                resetGlobalHelicesForFormatMenu(finalRnaComplexProps);
                setImportModalOpen(false);
                setImportModalError(undefined);

                // Calculate base pair radius after DOM renders
                setTimeout(() => {
                  let boundingRectHeightsSum = 0;
                  let numberOfBoundingRects = 0;
                  const nucleotideElements = Array.from(
                    document.querySelectorAll(`.${NUCLEOTIDE_CLASS_NAME}`) as NodeListOf<SVGGraphicsElement>
                  );
                  for (const nucleotideElement of nucleotideElements) {
                    const boundingClientRect = nucleotideElement.getBBox();
                    boundingRectHeightsSum += boundingClientRect.height;
                    numberOfBoundingRects++;
                  }
                  const averageBoundingRectHeight = numberOfBoundingRects === 0 ? 1 : (boundingRectHeightsSum / numberOfBoundingRects);
                  const newBasePairRadius = averageBoundingRectHeight * 0.3; // font 6 -> bp 1.8
                  setAverageNucleotideBoundingRectHeight(averageBoundingRectHeight);
                  setBasePairRadius(newBasePairRadius);
                  setSettingsRecord(prev => ({
                    ...prev,
                    [Setting.BASE_PAIR_RADIUS]: newBasePairRadius
                  }));
                  setTimeout(() => {
                    resetViewport();
                    setSceneState(SceneState.DATA_IS_LOADED);
                  }, 0);
                }, 500);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setImportModalError(message);
              }
            }}
            onImportFile={(file: File, mode: ImportMode) => {
              const inputFileNameAndExtension = file.name;
              inputFileNameAndExtensionReference.current = inputFileNameAndExtension;
              setInputFileNameAndExtension(inputFileNameAndExtension);
              
              const regexMatch = /^(.*)\.(.+)$/.exec(inputFileNameAndExtension);
              if (!regexMatch) {
                setImportModalError('Invalid file name');
                return;
              }
              
              const fileName = regexMatch[1];
              const fileExtension = regexMatch[2];
              const normalizedFileExtension = fileExtension.toLowerCase();
              
              if (!isInputFileExtension(normalizedFileExtension)) {
                setImportModalError(`Unsupported file type. Supported: ${inputFileExtensions.join(', ')}`);
                return;
              }

              if (settingsRecord[Setting.COPY_FILE_NAME]) {
                setOutputFileName(fileName);
              }
              if (settingsRecord[Setting.COPY_FILE_EXTENSION] && fileExtension in outputFileWritersMap) {
                setOutputFileExtension(fileExtension as OutputFileExtension);
              }

              const reader = new FileReader();
              reader.addEventListener("load", (event) => {
                try {
                  const content = (event.target as FileReader).result as string;
                  const parsedInput = (
                    r2dtLegacyVersionFlag
                      ? r2dtLegacyInputFileReadersRecord
                      : inputFileReadersRecord
                  )[normalizedFileExtension as InputFileExtension](content);

                  // Apply default colors and Y-axis inversion
                  const invertYAxisFlag = defaultInvertYAxisFlagRecord[normalizedFileExtension as InputFileExtension];
                  for (const singularRnaComplexProps of parsedInput.rnaComplexProps) {
                    for (const [rnaMoleculeName, singularRnaMoleculeProps] of Object.entries(singularRnaComplexProps.rnaMoleculeProps)) {
                      if (!(rnaMoleculeName in singularRnaComplexProps.basePairs)) {
                        singularRnaComplexProps.basePairs[rnaMoleculeName] = {};
                      }
                      for (const singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
                        if (singularNucleotideProps.color === undefined) {
                          singularNucleotideProps.color = structuredClone(BLACK);
                        }
                        if (singularNucleotideProps.font === undefined) {
                          singularNucleotideProps.font = structuredClone(Font.DEFAULT);
                        }
                        if (invertYAxisFlag) {
                          singularNucleotideProps.y *= -1;
                          if (singularNucleotideProps.labelLineProps !== undefined) {
                            for (let i = 0; i < singularNucleotideProps.labelLineProps.points.length; i++) {
                              singularNucleotideProps.labelLineProps.points[i].y *= -1;
                            }
                          }
                          if (singularNucleotideProps.labelContentProps !== undefined) {
                            singularNucleotideProps.labelContentProps.y *= -1;
                          }
                        }
                      }
                    }
                  }

                  let finalRnaComplexProps: RnaComplexProps;
                  
                  if (mode === 'new') {
                    finalRnaComplexProps = {};
                    parsedInput.rnaComplexProps.forEach((complexProps, index) => {
                      finalRnaComplexProps[index] = complexProps;
                    });
                  } else {
                    // Add molecules to existing complex (merge into first complex)
                    finalRnaComplexProps = structuredClone(rnaComplexProps);
                    
                    // If no existing complex, create one
                    if (Object.keys(finalRnaComplexProps).length === 0) {
                      finalRnaComplexProps[0] = {
                        name: 'Complex',
                        rnaMoleculeProps: {},
                        basePairs: {}
                      };
                    }
                    
                    // Merge all imported molecules into the first complex
                    const firstComplexIndex = Number(Object.keys(finalRnaComplexProps)[0]);
                    for (const importedComplex of parsedInput.rnaComplexProps) {
                      const { mergedComplex } = mergeMoleculesIntoComplex(
                        finalRnaComplexProps[firstComplexIndex],
                        importedComplex
                      );
                      finalRnaComplexProps[firstComplexIndex] = mergedComplex;
                    }
                  }

                  setUndoStack([]);
                  setRedoStack([]);
                  setBasePairKeysToEdit({});

                  // Calculate and prefill base pair distance settings
                  const calculatedDistances = calculateBasePairDistances(parsedInput.rnaComplexProps);
                  
                  // Calculate average font size and most common font family
                  let fontSizeSum = 0;
                  let fontCount = 0;
                  const fontFamilyCounts: Record<string, number> = {};
                  for (const complexProps of parsedInput.rnaComplexProps) {
                    for (const molProps of Object.values(complexProps.rnaMoleculeProps)) {
                      for (const nucProps of Object.values(molProps.nucleotideProps)) {
                        if (nucProps.font?.size) {
                          fontSizeSum += typeof nucProps.font.size === 'number' ? nucProps.font.size : parseFloat(nucProps.font.size);
                          fontCount++;
                        }
                        if (nucProps.font?.family) {
                          fontFamilyCounts[nucProps.font.family] = (fontFamilyCounts[nucProps.font.family] || 0) + 1;
                        }
                      }
                    }
                  }
                  const avgFontSize = fontCount > 0 ? fontSizeSum / fontCount : Font.DEFAULT_SIZE;
                  const mostCommonFontFamily = Object.entries(fontFamilyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || Font.DEFAULT.family;
                  
                  setSettingsRecord(prevSettings => ({
                    ...prevSettings,
                    [Setting.CANONICAL_BASE_PAIR_DISTANCE]: calculatedDistances.canonicalDistance,
                    [Setting.WOBBLE_BASE_PAIR_DISTANCE]: calculatedDistances.wobbleDistance,
                    [Setting.MISMATCH_BASE_PAIR_DISTANCE]: calculatedDistances.mismatchDistance,
                    [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS]: calculatedDistances.contiguousDistance,
                    [Setting.DEFAULT_FONT_SIZE]: avgFontSize,
                    [Setting.DEFAULT_FONT_FAMILY]: mostCommonFontFamily
                  }));

                  setRnaComplexProps(finalRnaComplexProps);
                  resetGlobalHelicesForFormatMenu(finalRnaComplexProps);
                  setImportModalOpen(false);
                  setImportModalError(undefined);

                  // Calculate base pair radius after DOM renders
                  setTimeout(() => {
                    let boundingRectHeightsSum = 0;
                    let numberOfBoundingRects = 0;
                    const nucleotideElements = Array.from(
                      document.querySelectorAll(`.${NUCLEOTIDE_CLASS_NAME}`) as NodeListOf<SVGGraphicsElement>
                    );
                    for (const nucleotideElement of nucleotideElements) {
                      const boundingClientRect = nucleotideElement.getBBox();
                      boundingRectHeightsSum += boundingClientRect.height;
                      numberOfBoundingRects++;
                    }
                    const averageBoundingRectHeight = numberOfBoundingRects === 0 ? 1 : (boundingRectHeightsSum / numberOfBoundingRects);
                    const newBasePairRadius = averageBoundingRectHeight * 0.3; // font 6 -> bp 1.8
                    setAverageNucleotideBoundingRectHeight(averageBoundingRectHeight);
                    setBasePairRadius(newBasePairRadius);
                    setSettingsRecord(prev => ({
                      ...prev,
                      [Setting.BASE_PAIR_RADIUS]: newBasePairRadius
                    }));
                    setTimeout(() => {
                      resetViewport();
                      setSceneState(SceneState.DATA_IS_LOADED);
                    }, 0);
                  }, 500);
                } catch (error) {
                  const message = error instanceof Error ? error.message : String(error);
                  setImportModalError(message);
                }
              });
              reader.readAsText(file);
            }}
            onLoadExample={(mode: ImportMode) => {
              fetch(`${process.env.PUBLIC_URL ?? ""}/7k00_23_b.json`)
                .then((response) => response.text())
                .then((content) => {
                  try {
                    const parsedInput = inputFileReadersRecord[InputFileExtension.json](content);
                    
                    // Apply default colors and Y-axis inversion (JSON files need Y inversion)
                    for (const singularRnaComplexProps of parsedInput.rnaComplexProps) {
                      for (const [rnaMoleculeName, singularRnaMoleculeProps] of Object.entries(singularRnaComplexProps.rnaMoleculeProps)) {
                        if (!(rnaMoleculeName in singularRnaComplexProps.basePairs)) {
                          singularRnaComplexProps.basePairs[rnaMoleculeName] = {};
                        }
                        for (const singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
                          if (singularNucleotideProps.color === undefined) {
                            singularNucleotideProps.color = structuredClone(BLACK);
                          }
                          if (singularNucleotideProps.font === undefined) {
                            singularNucleotideProps.font = structuredClone(Font.DEFAULT);
                          }
                          // Invert Y axis for JSON format
                          singularNucleotideProps.y *= -1;
                          if (singularNucleotideProps.labelLineProps !== undefined) {
                            for (let i = 0; i < singularNucleotideProps.labelLineProps.points.length; i++) {
                              singularNucleotideProps.labelLineProps.points[i].y *= -1;
                            }
                          }
                          if (singularNucleotideProps.labelContentProps !== undefined) {
                            singularNucleotideProps.labelContentProps.y *= -1;
                          }
                        }
                      }
                    }

                    let finalRnaComplexProps: RnaComplexProps;
                    
                    if (mode === 'new') {
                      finalRnaComplexProps = {};
                      parsedInput.rnaComplexProps.forEach((complexProps, index) => {
                        finalRnaComplexProps[index] = complexProps;
                      });
                      setOutputFileName("7k00_23_b");
                      setOutputFileExtension("json" as OutputFileExtension);
                      outputFileExtensionReference.current = "json" as OutputFileExtension;
                    } else {
                      // Add molecules to existing complex (merge into first complex)
                      finalRnaComplexProps = structuredClone(rnaComplexProps);
                      
                      // If no existing complex, create one
                      if (Object.keys(finalRnaComplexProps).length === 0) {
                        finalRnaComplexProps[0] = {
                          name: 'Complex',
                          rnaMoleculeProps: {},
                          basePairs: {}
                        };
                      }
                      
                      // Merge all imported molecules into the first complex
                      const firstComplexIndex = Number(Object.keys(finalRnaComplexProps)[0]);
                      for (const importedComplex of parsedInput.rnaComplexProps) {
                        const { mergedComplex } = mergeMoleculesIntoComplex(
                          finalRnaComplexProps[firstComplexIndex],
                          importedComplex
                        );
                        finalRnaComplexProps[firstComplexIndex] = mergedComplex;
                      }
                    }

                    setUndoStack([]);
                    setRedoStack([]);
                    setBasePairKeysToEdit({});

                    // Calculate and prefill base pair distance settings
                    const calculatedDistances = calculateBasePairDistances(parsedInput.rnaComplexProps);
                    
                    // Calculate average font size and most common font family
                    let fontSizeSum = 0;
                    let fontCount = 0;
                    const fontFamilyCounts: Record<string, number> = {};
                    for (const complexProps of parsedInput.rnaComplexProps) {
                      for (const molProps of Object.values(complexProps.rnaMoleculeProps)) {
                        for (const nucProps of Object.values(molProps.nucleotideProps)) {
                          if (nucProps.font?.size) {
                            fontSizeSum += typeof nucProps.font.size === 'number' ? nucProps.font.size : parseFloat(nucProps.font.size);
                            fontCount++;
                          }
                          if (nucProps.font?.family) {
                            fontFamilyCounts[nucProps.font.family] = (fontFamilyCounts[nucProps.font.family] || 0) + 1;
                          }
                        }
                      }
                    }
                    const avgFontSize = fontCount > 0 ? fontSizeSum / fontCount : Font.DEFAULT_SIZE;
                    const mostCommonFontFamily = Object.entries(fontFamilyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || Font.DEFAULT.family;
                    
                    setSettingsRecord(prevSettings => ({
                      ...prevSettings,
                      [Setting.CANONICAL_BASE_PAIR_DISTANCE]: calculatedDistances.canonicalDistance,
                      [Setting.WOBBLE_BASE_PAIR_DISTANCE]: calculatedDistances.wobbleDistance,
                      [Setting.MISMATCH_BASE_PAIR_DISTANCE]: calculatedDistances.mismatchDistance,
                      [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS]: calculatedDistances.contiguousDistance,
                      [Setting.DEFAULT_FONT_SIZE]: avgFontSize,
                      [Setting.DEFAULT_FONT_FAMILY]: mostCommonFontFamily
                    }));

                    setRnaComplexProps(finalRnaComplexProps);
                    resetGlobalHelicesForFormatMenu(finalRnaComplexProps);
                    setImportModalOpen(false);
                    setImportModalError(undefined);

                    // Calculate base pair radius after DOM renders
                    setTimeout(() => {
                      let boundingRectHeightsSum = 0;
                      let numberOfBoundingRects = 0;
                      const nucleotideElements = Array.from(
                        document.querySelectorAll(`.${NUCLEOTIDE_CLASS_NAME}`) as NodeListOf<SVGGraphicsElement>
                      );
                      for (const nucleotideElement of nucleotideElements) {
                        const boundingClientRect = nucleotideElement.getBBox();
                        boundingRectHeightsSum += boundingClientRect.height;
                        numberOfBoundingRects++;
                      }
                      const averageBoundingRectHeight = numberOfBoundingRects === 0 ? 1 : (boundingRectHeightsSum / numberOfBoundingRects);
                      const newBasePairRadius = averageBoundingRectHeight * 0.3; // font 6 -> bp 1.8
                      setAverageNucleotideBoundingRectHeight(averageBoundingRectHeight);
                      setBasePairRadius(newBasePairRadius);
                      setSettingsRecord(prev => ({
                        ...prev,
                        [Setting.BASE_PAIR_RADIUS]: newBasePairRadius
                      }));
                      setTimeout(() => {
                        resetViewport();
                        setSceneState(SceneState.DATA_IS_LOADED);
                      }, 0);
                    }, 500);
                  } catch (error) {
                    const message = error instanceof Error ? error.message : String(error);
                    setImportModalError(message);
                  }
                })
                .catch((error) => {
                  const message = error instanceof Error ? error.message : String(error);
                  setImportModalError(message);
                });
            }}
            onImportFR3D={async (pdbId: string, chainId: string, mode: ImportMode) => {
              try {
                // Use CORS proxy with fallbacks to work around FR3D API CORS issues
                const fr3dUrl = `https://rna.bgsu.edu/rna3dhub/rest/getChainSequenceBasePairs?pdb_id=${encodeURIComponent(pdbId)}&chain=${encodeURIComponent(chainId)}`;
                const data = await fetchJsonWithCorsProxy<{
                  sequence?: string;
                  annotations?: Array<{ seq_id1: string; seq_id2: string; bp: string; nt1?: string; nt2?: string }>;
                }>(fr3dUrl);
                
                // Check for error response
                if (data.sequence === "No sequence was found for the given id" || !data.sequence || data.sequence.length === 0) {
                  throw new Error(`No sequence found for PDB ID "${pdbId}" chain "${chainId}". Please check the IDs and try again.`);
                }
                
                // Parse FR3D response into RNA complex props
                const sequence = data.sequence as string;
                const annotations = (data.annotations || []) as Array<{
                  seq_id1: string;
                  seq_id2: string;
                  bp: string;
                  nt1: string;
                  nt2: string;
                }>;
                
                const rnaComplexName = `${pdbId}_${chainId}`;
                const rnaMoleculeName = chainId;
                
                // Generate circular layout
                const MINIMUM_RADIUS = 40;
                const RADIUS_PER_NUCLEOTIDE = 6;
                const radius = Math.max(MINIMUM_RADIUS, sequence.length * RADIUS_PER_NUCLEOTIDE);
                const centerOffset = radius + 10;
                
                const singularRnaMoleculeProps: RnaMolecule.ExternalProps = {
                  firstNucleotideIndex: 1,
                  nucleotideProps: {},
                };
                
                // Create nucleotides with circular layout
                for (let i = 0; i < sequence.length; i++) {
                  const desiredGapNucleotideCount = Math.min(2, Math.max(0, sequence.length - 2));
                  const baseSpacing = (2 * Math.PI) / sequence.length;
                  const gapAngle = (desiredGapNucleotideCount + 1) * baseSpacing;
                  const usableAngle = 2 * Math.PI - gapAngle;
                  const angleIncrement = sequence.length > 1 ? usableAngle / (sequence.length - 1) : 0;
                  const startAngle = -Math.PI / 2 + gapAngle / 2;
                  const angle = startAngle + i * angleIncrement;
                  
                  const x = centerOffset + radius * Math.cos(angle);
                  const y = centerOffset + radius * Math.sin(angle);
                  
                  const rawSymbol = sequence[i].toUpperCase();
                  const sanitizedSymbol = rawSymbol === "T" ? Nucleotide.Symbol.U : rawSymbol;
                  const symbol = Nucleotide.isSymbol(sanitizedSymbol)
                    ? sanitizedSymbol
                    : Nucleotide.Symbol.N;
                  
                  singularRnaMoleculeProps.nucleotideProps[i] = {
                    symbol,
                    x,
                    y,
                    color: structuredClone(BLACK),
                    font: structuredClone(Font.DEFAULT),
                  };
                }
                
                const singularRnaComplexProps: RnaComplex.ExternalProps = {
                  name: rnaComplexName,
                  rnaMoleculeProps: {
                    [rnaMoleculeName]: singularRnaMoleculeProps,
                  },
                  basePairs: {
                    [rnaMoleculeName]: {},
                  },
                };
                
                for (const annotation of annotations) {
                  const idx1 = parseInt(annotation.seq_id1, 10) - 1; // Convert to 0-indexed
                  const idx2 = parseInt(annotation.seq_id2, 10) - 1;
                  
                  if (idx1 >= 0 && idx1 < sequence.length && idx2 >= 0 && idx2 < sequence.length && idx1 !== idx2) {
                    const bpType = annotation.bp || 'cWW';
                    let basePairType: BasePair.Type = BasePair.Type.CANONICAL;
                    
                    const parseLWEdge = (ch: string): 'watson_crick' | 'hoogsteen' | 'sugar_edge' | undefined => {
                      switch (ch.toUpperCase()) {
                        case 'W': return 'watson_crick';
                        case 'H': return 'hoogsteen';
                        case 'S': return 'sugar_edge';
                        default: return undefined;
                      }
                    };
                    
                    let normalizedCode = bpType;
                    if (normalizedCode.toLowerCase().startsWith('n')) {
                      normalizedCode = normalizedCode.substring(1);
                    }
                    
                    if (normalizedCode.length >= 3) {
                      const orientation = normalizedCode[0].toLowerCase() === 't' ? 'trans' : 'cis';
                      const edgeA = parseLWEdge(normalizedCode[1]);
                      const edgeB = parseLWEdge(normalizedCode[2]);
                      
                      if (edgeA && edgeB) {
                        // Build full LW type
                        const lwType = `${orientation}_${edgeA}_${edgeB}` as BasePair.Type;
                        if (BasePair.types.includes(lwType)) {
                          basePairType = lwType;
                        } else if (edgeA === 'watson_crick' && edgeB === 'watson_crick') {
                          basePairType = orientation === 'cis' ? BasePair.Type.CANONICAL : BasePair.Type.WOBBLE;
                        } else {
                          basePairType = BasePair.Type.MISMATCH;
                        }
                      }
                    }
                    
                    // Only add if not already added (to avoid duplicates)
                    if (!singularRnaComplexProps.basePairs[rnaMoleculeName][idx1]) {
                      singularRnaComplexProps.basePairs[rnaMoleculeName][idx1] = [];
                    }
                    
                    // Check if this pair already exists
                    const existingPair = singularRnaComplexProps.basePairs[rnaMoleculeName][idx1].find(
                      bp => bp.rnaMoleculeName === rnaMoleculeName && bp.nucleotideIndex === idx2
                    );
                    
                    if (!existingPair) {
                      singularRnaComplexProps.basePairs[rnaMoleculeName][idx1].push({
                        rnaMoleculeName,
                        nucleotideIndex: idx2,
                        basePairType,
                        strokeWidth: DEFAULT_STROKE_WIDTH,
                      });
                      
                      // Add symmetric entry
                      if (!singularRnaComplexProps.basePairs[rnaMoleculeName][idx2]) {
                        singularRnaComplexProps.basePairs[rnaMoleculeName][idx2] = [];
                      }
                      singularRnaComplexProps.basePairs[rnaMoleculeName][idx2].push({
                        rnaMoleculeName,
                        nucleotideIndex: idx1,
                        basePairType,
                        strokeWidth: DEFAULT_STROKE_WIDTH,
                      });
                    }
                  }
                }
                
                let finalRnaComplexProps: RnaComplexProps;
                
                if (mode === 'new') {
                  finalRnaComplexProps = { 0: singularRnaComplexProps };
                  setOutputFileName(rnaComplexName);
                } else {
                  // Add molecules to existing complex (merge into first complex)
                  finalRnaComplexProps = structuredClone(rnaComplexProps);
                  
                  // If no existing complex, create one
                  if (Object.keys(finalRnaComplexProps).length === 0) {
                    finalRnaComplexProps[0] = {
                      name: 'Complex',
                      rnaMoleculeProps: {},
                      basePairs: {}
                    };
                  }
                  
                  // Merge the FR3D molecule into the first complex
                  const firstComplexIndex = Number(Object.keys(finalRnaComplexProps)[0]);
                  const { mergedComplex } = mergeMoleculesIntoComplex(
                    finalRnaComplexProps[firstComplexIndex],
                    singularRnaComplexProps
                  );
                  finalRnaComplexProps[firstComplexIndex] = mergedComplex;
                }
                
                setUndoStack([]);
                setRedoStack([]);
                setBasePairKeysToEdit({});

                // Calculate and prefill base pair distance settings
                const calculatedDistances = calculateBasePairDistances([singularRnaComplexProps]);
                
                // For FR3D imports, nucleotides are created with Font.DEFAULT
                setSettingsRecord(prevSettings => ({
                  ...prevSettings,
                  [Setting.CANONICAL_BASE_PAIR_DISTANCE]: calculatedDistances.canonicalDistance,
                  [Setting.WOBBLE_BASE_PAIR_DISTANCE]: calculatedDistances.wobbleDistance,
                  [Setting.MISMATCH_BASE_PAIR_DISTANCE]: calculatedDistances.mismatchDistance,
                  [Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS]: calculatedDistances.contiguousDistance,
                  [Setting.DEFAULT_FONT_SIZE]: Font.DEFAULT_SIZE,
                  [Setting.DEFAULT_FONT_FAMILY]: Font.DEFAULT.family
                }));

                setRnaComplexProps(finalRnaComplexProps);
                resetGlobalHelicesForFormatMenu(finalRnaComplexProps);
                setImportModalOpen(false);
                setImportModalError(undefined);
                
                // Calculate base pair radius after DOM renders
                setTimeout(() => {
                  let boundingRectHeightsSum = 0;
                  let numberOfBoundingRects = 0;
                  const nucleotideElements = Array.from(
                    document.querySelectorAll(`.${NUCLEOTIDE_CLASS_NAME}`) as NodeListOf<SVGGraphicsElement>
                  );
                  for (const nucleotideElement of nucleotideElements) {
                    const boundingClientRect = nucleotideElement.getBBox();
                    boundingRectHeightsSum += boundingClientRect.height;
                    numberOfBoundingRects++;
                  }
                  const averageBoundingRectHeight = numberOfBoundingRects === 0 ? 1 : (boundingRectHeightsSum / numberOfBoundingRects);
                  const newBasePairRadius = averageBoundingRectHeight * 0.3; // font 6 -> bp 1.8
                  setAverageNucleotideBoundingRectHeight(averageBoundingRectHeight);
                  setBasePairRadius(newBasePairRadius);
                  setSettingsRecord(prev => ({
                    ...prev,
                    [Setting.BASE_PAIR_RADIUS]: newBasePairRadius
                  }));
                  setTimeout(() => {
                    resetViewport();
                    setSceneState(SceneState.DATA_IS_LOADED);
                  }, 0);
                }, 500);
              } catch (error) {
                const message = error instanceof Error ? error.message : String(error);
                setImportModalError(message);
                throw error; // Re-throw to let the modal know loading is done
              }
            }}
            errorMessage={importModalError}
          />
        </div>
      </Context.MemoizedComponent>
    );
  }
}

export default App;
