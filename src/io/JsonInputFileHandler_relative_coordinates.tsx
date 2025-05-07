import BasePair, { isBasePairType } from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex, insertBasePair, DuplicateBasePairKeysHandler } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import Color, { fromCssString, BLACK } from "../data_structures/Color";
import Font from "../data_structures/Font";
import { Vector2D, subtract } from "../data_structures/Vector2D";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";
import { ParsedInputFile, InputFileReader } from "./InputUI";

function parsePolyline(
  variable : any,
  variableName : string
) {
  if (!Array.isArray(variable)) {
    throw `Variable ${variableName} should be an array.`;
  }
  return variable.map(function(vector2D) {
    if (!("x" in vector2D) || !("y"in vector2D)) {
      throw `Each element in ${variableName} should include "x" and "y" properties.`;
    }
    const x = Number.parseFloat(vector2D.x);
    const y = Number.parseFloat(vector2D.y);
    if (Number.isNaN(x) || Number.isNaN(y)) {
      throw `x and y properties of each element in ${variableName} should be numbers.`;
    }
    return {
      x,
      y
    };
  });
}

function parseBasePair(
  basePair : any,
  cssClasses : Array<any>,
  singularRnaComplexProps : RnaComplex.ExternalProps,
  stroke : Color | undefined,
  strokeWidth : number,
  rnaMoleculeName0? : string,
  rnaMoleculeName1? : string
) {
  if (!("basePairType" in basePair) || !("residueIndex1" in basePair) || !("residueIndex2" in basePair)) {
    throw "Input basePairs elements of input Json should have \"basePairType\", \"residueIndex1\" and \"residueIndex2\" variables."
  }
  let basePairType : BasePair.Type | undefined;
  
  if ([null, undefined].includes(basePair.basePairType)) {
    basePairType = undefined;
  } else if (typeof basePair.basePairType === "string" && isBasePairType(basePair.basePairType)) {
    basePairType = basePair.basePairType;
  } else {
    throw "Unrecognized base-pair type.";
  }
  if ("stroke" in basePair) {
    if (typeof basePair.stroke !== "string") {
      throw "Base-pair \"stroke\" variable should be a string.";
    }
    stroke = fromCssString(basePair.stroke);
  }
  let color = structuredClone(stroke);
  const classes = basePair.classes;
  if (classes !== undefined) {
    if (!Array.isArray(classes)) {
      throw "Base-pair \"classes\" variable should be an array.";
    }
    (classes as Array<string>).forEach(className => {
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
            case "color" : {
              color = fromCssString(cssClassData[1] as string);
              break;
            }
          }
        });
      }
    });
  }
  let points : Array<Vector2D> | undefined = undefined;
  if ("points" in basePair) {
    points = parsePolyline(
      basePair.points,
      "basePair.points"
    );
  }
  if (rnaMoleculeName0 === undefined) {
    if ("rnaMoleculeName1" in basePair) {
      const {
        rnaMoleculeName1
      } = basePair;
      if (typeof rnaMoleculeName1 !== "string") {
        throw `rnaMoleculeName1 should be a string.`;
      }
      rnaMoleculeName0 = rnaMoleculeName1;
    } else {
      throw "No rnaMoleculeName1 was provided.";
    }
  }
  if (rnaMoleculeName1 === undefined) {
    if ("rnaMoleculeName2" in basePair) {
      const {
        rnaMoleculeName2
      } = basePair;
      if (typeof rnaMoleculeName2 !== "string") {
        throw `rnaMoleculeName2 should be a string.`;
      }
      rnaMoleculeName1 = rnaMoleculeName2;
    } else {
      throw "No rnaMoleculeName2 was provided.";
    }
  }
  const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
  const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
  for (const rnaMoleculeName of [rnaMoleculeName0, rnaMoleculeName1]) {
    if (!(rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps)) {
      throw `RNA molecule "${rnaMoleculeName}" does not exist in the RNA complex.`;
    }
  }
  let residueIndex1 = Number.parseInt(basePair.residueIndex1) - singularRnaMoleculeProps0.firstNucleotideIndex;
  let residueIndex2 = Number.parseInt(basePair.residueIndex2) - singularRnaMoleculeProps1.firstNucleotideIndex;
  insertBasePair(
    singularRnaComplexProps,
    rnaMoleculeName0,
    residueIndex1,
    rnaMoleculeName1,
    residueIndex2,
    DuplicateBasePairKeysHandler.DO_NOTHING,
    {
      color,
      strokeWidth,
      basePairType,
      points
    }
  );
}

export function jsonObjectHandler(parsedJson : any) : ParsedInputFile {
  if (!("classes" in parsedJson) || !("rnaComplexes" in parsedJson)) {
    throw "Input Json should have \"classes\" and \"rnaComplexes\" variables.";
  }
  let rnaComplexProps : Array<RnaComplex.ExternalProps> = [];
  let complexDocumentName = "Unknown";
  if (!Array.isArray(parsedJson.classes)) {
    throw "JSON \"classes\" variable should be an array.";
  }
  const cssClasses = parsedJson.classes as Array<any>;
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
      if (!("name" in inputRnaMolecule) || !("labels" in inputRnaMolecule) || !("sequence" in inputRnaMolecule)) {
        throw "Input rnaMolecule elements of input Json should have \"name\", \"sequence\", \"labels\" variables."
      }
      let singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
        firstNucleotideIndex : Number.MAX_VALUE,
        nucleotideProps : []
      };
      const parsedClassesForSequence = {
        font : structuredClone(Font.DEFAULT),
        color : structuredClone(BLACK)
      };
      const classesForSequence = inputRnaMolecule.classesForSequence;
      if (classesForSequence !== undefined) {
        if (!Array.isArray(classesForSequence)) {
          throw "RNA-molecule \"classesForSequence\" variable should be an array;";
        }
        (classesForSequence as Array<any>).forEach(((classForSequence : any) => {
          if (typeof classForSequence !== "string") {
            throw "\"classForSequence\" variable should be a string.";
          }
          if (classForSequence.startsWith("text-")) {
            parsedClassesForSequence.color = fromCssString(classForSequence.substring("text-".length));
          }
          let cssClass = cssClasses.find(cssClass => cssClass.name === classForSequence);
          if (cssClass !== undefined) {
            Object.entries(cssClass).forEach(cssClassData => {
              switch (cssClassData[0]) {
                case "font-family" : {
                  (parsedClassesForSequence.font as Font).family = cssClassData[1] as string;
                  break;
                }
                case "font-size" : {
                  (parsedClassesForSequence.font as Font).size = cssClassData[1] as string;
                  break;
                }
                case "font-weight" : {
                  (parsedClassesForSequence.font as Font).weight = cssClassData[1] as string;
                  break;
                }
                case "font-style" : {
                  (parsedClassesForSequence.font as Font).style = cssClassData[1] as string;
                  break;
                }
                case "color" : {
                  parsedClassesForSequence.color = fromCssString(cssClassData[1] as string);
                  break;
                }
              }
            });
          }
        }));
      }
      const rnaMoleculeName = inputRnaMolecule.name;
      singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
      (inputRnaMolecule.sequence as Array<any>).forEach(inputSequenceEntry => {
        if (!("residueIndex" in inputSequenceEntry) || !("x" in inputSequenceEntry) || !("y" in inputSequenceEntry) || !("residueName" in inputSequenceEntry)) {
          throw "Input sequence elements of input Json should have \"residueIndex\", \"residueName\", \"x\" and \"y\" variables.";
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
        singularNucleotideProps.font = structuredClone(parsedClassesForSequence.font);
        singularNucleotideProps.color = structuredClone(parsedClassesForSequence.color);
        singularRnaMoleculeProps.nucleotideProps[nucleotideIndex] = singularNucleotideProps;
        const classes = inputSequenceEntry.classes;
        if (classes !== undefined) {
          if (!Array.isArray(classes)) {
            throw "Nucleotide \"classes\" variable should be an array.";
          }
          (classes as Array<string>).forEach(className => {
            if (className.startsWith("text-")) {
              singularNucleotideProps.color = fromCssString(className.substring("text-".length));
            }
            let cssClass = cssClasses.find(cssClass => cssClass.name === className);
            if (cssClass !== undefined) {
              Object.entries(cssClass).forEach(cssClassData => {
                switch (cssClassData[0]) {
                  case "font-family" : {
                    (singularNucleotideProps.font as Font).family = cssClassData[1] as string;
                    break;
                  }
                  case "font-size" : {
                    (singularNucleotideProps.font as Font).size = cssClassData[1] as string;
                    break;
                  }
                  case "font-weight" : {
                    (singularNucleotideProps.font as Font).weight = cssClassData[1] as string;
                    break;
                  }
                  case "font-style" : {
                    (singularNucleotideProps.font as Font).style = cssClassData[1] as string;
                    break;
                  }
                  case "color" : {
                    singularNucleotideProps.color = fromCssString(cssClassData[1] as string);
                    break;
                  }
                }
              });
            }
          });
        }
      });
      const parsedClassesForLabels = {
        font : structuredClone(Font.DEFAULT),
        color : structuredClone(BLACK),
        stroke : structuredClone(BLACK),
        strokeWidth : DEFAULT_STROKE_WIDTH
      };
      const classesForLabels = inputRnaMolecule.classesForLabels;
      if (classesForLabels !== undefined) {
        if (!Array.isArray(classesForLabels)) {
          throw "RNA-molecule \"classsesForLabels\" variable should be an array.";
        }
        classesForLabels.forEach(function(classForLabel : any) {
          if (typeof classForLabel !== "string") {
            throw "\"classForLabel\" variable should be a string";
          }
          if (classForLabel.startsWith("text-")) {
            parsedClassesForLabels.color = fromCssString(classForLabel.substring("text-".length));
          }
          let cssClass = cssClasses.find(cssClass => cssClass.name === classForLabel);
          if (cssClass !== undefined) {
            Object.entries(cssClass).forEach(cssClassEntry => {
              switch (cssClassEntry[0]) {
                case "font-family" : {
                  parsedClassesForLabels.font.family = cssClassEntry[1] as string;
                  break;
                }
                case "font-size" : {
                  parsedClassesForLabels.font.size = cssClassEntry[1] as string;
                  break;
                }
                case "font-weight" : {
                  parsedClassesForLabels.font.weight = cssClassEntry[1] as string;
                  break;
                }
                case "font-style" : {
                  parsedClassesForLabels.font.style = cssClassEntry[1] as string;
                  break;
                }
                case "stroke" : {
                  parsedClassesForLabels.stroke = fromCssString(cssClassEntry[1] as string);
                  break;
                }
                case "color" : {
                  parsedClassesForLabels.color = fromCssString(cssClassEntry[1] as string);
                  break;
                }
                case "stroke-width" : {
                  parsedClassesForLabels.strokeWidth = Number.parseFloat(cssClassEntry[1] as string);
                  break;
                }
              }
            });
          }
        });
      }
      (inputRnaMolecule.labels as Array<any>).forEach(label => {
        if (!("residueIndex" in label)) {
          throw "Input label elements of input Json should have a \"residueIndex\" variable."
        }
        let nucleotideProps = singularRnaMoleculeProps.nucleotideProps[Number.parseInt(label.residueIndex) - singularRnaMoleculeProps.firstNucleotideIndex];
        if ("labelContent" in label) {
          let font = structuredClone(parsedClassesForLabels.font);
          let color = structuredClone(parsedClassesForLabels.color);
          const classes = label.labelContent.classes;
          if (classes !== undefined) {
            if (!Array.isArray(classes)) {
              throw "LabelContent \"classes\" variable should be an array.";
            }
            (classes as Array<any>).forEach(labelClassName => {
              if (labelClassName.startsWith("text-")) {
                color = fromCssString(labelClassName.substring("text-".length));
              }
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
                    case "color" : {
                      color = fromCssString(cssClassEntry[1] as string);
                      break;
                    }
                    case "stroke" : {
                      color = fromCssString(cssClassEntry[1] as string);
                      break;
                    }
                  }
                });
              }
            });
          }
          nucleotideProps.labelContentProps = {
            x : Number.parseFloat(label.labelContent.x),
            y : Number.parseFloat(label.labelContent.y),
            content : label.labelContent.label,
            font,
            color,
            strokeWidth : DEFAULT_STROKE_WIDTH
          };
        }

        if ("labelLine" in label) {
          let labelLine = label.labelLine;
          let color = structuredClone(parsedClassesForLabels.stroke);
          let strokeWidth = parsedClassesForLabels.strokeWidth;
          const classes = labelLine.classes;
          if (classes !== undefined) {
            if (!Array.isArray(classes)) {
              throw "Label-line \"classes\" variable should be an array.";
            }
            (classes as Array<any>).forEach(className => {
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
                    case "color" : {
                      color = fromCssString(cssClassData[1] as string);
                      break;
                    }
                  }
                });
              }
            });
          }
          let parsedPoints : Array<Vector2D> = [];
          if (!("points" in labelLine)) {
            if ("x1" in labelLine && "y1" in labelLine && "x2" in labelLine && "y2" in labelLine) {
              let parsedX1 = Number.parseFloat(labelLine.x1);
              if (Number.isNaN(parsedX1)) {
                throw "\"x1\" variable should be a number.";
              }
              let parsedY1 = Number.parseFloat(labelLine.y1);
              if (Number.isNaN(parsedY1)) {
                throw "\"y1\" variable should be a number.";
              }
              let parsedX2 = Number.parseFloat(labelLine.x2);
              if (Number.isNaN(parsedX2)) {
                throw "\"x2\" variable should be a number.";
              }
              let parsedY2 = Number.parseFloat(labelLine.y2);
              if (Number.isNaN(parsedY2)) {
                throw "\"y2\" variable should be a number.";
              }
              parsedPoints.push(
                {
                  x : parsedX1,
                  y : parsedY1
                },
                {
                  x : parsedX2,
                  y : parsedY2
                }
              );
            } else {
              throw "Input label-line elements should have a \"points\" variable.";
            }
          } else {
            parsedPoints = parsePolyline(
              labelLine.points,
              `label-line "points"`
            );
          }

          nucleotideProps.labelLineProps = {
            points : parsedPoints,
            color,
            strokeWidth
          };
        }
      });
      const parsedClassesForBasePairs : { strokeWidth : number, stroke : undefined | Color } = {
        strokeWidth : DEFAULT_STROKE_WIDTH,
        stroke : undefined
      };
      const classesForBasePairs = inputRnaMolecule.classesForBasePairs;
      if (classesForBasePairs !== undefined) {
        if (!Array.isArray(classesForBasePairs)) {
          throw "RNA-molecule \"classesForBasePairs\" variable should be an array.";
        }
        classesForBasePairs.forEach((classForBasePair : any) => {
          if (typeof classForBasePair !== "string") {
            throw "\"classForBasePair\" should be a string.";
          }
          let cssClass = cssClasses.find(cssClass => cssClass.name === classForBasePair);
          if (cssClass !== undefined) {
            Object.entries(cssClass).forEach(cssClassData => {
              switch (cssClassData[0]) {
                case "stroke-width" : {
                  parsedClassesForBasePairs.strokeWidth = Number.parseFloat(cssClassData[1] as string);
                  break;
                }
                case "stroke" : {
                  parsedClassesForBasePairs.stroke = fromCssString(cssClassData[1] as string);
                  break;
                }
                case "color" : {
                  parsedClassesForBasePairs.stroke = fromCssString(cssClassData[1] as string);
                  break;
                }
              }
            });
          }
        });
      }
      if ("basePairs" in inputRnaMolecule) {
        const { basePairs } = inputRnaMolecule;
        if (!Array.isArray(basePairs)) {
          throw `The basePairs property of each input RNA molecule should be an array.`;
        }
        for (const basePair of inputRnaMolecule.basePairs as Array<any>) {
          parseBasePair(
            basePair,
            cssClasses ?? [],
            singularRnaComplexProps,
            parsedClassesForBasePairs.stroke,
            parsedClassesForBasePairs.strokeWidth,
            rnaMoleculeName,
            rnaMoleculeName
          );
        }
      }
      return singularRnaMoleculeProps;
    });
    if ("basePairs" in inputRnaComplex) {
      const { basePairs } = inputRnaComplex;
      if (!Array.isArray(basePairs)) {
        throw `The basePairs property of each input RNA complex should be an array.`;
      }
      for (const basePair of inputRnaComplex.basePairs) {
        const parsedClassesForBasePairs : { strokeWidth : number, stroke : undefined | Color } = {
          strokeWidth : DEFAULT_STROKE_WIDTH,
          stroke : undefined
        };
        const classesForBasePairs = inputRnaComplex.classesForBasePairs;
        if (classesForBasePairs !== undefined) {
          if (!Array.isArray(classesForBasePairs)) {
            throw "RNA-molecule \"classesForBasePairs\" variable should be an array.";
          }
          classesForBasePairs.forEach((classForBasePair : any) => {
            if (typeof classForBasePair !== "string") {
              throw "\"classForBasePair\" should be a string.";
            }
            let cssClass = cssClasses.find(cssClass => cssClass.name === classForBasePair);
            if (cssClass !== undefined) {
              Object.entries(cssClass).forEach(cssClassData => {
                switch (cssClassData[0]) {
                  case "stroke-width" : {
                    parsedClassesForBasePairs.strokeWidth = Number.parseFloat(cssClassData[1] as string);
                    break;
                  }
                  case "stroke" : {
                    parsedClassesForBasePairs.stroke = fromCssString(cssClassData[1] as string);
                    break;
                  }
                  case "color" : {
                    parsedClassesForBasePairs.stroke = fromCssString(cssClassData[1] as string);
                    break;
                  }
                }
              });
            }
          });
        }
        parseBasePair(
          basePair,
          inputRnaComplex.classesForBasePairs ?? [],
          singularRnaComplexProps,
          parsedClassesForBasePairs.stroke,
          parsedClassesForBasePairs.strokeWidth
        );
      }
    }
    return singularRnaComplexProps;
  });
  const output : ParsedInputFile = {
    rnaComplexProps,
    complexDocumentName
  };
  return output;
};

export const jsonInputFileHandler : InputFileReader = function(inputFileContent : string) {
  return jsonObjectHandler(JSON.parse(inputFileContent));
};