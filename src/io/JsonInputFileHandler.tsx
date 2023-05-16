import BasePair from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex, insertBasePair, DuplicateBasePairKeysHandler } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { fromCssString, BLACK } from "../data_structures/Color";
import Font from "../data_structures/Font";
import { subtract } from "../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";
import { ParsedInputFile, InputFileReader } from "./InputUI";

export function jsonObjectHandler(parsedJson : any, invertYAxis = true) : ParsedInputFile {
    if (!("classes" in parsedJson) || !("rnaComplexes" in parsedJson)) {
      throw "Input Json should have \"classes\" and \"rnaComplexes\" variables.";
    }
    let rnaComplexProps : Array<RnaComplex.ExternalProps> = [];
    let complexDocumentName = "Unknown";
    let cssClasses = parsedJson.classes as Array<any>;
    rnaComplexProps = (parsedJson.rnaComplexes as Array<any>).map((inputRnaComplex : any, inputRnaComplexIndex : number) => {
      if (!("name" in inputRnaComplex) || !("rnaMolecules" in inputRnaComplex)) {
        throw "Input rnaComplex elements of input Json should have \"name\" and \"rnaMolecules\" variables."
      }
      const singularRnaComplexProps : RnaComplex.ExternalProps = {
        name : "",
        rnaMoleculeProps : {},
        basePairs : {}
      };
      singularRnaComplexProps.name = inputRnaComplex.name;
      singularRnaComplexProps.rnaMoleculeProps = {};
      (inputRnaComplex.rnaMolecules as Array<any>).forEach((inputRnaMolecule : any) => {
        if (!("name" in inputRnaMolecule) || !("basePairs" in inputRnaMolecule) || !("labels" in inputRnaMolecule) || !("sequence" in inputRnaMolecule)) {
          throw "Input rnaMolecule elements of input Json should have \"name\", \"sequence\", \"basePairs\", \"labels\" variables."
        }
        let singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
          firstNucleotideIndex : Number.MAX_VALUE,
          nucleotideProps : []
        };
        const rnaMoleculeName = inputRnaMolecule.name;
        singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
        (inputRnaMolecule.sequence as Array<any>).forEach(inputSequenceEntry => {
          if (!("classes" in inputSequenceEntry) || !("residueIndex" in inputSequenceEntry) || !("x" in inputSequenceEntry) || !("y" in inputSequenceEntry) || !("residueName" in inputSequenceEntry)) {
            throw "Input sequence elements of input Json should have \"classes\", \"residueIndex\", \"residueName\", \"x\" and \"y\" variables.";
          }
          let nucleotideIndex = Number.parseInt(inputSequenceEntry.residueIndex);
          if (nucleotideIndex < singularRnaMoleculeProps.firstNucleotideIndex) {
            singularRnaMoleculeProps.firstNucleotideIndex = nucleotideIndex;
          }
        });
        (inputRnaMolecule.sequence as Array<any>).forEach(inputSequenceEntry => {
          let nucleotideIndex = Number.parseInt(inputSequenceEntry.residueIndex) - singularRnaMoleculeProps.firstNucleotideIndex;
          let singularNucleotideProps : Nucleotide.ExternalProps = {
            symbol : inputSequenceEntry.residueName as Nucleotide.Symbol,
            x : Number.parseFloat(inputSequenceEntry.x),
            y : Number.parseFloat(inputSequenceEntry.y)
          };
          singularRnaMoleculeProps.nucleotideProps[nucleotideIndex] = singularNucleotideProps;
          (inputSequenceEntry.classes as Array<string>).forEach(className => {
            let cssClass = cssClasses.find(cssClass => cssClass.name === className);
            if (cssClass !== undefined) {
              Object.entries(cssClass).forEach(cssClassData => {
                switch (cssClassData[0]) {
                  case "font-family" : {
                    (singularNucleotideProps.font ?? Font.DEFAULT).family = cssClassData[1] as string;
                    break;
                  }
                  case "font-size" : {
                    (singularNucleotideProps.font ?? Font.DEFAULT).size = cssClassData[1] as string;
                    break;
                  }
                  case "font-weight" : {
                    (singularNucleotideProps.font ?? Font.DEFAULT).weight = cssClassData[1] as string;
                    break;
                  }
                  case "font-style" : {
                    (singularNucleotideProps.font ?? Font.DEFAULT).style = cssClassData[1] as string;
                    break;
                  }
                }
              });
            } else if (className.startsWith("text-")) {
              singularNucleotideProps.color = fromCssString(className.substring("text-".length));
            }
          });
        });
        (inputRnaMolecule.labels as Array<any>).forEach(label => {
          if (!("residueIndex" in label)) {
            throw "Input label elements of input Json should have a \"residueIndex\" variable."
          }
          let nucleotideProps = singularRnaMoleculeProps.nucleotideProps[Number.parseInt(label.residueIndex) - singularRnaMoleculeProps.firstNucleotideIndex];
          if ("labelContent" in label) {
            let font = Font.DEFAULT;
            let color = BLACK;
            (label.labelContent.classes as Array<any>).forEach(labelClassName => {
              let cssClass = cssClasses.find(cssClass => cssClass.name === labelClassName);
              if (cssClass !== undefined) {
                Object.entries(cssClass).forEach(cssClassEntry => {
                  switch (cssClassEntry[0]) {
                    case "font-family" : {
                      font.family = cssClassEntry[1] as string;
                      break;
                    }
                    case "font-size" : {
                      font.size = cssClassEntry[1] as string;
                      break;
                    }
                    case "font-weight" : {
                      font.weight = cssClassEntry[1] as string;
                      break;
                    }
                    case "font-style" : {
                      font.style = cssClassEntry[1] as string;
                      break;
                    }
                  }
                });
              } else if (labelClassName.startsWith("text-")) {
                color = fromCssString(labelClassName.substring("text-".length));
              }
            });
            nucleotideProps.labelContentProps = {
              ...subtract({
                x : Number.parseFloat(label.labelContent.x),
                y : Number.parseFloat(label.labelContent.y)
              }, nucleotideProps),
              content : label.labelContent.label,
              font,
              color,
              strokeWidth : DEFAULT_STROKE_WIDTH
            };
          }
          if ("labelLine" in label) {
            let labelLine = label.labelLine;
            let color = BLACK;
            let strokeWidth = DEFAULT_STROKE_WIDTH;
            if (!("x1" in labelLine) || !("y1" in labelLine) || !("x2" in labelLine) || !("y2" in labelLine) || !("classes" in labelLine)) {
              throw "Input label-line elements should have \"x1\", \"y1\", \"x2\", \"y2\" and \"classes\" variables."
            }
            (labelLine.classes as Array<any>).forEach(className => {
              let cssClass = cssClasses.find(cssClass => cssClass.name === className);
              if (cssClass !== undefined) {
                Object.entries(cssClass).forEach(cssClassData => {
                  switch (cssClassData[0]) {
                    case "stroke" : {
                      color = fromCssString(cssClassData[1] as string);
                      break;
                    }
                    case "stroke-width" : {
                      strokeWidth = Number.parseFloat(cssClassData[1] as string);
                      break;
                    }
                  }
                });
              }
            });
            const endpoint0 = subtract({
              x : Number.parseFloat(labelLine.x1),
              y : Number.parseFloat(labelLine.y1)
            }, nucleotideProps);
            const endpoint1 = subtract({
              x : Number.parseFloat(labelLine.x2),
              y : Number.parseFloat(labelLine.y2)
            }, nucleotideProps);
            nucleotideProps.labelLineProps = {
              x0 : endpoint0.x,
              y0 : endpoint0.y,
              x1 : endpoint1.x,
              y1 : endpoint1.y,
              color,
              strokeWidth
            };
          }
        });
        (inputRnaMolecule.basePairs as Array<any>).forEach(basePair => {
          if (!("basePairType" in basePair) || !("residueIndex1" in basePair) || !("residueIndex2" in basePair) || !("classes" in basePair)) {
            throw "Input basePairs elements of input Json should have \"basePairType\", \"residueIndex1\", \"residueIndex2\" and \"classes\" variables."
          }
          let basePairType : BasePair.Type;
          switch (basePair.basePairType) {
            case "canonical" : {
              basePairType = BasePair.Type.CANONICAL;
              break;
            }
            case "wobble" : {
              basePairType = BasePair.Type.WOBBLE;
              break;
            }
            case "mismatch" : {
              basePairType = BasePair.Type.MISMATCH;
              break;
            }
            default : {
              throw "Unrecognized base-pair type.";
            }
          }
          let residueIndex1 = Number.parseInt(basePair.residueIndex1) - singularRnaMoleculeProps.firstNucleotideIndex;
          let residueIndex2 = Number.parseInt(basePair.residueIndex2) - singularRnaMoleculeProps.firstNucleotideIndex;
          let strokeWidth = DEFAULT_STROKE_WIDTH;
          let color = BLACK;
          (basePair.classes as Array<string>).forEach(className => {
            let cssClass = cssClasses.find(cssClass => cssClass.name === className);
            if (cssClass !== undefined) {
              Object.entries(cssClass).forEach(cssClassData => {
                switch (cssClassData[0]) {
                  case "stroke-width" : {
                    strokeWidth = Number.parseFloat(cssClassData[1] as string);
                    break;
                  }
                  case "stroke" : {
                    color = fromCssString(cssClassData[1] as string);
                    break;
                  }
                }
              });
            }
          });
          insertBasePair(
            singularRnaComplexProps,
            rnaMoleculeName,
            residueIndex1,
            rnaMoleculeName,
            residueIndex2,
            DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
            {
              color,
              strokeWidth,
              basePairType
            }
          );
        });
        return singularRnaMoleculeProps;
      });
      return singularRnaComplexProps;
    });
    if (invertYAxis) {
      rnaComplexProps.forEach((singularRnaComplexProps : RnaComplex.ExternalProps) => {
        Object.values(singularRnaComplexProps.rnaMoleculeProps).forEach((singularRnaMoleculeProps : RnaMolecule.ExternalProps) => {
          Object.values(singularRnaMoleculeProps.nucleotideProps).forEach((singularNucleotideProps : Nucleotide.ExternalProps) => {
            singularNucleotideProps.y *= -1;
            if (singularNucleotideProps.labelLineProps !== undefined) {
              singularNucleotideProps.labelLineProps.y0 *= -1;
              singularNucleotideProps.labelLineProps.y1 *= -1;
            }
            if (singularNucleotideProps.labelContentProps !== undefined) {
              singularNucleotideProps.labelContentProps.y *= -1;
            }
          });
        });
      });
    }
    const output : ParsedInputFile = {
      rnaComplexProps,
      complexDocumentName
    };
    return output;
  };
  
  export const jsonInputFileHandler : InputFileReader = function(inputFileContent : string) {
    return jsonObjectHandler(
      JSON.parse(inputFileContent),
      false
    );
  };