import { TEST_SPACE_ID } from "../App";
import BasePair, { isBasePairType } from "../components/app_specific/BasePair";
import { LabelContent } from "../components/app_specific/LabelContent";
import { LabelLine } from "../components/app_specific/LabelLine";
import { Nucleotide, getGraphicalAdjustment } from "../components/app_specific/Nucleotide";
import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import Color, { fromCssString } from "../data_structures/Color";
import Font from "../data_structures/Font";
import { BasePairCenters, BasePairCentersPerRnaComplex, BasePairLines, BasePairLinesPerRnaComplex, GraphicalAdjustments, GraphicalAdjustmentsPerRnaComplex, GraphicalAdjustmentsPerRnaMolecule, parseGraphicalData } from "./ParseGraphicalData";

export enum SvgPropertyXrnaType {
  SCENE = "scene",
  RNA_COMPLEX = "rna_complex",
  RNA_MOLECULE = "rna_molecule",
  NUCLEOTIDE = "nucleotide",
  LABEL_LINE = "label_line",
  LABEL_CONTENT = "label_content",
  BASE_PAIR = "base_pair"
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
  basePairLinesPerRnaComplex : BasePairLinesPerRnaComplex,
  basePairCentersPerRnaComplex : BasePairCentersPerRnaComplex,
  rnaMoleculeCount : number,
  graphicalAdjustmentsPerRnaComplex? : GraphicalAdjustmentsPerRnaComplex,
  graphicalAdjustmentsPerRnaMolecule? : GraphicalAdjustmentsPerRnaMolecule,
  singularRnaComplexProps? : RnaComplex.ExternalProps,
  singularRnaMoleculeProps? : RnaMolecule.ExternalProps,
  singularNucleotideProps? : Nucleotide.ExternalProps,
  singularLabelLineProps? : LabelLine.ExternalProps,
  parentSvgXrnaDataType? : SvgPropertyXrnaType | undefined,
  temporaryBasePairsPerRnaComplex? : Array<TemporaryBasePair>,
  complexDocumentName? : string,
  mostRecentGroupId? : string
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
export const SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0 = "data-xrna_base_pair_formatted_nucleotide_index_0";
export const SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1 = "data-xrna_base_pair_formatted_nucleotide_index_1";
export const SVG_PROPERTY_XRNA_BASE_PAIR_TYPE = "data-xrna_base_pair_type";
export const SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME = "data-xrna_scene_name";

const SVG_PROPERTY_GRAPHICAL_ADJUSTMENT_X = "graphical_adjustment_x";
const SVG_PROPERTY_GRAPHICAL_ADJUSTMENT_Y = "graphical_adjustment_y";

function parseSvgElement(svgElement : Element, cache : Cache, svgFileType : SvgFileType) {
  const dataXrnaType = svgElement.getAttribute(SVG_PROPERTY_XRNA_TYPE);
  if (dataXrnaType !== null) {
    if (!isSvgPropertyXrnaDataType(dataXrnaType)) {
      throw `Unrecognized SvgXrnaDataType "${dataXrnaType}"`;
    }
  }
  switch (svgFileType) {
    case SvgFileType.XRNA_JS : {
      if (dataXrnaType === null) {
        switch (svgElement.tagName) {
          case "text" : {
            if (cache.parentSvgXrnaDataType === SvgPropertyXrnaType.NUCLEOTIDE) {
              const symbol = svgElement.textContent;
              if (symbol === null) {
                throw `Required SVG element property "textContent" is required.`;
              }
              if (!Nucleotide.isSymbol(symbol)) {
                throw `Required SVG element property "textContent" is not a supported nucleotide symbol`;
              }
              const singularNucleotideProps = cache.singularNucleotideProps as Nucleotide.ExternalProps;
              singularNucleotideProps.symbol = symbol;
              const font = structuredClone(Font.DEFAULT);
              singularNucleotideProps.font = font
              const fontStyle = svgElement.getAttribute("font-style");
              if (fontStyle !== null) {
                font.style = fontStyle;
              }
              const fontWeight = svgElement.getAttribute("font-weight");
              if (fontWeight !== null) {
                font.weight = fontWeight;
              }
              const fontFamily = svgElement.getAttribute("font-family");
              if (fontFamily !== null) {
                font.family = fontFamily;
              }
              const fontSize = svgElement.getAttribute("font-size");
              if (fontSize !== null) {
                font.size = fontSize;
              }
              const strokeWidth = svgElement.getAttribute("stroke-width");
              if (strokeWidth !== null) {
                singularNucleotideProps.strokeWidth = Number.parseFloat(strokeWidth);
              }
              const fill = svgElement.getAttribute("fill");
              if (fill !== null) {
                singularNucleotideProps.color = fromCssString(fill);
              }
            }
            break;
          }
          case "polyline" : {
            if (cache.parentSvgXrnaDataType === SvgPropertyXrnaType.LABEL_LINE) {
              const singularLabelLineProps = cache.singularLabelLineProps;
              if (singularLabelLineProps === undefined) {
                throw "cache.singularLabelLineProps should not be undefined at this point. The input SVG file is broken.";
              }
              const points = svgElement.getAttribute("points");
              if (points === null) {
                throw `Required SVG-element property "points" is missing.`;
              }
              singularLabelLineProps.points = points.split(/\s+/).map(function(pointAsText : string) {
                const pointRegexMatch = pointAsText.match(/(-?[\d.]+),\s*(-?[\d.]+)/);
                if (pointRegexMatch === null) {
                  throw `Required SVG element property "points" does not match the expected format`;
                }
                return {
                  x : Number.parseFloat(pointRegexMatch[1]),
                  y : Number.parseFloat(pointRegexMatch[2])
                };
              });
              const stroke = svgElement.getAttribute("stroke");
              if (stroke !== null) {
                singularLabelLineProps.color = fromCssString(stroke);
              }
              const strokeWidth = svgElement.getAttribute("stroke-width");
              if (strokeWidth !== null) {
                singularLabelLineProps.strokeWidth = Number.parseFloat(strokeWidth);
              }
            }
            break;
          }
        }
      } else {
        switch (dataXrnaType) {
          case SvgPropertyXrnaType.SCENE : {
            const complexDocumentName = svgElement.getAttribute(SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME);
            if (complexDocumentName === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME}" is missing.`;
            }
            cache.complexDocumentName = complexDocumentName;
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
            cache.rnaComplexProps.push(cache.singularRnaComplexProps);
            cache.temporaryBasePairsPerRnaComplex = [];
            break;
          }
          case SvgPropertyXrnaType.BASE_PAIR : {
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
            const singularRnaComplexProps = cache.singularRnaComplexProps;
            if (singularRnaComplexProps === undefined) {
              throw "cache.singularRnaComplexProps should not be undefined at this point. The input SVG file is broken.";
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
            const temporaryBasePairsPerRnaComplex = cache.temporaryBasePairsPerRnaComplex as Array<TemporaryBasePair>;
            temporaryBasePairsPerRnaComplex.push(temporaryBasePair);
            break;
          }
          case SvgPropertyXrnaType.RNA_MOLECULE : {
            const firstNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX);
            if (firstNucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX}" is missing.`;
            }
            cache.singularRnaMoleculeProps = {
              firstNucleotideIndex : 1,
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
            const formattedNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX);
            if (formattedNucleotideIndexAsString === null) {
              throw `Required SVG-element property "${SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX}" is missing.`;
            }
            const formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
            const transform = svgElement.getAttribute("transform");
            if (transform === null) {
              throw `Required SVG-element property "transform" is missing.`;
            }
            const transformMatch = transform.match(/^translate\((-?[\d.]+), (-?[\d.]+)\)$/);
            if (transformMatch === null) {
              throw `Required SVG-element property "transform" does not match the expected format`;
            }
            cache.singularNucleotideProps = {
              x : Number.parseFloat(transformMatch[1]),
              y : Number.parseFloat(transformMatch[2]),
              // This is a placeholder.
              symbol : Nucleotide.Symbol.A
            };
            const singularRnaMoleculeProps = cache.singularRnaMoleculeProps;
            if (singularRnaMoleculeProps === undefined) {
              throw "cache.singularRnaMoleculeProps should not be undefined at this point. The input SVG file is broken.";
            }
            singularRnaMoleculeProps.nucleotideProps[formattedNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex] = cache.singularNucleotideProps;
            break;
          }
          case SvgPropertyXrnaType.LABEL_LINE : {
            const singularLabelLineProps : LabelLine.ExternalProps = {
              points : [
                {
                  x : 0,
                  y : 0
                },
                {
                  x : 0,
                  y : 0
                }
              ]
            };
            cache.singularLabelLineProps = singularLabelLineProps;
            const singularNucleotideProps = cache.singularNucleotideProps;
            if (singularNucleotideProps === undefined) {
              throw "cache.singularNucleotideProps should not be undefined at this point. The input SVG file is broken.";
            }
            singularNucleotideProps.labelLineProps = singularLabelLineProps;
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
            const transformRegexMatch = transform.match(/^translate\((-?[\d.]+),\s+(-?[\d.]+)\)/);
            if (transformRegexMatch === null) {
              throw `Required SVG-element property "transform" does not match the expected format`;
            }
            const labelContentProps : LabelContent.ExternalProps = {
              content : textContent,
              x : Number.parseFloat(transformRegexMatch[1]),
              y : Number.parseFloat(transformRegexMatch[2])
            };
            const singularNucleotideProps = cache.singularNucleotideProps;
            if (singularNucleotideProps === undefined) {
              throw "cache.singularNucleotideProps should not be undefined at this point. The input SVG file is broken.";
            }
            const fill = svgElement.getAttribute("fill");
            if (fill !== null) {
              labelContentProps.color = fromCssString(fill);
            }
            const strokeWidth = svgElement.getAttribute("stroke-width");
            if (strokeWidth !== null) {
              labelContentProps.strokeWidth = Number.parseFloat(strokeWidth);
            }
            singularNucleotideProps.labelContentProps = labelContentProps;
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
              cache.singularRnaMoleculeProps = singularRnaMoleculeProps;
              cache.rnaMoleculeCount++;
              const rnaMoleculeName = `RNA molecule #${cache.rnaMoleculeCount}`;
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
          if (cache.mostRecentGroupId === XrnaGtSvgId.LETTERS) {
            const requiredAttributes = {
              id : svgElement.getAttribute("id"),
              transform : svgElement.getAttribute("transform"),
              textContent : svgElement.textContent,
              graphicalAdjustmentX : svgElement.getAttribute(SVG_PROPERTY_GRAPHICAL_ADJUSTMENT_X),
              graphicalAdjustmentY : svgElement.getAttribute(SVG_PROPERTY_GRAPHICAL_ADJUSTMENT_Y)
            };
            for (const [attributeName, attributeValue] of Object.entries(requiredAttributes)) {
              if (attributeValue === null) {
                throw `Required SVG attribute "${attributeName}" is missing.`;
              }
            }
            const id = requiredAttributes.id as string;
            if (!/-?\d+/.test(id)) {
              throw `Unrecognized nucleotide-index format "${id}"`;
            }
            const textContent = (requiredAttributes.textContent as string).trim();
            if (!Nucleotide.isSymbol(textContent)) {
              throw `Unrecognized nucleotide symbol "${textContent}"`;
            }
            const transform = requiredAttributes.transform as string;
            const transformRegexMatch = transform.match(/matrix\(1\s+0\s+0\s+1\s+(-?[\d.]+)\s+(-?[\d.]+)\)/);
            if (transformRegexMatch === null) {
              throw `Unrecognized transform format "${transform}"`;
            }
            const singularNucleotideProps : Nucleotide.ExternalProps = {
              symbol : textContent,
              x : Number.parseFloat(transformRegexMatch[1]),
              y : Number.parseFloat(transformRegexMatch[2])
            };
            const nucleotideIndex = Number.parseInt(id);
            (cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps).nucleotideProps[nucleotideIndex] = singularNucleotideProps;
            const optionalAttributes = {
              fill : svgElement.getAttribute("fill"),
              fontFamily : svgElement.getAttribute("font-family"),
              fontWeight : svgElement.getAttribute("font-weight"),
              fontSize : svgElement.getAttribute("font-size"),
            };
            if (optionalAttributes.fill !== null) {
              singularNucleotideProps.color = fromCssString(optionalAttributes.fill);
            }
            const font = structuredClone(Font.DEFAULT);
            singularNucleotideProps.font = font;
            if (optionalAttributes.fontSize !== null) {
              const fontSizeRegexMatch = optionalAttributes.fontSize.match(/^([\d.]+)/);
              if (fontSizeRegexMatch === null) {
                throw `Unrecognized font-size format ${optionalAttributes.fontSize}`;
              }
              font.size = Number.parseFloat(fontSizeRegexMatch[1]);
            }
            (cache.graphicalAdjustmentsPerRnaMolecule as GraphicalAdjustmentsPerRnaMolecule)[nucleotideIndex] = {
              x : Number.parseFloat(requiredAttributes.graphicalAdjustmentX as string),
              y : Number.parseFloat(requiredAttributes.graphicalAdjustmentY as string)
            };
          }
          break;
        }
        case "line" : {
          if (cache.mostRecentGroupId === XrnaGtSvgId.BASE_PAIR_LINES) {
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
            const optionalAttributes = {};
            cache.basePairLinesPerRnaComplex.push({
              v0 : {
                x : Number.parseFloat(requiredAttributes.x1 as string),
                y : Number.parseFloat(requiredAttributes.y1 as string)
              },
              v1 : {
                x : Number.parseFloat(requiredAttributes.x2 as string),
                y : Number.parseFloat(requiredAttributes.y2 as string)
              },
              basePairType : BasePair.Type.CANONICAL
            });
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
      // TODO: Implement this.
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
          DuplicateBasePairKeysHandler.THROW_ERROR,
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

export function svgInputFileHandler(
  inputFileContent : string
) {
  const rnaComplexProps : Array<RnaComplex.ExternalProps> = [];
  const cache : Cache = {
    rnaComplexProps,
    graphicalAdjustments : {},
    basePairLinesPerRnaComplex : [],
    basePairCentersPerRnaComplex : [],
    rnaMoleculeCount : 0
  };
  
  let svgFileType = SvgFileType.UNFORMATTED;
  if (/data-xrna_type/.test(inputFileContent)) {
    svgFileType = SvgFileType.XRNA_JS;
  } else if (/id\s*=\s*"Letters"/) {
    svgFileType = SvgFileType.XRNA_GT;
    const singularRnaComplexProps : RnaComplex.ExternalProps = {
      name : "RNA complex",
      rnaMoleculeProps : {},
      basePairs : {}
    };
    rnaComplexProps.push(singularRnaComplexProps);
    cache.singularRnaComplexProps = singularRnaComplexProps;
    cache.graphicalAdjustments[0] = {};
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
    cache.graphicalAdjustments[0] = {};
    cache.graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustments[0];
    const singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
      firstNucleotideIndex : 1,
      nucleotideProps : {}
    };
    const rnaMoleculeName = "RNA molecule";
    singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
    cache.singularRnaMoleculeProps = singularRnaMoleculeProps;
    cache.graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] = {};
    cache.graphicalAdjustmentsPerRnaMolecule = cache.graphicalAdjustmentsPerRnaComplex[rnaMoleculeName];
  }

  if ([
    SvgFileType.UNFORMATTED,
    SvgFileType.XRNA_GT
  ].includes(svgFileType)) {
    const testSpace = document.getElementById(TEST_SPACE_ID) as HTMLElement;
    testSpace.innerHTML = inputFileContent;
    for (const textElement of Array.from(testSpace.querySelectorAll("text"))) {
      const rectangle = textElement.getBBox();
      const graphicalAdjustment = getGraphicalAdjustment(rectangle);
      textElement.setAttribute(SVG_PROPERTY_GRAPHICAL_ADJUSTMENT_X, `${graphicalAdjustment.x}`);
      textElement.setAttribute(SVG_PROPERTY_GRAPHICAL_ADJUSTMENT_Y, `${graphicalAdjustment.y}`)
    }
    inputFileContent = testSpace.innerHTML;
  }

  const topLevelSvgElements = Array.from(new DOMParser().parseFromString(inputFileContent, "image/svg+xml").children);

  for (const topLevelSvgElement of topLevelSvgElements) {
    parseSvgElement(topLevelSvgElement, cache, svgFileType);
  }

  switch (svgFileType) {
    case SvgFileType.XRNA_JS : {
      // Do nothing.
      break;
    }
    case SvgFileType.XRNA_GT : {
      parseGraphicalData(
        rnaComplexProps,
        {
          0 : cache.basePairLinesPerRnaComplex
        },
        {
          0 : cache.basePairCentersPerRnaComplex
        },
        cache.graphicalAdjustments
      );
      break;
    }
    case SvgFileType.UNFORMATTED : {
      parseGraphicalData(
        rnaComplexProps,
        {
          0 : cache.basePairLinesPerRnaComplex
        },
        {
          0 : cache.basePairCentersPerRnaComplex
        },
        cache.graphicalAdjustments
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