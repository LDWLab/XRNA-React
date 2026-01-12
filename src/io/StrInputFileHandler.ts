import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { Line2D } from "../data_structures/Geometry";
import { Vector2D } from "../data_structures/Vector2D";
import { LabelContents, LabelLine_, LabelLines, parseGraphicalData } from "./ParseGraphicalData";

export function strInputFileHandler(inputFileContent : string) {
  let defaultFontSize = 4;
  let regexMatch = /basefont[^\}]*\{[^\}]+\}[^\}\d]*(\d+)[^\}]*\}/.exec(inputFileContent);
  if (regexMatch !== null) {
    defaultFontSize = Number.parseInt(regexMatch[1]);
  }
  let regexMatchAll = inputFileContent.matchAll(/(text|line)\s*\{/g);
  const nucleotideProps = new Array<Nucleotide.ExternalProps>();
  const basePairLines = new Array<Line2D>();
  const rnaComplexIndex = 0;
  const complexDocumentName = "Scene";
  const rnaComplexName = "RNA complex";
  const rnaMoleculeName = "RNA molecule";
  // The following data structures are necessary; later on, they might become relevant to STR parsing.
  // As far as I can tell, they don't exist in this type of input file.
  const labelLines : LabelLines = {
    [rnaComplexIndex] : []
  };
  const labelContents : LabelContents = {
    [rnaComplexIndex] : []
  };
  const basePairCenters = new Array<Vector2D>();
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
        const regex = /\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\}.*([A-Za-z])\s+0\s*$/;
        const textRegexMatch = subcontents.match(regex);
        if (textRegexMatch !== null) {
          const rawSymbol = textRegexMatch[3];
          const sanitizedSymbol = Nucleotide.sanitizeSymbol(rawSymbol);
          const symbol = Nucleotide.isSymbol(sanitizedSymbol) ? sanitizedSymbol : Nucleotide.Symbol.N;
          nucleotideProps.push({
            x : Number.parseFloat(textRegexMatch[1]),
            y : Number.parseFloat(textRegexMatch[2]),
            symbol
          });
        }
        break;
      }
      case "line" : {
        const regex = /\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\}/;
        const lineRegexMatch = subcontents.match(regex);
        if (lineRegexMatch === null) {
          throw "lineRegexMatch should never be null.";
        }
        basePairLines.push({
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
    name : rnaComplexName,
    rnaMoleculeProps : {
      [rnaMoleculeName] : singularRnaMoleculeProps
    },
    basePairs : {}
  };
  const rnaComplexProps : Array<RnaComplex.ExternalProps> = [
    singularRnaComplexProps
  ];
  parseGraphicalData(
    rnaComplexProps,
    {
      [rnaComplexIndex] : basePairLines
    },
    {
      [rnaComplexIndex] : basePairCenters
    },
    {
      [rnaComplexIndex] : {
        [rnaMoleculeName] : []
      }
    },
    labelLines,
    labelContents
  );
  return {
    complexDocumentName,
    rnaComplexProps
  };
}