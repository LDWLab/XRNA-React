import React, { createElement, createRef, Fragment, FunctionComponent, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_TAB, Tab, tabs } from './app_data/Tab';
import { add, scaleDown, subtract, Vector2D } from './data_structures/Vector2D';
import { useResizeDetector } from 'react-resize-detector';
import { compareBasePairKeys, RnaComplex } from './components/app_specific/RnaComplex';
import { OutputFileExtension, outputFileExtensions, outputFileWritersMap as outputFileWritersMapRelativeJsonCoordinates, r2dtLegacyOutputFileWritersMap as outputFileWritersMapAbsoluteJsonCoordinates } from './io/OutputUI';
import { SCALE_BASE, ONE_OVER_LOG_OF_SCALE_BASE, MouseButtonIndices, DEFAULT_STROKE_WIDTH } from './utils/Constants';
import { inputFileExtensions, InputFileExtension, inputFileReadersRecord, r2dtLegacyInputFileReadersRecord, defaultInvertYAxisFlagRecord } from './io/InputUI';
import { DEFAULT_SETTINGS, isSetting, Setting, settings, settingsLongDescriptionsMap, SettingsRecord, settingsShortDescriptionsMap, settingsTypeMap } from './ui/Setting';
import InputWithValidator from './components/generic/InputWithValidator';
import { BasePairKeysToRerender, Context, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaComplex } from './context/Context';
import { isEmpty, sign, subtractNumbers } from './utils/Utils';
import { Nucleotide } from './components/app_specific/Nucleotide';
import { LabelContent } from './components/app_specific/LabelContent';
import { LabelLine } from './components/app_specific/LabelLine';
import { InteractionConstraint } from './ui/InteractionConstraint/InteractionConstraints';
import { BasePairsEditor } from './components/app_specific/editors/BasePairsEditor';
import { Collapsible } from './components/generic/Collapsible';
import { SAMPLE_XRNA_FILE } from './utils/sampleXrnaFile';
import { fileExtensionDescriptions } from './io/FileExtension';
import loadingGif from './images/loading.svg';
import { SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME, SVG_PROPERTY_XRNA_TYPE, SvgPropertyXrnaType } from './io/SvgInputFileHandler';
import { areEqual, BLACK } from './data_structures/Color';
import { RnaMolecule } from './components/app_specific/RnaMolecule';
import { LabelEditMenu } from './components/app_specific/menus/edit_menus/LabelEditMenu';
import BasePair from './components/app_specific/BasePair';

const VIEWPORT_SCALE_EXPONENT_MINIMUM = -50;
const VIEWPORT_SCALE_EXPONENT_MAXIMUM = 50;
const viewportScalePowPrecalculation : Record<number, number> = {};
for (let viewportScaleExponent = VIEWPORT_SCALE_EXPONENT_MINIMUM; viewportScaleExponent <= VIEWPORT_SCALE_EXPONENT_MAXIMUM; viewportScaleExponent++) {
  viewportScalePowPrecalculation[viewportScaleExponent] = Math.pow(SCALE_BASE, viewportScaleExponent);
}

export const PARENT_DIV_HTML_ID = "parent_div";
export const SVG_ELEMENT_HTML_ID = "viewport";
export const TEST_SPACE_ID = "testSpace";
export const MOUSE_OVER_TEXT_HTML_ID = "mouse_over_text_group";
export const VIEWPORT_SCALE_GROUP_HTML_ID = "viewport_scale_group";
export const VIEWPORT_TRANSLATE_GROUP_HTML_ID = "viewport_translate_group";

export const LABEL_CLASS_NAME = "label";
export const NO_STROKE_CLASS_NAME = "noStroke";

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
const DIV_BUFFER_DIMENSION = 2;
const MOUSE_OVER_TEXT_FONT_SIZE = 20;
const UPLOAD_BUTTON_TEXT = "Upload";
const DOWNLOAD_ROW_TEXT = "Output File";
const DOWNLOAD_BUTTON_TEXT = "Download";
const TRANSLATION_TEXT = "Translation";
const SCALE_TEXT = "Scale";
const RESET_TEXT = "Reset";
const INTERACTION_CONSTRAINT_TEXT = "Constraint";
const XRNA_SETTINGS_FILE_NAME = "xrna_settings";
const strokesPerTab : Record<InteractionConstraint.SupportedTab, string> = {
  [Tab.EDIT] : "red",
  [Tab.FORMAT] : "blue",
  [Tab.ANNOTATE] : "rgb(0,110,51)"
};

export namespace App {
  export type Props = {
    r2dtLegacyVersionFlag : boolean
  };

  export function Component(props : Props) {
    const {
      r2dtLegacyVersionFlag
    } = props;
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
      dataSpaceOriginOfDrag,
      setDataSpaceOriginOfDrag
    ] = useState<Vector2D | undefined>(undefined);
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
    type ToolsDivWidthOrHeightAttribute = "auto" | number | undefined;
    const [
      toolsDivWidthAttribute,
      setToolsDivWidthAttribute
    ] = useState<ToolsDivWidthOrHeightAttribute>("auto");
    const [
      topToolsDivHeightAttribute,
      setTopToolsDivHeightAttribute
    ] = useState<ToolsDivWidthOrHeightAttribute>("auto");
    const [
      listenForResizeFlag,
      setListenForResizeFlag
    ] = useState(false);
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
    const topToolsDivResizeDetector = useResizeDetector();
    const rightClickMenuContentResizeDetector = useResizeDetector();
    const userDrivenResizeDetector = useResizeDetector();
    const errorMessageResizeDetector = useResizeDetector();
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
    const toolsDivResizeDetectorWidthReference = useRef<number | undefined>();
    toolsDivResizeDetectorWidthReference.current = toolsDivResizeDetector.width;
    type TotalScale = {
      positiveScale : number,
      negativeScale : number,
      asTransform : string[]
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
    const transformTranslate0Reference = useRef<{ asVector : Vector2D, asString : string }>();
    const transformTranslate1Reference = useRef<{ asVector : Vector2D, asString : string }>();
    const dataSpaceOriginOfDragReference = useRef<Vector2D>();
    dataSpaceOriginOfDragReference.current = dataSpaceOriginOfDrag;
    const flattenedRnaComplexPropsReference = useRef<Array<[string, RnaComplex.ExternalProps]>>();
    const toolsDivWidthAttributeReference = useRef<ToolsDivWidthOrHeightAttribute>();
    toolsDivWidthAttributeReference.current = toolsDivWidthAttribute;
    const inputFileNameAndExtensionReference = useRef<string>();
    
    const outputFileWritersMap = r2dtLegacyVersionFlag ? outputFileWritersMapAbsoluteJsonCoordinates : outputFileWritersMapRelativeJsonCoordinates;
    // Begin memo data.
    const flattenedRnaComplexProps = useMemo(
      function() {
        const flattenedRnaComplexProps = Object.entries(rnaComplexProps);
        setFlattenedRnaComplexPropsLength(flattenedRnaComplexProps.length);
        flattenedRnaComplexPropsReference.current = flattenedRnaComplexProps;
        return flattenedRnaComplexProps;
      },
      [rnaComplexProps]
    );
    const svgWidth = useMemo(
      function() {
        return Math.max((parentDivResizeDetector.width ?? 0) - (toolsDivResizeDetector.width ?? 0), 0);
      },
      [
        parentDivResizeDetector.width,
        toolsDivResizeDetector.width
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
          svgWidth * sceneDimensionsReciprocals.width,
          (parentDivResizeDetector.height ?? 0) * sceneDimensionsReciprocals.height
        );
      },
      [
        parentDivResizeDetector.height,
        svgWidth,
        sceneDimensionsReciprocals
      ]
    );
    sceneBoundsScaleMinReference.current = sceneBoundsScaleMin;
    const transformTranslate0 = useMemo(
      function() {
        const asVector = {
          x : -sceneBounds.x,
          y : -(sceneBounds.y + sceneBounds.height)
        };
        const returnValue = {
          asVector,
          asString : `translate(${asVector.x}, ${asVector.y})`
        };
        transformTranslate0Reference.current = returnValue;
        return returnValue;
      },
      [sceneBounds]
    );
    const transformTranslate1 = useMemo(
      function() {
        const asVector = {
          x : viewportTranslateX,
          y : viewportTranslateY
        };
        const returnValue = {
          asVector,
          asString : `translate(${asVector.x}, ${asVector.y})`
        };
        transformTranslate1Reference.current = returnValue;
        return returnValue;
      },
      [
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
          asTransform : [
            `scale(${sceneBoundsScaleMin})`,
            `scale(${viewportScale})`
          ]
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
        return function(
          fullKeys : FullKeys,
          interactionConstraint = interactionConstraintReference.current
        ) {
          switch (tabReference.current) {
            case Tab.EDIT : {
              if (interactionConstraint === undefined || !InteractionConstraint.isEnum(interactionConstraint)) {
                alert("Select a constraint first!");
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
              }
              break;
            }
          }
        }
      },
      []
    );
    const nucleotideOnMouseDownRightClickHelper = useMemo(
      function() {
        return function(
          fullKeys : FullKeys,
          interactionConstraint : InteractionConstraint.Enum,
          tab : InteractionConstraint.SupportedTab
        ) {
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
                  alert("Select a constraint first!");
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
                  alert("Select a constraint first!");
                  return;
                }
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
      _setRightClickMenuContent(<div
        style = {{
          width : "auto",
          display : "inline-block"
        }}
        ref = {rightClickMenuContentResizeDetector.ref}
      >
        {rightClickMenuContent}
      </div>);
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
            const parsedInput = (r2dtLegacyVersionFlag ? r2dtLegacyInputFileReadersRecord : inputFileReadersRecord)[inputFileExtension](inputFileContent);
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
      [r2dtLegacyVersionFlag]
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
              resetRightClickMenuContent();
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
              Select a constraint.
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
            <br/>
            <Collapsible.Component
              title = "How to upload input files"
            >
              <ol
                style = {{
                  margin : 0
                }}
              >
                <li>
                  Click the "{UPLOAD_BUTTON_TEXT}" button (Ctrl + O).
                </li>
                <li>
                  Select a file with one of the following supported input-file extensions:
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
                  Select one of the following supported output-file extensions:
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
                  Click the "{DOWNLOAD_BUTTON_TEXT}" button (Ctrl + S)
                </li>
              </ol>
            </Collapsible.Component>
            <Collapsible.Component
              title = "Demo"
            >
              <iframe
                src = "https://youtube.com/embed/y4h2paLWHkw?vq=hd1080"
                allowFullScreen = {true}
                width = {960}
                height = {540}
              />
            </Collapsible.Component>
          </>,
          [Tab.VIEWPORT] : <>
            Here, you can manipulate the viewport with precision.
            <br/>
            To clarify, the viewport is the main, right-hand component of XRNA. Within it, interactive 2D RNA diagrams are displayed.
            <br/>
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
              "{SCALE_TEXT}" refers to the "in-and-out zoom" of the entire viewport. It is synchronized with the mousewheel within the viewport.
              <ul
                style = {{
                  margin : 0
                }}
              >
                <li>
                  Scrolling up with the mouse wheel increases zoom; this means zooming in.
                </li>
                <li>
                  Scrolling down does the opposite.
                </li>
              </ul>
            </Collapsible.Component>
            <Collapsible.Component
              title = {RESET_TEXT}
            >
              In one step, the "{RESET_TEXT}" button (Ctrl + 0) allows the user to reset all properties of the viewport:
              <ul
                style = {{
                  margin : 0
                }}
              >
                <li>translate</li>
                <li>scale</li>
              </ul>
              This places all elements of the scene within view of the user.
            </Collapsible.Component>
            <Collapsible.Component
              title = "Demo"
            >
              <iframe
                src = "https://youtube.com/embed/MIs1GuBH-gU"
                allowFullScreen = {true}
                width = {960}
                height = {540}
              />
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
                    Select a constraint. Then, left-click on a nucleotide. Drag it to change relevant nucleotide-position data, according to the behavior of the constraint.
                  </li>
                  <li>
                    Middle-mouse-click and drag to select one or more nucleotide(s) or label(s). This will populate a menu which will allow you to precisely edit data, according to the behavior of an automatically determined constraint.
                  </li>
                  <li>
                    Select a constraint. Then, right-click on a nucleotide. This will populate a menu which will allow you to precisely edit data, according to the behavior of the constraint.
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
                      Annotations (i.e. labels) may be edited in the same exact way as nucleotides / nucleotide regions (described above).
                    </li>
                    <li>
                      Annotations are not present in some input files, but they can be added within the "{Tab.ANNOTATE}" tab.
                    </li>
                  </ul>
                </Collapsible.Component>
              </li>
            </ol>
            <Collapsible.Component
              title = "Demo"
            >
              <iframe
                src = "https://youtube.com/embed/tHl9gmLTn7M"
                allowFullScreen = {true}
                width = {960}
                height = {540}
              />
            </Collapsible.Component>
          </>,
          [Tab.FORMAT] : <>
            Here, you can add, delete, or edit base pairs.
            <ol
              style = {{
                margin : 0
              }}
            >
              <li>
                Navigate within the viewport to the portion of the scene you plan to format.
              </li>
              <li>
                Do one of the following:
                <ul>
                  <li>
                    Middle-mouse-click and drag to select one or more nucleotide(s). This will populate a menu which will allow you to precisely format data, according to the behavior of an automatically determined constraint.
                  </li>
                  <li>
                    Select a constraint. Then, right-click on a nucleotide. This will populate a menu which will allow you to format base-pair data, according to the behavior of the constraint
                  </li>
                </ul>
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
            <Collapsible.Component
              title = "Demo"
            >
              <iframe
                src = "https://youtube.com/embed/2lVp4qd5kz8"
                allowFullScreen = {true}
                width = {960}
                height = {540}
              />
            </Collapsible.Component>
          </>,
          [Tab.ANNOTATE] : <>
            Here, you can add, delete, or edit annotations (label lines or label content).
            <br/>
            <ol
              style = {{
                margin : 0
              }}
            >
              <li>
                Navigate within the viewport to the portion of the scene you plan to annotate.
              </li>
              <li>
                Do one of the following:
                <ul>
                  <li>
                    Select a constraint. Then, right-click on a nucleotide. This will populate a menu which will allow you to annotate nucleotides, according to the behavior of the constraint
                  </li>
                  <li>
                    Middle-mouse-click and drag to select one or more nucleotide(s). This will populate a menu which will allow you to annotate nucleotides, according to the behavior an automatically determined constraint
                  </li>
                </ul>
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
            <Collapsible.Component
              title = "Demo"
            >
              <iframe
                src = "https://youtube.com/embed/4C5YhlsAbWU"
                allowFullScreen = {true}
                width = {960}
                height = {540}
              />
            </Collapsible.Component>
          </>,
          [Tab.SETTINGS] : <>
            Here, you can change settings which regulate how XRNA.js behaves.
            <br/>
            Support for saving your settings is implemented by the pair of upload/download buttons. 
            <br/>
            Store the "{XRNA_SETTINGS_FILE_NAME}" file somewhere you will remember for later use.
            <Collapsible.Component
              title = "Demo"
            >
              <iframe
                src = "https://youtube.com/embed/K9woUfHEBmg"
                allowFullScreen = {true}
                width = {960}
                height = {540}
              />
            </Collapsible.Component>
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
          
          const mouseCoordinates = {
            x : e.clientX,
            y : e.clientY
          };
  
          const dragListener = dragListenerReference.current as DragListener | null;
          if (dragListener !== null) {
            const originOfDrag = originOfDragReference.current as Vector2D;
            const dragCache = dragCacheReference.current as Vector2D;
            const viewportScale = viewportScaleReference.current as number;
            const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
            const repositionAnnotationsFlag = repositionAnnotationsFlagReference.current as boolean;
            const triggerRightClickMenuFlag = triggerRightClickMenuFlagReference.current as boolean;
            const resetOrientationDataTrigger = resetOrientationDataTriggerReference.current as boolean;
            const translation = subtract(
              mouseCoordinates,
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
  
          const dataSpaceOriginOfDrag = dataSpaceOriginOfDragReference.current;
          const tab = tabReference.current as Tab;
          if (dataSpaceOriginOfDrag !== undefined && InteractionConstraint.isSupportedTab(tab)) {
            const mouseDataSpaceCoordinates = transformIntoDataSpace(mouseCoordinates);
            const xCoordinates = [
              dataSpaceOriginOfDrag.x,
              mouseDataSpaceCoordinates.x
            ].sort(subtractNumbers);
            const yCoordinates = [
              dataSpaceOriginOfDrag.y,
              mouseDataSpaceCoordinates.y
            ].sort(subtractNumbers);
            const minX = xCoordinates[0];
            const minY = yCoordinates[0]
            setDebugVisualElements([<rect
              key = {0}
              x = {minX}
              y = {minY}
              width = {xCoordinates[1] - minX}
              height = {yCoordinates[1] - minY}
              fill = "none"
              stroke = {strokesPerTab[tab]}
              strokeWidth = {DEFAULT_STROKE_WIDTH}
            />]);
          }
          e.preventDefault();
        }
      },
      []
    );
    const onMouseDown = useMemo(
      function() {
        return function(e : React.MouseEvent<SVGSVGElement, MouseEvent>) {
          const clickedOnCoordinates = {
            x : e.clientX,
            y : e.clientY
          };
          switch (e.button) {
            case MouseButtonIndices.Left : {
              setOriginOfDrag(clickedOnCoordinates);
              break;
            }
            case MouseButtonIndices.Middle : {
              // setMiddleMouseButtonDownFlag(true);
              const clickedOnCoordinatesInDataSpace = transformIntoDataSpace(clickedOnCoordinates);
              setDataSpaceOriginOfDrag(clickedOnCoordinatesInDataSpace);
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
          const dataSpaceOriginOfDrag = dataSpaceOriginOfDragReference.current;
          const tab = tabReference.current as Tab;
          if (dataSpaceOriginOfDrag !== undefined && InteractionConstraint.isSupportedTab(tab)) {
            setDebugVisualElements([]);
            const mouseCoordinates = {
              x : e.clientX,
              y : e.clientY
            };
            const mouseDataSpaceCoordinates = transformIntoDataSpace(mouseCoordinates);
            const xCoordinates = [
              dataSpaceOriginOfDrag.x,
              mouseDataSpaceCoordinates.x
            ].sort(subtractNumbers);
            const yCoordinates = [
              dataSpaceOriginOfDrag.y,
              mouseDataSpaceCoordinates.y
            ].sort(subtractNumbers);
            const minX = xCoordinates[0];
            const minY = yCoordinates[0];
            const maxX = xCoordinates[1];
            const maxY = yCoordinates[1];
            const fullKeysOfCapturedNucleotides = new Array<FullKeys>();
            const labelsEncounteredKeysRecord : Record<RnaMoleculeKey, Set<NucleotideKey>> = {};
            const fullKeysOfCapturedLabels = new Array<FullKeys>();
            const rnaComplexProps = rnaComplexPropsReference.current as RnaComplexProps;
            type Keys = { rnaMoleculeName : RnaMoleculeKey, nucleotideIndex : NucleotideKey };
            function validateLabel(
              {
                rnaMoleculeName,
                nucleotideIndex
              } : Keys,
              {
                x,
                y
              } : Vector2D
            ) {
              if (
                x < minX ||
                x > maxX ||
                y < minY ||
                y > maxY
              ) {
                return false;
              }
  
              if (!(rnaMoleculeName in labelsEncounteredKeysRecord)) {
                labelsEncounteredKeysRecord[rnaMoleculeName] = new Set<NucleotideKey>();
              }
              const labelsEncounteredKeysRecordPerRnaMolecule = labelsEncounteredKeysRecord[rnaMoleculeName];
              if (labelsEncounteredKeysRecordPerRnaMolecule.has(nucleotideIndex)) {
                return false;
              }
              labelsEncounteredKeysRecordPerRnaMolecule.add(nucleotideIndex);
              return true;
            }
            for (const [rnaComplexIndexAsString, { rnaMoleculeProps }] of Object.entries(rnaComplexProps)) {
              const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
              for (const [rnaMoleculeName, { nucleotideProps }] of Object.entries(rnaMoleculeProps)) {
                for (const [nucleotideIndexAsString, singularNucleotideProps] of Object.entries(nucleotideProps)) {
                  const { labelContentProps, labelLineProps } = singularNucleotideProps;
                  const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
  
                  const fullKeys = {
                    rnaComplexIndex,
                    rnaMoleculeName,
                    nucleotideIndex
                  };
  
                  if (validateLabel(
                    fullKeys,
                    singularNucleotideProps
                  )) {
                    fullKeysOfCapturedNucleotides.push(fullKeys);
                  }
                  if (labelContentProps !== undefined) {
                    const absolutePosition = add(
                      singularNucleotideProps,
                      labelContentProps
                    );
                    if (validateLabel(
                      fullKeys,
                      absolutePosition
                    )) {
                      fullKeysOfCapturedLabels.push(fullKeys);
                    }
                  }
                  if (labelLineProps !== undefined) {
                    for (const point of labelLineProps.points) {
                      const absolutePosition = add(
                        singularNucleotideProps,
                        point
                      );
                      if (validateLabel(
                        fullKeys,
                        absolutePosition
                      )) {
                        fullKeysOfCapturedLabels.push(fullKeys);
                      }
                    }
                  }
                }
              }
            }
            function sort(
              fullKeys0 : FullKeys,
              fullKeys1 : FullKeys
            ) {
              return (
                (fullKeys0.rnaComplexIndex - fullKeys1.rnaComplexIndex) ||
                (fullKeys0.rnaMoleculeName.localeCompare(fullKeys1.rnaMoleculeName)) ||
                (fullKeys0.nucleotideIndex - fullKeys1.nucleotideIndex)
              );
            }
            type FullKeysAndInteractionConstraint = { fullKeys : FullKeys, interactionConstraint : InteractionConstraint.Enum } | undefined;
            function getInteractionConstraintAndFullKeys(fullKeysArray : Array<FullKeys>) : FullKeysAndInteractionConstraint {
              function handleMultipleFullKeys() : FullKeysAndInteractionConstraint {
                fullKeysArray.sort(sort);
  
                const minimumFullKeys = fullKeysArray[0];
                const maximumFullKeys = fullKeysArray[fullKeysArray.length - 1];
  
                let singleRnaComplexFlag = true;
                let singleRnaMoleculeFlag = true;
                let dualRnaMoleculesFlag = false;
                let otherRnaMoleculeName : string | undefined = undefined;
                for (let i = 1; i < fullKeysArray.length; i++) {
                  const {
                    rnaComplexIndex,
                    rnaMoleculeName,
                  } = fullKeysArray[i];
                  if (rnaComplexIndex !== minimumFullKeys.rnaComplexIndex) {
                    singleRnaComplexFlag = false;
                  }
                  if (rnaMoleculeName !== minimumFullKeys.rnaMoleculeName) {
                    singleRnaMoleculeFlag = false;
                    if (otherRnaMoleculeName === undefined) {
                      otherRnaMoleculeName = rnaMoleculeName;
                      dualRnaMoleculesFlag = true;
                    } else if (rnaMoleculeName !== otherRnaMoleculeName) {
                      dualRnaMoleculesFlag = false;
                    }
                  }
                }
  
                if (!singleRnaComplexFlag) {
                  singleRnaMoleculeFlag = false;
                }
  
                let allNucleotidesAreBasePairedFlag = true;
                let noNucleotidesAreBasePairedFlag = true;
                const mappedBasePairInformationArray = fullKeysArray.map(function({
                  rnaComplexIndex,
                  rnaMoleculeName,
                  nucleotideIndex
                }) {
                  const { basePairs } = rnaComplexProps[rnaComplexIndex];
                  if (rnaMoleculeName in basePairs) {
                    const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
                    if (nucleotideIndex in basePairsPerRnaMolecule) {
                      noNucleotidesAreBasePairedFlag = false;
                      return basePairsPerRnaMolecule[nucleotideIndex];
                    }
                  }
                  allNucleotidesAreBasePairedFlag = false;
                  return undefined;
                });
  
                function isSubdomain() {
                  // BEGIN DETECTING InteractionConstraint.Enum.RNA_SUB_DOMAIN
                  if (!singleRnaMoleculeFlag) {
                    return false;
                  }
                  const mappedBasePair0 = mappedBasePairInformationArray[0];
                  if (
                    mappedBasePair0 === undefined ||
                    mappedBasePair0.rnaMoleculeName !== maximumFullKeys.rnaMoleculeName ||
                    mappedBasePair0.nucleotideIndex !== maximumFullKeys.nucleotideIndex
                  ) {
                    return false;
                  }
                  const { basePairs } = rnaComplexProps[minimumFullKeys.rnaComplexIndex];
                  const basePairsPerRnaMolecule = basePairs[minimumFullKeys.rnaMoleculeName];
                  for (let nucleotideIndex = minimumFullKeys.nucleotideIndex + 1; nucleotideIndex < maximumFullKeys.nucleotideIndex; nucleotideIndex++) {
                    const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
                    if (
                      mappedBasePairInformation !== undefined &&
                      (
                        mappedBasePairInformation.rnaMoleculeName !== minimumFullKeys.rnaMoleculeName ||
                        mappedBasePairInformation.nucleotideIndex < minimumFullKeys.nucleotideIndex || 
                        mappedBasePairInformation.nucleotideIndex > maximumFullKeys.nucleotideIndex
                      )
                    ) {
                      return false;
                    }
                  }
                  return true;
                  // FINISH DETECTING InteractionConstraint.Enum.RNA_SUB_DOMAIN
                }
  
                function isStackedHelix() {
                  // BEGIN DETECTING InteractionConstraint.Enum.RNA_STACKED_HELIX
                  if (
                    !singleRnaMoleculeFlag &&
                    !dualRnaMoleculesFlag
                  ) {
                    return false;
                  }
                  const { basePairs } = rnaComplexProps[minimumFullKeys.rnaComplexIndex];
                  const rnaMoleculeNames = new Set<string>();
                  for (let i = 0; i < fullKeysArray.length; i++) {
                    rnaMoleculeNames.add(fullKeysArray[i].rnaMoleculeName);
                    const mappedBasePairInformation = mappedBasePairInformationArray[i];
                    if (mappedBasePairInformation !== undefined) {
                      rnaMoleculeNames.add(mappedBasePairInformation.rnaMoleculeName);
                    }
                  }
                  if (rnaMoleculeNames.size > 2) {
                    return false;
                  }
                  let encounteredBreakFlag = false;
                  let previousFullKeys = fullKeysArray[0];
                  let previousBasePairedNucleotideIndex : number | undefined = mappedBasePairInformationArray[0]?.nucleotideIndex;
                  for (let i = 1; i < fullKeysArray.length; i++) {
                    const currentFullKeys = fullKeysArray[i];
                    const mappedBasePairInformationI = mappedBasePairInformationArray[i];
                    if (
                      currentFullKeys.rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
                      currentFullKeys.nucleotideIndex - previousFullKeys.nucleotideIndex !== 1
                    ) {
                      if (encounteredBreakFlag) {
                        return false;
                      }
                      encounteredBreakFlag = true;
                      if (
                        mappedBasePairInformationI === undefined ||
                        mappedBasePairInformationI.rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
                        mappedBasePairInformationI.nucleotideIndex !== previousFullKeys.nucleotideIndex
                      ) {
                        return false;
                      }
                      previousBasePairedNucleotideIndex = mappedBasePairInformationI.nucleotideIndex;
                      const mappedBasePairInformationIMinusOne = mappedBasePairInformationArray[i - 1];
                      if (
                        mappedBasePairInformationIMinusOne !== undefined &&
                        (
                          mappedBasePairInformationI.rnaMoleculeName !== mappedBasePairInformationIMinusOne.rnaMoleculeName ||
                          Math.abs(mappedBasePairInformationI.nucleotideIndex - mappedBasePairInformationIMinusOne.nucleotideIndex) !== 1
                        )
                      ) {
                        return false;
                      }
                    } else if (mappedBasePairInformationI !== undefined) {
                      const mappedBasePairInformationIMinusOne = mappedBasePairInformationArray[i - 1];
                      if (
                        mappedBasePairInformationIMinusOne !== undefined &&
                        (
                          mappedBasePairInformationI.rnaMoleculeName !== mappedBasePairInformationIMinusOne.rnaMoleculeName ||
                          Math.abs(mappedBasePairInformationI.nucleotideIndex - mappedBasePairInformationIMinusOne.nucleotideIndex) !== 1
                        )
                      ) {
                        return false;
                      }
                      if (previousBasePairedNucleotideIndex !== undefined) {
                        const basePairsPerRnaMolecule = basePairs[mappedBasePairInformationI.rnaMoleculeName];
                        const boundingNucleotides = [
                          previousBasePairedNucleotideIndex,
                          mappedBasePairInformationI.nucleotideIndex
                        ].sort(subtractNumbers);
                        const minimumNucleotideIndex = boundingNucleotides[0];
                        const maximumNucleotideIndex = boundingNucleotides[1];
                        for (let nucleotideIndex = minimumNucleotideIndex + 1; nucleotideIndex < maximumNucleotideIndex; nucleotideIndex++) {
                          if (nucleotideIndex in basePairsPerRnaMolecule) {
                            return false;
                          }
                        }
                      }
                      previousBasePairedNucleotideIndex = mappedBasePairInformationI.nucleotideIndex;
                    }
                    previousFullKeys = currentFullKeys;
                  }
                  return true;
                  // FINISH DETECTING InteractionConstraint.Enum.RNA_STACKED_HELIX
                }
  
                function isRnaCycle() {
                  // BEGIN DETECTING InteractionConstraint.Enum.RNA_CYCLE
                  if (!singleRnaComplexFlag) {
                    return false;
                  }
                  const keysRecord : Record<RnaMoleculeKey, Set<NucleotideKey>> = {};
                  for (const { rnaMoleculeName, nucleotideIndex } of fullKeysArray) {
                    if (!(rnaMoleculeName in keysRecord)) {
                      keysRecord[rnaMoleculeName] = new Set<NucleotideKey>();
                    }
                    const keysPerRnaMolecule = keysRecord[rnaMoleculeName];
                    keysPerRnaMolecule.add(nucleotideIndex);
                  }
                  const { rnaMoleculeProps, basePairs } = rnaComplexProps[minimumFullKeys.rnaComplexIndex];
                  const encounteredKeysRecord : Record<RnaMoleculeKey, Set<NucleotideKey>> = {};
                  const queue = new Array<Keys>(minimumFullKeys);
                  let count = 0;
                  while (queue.length > 0) {
                    count++;
  
                    const {
                      rnaMoleculeName,
                      nucleotideIndex
                    } = queue.shift() as Keys;
                    const { nucleotideProps } = rnaMoleculeProps[rnaMoleculeName];
                    const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
  
                    if (!(rnaMoleculeName in encounteredKeysRecord)) {
                      encounteredKeysRecord[rnaMoleculeName] = new Set<NucleotideKey>();
                    }
                    const encounteredKeysPerRnaMolecule = encounteredKeysRecord[rnaMoleculeName];
                    encounteredKeysPerRnaMolecule.add(nucleotideIndex);
  
                    const neighbors = new Array<Keys>();
                    if (nucleotideIndex - 1 in nucleotideProps) {
                      neighbors.push({
                        rnaMoleculeName,
                        nucleotideIndex : nucleotideIndex - 1
                      });
                    }
                    if (nucleotideIndex + 1 in nucleotideProps) {
                      neighbors.push({
                        rnaMoleculeName,
                        nucleotideIndex : nucleotideIndex + 1
                      });
                    }
                    if (nucleotideIndex in basePairsPerRnaMolecule) {
                      const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
                      neighbors.push(mappedBasePairInformation);
                    }
                    for (const neighbor of neighbors) {
                      const {
                        rnaMoleculeName,
                        nucleotideIndex
                      } = neighbor;
                      if (
                        rnaMoleculeName in keysRecord &&
                        keysRecord[rnaMoleculeName].has(nucleotideIndex) && (
                          !(rnaMoleculeName in encounteredKeysRecord) ||
                          !encounteredKeysRecord[rnaMoleculeName].has(nucleotideIndex)
                        )
                      ) {
                        queue.push(neighbor);
                      }
                    }
                  }
                  return count === fullKeysArray.length;
                  // FINISH DETECTING InteractionConstraint.Enum.RNA_CYCLE
                }
  
                if (noNucleotidesAreBasePairedFlag) {
                  // BEGIN DETECTING InteractionConstraint.Enum.RNA_SINGLE_STRAND
                  let singleStrandFlag = true;
                  let previousFullKeys = fullKeysArray[0];
                  for (let i = 1; i < fullKeysArray.length; i++) {
                    const currentFullKeys = fullKeysArray[i];
                    if (
                      previousFullKeys.rnaComplexIndex !== currentFullKeys.rnaComplexIndex ||
                      previousFullKeys.rnaMoleculeName !== currentFullKeys.rnaMoleculeName ||
                      Math.abs(previousFullKeys.nucleotideIndex - currentFullKeys.nucleotideIndex) !== 1
                    ) {
                      singleStrandFlag = false;
                      break;
                    }
                    previousFullKeys = currentFullKeys;
                  }
                  if (singleStrandFlag) {
                    return {
                      fullKeys : previousFullKeys,
                      interactionConstraint : InteractionConstraint.Enum.RNA_SINGLE_STRAND
                    };
                  }
                  // FINISH DETECTING InteractionConstraint.Enum.RNA_SINGLE_STRAND
                } else if (allNucleotidesAreBasePairedFlag) {
                  // BEGIN DETECTING InteractionConstraint.Enum.RNA_HELIX
                  if (
                    singleRnaComplexFlag && 
                    (singleRnaMoleculeFlag || dualRnaMoleculesFlag)
                  ) {
                    let encounteredBreakFlag = false;
                    let singleHelixFlag = true;
                    let previousFullKeys = fullKeysArray[0];
                    for (let i = 1; i < fullKeysArray.length; i++) {
                      const currentFullKeys = fullKeysArray[i];
                      const mappedBasePairInformationI = mappedBasePairInformationArray[i];
                      if (currentFullKeys.nucleotideIndex - previousFullKeys.nucleotideIndex !== 1) {
                        if (encounteredBreakFlag) {
                          singleHelixFlag = false;
                          break;
                        } else {
                          encounteredBreakFlag = true;
                          if (
                            mappedBasePairInformationI === undefined ||
                            mappedBasePairInformationI.rnaMoleculeName !== previousFullKeys.rnaMoleculeName ||
                            mappedBasePairInformationI.nucleotideIndex !== previousFullKeys.nucleotideIndex
                          ) {
                            singleHelixFlag = false;
                            break;
                          }
                        }
                      } else if (mappedBasePairInformationI !== undefined) {
                        const mappedBasePairInformationIMinusOne = mappedBasePairInformationArray[i - 1];
                        if (
                          mappedBasePairInformationIMinusOne !== undefined &&
                          (
                            mappedBasePairInformationI.rnaMoleculeName !== mappedBasePairInformationIMinusOne.rnaMoleculeName ||
                            Math.abs(mappedBasePairInformationI.nucleotideIndex - mappedBasePairInformationIMinusOne.nucleotideIndex) !== 1
                          )
                        ) {
                          singleHelixFlag = false;
                          break;
                        }
                      }
                      previousFullKeys = currentFullKeys;
                    }
                    if (singleHelixFlag) {
                      return {
                        fullKeys : minimumFullKeys,
                        interactionConstraint : InteractionConstraint.Enum.RNA_HELIX
                      };
                    }
                  }
                  // FINISH DETECTING InteractionConstraint.Enum.RNA_HELIX
                  if (isSubdomain()) {
                    return {
                      fullKeys : minimumFullKeys,
                      interactionConstraint : InteractionConstraint.Enum.RNA_SUB_DOMAIN
                    };
                  }
                  if (isStackedHelix()) {
                    return {
                      fullKeys : minimumFullKeys,
                      interactionConstraint : InteractionConstraint.Enum.RNA_STACKED_HELIX
                    };
                  }
                } else {
                  if (isSubdomain()) {
                    return {
                      fullKeys : minimumFullKeys,
                      interactionConstraint : InteractionConstraint.Enum.RNA_SUB_DOMAIN
                    };
                  }
                  if (isStackedHelix()) {
                    return {
                      fullKeys : fullKeysArray.find(function(
                        _fullKeys,
                        i
                      ) {
                        return mappedBasePairInformationArray[i] !== undefined;
                      }) as FullKeys,
                      interactionConstraint : InteractionConstraint.Enum.RNA_STACKED_HELIX
                    };
                  }
                  if (isRnaCycle()) {
                    return {
                      fullKeys : fullKeysArray.find(function(
                        _fullKeys,
                        i
                      ) {
                        return mappedBasePairInformationArray[i] === undefined;
                      }) as FullKeys,
                      interactionConstraint : InteractionConstraint.Enum.RNA_CYCLE
                    }
                  }
                }
  
                if (singleRnaMoleculeFlag) {
                  return {
                    fullKeys : minimumFullKeys,
                    interactionConstraint : InteractionConstraint.Enum.RNA_MOLECULE
                  };
                }
  
                if (singleRnaComplexFlag) {
                  return {
                    fullKeys : minimumFullKeys,
                    interactionConstraint : InteractionConstraint.Enum.RNA_COMPLEX
                  };
                }
  
                // BEGIN DETECTING InteractionConstraint.Enum.SINGLE_COLOR
                const singleColorCandidate = rnaComplexProps[minimumFullKeys.rnaComplexIndex].rnaMoleculeProps[minimumFullKeys.rnaMoleculeName].nucleotideProps[minimumFullKeys.nucleotideIndex].color ?? BLACK;
                let singleColorFlag = true;
                for (let i = 1; i < fullKeysArray.length; i++) {
                  const {
                    rnaComplexIndex,
                    rnaMoleculeName,
                    nucleotideIndex
                  } = fullKeysArray[i];
                  const color = rnaComplexProps[rnaComplexIndex].rnaMoleculeProps[rnaMoleculeName].nucleotideProps[nucleotideIndex].color ?? BLACK;
                  if (!areEqual(
                    singleColorCandidate,
                    color
                  )) {
                    singleColorFlag = false;
                    break;
                  }
                }
                if (singleColorFlag) {
                  return {
                    fullKeys : minimumFullKeys,
                    interactionConstraint : InteractionConstraint.Enum.SINGLE_COLOR
                  };
                }
                // FINISH DETECTING InteractionConstraint.Enum.SINGLE_COLOR
  
                return {
                  fullKeys : minimumFullKeys,
                  interactionConstraint : InteractionConstraint.Enum.ENTIRE_SCENE
                };
              }
              switch (fullKeysArray.length) {
                case 0 : {
                  return undefined;
                }
                case 1 : {
                  const fullKeys = fullKeysArray[0];
                  const {
                    rnaComplexIndex,
                    rnaMoleculeName,
                    nucleotideIndex
                  } = fullKeys;
                  const { basePairs } = rnaComplexProps[rnaComplexIndex];
                  let interactionConstraint = InteractionConstraint.Enum.SINGLE_NUCLEOTIDE;
                  if (rnaMoleculeName in basePairs) {
                    const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
                    if (nucleotideIndex in basePairsPerRnaMolecule) {
                      interactionConstraint = InteractionConstraint.Enum.SINGLE_BASE_PAIR;
                    }
                  }
                  return {
                    fullKeys,
                    interactionConstraint 
                  };
                }
                case 2 : {
                  const fullKeys0 = fullKeysArray[0];
                  const fullKeys1 = fullKeysArray[1];
    
                  const { basePairs } = rnaComplexProps[fullKeys0.rnaComplexIndex];
                  let basePairsPerRnaMolecule : RnaComplex.BasePairsPerRnaMolecule;
                  let mappedBasePairInformation : RnaComplex.MappedBasePair;
                  if (
                    fullKeys0.rnaComplexIndex === fullKeys1.rnaComplexIndex &&
                    fullKeys0.rnaMoleculeName in basePairs &&
                    fullKeys0.nucleotideIndex in (basePairsPerRnaMolecule = basePairs[fullKeys0.rnaMoleculeName]) && 
                    fullKeys1.rnaMoleculeName === (mappedBasePairInformation = basePairsPerRnaMolecule[fullKeys0.nucleotideIndex]).rnaMoleculeName &&
                    fullKeys1.nucleotideIndex === mappedBasePairInformation.nucleotideIndex
                  ) {
                    return {
                      fullKeys : fullKeys0,
                      interactionConstraint : InteractionConstraint.Enum.SINGLE_BASE_PAIR
                    };
                  } else {
                    return handleMultipleFullKeys();
                  }
                }
                default : {
                  return handleMultipleFullKeys();
                }
              }
            }
            let interactionConstraintAndFullKeys = getInteractionConstraintAndFullKeys(fullKeysOfCapturedNucleotides);
            if (interactionConstraintAndFullKeys !== undefined) {
              const {
                fullKeys,
                interactionConstraint
              } = interactionConstraintAndFullKeys;
              setInteractionConstraint(interactionConstraint);
              nucleotideOnMouseDownRightClickHelper(
                fullKeys,
                interactionConstraint,
                tab as InteractionConstraint.SupportedTab
              );
            } else {
              interactionConstraintAndFullKeys = getInteractionConstraintAndFullKeys(fullKeysOfCapturedLabels);
              if (interactionConstraintAndFullKeys !== undefined) {
                const {
                  fullKeys,
                  interactionConstraint
                } = interactionConstraintAndFullKeys;
                setInteractionConstraint(interactionConstraint);
                labelOnMouseDownRightClickHelper(
                  fullKeys,
                  interactionConstraint
                );
              }
            }
          }
          setDataSpaceOriginOfDrag(undefined);
        };
      },
      []
    );
    const onMouseLeave = useMemo(
      function() {
        return function() {
          setDragListener(
            null,
            {}
          );
          setDebugVisualElements([]);
          setDataSpaceOriginOfDrag(undefined);
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
          const toolsDivResizeDetectorWidth = toolsDivResizeDetectorWidthReference.current ?? 0;
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
            x : e.clientX - toolsDivResizeDetectorWidth - DIV_BUFFER_DIMENSION,
            y : e.clientY
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
              inputFileNameAndExtensionReference.current = inputFileNameAndExtension;
              setInputFileNameAndExtension(inputFileNameAndExtension);
              let regexMatch = /^(.*)\.(.+)$/.exec(inputFileNameAndExtension) as RegExpExecArray;
              let fileName = regexMatch[1];
              let fileExtension = regexMatch[2];
              if (settingsRecord[Setting.COPY_FILE_NAME]) {
                setOutputFileName(fileName);
              }
              if (settingsRecord[Setting.COPY_FILE_EXTENSION] && (fileExtension in outputFileWritersMap)) {
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
      [
        settingsRecord,
        outputFileWritersMap
      ]
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
        const inputFileNameAndExtension = inputFileNameAndExtensionReference.current as string;
        
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
              {RESET_TEXT}
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
                    const value = settingsJson[key];
                    if (!isSetting(key) || (typeof value !== settingsTypeMap[key] && !(settingsTypeMap[key] === "BasePairsEditorType" && BasePairsEditor.isEditorType(value)))) {
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
                const flattenedRnaComplexProps = flattenedRnaComplexPropsReference.current as Array<[string, RnaComplex.ExternalProps]>;
                if (flattenedRnaComplexProps.length > 0) {
                  const rnaComplexIndex = Number.parseInt(flattenedRnaComplexProps[0][0]);
                  const { helixDistance, distances } = basePairAverageDistances[rnaComplexIndex];
                  settingsObject[Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] = helixDistance;
                  settingsObject[Setting.CANONICAL_BASE_PAIR_DISTANCE] = distances[BasePair.Type.CANONICAL];
                  settingsObject[Setting.MISMATCH_BASE_PAIR_DISTANCE] = distances[BasePair.Type.MISMATCH];
                  settingsObject[Setting.WOBBLE_BASE_PAIR_DISTANCE] = distances[BasePair.Type.WOBBLE];
                }
  
                for (let key of settings) {
                  let value = settingsRecord[key];
                  if (Number.isNaN(value)) {
                    if (key in settingsObject) {
                      continue;
                    } else {
                      value = 1;
                    }
                  }
                  settingsObject[key] = value;
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
            <span
              style = {{
                whiteSpace : "normal"
              }}
            >
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
                    Now that you have an input file, navigate to the "{Tab.INPUT_OUTPUT}" tab to upload it. XRNA.js should import its data in only a few seconds.
                    <br/>
                  </li>
                  <li>
                    Once the data is imported, you can continue work in several different ways:
                    <ul>
                      <li>Download its data to a different file ({Tab.INPUT_OUTPUT} tab)</li>
                      <li>Edit its data ({Tab.EDIT} tab)</li>
                      <li>Add/remove/edit base base pairs ({Tab.FORMAT} tab)</li>
                      <li>Add/remove annotations ({Tab.ANNOTATE} tab)</li>
                    </ul>
                    For explanation of these, read the relevant section of the "{Tab.ABOUT}" tab.
                  </li>
                </ol>
                <Collapsible.Component
                  title = "Demo"
                >
                  <iframe
                    src = "https://youtube.com/embed/IQhuC63lTRc"
                    allowFullScreen = {true}
                    width = {960}
                    height = {540}
                  />
                </Collapsible.Component>
              </Collapsible.Component>
              <Collapsible.Component
                title = "Tabs"
              >
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
              </Collapsible.Component>
              <Collapsible.Component
                title = "Constraints"
              >
                {InteractionConstraint.all.map(function(interactionConstraint) {
                  return <Collapsible.Component
                    key =  {interactionConstraint}
                    title = {`The "${interactionConstraint}" constraint`}
                  >
                    {InteractionConstraint.descriptionRecord[interactionConstraint]}
                  </Collapsible.Component>;
                })}
              </Collapsible.Component>
              <Collapsible.Component
                title = "Tips and Tricks"
              >
                Hotkey combinations:
                <ul
                  style = {{
                    margin : 0
                  }}
                >
                  <li>
                    Ctrl + O - opens a new input file
                  </li>
                  <li>
                    Ctrl + S - saves a new output file, using the current output-file name and output-file extension.
                    <br/>
                    Fails if either of these are not provided.
                  </li>
                  <li>
                    Ctrl + 0 - resets the properties of the "{Tab.VIEWPORT}" tab.
                  </li>
                </ul>
                <Collapsible.Component
                  title = "Demo"
                >
                  <iframe
                    src = "https://youtube.com/embed/evlD9BDW7U0"
                    allowFullScreen = {true}
                    width = {960}
                    height = {540}
                  />
                </Collapsible.Component>
                In order to have a more enjoyable and intuitive experience with XRNA.js, try middle-mouse click-and-drag to highlight nucleotides.
                <br/>
                This will:
                <ol
                  style = {{
                    margin : 0
                  }}
                >
                  <li>
                    Automatically change the constraint to an appropriate value which matches the nucleotides you selected 
                  </li>
                  <li>
                    Populate a menu for precisely editing, formatting, or annotating data within the viewport.
                  </li>
                </ol>
                <Collapsible.Component
                  title = "Demo"
                >
                  <iframe
                    src = "https://youtube.com/embed/pR54iebw1LI"
                    allowFullScreen = {true}
                    width = {960}
                    height = {540}
                  />
                </Collapsible.Component>
              </Collapsible.Component>
              <Collapsible.Component
                title = "How to cite XRNA"
              >
                XRNA.js is currently unpublished; once it becomes published, citation instructions will replace this text block.
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
            </span>
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
        flattenedRnaComplexPropsLength,
        inputFileNameAndExtension,
        flattenedRnaComplexProps,
        outputFileWritersMap
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
                display : tab === tabI ? "block" : "none",
                background : "inherit"
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
        return tab === Tab.EDIT ? LABEL_CLASS_NAME : NO_STROKE_CLASS_NAME;
      },
      [tab]
    );
    const transformIntoDataSpace = useMemo(
      function() {
        return function(clickedOnCoordinates : Vector2D) {
          const toolsDivResizeDetectorWidth = toolsDivResizeDetectorWidthReference.current as number;
          const sceneBoundsScaleMin = sceneBoundsScaleMinReference.current as number;
          const viewportScale = viewportScaleReference.current as number;
          const transformTranslate0 = transformTranslate0Reference.current as { asVector : Vector2D, asString : string };
          const transformTranslate1 = transformTranslate1Reference.current as { asVector : Vector2D, asString : string };
  
          let transformedCoordinates = structuredClone(clickedOnCoordinates);
          transformedCoordinates.x -= toolsDivResizeDetectorWidth;
          transformedCoordinates = scaleDown(
            transformedCoordinates,
            sceneBoundsScaleMin * viewportScale
          );
          transformedCoordinates.y = -transformedCoordinates.y;
          transformedCoordinates = subtract(
            transformedCoordinates,
            add(
              transformTranslate0.asVector,
              transformTranslate1.asVector
            )
          );
          return transformedCoordinates;
        }
      },
      []
    );
    const resetRightClickMenuContent = useMemo(
      function() {
        return function() {
          const flattenedRnaComplexProps = flattenedRnaComplexPropsReference.current as Array<[string, RnaComplex.ExternalProps]>;
          const tab = tabReference.current as Tab;
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
            <b
              style = {{
                color : "red"
              }}
            >
              {rightClickPrompt}
            </b>,
            {}
          );
        }
      },
      []
    );
    const {
      filterInvert
    } = useMemo(
      function() {
        const darkModeFlag = settingsRecord[Setting.DARK_MODE];
        const filterInvert = darkModeFlag ? "invert(1)" : "none";
        return {
          filterInvert
        };
      },
      [settingsRecord]
    );
    // Begin effects.
    useEffect(
      function() {
        window.onbeforeunload = function(e) {
          if (!settingsRecord[Setting.DISABLE_NAVIGATE_AWAY_PROMPT]) {
            // Custom messages aren't allowed anymore.
            return "";
          }
        };
      },
      [settingsRecord]
    );
    useEffect(
      function() {
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
      resetRightClickMenuContent,
      [
        tab,
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
        setTopToolsDivHeightAttribute(topToolsDivResizeDetector.height);
  
        setTimeout(
          function() {
            setTopToolsDivHeightAttribute("auto");
          },
          100
        );
      },
      [rightClickMenuContent]
    );
    useEffect(
      function() {
        if (listenForResizeFlag) {
          return;
        }
        const newWidth = Math.max(
          topToolsDivResizeDetector.width ?? 0,
          rightClickMenuContentResizeDetector.width ?? 0,
          errorMessageResizeDetector.width ?? 0
        );
        setToolsDivWidthAttribute(newWidth);
      },
      [
        topToolsDivResizeDetector.width,
        rightClickMenuContentResizeDetector.width,
        errorMessageResizeDetector.width
      ]
    );
    useEffect(
      function() {
        if (!listenForResizeFlag) {
          return;
        }
        const newWidth = userDrivenResizeDetector.width ?? 0;
        setToolsDivWidthAttribute(newWidth);
      },
      [userDrivenResizeDetector.width]
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
                              id = {PARENT_DIV_HTML_ID}
                              onKeyDown = {onKeyDown}
                              ref = {parentDivResizeDetector.ref}
                              style = {{
                                position : "absolute",
                                display : "block",
                                width : "100%",
                                height : "100%",
                                overflow : "hidden",
                                background : "white",
                                color : "black",
                                filter : filterInvert
                              }}
                              onMouseUp = {function() {
                                setListenForResizeFlag(false);
                              }}
                              // onMouseLeave = {function() {
                              //   setListenForResizeFlag(false);
                              // }}
                            >
                              {/* Tools div */}
                              <div
                                tabIndex = {0}
                                ref = {toolsDivResizeDetector.ref}
                                style = {{
                                  position : "absolute",
                                  width : toolsDivWidthAttribute,
                                  height : "100%",
                                  display : "block",
                                  borderRight : `5px solid black`,
                                  background : "inherit"
                                }}
                              >
                                {/* Top tools div */}
                                <div
                                  ref = {userDrivenResizeDetector.ref}
                                  style = {{
                                    width : toolsDivWidthAttribute,
                                    minWidth : "inherit",
                                    maxHeight : "100%",
                                    height : topToolsDivHeightAttribute,
                                    display : "inline-block",
                                    overflowX : "auto",
                                    overflowY : "auto",
                                    top : 0,
                                    left : 0,
                                    background : "inherit",
                                    resize : "both",
                                    borderBottom : `2px solid black`,
                                    whiteSpace : "nowrap"
                                  }}
                                  onMouseDown = {function() {
                                    setListenForResizeFlag(true);
                                  }}
                                >
                                  <div
                                    ref = {topToolsDivResizeDetector.ref}
                                    style = {{
                                      width : "auto",
                                      height : "inherit",
                                      display : "inline-block"
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
                                </div>
                                {/* Bottom tools div */}
                                <div
                                  style = {{
                                    width : "auto",
                                    maxHeight : (parentDivResizeDetector.height ?? 0) - (topToolsDivResizeDetector.height ?? 0),
                                    display : "inline-block",
                                    overflowX : "hidden",
                                    overflowY : "auto",
                                    top : (topToolsDivResizeDetector.height ?? 0) + DIV_BUFFER_DIMENSION,
                                    left : 0,
                                    background : "inherit",
                                    position : "absolute",
                                    whiteSpace : "nowrap"
                                  }}
                                >
                                  {sceneState === SceneState.DATA_LOADING_FAILED && <>
                                    <div
                                      style = {{
                                        display : "inline-block",
                                        width : "auto"
                                      }}
                                      ref = {errorMessageResizeDetector.ref}
                                    >
                                      <b
                                        style = {{
                                          color : "red",
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
                                    </div>
                                    <br/>
                                  </>}
                                  <Context.App.ComplexDocumentName.Provider
                                    value = {complexDocumentName}
                                  >
                                    <Context.App.SetComplexDocumentName.Provider
                                      value = {setComplexDocumentName}
                                    >
                                      <Context.OrientationEditor.ResetDataTrigger.Provider
                                        value = {resetOrientationDataTrigger}
                                      >
                                        <Context.Collapsible.Width.Provider
                                          value = {toolsDivWidthAttribute}
                                        >
                                         {rightClickMenuContent}
                                        </Context.Collapsible.Width.Provider>
                                      </Context.OrientationEditor.ResetDataTrigger.Provider>
                                    </Context.App.SetComplexDocumentName.Provider>
                                  </Context.App.ComplexDocumentName.Provider>
                                </div>
                              </div>
                              <svg
                                id = {SVG_ELEMENT_HTML_ID}
                                style = {{
                                  top : 0,
                                  left : typeof toolsDivWidthAttribute === "number" ? (toolsDivWidthAttribute + DIV_BUFFER_DIMENSION) : toolsDivWidthAttribute,
                                  position : "absolute"
                                }}
                                xmlns = "http://www.w3.org/2000/svg"
                                viewBox = {`0 0 ${svgWidth} ${parentDivResizeDetector.height ?? 0}`}
                                tabIndex = {1}
                                onMouseDown = {onMouseDown}
                                onMouseMove = {onMouseMove}
                                onMouseUp = {onMouseUp}
                                onMouseLeave = {onMouseLeave}
                                onContextMenu = {function(event) {
                                  event.preventDefault();
                                }}
                                onWheel = {onWheel}
                                fill = "white"
                                stroke = {InteractionConstraint.isSupportedTab(tab) ? strokesPerTab[tab] : "none"}
                                filter = "none"
                              >
                                {/* Having this here, rather than in an external App.css file, allows these to be directly exported to .SVG files. */}
                                <style>{`
                                  .nucleotide { stroke:none; }
                                  .nucleotide:hover { stroke:inherit; }
                                  .${LABEL_CLASS_NAME} { stroke:none; }
                                  .${LABEL_CLASS_NAME}:hover { stroke:inherit; }
                                  .${NO_STROKE_CLASS_NAME} { stroke:none; }
                                `}</style>
                                <rect
                                  width = "100%"
                                  height = "100%"
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
                                  transform = {totalScale.asTransform[0]}
                                >
                                  <g
                                    id = {VIEWPORT_SCALE_GROUP_HTML_ID}
                                    transform = {totalScale.asTransform[1]}
                                  >
                                    <g
                                      transform = {"scale(1, -1) " + transformTranslate0.asString}
                                    >
                                      <g
                                        id = {VIEWPORT_TRANSLATE_GROUP_HTML_ID}
                                        transform = {transformTranslate1.asString}
                                      >
                                        {debugVisualElements}
                                        {renderedRnaComplexes}
                                      </g>
                                    </g>
                                  </g>
                                </g>
                                <g
                                  id = {MOUSE_OVER_TEXT_HTML_ID}
                                >
                                  <rect
                                    x = {0}
                                    y = {(parentDivResizeDetector.height ?? 0) - mouseOverTextDimensions.height}
                                    width = {mouseOverTextDimensions.width}
                                    height = {mouseOverTextDimensions.height}
                                    fill = "white"
                                    stroke = "none"
                                  />
                                  <text
                                    fill = "black"
                                    stroke = "none"
                                    x = {0}
                                    y = {(parentDivResizeDetector.height ?? 0) - mouseOverTextDimensions.height * 0.25}
                                    ref = {mouseOverTextSvgTextElementReference}
                                    fontFamily = "Arial"
                                    fontSize = {MOUSE_OVER_TEXT_FONT_SIZE}
                                  >
                                    {mouseOverText}
                                  </text>
                                </g>
                              </svg>
                              {sceneState === SceneState.DATA_IS_LOADING && <img
                                style = {{
                                  top : (parentDivResizeDetector.height ?? 0) * 0.5 - 100,
                                  left : ((toolsDivResizeDetector.width ?? 0) + (parentDivResizeDetector.width ?? 0)) * 0.5 - 50,
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
                                  whiteSpace : "nowrap",
                                  background : "inherit"
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
}

export default App;
