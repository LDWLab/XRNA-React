import BasePair, { isBasePairType } from "../components/app_specific/BasePair";
import { LabelContent } from "../components/app_specific/LabelContent";
import { LabelLine } from "../components/app_specific/LabelLine";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { fromCssString } from "../data_structures/Color";
import Font from "../data_structures/Font";

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

export const SvgPropertyXrnaTypeExpectedTagNameRegexRecord : Record<SvgPropertyXrnaType, RegExp> = {
  [SvgPropertyXrnaType.SCENE] : /^g$/,
  [SvgPropertyXrnaType.RNA_COMPLEX] : /^g$/,
  [SvgPropertyXrnaType.RNA_MOLECULE] : /^g$/,
  [SvgPropertyXrnaType.NUCLEOTIDE] : /^g$/,
  [SvgPropertyXrnaType.LABEL_LINE] : /^g$/,
  [SvgPropertyXrnaType.LABEL_CONTENT] : /^text$/,
  [SvgPropertyXrnaType.BASE_PAIR] : /^(?:line|circle)$/
};

type TemporaryBasePair = {
  rnaMoleculeName0 : string,
  rnaMoleculeName1 : string,
  formattedNucleotideIndex0 : number,
  formattedNucleotideIndex1 : number,
  basePairType : BasePair.Type
};

type Cache = {
  rnaComplexProps : Array<RnaComplex.ExternalProps>,
  singularRnaComplexProps? : RnaComplex.ExternalProps,
  singularRnaMoleculeProps? : RnaMolecule.ExternalProps,
  singularNucleotideProps? : Nucleotide.ExternalProps,
  singularLabelLineProps? : LabelLine.ExternalProps,
  parentSvgXrnaDataType? : SvgPropertyXrnaType | undefined,
  temporaryBasePairsPerRnaComplex? : Array<TemporaryBasePair>,
  complexDocumentName? : string
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
            const temporaryBasePairsPerRnaComplex = cache.temporaryBasePairsPerRnaComplex as Array<TemporaryBasePair>;
            temporaryBasePairsPerRnaComplex.push({
              rnaMoleculeName0,
              formattedNucleotideIndex0 : Number.parseInt(formattedNucleotideIndex0),
              rnaMoleculeName1,
              formattedNucleotideIndex1 : Number.parseInt(formattedNucleotideIndex1),
              basePairType
            });
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
      // TODO: Implement this.
      break;
    }
    case SvgFileType.UNFORMATTED : {
      // TODO: Implement this.
      break;
    }
    default : {
      throw "Unrecognized SvgFileType.";
    }
  }
  const children = Array.from(svgElement.children);
  for (const childElement of children) {
    parseSvgElement(
      childElement,
      {
        ...cache,
        parentSvgXrnaDataType : dataXrnaType ?? undefined
      },
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
          basePairType
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
            basePairType
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
    rnaComplexProps
  };

  const topLevelSvgElements = Array.from(new DOMParser().parseFromString(inputFileContent, "image/svg+xml").children);
  
  let svgFileType = SvgFileType.UNFORMATTED;
  if (/data-xrna_type/.test(inputFileContent)) {
    svgFileType = SvgFileType.XRNA_JS;
  }

  for (const topLevelSvgElement of topLevelSvgElements) {
    parseSvgElement(topLevelSvgElement, cache, svgFileType);
  }
  return {
    complexDocumentName : cache.complexDocumentName ?? "Unknown",
    rnaComplexProps
  };
}