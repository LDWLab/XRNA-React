import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex, insertBasePair, DuplicateBasePairKeysHandler } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import Color, { fromHexadecimal, ColorFormat } from "../data_structures/Color";
import Font, { PartialFont } from "../data_structures/Font";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";
import { XRNA_HEADER } from "../utils/xrnaHeader";
import { InputFileReader, ParsedInputFile } from "./InputUI";


export const xrnaInputFileHandler : InputFileReader = function(inputFileContent : string) {
  type ParseDomElementCache = {
    singularRnaComplexProps : RnaComplex.ExternalProps | null,
    singularRnaMoleculeProps : RnaMolecule.ExternalProps | null,
    rnaMoleculeName : string | null,
    partialBasePairs : Array<PartialBasePair>
  };
  
  type PreviousDomElementInformation = {
    tagName : string,
    referencedNucleotideIndex? : number
  };

  type PartialBasePair = {
    rnaMoleculeName : string,
    nucleotideIndex : number,
    basePairRnaMoleculeName : string,
    unnormalizedBasePairNucleotideIndex : number,
    length : number
  };

  function parseDomElement(
    domElement : Element, 
    output : ParsedInputFile, 
    previousDomElementInformation : PreviousDomElementInformation, 
    cache : ParseDomElementCache = {
      singularRnaComplexProps : null,
      singularRnaMoleculeProps : null,
      rnaMoleculeName : null,
      partialBasePairs : new Array<PartialBasePair>(), 
    }
  ) : void {
    let domElementInformation : PreviousDomElementInformation = {
      tagName : domElement.tagName
    };
    switch (domElement.tagName) {
      case "ComplexDocument": {
        output.complexDocumentName = domElement.getAttribute("Name") as string;
        break;
      }
      case "Complex": {
        cache.singularRnaComplexProps = {
          name : domElement.getAttribute("Name") as string,
          rnaMoleculeProps : {},
          basePairs : {}
        };
        output.rnaComplexProps.push(cache.singularRnaComplexProps);
        break;
      }
      case "RNAMolecule": {
        const name = domElement.getAttribute("Name") as string;
        cache.singularRnaMoleculeProps = {
          firstNucleotideIndex : 0,
          nucleotideProps : [],
        };
        cache.rnaMoleculeName = name;
        (cache.singularRnaComplexProps as RnaComplex.ExternalProps).rnaMoleculeProps[name] = cache.singularRnaMoleculeProps;
        break;
      }
      case "NucListData": {
        let singularRnaComplexProps = cache.singularRnaComplexProps as RnaComplex.ExternalProps;
        let singularRnaMoleculeProps = cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps;
        let firstNucleotideIndexAttribute = domElement.getAttribute("StartNucID");
        if (firstNucleotideIndexAttribute != null) {
          let firstNucleotideIndex = Number.parseInt(firstNucleotideIndexAttribute);
          if (Number.isNaN(firstNucleotideIndex)) {
            throw new Error(`This <NucListData>.StartNucID is a non-integer: ${firstNucleotideIndexAttribute}`);
          }
          singularRnaMoleculeProps.firstNucleotideIndex = firstNucleotideIndex;
        }
        let indexToDataTypeMap : Record<number, string> = {};
        (domElement.getAttribute("DataType") as string).split(".").forEach(function(dataType : string, index : number) {
          indexToDataTypeMap[index] = dataType;
        });
        let runningNucleotideIndex = 0;
        let nucleotideIndexToBasePairNucleotideIndexMap : Record<number, number> = {};
        let rnaMoleculeName = cache.rnaMoleculeName as string;
        for (let textContentLine of (domElement.textContent as string).split("\n")) {
          if (/^\s*$/.test(textContentLine)) {
            continue;
          }
          // This is guaranteed to be overwritten by the appropriate symbol.
          // See the <xrnaHeader> for details.
          let symbol = Nucleotide.Symbol.A;
          let nucleotideIndex : number = NaN;
          let x : number = NaN;
          let y : number = NaN;
          let basePairNucleotideIndex : number = NaN;
          textContentLine.split(/\s+/).forEach(function(data : string, index : number) {
            switch (indexToDataTypeMap[index]) {
              case "NucChar":
                if (!Nucleotide.symbols.some(function(symbolI : Nucleotide.Symbol) {
                  return data === symbolI;
                })) {
                  throw new Error(`This input NucChar is not a <Nucleotide.Symbol>: ${data}`);
                }
                symbol = data as Nucleotide.Symbol;
                break;
              case "NucID":
                nucleotideIndex = Number.parseInt(data) - singularRnaMoleculeProps.firstNucleotideIndex;
                if (Number.isNaN(nucleotideIndex)) {
                  throw new Error(`This input <NucListData>.NucID is a non-integer: ${data}`);
                }
                runningNucleotideIndex = nucleotideIndex;
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
                nucleotideIndexToBasePairNucleotideIndexMap[nucleotideIndex] = basePairNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex;
                break;
            }
          });
          if (Number.isNaN(nucleotideIndex)) {
            nucleotideIndex = runningNucleotideIndex;
          }
          runningNucleotideIndex++;
          let nucleotideProps : Nucleotide.ExternalProps = {
            symbol,
            x,
            y
          };
          if (nucleotideIndex in singularRnaMoleculeProps.nucleotideProps) {
            throw new Error(`This input <NucListData>.NucID is a duplicate: ${nucleotideIndex}`);
          }
          singularRnaMoleculeProps.nucleotideProps[nucleotideIndex] = nucleotideProps;
        }
        for (const [nucleotideIndexAsString, basePairNucleotideIndex] of Object.entries(nucleotideIndexToBasePairNucleotideIndexMap)) {
          let nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
          if (!(basePairNucleotideIndex in singularRnaMoleculeProps.nucleotideProps)) {
            throw new Error(`This <NucListData>.BPID is outside the set of expected nucleotide indices. Found ${basePairNucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex}`);
          }
          insertBasePair(
            singularRnaComplexProps,
            rnaMoleculeName,
            nucleotideIndex,
            rnaMoleculeName,
            basePairNucleotideIndex,
            DuplicateBasePairKeysHandler.THROW_ERROR
          );
        }
        break;
      }
      case "BasePairs": {
        let rnaMoleculeProps = cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps;
        let nucleotideIndexAttribute = domElement.getAttribute("nucID") as string;
        let nucleotideIndex = Number.parseInt(nucleotideIndexAttribute);
        if (Number.isNaN(nucleotideIndex)) {
          throw new Error(`This <BasePairs>.nucID is a non-integer: ${nucleotideIndexAttribute}`);
        }
        nucleotideIndex -= rnaMoleculeProps.firstNucleotideIndex;
        let basePairNucleotideIndexAttribute = domElement.getAttribute("bpNucID") as string;
        let basePairNucleotideIndex = Number.parseInt(basePairNucleotideIndexAttribute);
        if (Number.isNaN(basePairNucleotideIndex)) {
          throw new Error(`This <BasePairs>.bpNucID is a non-integer: ${basePairNucleotideIndexAttribute}`);
        }
        let lengthAttribute = domElement.getAttribute("length") as string;
        let length = Number.parseInt(lengthAttribute);
        if (Number.isNaN(length)) {
          throw new Error(`This <BasePairs>.length is a non-integer: ${lengthAttribute}`);
        }
        let rnaMoleculeName = cache.rnaMoleculeName as string;
        let basePairRnaMoleculeNameAttribute = domElement.getAttribute("bpName");
        let basePairRnaMoleculeName = basePairRnaMoleculeNameAttribute ?? rnaMoleculeName;
        cache.partialBasePairs.push({
          rnaMoleculeName,
          nucleotideIndex,
          basePairRnaMoleculeName,
          unnormalizedBasePairNucleotideIndex: basePairNucleotideIndex,
          length
        });
        break;
      }
      case "Nuc" : {
        let colorAttribute = domElement.getAttribute("Color");
        let color : Color | null = null;
        if (colorAttribute !== null) {
          color = fromHexadecimal(colorAttribute, ColorFormat.RGB);
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
        let referencedNucleotideIndices : number[] = [];
        let firstNucleotideIndex = (cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps).firstNucleotideIndex;
        let referencedNucleotideIndexAttribute = domElement.getAttribute("RefID");
        if (referencedNucleotideIndexAttribute !== null) {
          let referencedNucleotideIndex = Number.parseInt(referencedNucleotideIndexAttribute) - firstNucleotideIndex;
          if (Number.isNaN(referencedNucleotideIndex)) {
            throw new Error(`This <Nuc>.RefID is a non-integer: ${referencedNucleotideIndexAttribute}`);
          }
          referencedNucleotideIndices.push(referencedNucleotideIndex);
          domElementInformation.referencedNucleotideIndex = referencedNucleotideIndex;
        }
        let referencedNucleotideIndicesAttribute = domElement.getAttribute("RefIDs");
        if (referencedNucleotideIndicesAttribute !== null) {
          let referencedNucleotideIndicesAttributeWithoutWhitespace = referencedNucleotideIndicesAttribute.replace(/\s+/, "");
          if (!/^(-?\d+(--?\d+)?(,-?\d+(--?\d+)?)*)$/.test(referencedNucleotideIndicesAttributeWithoutWhitespace)) {
            throw new Error(`This <Nuc>.RefIDs attribute did not match the expected format: ${referencedNucleotideIndicesAttribute}`);
          }
          referencedNucleotideIndicesAttributeWithoutWhitespace.split(",").forEach(function(referencedNucleotideIndicesRange) {
            let referencedNucleotideIndicesRangeMatch = referencedNucleotideIndicesRange.match(/^(-?\d+)(?:-(-?\d+))?$/) as RegExpMatchArray;
            let referencedNucleotideIndicesStart = Number.parseInt(referencedNucleotideIndicesRangeMatch[1] as string);
            if (Number.isNaN(referencedNucleotideIndicesStart)) {
              throw new Error(`This referenced-nucleotide index is non-numeric: ${referencedNucleotideIndicesRangeMatch[1]}`);
            }
            referencedNucleotideIndicesStart -= firstNucleotideIndex;
            if (referencedNucleotideIndicesRangeMatch[2] === undefined) {
              referencedNucleotideIndices.push(Number.parseInt(referencedNucleotideIndicesRangeMatch[1] as string) - firstNucleotideIndex);
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
        }
        let rnaMoleculeProps = cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps;
        referencedNucleotideIndices.forEach(function(referencedNucleotideIndex : number) {
          let nucleotideProps : Nucleotide.ExternalProps;
          if (!(referencedNucleotideIndex in rnaMoleculeProps.nucleotideProps)) {
            throw new Error(`The referenced nucleotide index indexes a non-existent Nucleotide: ${referencedNucleotideIndex}`);
          }
          nucleotideProps = rnaMoleculeProps.nucleotideProps[referencedNucleotideIndex];
          if (color !== null) {
            nucleotideProps.color = color;
          }
          if (fontSize !== null) {
            if (nucleotideProps.font === undefined) {
              nucleotideProps.font = Font.DEFAULT;
            }
            nucleotideProps.font.size = fontSize;
          }
          if (partialFont !== null) {
            if (nucleotideProps.font === undefined) {
              nucleotideProps.font = {
                ...Font.DEFAULT,
                ...partialFont
              };
            }
          }
        });
        break;
      }
      case "LabelList": {
        switch (previousDomElementInformation.tagName) {
          case "Nuc": {
            if (previousDomElementInformation.referencedNucleotideIndex === null) {
              throw new Error(`This <Nuc> had no attribute <RefID>`);
            }
            let nucleotideProps = (cache.singularRnaMoleculeProps as RnaMolecule.ExternalProps).nucleotideProps[previousDomElementInformation.referencedNucleotideIndex as number];
            (domElement.textContent as string).split("\n").forEach(function(textContentLine : string) {
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
                  nucleotideProps.labelLineProps = {
                    points : [
                      {
                        x : x0,
                        y : y0
                      },
                      {
                        x : x1,
                        y : y1
                      }
                    ],
                    color : fromHexadecimal(textContentLineData[6] as string, ColorFormat.RGB),
                    strokeWidth
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
                  let color = fromHexadecimal(colorAsString, ColorFormat.RGB);
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
                  nucleotideProps.labelContentProps = {
                    x,
                    y,
                    content : contentMatch[1] as string,
                    color,
                    strokeWidth : DEFAULT_STROKE_WIDTH,
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
    Array.from(domElement.children).forEach(function(childElement) {
      parseDomElement(childElement, output, domElementInformation, cache);
    });
    switch (domElement.tagName) {
      case "Complex": {
        let singularRnaComplexProps = cache.singularRnaComplexProps as RnaComplex.ExternalProps;
        cache.partialBasePairs.forEach(function(partialBasePair : PartialBasePair) {
          let basePairedRnaMoleculeName = partialBasePair.basePairRnaMoleculeName;
          let basePairedRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[basePairedRnaMoleculeName];
          let normalizedBasePairedNucleotideIndex = partialBasePair.unnormalizedBasePairNucleotideIndex - basePairedRnaMoleculeProps.firstNucleotideIndex;
          for (let i = 0; i < partialBasePair.length; i++) {
            insertBasePair(
              singularRnaComplexProps,
              partialBasePair.rnaMoleculeName,
              partialBasePair.nucleotideIndex + i,
              basePairedRnaMoleculeName,
              normalizedBasePairedNucleotideIndex - i,
              DuplicateBasePairKeysHandler.THROW_ERROR
            );
          }
        });
        break;
      }
    }
  }
  if (!inputFileContent.startsWith("<!DOCTYPE")) {
    inputFileContent += XRNA_HEADER + "\n" + inputFileContent;
  }
  let output : ParsedInputFile = {
    rnaComplexProps : new Array<RnaComplex.ExternalProps>(),
    complexDocumentName : ""
  }
  Array.from(new DOMParser().parseFromString(inputFileContent, "text/xml").children).forEach(function(childElement) {
    parseDomElement(childElement, output, { tagName : "" });
  });
  return output;
};