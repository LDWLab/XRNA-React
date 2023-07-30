import { useContext, useEffect, useMemo, useRef, useState } from "react";
import { RnaComplexProps } from "../../../App";
import { Context } from "../../../context/Context";
import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../RnaComplex";
import { default as _BasePair } from  "../BasePair";

export namespace BasePairsEditor {
  export type BasePair = {
    rnaComplexIndex : number,
    rnaMoleculeName0 : string,
    rnaMoleculeName1 : string,
    nucleotideIndex0 : number,
    nucleotideIndex1 : number,
    length : number,
    type? : _BasePair.Type
  };

  export type PartialBasePair = Partial<BasePair>;

  type DefaultData = {
    defaultRnaComplexIndex? : number,
    defaultRnaMoleculeName0? : string,
    defaultRnaMoleculeName1? : string
  };

  export type Props = DefaultData & {
    rnaComplexProps : RnaComplexProps,
    approveBasePairs : (basePairs : Array<BasePair>) => void,
    initialTextBasedFlag? : boolean,
    initialBasePairs? : Array<PartialBasePair>
  };

  export function Component(props : Props) {
    const {
      rnaComplexProps,
      approveBasePairs,
      initialTextBasedFlag,
      initialBasePairs,
      defaultRnaComplexIndex,
      defaultRnaMoleculeName0,
      defaultRnaMoleculeName1
    } = props;
    // Begin context data.
    const setBasePairKeysToEdit = useContext(Context.BasePair.SetKeysToEdit);
    // Begin state data.
    const [
      textBasedEditorFlag,
      setTextBasedEditorFlag
    ] = useState(initialTextBasedFlag ?? true);
    const [
      overrideConflictingBasePairsFlag,
      setOverrideConflictingBasePairsFlag
    ] = useState(false);
    const [
      basePairs,
      _setBasePairs
    ] = useState(initialBasePairs === undefined ? [] : initialBasePairs.filter(function(singularInitialBasePair) {
      return (
        singularInitialBasePair.rnaComplexIndex !== undefined &&
        singularInitialBasePair.rnaMoleculeName0 !== undefined &&
        singularInitialBasePair.rnaMoleculeName1 !== undefined &&
        singularInitialBasePair.nucleotideIndex0 !== undefined &&
        singularInitialBasePair.nucleotideIndex1 !== undefined &&
        singularInitialBasePair.length !== undefined
      );
    }) as Array<BasePair>);
    // Begin reference data.
    const basePairsReference = useRef<Array<BasePair>>();
    basePairsReference.current = basePairs;
    const overrideConflictingBasePairsFlagReference = useRef<boolean>();
    overrideConflictingBasePairsFlagReference.current = overrideConflictingBasePairsFlag;
    // Begin memo data.
    const populateBasePairKeysToEdit = useMemo(
      function() {
        return function(basePair : BasePair, basePairKeysToEdit : Context.BasePair.KeysToEdit, addOrDelete : "add" | "delete") {
          let {
            rnaComplexIndex,
            rnaMoleculeName0,
            rnaMoleculeName1,
            nucleotideIndex0,
            nucleotideIndex1,
            length,
            type
          } = basePair;
          const overrideConflictingBasePairsFlag = overrideConflictingBasePairsFlagReference.current as boolean;
          if (!(rnaComplexIndex in basePairKeysToEdit)) {
            basePairKeysToEdit[rnaComplexIndex] = {
              add : [],
              delete : []
            };
          }
          const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[rnaComplexIndex];
          const arrayToEdit = basePairKeysToEditPerRnaComplex[addOrDelete];
          const basePairKeysToDeletePerRnaComplex = basePairKeysToEditPerRnaComplex.delete;
          const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
          const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
          const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
          nucleotideIndex0 -= singularRnaMoleculeProps0.firstNucleotideIndex;
          nucleotideIndex1 -= singularRnaMoleculeProps1.firstNucleotideIndex;
          for (let i = 0; i < length; i++) {
            const formattedNucleotideIndex0 = nucleotideIndex0 + i;
            const formattedNucleotideIndex1 = nucleotideIndex1 - i;
            if (addOrDelete === "add") {
              try {
                const conflictingBasePairKeys = insertBasePair(
                  singularRnaComplexProps,
                  rnaMoleculeName0,
                  formattedNucleotideIndex0,
                  rnaMoleculeName1,
                  formattedNucleotideIndex1,
                  overrideConflictingBasePairsFlag ? DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING : DuplicateBasePairKeysHandler.THROW_ERROR,
                  {
                    basePairType : type
                  }
                );
                basePairKeysToDeletePerRnaComplex.push(
                  ...conflictingBasePairKeys
                );
              } catch (error) {
                if (typeof error === "string") {
                  // throw `The base pair on line #${i + 1} was not created due to conflicting, preexisting base pair(s). Activate the relevant option above if you want to override them.`;
                  alert(`The base pair on line #${i + 1} was not created due to conflicting, preexisting base pair(s). Activate the relevant option above if you want to override them.`);
                  continue;
                } else {
                  throw error;
                }
              }
            }
            arrayToEdit.push(
              {
                rnaMoleculeName : rnaMoleculeName0,
                nucleotideIndex : formattedNucleotideIndex0
              },
              {
                rnaMoleculeName : rnaMoleculeName1,
                nucleotideIndex : formattedNucleotideIndex1
              }
            );
          }
        };
      },
      []
    );
    const setBasePairs = useMemo(
      function() {
        return function(newBasePairs : Array<BasePair>) {
          const basePairs = basePairsReference.current as Array<BasePair>;
          const basePairKeysToEdit : Context.BasePair.KeysToEdit = {};
          for (let basePair of basePairs) {
            populateBasePairKeysToEdit(
              basePair,
              basePairKeysToEdit,
              "delete"
            );
          }
          for (let basePair of newBasePairs) {
            populateBasePairKeysToEdit(
              basePair,
              basePairKeysToEdit,
              "add"
            );
          }
          setBasePairKeysToEdit(basePairKeysToEdit);
          _setBasePairs(newBasePairs);
        }
      },
      []
    );
    // Begin render.
    return <>
      <label>
        Override conflicting base pairs:
        <input
          type = "checkbox"
          checked = {overrideConflictingBasePairsFlag}
          onChange = {function() {
            setOverrideConflictingBasePairsFlag(!overrideConflictingBasePairsFlag);
          }}
        />
      </label>
      <br/>
      <label>
        Text-based base-pairs editor:
        <input
          type = "checkbox"
          checked = {textBasedEditorFlag}
          onChange = {function() {
            setTextBasedEditorFlag(!textBasedEditorFlag);
          }}
        />
      </label>
      <br/>
      {textBasedEditorFlag && <TextBasedEditor
        rnaComplexProps = {rnaComplexProps}
        setBasePairs = {setBasePairs}
        defaultRnaComplexIndex = {defaultRnaComplexIndex}
        defaultRnaMoleculeName0 = {defaultRnaMoleculeName0}
        defaultRnaMoleculeName1 = {defaultRnaMoleculeName1}
        approveBasePairs = {approveBasePairs}
        initialBasePairs = {initialBasePairs}
      />}
      {!textBasedEditorFlag && <NonTextBasedEditor
        rnaComplexProps = {rnaComplexProps}
        setBasePairs = {setBasePairs}
        defaultRnaComplexIndex = {defaultRnaComplexIndex}
        defaultRnaMoleculeName0 = {defaultRnaMoleculeName0}
        defaultRnaMoleculeName1 = {defaultRnaMoleculeName1}
        approveBasePairs = {approveBasePairs}
        initialBasePairs = {initialBasePairs}
      />}
    </>;
  }

  type EditorProps = DefaultData & {
    rnaComplexProps : RnaComplexProps,
    setBasePairs : (newBasePairs : Array<BasePair>) => void,
    approveBasePairs : (newBasePairs : Array<BasePair>) => void,
    initialBasePairs? : Array<PartialBasePair>
  };

  export function TextBasedEditor(props : EditorProps) {
    const {
      rnaComplexProps,
      setBasePairs,
      approveBasePairs,
      initialBasePairs,
      defaultRnaComplexIndex,
      defaultRnaMoleculeName0,
      defaultRnaMoleculeName1
    } = props;
    // Begin state data.
    const [
      text,
      setText
    ] = useState("");
    // Begin memo data.
    const rnaComplexNames = useMemo(
      function() {
        return Object.values(rnaComplexProps).map(function(singularRnaComplexProps) {
          return singularRnaComplexProps.name;
        });
      },
      [rnaComplexProps]
    );
    // Begin effects.
    useEffect(
      function() {
        if (initialBasePairs === undefined) {
          setText("");
          return;
        }
        let newText = initialBasePairs.map(function({
          rnaComplexIndex,
          rnaMoleculeName0,
          rnaMoleculeName1,
          nucleotideIndex0,
          nucleotideIndex1,
          length
        }) {
          const elements : Array<any> = [
            nucleotideIndex0 ?? "#",
            nucleotideIndex1 ?? "#",
            length ?? "#"
          ];
          if (rnaComplexIndex === undefined) {
            const undefinedFlag0 = rnaMoleculeName0 === undefined;
            const undefinedFlag1 = rnaMoleculeName1 === undefined;
            if (undefinedFlag0 && !undefinedFlag1) {
              elements.push("\"" + rnaMoleculeName1 + "\"");
            } else if (!undefinedFlag0 && undefinedFlag1) {
              elements.push("\"" + rnaMoleculeName0 + "\"");
            } else if (!undefinedFlag0 && !undefinedFlag1) {
              elements.push(
                "\"" + rnaMoleculeName0 + "\"",
                "\"" + rnaMoleculeName1 + "\""
              );
            }
          } else {
            elements.push(
             "\"" + (rnaMoleculeName0 ?? "") + "\"",
             "\"" + (rnaMoleculeName1 ?? "") + "\"",
             "\"" + rnaComplexProps[rnaComplexIndex].name + "\""
            );
          }
          return elements.join(" ");
        }).join("\n");
        setText(newText);
      },
      [initialBasePairs]
    );
    return <>
      <textarea
        style = {{
          width : "99%"
        }}
        value = {text}
        onChange = {function(e) {
          const newText = e.target.value;
          setText(newText);
        }}
      />
      <br/>
      <button
        onClick = {function() {
          const lines = text.split("\n");
          const trimmedLines = lines.map(function(line) {
            return line.trim();
          });
          const filteredLines = trimmedLines.filter(function(line) {
            return line.length > 0;
          });
          try {
            const basePairs = filteredLines.map(function(
              line : string,
              lineIndex : number
            ) {
              const stringsSeparatedByWhitespace = line.split(/\s+/);
              // Format: nucleotideIndex0 nucleotideIndex1 length rnaMoleculeName0? rnaMoleculeName1? rnaComplexName?
              if (stringsSeparatedByWhitespace.length < 3) {
                throw `Too few arguments were found in line #${lineIndex + 1}`;
              }
              const nucleotideIndex0 = Number.parseInt(stringsSeparatedByWhitespace[0]);
              if (Number.isNaN(nucleotideIndex0)) {
                throw `The provided nucleotide index #1 in line #${lineIndex + 1} is not an integer.`;
              }
              const nucleotideIndex1 = Number.parseInt(stringsSeparatedByWhitespace[1]);
              if (Number.isNaN(nucleotideIndex1)) {
                throw `The provided nucleotide index #2 in line #${lineIndex + 1} is not an integer.`;
              }
              const length = Number.parseInt(stringsSeparatedByWhitespace[2]);
              if (Number.isNaN(length)) {
                throw `The provided length in line #${lineIndex + 1} is not an integer.`;
              }
              function getFormattedName(unformattedName : string) {
                const match = /^"(.*)"$/.exec(unformattedName);
                if (match !== null) {
                  unformattedName = match[1];
                }
                return unformattedName;
              }
              let rnaComplexIndex : number;
              if (stringsSeparatedByWhitespace.length < 6) {
                if (defaultRnaComplexIndex === undefined) {
                  throw `No RNA-complex name was provided in line #${lineIndex + 1}.`;
                }
                rnaComplexIndex = defaultRnaComplexIndex;
              } else {
                const rnaComplexName = getFormattedName(stringsSeparatedByWhitespace[5]);
                rnaComplexIndex = rnaComplexNames.findIndex(function(rnaComplexNameI) {
                  return rnaComplexName === rnaComplexNameI;
                });
                if (rnaComplexIndex === -1) {
                  throw `The provided RNA complex name #1 in line #${lineIndex + 1} does not match any existing RNA complex's name.`;
                }
              }
              const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
              let rnaMoleculeName0 : string;
              if (stringsSeparatedByWhitespace.length < 4) {
                if (defaultRnaMoleculeName0 === undefined) {
                  throw `No RNA-molecule #1 name was provided in line #${lineIndex + 1}.`;
                }
                rnaMoleculeName0 = defaultRnaMoleculeName0;
              } else {
                rnaMoleculeName0 = getFormattedName(stringsSeparatedByWhitespace[3]);
                if (!(rnaMoleculeName0 in singularRnaComplexProps.rnaMoleculeProps)) {
                  throw `The provided RNA molecule #1 in line #${lineIndex + 1} does not match any existing RNA molecule's name.`;
                }
              }
              let rnaMoleculeName1 : string;
              if (stringsSeparatedByWhitespace.length < 5) {
                if (defaultRnaMoleculeName1 === undefined) {
                  throw `no RNA-molecule #2 name was provided in line #${lineIndex + 1}.`;
                }
                rnaMoleculeName1 = defaultRnaMoleculeName1;
              } else {
                rnaMoleculeName1 = getFormattedName(stringsSeparatedByWhitespace[4]);
                if (!(rnaMoleculeName1 in singularRnaComplexProps.rnaMoleculeProps)) {
                  throw `The provided RNA molecule name #2 in line #${lineIndex + 1} does not match any existing RNA molecule's name.`;
                }
              }
              let type : string | undefined = stringsSeparatedByWhitespace[6];
              if (type !== undefined) {
                type = getFormattedName(type);
                type = type.toLocaleLowerCase();
                type = _BasePair.types.find(function(typeI : _BasePair.Type) {
                  return typeI.toLocaleLowerCase() === type;
                });
                if (type === undefined) {
                  throw `The provided base-pair type in line #${lineIndex + 1} was not recognized.`;
                }
              }
              return {
                rnaComplexIndex,
                rnaMoleculeName0,
                rnaMoleculeName1,
                nucleotideIndex0,
                nucleotideIndex1,
                length,
                type : type as _BasePair.Type | undefined
              };
            });
            approveBasePairs(basePairs);
            setBasePairs(basePairs);
          } catch (error) {
            if (typeof error === "string") {
              alert(error);
              return;
            } else {
              throw error;
            }
          }
        }}
      >
        Update base pairs
      </button>
    </>;
  }

  export function NonTextBasedEditor(props : EditorProps) {
    return <></>;
  }
}

// import { useState, useEffect, useMemo, useContext } from "react";
// import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../RnaComplex";
// import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../../../App";
// import { Context } from "../../../context/Context";

// export namespace BasePairsEditor {
//   export type ParsedBasePair = {
//     nucleotideIndex0 : NucleotideKey,
//     nucleotideIndex1 : NucleotideKey,
//     length : number,
//     rnaMoleculeName0 : RnaMoleculeKey,
//     rnaMoleculeName1 : RnaMoleculeKey,
//     rnaComplexIndex : RnaComplexKey,
//   };

//   function parseBasePairs(
//     basePairsText : string,
//     flattenedRnaComplexProps : Array<RnaComplex.ExternalProps>,
//     defaultRnaMoleculeName0? : string,
//     defaultRnaMoleculeName1? : string,
//     defaultRnaComplexName? : string
//   ) : Array<ParsedBasePair> {
//     const parsedBasePairs = new Array<ParsedBasePair>();
//     const lines = basePairsText.split("\n");
//     for (let i = 0; i < lines.length; i++) {
//       let line = lines[i];
//       line = line.trim();
//       const dataAsText = line.split(/\s+/);
//       if (dataAsText.length < 3) {
//         throw `Too few arguments were provided in line #${i + 1}. At a minimum, nucleotide index 0, nucleotide index 1 and length are expected.`;
//       }
//       let nucleotideIndex0 = Number.parseInt(dataAsText[0]);
//       if (Number.isNaN(nucleotideIndex0)) {
//         throw "The first parameter provided - nucleotide index 1 - is not a number.";
//       }
//       let nucleotideIndex1 = Number.parseInt(dataAsText[1]);
//       if (Number.isNaN(nucleotideIndex1)) {
//         throw "The second parameter provided - nucleotide index 2 - is not a number.";
//       }
//       const length = Number.parseInt(dataAsText[2]);
//       if (Number.isNaN(length)) {
//         throw "The third parameter provided - length - is not a number.";
//       }
//       let rnaMoleculeName0 : string | undefined = defaultRnaMoleculeName0;
//       if (dataAsText.length >= 4) {
//         rnaMoleculeName0 = dataAsText[3];  
//       }
//       if (rnaMoleculeName0 === undefined) {
//         throw "The fourth parameter - RNA molecule name 1 - was expected, but was not provided.";
//       }
//       let rnaMoleculeName1 : string | undefined = defaultRnaMoleculeName1;
//       if (dataAsText.length >= 5) {
//         rnaMoleculeName1 = dataAsText[4];
//       }
//       if (rnaMoleculeName1 === undefined) {
//         throw "The fifth parameter - RNA molecule name 2 - was expected, but was not provided.";
//       }
//       let rnaComplexName : string | undefined = defaultRnaComplexName;
//       if (dataAsText.length >= 6) {
//         rnaComplexName = dataAsText[5];
//       }
//       if (rnaComplexName === undefined) {
//         throw "The sixth parameter - RNA complex name - was expected, but was not provided.";
//       }
//       let foundRnaComplex : {
//         props : RnaComplex.ExternalProps,
//         index : number
//       } | undefined = undefined;
//       for (let i = 0; i < flattenedRnaComplexProps.length; i++) {
//         const singularRnaComplexProps = flattenedRnaComplexProps[i];
//         if (singularRnaComplexProps.name === rnaComplexName) {
//           foundRnaComplex = {
//             props : singularRnaComplexProps,
//             index : i
//           };
//         }
//       }
//       if (foundRnaComplex === undefined) {
//         throw "The sixth parameter - RNA complex name - did not match any known RNA complex's name.";
//       }
//       if (!(rnaMoleculeName0 in foundRnaComplex.props.rnaMoleculeProps)) {
//         throw "The fourth parameter - RNA molecule name 1 - did not match any known RNA molecule's name.";
//       }
//       const singularRnaMoleculeProps0 = foundRnaComplex.props.rnaMoleculeProps[rnaMoleculeName0];
//       if (!(rnaMoleculeName1 in foundRnaComplex.props.rnaMoleculeProps)) {
//         throw "The fifth parameter - RNA molecule name 2 - did not match any known RNA molecule's name.";
//       }
//       const singularRnaMoleculeProps1 = foundRnaComplex.props.rnaMoleculeProps[rnaMoleculeName1];
//       nucleotideIndex0 -= singularRnaMoleculeProps0.firstNucleotideIndex;
//       if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
//         throw "The first parameter - nucleotide index 1 - did not match any known nucleotide index.";
//       }
//       nucleotideIndex1 -= singularRnaMoleculeProps1.firstNucleotideIndex;
//       if (!(nucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
//         throw "The second parameter - nucleotide index 2 - did not match any known nucleotide index.";
//       }
//       parsedBasePairs.push({
//         nucleotideIndex0,
//         nucleotideIndex1,
//         length,
//         rnaMoleculeName0,
//         rnaMoleculeName1,
//         rnaComplexIndex : foundRnaComplex.index
//       });
//     }
//     return parsedBasePairs;
//   }

//   export type Props = {
//     rnaComplexProps : RnaComplexProps,
//     initialBasePairsText? : string,
//     // string represents an error message. Void represents approval.
//     approveParsedBasePairs : (parsedBasePairs : Array<ParsedBasePair>) => string | void,
//     defaultRnaMoleculeName0? : string,
//     defaultRnaMoleculeName1? : string,
//     defaultRnaComplexName? : string
//   };

//   export function Component(props : Props) {
//     const {
//       rnaComplexProps,
//       initialBasePairsText,
//       approveParsedBasePairs,
//       defaultRnaMoleculeName0,
//       defaultRnaMoleculeName1,
//       defaultRnaComplexName
//     } = props;
//     // Begin context data.
//     const setBasePairDataToEdit = useContext(Context.BasePair.SetDataToEdit);
//     // Begin state data.
//     const [
//       basePairsText,
//       setBasePairsText
//     ] = useState(initialBasePairsText ?? "");
//     const [
//       overrideConflictingBasePairsFlag,
//       setOverrideConflictingBasePairsFlag
//     ] = useState(false);
//     const [
//       preexistingBasePairKeys,
//       setPreexistingBasePairKeys
//     ] = useState<Record<RnaComplexKey, Array<RnaComplex.BasePairKeys>>>({});
//     // Begin memo data.
//     const flattenedRnaComplexProps = useMemo(
//       function() {
//         return Object.values(rnaComplexProps);
//       },
//       [rnaComplexProps]
//     );
//     // Begin effects.
//     useEffect(
//       function() {
//         if (initialBasePairsText === undefined) {
//           return;
//         }
//         let initialBasePairsTextTrimmed = initialBasePairsText.trim();
//         if (initialBasePairsTextTrimmed.length === 0) {
//           return;
//         }
//         const initialParsedBasePairs = parseBasePairs(
//           initialBasePairsTextTrimmed,
//           flattenedRnaComplexProps,
//           defaultRnaMoleculeName0,
//           defaultRnaMoleculeName1,
//           defaultRnaComplexName
//         );
//         const basePairKeysFromInitialText : Record<RnaComplexKey, Array<RnaComplex.BasePairKeys>> = {};
//         for (const parsedBasePair of initialParsedBasePairs) {
//           const {
//             rnaComplexIndex,
//             rnaMoleculeName0,
//             rnaMoleculeName1,
//             nucleotideIndex0,
//             nucleotideIndex1,
//             length
//           } = parsedBasePair;
//           if (!(rnaComplexIndex in basePairKeysFromInitialText)) {
//             basePairKeysFromInitialText[rnaComplexIndex] = [];
//           }
//           const basePairKeysFromInitialTextPerRnaComplex = basePairKeysFromInitialText[rnaComplexIndex];
//           for (let i = 0; i < length; i++) {
//             const formattedNucleotideIndex0 = nucleotideIndex0 + i;
//             const formattedNucleotideIndex1 = nucleotideIndex1 - i;
//             basePairKeysFromInitialTextPerRnaComplex.push(
//               {
//                 rnaMoleculeName : rnaMoleculeName0,
//                 nucleotideIndex : formattedNucleotideIndex0
//               },
//               {
//                 rnaMoleculeName : rnaMoleculeName1,
//                 nucleotideIndex : formattedNucleotideIndex1
//               }
//             );
//           }
//         }
//         setPreexistingBasePairKeys(basePairKeysFromInitialText);
//       },
//       [initialBasePairsText]
//     );
//     return <>
//       <b>
//         Base pairs:
//       </b>
//       <br/>
//       <label>
//         Override conflicting base pairs:&nbsp;
//         <input
//           type = "checkbox"
//           onClick = {function() {
//             setOverrideConflictingBasePairsFlag(!overrideConflictingBasePairsFlag);
//           }}
//         />
//       </label>
//       <br/>
//       <textarea
//         value = {basePairsText}
//         onChange = {function(e) {
//           const newBasePairsText = e.target.value;
//           setBasePairsText(newBasePairsText);
//         }}
//       />
//       <br/>
//       <button
//         onClick = {function() {
//           try {
//             const parsedBasePairs = parseBasePairs(
//               basePairsText,
//               flattenedRnaComplexProps,
//               defaultRnaMoleculeName0,
//               defaultRnaMoleculeName1,
//               defaultRnaComplexName
//             );
//             const potentialErrorMessage = approveParsedBasePairs(parsedBasePairs);
//             if (typeof potentialErrorMessage === "string") {
//               alert(potentialErrorMessage);
//               return;
//             }
//             const basePairKeysToEdit : Record<RnaComplexKey, Context.BasePair.KeysToEditPerRnaComplexType> = {};
//             for (let parsedBasePair of parsedBasePairs) {
//               let {
//                 nucleotideIndex0,
//                 nucleotideIndex1,
//                 length,
//                 rnaMoleculeName0,
//                 rnaMoleculeName1,
//                 rnaComplexIndex
//               } = parsedBasePair;
//               if (!(rnaComplexIndex in basePairKeysToEdit)) {
//                 basePairKeysToEdit[rnaComplexIndex] = {
//                   add : [],
//                   delete : []
//                 };
//               }
//               const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[rnaComplexIndex];
//               for (let i = 0; i < length; i++) {
//                 const formattedNucleotideIndex0 = nucleotideIndex0 + i;
//                 const formattedNucleotideIndex1 = nucleotideIndex1 - i;
//                 basePairKeysToEditPerRnaComplex.add.push(
//                   {
//                     rnaMoleculeName : rnaMoleculeName0,
//                     nucleotideIndex : formattedNucleotideIndex0
//                   },
//                   {
//                     rnaMoleculeName : rnaMoleculeName1,
//                     nucleotideIndex : formattedNucleotideIndex1
//                   }
//                 );
//                 try {
//                   const basePairKeysToDelete = insertBasePair(
//                     rnaComplexProps[rnaComplexIndex],
//                     rnaMoleculeName0,
//                     formattedNucleotideIndex0,
//                     rnaMoleculeName1,
//                     formattedNucleotideIndex1,
//                     overrideConflictingBasePairsFlag ? DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING : DuplicateBasePairKeysHandler.THROW_ERROR
//                   );
//                   basePairKeysToEditPerRnaComplex.delete.push(...basePairKeysToDelete);
//                 } catch (error) {
//                   if (typeof error === "string") {
//                     const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
//                     const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
//                     const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
//                     alert(`The base pair between RNA molecule "${rnaMoleculeName0}", nucleotide index #${singularRnaMoleculeProps0.firstNucleotideIndex + formattedNucleotideIndex0} and "${rnaMoleculeName1}", nucleotide index #${singularRnaMoleculeProps1.firstNucleotideIndex + formattedNucleotideIndex1} was not created, because a conflicting, pre-existing base pair was found.`);
//                   } else {
//                     throw error;
//                   }
//                 }
//               }
//             }
//             for (const [rnaComplexIndexAsString, preexistingBasePairKeysPerRnaComplex] of Object.entries(preexistingBasePairKeys)) {
//               const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
//               if (!(rnaComplexIndex in basePairKeysToEdit)) {
//                 basePairKeysToEdit[rnaComplexIndex] = {
//                   add : [],
//                   delete : []
//                 };
//               }
//               const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[rnaComplexIndex];
//               basePairKeysToEditPerRnaComplex.delete.push(
//                 ...preexistingBasePairKeysPerRnaComplex
//               );
//             }
//             setBasePairDataToEdit(basePairKeysToEdit);
//           } catch (error) {
//             if (typeof error === "string") {
//               alert(error);
//             } else {
//               throw error;
//             }
//           }
//         }}
//       >
//         Update base pairs
//       </button>
//     </>;
//   }
// }