import { RnaComplexProps } from "../App";
import BasePair, { getBasePairType } from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex, isRelevantBasePairKeySetInPair } from "../components/app_specific/RnaComplex";
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

type BasePairForJsonPerRnaMolecule = {
  basePairType : BasePair.Type,
  classes : Array<string>,
  residueIndex1 : number,
  residueIndex2 : number,
  points? : Array<Vector2D>
};

type BasePairForJsonPerRnaComplex = BasePairForJsonPerRnaMolecule & {
  rnaMoleculeName1 : string,
  rnaMoleculeName2 : string
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
      const outputBasePairsPerRnaComplex = new Array<BasePairForJsonPerRnaComplex>();
      return {
        name : singularRnaComplexProps.name,
        rnaMolecules : flattenedRnaMoleculeProps.map(function([
          rnaMoleculeName,
          singularRnaMoleculeProps
        ]) {
          const outputBasePairsPerRnaMolecule = new Array<BasePairForJsonPerRnaMolecule>();
          const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
          const flattenedBasePairsPerRnaMolecule = Object.entries(basePairsPerRnaMolecule);
          for (const [nucleotideIndexAsString, basePairsPerNucleotide] of flattenedBasePairsPerRnaMolecule) {
            const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
            for (const basePairPerNucleotide of basePairsPerNucleotide) {
              if (!isRelevantBasePairKeySetInPair(
                {
                  rnaMoleculeName,
                  nucleotideIndex
                },
                basePairPerNucleotide
              )) {
                continue;
              }
              const basePairType = basePairPerNucleotide.basePairType ?? getBasePairType(
                singularRnaMoleculeProps.nucleotideProps[nucleotideIndex].symbol,
                singularRnaComplexProps.rnaMoleculeProps[basePairPerNucleotide.rnaMoleculeName].nucleotideProps[basePairPerNucleotide.nucleotideIndex].symbol
              );
              handleStrokeCss({
                strokeWidth : basePairPerNucleotide.strokeWidth ?? DEFAULT_STROKE_WIDTH,
                stroke : basePairPerNucleotide.color ?? BLACK
              });
              basePairsCssClasses[nucleotideIndex] = [
                strokeCssClassName
              ];
              const basePair = {
                basePairType,
                classes : basePairsCssClasses[nucleotideIndex],
                residueIndex1 : singularRnaMoleculeProps.firstNucleotideIndex + nucleotideIndex,
                residueIndex2 : singularRnaMoleculeProps.firstNucleotideIndex + basePairPerNucleotide.nucleotideIndex,
                points : basePairPerNucleotide.points
              };
              let rnaMoleculeName1 = rnaMoleculeName;
              let rnaMoleculeName2 = basePairPerNucleotide.rnaMoleculeName;
              if (BasePair.isRedundantLeontisWesthofType(basePair.basePairType)) {
                basePair.basePairType = BasePair.reverseDirectedTypeMap[basePair.basePairType];
                const tempRnaMoleculeName = rnaMoleculeName1;
                rnaMoleculeName1 = rnaMoleculeName2;
                rnaMoleculeName2 = tempRnaMoleculeName;
                const tempResidueIndex = basePair.residueIndex1;
                basePair.residueIndex1 = basePair.residueIndex2;
                basePair.residueIndex2 = tempResidueIndex;
              }
              if (rnaMoleculeName1 === rnaMoleculeName2) {
                outputBasePairsPerRnaMolecule.push(basePair);
              } else {
                outputBasePairsPerRnaComplex.push({
                  ...basePair,
                  rnaMoleculeName1,
                  rnaMoleculeName2
                });
              }
            }
          };
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
                  x : labelContentProps.x,
                  y : -labelContentProps.y
                };
              }
              if (labelLineProps !== undefined) {
                label.labelLine = {
                  classes : labelLineCssClasses[nucleotideIndex],
                  points : labelLineProps.points.map(function({ x, y }) {
                    return {
                      x,
                      y : -y
                    }
                  })
                };
              }
              labels.push(label);
            }
          });
          return {
            name : rnaMoleculeName,
            basePairs : outputBasePairsPerRnaMolecule,
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
                y : -singularNucleotideProps.y
              };
            })
          };
        }),
        basePairs : outputBasePairsPerRnaComplex
      };
    })
  });
}