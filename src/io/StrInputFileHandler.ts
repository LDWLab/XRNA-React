import { RnaComplexProps } from "../App";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { Line2D } from "../data_structures/Geometry";
import { parseGraphicalData } from "./ParseGraphicalData";

export function strInputFileHandler(inputFileContent : string) {
  let defaultFontSize = 4;
  let regexMatch = /basefont[^\}]*\{[^\}]+\}[^\}\d]*(\d+)[^\}]*\}/.exec(inputFileContent);
  if (regexMatch !== null) {
    defaultFontSize = Number.parseInt(regexMatch[1]);
  }
  let regexMatchAll = inputFileContent.matchAll(/(text|line)\s*\{/g);
  const nucleotideProps = new Array<Nucleotide.ExternalProps>();
  const bondLines = new Array<Line2D>();
  for (let regexMatch of regexMatchAll) {
    let openCloseBracketBalanceIndex = 1;
    let index = regexMatch.index;
    if (index === undefined) {
      throw "index should never be undefined.";
    }
    let end = index + regexMatch[0].length;
    let previousIndex = end - 1;
    while (openCloseBracketBalanceIndex > 0) {
      let incrementedPreviousIndex = previousIndex + 1;
      let indexOfNextOpenBracket = inputFileContent.indexOf("{", incrementedPreviousIndex);
      let indexOfNextCloseBracket = inputFileContent.indexOf("}", incrementedPreviousIndex);
      if (indexOfNextOpenBracket === -1) {
        if (indexOfNextCloseBracket === -1) {
          throw "This STR file is improper; it contains an unclosed bracket.";
        } else {
          previousIndex = indexOfNextCloseBracket;
          openCloseBracketBalanceIndex--;
        }
      } else if (indexOfNextCloseBracket === -1) {
        previousIndex = indexOfNextOpenBracket;
        openCloseBracketBalanceIndex++;
      } else if (indexOfNextCloseBracket < indexOfNextOpenBracket) {
        previousIndex = indexOfNextCloseBracket;
        openCloseBracketBalanceIndex--;
      } else {
        // Note: it is impossible for indexOfNextCloseBracket == indexOfNextOpenBracket.
        // Therefore, indexOfNextCloseBracket > indexOfNextOpenBracket.
        previousIndex = indexOfNextOpenBracket;
        openCloseBracketBalanceIndex++;
      }
    }
    let subcontents = inputFileContent.substring(end, previousIndex);
    let label = regexMatch[1];
    switch (label) {
      case "text" : {
        const regex = /\{\s*([\d.]+)\s+([\d.]+)\s*\}.*(A|C|G|U)\s+0\s*$/;
        const textRegexMatch = subcontents.match(regex);
        if (textRegexMatch !== null) {
          nucleotideProps.push({
            x : Number.parseFloat(textRegexMatch[1]),
            y : Number.parseFloat(textRegexMatch[2]),
            symbol : textRegexMatch[3] as Nucleotide.Symbol
          });
        }
        break;
      }
      case "line" : {
        const regex = /\{\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\}/;
        const lineRegexMatch = subcontents.match(regex);
        if (lineRegexMatch === null) {
          throw "lineRegexMatch should never be null.";
        }
        bondLines.push({
          v0 : {
            x : Number.parseFloat(lineRegexMatch[1]),
            y : Number.parseFloat(lineRegexMatch[2])
          },
          v1 : {
            x : Number.parseFloat(lineRegexMatch[3]),
            y : Number.parseFloat(lineRegexMatch[4])
          }
        });
        break;
      }
    }
  }
  // As far as I can tell, this file type encodes only a single RNA molecule.
  // Therefore, I have hardcoded a single RNA molecule within a single RNA complex.
  const singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
    firstNucleotideIndex : 1,
    nucleotideProps
  };
  const singularRnaComplexProps : RnaComplex.ExternalProps = {
    name : "Unknown",
    rnaMoleculeProps : {
      "Unknown" : singularRnaMoleculeProps
    },
    basePairs : {}
  };
  const rnaComplexProps : Array<RnaComplex.ExternalProps> = [
    singularRnaComplexProps
  ];
  parseGraphicalData(
    rnaComplexProps,
    {
      0 : bondLines
    }
  );
  return {
    complexDocumentName : "Unknown",
    rnaComplexProps
  };
}