import { RnaComplexProps } from "../App";
import BasePair, { getBasePairType } from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import Color, { toCSS, BLACK } from "../data_structures/Color";
import Font from "../data_structures/Font";
import { Vector2D } from "../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";
import { OutputFileWriter } from "./OutputUI";

type CssClassForJson = {
  ["font-family"]? : string,
  ["font-size"]? : string,
  ["font-weight"]? : string,
  ["font-style"]? : string,
  ["stroke-width"]? : string,
  stroke? : string,
  name : string
};

type BasePairTypeForJson = "canonical" | "wobble" | "mismatch";

type BasePairForJson = {
  basePairType : BasePairTypeForJson,
  classes : Array<string>,
  residueIndex1 : number,
  residueIndex2 : number
};

type LabelForJson = {
  labelContent? : {
    classes : Array<string>,
    label : string,
    x : number,
    y : number
  },
  labelLine? : {
    classes : Array<string>,
    points : Array<Vector2D>
  },
  residueIndex : number
};
  
export const jsonFileWriter : OutputFileWriter = (rnaComplexProps : RnaComplexProps) => {
  let fontCssClasses : Array<CssClassForJson> = [];
  let strokeCssClasses : Array<CssClassForJson> = [];
  let labelContentCssClasses : Record<number, Array<string>> = {};
  let labelLineCssClasses : Record<number, Array<string>> = {};
  let nucleotideCssClasses : Record<number, Array<string>> = {};
  let basePairsCssClasses : Record<number, Array<string>> = {};
  let fontCssClassName : string = "";
  function handleFontCss(font : Font) {
    let fontCssClassIndex = fontCssClasses.findIndex(cssClassForJson => cssClassForJson["font-family"] === font.family && cssClassForJson["font-size"] === `${font.size}` && cssClassForJson["font-weight"] === font.weight && cssClassForJson["font-style"] === font.style);
    if (fontCssClassIndex === -1) {
      fontCssClassName = `font#${fontCssClasses.length}`;
      fontCssClasses.push({
        name : fontCssClassName,
        ["font-family"] : font.family,
        ["font-size"] : `${font.size}`,
        ["font-weight"] : font.weight,
        ["font-style"] : font.style
      });
    } else {
      fontCssClassName = `font#${fontCssClassIndex}`;
    }
  };
  let strokeCssClassName : string = "";
  function handleStrokeCss(stroke : {strokeWidth : number | string, stroke : Color}) {
    let strokeAsText = toCSS(stroke.stroke);
    let strokeCssClassIndex = strokeCssClasses.findIndex(cssClassForJson => cssClassForJson["stroke-width"] === `${stroke.strokeWidth}` && cssClassForJson.stroke === strokeAsText);
    if (strokeCssClassIndex === -1) {
      strokeCssClassName = `stroke#${strokeCssClasses.length}`;
      strokeCssClasses.push({
        name : strokeCssClassName,
        ["stroke-width"] : `${stroke.strokeWidth}`,
        stroke : strokeAsText
      });
    } else {
      strokeCssClassName = `stroke#${strokeCssClassIndex}`;
    }
  };
  const flattenedRnaComplexProps = Object.values(rnaComplexProps);
  flattenedRnaComplexProps.forEach(singularRnaComplexProps => {
    const flattenedRnaMoleculeProps = Object.values(singularRnaComplexProps.rnaMoleculeProps);
    flattenedRnaMoleculeProps.forEach((singularRnaMoleculeProps : RnaMolecule.ExternalProps) => {
      const flattenedNucleotideProps = Object.entries(singularRnaMoleculeProps.nucleotideProps);
      flattenedNucleotideProps.forEach(([
        nucleotideIndexAsString,
        singularNucleotideProps,
      ]) => {
        let nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        handleFontCss(singularNucleotideProps.font ?? Font.DEFAULT);
        nucleotideCssClasses[nucleotideIndex] = [
          "text-" + toCSS(singularNucleotideProps.color ?? BLACK),
          fontCssClassName
        ];
        let labelContentProps = singularNucleotideProps.labelContentProps;
        if (labelContentProps !== undefined) {
          labelContentProps.x -= singularNucleotideProps.x;
          labelContentProps.y -= singularNucleotideProps.y;
          handleFontCss(labelContentProps.font ?? Font.DEFAULT);
          labelContentCssClasses[nucleotideIndex] = [
            "text-" + toCSS(labelContentProps.color ?? BLACK),
            fontCssClassName
          ];
        }
        let labelLineProps = singularNucleotideProps.labelLineProps;
        if (labelLineProps !== undefined) {
          handleStrokeCss({
            stroke : labelLineProps.color ?? BLACK,
            strokeWidth : labelLineProps.strokeWidth ?? DEFAULT_STROKE_WIDTH
          });
          labelLineCssClasses[nucleotideIndex] = [
            strokeCssClassName
          ];
        }
      });
    });
  });
  return JSON.stringify({
    classes : fontCssClasses.concat(strokeCssClasses),
    rnaComplexes : flattenedRnaComplexProps.map((singularRnaComplexProps : RnaComplex.ExternalProps) => {
      const flattenedRnaMoleculeProps = Object.entries(singularRnaComplexProps.rnaMoleculeProps);
      const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
      return {
        name : singularRnaComplexProps.name,
        rnaMolecules : flattenedRnaMoleculeProps.map(function([
          rnaMoleculeName,
          singularRnaMoleculeProps
        ]) {
          const outputBasePairs = new Array<BasePairForJson>();
          const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
          const flattenedBasePairsPerRnaMolecule = Object.entries(basePairsPerRnaMolecule);
          flattenedBasePairsPerRnaMolecule.map(function([
            nucleotideIndexAsString,
            mappedBasePairInformation
          ]) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            const inputBasePairType = mappedBasePairInformation.basePairType ?? getBasePairType(
              singularRnaMoleculeProps.nucleotideProps[nucleotideIndex].symbol,
              singularRnaComplexProps.rnaMoleculeProps[mappedBasePairInformation.rnaMoleculeName].nucleotideProps[mappedBasePairInformation.nucleotideIndex].symbol
            );
            let outputBasePairType : BasePairTypeForJson;
            switch (inputBasePairType) {
              case BasePair.Type.CANONICAL : {
                outputBasePairType = "canonical";
                break;
              }
              case BasePair.Type.MISMATCH : {
                outputBasePairType = "mismatch";
                break;
              }
              case BasePair.Type.WOBBLE : {
                outputBasePairType = "wobble";
                break;
              }
              default : {
                throw `Unrecognized basepair type: "${mappedBasePairInformation.basePairType}".`;
              }
            }
            handleStrokeCss({
              strokeWidth : mappedBasePairInformation.strokeWidth ?? DEFAULT_STROKE_WIDTH,
              stroke : mappedBasePairInformation.color ?? BLACK
            });
            basePairsCssClasses[nucleotideIndex] = [
              strokeCssClassName
            ];
            let basePair : BasePairForJson = {
              basePairType: outputBasePairType,
              classes : basePairsCssClasses[nucleotideIndex],
              residueIndex1 : singularRnaMoleculeProps.firstNucleotideIndex + nucleotideIndex,
              residueIndex2 : singularRnaMoleculeProps.firstNucleotideIndex + mappedBasePairInformation.nucleotideIndex
            };
            outputBasePairs.push(basePair);
          });
          let labels = new Array<LabelForJson>();
          const flattenedNucleotideProps = Object.entries(singularRnaMoleculeProps.nucleotideProps).map(function([
            nucleotideIndexAsString,
            singularNucleotideProps
          ]) {
            return {
              nucleotideIndex : Number.parseInt(nucleotideIndexAsString),
              singularNucleotideProps
            };
          });
          flattenedNucleotideProps.forEach(function({
            nucleotideIndex,
            singularNucleotideProps
          }) {
            let labelContentProps = singularNucleotideProps.labelContentProps;
            let labelLineProps = singularNucleotideProps.labelLineProps;
            if (labelContentProps !== undefined || labelLineProps !== undefined) {
              let label : LabelForJson = {
                residueIndex : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex
              };
              if (labelContentProps !== undefined) {
                label.labelContent = {
                  classes : labelContentCssClasses[nucleotideIndex],
                  label : labelContentProps.content,
                  x : labelContentProps.x + singularNucleotideProps.x,
                  y : labelContentProps.y + singularNucleotideProps.y
                };
              }
              if (labelLineProps !== undefined) {
                label.labelLine = {
                  classes : labelLineCssClasses[nucleotideIndex],
                  points : labelLineProps.points
                };
              }
              labels.push(label);
            }
          });
          return {
            name : rnaMoleculeName,
            basePairs: outputBasePairs,
            labels,
            sequence : flattenedNucleotideProps.map(function({
              nucleotideIndex,
              singularNucleotideProps
            }) {
              return {
                classes : nucleotideCssClasses[nucleotideIndex],
                residueIndex : nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex,
                residueName : singularNucleotideProps.symbol,
                x : singularNucleotideProps.x,
                y : singularNucleotideProps.y
              };
            })
          };
        })
      };
    })
  });
}