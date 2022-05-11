import Color from './Color';
import Font, { PartialFont } from './Font';
import { Nucleotide, NucleotideSymbol } from './Nucleotide';
import { RNAComplex } from './RNAComplex';
import { RNAMolecule } from './RNAMolecule';
import { Vector2D } from './Vector2D';
import xrnaHeader from './xrnaHeader';

type FileReaderOutput = {
  rnaComplexes : Array<RNAComplex>,
  centerX : number,
  centerY : number,
  scale : number,
  complexDocumentName : string
}

interface FileReader {
  (inputFileContent : string) : FileReaderOutput
}

type BasePairsAcrossMolecules = {
  nucleotideIndex : number,
  rnaMoleculeIndex : number,
  basePairNucleotideIndex : number,
  basePairRnaMoleculeName : string
  length : number,
};

const xrnaFileReader : FileReader = inputFileContent => {
  type ParseDomElementCache = {
    rnaComplex : RNAComplex | null,
    rnaMolecule : RNAMolecule | null,
    basePairsAcrossMolecules : Array<BasePairsAcrossMolecules> | null,
    indentation : number
  };
  type PreviousDomElementInformation = {
    tagName : string,
    referencedNucleotideIndex? : number
  };
  function parseDomElement(domElement : Element, output : FileReaderOutput, previousDomElementInformation : PreviousDomElementInformation, cache : ParseDomElementCache = {rnaComplex : null, rnaMolecule : null, basePairsAcrossMolecules : null, indentation : 0}) : void {
    let domElementInformation : PreviousDomElementInformation = {
      tagName : domElement.tagName
    };
    switch (domElement.tagName) {
      case "ComplexDocument": {
        output.complexDocumentName = domElement.getAttribute("Name") as string;
        break;
      }
      case "Complex": {
        cache.rnaComplex = new RNAComplex(domElement.getAttribute("Name") as string);
        output.rnaComplexes.push(cache.rnaComplex);
        cache.basePairsAcrossMolecules = new Array<BasePairsAcrossMolecules>();
        break;
      }
      case "RNAMolecule": {
        cache.rnaMolecule = new RNAMolecule(domElement.getAttribute("Name") as string, 0);
        (cache.rnaComplex as RNAComplex).rnaMolecules.push(cache.rnaMolecule);
        break;
      }
      case "NucListData": {
        let rnaMolecule = cache.rnaMolecule as RNAMolecule;
        let firstNucleotideIndexAttribute = domElement.getAttribute("StartNucID");
        if (firstNucleotideIndexAttribute != null) {
          let firstNucleotideIndex = Number.parseInt(firstNucleotideIndexAttribute);
          if (Number.isNaN(firstNucleotideIndex)) {
            throw new Error(`This <NucListData>.StartNucID is a non-integer: ${firstNucleotideIndexAttribute}`);
          }
          rnaMolecule.firstNucleotideIndex = firstNucleotideIndex;
        }
        let indexToDataTypeMap : Record<number, string> = {};
        (domElement.getAttribute("DataType") as string).split(".").forEach((dataType : string, index : number) => indexToDataTypeMap[index] = dataType);
        let runningNucleotideIndex = 0;
        let nucleotideIndexToBasePairNucleotideIndexMap : Record<number, number> = {};
        for (let textContentLine of (domElement.textContent as string).split("\n")) {
          if (/^\s*$/.test(textContentLine)) {
            continue;
          }
          // This is guaranteed to be overwritten by the appropriate symbol.
          // See the <xrnaHeader> for details.
          let symbol : NucleotideSymbol = "A";
          let nucleotideIndex : number = NaN;
          let x : number = NaN;
          let y : number = NaN;
          let basePairNucleotideIndex : number = NaN;
          textContentLine.split(/\s+/).forEach((data : string, index : number) => {
            switch (indexToDataTypeMap[index]) {
              case "NucChar":
                if (data !== "A" && data !== "C" && data !== "G" && data !== "U") {
                  throw new Error(`This input NucChar is not a <NucleotideSymbol>: ${data}`);
                }
                symbol = data;
                break;
              case "NucID":
                nucleotideIndex = Number.parseInt(data);
                if (Number.isNaN(nucleotideIndex)) {
                  throw new Error(`This input <NucListData>.NucID is a non-integer: ${data}`);
                }
                runningNucleotideIndex = nucleotideIndex - rnaMolecule.firstNucleotideIndex;
                break;
              case "XPos":
                x = Number.parseFloat(data);
                if (Number.isNaN(x)) {
                  throw new Error(`This input <NucListData>.XPos is not a number: ${data}`);
                }
                break;
              case "YPos":
                y = Number.parseFloat(data);
                if (Number.isNaN(y)) {
                  throw new Error(`This input <NucListData>.YPos is not a number: ${data}`);
                }
                break;
              case "FormatType":
                // The original XRNA source code does not use <FormatType>.
                break;
              case "BPID":
                basePairNucleotideIndex = Number.parseInt(data);
                if (Number.isNaN(basePairNucleotideIndex)) {
                  throw new Error(`This input <NucListData>.BPID is a non-integer: ${data}`);
                }
                nucleotideIndexToBasePairNucleotideIndexMap[nucleotideIndex] = basePairNucleotideIndex - rnaMolecule.firstNucleotideIndex;
                break;
            }
          });
          if (Number.isNaN(nucleotideIndex)) {
            nucleotideIndex = runningNucleotideIndex;
          }
          runningNucleotideIndex++;
          let nucleotide = new Nucleotide(symbol, { x, y });
          if (nucleotideIndex in rnaMolecule.nucleotidesMap) {
            throw new Error(`This input <NucListData>.NucID is a duplicate: ${nucleotideIndex}`);
          }
          rnaMolecule.nucleotidesMap[nucleotideIndex] = nucleotide;
        }
        let rnaMoleculeIndex = (cache.rnaComplex as RNAComplex).rnaMolecules.length - 1;
        for (const [nucleotideIndexAsString, basePairNucleotideIndex] of Object.entries(nucleotideIndexToBasePairNucleotideIndexMap)) {
          let nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
          let nucleotide = rnaMolecule.nucleotidesMap[nucleotideIndex] as Nucleotide;
          let basePairNucleotide = rnaMolecule.nucleotidesMap[basePairNucleotideIndex];
          if (basePairNucleotide === undefined) {
            throw new Error(`This <NucListData>.BPID is outside the set of expected nucleotide indices ${basePairNucleotideIndex + rnaMolecule.firstNucleotideIndex}`);
          }
          let basePairType = Nucleotide.getBasePairType(nucleotide.symbol, basePairNucleotide.symbol);
          if (nucleotideIndex < basePairNucleotideIndex) {
            nucleotide.basePair = {
              nucleotideIndex : basePairNucleotideIndex,
              rnaMoleculeIndex,
              type : basePairType
            };
          } else {
            basePairNucleotide.basePair = {
              nucleotideIndex,
              rnaMoleculeIndex,
              type : basePairType
            };
          }
        }
        break;
      }
      case "BasePairs": {
        let rnaMolecule = cache.rnaMolecule as RNAMolecule;
        let nucleotideIndexAttribute = domElement.getAttribute("nucID") as string;
        let nucleotideIndex = Number.parseInt(nucleotideIndexAttribute);
        if (Number.isNaN(nucleotideIndex)) {
          throw new Error(`This <BasePairs>.nucID is a non-integer: ${nucleotideIndexAttribute}`);
        }
        nucleotideIndex -= rnaMolecule.firstNucleotideIndex;
        let basePairNucleotideIndexAttribute = domElement.getAttribute("bpNucID") as string;
        let basePairNucleotideIndex = Number.parseInt(basePairNucleotideIndexAttribute);
        if (Number.isNaN(basePairNucleotideIndex)) {
          throw new Error(`This <BasePairs>.bpNucID is a non-integer: ${basePairNucleotideIndexAttribute}`);
        }
        basePairNucleotideIndex -= rnaMolecule.firstNucleotideIndex;
        let lengthAttribute = domElement.getAttribute("length") as string;
        let length = Number.parseInt(lengthAttribute);
        if (Number.isNaN(length)) {
          throw new Error(`This <BasePairs>.length is a non-integer: ${lengthAttribute}`);
        }
        let rnaMoleculeIndex = (cache.rnaComplex as RNAComplex).rnaMolecules.length - 1;
        let basePairRnaMoleculeNameAttribute = domElement.getAttribute("bpName");
        if (basePairRnaMoleculeNameAttribute === null) {
          for (let i = 0; i < length; i++) {
            let interpolatedNucleotideIndex = nucleotideIndex + i;
            let interpolatedBasePairNucleotideIndex = basePairNucleotideIndex - i;
            let nucleotide = rnaMolecule.nucleotidesMap[interpolatedNucleotideIndex] as Nucleotide;
            let basePairNucleotide = rnaMolecule.nucleotidesMap[interpolatedBasePairNucleotideIndex] as Nucleotide;
            let type = Nucleotide.getBasePairType(nucleotide.symbol, basePairNucleotide.symbol);
            nucleotide.basePair = {
              nucleotideIndex : interpolatedBasePairNucleotideIndex,
              rnaMoleculeIndex,
              type
            };
            basePairNucleotide.basePair = {
              nucleotideIndex : interpolatedNucleotideIndex,
              rnaMoleculeIndex,
              type
            };
          }
        } else {
          (cache.basePairsAcrossMolecules as Array<BasePairsAcrossMolecules>).push({
            nucleotideIndex,
            rnaMoleculeIndex,
            basePairNucleotideIndex,
            basePairRnaMoleculeName : basePairRnaMoleculeNameAttribute as string,
            length
          });
        }
        break;
      }
      case "Nuc" : {
        let firstNucleotideIndex = (cache.rnaMolecule as RNAMolecule).firstNucleotideIndex;
        let referencedNucleotideIndexAttribute = domElement.getAttribute("RefID");
        if (referencedNucleotideIndexAttribute !== null) {
          let referencedNucleotideIndex = Number.parseInt(referencedNucleotideIndexAttribute);
          if (Number.isNaN(referencedNucleotideIndex)) {
            throw new Error(`This <Nuc>.RefID is a non-integer: ${referencedNucleotideIndexAttribute}`);
          }
          domElementInformation.referencedNucleotideIndex = referencedNucleotideIndex - firstNucleotideIndex;
        }
        let referencedNucleotideIndicesAttribute = domElement.getAttribute("RefIDs");
        if (referencedNucleotideIndicesAttribute !== null) {
          let referencedNucleotideIndicesAttributeWithoutWhitespace = referencedNucleotideIndicesAttribute.replace(/\s+/, "");
          if (!/^(-?\d+(--?\d+)?(,-?\d+(--?\d+)?)*)$/.test(referencedNucleotideIndicesAttributeWithoutWhitespace)) {
            throw new Error(`This <Nuc>.RefIDs attribute did not match the expected format: ${referencedNucleotideIndicesAttribute}`);
          }
          let referencedNucleotideIndices : number[] = [];
          referencedNucleotideIndicesAttributeWithoutWhitespace.split(",").forEach(referencedNucleotideIndicesRange => {
            let referencedNucleotideIndicesRangeMatch = referencedNucleotideIndicesRange.match(/^(-?\d+)(?:-(-?\d+))?$/) as RegExpMatchArray;
            let referencedNucleotideIndicesStart = Number.parseInt(referencedNucleotideIndicesRangeMatch[1] as string);
            if (Number.isNaN(referencedNucleotideIndicesStart)) {
              throw new Error(`This referenced-nucleotide index is non-numeric: ${referencedNucleotideIndicesRangeMatch[1]}`);
            }
            referencedNucleotideIndicesStart -= firstNucleotideIndex;
            if (referencedNucleotideIndicesRangeMatch[2] === undefined) {
              referencedNucleotideIndices.push(referencedNucleotideIndices.push(Number.parseInt(referencedNucleotideIndicesRangeMatch[1] as string) - firstNucleotideIndex));
            } else {
              let referencedNucleotideIndicesEnd = Number.parseInt(referencedNucleotideIndicesRangeMatch[2] as string);
              if (Number.isNaN(referencedNucleotideIndicesEnd)) {
                throw new Error(`This referenced-nucleotide index is non-numeric: ${referencedNucleotideIndicesEnd}`);
              }
              referencedNucleotideIndicesEnd -= firstNucleotideIndex;
              if (referencedNucleotideIndicesStart > referencedNucleotideIndicesEnd) {
                let swapHelper = referencedNucleotideIndicesStart;
                referencedNucleotideIndicesStart = referencedNucleotideIndicesEnd;
                referencedNucleotideIndicesEnd = swapHelper;
              }
              for (let i = referencedNucleotideIndicesStart; i < referencedNucleotideIndicesEnd; i++) {
                referencedNucleotideIndices.push(i);
              }
            }
          });
          let colorAttribute = domElement.getAttribute("Color");
          let color : Color | null = null;
          if (colorAttribute !== null) {
            color = Color.fromHexadecimal(colorAttribute, "rgb");
          }
          let fontIdAttribute = domElement.getAttribute("FontID");
          let partialFont : PartialFont | null = null;
          if (fontIdAttribute !== null) {
            let fontId = Number.parseInt(fontIdAttribute);
            if (Number.isNaN(fontId)) {
              throw new Error(`This <Nuc>.FontID attribute is non-integer: ${fontIdAttribute}`);
            }
            partialFont = PartialFont.fromFontId(fontId);
          }
          let fontSizeAttribute = domElement.getAttribute("FontSize");
          let fontSize : number | null = null;
          if (fontSizeAttribute !== null) {
            fontSize = Number.parseFloat(fontSizeAttribute);
            if (Number.isNaN(fontSize)) {
              throw new Error(`This <Nuc>.FontSize attribute is non-numeric: ${fontSizeAttribute}`);
            }
          }
          let rnaMolecule = cache.rnaMolecule as RNAMolecule;
          referencedNucleotideIndices.forEach((referencedNucleotideIndex : number) => {
            let nucleotide = rnaMolecule.nucleotidesMap[referencedNucleotideIndex];
            if (nucleotide === undefined) {
              throw new Error(`This referenced-nucleotide index indexes a non-existent Nucleotide: ${referencedNucleotideIndex}`);
            }
            if (color !== null) {
              nucleotide.color = color;
            }
            if (fontSize !== null) {
              nucleotide.font.size = fontSize;
            }
            if (partialFont !== null) {
              nucleotide.font = Font.fromPartialFont(partialFont, nucleotide.font.size);
            }
          });
        }
        break;
      }
      case "LabelList": {
        switch (previousDomElementInformation.tagName) {
          case "Nuc": {
            if (previousDomElementInformation.referencedNucleotideIndex === null) {
              throw new Error(`This <Nuc> had no attribute <RefID>`);
            }
            let nucleotide = (cache.rnaMolecule as RNAMolecule).nucleotidesMap[previousDomElementInformation.referencedNucleotideIndex as number] as Nucleotide;
            (domElement.textContent as string).split("\n").forEach((textContentLine : string) => {
              let textContentLineData = textContentLine.trim().split(/\s+/);
              switch (textContentLineData[0]) {
                case "l": {
                  if (textContentLineData.length < 7) {
                    throw new Error("This <LabelList> label-line line has too few entries.");
                  }
                  let x0AsString = textContentLineData[1] as string;
                  let y0AsString = textContentLineData[2] as string;
                  let x1AsString = textContentLineData[3] as string;
                  let y1AsString = textContentLineData[4] as string;
                  let strokeWidthAsString = textContentLineData[5] as string;
                  let x0 = Number.parseFloat(x0AsString);
                  let y0 = Number.parseFloat(y0AsString);
                  let x1 = Number.parseFloat(x1AsString);
                  let y1 = Number.parseFloat(y1AsString);
                  let strokeWidth = Number.parseFloat(strokeWidthAsString);
                  if (Number.isNaN(x0)) {
                    throw new Error(`This <LabelList> label-line line has a non-numeric x0 value: ${x0AsString}`);
                  }
                  if (Number.isNaN(y0)) {
                    throw new Error(`This <LabelList> label-line line has a non-numeric y0 value: ${y0AsString}`);
                  }
                  if (Number.isNaN(x1)) {
                    throw new Error(`This <LabelList> label-line line has a non-numeric x1 value: ${x1AsString}`);
                  }
                  if (Number.isNaN(y1)) {
                    throw new Error(`This <LabelList> label-line line has a non-numeric y1 value: ${y1AsString}`);
                  }
                  if (Number.isNaN(strokeWidth)) {
                    throw new Error(`This <LabelList> label-line line has a non-numeric strokeWidth value: ${strokeWidthAsString}`)
                  }
                  nucleotide.labelLine = {
                    endpoint0 : new Vector2D(x0, y0),
                    endpoint1 : new Vector2D(x1, y1),
                    strokeWidth,
                    color : Color.fromHexadecimal(textContentLineData[6] as string, "rgb")
                  };
                  break;
                }
                case "s": {
                  if (textContentLineData.length < 8) {
                    throw new Error(`This <LabelList> label-content line has too few entries.`);
                  }
                  let xAsString = textContentLineData[1] as string;
                  let yAsString = textContentLineData[2] as string;
                  let fontSizeAsString = textContentLineData[4] as string;
                  let fontIdAsString = textContentLineData[5] as string;
                  let colorAsString = textContentLineData[6] as string;
                  let contentAsWrappedString = textContentLineData[7] as string;
                  let x = Number.parseFloat(xAsString);
                  let y = Number.parseFloat(yAsString);
                  let fontSize = Number.parseFloat(fontSizeAsString);
                  let fontId = Number.parseInt(fontIdAsString);
                  let color = Color.fromHexadecimal(colorAsString, "rgb");
                  let contentMatch = contentAsWrappedString.match(/^"(.*)"$/);
                  if (Number.isNaN(x)) {
                    throw new Error(`This <LabelList> label-content line has a non-numeric x value: ${xAsString}`);
                  }
                  if (Number.isNaN(y)) {
                    throw new Error(`This <LabelList> label-content line has a non-numeric y value: ${yAsString}`);
                  }
                  if (Number.isNaN(fontSize)) {
                    throw new Error(`This <LabelList> label-content line has a non-numeric fontSize value: ${fontSizeAsString}`);
                  }
                  if (Number.isNaN(fontId)) {
                    throw new Error(`This <LabelList> label-content line has a non-numeric fontId value: ${fontIdAsString}`);
                  }
                  if (contentMatch === null) {
                    throw new Error(`This <LabelList> label-content line has a content value with an unrecognized format: ${contentAsWrappedString}`);
                  }
                  nucleotide.labelContent = {
                    position : new Vector2D(x, y),
                    content : contentMatch[1] as string,
                    color,
                    font : Font.fromFontId(fontId, fontSize)
                  };
                  break;
                }
              }
            });
            break;
          }
        }
      }
    }
    Array.from(domElement.children).forEach(childElement => {
      cache.indentation++;
      parseDomElement(childElement, output, domElementInformation, cache);
      cache.indentation--;
    });
    switch (domElement.tagName) {
      case "ComplexDocument": {
        break;
      }
      case "Complex": {
        (cache.basePairsAcrossMolecules as BasePairsAcrossMolecules[]).forEach((basePairsAcrossMolecules : BasePairsAcrossMolecules) => {
          let rnaComplex = cache.rnaComplex as RNAComplex;
          let basePairRnaMoleculeIndex = rnaComplex.rnaMolecules.findIndex((rnaMolecule : RNAMolecule) => rnaMolecule.name === basePairsAcrossMolecules.basePairRnaMoleculeName);
          let comparison = basePairsAcrossMolecules.rnaMoleculeIndex - basePairRnaMoleculeIndex;
          if (comparison === 0) {
            comparison = basePairsAcrossMolecules.nucleotideIndex - basePairsAcrossMolecules.basePairNucleotideIndex;
          }
          for (let i = 0; i < basePairsAcrossMolecules.length; i++) {
            let interpolatedNucleotideIndex = basePairsAcrossMolecules.nucleotideIndex + i;
            let interpolatedBasePairNucleotideIndex = basePairsAcrossMolecules.basePairNucleotideIndex - i;
            let nucleotide = (rnaComplex.rnaMolecules[basePairsAcrossMolecules.rnaMoleculeIndex] as RNAMolecule).nucleotidesMap[interpolatedNucleotideIndex] as Nucleotide;
            let basePairNucleotide = (rnaComplex.rnaMolecules[basePairRnaMoleculeIndex] as RNAMolecule).nucleotidesMap[interpolatedBasePairNucleotideIndex] as Nucleotide;
            let type = Nucleotide.getBasePairType(nucleotide.symbol, basePairNucleotide.symbol);
            if (comparison < 0) {
              nucleotide.basePair = {
                rnaMoleculeIndex : basePairRnaMoleculeIndex,
                nucleotideIndex : interpolatedBasePairNucleotideIndex,
                type
              };
            } else {
              basePairNucleotide.basePair = {
                rnaMoleculeIndex : basePairsAcrossMolecules.rnaMoleculeIndex,
                nucleotideIndex : interpolatedNucleotideIndex,
                type
              }
            }
          }
        });
        break;
      }
      case "RNAMolecule": {
        break;
      }
    }
  }
  if (!inputFileContent.startsWith("<!DOCTYPE")) {
    inputFileContent += xrnaHeader + "\n" + inputFileContent;
  }
  let output = {
    rnaComplexes : new Array<RNAComplex>(),
    centerX : 0,
    centerY : 0,
    scale : 1,
    complexDocumentName : ""
  }
  Array.from(new DOMParser().parseFromString(inputFileContent, "text/xml").children).forEach(childElement => {
    parseDomElement(childElement, output, { tagName : "" });
  });
  return output;
};

const inputFileReaders : Record<string, FileReader> = {
  "xrna" : xrnaFileReader,
  "xml" : xrnaFileReader,
  "ps" : xrnaFileReader,
  "ss" : xrnaFileReader,
  "str" : (_ : string) => {
    return {
      rnaComplexes : [],
      centerX : 0,
      centerY : 0,
      scale : 1,
      complexDocumentName : ""
    };
  },
  "svg" : (_ : string) => {
    return {
      rnaComplexes : [],
      centerX : 0,
      centerY : 0,
      scale : 1,
      complexDocumentName : ""
    };
  },
  "json" : (_ : string) => {
    return {
      rnaComplexes : [],
      centerX : 0,
      centerY : 0,
      scale : 1,
      complexDocumentName : ""
    };
  }
};

export type { FileReader };
export default inputFileReaders;