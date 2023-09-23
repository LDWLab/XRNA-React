import React, { createRef, Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { DEFAULT_TAB, Tab, tabs } from './app_data/Tab';
import { add, scaleDown, subtract, Vector2D } from './data_structures/Vector2D';
import { useResizeDetector } from 'react-resize-detector';
import { compareBasePairKeys, RnaComplex } from './components/app_specific/RnaComplex';
import { OutputFileExtension, outputFileExtensions, outputFileWritersMap } from './io/OutputUI';
import { SCALE_BASE, ONE_OVER_LOG_OF_SCALE_BASE, MouseButtonIndices } from './utils/Constants';
import { inputFileExtensions, InputFileExtension, inputFileReadersRecord } from './io/InputUI';
import { DEFAULT_SETTINGS, Setting, settings, settingsLongDescriptionsMap, settingsShortDescriptionsMap, settingsTypeMap, SettingValue } from './ui/Setting';
import InputWithValidator from './components/generic/InputWithValidator';
import { BasePairKeysToRerender, BasePairKeysToRerenderPerRnaComplex, Context, NucleotideKeysToRerender, NucleotideKeysToRerenderPerRnaComplex } from './context/Context';
import { isEmpty, sign, subtractNumbers } from './utils/Utils';
import { Nucleotide } from './components/app_specific/Nucleotide';
import { LabelContent } from './components/app_specific/LabelContent';
import { LabelLine } from './components/app_specific/LabelLine';
import { InteractionConstraint } from './ui/InteractionConstraint/InteractionConstraints';
import { LabelContentEditMenu } from './components/app_specific/menus/edit_menus/LabelContentEditMenu';
import { LabelLineEditMenu } from './components/app_specific/menus/edit_menus/LabelLineEditMenu';
import { jsonObjectHandler } from './io/JsonInputFileHandler';
import { BasePairsEditor } from './components/app_specific/editors/BasePairsEditor';
import { Collapsible } from './components/generic/Collapsible';
import { SAMPLE_XRNA_FILE } from './utils/sampleXrnaFile';
import { fileExtensionDescriptions } from './io/FileExtension';

export const SVG_ELEMENT_HTML_ID = "viewport";

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
export type DragListener = {
  initiateDrag : () => Vector2D,
  continueDrag : (totalDrag : Vector2D) => void,
  terminateDrag? : () => void
}
export type RnaComplexProps = Record<RnaComplexKey, RnaComplex.ExternalProps>;
function App() {
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
    inputFileNameAndExtension,
    setInputFileNameAndExtension
  ] = useState("");
  const [
    outputFileName,
    setOutputFileName
  ] = useState("");
  const [
    outputFileExtension,
    setOutputFileExtension
  ] = useState<OutputFileExtension | undefined>(undefined);
  const [
    sceneBounds,
    setSceneBounds
  ] = useState({
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
  ] = useState(DEFAULT_SETTINGS);
  const [
    rightClickMenuContent,
    setRightClickMenuContent
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
    sceneVisibility,
    setSceneVisibility
  ] = useState(false);
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
  const [
    downloadButtonErrorMessage,
    setDownloadButtonErrorMessage
  ] = useState<string>("");
  // Begin state-relevant helper functions.
  function resetViewport() {
    setSceneBounds((sceneSvgGElementReference.current as SVGGElement).getBBox());
    setViewportTranslateX(0);
    setViewportTranslateY(0);
    setViewportScaleExponent(0);
    setViewportScale(1);
  }
  function onKeyDown (event : React.KeyboardEvent<Element>) {
    switch (event.key) {
      case "s" : {
        if (event.ctrlKey) {
          event.preventDefault();
          if (outputFileName === "") {
            alert("A name for the output file was not provided.");
          } else if (outputFileExtension === undefined) {
            alert("An extension for the output file was not selected.");
          } else {
            (downloadOutputFileHtmlButtonReference.current as HTMLButtonElement).click();
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
  function setDragListener(dragListener : DragListener | null) {
    if (dragListener !== null) {
      setDragCache(dragListener.initiateDrag());
    }
    _setDragListener(dragListener);
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
  const uploadInputFileHtmlInputReference = createRef<HTMLInputElement>();
  const downloadOutputFileHtmlButtonReference = createRef<HTMLButtonElement>();
  const downloadOutputFileHtmlAnchorReference = createRef<HTMLAnchorElement>();
  const downloadSampleInputFileHtmlAnchorReference = createRef<HTMLAnchorElement>();
  const settingsFileDownloadHtmlAnchorReference = createRef<HTMLAnchorElement>();
  const settingsFileUploadHtmlInputReference = createRef<HTMLInputElement>();
  const mouseOverTextSvgTextElementReference = createRef<SVGTextElement>();
  const parentDivResizeDetector = useResizeDetector();
  const toolsDivResizeDetector = useResizeDetector();
  const tabReference = useRef<Tab>();
  tabReference.current = tab;
  const interactionConstraintReference = useRef<InteractionConstraint.Enum | undefined>();
  interactionConstraintReference.current = interactionConstraint;
  const viewportTranslateXReference = useRef<number>(NaN);
  viewportTranslateXReference.current = viewportTranslateX;
  const viewportTranslateYReference = useRef<number>(NaN);
  viewportTranslateYReference.current = viewportTranslateY;
  const rnaComplexPropsReference = useRef<RnaComplexProps>();
  rnaComplexPropsReference.current = rnaComplexProps;
  const sceneSvgGElementReference = useRef<SVGGElement>();
  // Begin memo data.
  const flattenedRnaComplexProps = useMemo(
    function() {
      return Object.entries(rnaComplexProps);
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
  const totalScale = useMemo(
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
            setDragListener(newDragListener);
            break;
          }
          case MouseButtonIndices.Right : {
            switch (tabReference.current) {
              case Tab.EDIT : {
                setRightClickMenuContent(<LabelContentEditMenu.Component
                  rnaComplexProps = {rnaComplexPropsReference.current as RnaComplexProps}
                  fullKeys = {fullKeys}
                  triggerRerender = {function() {
                    setNucleotideKeysToRerender({
                      [rnaComplexIndex] : {
                        [rnaMoleculeName] : [nucleotideIndex]
                      }
                    });
                  }}
                />);
                break;
              }
            }
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
            setDragListener(newDragListener);
            break;
          }
          case MouseButtonIndices.Right : {
            if (tabReference.current === Tab.EDIT) {
              setRightClickMenuContent(<LabelLineEditMenu.Component
                rnaComplexProps = {rnaComplexPropsReference.current as RnaComplexProps}
                fullKeys = {fullKeys}
                triggerRerender = {function() {
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex] : {
                      [rnaMoleculeName] : [nucleotideIndex]
                    }
                  });
                }}
              />);
            }
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
            setDragListener(newDragListener);
            break;
          }
          case MouseButtonIndices.Right : {
            if (tabReference.current === Tab.EDIT) {
              setRightClickMenuContent(<LabelLineEditMenu.Component
                rnaComplexProps = {rnaComplexPropsReference.current as RnaComplexProps}
                fullKeys = {fullKeys}
                triggerRerender = {function() {
                  setNucleotideKeysToRerender({
                    [rnaComplexIndex] : {
                      [rnaMoleculeName] : [nucleotideIndex]
                    }
                  });
                }}
              />);
            }
            break;
          }
        }
      }
    },
    []
  );
  const conditionallySetStroke = useMemo(
    function() {
      return function(setStroke : (stroke : string) => void) {
        switch (tabReference.current) {
          case Tab.EDIT : {
            setStroke("red");
            break;
          }
          case Tab.FORMAT : {
            setStroke("blue");
            break;
          }
        }
      };
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
                  setDebugVisualElements
                );
                const newDragListenerAttempt = helper.drag();
                if (newDragListenerAttempt != undefined) {
                  newDragListener = newDragListenerAttempt
                }
              } catch (error : any) {
                if ("errorMessage" in error) {
                  alert(error.errorMessage);
                } else {
                  throw error;
                }
                return;
              }
            }
            setDragListener(newDragListener);
            break;
          }
          case MouseButtonIndices.Right : {
            if (tab in InteractionConstraint.supportedTabs) {
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
                  setDebugVisualElements
                );
                const rightClickMenu = helper.createRightClickMenu(tab as InteractionConstraint.SupportedTab);
                setRightClickMenuContent(rightClickMenu);
              } catch (error : any) {
                if ("errorMessage" in error) {
                  alert(error.errorMessage);
                } else {
                  throw error;
                  // console.log(error);
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
  const renderedRnaComplexes = useMemo(
    function() {
      return <Context.App.SetMouseOverText.Provider
        value = {setMouseOverText}
      >
        <Context.App.ConditionallySetStroke.Provider
          value = {conditionallySetStroke}
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
        </Context.App.ConditionallySetStroke.Provider>
      </Context.App.SetMouseOverText.Provider>;
    },
    [
      rnaComplexProps,
      nucleotideKeysToRerender,
      basePairKeysToRerender
    ]
  );
  function parseJson(url : string) {
    let promise = fetch(url, {
      method : "GET"
    });
    promise.then(data => {
      data.json().then(json => {
        let parsedInput = jsonObjectHandler(json);
        setRnaComplexProps(parsedInput.rnaComplexProps);
        setComplexDocumentName(parsedInput.complexDocumentName);
      });
    });
  }
  // Begin effects.
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
    function() {
      let rightClickPrompt = "";
      if (flattenedRnaComplexProps.length === 0) {
        const promptStart = "You must load an input file before attempting to ";
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
      setRightClickMenuContent(<>{rightClickPrompt}</>);
    },
    [
      tab,
      interactionConstraint
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
            setSceneVisibility(true);
          },
          numSeconds * 1000
        );
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
      // setNucleotideKeysToRerender(nucleotideKeysToRerender);
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
  // Begin render data.
  const interactionConstraintSelectHtmlElement = <>
    {INTERACTION_CONSTRAINT_TEXT}:&nbsp;
    <select
      value = {interactionConstraint}
      onChange = {function(e) {
        setInteractionConstraint(e.target.value as InteractionConstraint.Enum);
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
  </>;
  const tabInstructionsRecord : Record<Tab, JSX.Element> = {
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
  const tabRenderRecord : Record<Tab, JSX.Element> = {
    [Tab.INPUT_OUTPUT] : <>
      <label>
        Input File:&nbsp;
        <input
          ref = {uploadInputFileHtmlInputReference}
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
              let parsedInputFile = inputFileReadersRecord[fileExtension.toLocaleLowerCase() as InputFileExtension]((event.target as FileReader).result as string);
              setComplexDocumentName(parsedInputFile.complexDocumentName);
              setRnaComplexProps(parsedInputFile.rnaComplexProps);
            });
            reader.readAsText(files[0] as File);
          }}
        />
      </label>
      <button
        onClick = {function() {
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
        ref = {downloadOutputFileHtmlButtonReference}
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
        />
      </label>
      <br/>
      <label>
        y:&nbsp;
        <InputWithValidator.Number
          value = {viewportTranslateY}
          setValue = {setViewportTranslateY}
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
          setViewportScale(Math.pow(SCALE_BASE, newScaleExponent));
        }}
        min = {-50}
        max = {50}
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
      />
      <br/>
      <button
        onClick = {resetViewport}
      >
        Reset
      </button>
    </>,
    [Tab.EDIT] : <>
      {interactionConstraintSelectHtmlElement}
    </>,
    [Tab.FORMAT] : <>
      {interactionConstraintSelectHtmlElement}
    </>,
    [Tab.ANNOTATE] : <>
      {interactionConstraintSelectHtmlElement}
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
              let updatedSettings : Partial<Record<Setting, SettingValue>> = {};
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
          let settingsObject : Partial<Record<Setting, SettingValue>> = {};
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
    </>
  };
  return <Context.Nucleotide.SetKeysToRerender.Provider
    value = {setNucleotideKeysToRerender}
  >
    <Context.BasePair.SetKeysToRerender.Provider
      value = {setBasePairKeysToRerender}
    >
      <Context.App.Settings.Provider
        value = {settingsRecord}
      >
        <Context.App.UpdateRnaMoleculeNameHelper.Provider
          value = {function(
            rnaComplexIndex,
            oldRnaMoleculeName,
            newRnaMoleculeName
          ) {
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
          }}
        >
          <Context.BasePair.SetKeysToEdit.Provider
            value = {setBasePairKeysToEdit}
          >
            <div
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
                ref = {toolsDivResizeDetector.ref}
                style = {{
                  position : "absolute",
                  width : "100%",
                  height : "auto",
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
                    height : "100%",
                    display : "inline-block",
                    overflowY : "auto",
                    verticalAlign : "top"
                  }}
                >
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
                </div>
                {/* Right tools div */}
                <div
                  style = {{
                    width : "50%",
                    height : "100%",
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
                      {rightClickMenuContent}
                    </Context.App.SetComplexDocumentName.Provider>
                  </Context.App.ComplexDocumentName.Provider>
                </div>
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
                tabIndex = {0}
                onMouseDown = {function(e) {
                  switch (e.button) {
                    case MouseButtonIndices.Left : {
                      setOriginOfDrag({
                        x : e.clientX,
                        y : e.clientY
                      });
                      break;
                    }
                  }
                }}
                onMouseMove = {function(e) {
                  if (dragListener !== null) {
                    const translation = subtract(
                      {
                        x : e.clientX,
                        y : e.clientY
                      },
                      originOfDrag
                    );
                    translation.y = -translation.y;
                    dragListener.continueDrag(add(
                      dragCache,
                      scaleDown(
                        translation,
                        viewportScale * sceneBoundsScaleMin
                      )
                    ));
                  }
                  e.preventDefault();
                }}
                onMouseUp = {function(e) {
                  if (dragListener !== null) {
                    if (dragListener.terminateDrag !== undefined) {
                      dragListener.terminateDrag();
                    }
                    setDragListener(null);
                  }
                }}
                onMouseLeave = {function() {
                  setDragListener(null);
                }}
                onContextMenu = {function(event) {
                  event.preventDefault();
                }}
                onWheel = {function(e) {
                  // Apparently, the sign of <event.deltaY> needs to be negated in order to support intuitive scrolling...
                  let newScaleExponent = viewportScaleExponent - sign(e.deltaY);
                  let newScale = Math.pow(SCALE_BASE, newScaleExponent);
                  setViewportScale(newScale);
                  setViewportScaleExponent(newScaleExponent);
                  let uiVector = {
                    x : e.clientX,
                    y : e.clientY - (toolsDivResizeDetector.height ?? 0) - DIV_BUFFER_HEIGHT
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
                }}
              >
                <rect
                  width = "100%"
                  height = "100%"
                  fill = "white"
                  onMouseDown = {function(e) {
                    switch (e.button) {
                      case MouseButtonIndices.Left : {
                        setDragListener(viewportDragListener);
                        break;
                      }
                    }
                  }}
                />
                <g
                  style = {{
                    visibility : sceneVisibility ? "visible" : "hidden"
                  }}
                  transform = {totalScale.asTransform + " scale(1, -1) " + transformTranslate}
                >
                  {debugVisualElements}
                  {renderedRnaComplexes}
                </g>
                <rect
                  x = {0}
                  y = {svgHeight - mouseOverTextDimensions.height - 2}
                  width = {mouseOverTextDimensions.width}
                  height = {mouseOverTextDimensions.height}
                  fill = "black"
                />
                <text
                  fill = "white"
                  x = {0}
                  y = {svgHeight - mouseOverTextDimensions.height * 0.25 - 2}
                  ref = {mouseOverTextSvgTextElementReference}
                  fontFamily = "dialog"
                  fontSize = {MOUSE_OVER_TEXT_FONT_SIZE}
                >
                  {mouseOverText}
                </text>
              </svg>
            </div>
          </Context.BasePair.SetKeysToEdit.Provider>
        </Context.App.UpdateRnaMoleculeNameHelper.Provider>
      </Context.App.Settings.Provider>
    </Context.BasePair.SetKeysToRerender.Provider>
  </Context.Nucleotide.SetKeysToRerender.Provider>;
}

export default App;
