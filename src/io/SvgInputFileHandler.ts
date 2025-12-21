import { TEST_SPACE_ID } from "../App";
import BasePair, { isBasePairType } from "../components/app_specific/BasePair";
import { LabelContent } from "../components/app_specific/LabelContent";
import { LabelLine } from "../components/app_specific/LabelLine";
import { Nucleotide, getGraphicalAdjustment } from "../components/app_specific/Nucleotide";
import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { AffineMatrix, identity, parseAffineMatrix } from "../data_structures/AffineMatrix";
import Color, { BLACK, fromCssString } from "../data_structures/Color";
import Font, { parseFontSize } from "../data_structures/Font";
import { Vector2D } from "../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";
import { BasePairCenters, BasePairCentersPerRnaComplex, BasePairLines, BasePairLinesPerRnaComplex, GraphicalAdjustments, GraphicalAdjustmentsPerRnaComplex, GraphicalAdjustmentsPerRnaMolecule, LabelContents, LabelContentsPerRnaComplex, LabelLines, LabelLinesPerRnaComplex, parseGraphicalData } from "./ParseGraphicalData";

export enum SvgPropertyXrnaType {
  SCENE = "scene",
  RNA_COMPLEX = "rna_complex",
  RNA_MOLECULE = "rna_molecule",
  NUCLEOTIDE = "nucleotide",
  LABEL_LINE = "label_line",
  LABEL_CONTENT = "label_content",
  BASE_PAIR = "base_pair",
  PATH = "path",
  CENTERLINE = "centerline",
  TEXT_ANNOTATION = "text_annotation",
  SEQUENCE_CONNECTOR = "sequence_connector"
};
const svgPropertyXrnaDataTypes = Object.values(SvgPropertyXrnaType);

function isSvgPropertyXrnaDataType(candidateSvgPropertyXrnaDataType : string) : candidateSvgPropertyXrnaDataType is SvgPropertyXrnaType {
  return (svgPropertyXrnaDataTypes as string[]).includes(candidateSvgPropertyXrnaDataType);
}

type TemporaryBasePair = {
  rnaMoleculeName0 : string,
  rnaMoleculeName1 : string,
  formattedNucleotideIndex0 : number,
  formattedNucleotideIndex1 : number,
  basePairType : BasePair.Type,
  color? : Color,
  strokeWidth? : number
};

enum XrnaGtSvgId {
  LETTERS = "Letters",
  LABELS_LINES = "Labels_Lines",
  LABELS_TEXT = "Labels_Text",
  BASE_PAIR_LINES = "Nucleotide_Lines",
  BASE_PAIR_CIRCLES = "Nucleotide_Circles"
}

const xrnaGtSvgIds = Object.values(XrnaGtSvgId);

type Cache = {
  rnaComplexProps : Array<RnaComplex.ExternalProps>,
  graphicalAdjustments : GraphicalAdjustments,
  labelLines : LabelLines,
  labelContents : LabelContents,
  basePairLinesPerRnaComplex : BasePairLinesPerRnaComplex,
  basePairCentersPerRnaComplex : BasePairCentersPerRnaComplex,
  rnaMoleculeCount : number,
  nucleotideCount : number,
  transform : AffineMatrix,
  rnaComplexPropsByName : Record<string, RnaComplex.ExternalProps>,
  temporaryBasePairsPerRnaComplexName : Record<string, Array<TemporaryBasePair>>,
  temporaryLabelData : Record<string, Record<string, Record<number, { labelContentProps? : LabelContent.ExternalProps, labelLineProps? : LabelLine.ExternalProps }>>>,
  graphicalAdjustmentsPerRnaComplex? : GraphicalAdjustmentsPerRnaComplex,
  graphicalAdjustmentsPerRnaMolecule? : GraphicalAdjustmentsPerRnaMolecule,
  singularRnaComplexProps? : RnaComplex.ExternalProps,
  singularRnaMoleculeProps? : RnaMolecule.ExternalProps,
  singularNucleotideProps? : Nucleotide.ExternalProps,
  singularLabelLineProps? : LabelLine.ExternalProps,
  parentSvgXrnaDataType? : SvgPropertyXrnaType | undefined,
  temporaryBasePairsPerRnaComplex? : Array<TemporaryBasePair>,
  complexDocumentName? : string,
  mostRecentGroupId? : string,
  labelLinesPerRnaComplex? : LabelLinesPerRnaComplex,
  labelContentsPerRnaComplex? : LabelContentsPerRnaComplex,
  currentRnaMoleculeName? : string,
  relativeCoordinatesFlag? : boolean,
  invertYAxisFlag? : boolean
};

enum SvgFileType {
  XRNA_JS = "xrna.js",
  XRNA_GT = "xrna_gt",
  UNFORMATTED = "unformatted"
}

export const SVG_PROPERTY_XRNA_TYPE = "data-xrna_type";
export const SVG_PROPERTY_XRNA_COMPLEX_NAME = "data-xrna_rna_complex_name";
export const SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME = "data-xrna_rna_molecule_name";
export const SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX = "data-xrna_rna_molecule_first_nucleotide_index";
export const SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX = "data-xrna_formatted_nucleotide_index";
export const SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0 = "data-xrna_base_pair_rna_molecule_name_0";
export const SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1 = "data-xrna_base_pair_rna_molecule_name_1";
export const SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX = "data-xrna_base_pair_formatted_nucleotide_index";
export const SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0 = "data-xrna_base_pair_formatted_nucleotide_index_0";
export const SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1 = "data-xrna_base_pair_formatted_nucleotide_index_1";
export const SVG_PROPERTY_XRNA_BASE_PAIR_TYPE = "data-xrna_base_pair_type";
export const SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME = "data-xrna_scene_name";
export const SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG = "data-xrna_relative_coordinates_flag";
export const SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG_DEFAULT = true;
export const SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG = "data-xrna_invert_y_axis_flag";
export const SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG_DEFAULT = false;

const SVG_PROPERTY_RECTANGLE_WIDTH = "rectangle_width";
const SVG_PROPERTY_RECTANGLE_HEIGHT = "rectangle_height";

const transformRegex = /matrix\(1\s+0\s+0\s+1\s+(-?[\d.]+)\s+(-?[\d.]+)\)/;
let styles : Record<string, Record<string, Style> & { default? : Style }> & { defaults : Record<string, Style>, root? : Style } = { defaults : {} };

function parseSvgElement(svgElement : Element, cache : Cache, svgFileType : SvgFileType) {
  const dataXrnaType = svgElement.getAttribute(SVG_PROPERTY_XRNA_TYPE);
  if (dataXrnaType !== null) {
    if (!isSvgPropertyXrnaDataType(dataXrnaType)) {
      throw `Unrecognized SvgXrnaDataType "${dataXrnaType}"`;
    }
  }
  let style : Style = {
    ...styles.root
  };
  for (const _class of svgElement.classList) {
    if (_class in styles.defaults) {
      style = {
        ...style,
        ...styles.defaults[_class]
      };
    }
  }
  if (svgElement.tagName in styles) {
    const stylesPerType = styles[svgElement.tagName];
    for (const _class of svgElement.classList) {
      if (_class in stylesPerType) {
        const stylesPerTypePerClass = stylesPerType[_class];
        style = {
          ...style,
          ...stylesPerTypePerClass
        }
      }
    }
  }
  switch (svgFileType) {
    case SvgFileType.XRNA_JS : {
      if (dataXrnaType === null) {
        switch (svgElement.tagName) {
          // case "text" : {
          //   if (cache.parentSvgXrnaDataType === SvgPropertyXrnaType.NUCLEOTIDE) {
          //     const symbol = svgElement.textContent;
          //     if (symbol === null) {
          //       throw `Required SVG element property "textContent" is required.`;
          //     }
          //     if (!Nucleotide.isSymbol(symbol)) {
          //       throw `Required SVG element property "textContent" is not a supported nucleotide symbol`;
          //     }
          //     const singularNucleotideProps = cache.singularNucleotideProps as Nucleotide.ExternalProps;
          //     singularNucleotideProps.symbol = symbol;
          //     const font = structuredClone(Font.DEFAULT);
          //     singularNucleotideProps.font = font
          //     const fontStyle = svgElement.getAttribute("font-style");
          //     if (fontStyle !== null) {
          //       font.style = fontStyle;
          //     }
          //     const fontWeight = svgElement.getAttribute("font-weight");
          //     if (fontWeight !== null) {
          //       font.weight = fontWeight;
          //     }
          //     const fontFamily = svgElement.getAttribute("font-family");
          //     if (fontFamily !== null) {
          //       font.family = fontFamily;
          //     }
          //     const fontSize = svgElement.getAttribute("font-size");
          //     if (fontSize !== null) {
          //       font.size = fontSize;
          //     }
          //     const strokeWidth = svgElement.getAttribute("stroke-width");
          //     if (strokeWidth !== null) {
          //       singularNucleotideProps.strokeWidth = Number.parseFloat(strokeWidth);
          //     }
          //     const fill = svgElement.getAttribute("fill");
          //     if (fill !== null) {
          //       singularNucleotideProps.color = fromCssString(fill);
          //     }
          //   }
          //   break;
          // }
          // case "polyline" : {
          //   if (cache.parentSvgXrnaDataType === SvgPropertyXrnaType.LABEL_LINE) {
          //     const singularLabelLineProps = cache.singularLabelLineProps;
          //     if (singularLabelLineProps === undefined) {
          //       throw "cache.singularLabelLineProps should not be undefined at this point. The input SVG file is broken.";
          //     }
          //     const points = svgElement.getAttribute("points");
          //     if (points === null) {
          //       throw `Required SVG-element property "points" is missing.`;
          //     }
          //     singularLabelLineProps.points = points.split(/\s+/).map(function(pointAsText : string) {
          //       const pointRegexMatch = pointAsText.match(/(-?[\d.]+),\s*(-?[\d.]+)/);
          //       if (pointRegexMatch === null) {
          //         throw `Required SVG element property "points" does not match the expected format`;
          //       }
          //       return {
          //         x : Number.parseFloat(pointRegexMatch[1]),
          //         y : Number.parseFloat(pointRegexMatch[2])
          //       };
          //     });
          //     const stroke = svgElement.getAttribute("stroke");
          //     if (stroke !== null) {
          //       singularLabelLineProps.color = fromCssString(stroke);
          //     }
          //     const strokeWidth = svgElement.getAttribute("stroke-width");
          //     if (strokeWidth !== null) {
          //       singularLabelLineProps.strokeWidth = Number.parseFloat(strokeWidth);
          //     }
          //   }
          //   break;
          // }
        }
      } else {
        const invertYAxisFlag = cache.invertYAxisFlag ?? SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG_DEFAULT;
        switch (dataXrnaType) {
          case SvgPropertyXrnaType.SCENE : {
            const complexDocumentName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME);
            if (complexDocumentName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME}" is missing.`;
            }
            cache.complexDocumentName = complexDocumentName;
            const relativeCoordinatesFlag = svgElement.getAttribute(SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG);
            if (relativeCoordinatesFlag == null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG}" is missing.`;
            }
            cache.relativeCoordinatesFlag = relativeCoordinatesFlag === "true";
            const invertYAxisFlag = svgElement.getAttribute(SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG);
            if (invertYAxisFlag == null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG}" is missing.`;
            }
            cache.invertYAxisFlag = invertYAxisFlag === "true";
            break;
          }
          case SvgPropertyXrnaType.RNA_COMPLEX : {
            const rnaComplexName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_NAME);
            if (rnaComplexName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_NAME}" is missing.`;
            }
            cache.singularRnaComplexProps = {
              name : rnaComplexName,
              rnaMoleculeProps : {},
              basePairs : {}
            };
            const rnaComplexIndex = cache.rnaComplexProps.length;
            cache.rnaComplexPropsByName[rnaComplexName] = cache.singularRnaComplexProps;

            const labelLinesPerRnaComplex : LabelLinesPerRnaComplex = [];
            cache.labelLinesPerRnaComplex = labelLinesPerRnaComplex;
            cache.labelLines[rnaComplexIndex] = labelLinesPerRnaComplex;

            const labelContentsPerRnaComplex : LabelContentsPerRnaComplex = [];
            cache.labelContentsPerRnaComplex = labelContentsPerRnaComplex;
            cache.labelContents[rnaComplexIndex] = labelContentsPerRnaComplex;

            cache.rnaComplexProps.push(cache.singularRnaComplexProps);
            cache.temporaryBasePairsPerRnaComplex = [];
            break;
          }
          case SvgPropertyXrnaType.BASE_PAIR : {
            const rnaComplexName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_NAME);
            if (rnaComplexName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_NAME}" is missing.`;
            }
            const rnaMoleculeName0 = svgElement.getAttribute(SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0);
            if (rnaMoleculeName0 === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0}" is missing.`;
            }
            const formattedNucleotideIndex0 = svgElement.getAttribute(SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0);
            if (formattedNucleotideIndex0 === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0}" is missing.`;
            }
            const rnaMoleculeName1 = svgElement.getAttribute(SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1);
            if (rnaMoleculeName1 === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1}" is missing.`;
            }
            const formattedNucleotideIndex1 = svgElement.getAttribute(SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1);
            if (formattedNucleotideIndex1 === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1}" is missing.`;
            }
            const basePairType = svgElement.getAttribute(SVG_PROPERTY_XRNA_BASE_PAIR_TYPE);
            if (basePairType === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_BASE_PAIR_TYPE}" is missing.`;
            }
            if (!isBasePairType(basePairType)) {
              throw `Unrecognized BasePair.Type "${basePairType}"`;
            }
            const temporaryBasePair : TemporaryBasePair = {
              rnaMoleculeName0,
              formattedNucleotideIndex0 : Number.parseInt(formattedNucleotideIndex0),
              rnaMoleculeName1,
              formattedNucleotideIndex1 : Number.parseInt(formattedNucleotideIndex1),
              basePairType
            };
            const stroke = svgElement.getAttribute("stroke");
            if (stroke !== null && stroke !== "none") {
              temporaryBasePair.color = fromCssString(stroke);
            }
            const fill = svgElement.getAttribute("fill");
            if (fill !== null && fill !== "none") {
              temporaryBasePair.color = fromCssString(fill);
            }
            const strokeWidth = svgElement.getAttribute("stroke-width");
            if (strokeWidth !== null) {
              temporaryBasePair.strokeWidth = Number.parseFloat(strokeWidth);
            }
            if (!(rnaComplexName in cache.temporaryBasePairsPerRnaComplexName)) {
              cache.temporaryBasePairsPerRnaComplexName[rnaComplexName] = [];
            }
            cache.temporaryBasePairsPerRnaComplexName[rnaComplexName].push(temporaryBasePair);
            break;
          }
          case SvgPropertyXrnaType.RNA_MOLECULE : {
            const firstNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX);
            if (firstNucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX}" is missing.`;
            }
            cache.singularRnaMoleculeProps = {
              firstNucleotideIndex : Number.parseInt(firstNucleotideIndexAsString),
              nucleotideProps : {}
            };
            const rnaMoleculeName = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
            if (rnaMoleculeName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME}" is missing.`;
            }
            if (cache.singularRnaComplexProps === undefined) {
              throw "cache.singularRnaComplexProps should not be undefined at this point. The input SVG file is broken.";
            }
            cache.singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = cache.singularRnaMoleculeProps;
            break;
          }
          case SvgPropertyXrnaType.NUCLEOTIDE : {
            const rnaComplexName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_NAME);
            if (rnaComplexName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_NAME}" is missing.`;
            }
            if (!(rnaComplexName in cache.rnaComplexPropsByName)) {
              const singularRnaComplexProps = {
                name : rnaComplexName,
                rnaMoleculeProps : {},
                basePairs : {}
              };
              cache.rnaComplexPropsByName[rnaComplexName] = singularRnaComplexProps;
              cache.rnaComplexProps.push(singularRnaComplexProps);
            }
            const singularRnaComplexProps = cache.rnaComplexPropsByName[rnaComplexName];

            const rnaMoleculeName = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
            if (rnaMoleculeName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME}" is missing.`;
            }
            const firstNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX);
            if (firstNucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX}" is missing.`;
            }
            const firstNucleotideIndex = Number.parseInt(firstNucleotideIndexAsString);
            if (!(rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps)) {
              const singularRnaMoleculeProps = {
                firstNucleotideIndex,
                nucleotideProps : {}
              };
              singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
            }
            const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];

            const transform = svgElement.getAttribute("transform");
            if (transform === null) {
              throw `Required SVG-element property "transform" is missing.`;
            }
            const transformAsMatrix = parseAffineMatrix(transform);
            const nucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX);
            if (nucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX}" is missing.`;
            }
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            const symbol = svgElement.textContent;
            if (symbol === null) {
              throw `Required SVG-element property "textContent" is missing.`;
            }
            if (!Nucleotide.isSymbol(symbol)) {
              throw `"${symbol}" is not a valid nucleotide symbol.`;
            }
            let x = transformAsMatrix[4];
            let y = transformAsMatrix[5];
            if (invertYAxisFlag) {
              y *= -1;
            }
            const singularNucleotideProps : Nucleotide.ExternalProps = {
              x,
              y,
              symbol
            };
            singularRnaMoleculeProps.nucleotideProps[nucleotideIndex - firstNucleotideIndex] = singularNucleotideProps;
            const font = structuredClone(Font.DEFAULT);
            singularNucleotideProps.font = font
            const fontStyle = svgElement.getAttribute("font-style");
            if (fontStyle !== null) {
              font.style = fontStyle;
            } else if (style.style !== undefined) {
              font.style = style.style;
            }
            const fontWeight = svgElement.getAttribute("font-weight");
            if (fontWeight !== null) {
              font.weight = fontWeight;
            } else if (style.weight !== undefined) {
              font.weight = style.weight;
            }
            const fontFamily = svgElement.getAttribute("font-family");
            if (fontFamily !== null) {
              font.family = fontFamily;
            } else if (style.family !== undefined) {
              font.family = style.family;
            }
            const fontSize = svgElement.getAttribute("font-size");
            if (fontSize !== null) {
              font.size = fontSize;
            } else if (style.size !== undefined) {
              font.size = style.size;
            }
            const strokeWidth = svgElement.getAttribute("stroke-width");
            if (strokeWidth !== null) {
              singularNucleotideProps.strokeWidth = Number.parseFloat(strokeWidth);
            } else if (style.strokeWidth !== undefined) {
              singularNucleotideProps.strokeWidth = style.strokeWidth;
            }
            const fill = svgElement.getAttribute("fill");
            if (fill !== null) {
              singularNucleotideProps.color = fromCssString(fill);
            } else if (style.fill !== undefined) {
              singularNucleotideProps.color = style.fill;
            }
            // const formattedNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX);
            // if (formattedNucleotideIndexAsString === null) {
            //   throw `Required SVG-element property "${SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX}" is missing.`;
            // }
            // const formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
            // const transform = svgElement.getAttribute("transform");
            // if (transform === null) {
            //   throw `Required SVG-element property "transform" is missing.`;
            // }
            // const transformMatch = transform.match(/^translate\((-?[\d.]+), (-?[\d.]+)\)$/);
            // if (transformMatch === null) {
            //   throw `Required SVG-element property "transform" does not match the expected format`;
            // }
            // cache.singularNucleotideProps = {
            //   x : Number.parseFloat(transformMatch[1]),
            //   y : Number.parseFloat(transformMatch[2]),
            //   // This is a placeholder.
            //   symbol : Nucleotide.Symbol.A
            // };
            // const singularRnaMoleculeProps = cache.singularRnaMoleculeProps;
            // if (singularRnaMoleculeProps === undefined) {
            //   throw "cache.singularRnaMoleculeProps should not be undefined at this point. The input SVG file is broken.";
            // }
            // singularRnaMoleculeProps.nucleotideProps[formattedNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex] = cache.singularNucleotideProps;
            break;
          }
          case SvgPropertyXrnaType.LABEL_LINE : {
            const polylineChildElements = Array.from(svgElement.children).filter(function(childELement) { return childELement.tagName === "polyline"});
            if (polylineChildElements.length !== 1) {
              throw `Label-line SVG groups must have exactly one polyline child element.`;
            }
            const polylineChildElement = polylineChildElements[0];

            const pointsAttribute = polylineChildElement.getAttribute("points");
            if (pointsAttribute === null) {
              throw `Required SVG-element property "points" is missing.`;
            }
            let points = new Array<Vector2D>();
            points = pointsAttribute.split(/\s+/).map(function(pointAsText : string) {
              const pointRegexMatch = pointAsText.match(/(-?[\d.]+),\s*(-?[\d.]+)/);
              if (pointRegexMatch === null) {
                throw `Required SVG element property "points" does not match the expected format`;
              }
              let x = Number.parseFloat(pointRegexMatch[1]);
              let y = Number.parseFloat(pointRegexMatch[2]);
              if (invertYAxisFlag) {
                y *= -1;
              }
              return {
                x,
                y
              };
            });
            const stroke = svgElement.getAttribute("stroke");
            let color = BLACK;
            if (stroke !== null) {
              color = fromCssString(stroke);
            } else if (style.stroke !== undefined) {
              color = style.stroke;
            }
            let strokeWidth = DEFAULT_STROKE_WIDTH;
            const strokeWidthAttribute = svgElement.getAttribute("stroke-width");
            if (strokeWidthAttribute !== null) {
              strokeWidth = Number.parseFloat(strokeWidthAttribute);
            } else if (style.strokeWidth !== undefined) {
              strokeWidth = style.strokeWidth;
            }
            const singularLabelLineProps : LabelLine.ExternalProps = {
              points,
              color,
              strokeWidth
            };
            const rnaComplexName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_NAME);
            if (rnaComplexName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_NAME}" is missing.`;
            }
            const rnaMoleculeName = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
            if (rnaMoleculeName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME}" is missing.`;
            }
            const formattedNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX);
            if (formattedNucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX}" is missing.`;
            }
            const formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
            if (!(rnaComplexName in cache.temporaryLabelData)) {
              cache.temporaryLabelData[rnaComplexName] = {};
            }
            const temporaryLabelDataPerRnaComplexName = cache.temporaryLabelData[rnaComplexName];
            if (!(rnaMoleculeName in temporaryLabelDataPerRnaComplexName)) {
              temporaryLabelDataPerRnaComplexName[rnaMoleculeName] = {};
            }
            const temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName = temporaryLabelDataPerRnaComplexName[rnaMoleculeName];
            if (!(formattedNucleotideIndex in temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName)) {
              temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex] = {}
            }
            temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex].labelLineProps = singularLabelLineProps;
            // cache.singularLabelLineProps = singularLabelLineProps;
            // const singularNucleotideProps = cache.singularNucleotideProps;
            // if (singularNucleotideProps === undefined) {
            //   throw "cache.singularNucleotideProps should not be undefined at this point. The input SVG file is broken.";
            // }
            // singularNucleotideProps.labelLineProps = singularLabelLineProps;
            break;
          }
          case SvgPropertyXrnaType.LABEL_CONTENT : {
            const textContent = svgElement.textContent;
            if (textContent === null) {
              throw `Required SVG-element property "textContent" is missing.`;
            }
            const transform = svgElement.getAttribute("transform");
            if (transform === null) {
              throw `Required SVG-element property "transform" is missing.`;
            }
            const transformAsMatrix = parseAffineMatrix(transform);
            // const transformRegexMatch = transform.match(/^translate\((-?[\d.]+),\s+(-?[\d.]+)\)/);
            // if (transformRegexMatch === null) {
            //   throw `Required SVG-element property "transform" does not match the expected format`;
            // }
            const font = structuredClone(Font.DEFAULT);
            const fontSize = svgElement.getAttribute("font-size");
            if (fontSize !== null) {
              font.size = fontSize;
            } else if (style.size !== undefined) {
              font.size = style.size;
            }
            const fontStyle = svgElement.getAttribute("font-style");
            if (fontStyle !== null) {
              font.style = fontStyle;
            } else if (style.style !== undefined) {
              font.style = style.style;
            }
            const fontWeight = svgElement.getAttribute("font-weight");
            if (fontWeight !== null) {
              font.weight = fontWeight;
            } else if (style.weight !== undefined) {
              font.weight = style.weight;
            }
            const fontFamily = svgElement.getAttribute("font-family");
            if (fontFamily !== null) {
              font.family = fontFamily;
            } else if (style.family !== undefined) {
              font.family = style.family;
            }
            let x = transformAsMatrix[4];
            let y = transformAsMatrix[5];
            if (invertYAxisFlag) {
              y *= -1;
            }
            const labelContentProps : LabelContent.ExternalProps = {
              content : textContent,
              x,
              y,
              font
            };
            const fill = svgElement.getAttribute("fill");
            if (fill !== null) {
              labelContentProps.color = fromCssString(fill);
            } else if (style.fill !== undefined) {
              labelContentProps.color = style.fill;
            }
            const strokeWidth = svgElement.getAttribute("stroke-width");
            if (strokeWidth !== null) {
              labelContentProps.strokeWidth = Number.parseFloat(strokeWidth);
            } else if (style.strokeWidth !== undefined) {
              labelContentProps.strokeWidth = style.strokeWidth;
            }
            const rnaComplexName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_NAME);
            if (rnaComplexName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_NAME}" is missing.`;
            }
            const rnaMoleculeName = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
            if (rnaMoleculeName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME}" is missing.`;
            }
            const formattedNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX);
            if (formattedNucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX}" is missing.`;
            }
            const formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
            if (!(rnaComplexName in cache.temporaryLabelData)) {
              cache.temporaryLabelData[rnaComplexName] = {};
            }
            const temporaryLabelDataPerRnaComplexName = cache.temporaryLabelData[rnaComplexName];
            if (!(rnaMoleculeName in temporaryLabelDataPerRnaComplexName)) {
              temporaryLabelDataPerRnaComplexName[rnaMoleculeName] = {};
            }
            const temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName = temporaryLabelDataPerRnaComplexName[rnaMoleculeName];
            if (!(formattedNucleotideIndex in temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName)) {
              temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex] = {}
            }
            temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex].labelContentProps = labelContentProps;
            // const singularNucleotideProps = cache.singularNucleotideProps;
            // if (singularNucleotideProps === undefined) {
            //   throw "cache.singularNucleotideProps should not be undefined at this point. The input SVG file is broken.";
            // }
            // singularNucleotideProps.labelContentProps = labelContentProps;
            break;
          }
          case SvgPropertyXrnaType.PATH :
          case SvgPropertyXrnaType.CENTERLINE : {
            // These types are used for export/layer organization only.
            // They don't need to be imported back into the app state.
            break;
          }
          default : {
            throw `Unrecognized SvgXrnaDataType "${dataXrnaType}"`;
          }
        }
      }
      break;
    }
    case SvgFileType.XRNA_GT : {
      switch (svgElement.tagName) {
        case "g" : {
          const groupId = svgElement.getAttribute("id");
          // Replace null with undefined.
          cache.mostRecentGroupId = groupId ?? undefined;
          switch (groupId) {
            case XrnaGtSvgId.LETTERS : {
              const singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
                nucleotideProps : {},
                firstNucleotideIndex : 0
              };
              cache.rnaMoleculeCount++;
              const rnaMoleculeName = `RNA molecule #${cache.rnaMoleculeCount}`;
              cache.currentRnaMoleculeName = rnaMoleculeName;
              (cache.singularRnaComplexProps as RnaComplex.ExternalProps).rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
              const graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustmentsPerRnaComplex as GraphicalAdjustmentsPerRnaComplex;
              graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] = {};
              cache.graphicalAdjustmentsPerRnaMolecule = graphicalAdjustmentsPerRnaComplex[rnaMoleculeName];
              break;
            }
          }
          break;
        }
        case "text" : {
          switch (cache.mostRecentGroupId) {
            case XrnaGtSvgId.LETTERS : {
              const requiredAttributes = {
                id : svgElement.getAttribute("id"),
                transform : svgElement.getAttribute("transform"),
                textContent : svgElement.textContent,
                rectangleWidth : svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_WIDTH),
                rectangleHeight : svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT)
              };
              for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
                if (attributeValue === null) {
                  throw `Required SVG attribute "${attributeName}" is missing.`;
                }
              }
              const id = requiredAttributes.id as string;
              let nucleotideIndex = Number.NaN;
              if (/^-?\d+$/.test(id)) {
                nucleotideIndex = Number.parseInt(id);
              } else {
                const idRegexMatch = id.match(/^(\w+)_(\w+):(\d+)$/);
                if (idRegexMatch === null) {
                  throw `Unrecognized nucleotide-index format "${id}"`;
                }
                cache.currentRnaMoleculeName = idRegexMatch[2];
                nucleotideIndex = Number.parseInt(idRegexMatch[3]);
              }
              const textContent = (requiredAttributes.textContent as string).trim();
              if (!Nucleotide.isSymbol(textContent)) {
                throw `Unrecognized nucleotide symbol "${textContent}"`;
              }
              const transform = requiredAttributes.transform as string;
              const transformRegexMatch = transform.match(transformRegex);
              if (transformRegexMatch === null) {
                throw `Unrecognized transform format "${transform}"`;
              }
              const singularNucleotideProps : Nucleotide.ExternalProps = {
                symbol : textContent,
                x : Number.parseFloat(transformRegexMatch[1]),
                y : Number.parseFloat(transformRegexMatch[2])
              };
              const optionalAttributes = {
                fill : svgElement.getAttribute("fill"),
                fontFamily : svgElement.getAttribute("font-family"),
                fontWeight : svgElement.getAttribute("font-weight"),
                fontStyle : svgElement.getAttribute("font-style"),
                fontSize : svgElement.getAttribute("font-size")
              };
              if (optionalAttributes.fill !== null) {
                singularNucleotideProps.color = fromCssString(optionalAttributes.fill);
              }
              const font = structuredClone(Font.DEFAULT);
              singularNucleotideProps.font = font;
              if (optionalAttributes.fontFamily !== null) {
                font.family = optionalAttributes.fontFamily as string;
              }
              if (optionalAttributes.fontWeight !== null) {
                font.weight = optionalAttributes.fontWeight as string;
              }
              if (optionalAttributes.fontStyle !== null) {
                font.style = optionalAttributes.fontStyle as string;
              }
              if (optionalAttributes.fontSize !== null) {
                font.size = parseFontSize(optionalAttributes.fontSize);
              }
              const graphicalAdjustment = getGraphicalAdjustment({
                width : Number.parseFloat(requiredAttributes.rectangleWidth as string),
                height : Number.parseFloat(requiredAttributes.rectangleHeight as string)
              });
              const currentRnaMoleculeName = cache.currentRnaMoleculeName;
              if (currentRnaMoleculeName === undefined) {
                throw `cache.currentRnaMoleculeName should not be undefined at this point.`;
              }
              const rnaMoleculeProps = (cache.singularRnaComplexProps as RnaComplex.ExternalProps).rnaMoleculeProps;
              if (!(currentRnaMoleculeName in rnaMoleculeProps)) {
                const singularRnaMoleculeProps = {
                  firstNucleotideIndex : 0,
                  nucleotideProps : {}
                };
                cache.singularRnaMoleculeProps = singularRnaMoleculeProps;
                (cache.singularRnaComplexProps as RnaComplex.ExternalProps).rnaMoleculeProps[currentRnaMoleculeName] = singularRnaMoleculeProps;
                const graphicalAdjustmentsPerRnaMolecule = {};
                cache.graphicalAdjustmentsPerRnaMolecule = graphicalAdjustmentsPerRnaMolecule;
                (cache.graphicalAdjustmentsPerRnaComplex as GraphicalAdjustmentsPerRnaComplex)[currentRnaMoleculeName] = graphicalAdjustmentsPerRnaMolecule;
              }
              (cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps).nucleotideProps[nucleotideIndex] = singularNucleotideProps;
              (cache.graphicalAdjustmentsPerRnaMolecule as GraphicalAdjustmentsPerRnaMolecule)[nucleotideIndex] = graphicalAdjustment;
              break;
            }
            case XrnaGtSvgId.LABELS_TEXT : {
              const requiredAttributes = {
                transform : svgElement.getAttribute("transform"),
                textContent : svgElement.textContent,
                rectangleWidth : svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_WIDTH),
                rectangleHeight : svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT)
              }
              for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
                if (attributeValue === null) {
                  throw `Required SVG attribute "${attributeName}" is missing.`;
                }
              }
              requiredAttributes.textContent = (requiredAttributes.textContent as string).trim();
              const transform = requiredAttributes.transform as string;
              const transformRegexMatch = transform.match(transformRegex);
              if (transformRegexMatch === null) {
                throw `Unrecognized transform format ${transform}`;
              }
              const optionalAttributes = {
                fontFamily : svgElement.getAttribute("font-family"),
                fontStyle : svgElement.getAttribute("font-style"),
                fontWeight : svgElement.getAttribute("font-weight"),
                fontSize : svgElement.getAttribute("font-size"),
                color : svgElement.getAttribute("fill")
              }
              const font = structuredClone(Font.DEFAULT);
              if (optionalAttributes.fontFamily !== null) {
                font.family = optionalAttributes.fontFamily;
              }
              if (optionalAttributes.fontStyle !== null) {
                font.style = optionalAttributes.fontStyle;
              }
              if (optionalAttributes.fontWeight !== null) {
                font.weight = optionalAttributes.fontWeight;
              }
              if (optionalAttributes.fontSize !== null) {
                font.size = parseFontSize(optionalAttributes.fontSize);
              }

              let color = structuredClone(BLACK);
              if (optionalAttributes.color !== null) {
                color = fromCssString(optionalAttributes.color);
              }

              const x = Number.parseFloat(transformRegexMatch[1]);
              const y = Number.parseFloat(transformRegexMatch[2]);
              const width = Number.parseFloat(requiredAttributes.rectangleWidth as string);
              const height = Number.parseFloat(requiredAttributes.rectangleHeight as string);
              (cache.labelContentsPerRnaComplex as LabelContentsPerRnaComplex).push({
                labelContent : {
                  content : requiredAttributes.textContent as string,
                  x,
                  y,
                  font,
                  color
                },
                rectangle : {
                  width,
                  height
                }
              });
            }
          }
          break;
        }
        case "line" : {
          const requiredAttributes = {
            x1 : svgElement.getAttribute("x1"),
            y1 : svgElement.getAttribute("y1"),
            x2 : svgElement.getAttribute("x2"),
            y2 : svgElement.getAttribute("y2")
          };
          for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
            if (attributeValue === null) {
              throw `Required SVG property ${attributeName} is missing.`;
            }
          }
          const optionalAttributes = {
            color : svgElement.getAttribute("stroke"),
            strokeWidth : svgElement.getAttribute("stroke-width")
          };
          let color = BLACK;
          if (optionalAttributes.color !== null) {
            color = fromCssString(optionalAttributes.color);
          }
          let strokeWidth = DEFAULT_STROKE_WIDTH;
          if (optionalAttributes.strokeWidth !== null) {
            strokeWidth = Number.parseFloat(optionalAttributes.strokeWidth)
          }
          const v0 = {
            x : Number.parseFloat(requiredAttributes.x1 as string),
            y : Number.parseFloat(requiredAttributes.y1 as string)
          }
          const v1 = {
            x : Number.parseFloat(requiredAttributes.x2 as string),
            y : Number.parseFloat(requiredAttributes.y2 as string)
          }
          switch (cache.mostRecentGroupId) {
            case XrnaGtSvgId.BASE_PAIR_LINES : {
              cache.basePairLinesPerRnaComplex.push({
                v0,
                v1,
                basePairType : BasePair.Type.CANONICAL,
                color,
                strokeWidth
              });
              break;
            }
            case XrnaGtSvgId.LABELS_LINES : {
              (cache.labelLinesPerRnaComplex as LabelLinesPerRnaComplex).push({
                v0,
                v1,
                color,
                strokeWidth
              });
              break;
            }
          }
          break;
        }
        case "circle" : {
          if (cache.mostRecentGroupId === XrnaGtSvgId.BASE_PAIR_CIRCLES) {
            const requiredAttributes = {
              cx : svgElement.getAttribute("cx"),
              cy : svgElement.getAttribute("cy")
            };
            for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
              if (attributeValue === null) {
                throw `Required SVG attribute "${attributeName}" is missing.`;
              }
            }
            const optionalAttributes = {
              fill : svgElement.getAttribute("fill")
            };
            if (optionalAttributes.fill !== null) {
              optionalAttributes.fill = optionalAttributes.fill.trim();
            }
            const basePairType = optionalAttributes.fill === null ? BasePair.Type.MISMATCH : BasePair.Type.WOBBLE;
            cache.basePairCentersPerRnaComplex.push({
              x : Number.parseFloat(requiredAttributes.cx as string),
              y : Number.parseFloat(requiredAttributes.cy as string),
              basePairType
            });
          }
        }
      }
      break;
    }
    case SvgFileType.UNFORMATTED : {
      // TODO : Test these files!
      switch (svgElement.tagName) {
        case "circle" : {
          const requiredAttributes = {
            cx : svgElement.getAttribute("cx"),
            cy : svgElement.getAttribute("cy")
          };
          for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
            if (attributeValue === null) {
              throw `Required SVG attribute "${attributeName}" is missing.`;
            }
          }
          const optionalAttributes = {
            fill : svgElement.getAttribute("fill")
          };
          let fillAttribute = undefined;
          if (optionalAttributes.fill !== null) {
            optionalAttributes.fill = optionalAttributes.fill.trim();
            fillAttribute = fromCssString(optionalAttributes.fill);
          }
          const basePairType = optionalAttributes.fill === null ? BasePair.Type.MISMATCH : BasePair.Type.WOBBLE;
          cache.basePairCentersPerRnaComplex.push({
            x : Number.parseFloat(requiredAttributes.cx as string),
            y : Number.parseFloat(requiredAttributes.cy as string),
            basePairType,
            color : fillAttribute ?? style.fill ?? style.stroke
          });
          break;
        }
        case "text" : {
          const requiredAttributes = {
            textContent : svgElement.textContent
          };
          const textContent = (requiredAttributes.textContent as string).trim();
          for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
            if (attributeValue === null) {
              throw `Required SVG attribute "${attributeName}" is missing.`;
            }
          }
          const optionalAttributes = {
            transform : svgElement.getAttribute("transform"),
            x : svgElement.getAttribute("x"),
            y : svgElement.getAttribute("y"),
            fontFamily : svgElement.getAttribute("font-family") ?? style.family,
            fontStyle : svgElement.getAttribute("font-style") ?? style.style,
            fontWeight : svgElement.getAttribute("font-weight") ?? style.weight,
            fontSize : svgElement.getAttribute("font-size") ?? style.size,
            color : svgElement.getAttribute("fill") ?? style.fill ?? style.stroke,
            strokeWidth : svgElement.getAttribute("stroke-width") ?? style.strokeWidth
          }
          const font = structuredClone(Font.DEFAULT);
          if (optionalAttributes.fontFamily) {
            font.family = optionalAttributes.fontFamily;
          }
          if (optionalAttributes.fontStyle) {
            font.style = optionalAttributes.fontStyle;
          }
          if (optionalAttributes.fontWeight) {
            font.weight = optionalAttributes.fontWeight;
          }
          if (optionalAttributes.fontSize) {
            if (typeof optionalAttributes.fontSize == "number") {
              font.size = optionalAttributes.fontSize;
            } else {
              font.size = parseFontSize(optionalAttributes.fontSize);
            }
          }
          let color = structuredClone(BLACK);
          if (optionalAttributes.color) {
            if (typeof optionalAttributes.color == "object") {
              color = optionalAttributes.color;
            } else {
              color = fromCssString(optionalAttributes.color);
            }
          }
          let x = 0;
          let y = 0;
          if (optionalAttributes.transform !== null) {
            const transformRegexMatch = optionalAttributes.transform.match(transformRegex);
            if (transformRegexMatch !== null) {
              x = Number.parseFloat(transformRegexMatch[1]);
              y = Number.parseFloat(transformRegexMatch[2]);
            }
          }
          if (optionalAttributes.x !== null) {
            x = Number.parseFloat(optionalAttributes.x);
          }
          if (optionalAttributes.y !== null) {
            y = Number.parseFloat(optionalAttributes.y);
          }
          let strokeWidth = DEFAULT_STROKE_WIDTH;
          if (optionalAttributes.strokeWidth) {
            if (typeof optionalAttributes.strokeWidth == "number") {
              strokeWidth = optionalAttributes.strokeWidth;
            } else {
              strokeWidth = Number.parseFloat(optionalAttributes.strokeWidth);
            }
          }
          if (Nucleotide.isSymbol(textContent)) {
            const singularNucleotideProps : Nucleotide.ExternalProps = {
              x,
              y,
              symbol : textContent,
              color,
              strokeWidth,
              font
            };
            (cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps).nucleotideProps[cache.nucleotideCount] = singularNucleotideProps;
            cache.nucleotideCount++;
          } else {
            const width = svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_WIDTH);
            if (width === null) {
              throw `Required SVG property "${SVG_PROPERTY_RECTANGLE_WIDTH}" is missing.`;
            }
            const height = svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT);
            if (height === null) {
              throw `Required SVG property "${SVG_PROPERTY_RECTANGLE_HEIGHT}" is missing.`;
            }
            (cache.labelContentsPerRnaComplex as LabelContentsPerRnaComplex).push({
              labelContent : {
                x,
                y,
                content : textContent,
                font,
                color,
                strokeWidth
              },
              rectangle : {
                width : Number.parseFloat(width),
                height : Number.parseFloat(height)
              }
            });
          }
          break;
        }
        case "line" : {
          const requiredAttributes = {
            x1 : svgElement.getAttribute("x1"),
            y1 : svgElement.getAttribute("y1"),
            x2 : svgElement.getAttribute("x2"),
            y2 : svgElement.getAttribute("y2")
          };
          for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
            if (attributeValue === null) {
              throw `Required SVG property ${attributeName} is missing.`;
            }
          }
          const optionalAttributes = {
            color : svgElement.getAttribute("stroke"),
            strokeWidth : svgElement.getAttribute("stroke-width")
          };
          let color = BLACK;
          if (optionalAttributes.color !== null) {
            color = fromCssString(optionalAttributes.color);
          }
          let strokeWidth = DEFAULT_STROKE_WIDTH;
          if (optionalAttributes.strokeWidth !== null) {
            strokeWidth = Number.parseFloat(optionalAttributes.strokeWidth)
          }
          const v0 = {
            x : Number.parseFloat(requiredAttributes.x1 as string),
            y : Number.parseFloat(requiredAttributes.y1 as string)
          }
          const v1 = {
            x : Number.parseFloat(requiredAttributes.x2 as string),
            y : Number.parseFloat(requiredAttributes.y2 as string)
          }
          // Because there is no context for SVG "line" elements (whether they are base pairs or label lines), I have no choice but to treat them as both.
          cache.basePairLinesPerRnaComplex.push({
            v0,
            v1,
            basePairType : BasePair.Type.CANONICAL,
            color,
            strokeWidth
          });
          (cache.labelLinesPerRnaComplex as LabelLinesPerRnaComplex).push({
            v0,
            v1,
            color,
            strokeWidth
          });
          break;
        }
      }
      break;
    }
    default : {
      throw "Unhandled switch case.";
    }
  }
  const children = Array.from(svgElement.children);
  // Replace null with undefined.
  cache.parentSvgXrnaDataType = dataXrnaType ?? undefined;
  for (const childElement of children) {
    parseSvgElement(
      childElement,
      cache,
      svgFileType
    );
  }
  switch (dataXrnaType) {
    case SvgPropertyXrnaType.RNA_COMPLEX : {
      const singularRnaComplexProps = cache.singularRnaComplexProps as RnaComplex.ExternalProps;
      const temporaryBasePairsPerRnaComplex = cache.temporaryBasePairsPerRnaComplex as Array<TemporaryBasePair>;
      for (const temporaryBasePair of temporaryBasePairsPerRnaComplex) {
        const {
          rnaMoleculeName0,
          formattedNucleotideIndex0,
          rnaMoleculeName1,
          formattedNucleotideIndex1,
          basePairType,
          color,
          strokeWidth
        } = temporaryBasePair;
        if (!(rnaMoleculeName0 in singularRnaComplexProps.rnaMoleculeProps)) {
          throw `Missing RNA molecule with the name "${rnaMoleculeName0}"`;
        }
        const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
        const nucleotideIndex0 = formattedNucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
        if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
          throw `Missing nucleotide with the formatted index #${formattedNucleotideIndex0}`;
        }
        if (!(rnaMoleculeName1 in singularRnaComplexProps.rnaMoleculeProps)) {
          throw `Missing RNA molecule with the name "${rnaMoleculeName1}"`;
        }
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        const nucleotideIndex1 = formattedNucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
        if (!(nucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
          throw `Missing nucleotide with the formatted index #${formattedNucleotideIndex1}`;
        }
        insertBasePair(
          singularRnaComplexProps,
          rnaMoleculeName0,
          nucleotideIndex0,
          rnaMoleculeName1,
          nucleotideIndex1,
          DuplicateBasePairKeysHandler.DO_NOTHING,
          {
            basePairType,
            strokeWidth,
            color
          }
        );
      }
      break;
    }
  }
}
type Style = Partial<Font> & {
  stroke? : Color,
  strokeWidth? : number,
  fill? : Color
};

function parseStyle(styleText : string) : Style {
  const style : Style = {};
  let styleAttributes = styleText.split(";");
  styleAttributes = styleAttributes.filter(
    // Eliminate blank lines.
    styleAttribute => !styleAttribute.match(/^\s*$/)
  );
  for (const styleAttribute of styleAttributes) {
    const indicesOfColon = [...styleAttribute.matchAll(/:/g)].map(
      match => match.index
    );
    switch (indicesOfColon.length) {
      case 1 : {
        const indexOfColon = indicesOfColon[0] as number;
        const label = styleAttribute.substring(0, indexOfColon).trim();
        const datum = styleAttribute.substring(indexOfColon + 1).trim();

        switch (label) {
          case "fill" : {
            style.fill = fromCssString(datum);
            break;
          }
          case "stroke" : {
            style.stroke = fromCssString(datum);
            break;
          }
          case "stroke-width" : {
            style.strokeWidth = Number.parseFloat(datum);
            break;
          }
          case "font-size" : {
            style.size = datum;
            break;
          }
          case "font-weight": {
            style.weight = datum;
            break;
          }
          case "font-family" : {
            style.family = datum;
            break;
          }
        }
        break;
      }
      default : {
        throw "Multiple colons found within style string.";
      }
    }
  }
  return style;
}

export function svgInputFileHandler(
  inputFileContent : string
) {
  const cDataMatch = inputFileContent.match(/<!\[CDATA\[(.*)\]\]>/ms);
  styles = {
    defaults : {}
  };

  if (cDataMatch) {
    let lines = cDataMatch[1].split("\n");
    // Remove blank lines.
    lines = lines.filter(line => (!line.match(/^\s*$/)));
    for (const line of lines) {
      const lineMatch = line.match(/^\s*([\w-.]+)\s*\{(.*)\}\s*$/);
      if (!lineMatch) {
        continue;
      }
      const label = lineMatch[1];
      const indicesOfPeriod = [...label.matchAll(/\./g)].map(match => match.index);
      let type : string;
      let _class : string;
      switch (indicesOfPeriod.length) {
        case 0 : {
          type = label;
          _class = "";
          break;
        }
        case 1 : {
          const indexOfPeriod = indicesOfPeriod[0] as number;
          type = label.substring(0, indexOfPeriod);
          _class = label.substring(indexOfPeriod + 1);
          break;
        }
        default : {
          continue;
        }
      }
      const style = parseStyle(lineMatch[2]);
      switch (type) {
        case "" : {
          styles.defaults[_class] = style;
          break;
        }
        default : {
          if (!(type in styles)) {
            styles[type] = {};
          }
          const stylesPerType = styles[type];
          switch (_class) {
            case "" : {
              stylesPerType.default = style;
              break;
            }
            default : {
              stylesPerType[_class] = style;
              break;
            }
          }
          break;
        }
      }
    }
  }

  const rnaComplexProps : Array<RnaComplex.ExternalProps> = [];
  const cache : Cache = {
    rnaComplexProps,
    graphicalAdjustments : {},
    basePairLinesPerRnaComplex : [],
    basePairCentersPerRnaComplex : [],
    rnaMoleculeCount : 0,
    nucleotideCount : 0,
    labelLines : {},
    labelContents : {},
    transform : identity(),
    rnaComplexPropsByName : {},
    temporaryBasePairsPerRnaComplexName : {},
    temporaryLabelData : {}
  };
  
  let svgFileType = SvgFileType.UNFORMATTED;
  if (/data-xrna_type/.test(inputFileContent)) {
    svgFileType = SvgFileType.XRNA_JS;
  } else if (/id\s*=\s*"Letters"/.test(inputFileContent)) {
    svgFileType = SvgFileType.XRNA_GT;
    const singularRnaComplexProps : RnaComplex.ExternalProps = {
      name : "RNA complex",
      rnaMoleculeProps : {},
      basePairs : {}
    };
    const rnaComplexIndex = rnaComplexProps.length;
    rnaComplexProps.push(singularRnaComplexProps);
    cache.singularRnaComplexProps = singularRnaComplexProps;

    const labelLinesPerRnaComplex : LabelLinesPerRnaComplex = [];
    cache.labelLinesPerRnaComplex = labelLinesPerRnaComplex;
    cache.labelLines[rnaComplexIndex] = labelLinesPerRnaComplex;

    const labelContentsPerRnaComplex : LabelContentsPerRnaComplex = [];
    cache.labelContentsPerRnaComplex = labelContentsPerRnaComplex;
    cache.labelContents[rnaComplexIndex] = labelContentsPerRnaComplex;

    cache.graphicalAdjustments[rnaComplexIndex] = {};
    cache.graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustments[0];
  } else {
    svgFileType = SvgFileType.UNFORMATTED;
    const singularRnaComplexProps : RnaComplex.ExternalProps = {
      name : "RNA complex",
      rnaMoleculeProps : {},
      basePairs : {}
    };
    rnaComplexProps.push(singularRnaComplexProps);
    cache.singularRnaComplexProps = singularRnaComplexProps;
    const DEFAULT_RNA_COMPLEX_INDEX = 0;
    cache.graphicalAdjustments[DEFAULT_RNA_COMPLEX_INDEX] = {};
    cache.labelLines[DEFAULT_RNA_COMPLEX_INDEX] = [];
    cache.labelContents[DEFAULT_RNA_COMPLEX_INDEX] = [];
    cache.graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustments[DEFAULT_RNA_COMPLEX_INDEX];
    const singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
      firstNucleotideIndex : 1,
      nucleotideProps : {}
    };
    const rnaMoleculeName = "RNA molecule";
    cache.currentRnaMoleculeName = rnaMoleculeName;
    singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
    cache.singularRnaMoleculeProps = singularRnaMoleculeProps;

    cache.graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] = {};
    cache.graphicalAdjustmentsPerRnaMolecule = cache.graphicalAdjustmentsPerRnaComplex[rnaMoleculeName];

    cache.labelLinesPerRnaComplex = [];
    cache.labelContentsPerRnaComplex = [];
  }

  if ([
    SvgFileType.UNFORMATTED,
    SvgFileType.XRNA_GT
  ].includes(svgFileType)) {
    const testSpace = document.getElementById(TEST_SPACE_ID) as HTMLElement;
    testSpace.innerHTML = inputFileContent;
    for (const textElement of Array.from(testSpace.querySelectorAll("text"))) {
      const rectangle = textElement.getBBox();
      textElement.setAttribute(SVG_PROPERTY_RECTANGLE_WIDTH, `${rectangle.width}`);
      textElement.setAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT, `${rectangle.height}`);
    }
    inputFileContent = testSpace.innerHTML;
    testSpace.innerHTML = "";
  }

  const parsedElements = new DOMParser().parseFromString(inputFileContent, "image/svg+xml");
  const topLevelSvgElements = Array.from(parsedElements.children);

  const svgElement = parsedElements.querySelector("svg");
  if (!svgElement) {
    throw "No svg element was found within the input file.";
  }
  const svgStyle = parseStyle(svgElement.style.cssText);
  styles.root = svgStyle;

  for (const topLevelSvgElement of topLevelSvgElements) {
    parseSvgElement(topLevelSvgElement, cache, svgFileType);
  }

  function deleteEmptyRnaMolecules() {
    for (const singularRnaComplexProps of Object.values(rnaComplexProps)) {
      const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
      for (const [rnaMoleculeName, singularRnaMoleculeProps] of Object.entries(rnaMoleculeProps)) {
        if (Object.values(singularRnaMoleculeProps.nucleotideProps).length === 0) {
          delete rnaMoleculeProps[rnaMoleculeName];
        }
      }
    }
  }

  switch (svgFileType) {
    case SvgFileType.XRNA_JS : {
      const relativeCoordinatesFlag = cache.relativeCoordinatesFlag ?? SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG_DEFAULT;
      for (const rnaComplexName of Object.keys(cache.temporaryBasePairsPerRnaComplexName)) {
        if (!(rnaComplexName in cache.temporaryBasePairsPerRnaComplexName)) {
          throw `A base pair within the input file referenced RNA complex "${rnaComplexName}," which was not present within the input file.`;
        }
        const singularRnaComplexProps = cache.rnaComplexPropsByName[rnaComplexName];
        const temporaryBasePairs = cache.temporaryBasePairsPerRnaComplexName[rnaComplexName];
        for (const { rnaMoleculeName0, rnaMoleculeName1, formattedNucleotideIndex0, formattedNucleotideIndex1, basePairType, strokeWidth, color } of temporaryBasePairs) {
          if (!(rnaMoleculeName0 in singularRnaComplexProps.rnaMoleculeProps)) {
            throw `A base pair within the input file referenced RNA molecule "${rnaMoleculeName0}," which was not present within the RNA complex.`;
          }
          const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
          if (!(rnaMoleculeName1 in singularRnaComplexProps.rnaMoleculeProps)) {
            throw `A base pair within the input file referenced RNA molecule "${rnaMoleculeName1}," which was not present within the RNA complex.`;
          }
          const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
          insertBasePair(
            singularRnaComplexProps,
            rnaMoleculeName0,
            formattedNucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex,
            rnaMoleculeName1,
            formattedNucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex,
            DuplicateBasePairKeysHandler.DO_NOTHING,
            {
              basePairType,
              strokeWidth,
              color
            }
          );
        }
      }

      for (const rnaComplexName of Object.keys(cache.temporaryLabelData)) {
        const temporaryLabelDataPerRnaComplexName = cache.temporaryLabelData[rnaComplexName];
        if (!(rnaComplexName in cache.rnaComplexPropsByName)) {
          throw `RNA-complex name "${rnaComplexName}" was referenced by a label, but was not present in the input file.`;
        }
        const singularRnaComplexProps = cache.rnaComplexPropsByName[rnaComplexName];
        for (const rnaMoleculeName of Object.keys(temporaryLabelDataPerRnaComplexName)) {
          const temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName = temporaryLabelDataPerRnaComplexName[rnaMoleculeName];
          if (!(rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps)) {
            throw `RNA-molecule name "${rnaMoleculeName}" was referenced by a label, but was not present in the input file.`;
          }
          const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
          for (const formattedNucleotideIndexAsString of Object.keys(temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName)) {
            const formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
            const { labelLineProps, labelContentProps } = temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex];
            const nucleotideIndex = formattedNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex;
            const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
            if (labelLineProps !== undefined) {
              if (!relativeCoordinatesFlag) {
                for (const point of labelLineProps.points) {
                  point.x -= singularNucleotideProps.x;
                  point.y -= singularNucleotideProps.y;
                }
              }
              singularNucleotideProps.labelLineProps = labelLineProps;
            }
            if (labelContentProps !== undefined) {
              singularNucleotideProps.labelContentProps = labelContentProps;
              labelContentProps.x -= singularNucleotideProps.x;
              labelContentProps.y -= singularNucleotideProps.y;
            }
          }
        }
      }
      break;
    }
    case SvgFileType.XRNA_GT : {
      deleteEmptyRnaMolecules();
      for (const [rnaComplexIndexAsString, labelContentsPerRnaComplex] of Object.entries(cache.labelContents)) {
        for (const { labelContent, rectangle } of labelContentsPerRnaComplex) {
          labelContent.x -= rectangle.width * 0.125;
          labelContent.y += rectangle.height * 0.25;
        }
      }
      parseGraphicalData(
        rnaComplexProps,
        {
          0 : cache.basePairLinesPerRnaComplex
        },
        {
          0 : cache.basePairCentersPerRnaComplex
        },
        cache.graphicalAdjustments,
        cache.labelLines,
        cache.labelContents
      );
      break;
    }
    case SvgFileType.UNFORMATTED : {
      deleteEmptyRnaMolecules();
      parseGraphicalData(
        rnaComplexProps,
        {
          0 : cache.basePairLinesPerRnaComplex
        },
        {
          0 : cache.basePairCentersPerRnaComplex
        },
        cache.graphicalAdjustments,
        cache.labelLines,
        cache.labelContents
      );
      break;
    }
    default : {
      throw "Unhandled switch case.";
    }
  }

  return {
    complexDocumentName : cache.complexDocumentName ?? "Scene",
    rnaComplexProps
  };
}