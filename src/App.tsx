import React, { createElement, createRef, Fragment, FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_TAB, Tab, tabs } from './app_data/Tab';
import { add, scaleDown, subtract, Vector2D } from './data_structures/Vector2D';
import { useResizeDetector } from 'react-resize-detector';
import { compareBasePairKeys, RnaComplex } from './components/app_specific/RnaComplex';
import { OutputFileExtension, outputFileExtensions, outputFileWritersMap } from './io/OutputUI';
import { SCALE_BASE, ONE_OVER_LOG_OF_SCALE_BASE, MouseButtonIndices } from './utils/Constants';
import { inputFileExtensions, InputFileExtension, inputFileReadersRecord, ParsedInputFile, defaultInvertYAxisFlagRecord } from './io/InputUI';
import { DEFAULT_SETTINGS, Setting, settings, settingsLongDescriptionsMap, SettingsRecord, settingsShortDescriptionsMap, settingsTypeMap, SettingValue } from './ui/Setting';
import InputWithValidator from './components/generic/InputWithValidator';
import { BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, Context, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaComplex } from './context/Context';
import { isEmpty, sign, subtractNumbers } from './utils/Utils';
import { Nucleotide } from './components/app_specific/Nucleotide';
import { LabelContent } from './components/app_specific/LabelContent';
import { LabelLine } from './components/app_specific/LabelLine';
import { InteractionConstraint } from './ui/InteractionConstraint/InteractionConstraints';
import { LabelContentEditMenu } from './components/app_specific/menus/edit_menus/LabelContentEditMenu';
import { LabelLineEditMenu } from './components/app_specific/menus/edit_menus/LabelLineEditMenu';
import { BasePairsEditor } from './components/app_specific/editors/BasePairsEditor';
import { Collapsible } from './components/generic/Collapsible';
import { SAMPLE_XRNA_FILE } from './utils/sampleXrnaFile';
import { fileExtensionDescriptions } from './io/FileExtension';
import loadingGif from './images/loading.svg';
import { SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from './io/SvgInputFileHandler';
import { BLACK } from './data_structures/Color';
import { RnaMolecule } from './components/app_specific/RnaMolecule';
import { LabelEditMenu } from './components/app_specific/menus/edit_menus/LabelEditMenu';
import { AbstractInteractionConstraint, basePairedNucleotideError } from './ui/InteractionConstraint/AbstractInteractionConstraint';

const VIEWPORT_SCALE_EXPONENT_MINIMUM = -50;
const VIEWPORT_SCALE_EXPONENT_MAXIMUM = 50;
const viewportScalePowPrecalculation : Record<number, number> = {};
for (let viewportScaleExponent = VIEWPORT_SCALE_EXPONENT_MINIMUM; viewportScaleExponent <= VIEWPORT_SCALE_EXPONENT_MAXIMUM; viewportScaleExponent++) {
  viewportScalePowPrecalculation[viewportScaleExponent] = Math.pow(SCALE_BASE, viewportScaleExponent);
}

export const TOOLS_DIV_BACKGROUND_COLOR = "white";
export const SVG_ELEMENT_HTML_ID = "viewport";
export const TEST_SPACE_ID = "testSpace";
export const MOUSE_OVER_TEXT_HTML_ID = "mouse_over_text_group";

// Begin externally-facing constants.
export const HTML_ELEMENT_ID_DELIMITER = "|";

// Begin types.
export type RnaComplexKey = number;
export type RnaMoleculeKey = string;
export type NucleotideKey = number;
export type FullKeys = {
  rnaComplexIndex : RnaComplexKey,
  rnaMoleculeName : RnaMoleculeKey,
  nucleotideIndex : NucleotideKey
};
export type FullKeysRecord = Record<RnaComplexKey, Record<RnaMoleculeKey, Set<NucleotideKey>>>;
export type DragListener = {
  initiateDrag : () => Vector2D,
  continueDrag : (
    totalDrag : Vector2D,
    reposiitonAnnotationsFlag : boolean
  ) => void,
  terminateDrag? : () => void
}
export type RnaComplexProps = Record<RnaComplexKey, RnaComplex.ExternalProps>;

enum SceneState {
  NO_DATA = "No data",
  DATA_IS_LOADING = "Data is loading",
  DATA_IS_LOADED = "Data is loaded",
  DATA_LOADING_FAILED = "Data loading failed"
}
// Begin app-specific constants.
const DIV_BUFFER_HEIGHT = 2;
const MOUSE_OVER_TEXT_FONT_SIZE = 20;
const UPLOAD_BUTTON_TEXT = "Upload";
const DOWNLOAD_ROW_TEXT = "Output File";
const DOWNLOAD_BUTTON_TEXT = "Download";
const TRANSLATION_TEXT = "Translation";
const SCALE_TEXT = "Scale";
const INTERACTION_CONSTRAINT_TEXT = "Constraint";
const XRNA_SETTINGS_FILE_NAME = "xrna_settings";
const strokesPerTab : Partial<Record<Tab, string>> = {
  [Tab.EDIT] : "red",
  [Tab.FORMAT] : "blue",
  [Tab.ANNOTATE] : "orange"
};

function App() {
  // Begin state data.
  const [
    complexDocumentName,
    setComplexDocumentName
  ] = useState("");
  const [
    rnaComplexProps,
    setRnaComplexProps
  ] = useState<RnaComplexProps>({});
  const [
    flattenedRnaComplexPropsLength,
    setFlattenedRnaComplexPropsLength
  ] = useState<number>(0);
  const [
    inputFileNameAndExtension,
    setInputFileNameAndExtension
  ] = useState("");
  const [
    outputFileName,
    setOutputFileName
  ] = useState<string>("");
  const [
    outputFileExtension,
    setOutputFileExtension
  ] = useState<OutputFileExtension | undefined>(undefined);
  type SceneBounds = {
    x : number,
    y : number,
    width : number,
    height : number
  };
  const [
    sceneBounds,
    setSceneBounds
  ] = useState<SceneBounds>({
    x : 0,
    y : 0,
    width : 1,
    height : 1
  });
  const [
    basePairKeysToEdit,
    setBasePairKeysToEdit
  ] = useState<Record<RnaComplexKey, Context.BasePair.KeysToEditPerRnaComplexType>>({});
  // Begin UI-relevant state data.
  const [
    tab,
    setTab
  ] = useState(DEFAULT_TAB);
  const [
    interactionConstraint,
    setInteractionConstraint
  ] = useState<InteractionConstraint.Enum | undefined>(InteractionConstraint.Enum.ENTIRE_SCENE);
  const [
    settingsRecord,
    setSettingsRecord
  ] = useState<SettingsRecord>(DEFAULT_SETTINGS);
  const [
    rightClickMenuContent,
    _setRightClickMenuContent
  ] = useState(<></>);
  const [
    nucleotideKeysToRerender,
    setNucleotideKeysToRerender
  ] = useState<NucleotideKeysToRerender>({});
  const [
    basePairKeysToRerender,
    setBasePairKeysToRerender
  ] = useState<BasePairKeysToRerender>({});
  const [
    sceneState,
    setSceneState
  ] = useState(SceneState.NO_DATA);
  const [
    mouseOverText,
    setMouseOverText
  ] = useState("");
  const [
    mouseOverTextDimensions,
    setMouseOverTextDimensions
  ] = useState<{
    width : number,
    height : number
  }>({
    width : 0,
    height : 0
  });
  const [
    originOfDrag,
    setOriginOfDrag
  ] = useState<Vector2D>({
    x : 0,
    y : 0
  });
  const [
    dragCache,
    setDragCache
  ] = useState<Vector2D>({
    x : 0,
    y : 0
  });
  const [
    dragListener,
    _setDragListener
  ] = useState<DragListener | null>(null);
  const [
    resetOrientationDataTrigger,
    setResetOrientationDataTrigger
  ] = useState(false);
  const [
    downloadButtonErrorMessage,
    setDownloadButtonErrorMessage
  ] = useState<string>("");
  const [
    dataLoadingFailedErrorMessage,
    setDataLoadingFailedErrorMessage
  ] = useState<string>("");
  const [
    interactionConstraintOptions,
    setInteractionConstraintOptions
  ] = useState(InteractionConstraint.DEFAULT_OPTIONS);
  const [
    rightClickMenuOptionsMenu,
    setRightClickMenuOptionsMenu
  ] = useState(<></>);
  type BasePairAverageDistances = Record<RnaComplexKey, Context.BasePair.AllDistances>;
  const [
    basePairAverageDistances,
    setBasePairAverageDistances
  ] = useState<BasePairAverageDistances>({});
  type LabelContentStyles = Record<RnaComplexKey, Record<RnaMoleculeKey, Context.Label.Content.Style>>;
  const [
    labelContentDefaultStyles,
    setLabelContentDefaultStyles
  ] = useState<LabelContentStyles>({});
  const [
    rightClickMenuAffectedNucleotideIndices,
    setRightClickMenuAffectedNucleotideIndices
  ] = useState<FullKeysRecord>({});
  const [
    dragListenerAffectedNucleotideIndices,
    setDragListenerAffectedNucleotideIndices
  ] = useState<FullKeysRecord>({});
  // Begin viewport-relevant state data.
  const [
    viewportTranslateX,
    setViewportTranslateX
  ] = useState(0);
  const [
    viewportTranslateY,
    setViewportTranslateY
  ] = useState(0);
  const [
    viewportScale,
    setViewportScale
  ] = useState(1);
  const [
    viewportScaleExponent,
    setViewportScaleExponent
  ] = useState(0);
  const [
    debugVisualElements,
    setDebugVisualElements
  ] = useState<Array<JSX.Element>>([]);
  type ToolsDivHeightAttribute = "auto" | number | undefined;
  const [
    toolsDivHeightAttribute,
    setToolsDivHeightAttribute
  ] = useState<ToolsDivHeightAttribute>("auto");
  type RerenderTriggers = Record<RnaComplexKey, Record<RnaMoleculeKey, Record<NucleotideKey, Context.App.RerenderTriggersPerNucleotide>>>;
  const [
    rerenderTriggers,
    setRerenderTriggers
  ] = useState<RerenderTriggers>({});
  // Begin state-relevant helper functions.
  function setDragListener(
    dragListener : DragListener | null,
    newDragListenerAffectedNucleotideIndices : FullKeysRecord
  ) {
    if (dragListener !== null) {
      setDragCache(dragListener.initiateDrag());
    }
    _setDragListener(dragListener);
    setDragListenerAffectedNucleotideIndices(newDragListenerAffectedNucleotideIndices);
  }
  const viewportDragListener : DragListener = {
    initiateDrag() {
      return {
        x : viewportTranslateXReference.current,
        y : viewportTranslateYReference.current
      };
    },
    continueDrag(totalDrag : Vector2D) {
      setViewportTranslateX(totalDrag.x);
      setViewportTranslateY(totalDrag.y);
    }
  };
  // Begin reference data.
  const downloadOutputFileHtmlButtonReference = useRef<HTMLButtonElement>();
  const downloadOutputFileHtmlAnchorReference = createRef<HTMLAnchorElement>();
  const downloadSampleInputFileHtmlAnchorReference = createRef<HTMLAnchorElement>();
  const settingsFileDownloadHtmlAnchorReference = createRef<HTMLAnchorElement>();
  const settingsFileUploadHtmlInputReference = createRef<HTMLInputElement>();
  const mouseOverTextSvgTextElementReference = createRef<SVGTextElement>();
  const parentDivResizeDetector = useResizeDetector();
  const toolsDivResizeDetector = useResizeDetector();
  const interactionConstraintReference = useRef<InteractionConstraint.Enum | undefined>(interactionConstraint);
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
  const interactionConstraintOptionsReference = useRef<InteractionConstraint.Options>();
  interactionConstraintOptionsReference.current = interactionConstraintOptions;
  const basePairAverageDistancesReference = useRef<BasePairAverageDistances>();
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
  const toolsDivResizeDetectorHeightReference = useRef<number | undefined>();
  toolsDivResizeDetectorHeightReference.current = toolsDivResizeDetector.height;
  type TotalScale = {
    positiveScale : number,
    negativeScale : number,
    asTransform : string
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
  const tabInstructionsRecordReference = useRef<Record<Tab, JSX.Element>>();
  const outputFileNameReference = useRef<string>();
  outputFileNameReference.current = outputFileName;
  const outputFileExtensionReference = useRef<OutputFileExtension | undefined>();
  outputFileExtensionReference.current = outputFileExtension;
  const downloadButtonErrorMessageReference = useRef<string>();
  downloadButtonErrorMessageReference.current = downloadButtonErrorMessage;
  const uploadInputFileHtmlInputReference = useRef<HTMLInputElement>();
  const flattenedRnaComplexPropsLengthReference = useRef<number>(0);
  flattenedRnaComplexPropsLengthReference.current = flattenedRnaComplexPropsLength;
  const rerenderTriggersReference = useRef<RerenderTriggers>();
  rerenderTriggersReference.current = {};
  // Begin memo data.
  const flattenedRnaComplexProps = useMemo(
    function() {
      const flattenedRnaComplexProps = Object.entries(rnaComplexProps);
      setFlattenedRnaComplexPropsLength(flattenedRnaComplexProps.length);
      return flattenedRnaComplexProps;
    },
    [rnaComplexProps]
  );
  const svgHeight = useMemo(
    function() {
      return Math.max((parentDivResizeDetector.height ?? 0) - (toolsDivResizeDetector.height ?? 0), 0);
    },
    [
      parentDivResizeDetector.height,
      toolsDivResizeDetector.height
    ]
  );
  const sceneDimensionsReciprocals = useMemo(
    function() {
      return ({
        width : 1 / sceneBounds.width,
        height : 1 / sceneBounds.height
      });
    },
    [sceneBounds]
  );
  const sceneBoundsScaleMin = useMemo(
    function() {
      return Math.min(
        (parentDivResizeDetector.width ?? 0) * sceneDimensionsReciprocals.width,
        svgHeight * sceneDimensionsReciprocals.height
      );
    },
    [
      parentDivResizeDetector.width,
      svgHeight,
      sceneDimensionsReciprocals
    ]
  );
  sceneBoundsScaleMinReference.current = sceneBoundsScaleMin;
  const transformTranslate = useMemo(
    function() {
      return `translate(${-sceneBounds.x + viewportTranslateX}, ${-(sceneBounds.y + sceneBounds.height) + viewportTranslateY})`;
    },
    [
      sceneBounds,
      viewportTranslateX,
      viewportTranslateY
    ]
  );
  const totalScale : TotalScale = useMemo(
    function() {
      const positiveScale = viewportScale * sceneBoundsScaleMin;
      return {
        positiveScale,
        negativeScale : 1 / positiveScale,
        asTransform : `scale(${positiveScale})`
      };
    },
    [
      viewportScale,
      sceneBoundsScaleMin
    ]
  );
  totalScaleReference.current = totalScale;
  const labelOnMouseDownRightClickHelper = useMemo(
    function() {
      return function(fullKeys : FullKeys) {
        switch (tabReference.current) {
          case Tab.EDIT : {
            const interactionConstraint = interactionConstraintReference.current;
            if (interactionConstraint === undefined || !InteractionConstraint.isEnum(interactionConstraint)) {
              alert("Select an interaction constraint first!");
              return;
            }
            const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
            try {
              const helper = InteractionConstraint.record[interactionConstraint](
                rnaComplexProps,
                fullKeys,
                setNucleotideKeysToRerender,
                setBasePairKeysToRerender,
                setDebugVisualElements,
                tab
              );
              setRightClickMenuContent(
                <LabelEditMenu.Component
                  rnaComplexProps = {rnaComplexProps}
                  indicesOfAffectedNucleotides = {helper.indicesOfAffectedNucleotides}
                  setNucleotideKeysToRerender = {setNucleotideKeysToRerender}
                />,
                helper.indicesOfAffectedNucleotides
              );
            } catch (error : any) {
              if (typeof error === "object" && "errorMessage" in error) {
                alert(error.errorMessage);
              } else {
                throw error;
              }
            }
            break;
          }
        }
      }
    },
    []
  );
  const labelContentOnMouseDownHelper = useMemo(
    function() {
      return function(
        e : React.MouseEvent<LabelContent.SvgRepresentation>,
        fullKeys : FullKeys
      ) {
        const {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        } = fullKeys;
        switch (e.button) {
          case MouseButtonIndices.Left : {
            let newDragListener : DragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT) {
              const singularNucleotideProps = (rnaComplexPropsReference.current as RnaComplexProps)[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
              const labelContentProps = singularNucleotideProps.labelContentProps as LabelContent.ExternalProps;
              newDragListener = {
                initiateDrag() {
                  return {
                    x : labelContentProps.x,
                    y : labelContentProps.y
                  };
                },
                continueDrag(totalDrag : Vector2D) {
                  singularNucleotideProps.labelContentProps = {
                    ...labelContentProps,
                    ...totalDrag
                  };
                  labelContentProps.x = totalDrag.x;
                  labelContentProps.y = totalDrag.y;
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex] : {
                      [rnaMoleculeName] : [nucleotideIndex]
                    }
                  });
                }
              };
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(
              newDragListener,
              {
                [rnaComplexIndex] : {
                  [rnaMoleculeName] : setPerRnaMolecule
                }
              }
            );
            break;
          }
          case MouseButtonIndices.Right : {
            labelOnMouseDownRightClickHelper(fullKeys);
            break;
          }
        }
      }
    },
    []
  );
  const labelLineBodyOnMouseDownHelper = useMemo(
    function() {
      return function(
        e : React.MouseEvent<LabelLine.BodySvgRepresentation>,
        fullKeys : FullKeys,
        helper : () => void
      ) {
        const {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        } = fullKeys;
        const singularNucleotideProps = (rnaComplexPropsReference.current as RnaComplexProps)[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
        const labelLineProps = singularNucleotideProps.labelLineProps as LabelLine.ExternalProps;
        switch (e.button) {
          case MouseButtonIndices.Left : {
            let newDragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT) {
              const point0 = labelLineProps.points[0];
              const displacementsPerPoint = labelLineProps.points.map(function(point) {
                return subtract(
                  point,
                  point0
                );
              });
              newDragListener = {
                initiateDrag() {
                  return {
                    x : point0.x,
                    y : point0.y
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
                    [rnaComplexIndex] : {
                      [rnaMoleculeName] : [nucleotideIndex]
                    }
                  });
                }
              };
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(
              newDragListener,
              {
                [rnaComplexIndex] : {
                  [rnaMoleculeName] : setPerRnaMolecule
                }
              }
            );
            break;
          }
          case MouseButtonIndices.Right : {
            labelOnMouseDownRightClickHelper(fullKeys);
            break;
          }
        }
      }
    },
    []
  );
  const labelLineEndpointOnMouseDownHelper = useMemo(
    function() {
      return function(
        e : React.MouseEvent<LabelLine.EndpointSvgRepresentation>,
        fullKeys : FullKeys,
        pointIndex : number,
        helper : () => void
      ) {
        const {
          rnaComplexIndex,
          rnaMoleculeName,
          nucleotideIndex
        } = fullKeys;
        const singularNucleotideProps = (rnaComplexPropsReference.current as RnaComplexProps)[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex];
        const labelLineProps = (singularNucleotideProps.labelLineProps as LabelLine.ExternalProps);
        switch (e.button) {
          case MouseButtonIndices.Left : {
            let newDragListener = viewportDragListener;
            if (tabReference.current === Tab.EDIT) {
              const point = labelLineProps.points[pointIndex];
              newDragListener = {
                initiateDrag() {
                  return {
                    x : point.x,
                    y : point.y
                  };
                },
                continueDrag(totalDrag) {
                  point.x = totalDrag.x;
                  point.y = totalDrag.y;
                  helper();
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex] : {
                      [rnaMoleculeName] : [nucleotideIndex]
                    }
                  });
                }
              };
            }
            const setPerRnaMolecule = new Set<number>();
            setPerRnaMolecule.add(nucleotideIndex);
            setDragListener(
              newDragListener,
              {
                [rnaComplexIndex] : {
                  [rnaMoleculeName] : setPerRnaMolecule
                }
              }
            );
            break;
          }
          case MouseButtonIndices.Right : {
            if (tabReference.current === Tab.EDIT) {
              labelOnMouseDownRightClickHelper(fullKeys);
              // const setPerRnaMolecule = new Set<number>();
              // setPerRnaMolecule.add(nucleotideIndex);
              // setRightClickMenuContent(
              //   <LabelLineEditMenu.Component
              //     rnaComplexProps = {rnaComplexPropsReference.current as RnaComplexProps}
              //     fullKeys = {fullKeys}
              //     triggerRerender = {function() {
              //       setNucleotideKeysToRerender({
              //         [rnaComplexIndex] : {
              //           [rnaMoleculeName] : [nucleotideIndex]
              //         }
              //       });
              //     }}
              //   />,
              //   {
              //     [rnaComplexIndex] : {
              //       [rnaMoleculeName] : setPerRnaMolecule
              //     }
              //   }
              // );
            }
            break;
          }
        }
      }
    },
    []
  );
  const nucleotideOnMouseDownHelper = useMemo(
    function() {
      return function(
        e : React.MouseEvent<Nucleotide.SvgRepresentation>,
        fullKeys : FullKeys
      ) {
        const tab = tabReference.current as Tab;
        const interactionConstraintOptions = interactionConstraintOptionsReference.current as InteractionConstraint.Options;
        let newDragListenerAffectedNucleotideIndices = {};
        switch (e.button) {
          case MouseButtonIndices.Left : {
            let newDragListener : DragListener = viewportDragListener;
            if (tab === Tab.EDIT) {
              const interactionConstraint = interactionConstraintReference.current;
              if (interactionConstraint === undefined) {
                alert("Select an interaction constraint first!");
                return;
              }
              try {
                const helper = InteractionConstraint.record[interactionConstraint](
                  rnaComplexPropsReference.current as RnaComplexProps,
                  fullKeys,
                  setNucleotideKeysToRerender,
                  setBasePairKeysToRerender,
                  setDebugVisualElements,
                  tab
                );
                const newDragListenerAttempt = helper.drag(interactionConstraintOptions);
                newDragListenerAffectedNucleotideIndices = helper.indicesOfAffectedNucleotides;
                if (newDragListenerAttempt != undefined) {
                  newDragListener = newDragListenerAttempt
                }
              } catch (error : any) {
                if (typeof error === "object" && "errorMessage" in error) {
                  alert(error.errorMessage);
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
          case MouseButtonIndices.Right : {
            if (InteractionConstraint.isSupportedTab(tab)) {
              const interactionConstraint = interactionConstraintReference.current;
              if (interactionConstraint === undefined || !InteractionConstraint.isEnum(interactionConstraint)) {
                alert("Select an interaction constraint first!");
                return;
              }
              try {
                const helper = InteractionConstraint.record[interactionConstraint](
                  rnaComplexPropsReference.current as RnaComplexProps,
                  fullKeys,
                  setNucleotideKeysToRerender,
                  setBasePairKeysToRerender,
                  setDebugVisualElements,
                  tab
                );
                const rightClickMenu = helper.createRightClickMenu(tab);
                setResetOrientationDataTrigger(!resetOrientationDataTrigger);
                setRightClickMenuContent(
                  rightClickMenu,
                  helper.indicesOfAffectedNucleotides
                );
              } catch (error : any) {
                if (typeof error === "object" && "errorMessage" in error) {
                  alert(error.errorMessage);
                } else {
                  throw error;
                }
                return;
              }
            }
            break;
          }
        }
      };
    },
    []
  );
  const updateRnaMoleculeNameHelper = useMemo(
    function() {
      return function(
        rnaComplexIndex : RnaComplexKey,
        oldRnaMoleculeName : RnaMoleculeKey,
        newRnaMoleculeName : RnaMoleculeKey
      ) {
        const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
        const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
        const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;

        for (let rnaMoleculeName of Object.keys(singularRnaComplexProps.rnaMoleculeProps)) {
          if (!(rnaMoleculeName in basePairsPerRnaComplex)) {
            continue;
          }
          let basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
          for (let mappedBasePairInformation of Object.values(basePairsPerRnaMolecule)) {
            if (mappedBasePairInformation.rnaMoleculeName === oldRnaMoleculeName) {
              mappedBasePairInformation.rnaMoleculeName = newRnaMoleculeName;
            }
          }
        }

        singularRnaComplexProps.rnaMoleculeProps[newRnaMoleculeName] = singularRnaComplexProps.rnaMoleculeProps[oldRnaMoleculeName];
        delete singularRnaComplexProps.rnaMoleculeProps[oldRnaMoleculeName];

        const basePairsPerRnaMolecule = basePairsPerRnaComplex[oldRnaMoleculeName];
        delete basePairsPerRnaComplex[oldRnaMoleculeName];
        basePairsPerRnaComplex[newRnaMoleculeName] = basePairsPerRnaMolecule;

        setNucleotideKeysToRerender({
          [rnaComplexIndex] : {}
        });
      };
    },
    []
  );
  const updateBasePairAverageDistances = useMemo(
    function() {
      return function(
        rnaComplexKey : RnaComplexKey,
        basePairDistances : Context.BasePair.AllDistances
      ) {
        const basePairAverageDistances = basePairAverageDistancesReference.current;
        setBasePairAverageDistances({
          ...basePairAverageDistances,
          [rnaComplexKey] : basePairDistances
        });
      }
    },
    []
  );
  const updateLabelContentDefaultStyles = useMemo(
    function () {
      return function(
        rnaComplexKey : RnaComplexKey,
        rnaMoleculeKey : RnaMoleculeKey,
        defaultStyle : Partial<Context.Label.Content.Style>
      ) {
        const labelContentDefaultStyles = labelContentDefaultStylesReference.current as LabelContentStyles;
        const newLabelContentDefaultStyles = structuredClone(labelContentDefaultStyles);
        if (!(rnaComplexKey in newLabelContentDefaultStyles)) {
          newLabelContentDefaultStyles[rnaComplexKey] = {};
        }
        const newLabelContentDefaultStylesPerRnaComplex = newLabelContentDefaultStyles[rnaComplexKey];
        newLabelContentDefaultStylesPerRnaComplex[rnaMoleculeKey] = {
          ...newLabelContentDefaultStylesPerRnaComplex[rnaMoleculeKey],
          ...defaultStyle
        };
        setLabelContentDefaultStyles(newLabelContentDefaultStyles);
      }
    },
    []
  );
  const updateInteractionConstraintOptions = useMemo(
    function() {
      return function(newInteractionConstraintOptions : Partial<InteractionConstraint.Options>) {
        setInteractionConstraintOptions({
          ...interactionConstraintOptionsReference.current as InteractionConstraint.Options,
          ...newInteractionConstraintOptions
        });
      }
    },
    []
  );
  function setRightClickMenuContent(
    rightClickMenuContent : JSX.Element,
    rightClickMenuAffectedNucleotides : FullKeysRecord
  ) {
    _setRightClickMenuContent(rightClickMenuContent);

    setRightClickMenuAffectedNucleotideIndices(rightClickMenuAffectedNucleotides);
  }
  const renderedRnaComplexes = useMemo(
    function() {
      return <Context.App.SetMouseOverText.Provider
        value = {setMouseOverText}
      >
        <Context.Nucleotide.OnMouseDownHelper.Provider
          value = {nucleotideOnMouseDownHelper}
        >
          <Context.Label.Content.OnMouseDownHelper.Provider
            value = {labelContentOnMouseDownHelper}
          >
            <Context.Label.Line.Body.OnMouseDownHelper.Provider
              value = {labelLineBodyOnMouseDownHelper}
            >
              <Context.Label.Line.Endpoint.OnMouseDownHelper.Provider
                value = {labelLineEndpointOnMouseDownHelper}
              >
                <g
                  {...{
                    [SVG_PROPERTY_XRNA_TYPE] : SvgPropertyXrnaType.SCENE,
                    [SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME] : complexDocumentName
                  }}
                  ref = {function(svgGElement : SVGGElement | null) {
                    if (svgGElement === null) {
                      return;
                    }
                    sceneSvgGElementReference.current = svgGElement;
                  }}
                >
                  {flattenedRnaComplexProps.map(function(
                    [
                      rnaComplexIndexAsString,
                      singularRnaComplexProps
                    ]
                  ) {
                    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
                    return <Context.RnaComplex.Index.Provider
                      key = {rnaComplexIndex}
                      value = {rnaComplexIndex}
                    >
                      <Context.BasePair.DataToEditPerRnaComplex.Provider
                        value = {basePairKeysToEdit[rnaComplexIndex]}
                      >
                        <RnaComplex.Component
                          {...singularRnaComplexProps}
                          nucleotideKeysToRerenderPerRnaComplex = {nucleotideKeysToRerender[rnaComplexIndex] ?? {}}
                          basePairKeysToRerenderPerRnaComplex = {basePairKeysToRerender[rnaComplexIndex] ?? []}
                        />
                      </Context.BasePair.DataToEditPerRnaComplex.Provider>
                    </Context.RnaComplex.Index.Provider>;
                  })}
                </g>
              </Context.Label.Line.Endpoint.OnMouseDownHelper.Provider>
            </Context.Label.Line.Body.OnMouseDownHelper.Provider>
          </Context.Label.Content.OnMouseDownHelper.Provider>
        </Context.Nucleotide.OnMouseDownHelper.Provider>
      </Context.App.SetMouseOverText.Provider>;
    },
    [
      rnaComplexProps,
      nucleotideKeysToRerender,
      basePairKeysToRerender
    ]
  );
  const triggerRightClickMenuFlag = useMemo(
    function() {
      for (const [rnaComplexIndexAsString, dragListenerAffectedNucleotideIndicesPerRnaComplex] of Object.entries(dragListenerAffectedNucleotideIndices)) {
        const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
        if (!(rnaComplexIndex in rightClickMenuAffectedNucleotideIndices)) {
          continue;
        }
        const rightClickMenuAffectedNucleotideIndicesPerRnaComplex = rightClickMenuAffectedNucleotideIndices[rnaComplexIndex];
        for (const [rnaMoleculeName, dragListenerAffectedNucleotideIndicesPerRnaMolecule] of Object.entries(dragListenerAffectedNucleotideIndicesPerRnaComplex)) {
          if (!(rnaMoleculeName in rightClickMenuAffectedNucleotideIndicesPerRnaComplex)) {
            continue;
          }
          const rightClickMenuAffectedNucleotideIndicesPerRnaMolecule = rightClickMenuAffectedNucleotideIndicesPerRnaComplex[rnaMoleculeName];
          for (const nucleotideIndex of dragListenerAffectedNucleotideIndicesPerRnaMolecule.values()) {
            if (rightClickMenuAffectedNucleotideIndicesPerRnaMolecule.has(nucleotideIndex)) {
              return true;
            }
          }
        }
      }
      return false;
    },
    [
      rightClickMenuAffectedNucleotideIndices,
      dragListenerAffectedNucleotideIndices
    ]
  );
  triggerRightClickMenuFlagReference.current = triggerRightClickMenuFlag;
  const repositionAnnotationsFlag = useMemo(
    function() {
      return settingsRecord[Setting.AUTOMATICALLY_REPOSITION_ANNOTATIONS] as boolean;
    },
    [settingsRecord]
  );
  repositionAnnotationsFlagReference.current = repositionAnnotationsFlag;
  const resetViewport = useMemo(
    function() {
      return function() {
        setSceneBounds((sceneSvgGElementReference.current as SVGGElement).getBBox());
        setViewportTranslateX(0);
        setViewportTranslateY(0);
        setViewportScaleExponent(0);
        setViewportScale(1);
      }
    },
    []
  );
  const parseInputFileContent = useMemo(
    function() {
      return function (
        inputFileContent : string,
        inputFileExtension : InputFileExtension,
        invertYAxisFlag? : boolean 
      ) {
        try {
          const parsedInput = inputFileReadersRecord[inputFileExtension](inputFileContent);
          const rnaComplexNames = new Set<string>();
          for (const singularRnaComplexProps of Object.values(parsedInput.rnaComplexProps)) {
            const {
              name,
              basePairs
            } = singularRnaComplexProps;
            if (rnaComplexNames.has(name)) {
              throw `RNA complexes must have distinct names.`;
            }
            rnaComplexNames.add(name);
      
            for (const [rnaMoleculeName, singularRnaMoleculeProps] of Object.entries(singularRnaComplexProps.rnaMoleculeProps)) {
              if (!(rnaMoleculeName in basePairs)) {
                basePairs[rnaMoleculeName] = {};
              }
              for (const singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
                if (singularNucleotideProps.color === undefined) {
                  singularNucleotideProps.color = structuredClone(BLACK);
                }
                if (singularNucleotideProps.labelContentProps !== undefined) {
                  const labelContentProps = singularNucleotideProps.labelContentProps;
                  if (labelContentProps.color === undefined) {
                    labelContentProps.color = structuredClone(BLACK);
                  }
                }
                if (singularNucleotideProps.labelLineProps !== undefined) {
                  const labelLineProps = singularNucleotideProps.labelLineProps;
                  if (labelLineProps.color === undefined) {
                    labelLineProps.color = structuredClone(BLACK);
                  }
                }
              }
            }
          }
          if (invertYAxisFlag === undefined) {
            invertYAxisFlag = defaultInvertYAxisFlagRecord[inputFileExtension];
          }
          if (invertYAxisFlag) {
            for (const singularRnaComplexProps of parsedInput.rnaComplexProps) {
              Object.values(singularRnaComplexProps.rnaMoleculeProps).forEach((singularRnaMoleculeProps : RnaMolecule.ExternalProps) => {
                Object.values(singularRnaMoleculeProps.nucleotideProps).forEach((singularNucleotideProps : Nucleotide.ExternalProps) => {
                  singularNucleotideProps.y *= -1;
                  if (singularNucleotideProps.labelLineProps !== undefined) {
                    for (let i = 0; i < singularNucleotideProps.labelLineProps.points.length; i++) {
                      singularNucleotideProps.labelLineProps.points[i].y *= -1;
                    }
                  }
                  if (singularNucleotideProps.labelContentProps !== undefined) {
                    singularNucleotideProps.labelContentProps.y *= -1;
                  }
                });
              });
            }
          }
          setRnaComplexProps(parsedInput.rnaComplexProps);
          setComplexDocumentName(parsedInput.complexDocumentName);
        } catch (error) {
          setSceneState(SceneState.DATA_LOADING_FAILED);
          if (typeof error === "string") {
            setDataLoadingFailedErrorMessage(error);
          }
          throw error;
        }
      };
    },
    []
  );
  const parseJson = useMemo(
    function() {
      return function(url : string) {
        let promise = fetch(url, {
          method : "GET"
        });
        promise.then(data => {
          data.text().then(dataAsText => {
            parseInputFileContent(
              dataAsText,
              InputFileExtension.json
            );
          });
        });
      }
    },
    []
  );
  const interactionConstraintSelectHtmlElement = useMemo(
    function() {
      const interactionConstraint = interactionConstraintReference.current as InteractionConstraint.Enum | undefined;
      return <>
        {INTERACTION_CONSTRAINT_TEXT}:&nbsp;
        <select
          value = {interactionConstraint}
          // value = {interactionConstraintReference.current}
          onChange = {function(e) {
            const newInteractionConstraint = e.target.value as InteractionConstraint.Enum;
            setInteractionConstraint(newInteractionConstraint);
            if (newInteractionConstraint in InteractionConstraint.optionsMenuRecord) {
              setRightClickMenuOptionsMenu(createElement(
                InteractionConstraint.optionsMenuRecord[newInteractionConstraint] as FunctionComponent<{}>,
                {}
              ));
            } else {
              setRightClickMenuOptionsMenu(<></>);
            }
          }}
        >
          <option
            style = {{
              display : "none"
            }}
            value = {undefined}
          >
            Select an interaction constraint.
          </option>
          {InteractionConstraint.all.map(function(interactionConstraint : InteractionConstraint.Enum) {
            return (<option
              key = {interactionConstraint}
              value = {interactionConstraint}
            >
              {interactionConstraint}
            </option>);
          })}
        </select>
        <br/>
      </>;
    },
    [
      interactionConstraint,
      interactionConstraintOptions
    ]
  );
  const tabInstructionsRecord : Record<Tab, JSX.Element> = useMemo(
    function() {
      return {
        [Tab.INPUT_OUTPUT] : <>
          Here, you can:
          <br/>
          <ul
            style = {{
              margin : 0
            }}
          >
            <li>
              Upload input files
            </li>
            <li>
              Download output files
            </li>
          </ul>
          Together, these processes enable conversion between file formats.
          <Collapsible.Component
            title = "How to upload input files"
          >
            <ol
              style = {{
                margin : 0
              }}
            >
              <li>
                Click the "{UPLOAD_BUTTON_TEXT}" button.
              </li>
              <li>
                Select one of the following supported input-file formats:
                <ul
                  style = {{
                    margin : 0
                  }}
                >
                  {inputFileExtensions.map(function(
                    inputFileExtension,
                    index
                  ) {
                    return <Fragment
                      key = {index}
                    >
                      <li>
                        .{inputFileExtension} - {fileExtensionDescriptions[inputFileExtension]}
                      </li>
                    </Fragment>
                  })}
                </ul>
              </li>
              <li>
                Upload the file.
              </li>
            </ol>
          </Collapsible.Component>
          <Collapsible.Component
            title = "How to download output files"
          >
            Within the "{DOWNLOAD_ROW_TEXT}" row:
            <ol
              style = {{
                margin : 0
              }}
            >
              <li>
                Provide an output-file name.
              </li>
              <li>
                Select one of the following supported output-file formats:
                <ul
                  style = {{
                    margin : 0
                  }}
                >
                  {outputFileExtensions.map(function(
                    outputFileExtension,
                    index
                  ) {
                    return <Fragment
                      key = {index}
                    >
                      <li>
                        .{outputFileExtension} - {fileExtensionDescriptions[outputFileExtension]}
                      </li>
                    </Fragment>
                  })}
                </ul>
              </li>
              <li>
                Click the "{DOWNLOAD_BUTTON_TEXT}" button
              </li>
            </ol>
          </Collapsible.Component>
        </>,
        [Tab.VIEWPORT] : <>
          Here, you can manipulate the viewport with precision.
          <br/>
          To clarify, the viewport is the main component of XRNA. Within it, interactive RNA diagrms are displayed.
          <Collapsible.Component
            title = {TRANSLATION_TEXT}
          >
            {`"${TRANSLATION_TEXT}" refers to the 2D displacement of the entire viewport. It is synchronized with click-and-drag within the viewport.`}
            <ul
              style = {{
                margin : 0
              }}
            >
              <li>
                x: The horizontal displacement. Rightward displacement is positive; leftward is negative.
              </li>
              <li>
                y: The vertical displacement. Upward displacement is positive; downward is negative.
              </li>
            </ul>
          </Collapsible.Component>
          <Collapsible.Component
            title = {SCALE_TEXT}
          >
            <ul
              style = {{
                margin : 0
              }}
            >
              <li>
                "{SCALE_TEXT}" refers to the "in-and-out zoom" of the entire viewport. It is synchronized with the mousewheel within the viewport.
              </li>
              <li>
                Scrolling up with the mouse wheel increases zoom; this means zooming in. Scrolling down does the opposite.
              </li>
            </ul>
          </Collapsible.Component>
        </>,
        [Tab.EDIT] : <>
          Here, you can edit nucleotide data which has been uploaded and is displayed within the viewport.
          <ol
            style = {{
              margin : 0
            }}
          >
            <li>
              Select a constraint. This selects the set of tools which you will use to edit data.
            </li>
            <li>
              Navigate within the viewport to the portion of the scene you plan to edit.
            </li>
            <li>
              Next, do one of the following:
              <ul
                style = {{
                  margin : 0
                }}
              >
                <li>
                  Left-click on a nucleotide. Drag it to change relevant nucleotide data, according to the behavior of the constraint.
                </li>
                <li>
                  Right-click on a nucleotide. This will populate a right-hand menu, which will allow you precisely edit data.
                </li>
              </ul>
              <Collapsible.Component
                title = "Notes"
              >
                <ul>
                  <li>
                    Most constraints require you to click on a nucleotide that either is or is not base-paired to another nucleotide.
                  </li>
                  <li>
                    Other constraints have more restrictive usage requirements.
                  </li>
                  <li>
                    Annotations may be edited in the same exact way as nucleotides / nucleotide regions (described above).
                  </li>
                  <li>
                    Annotations are not present in some input files, but they can be added within the "{Tab.ANNOTATE}" tab.
                  </li>
                </ul>
              </Collapsible.Component>
            </li>
          </ol>
        </>,
        [Tab.FORMAT] : <>
          Here, you can add, delete, or edit base pairs.
          <ol
            style = {{
              margin : 0
            }}
          >
            <li>
              Select a constraint. This selects the set of tools which you will use to format base-pair data.
            </li>
            <li>
              Navigate within the viewport to the portion of the scene you plan to edit.
            </li>
            <li>
              Right-click on a nucleotide. This will populate a right-hand menu, which will allow you to format base-pair data.
            </li>
          </ol>
          <Collapsible.Component
            title = "Notes"
          >
            <ul
              style = {{
                margin : 0
              }}
            >
              <li>
                Most constraints require you to click on a nucleotide that either is or is not base-paired to another nucleotide.
              </li>
              <li>
                Other constraints have more restrictive usage requirements.
              </li>
            </ul>
          </Collapsible.Component>
        </>,
        [Tab.ANNOTATE] : <>
          Here, you can add, delete, or edit annotations.
          <br/>
          Annotations include:
          <ul
            style = {{
              margin : 0
            }}
          >
            <li>Label content</li>
            <li>label lines</li>
          </ul>
           <b>
            This tab is not yet implemented.
          </b>
        </>,
        [Tab.SETTINGS] : <>
          Here, you can change settings which regulate how XRNA behaves.
          <br/>
          Support for saving your settings is implemented by the pair of upload/download buttons. 
          <br/>
          Store the "{XRNA_SETTINGS_FILE_NAME}" file somewhere you will remember for later use.
        </>,
        // Show nothing.
        [Tab.ABOUT] : <></>
      };
    },
    []
  );
  tabInstructionsRecordReference.current = tabInstructionsRecord;
  const onMouseMove = useMemo(
    function() {
      return function(e : React.MouseEvent<SVGSVGElement, MouseEvent>) {
        const flattenedRnaComplexPropsLength = flattenedRnaComplexPropsLengthReference.current;
        if (flattenedRnaComplexPropsLength === 0) {
          return;
        }
        
        const dragListener = dragListenerReference.current as DragListener | null;
        if (dragListener !== null) {
          const originOfDrag = originOfDragReference.current as Vector2D;
          const dragCache = dragCacheReference.current as Vector2D;
          const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
          const viewportScale = viewportScaleReference.current as number;
          const repositionAnnotationsFlag = repositionAnnotationsFlagReference.current as boolean;
          const triggerRightClickMenuFlag = triggerRightClickMenuFlagReference.current as boolean;
          const resetOrientationDataTrigger = resetOrientationDataTriggerReference.current as boolean;
          const translation = subtract(
            {
              x : e.clientX,
              y : e.clientY
            },
            originOfDrag
          );
          translation.y = -translation.y;
          dragListener.continueDrag(
            add(
              dragCache,
              scaleDown(
                translation,
                viewportScale * sceneBoundsScaleMin
              )
            ),
            repositionAnnotationsFlag
          );
          if (triggerRightClickMenuFlag) {
            setResetOrientationDataTrigger(!resetOrientationDataTrigger);
          }
        }
        e.preventDefault();
      }
    },
    []
  );
  const onMouseDown = useMemo(
    function() {
      return function(e : React.MouseEvent<SVGSVGElement, MouseEvent>) {
        switch (e.button) {
          case MouseButtonIndices.Left : {
            setOriginOfDrag({
              x : e.clientX,
              y : e.clientY
            });
            break;
          }
        }
      };
    },
    []
  );
  const onMouseUp = useMemo(
    function() {
      return function(e : React.MouseEvent<SVGSVGElement, MouseEvent>) {
        const dragListener = dragListenerReference.current as DragListener | null;
        if (dragListener !== null) {
          if (dragListener.terminateDrag !== undefined) {
            dragListener.terminateDrag();
          }
          setDragListener(
            null,
            {}
          );
        }
      };
    },
    []
  );
  const onWheel = useMemo(
    function() {
      return function(e : React.WheelEvent<SVGSVGElement>) {
        const flattenedRnaComplexPropsLength = flattenedRnaComplexPropsLengthReference.current;
        if (flattenedRnaComplexPropsLength === 0) {
          return;
        }

        const viewportScaleExponent = viewportScaleExponentReference.current as number;
        const toolsDivResizeDetectorHeight = toolsDivResizeDetectorHeightReference.current ?? 0;
        const totalScale = totalScaleReference.current as TotalScale;
        const sceneBounds = sceneBoundsReference.current as SceneBounds;
        const viewportTranslateX = viewportTranslateXReference.current as number;
        const viewportTranslateY = viewportTranslateYReference.current as number;
        const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;

        // Apparently, the sign of <event.deltaY> needs to be negated in order to support intuitive scrolling...
        let newScaleExponent = viewportScaleExponent - sign(e.deltaY);
        let newScale = newScaleExponent in viewportScalePowPrecalculation ? viewportScalePowPrecalculation[newScaleExponent] : Math.pow(SCALE_BASE, newScaleExponent);
        setViewportScale(newScale);
        setViewportScaleExponent(newScaleExponent);
        let uiVector = {
          x : e.clientX,
          y : e.clientY - toolsDivResizeDetectorHeight - DIV_BUFFER_HEIGHT
        };
        let reciprocal = totalScale.negativeScale;
        let inputVector = {
          x : uiVector.x * reciprocal + sceneBounds.x - viewportTranslateX,
          y : uiVector.y * reciprocal - sceneBounds.y + viewportTranslateY - sceneBounds.height
        };
        reciprocal = 1 / (newScale * sceneBoundsScaleMin);
        let newOriginDeltaX = uiVector.x * reciprocal - inputVector.x + sceneBounds.x;
        let newOriginDeltaY = -(uiVector.y * reciprocal - inputVector.y - sceneBounds.y - sceneBounds.height);
        setViewportTranslateX(newOriginDeltaX);
        setViewportTranslateY(newOriginDeltaY);
      };
    },
    []
  );
  const uploadInputFileUI = useMemo(
    function() {
      const settingsRecord = settingsRecordReference.current as SettingsRecord;
      return <label>
        Input File:&nbsp;
        <input
          ref = {function(x) {
            if (x !== null) {
              uploadInputFileHtmlInputReference.current = x;
            }
          }}
          style = {{
            display : "none"
          }}
          type = "file"
          accept = {inputFileExtensions.map(function(inputFileExtension : InputFileExtension) {
            return "." + inputFileExtension;
          }).join(",")}
          onChange = {function(e) {
            let files = e.target.files;
            if (files === null || files.length === 0) {
              return;
            }
            setSceneState(SceneState.DATA_IS_LOADING);
            let file = files[0];
            let inputFileNameAndExtension = file.name;
            setInputFileNameAndExtension(inputFileNameAndExtension);
            let regexMatch = /^(.*)\.(.+)$/.exec(inputFileNameAndExtension) as RegExpExecArray;
            let fileName = regexMatch[1];
            let fileExtension = regexMatch[2];
            if (settingsRecord[Setting.SYNC_FILE_NAME]) {
              setOutputFileName(fileName);
            }
            if (settingsRecord[Setting.SYNC_FILE_EXTENSION] && (fileExtension in outputFileWritersMap)) {
              setOutputFileExtension(fileExtension as OutputFileExtension);
            }
            let reader = new FileReader();
            reader.addEventListener("load", function(event) {
              // Read the content of the settings file.
              parseInputFileContent(
                (event.target as FileReader).result as string,
                fileExtension.toLocaleLowerCase() as InputFileExtension
              );
            });
            reader.readAsText(files[0] as File);
          }}
          onClick = {function(e) {
            e.currentTarget.value = "";
          }}
        />
      </label>;
    },
    [settingsRecord]
  );
  const tabRenderRecord = useMemo(
    function() {
      const viewportTranslateX = viewportTranslateXReference.current as number;
      const viewportTranslateY = viewportTranslateYReference.current as number;
      const viewportScaleExponent = viewportScaleExponentReference.current as number;
      const viewportScale = viewportScaleReference.current as number;
      const rightClickMenuOptionsMenu = rightClickMenuOptionsMenuReference.current as JSX.Element;
      const settingsRecord = settingsRecordReference.current as SettingsRecord;
      const tabInstructionsRecord = tabInstructionsRecordReference.current as Record<Tab, JSX.Element>;
      const outputFileExtension = outputFileExtensionReference.current as string;
      
      const tabRenderRecord : Record<Tab, JSX.Element> = {
        [Tab.INPUT_OUTPUT] : <>
          {uploadInputFileUI}
          <button
            onClick = {function(e) {
              (uploadInputFileHtmlInputReference.current as HTMLInputElement).click();
            }}
          >
            {UPLOAD_BUTTON_TEXT}
          </button>
          <em>
            {inputFileNameAndExtension}
          </em>
          <br/>
          <label>
            {DOWNLOAD_ROW_TEXT}:&nbsp;
            <input
              type = "text"
              placeholder = "output_file_name"
              value = {outputFileName}
              onChange = {function(e) {
                setOutputFileName(e.target.value);
              }}
            />
          </label>
          <select
            value = {outputFileExtension}
            onChange = {function(e) {
              setOutputFileExtension(e.target.value as OutputFileExtension);
            }}
          >
            <option
              style = {{
                display : "none"
              }}
              value = {""}
            >
              .file_extension
            </option>
            {outputFileExtensions.map(function(outputFileExtension : OutputFileExtension, index : number) {
              return <option
                key = {index}
                value = {outputFileExtension}
              >
                .{outputFileExtension}
              </option>;
            })}
          </select>
          <button
            ref = {function(htmlButtonElement : HTMLButtonElement) {
              downloadOutputFileHtmlButtonReference.current = htmlButtonElement;
            }}
            onClick = {function() {
              const downloadAnchor = downloadOutputFileHtmlAnchorReference.current as HTMLAnchorElement;
              downloadAnchor.href = `data:text/plain;charset=utf-8,${encodeURIComponent(outputFileWritersMap[outputFileExtension as OutputFileExtension](
                rnaComplexProps,
                complexDocumentName
              ))}`;
              downloadAnchor.click();
            }}
            disabled = {downloadButtonErrorMessage !== ""}
            title = {downloadButtonErrorMessage}
          >
            {DOWNLOAD_BUTTON_TEXT}
          </button>
          <a
            ref = {downloadOutputFileHtmlAnchorReference}
            style = {{
              display : "none"
            }}
            download = {`${outputFileName}.${outputFileExtension}`}
          />
        </>,
        [Tab.VIEWPORT] : <>
          <b>
            {TRANSLATION_TEXT}:
          </b>
          <br/>
          <label>
            x:&nbsp;
            <InputWithValidator.Number
              value = {viewportTranslateX}
              setValue = {setViewportTranslateX}
              disabledFlag = {flattenedRnaComplexPropsLength === 0}
            />
          </label>
          <br/>
          <label>
            y:&nbsp;
            <InputWithValidator.Number
              value = {viewportTranslateY}
              setValue = {setViewportTranslateY}
              disabledFlag = {flattenedRnaComplexPropsLength === 0}
            />
          </label>
          <br/>
          <b>
            {SCALE_TEXT}:&nbsp;
          </b>
          <br/>
          <input
            type = "range"
            value = {viewportScaleExponent}
            onChange = {function(e) {
              const newScaleExponent = Number.parseInt(e.target.value);
              setViewportScaleExponent(newScaleExponent);
              setViewportScale(viewportScalePowPrecalculation[newScaleExponent]);
            }}
            min = {VIEWPORT_SCALE_EXPONENT_MINIMUM}
            max = {VIEWPORT_SCALE_EXPONENT_MAXIMUM}
            disabled = {flattenedRnaComplexPropsLength === 0}
          />
          <InputWithValidator.Number
            value = {viewportScale}
            setValue = {function(newViewportScale : number) {
              setViewportScale(newViewportScale);
              // scale = SCALE_BASE ^ scaleExponent
              // log(scale) = log(SCALE_BASE ^ scaleExponent)
              // log(scale) = scaleExponent * log(SCALE_BASE)
              // log(scale) / log(SCALE_BASE) = scaleExponent
              if (newViewportScale > 0) {
                setViewportScaleExponent(Math.log(newViewportScale) * ONE_OVER_LOG_OF_SCALE_BASE);
              }
            }}
            disabledFlag = {flattenedRnaComplexPropsLength === 0}
          />
          <br/>
          <button
            onClick = {resetViewport}
            disabled = {flattenedRnaComplexPropsLength === 0}
          >
            Reset
          </button>
        </>,
        [Tab.EDIT] : <>
          {interactionConstraintSelectHtmlElement}
          {rightClickMenuOptionsMenu}
        </>,
        [Tab.FORMAT] : <>
          {interactionConstraintSelectHtmlElement}
          {rightClickMenuOptionsMenu}
        </>,
        [Tab.ANNOTATE] : <>
          {interactionConstraintSelectHtmlElement}
          {rightClickMenuOptionsMenu}
        </>,
        [Tab.SETTINGS] : <>
          <button
            onClick = {function() {
              (settingsFileUploadHtmlInputReference.current as HTMLInputElement).click();
            }}
          >
            Upload
          </button>
          <input
            style = {{
              display : "none"
            }}
            ref = {settingsFileUploadHtmlInputReference}
            type = "file"
            accept = ".json"
            onChange = {function(e) {
              let files = e.target.files;
              if (files === null || files.length === 0) {
                return;
              }
              let reader = new FileReader();
              reader.addEventListener("load", function(event) {
                // Read the content of the settings file.
                let settingsJson = JSON.parse((event.target as FileReader).result as string);
                let keys = Object.keys(settingsJson);
                let formatCheckPassedFlag = true;
                for (let key of keys) {
                  if (!(settings as Array<string>).includes(key) || (typeof settingsJson[key] !== settingsTypeMap[key as Setting])) {
                    alert("Parsing the uploaded settings file failed. The content of that file is unrecognized.");
                    formatCheckPassedFlag = false;
                    break;
                  }
                }
                if (formatCheckPassedFlag) {
                  let updatedSettings : Partial<SettingsRecord> = {};
                  for (let key of keys) {
                    updatedSettings[key as Setting] = settingsJson[key];
                  }
                  setSettingsRecord({
                    ...settingsRecord,
                    ...updatedSettings
                  });
                }
              });
              reader.readAsText(files[0] as File);
            }}
          />
          <button
            onClick = {function() {
              let settingsFileDownloadHtmlAnchor = settingsFileDownloadHtmlAnchorReference.current as HTMLAnchorElement;
              let settingsObject : Partial<SettingsRecord> = {};
              for (let key of settings) {
                settingsObject[key] = settingsRecord[key];
              }
              settingsFileDownloadHtmlAnchor.href = `data:text/plain;charset=utf-8,${encodeURIComponent(JSON.stringify(settingsObject))}`;
              settingsFileDownloadHtmlAnchor.click();
            }}
          >
            Download
          </button>
          <a
            ref = {settingsFileDownloadHtmlAnchorReference}
            style = {{
              display : "none"
            }}
            download = {`${XRNA_SETTINGS_FILE_NAME}.json`}
          />
          <br/>
          {settings.map(function(setting : Setting, index : number) {
            let input : JSX.Element = <></>;
            switch (settingsTypeMap[setting]) {
              case "boolean" : {
                input = <input
                  type = "checkbox"
                  checked = {settingsRecord[setting] as boolean}
                  onChange = {function() {
                    setSettingsRecord({
                      ...settingsRecord,
                      [setting] : !settingsRecord[setting]
                    });
                  }}
                />;
                break;
              }
              case "number" : {
                input = <InputWithValidator.Number
                  value = {settingsRecord[setting] as number}
                  setValue = {function(newValue : number) {
                    setSettingsRecord({
                      ...settingsRecord,
                      [setting] : newValue
                    });
                  }}
                />;
                break;
              }
              case "BasePairsEditorType" : {
                input = <BasePairsEditor.EditorTypeSelector.Component
                  editorType = {settingsRecord[setting] as BasePairsEditor.EditorType}
                  onChange = {function(newEditorType : BasePairsEditor.EditorType) {
                    setSettingsRecord({
                      ...settingsRecord,
                      [setting] : newEditorType
                    });
                  }}
                />;
                break;
              }
              default : {
                throw "Unhandled switch case.";
              }
            }
            return <Fragment
              key = {index}
            >
              <label
                title = {settingsLongDescriptionsMap[setting]}
              >
                {settingsShortDescriptionsMap[setting]}:&nbsp;
                {input}
              </label>
              <br/>
            </Fragment>;
          })}
        </>,
        [Tab.ABOUT] : <>
          <Collapsible.Component
            title = "Getting Started"
          >
            <ol
              style = {{
                margin : 0
              }}
            >
              <li>
                <label>
                  To begin working with XRNA, you need an input file:&nbsp;
                  <button
                    onClick = {function() {
                      const downloadAnchor = downloadSampleInputFileHtmlAnchorReference.current as HTMLAnchorElement;
                      downloadAnchor.href = `data:text/plain;charset=utf-8,${encodeURIComponent(SAMPLE_XRNA_FILE)}`;
                      downloadAnchor.click();
                    }}
                  >Download</button>
                  <a
                    style = {{
                      display : "none"
                    }}
                    ref = {downloadSampleInputFileHtmlAnchorReference}
                    download = "example.xrna"
                  />
                </label>
              </li>
              <li>
                Now that you have an input file, navigate to the "{Tab.INPUT_OUTPUT}" tab to upload it. It should take just a few seconds for the program to import its data.
                <br/>
              </li>
              <li>
                Once the data is imported, you can continue work in several different ways:
                <ul>
                  <li>Download its data to a different file</li>
                  <li>Edit its data (e.g. positions)</li>
                  <li>Add/remove/edit base base pairs</li>
                  <li>Add/remove annotations</li>
                  <li>Open a different input file.</li>
                </ul>
                For explanation of these, read the relevant section of the "{Tab.ABOUT}" tab.
              </li>
            </ol>
          </Collapsible.Component>
          {tabs.map(function(tabI) {
            let content = <></>;
            if (tabI !== Tab.ABOUT) {
              content = <Collapsible.Component
                title = {`The ${tabI} tab`}
              >
                {tabInstructionsRecord[tabI]}
              </Collapsible.Component>;
            }
            return <Fragment
              key = {tabI}
            >
              {content}
            </Fragment>;
          })}
          <Collapsible.Component
            title = "How to cite XRNA"
          >
            This version of XRNA (written in JavaScript) is currently unpublished. Once it becomes published, citation instructions will replace this text block.
          </Collapsible.Component>
          <Collapsible.Component
            title = "Contact us"
          >
            <a
              href = "https://www.linkedin.com/in/caedenmeade/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Message the developer
            </a>
            <br/>
            <a
              href = "https://github.com/LDWLab/XRNA-React/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              Report a bug
            </a>
          </Collapsible.Component>
        </>
      };
      return tabRenderRecord;
    },
    [
      outputFileName,
      outputFileExtension,
      downloadButtonErrorMessage,
      uploadInputFileUI,
      interactionConstraintSelectHtmlElement,
      viewportTranslateX,
      viewportTranslateY,
      viewportScaleExponent,
      viewportScale,
      flattenedRnaComplexPropsLength
    ]
  );
  const renderedTabs = useMemo(
    function() {
      const tab = tabReference.current as Tab;
      return <>
        {tabs.map(function(tabI : Tab) {
          const color = tab === tabI ? "#add8e6" : "#ccc";
          return <button
            style = {{
              border : `1px solid ${color}`,
              backgroundColor : color
            }}
            key = {tabI}
            onClick = {function() {
              setTab(tabI);
            }}
          >
            {tabI}
          </button>
        })}
        <br/>
        {tabs.map(function(tabI : Tab) {
          return <div
            key = {tabI}
            style = {{
              display : tab === tabI ? "block" : "none"
            }}
          >
            {tabRenderRecord[tabI]}
          </div>;
        })}
      </>;
    },
    [
      tab,
      tabRenderRecord
    ]
  );
  const onKeyDown = useMemo(
    function() {
      return function(event : React.KeyboardEvent<Element>) {
        switch (event.key) {
          case "s" : {
            if (event.ctrlKey) {
              event.preventDefault();
              if (downloadButtonErrorMessage == "") {
                (downloadOutputFileHtmlButtonReference.current as HTMLButtonElement).click();
              } else {
                alert(downloadButtonErrorMessage);
              }
            }
            break;
          }
          case "o" : {
            if (event.ctrlKey) {
              event.preventDefault();
              (uploadInputFileHtmlInputReference.current as HTMLInputElement).click();
            }
            break;
          }
          case "0" : {
            if (event.ctrlKey) {
              event.preventDefault();
              resetViewport();
            }
            break;
          }
        }
      }
    },
    [
      uploadInputFileHtmlInputReference.current,
      downloadOutputFileHtmlButtonReference.current,
      downloadButtonErrorMessage
    ]
  );
  const labelClassName = useMemo(
    function() {
      return tab === Tab.EDIT ? "label" : undefined;
    },
    [tab]
  );
  // Begin effects.
  useEffect(
    function() {
      window.onbeforeunload = function(e) {
        // Custom messages aren't allowed anymore.
        return "";
      };
      let documentUrl = document.URL;
      let index = documentUrl.indexOf('?');
      if (index != -1) {
        let params : Record<string, string> = {};
        let pairs = documentUrl.substring(index + 1, documentUrl.length).split('&');
        for (let i = 0; i < pairs.length; i++) {
          let nameVal = pairs[i].split('=');
          params[nameVal[0]] = nameVal[1];
        }
        let r2dt_key = "r2dt_job_id";
        if (r2dt_key in params) {
          parseJson(`https://www.ebi.ac.uk/Tools/services/rest/r2dt/result/r2dt-${params[r2dt_key]}/json`);
        }
        let url_key = "source_url";
        if (url_key in params) {
          parseJson(params[url_key]);
        }
      }
    },
    []
  );
  useEffect(
    function() {
      const current = mouseOverTextSvgTextElementReference.current;
      const newMouseOverTextDimensions = current === null ? {
        width : 0,
        height : 0
      } :  (current as SVGTextElement).getBBox();
      setMouseOverTextDimensions(newMouseOverTextDimensions);
    },
    [mouseOverText]
  );
  useEffect(
    function() {
      let rightClickPrompt = "";
      if (flattenedRnaComplexProps.length === 0) {
        const promptStart = "You must load a non-empty input file before attempting to ";
        switch (tab) {
          case Tab.EDIT : {
            rightClickPrompt = promptStart + "edit.";
            break;
          }
          case Tab.FORMAT : {
            rightClickPrompt = promptStart + "format.";
            break;
          }
          case Tab.ANNOTATE : {
            rightClickPrompt = promptStart + "annotate.";
            break;
          }
        }
      } else {
        const promptStart = "Right-click on a nucleotide to begin ";
        switch (tab) {
          case Tab.EDIT : {
            rightClickPrompt = promptStart + "editing.";
            break;
          }
          case Tab.FORMAT : {
            rightClickPrompt = promptStart + "formating.";
            break;
          }
          case Tab.ANNOTATE : {
            rightClickPrompt = promptStart + "annotating.";
            break;
          }
        }
      }
      setRightClickMenuContent(
        <>{rightClickPrompt}</>,
        {}
      );
    },
    [
      tab,
      interactionConstraint,
      rnaComplexProps
    ]
  );
  useEffect(
    function() {
      if (flattenedRnaComplexProps.length > 0) {
        let numSeconds = 2;
        setTimeout(
          function() {
            if (settingsRecord[Setting.RESET_VIEWPORT_AFTER_FILE_UPLOAD]) {
              resetViewport();
            }
            setSceneState(SceneState.DATA_IS_LOADED);
          },
          numSeconds * 1000
        );
      } else {
        setSceneState(SceneState.NO_DATA);
      }
    },
    [flattenedRnaComplexProps]
  );
  useEffect(
    function() {
      const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
      const basePairKeysToRerender : BasePairKeysToRerender = {};
      function pushNucleotideKeysToRerender(
        nucleotideKeysToRerenderPerRnaComplex : NucleotideKeysToRerenderPerRnaComplex,
        keys : RnaComplex.BasePairKeys
      ) {
        const {
          rnaMoleculeName,
          nucleotideIndex
        } = keys;
        if (!(rnaMoleculeName in nucleotideKeysToRerenderPerRnaComplex)) {
          nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
        }
        nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName].push(nucleotideIndex);
      }
      for (const [rnaComplexIndexAsString, basePairKeysToEditPerRnaComplex] of Object.entries(basePairKeysToEdit)) {
        const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
        nucleotideKeysToRerender[rnaComplexIndex] = {};
        basePairKeysToRerender[rnaComplexIndex] = [];
        const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
        const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];

        for (const basePairDatumToAdd of basePairKeysToEditPerRnaComplex.add) {
          pushNucleotideKeysToRerender(
            nucleotideKeysToRerenderPerRnaComplex,
            basePairDatumToAdd
          );
          basePairKeysToRerenderPerRnaComplex.push(basePairDatumToAdd);
        }
        for (const basePairDatumToDelete of basePairKeysToEditPerRnaComplex.delete) {
          pushNucleotideKeysToRerender(
            nucleotideKeysToRerenderPerRnaComplex,
            basePairDatumToDelete
          );
          basePairKeysToRerenderPerRnaComplex.push(basePairDatumToDelete);
        }
        
        for (let nucleotideKeysToRerenderPerRnaMolecule of Object.values(nucleotideKeysToRerenderPerRnaComplex)) {
          nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
        }
        basePairKeysToRerenderPerRnaComplex.sort(compareBasePairKeys);
      }
      setBasePairKeysToRerender(basePairKeysToRerender);
    },
    [basePairKeysToEdit]
  );
  useEffect(
    function() {
      let downloadButtonErrorMessage = "";
      if (isEmpty(rnaComplexProps)) {
        downloadButtonErrorMessage = "Import data to enable downloads.";
      } else if (outputFileName === "") {
        downloadButtonErrorMessage = "Provide an output-file name to enable downloads.";
      } else if (outputFileExtension === undefined) {
        downloadButtonErrorMessage = "Provide an output-file extension to enable downloads.";
      }
      setDownloadButtonErrorMessage(downloadButtonErrorMessage);
    },
    [
      rnaComplexProps,
      outputFileName,
      outputFileExtension
    ]
  );
  useEffect(
    function() {
      setResetOrientationDataTrigger(!resetOrientationDataTrigger)
    },
    [rightClickMenuContent]
  );
  useEffect(
    function() {
      setToolsDivHeightAttribute(toolsDivResizeDetector.height);

      setTimeout(
        function() {
          setToolsDivHeightAttribute("auto");
        },
        100
      );
    },
    [rightClickMenuContent]
  );
  return <Context.Label.ClassName.Provider
    value = {labelClassName}
  >
    <Context.BasePair.AverageDistances.Provider
      value = {basePairAverageDistances}
    >
      <Context.BasePair.UpdateAverageDistances.Provider
        value = {updateBasePairAverageDistances}
      >
        <Context.Label.Content.DefaultStyles.Provider
          value = {labelContentDefaultStyles}
        >
          <Context.Label.Content.UpdateDefaultStyle.Provider
            value = {updateLabelContentDefaultStyles}
          >
            <Context.App.InteractionConstraintOptions.Provider
              value = {interactionConstraintOptions}
            >
              <Context.App.UpdateInteractionConstraintOptions.Provider
                value = {updateInteractionConstraintOptions}
              >
                <Context.Nucleotide.SetKeysToRerender.Provider
                  value = {setNucleotideKeysToRerender}
                >
                  <Context.BasePair.SetKeysToRerender.Provider
                    value = {setBasePairKeysToRerender}
                  >
                    <Context.App.Settings.Provider
                      value = {settingsRecord}
                    >
                      <Context.App.UpdateRnaMoleculeNameHelper.Provider
                        value = {updateRnaMoleculeNameHelper}
                      >
                        <Context.BasePair.SetKeysToEdit.Provider
                          value = {setBasePairKeysToEdit}
                        >
                          <div
                            id = "header"
                            onKeyDown = {onKeyDown}
                            ref = {parentDivResizeDetector.ref}
                            style = {{
                              position : "absolute",
                              display : "block",
                              width : "100%",
                              height : "100%",
                              overflow : "hidden"
                            }}
                          >
                            {/* Tools div */}
                            <div
                              tabIndex = {0}
                              ref = {toolsDivResizeDetector.ref}
                              style = {{
                                position : "absolute",
                                width : "100%",
                                height : toolsDivHeightAttribute,
                                resize : "vertical",
                                overflow : "hidden",
                                display : "block",
                                borderBottom : "1px solid black"
                              }}
                            >
                              {/* Left tools div */}
                              <div
                                style = {{
                                  width : "50%",
                                  height : "auto",
                                  display : "inline-block",
                                  overflowY : "auto",
                                  verticalAlign : "top"
                                }}
                              >
                                {renderedTabs}
                                {sceneState === SceneState.NO_DATA && <>
                                  <b
                                    style = {{
                                      color : "red"
                                    }}
                                  >
                                    No data to display.
                                  </b>
                                </>}
                              </div>
                              {/* Right tools div */}
                              <div
                                style = {{
                                  width : "50%",
                                  height : "auto",
                                  display : "inline-block",
                                  overflowY : "auto",
                                  verticalAlign : "top"
                                }}
                              >
                                <Context.App.ComplexDocumentName.Provider
                                  value = {complexDocumentName}
                                >
                                  <Context.App.SetComplexDocumentName.Provider
                                    value = {setComplexDocumentName}
                                  >
                                    <Context.OrientationEditor.ResetDataTrigger.Provider
                                      value = {resetOrientationDataTrigger}
                                    >
                                      {rightClickMenuContent}
                                    </Context.OrientationEditor.ResetDataTrigger.Provider>
                                  </Context.App.SetComplexDocumentName.Provider>
                                </Context.App.ComplexDocumentName.Provider>
                              </div>
                              {sceneState === SceneState.DATA_LOADING_FAILED && <>
                                <br/>
                                <b
                                  style = {{
                                    color : "red",
                                    display : dataLoadingFailedErrorMessage === "" ? "none" : "block"
                                  }}
                                >
                                  Parsing the provided input file failed.&nbsp;{dataLoadingFailedErrorMessage ? dataLoadingFailedErrorMessage : "Try another file, or report a bug."}
                                </b>
                                &nbsp;
                                <a
                                  href = "https://github.com/LDWLab/XRNA-React/issues"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                >
                                  Report a bug
                                </a>
                              </>}
                            </div>
                            <svg
                              id = {SVG_ELEMENT_HTML_ID}
                              style = {{
                                top : (toolsDivResizeDetector.height ?? 0) + DIV_BUFFER_HEIGHT,
                                left : 0,
                                position : "absolute"
                              }}
                              xmlns = "http://www.w3.org/2000/svg"
                              viewBox = {`0 0 ${parentDivResizeDetector.width ?? 0} ${svgHeight}`}
                              tabIndex = {1}
                              onMouseDown = {onMouseDown}
                              onMouseMove = {onMouseMove}
                              onMouseUp = {onMouseUp}
                              onMouseLeave = {function() {
                                setDragListener(
                                  null,
                                  {}
                                );
                              }}
                              onContextMenu = {function(event) {
                                event.preventDefault();
                              }}
                              onWheel = {onWheel}
                              stroke = {tab in strokesPerTab ? strokesPerTab[tab] : "none"}
                            >
                              <rect
                                width = "100%"
                                height = "100%"
                                fill = "white"
                                stroke = "none"
                                onMouseDown = {function(e) {
                                  switch (e.button) {
                                    case MouseButtonIndices.Left : {
                                      setDragListener(
                                        viewportDragListener,
                                        {}
                                      );
                                      break;
                                    }
                                  }
                                }}
                              />
                              <g
                                style = {{
                                  visibility : sceneState === SceneState.DATA_IS_LOADED ? "visible" : "hidden"
                                }}
                                transform = {totalScale.asTransform + " scale(1, -1) " + transformTranslate}
                              >
                                {debugVisualElements}
                                {renderedRnaComplexes}
                              </g>
                              <g
                                id = {MOUSE_OVER_TEXT_HTML_ID}
                              >
                                <rect
                                  x = {0}
                                  y = {svgHeight - mouseOverTextDimensions.height - 2}
                                  width = {mouseOverTextDimensions.width}
                                  height = {mouseOverTextDimensions.height}
                                  fill = "black"
                                  stroke = "none"
                                />
                                <text
                                  fill = "white"
                                  stroke = "none"
                                  x = {0}
                                  y = {svgHeight - mouseOverTextDimensions.height * 0.25 - 2}
                                  ref = {mouseOverTextSvgTextElementReference}
                                  fontFamily = "dialog"
                                  fontSize = {MOUSE_OVER_TEXT_FONT_SIZE}
                                >
                                  {mouseOverText}
                                </text>
                              </g>
                            </svg>
                            {sceneState === SceneState.DATA_IS_LOADING && <img
                              style = {{
                                top : ((toolsDivResizeDetector.height ?? 0) + (parentDivResizeDetector.height ?? 0)) * 0.5 - 100,
                                left : (parentDivResizeDetector.width ?? 0) * 0.5 - 50,
                                position : "absolute"
                              }}
                              src = {loadingGif}
                              alt = "Loading..."
                            />}
                            <div
                              style = {{
                                position : "absolute",
                                visibility : "hidden",
                                height : "auto",
                                width : "auto",
                                whiteSpace : "nowrap"
                              }}
                              id = {TEST_SPACE_ID}
                            />
                          </div>
                        </Context.BasePair.SetKeysToEdit.Provider>
                      </Context.App.UpdateRnaMoleculeNameHelper.Provider>
                    </Context.App.Settings.Provider>
                  </Context.BasePair.SetKeysToRerender.Provider>
                </Context.Nucleotide.SetKeysToRerender.Provider>
              </Context.App.UpdateInteractionConstraintOptions.Provider>
            </Context.App.InteractionConstraintOptions.Provider>
          </Context.Label.Content.UpdateDefaultStyle.Provider>
        </Context.Label.Content.DefaultStyles.Provider>
      </Context.BasePair.UpdateAverageDistances.Provider>
    </Context.BasePair.AverageDistances.Provider>
  </Context.Label.ClassName.Provider>;
}

export default App;
