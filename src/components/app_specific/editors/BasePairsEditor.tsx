import { FunctionComponent, createElement, useContext, useEffect, useMemo, useRef, useState } from "react";
import { RnaComplexProps, TOOLS_DIV_BACKGROUND_COLOR } from "../../../App";
import { Context, NucleotideKeysToRerender } from "../../../context/Context";
import { DuplicateBasePairKeysHandler, RnaComplex, compareBasePairKeys, insertBasePair } from "../RnaComplex";
import { default as _BasePair, getBasePairType } from  "../BasePair";
import { Setting } from "../../../ui/Setting";
import InputWithValidator from "../../generic/InputWithValidator";
import { sign, subtractNumbers } from "../../../utils/Utils";
import { scaleUp, add, orthogonalize, subtract, negate, normalize, scalarProject, dotProduct, magnitude } from "../../../data_structures/Vector2D";
import { Nucleotide } from "../Nucleotide";
import { Collapsible } from "../../generic/Collapsible";
import { parseIntReturnUndefinedOnFail } from "../../../utils/Constants";
import { RnaMolecule } from "../RnaMolecule";

export namespace BasePairsEditor {
  const fontSize = 12;

  export type BasePair = {
    rnaComplexIndex : number,
    rnaMoleculeName0 : string,
    rnaMoleculeName1 : string,
    nucleotideIndex0 : number,
    nucleotideIndex1 : number,
    length : number,
    type? : _BasePair.Type
  };

  export type InitialBasePair = Partial<BasePair>;

  type DefaultData = {
    defaultRnaComplexIndex? : number,
    defaultRnaMoleculeName0? : string,
    defaultRnaMoleculeName1? : string
  };

  export type InitialBasePairs = Array<InitialBasePair>;

  export type Props = DefaultData & {
    rnaComplexProps : RnaComplexProps,
    approveBasePairs : (basePairs : Array<BasePair>) => void,
    initialBasePairs? : InitialBasePairs
  };

  const defaultRepositionNucleotidesFlag = false;

  export enum EditorType {
    TABLE_BASED = "Table-based",
    TEXT_BASED = "Text-based",
    // GRAPHICS_BASED = "Graphics-based"
  }

  const editorTypes = Object.values(EditorType);

  const editorTypeToEditorMap : Record<EditorType, FunctionComponent<EditorProps>> = {
    [EditorType.TEXT_BASED] : TextBasedEditor,
    [EditorType.TABLE_BASED] : TableBasedEditor,
    // [EditorType.GRAPHICS_BASED] : GraphicsBasedEditor
  };

  export function Component(props : Props) {
    const {
      rnaComplexProps,
      approveBasePairs,
      initialBasePairs,
      defaultRnaComplexIndex,
      defaultRnaMoleculeName0,
      defaultRnaMoleculeName1
    } = props;
    // Begin context data.
    const setNucleotideKeysToRerender = useContext(Context.Nucleotide.SetKeysToRerender);
    const setBasePairKeysToEdit = useContext(Context.BasePair.SetKeysToEdit);
    const settingsRecord = useContext(Context.App.Settings);
    // Begin state data.
    const [
      editorType,
      setEditorType
    ] = useState<EditorType>(EditorType.TABLE_BASED);
    const [
      overrideConflictingBasePairsFlag,
      setOverrideConflictingBasePairsFlag
    ] = useState(false);
    const [
      repositionNucleotidesAlongBasePairAxisFlag,
      setRepositionNucleotidesAlongBasePairAxisFlag
    ] = useState(defaultRepositionNucleotidesFlag);
    const [
      repositionNucleotidesAlongHelixAxisFlag,
      setRepositionNucleotidesAlongHelixAxisFlag
    ] = useState(defaultRepositionNucleotidesFlag);
    const [
      canonicalBasePairDistance,
      setCanonicalBasePairDistance
    ] = useState(1);
    const [
      mismatchBasePairDistance,
      setMismatchBasePairDistance
    ] = useState(1);
    const [
      wobbleBasePairDistance,
      setWobbleBasePairDistance
    ] = useState(1);
    const [
      distanceBetweenContiguousBasePairs,
      setDistanceBetweenContiguousBasePairs
    ] = useState(1);
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
    const repositionNucleotidesAlongBasePairAxisFlagReference = useRef<boolean>();
    repositionNucleotidesAlongBasePairAxisFlagReference.current = repositionNucleotidesAlongBasePairAxisFlag;
    const repositionNucleotidesAlongHelixAxisFlagReference = useRef<boolean>();
    repositionNucleotidesAlongHelixAxisFlagReference.current = repositionNucleotidesAlongHelixAxisFlag;
    const canonicalBasePairDistanceReference = useRef<number>();
    canonicalBasePairDistanceReference.current = canonicalBasePairDistance;
    const wobbleBasePairDistanceReference = useRef<number>();
    wobbleBasePairDistanceReference.current = wobbleBasePairDistance;
    const mismatchBasePairDistanceReference = useRef<number>();
    mismatchBasePairDistanceReference.current = mismatchBasePairDistance;
    const distanceBetweenContiguousBasePairsReference = useRef<number>();
    distanceBetweenContiguousBasePairsReference.current = distanceBetweenContiguousBasePairs;
    // Begin memo data.
    const populateBasePairKeysToEdit = useMemo(
      function() {
        return function(basePair : BasePair, basePairKeysToEdit : Context.BasePair.KeysToEdit, addOrDelete : "add" | "delete") {
          const skippedBasePairIndices = new Array<number>();
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
                  skippedBasePairIndices.push(i);
                  alert(`The base pair on line #${i + 1} was not created due to conflicting, preexisting base pair(s). Activate the relevant option above if you want to override them.`);
                  continue;
                } else {
                  throw error;
                }
              }
            } else if (addOrDelete === "delete") {
              delete singularRnaComplexProps.basePairs[rnaMoleculeName0][formattedNucleotideIndex0];
              delete singularRnaComplexProps.basePairs[rnaMoleculeName1][formattedNucleotideIndex1];
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
          return skippedBasePairIndices;
        };
      },
      []
    );
    const setBasePairs = useMemo(
      function() {
        return function(
          newBasePairs : Array<BasePair>,
          avoidRepositioningIndicesSet : Set<number> = new Set<number>()
        ) {
          const repositionNucleotidesAlongBasePairAxisFlag = repositionNucleotidesAlongBasePairAxisFlagReference.current as boolean;
          const repositionNucleotidesAlongHelixAxisFlag = repositionNucleotidesAlongHelixAxisFlagReference.current as boolean;
          const basePairs = basePairsReference.current as Array<BasePair>;
          const canonicalBasePairDistance = canonicalBasePairDistanceReference.current as number;
          const wobbleBasePairDistance = wobbleBasePairDistanceReference.current as number;
          const mismatchBasePairDistance = mismatchBasePairDistanceReference.current as number;
          const distanceBetweenContiguousBasePairs = distanceBetweenContiguousBasePairsReference.current as number;
          const basePairKeysToEdit : Context.BasePair.KeysToEdit = {};
          for (let basePair of basePairs) {
            populateBasePairKeysToEdit(
              basePair,
              basePairKeysToEdit,
              "delete"
            );
          }
          let skippedBasePairIndices = new Array<number>();
          for (let basePair of newBasePairs) {
            skippedBasePairIndices = populateBasePairKeysToEdit(
              basePair,
              basePairKeysToEdit,
              "add"
            );
          }
          const repositionNucleotidesFlag = repositionNucleotidesAlongBasePairAxisFlag || repositionNucleotidesAlongHelixAxisFlag;
          if (repositionNucleotidesFlag) {
            const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
            const nucleotidePropSets = newBasePairs.filter(function(basePair, index) {
              return !avoidRepositioningIndicesSet.has(index);
            }).map(function(basePair) {
              const singularRnaComplexProps = rnaComplexProps[basePair.rnaComplexIndex];
              const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName0];
              const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[basePair.rnaMoleculeName1];

              const initialFormattedNucleotideIndex0 = basePair.nucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
              const initialFormattedNucleotideIndex1 = basePair.nucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
              
              const nucleotideProps = new Array<{
                0 : Nucleotide.ExternalProps,
                1 : Nucleotide.ExternalProps,
                basePairType : _BasePair.Type
              }>();
              const {
                rnaComplexIndex,
                rnaMoleculeName0,
                rnaMoleculeName1
              } = basePair;
              if (!(rnaComplexIndex in nucleotideKeysToRerender)) {
                nucleotideKeysToRerender[rnaComplexIndex] = {};
              }
              const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
              if (!(rnaMoleculeName0 in nucleotideKeysToRerenderPerRnaComplex)) {
                nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0] = [];
              }
              const nucleotideKeysToRerenderPerRnaMolecule0 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName0];
              if (!(rnaMoleculeName1 in nucleotideKeysToRerenderPerRnaComplex)) {
                nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1] = [];
              }
              const nucleotideKeysToRerenderPerRnaMolecule1 = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName1];
              for (let i = 0; i < basePair.length; i++) {
                const formattedNucleotideIndex0 = initialFormattedNucleotideIndex0 + i;
                const formattedNucleotideIndex1 = initialFormattedNucleotideIndex1 - i;
                nucleotideKeysToRerenderPerRnaMolecule0.push(formattedNucleotideIndex0);
                nucleotideKeysToRerenderPerRnaMolecule1.push(formattedNucleotideIndex1);
                const singularNucleotideProps0 = singularRnaMoleculeProps0.nucleotideProps[formattedNucleotideIndex0];
                const singularNucleotideProps1 = singularRnaMoleculeProps1.nucleotideProps[formattedNucleotideIndex1];
                nucleotideProps.push({
                  0 : singularNucleotideProps0,
                  1 : singularNucleotideProps1,
                  basePairType : basePair.type ?? getBasePairType(
                    singularNucleotideProps0.symbol,
                    singularNucleotideProps1.symbol
                  )
                });
              }
              
              return nucleotideProps;
            });
            for (let propSetIndex = 0; propSetIndex < nucleotidePropSets.length; propSetIndex++) {
              if (skippedBasePairIndices.includes(propSetIndex)) {
                continue;
              }
              const nucleotidePropSet = nucleotidePropSets[propSetIndex];
              if (nucleotidePropSet.length === 0) {
                continue;
              }
              const nucleotideProps0 = nucleotidePropSet[0];
              const anchor0 = nucleotideProps0[0];
              const anchor1 = nucleotideProps0[1];
              const anchor = scaleUp(
                add(
                  anchor0,
                  anchor1
                ),
                0.5
              );
              let anchorDirection = normalize(subtract(
                anchor1,
                anchor0
              ));
              let normalDirection = orthogonalize(anchorDirection);
              let orientationVote = 0;
              for (let i = 0; i < nucleotidePropSet.length; i++) {
                const nucleotidePropsI = nucleotidePropSet[i];
                for (const singularNucleotideProps of [nucleotidePropsI[0], nucleotidePropsI[1]]) {
                  orientationVote += sign(dotProduct(
                    subtract(
                      singularNucleotideProps,
                      anchor
                    ),
                    normalDirection
                  ));
                }
              }
              if (orientationVote < 0) {
                normalDirection = negate(normalDirection);
              }
              for (let i = 0; i < nucleotidePropSet.length; i++) {
                const nucleotidePropsWithIndicesI = nucleotidePropSet[i];
                const singularNucleotideProps0 = nucleotidePropsWithIndicesI[0];
                const singularNucleotideProps1 = nucleotidePropsWithIndicesI[1];
                const basePairType = nucleotidePropsWithIndicesI.basePairType;
                let center = scaleUp(add(
                    singularNucleotideProps0,
                    singularNucleotideProps1
                  ),
                  0.5
                );
                let dv = subtract(
                  singularNucleotideProps1,
                  singularNucleotideProps0
                );
                let dvDirection = normalize(dv);
                let distance = 0;
                if (repositionNucleotidesAlongBasePairAxisFlag) {
                  switch (basePairType) {
                    case _BasePair.Type.CANONICAL : {
                      distance = canonicalBasePairDistance;
                      break;
                    }
                    case _BasePair.Type.MISMATCH : {
                      distance = mismatchBasePairDistance;
                      break;
                    }
                    case _BasePair.Type.WOBBLE : {
                      distance = wobbleBasePairDistance;
                      break;
                    }
                    default : {
                      distance = canonicalBasePairDistance;
                    }
                  }
                } else {
                  distance = magnitude(dv);
                }
                distance *= 0.5;
                if (repositionNucleotidesAlongHelixAxisFlag) {
                  center = add(
                    anchor,
                    scaleUp(
                      normalDirection,
                      i * distanceBetweenContiguousBasePairs
                    )
                  );
                  dvDirection = anchorDirection;
                }

                dv = scaleUp(
                  dvDirection,
                  distance
                );
                let newPosition0 = subtract(
                  center,
                  dv
                );
                let newPosition1 = add(
                  center,
                  dv
                );

                singularNucleotideProps0.x = newPosition0.x;
                singularNucleotideProps0.y = newPosition0.y;
                singularNucleotideProps1.x = newPosition1.x;
                singularNucleotideProps1.y = newPosition1.y;
              }
            }
            for (const nucleotideKeysToRerenderPerRnaComplex of Object.values(nucleotideKeysToRerender)) {
              for (const nucleotideKeysToRerenderPerRnaMolecule of Object.values(nucleotideKeysToRerenderPerRnaComplex)) {
                nucleotideKeysToRerenderPerRnaMolecule.sort(subtractNumbers);
              }
            }
            setNucleotideKeysToRerender(nucleotideKeysToRerender);
          }
          for (const basePairKeysToEditPerRnaComplex of Object.values(basePairKeysToEdit)) {
            basePairKeysToEditPerRnaComplex.add.sort(compareBasePairKeys);
            basePairKeysToEditPerRnaComplex.delete.sort(compareBasePairKeys);
          }
          setBasePairKeysToEdit(basePairKeysToEdit);
          _setBasePairs(newBasePairs);
        }
      },
      []
    );
    // Begin effects.
    useEffect(
      function() {
        const initialEditorType = settingsRecord[Setting.BASE_PAIRS_EDITOR_TYPE] as EditorType;
        const initialRepositionNucleotidesFlag = settingsRecord[Setting.REPOSITION_NUCLEOTIDES_WHEN_FORMATTING] as boolean;
        const initialCanonicalBasePairDistance = settingsRecord[Setting.CANONICAL_BASE_PAIR_DISTANCE] as number;
        const initialMismatchBasePairDistance = settingsRecord[Setting.MISMATCH_BASE_PAIR_DISTANCE] as number;
        const initialWobbleBasePairDistance = settingsRecord[Setting.WOBBLE_BASE_PAIR_DISTANCE] as number;
        const initialDistanceBetweenContiguousBasePairs = settingsRecord[Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] as number;

        setEditorType(initialEditorType);
        setRepositionNucleotidesAlongBasePairAxisFlag(initialRepositionNucleotidesFlag);
        setRepositionNucleotidesAlongHelixAxisFlag(initialRepositionNucleotidesFlag);
        setCanonicalBasePairDistance(initialCanonicalBasePairDistance);
        setMismatchBasePairDistance(initialMismatchBasePairDistance);
        setWobbleBasePairDistance(initialWobbleBasePairDistance);
        setDistanceBetweenContiguousBasePairs(initialDistanceBetweenContiguousBasePairs);
      },
      []
    );
    // Begin render.
    return <>
      <Collapsible.Component
        title = "Settings"
      >
        <label>
          Override conflicting base pairs:&nbsp;
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
          Reposition nucleotides along base-pair axis:&nbsp;
          <input
            type = "checkbox"
            checked = {repositionNucleotidesAlongBasePairAxisFlag}
            onChange = {function() {
              setRepositionNucleotidesAlongBasePairAxisFlag(!repositionNucleotidesAlongBasePairAxisFlag);
            }}
          />
        </label>
        <br/>
        {repositionNucleotidesAlongBasePairAxisFlag && <>
          <ul
            style = {{
              margin : 0
            }}
          >
            <li>
              <label>
              Canonical base-pair distance:&nbsp;
              <InputWithValidator.Number
                value = {canonicalBasePairDistance}
                setValue = {setCanonicalBasePairDistance}
              />
              </label>
            </li>
            <li>
              <label>
                Mismatch base-pair distance:&nbsp;
                <InputWithValidator.Number
                  value = {mismatchBasePairDistance}
                  setValue = {setMismatchBasePairDistance}
                />
              </label>
            </li>
            <li>
              <label>
                Wobble base-pair distance:&nbsp;
                <InputWithValidator.Number
                  value = {wobbleBasePairDistance}
                  setValue = {setWobbleBasePairDistance}
                />
              </label>
            </li>
          </ul>
        </>}
        <label>
          Reposition nucleotides along helix axis:&nbsp;
          <input
            type = "checkbox"
            checked = {repositionNucleotidesAlongHelixAxisFlag}
            onChange = {function() {
              setRepositionNucleotidesAlongHelixAxisFlag(!repositionNucleotidesAlongHelixAxisFlag)
            }}
          />
        </label>
        <br/>
        {repositionNucleotidesAlongHelixAxisFlag && <>
          <ul
            style = {{
              margin : 0
            }}
          >
            <li>
              <label>
                Distance between contiguous base pairs:&nbsp;
                <InputWithValidator.Number
                  value = {distanceBetweenContiguousBasePairs}
                  setValue = {setDistanceBetweenContiguousBasePairs}
                />
              </label>
            </li>
          </ul>
        </>}
      </Collapsible.Component>
      <Collapsible.Component
        title = "Base-pairs editor"
      >
        <label>
          Editor type:&nbsp;
          <EditorTypeSelector.Component
            editorType = {editorType}
            onChange = {setEditorType}
          />
        </label>
        <br/>
        {createElement(
          editorTypeToEditorMap[editorType],
          {
            rnaComplexProps,
            setBasePairs,
            defaultRnaComplexIndex,
            defaultRnaMoleculeName0,
            defaultRnaMoleculeName1,
            approveBasePairs,
            initialBasePairs
          }
        )}
      </Collapsible.Component>
    </>;
  }

  type EditorProps = DefaultData & {
    rnaComplexProps : RnaComplexProps,
    setBasePairs : (
      newBasePairs : Array<BasePair>,
      avoidRepositioningIndicesSet? : Set<number>
    ) => void,
    approveBasePairs : (newBasePairs : Array<BasePair>) => void,
    initialBasePairs? : Array<InitialBasePair>
  };

  export namespace EditorTypeSelector {
    export type Props = {
      editorType : EditorType,
      onChange : (editorType : EditorType) => void
    }

    export function Component(props : Props) {
      const {
        editorType,
        onChange
      } = props;
      return <select
        value = {editorType}
        onChange = {function(e) {
          onChange(e.target.value as EditorType);
        }}
      >
        {editorTypes.map(function(editorType, index) {
          return <option
            key = {index}
            value = {editorType}
          >
            {editorType}
          </option>;
        })}
      </select>
    }
  }

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
    const [
      textAreaLineCount,
      _setTextAreaLineCount
    ] = useState(0);
    function setTextAreaLineCount(unboundTextAreaLineCount : number) {
      _setTextAreaLineCount(Math.min(unboundTextAreaLineCount, 5));
    }
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
        setTextAreaLineCount(initialBasePairs.length + 1);
      },
      [initialBasePairs]
    );
    return <>
      <textarea
        style = {{
          width : "99%",
          height : `${fontSize * textAreaLineCount}px`,
          fontSize : `${fontSize}px`
        }}
        value = {text}
        onInput = {function(e : React.ChangeEvent<HTMLTextAreaElement>) {
          const newText = e.target.value;
          setTextAreaLineCount((newText.match(/\n/g)?.length ?? -1) + 2);
        }}
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
              const match = line.match(/^(-?\d+)\s+(-?\d+)\s+(\d+)(?:\s+("[^"]*"))?(?:\s+("[^"]*"))?(?:\s+("[^"]*"))?(?:\s+("[^"]*"))?$/);
              if (match === null) {
                throw `line #${lineIndex + 1} had an unrecognized format.`;
              }
              const stringsSeparatedByWhitespace = match.slice(1).filter(function(_string) {
                return _string !== undefined && _string.length > 0;
              });
              // const stringsSeparatedByWhitespace = line.split(/\s+/).filter(function(_string) {
              //   return _string.length > 0;
              // });
              // Format: nucleotideIndex0 nucleotideIndex1 length rnaMoleculeName0? rnaMoleculeName1? rnaComplexName?
              if (stringsSeparatedByWhitespace.length < 3) {
                throw `Too few arguments were found in line #${lineIndex + 1}`;
              }
              const nucleotideIndex0String = stringsSeparatedByWhitespace[0];
              const nucleotideIndex0 = Number.parseInt(nucleotideIndex0String);
              const nucleotideIndex0ErrorMessage = `The provided nucleotide index #1 in line #${lineIndex + 1} is not an integer.`;
              if (!/^-?\d+$/.test(nucleotideIndex0String)) {
                throw nucleotideIndex0ErrorMessage;
              }
              if (Number.isNaN(nucleotideIndex0)) {
                throw nucleotideIndex0ErrorMessage;
              }
              const nucleotideIndex1String = stringsSeparatedByWhitespace[1];
              const nucleotideIndex1 = Number.parseInt(nucleotideIndex1String);
              const nucleotideIndex1ErrorMessage = `The provided nucleotide index #2 in line #${lineIndex + 1} is not an integer.`;
              if (!/^-?\d+$/.test(nucleotideIndex1String)) {
                throw nucleotideIndex1ErrorMessage;
              }
              if (Number.isNaN(nucleotideIndex1)) {
                throw nucleotideIndex1ErrorMessage;
              }
              const lengthString = stringsSeparatedByWhitespace[2];
              const lengthErrorMessage = `The provided helix length in line #${lineIndex + 1} is not a non-negative integer.`;
              if (!/^\d+$/.test(lengthString)) {
                throw lengthErrorMessage;
              }
              const length = Number.parseInt(lengthString);
              if (Number.isNaN(length)) {
                throw lengthErrorMessage;
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
                  throw `No name was provided for the RNA complex in line #${lineIndex + 1}.`;
                }
                rnaComplexIndex = defaultRnaComplexIndex;
              } else {
                const rnaComplexName = getFormattedName(stringsSeparatedByWhitespace[5]);
                rnaComplexIndex = rnaComplexNames.findIndex(function(rnaComplexNameI) {
                  return rnaComplexName === rnaComplexNameI;
                });
                if (rnaComplexIndex === -1) {
                  throw `The provided RNA complex name in line #${lineIndex + 1} does not match any existing RNA complex's name.`;
                }
              }
              const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
              let rnaMoleculeName0 : string;
              if (stringsSeparatedByWhitespace.length < 4) {
                if (defaultRnaMoleculeName0 === undefined) {
                  throw `No name was provided for RNA-molecule #1 in line #${lineIndex + 1}.`;
                }
                rnaMoleculeName0 = defaultRnaMoleculeName0;
              } else {
                rnaMoleculeName0 = getFormattedName(stringsSeparatedByWhitespace[3]);
              }
              if (!(rnaMoleculeName0 in singularRnaComplexProps.rnaMoleculeProps)) {
                throw `The name provided for RNA molecule #1 in line #${lineIndex + 1} does not match any existing RNA molecule's name.`;
              }
              let rnaMoleculeName1 : string;
              if (stringsSeparatedByWhitespace.length < 5) {
                if (defaultRnaMoleculeName1 === undefined) {
                  throw `No name was provided for RNA-molecule #2 in line #${lineIndex + 1}.`;
                }
                rnaMoleculeName1 = defaultRnaMoleculeName1;
              } else {
                rnaMoleculeName1 = getFormattedName(stringsSeparatedByWhitespace[4]);
              }
              if (!(rnaMoleculeName1 in singularRnaComplexProps.rnaMoleculeProps)) {
                throw `The name provided for RNA molecule #2 in line #${lineIndex + 1} does not match any existing RNA molecule's name.`;
              }
              const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
              const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
              for (let i = 0; i < length; i++) {
                const formattedNucleotideIndex0 = nucleotideIndex0 + i;
                const formattedNucleotideIndex1 = nucleotideIndex1 - i;
                if (!(formattedNucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
                  throw `The provided helix data includes a non-existent nucleotide at nucleotide index #${formattedNucleotideIndex0}.`;
                }
                if (!(formattedNucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
                  throw `The provided helix data includes a non-existent nucleotide at nucleotide index #${formattedNucleotideIndex1}.`;
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
                  throw `The provided base-pair type "${type}" in line #${lineIndex + 1} was not recognized.`;
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

  type SingularFlattenedRnaComplexProps = {
    rnaComplexIndex : number,
    singularRnaComplexProps : RnaComplex.ExternalProps
  };

  export function TableBasedEditor(props : EditorProps) {
    const {
      rnaComplexProps,
      setBasePairs : setBasePairsHelper,
      approveBasePairs,
      initialBasePairs,
      defaultRnaComplexIndex,
      defaultRnaMoleculeName0,
      defaultRnaMoleculeName1
    } = props;
    // Begin state data.
    const [
      basePairs,
      _setBasePairs
    ] = useState<Array<BasePair>>([]);
    const [
      partialBasePairs,
      setPartialBasePairs
    ] = useState<Array<Partial<BasePair>>>([]);
    function setBasePairs(
      basePairs : Array<BasePair>,
      avoidRepositioningIndicesSet : Set<number>
    ) {
      _setBasePairs(basePairs);
      try {
        approveBasePairs(basePairs);
        setBasePairsHelper(
          basePairs,
          avoidRepositioningIndicesSet
        );
      } catch (error) {
        if (typeof error === "string") {
          alert(error);
          return;
        } else {
          throw error;
        }
      }
    }
    // Begin memo data
    const flattenedRnaComplexProps : Array<SingularFlattenedRnaComplexProps> = useMemo(
      function() {
        return Object.entries(rnaComplexProps).map(function([rnaComplexIndexAsString, singularRnaComplexProps]) {
          return {
            rnaComplexIndex : Number.parseInt(rnaComplexIndexAsString),
            singularRnaComplexProps
          };
        });
      },
      [rnaComplexProps]
    );
    // Begin effects.
    useEffect(
      function() {
        const _basePairs = new Array<BasePair>();
        const _partialBasePairs = new Array<Partial<BasePair>>();
        for (const _initialBasePair of initialBasePairs ?? []) {
          const initialBasePair = {
            rnaComplexIndex : defaultRnaComplexIndex,
            rnaMoleculeName0 : defaultRnaMoleculeName0,
            rnaMoleculeName1 : defaultRnaMoleculeName1,
            ..._initialBasePair
          };
          if (
            initialBasePair.rnaComplexIndex === undefined ||
            initialBasePair.rnaMoleculeName0 === undefined ||
            initialBasePair.rnaMoleculeName1 === undefined ||
            initialBasePair.nucleotideIndex0 === undefined ||
            initialBasePair.nucleotideIndex1 === undefined ||
            initialBasePair.length === undefined
          ) {
            _partialBasePairs.push(initialBasePair);
          } else {
            _basePairs.push(initialBasePair as BasePair);
          }
        }
        _setBasePairs(_basePairs);
        if (_partialBasePairs.length === 0) {
          _partialBasePairs.push({});
        }
        setPartialBasePairs(_partialBasePairs);
      },
      [initialBasePairs]
    );
    return <div
      style = {{
        maxHeight : 400,
        overflow : "auto",
        background : TOOLS_DIV_BACKGROUND_COLOR,
        position : "sticky"
      }}
    >
      <table
        style = {{
          border : "inherit",
          borderCollapse : "collapse",
          borderSpacing : 0,
          width : "auto",
          position : "sticky",
          top : 0,
          boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
          background : "inherit"
        }}
      >
        <thead
          style = {{
            border : "1px solid black",
            position : "sticky",
            top : -1,
            boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
            background : "inherit"
          }}
        >
          <tr
            style = {{
              border : "inherit",
              position : "sticky",
              top : 0,
              background : "inherit"
            }}
          >
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              RNA complex
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              RNA molecule #1
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              Nucleotide #1
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              RNA molecule #2
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              Nucleotide #2
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              Length
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              Type
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              Edit
            </th>
            <th
              style = {{
                border : "inherit",
                position : "sticky",
                top : 0,
                boxShadow : "0 2px 2px -1px rgba(0, 0, 0, 0.4)",
                background : "inherit"
              }}
            >
              Add / Delete
            </th>
          </tr>
        </thead>
        <tbody
          style = {{
            border : "inherit"
          }}
        >
          {basePairs.map(function(basePair, basePairIndex) {
            const {
              rnaComplexIndex,
              rnaMoleculeName0,
              rnaMoleculeName1,
              nucleotideIndex0,
              nucleotideIndex1,
              length,
              type
            } = basePair;
            const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
            return <tr
              key = {basePairIndex}
              style = {{
                textAlign : "center"
              }}
            >
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {singularRnaComplexProps.name}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {rnaMoleculeName0}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {nucleotideIndex0}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {rnaMoleculeName1}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {nucleotideIndex1}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {length}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                {type ?? "auto"}
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                <button
                  style = {{
                    width : "100%",
                    height : "100%"
                  }}
                  onClick = {function() {
                    setPartialBasePairs([
                      ...partialBasePairs,
                      basePair
                    ]);
                    _setBasePairs([
                     ...basePairs.slice(0, basePairIndex),
                     ...basePairs.slice(basePairIndex + 1)
                    ]); 
                  }}
                >
                  Edit
                </button>
              </td>
              <td
                style = {{
                  border : "1px solid black",
                  textAlign : "center"
                }}
              >
                <button
                  style = {{
                    width : "100%",
                    height : "100%"
                  }}
                  onClick = {function() {
                    const avoidRepositioningIndicesSet = new Set<number>();
                    for (let index = 0; index < basePairs.length; index++) {
                      avoidRepositioningIndicesSet.add(index);
                    }
                    setBasePairs(
                      [
                        ...basePairs.slice(0, basePairIndex),
                        ...basePairs.slice(basePairIndex + 1)
                      ],
                      avoidRepositioningIndicesSet
                    ); 
                  }}
                >
                  Delete
                </button>
              </td>
            </tr>;
          })}
          <tr
            style = {{
              border : "inherit",
              background : "black",
              height : 10
            }}
          >
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
            <td></td>
          </tr>
          {partialBasePairs.map(function(partialBasePair, partialBasePairIndex) {
            function updateBasePairs() {
              const avoidRepositioningIndicesSet = new Set<number>();
              for (let index = 0; index < basePairs.length; index++) {
                avoidRepositioningIndicesSet.add(index);
              }
              setBasePairs(
                [
                  ...basePairs,
                  structuredClone(partialBasePair as BasePair)
                ],
                avoidRepositioningIndicesSet
              );
            }
            const addButtonOnClick = partialBasePairIndex === 0 ? function() {
              updateBasePairs();
              partialBasePair.rnaComplexIndex = undefined;
              partialBasePair.rnaMoleculeName0 = undefined;
              partialBasePair.rnaMoleculeName1 = undefined;
              partialBasePair.nucleotideIndex0 = undefined;
              partialBasePair.nucleotideIndex1 = undefined;
              partialBasePair.length = undefined;
              partialBasePair.type = undefined;
              setPartialBasePairs([...partialBasePairs]);
            } : function() {
              updateBasePairs();
              setPartialBasePairs([
                ...partialBasePairs.slice(0, partialBasePairIndex),
                ...partialBasePairs.slice(partialBasePairIndex + 1)
              ]);
            };
            return <TableRow
              key = {partialBasePairIndex}
              {...partialBasePair}
              setRnaComplexIndex = {function(newRnaComplexIndex) {
                partialBasePair.rnaComplexIndex = newRnaComplexIndex;
                setPartialBasePairs([...partialBasePairs]);
              }}
              setRnaMoleculeName0 = {function(newRnaMoleculeName0) {
                partialBasePair.rnaMoleculeName0 = newRnaMoleculeName0;
                partialBasePair.nucleotideIndex0 = undefined;
                setPartialBasePairs([...partialBasePairs]);
              }}
              setRnaMoleculeName1 = {function(newRnaMoleculeName1) {
                partialBasePair.rnaMoleculeName1 = newRnaMoleculeName1;
                partialBasePair.nucleotideIndex1 = undefined;
                setPartialBasePairs([...partialBasePairs]);
              }}
              setNucleotideIndex0 = {function(newNucleotideIndex0) {
                partialBasePair.nucleotideIndex0 = newNucleotideIndex0;
                setPartialBasePairs([...partialBasePairs]);
              }}
              setNucleotideIndex1 = {function(newNucleotideIndex1) {
                partialBasePair.nucleotideIndex1 = newNucleotideIndex1;
                setPartialBasePairs([...partialBasePairs]);
              }}
              setLength = {function(newLength) {
                partialBasePair.length = newLength;
                setPartialBasePairs([...partialBasePairs]);
              }}
              setType = {function(newType) {
                partialBasePair.type = newType;
                setPartialBasePairs([...partialBasePairs]);
              }}
              rnaComplexProps = {rnaComplexProps}
              flattenedRnaComplexProps = {flattenedRnaComplexProps}
              addButtonOnClick = {addButtonOnClick}
            />;
          })}
        </tbody>
      </table>
    </div>;
  }

  export function TableRow(props : Partial<BasePair> & {
    flattenedRnaComplexProps : Array<SingularFlattenedRnaComplexProps>,
    rnaComplexProps : RnaComplexProps,
    setRnaComplexIndex : (rnaComplexIndex : number) => void,
    setRnaMoleculeName0 : (rnaMoleculeName : string) => void,
    setRnaMoleculeName1 : (rnaMoleculeName : string) => void,
    setNucleotideIndex0 : (nucleotideIndex : number) => void,
    setNucleotideIndex1 : (nucleotideIndex : number) => void,
    setLength : (length : number) => void,
    setType : (type : _BasePair.Type | undefined) => void,
    addButtonOnClick : () => void
  }) {
    const {
      rnaComplexIndex,
      rnaMoleculeName0,
      rnaMoleculeName1,
      nucleotideIndex0,
      nucleotideIndex1,
      length,
      type,
      flattenedRnaComplexProps,
      rnaComplexProps,
      setRnaComplexIndex,
      setRnaMoleculeName0,
      setRnaMoleculeName1,
      setNucleotideIndex0,
      setNucleotideIndex1,
      setLength,
      setType,
      addButtonOnClick
    } = props;
    // Begin memo data.
    const {
      singularRnaComplexProps,
      rnaMoleculeNames
    } = useMemo(
      function() {
        let singularRnaComplexProps = undefined;
        let rnaMoleculeNames = new Array<string>();
        if (rnaComplexIndex !== undefined) {
          singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
          rnaMoleculeNames = Object.keys(singularRnaComplexProps.rnaMoleculeProps);
        }
        return {
          singularRnaComplexProps,
          rnaMoleculeNames
        };
      },
      [rnaComplexIndex]
    );
    const singularRnaMoleculeProps0 = useMemo(
      function() {
        return rnaMoleculeName0 === undefined ? undefined : (singularRnaComplexProps as RnaComplex.ExternalProps).rnaMoleculeProps[rnaMoleculeName0];
      },
      [rnaMoleculeName0]
    );
    const singularRnaMoleculeProps1 = useMemo(
      function() {
        return rnaMoleculeName1 === undefined ? undefined : (singularRnaComplexProps as RnaComplex.ExternalProps).rnaMoleculeProps[rnaMoleculeName1];
      },
      [rnaMoleculeName1]
    );
    return <tr
      style = {{
        border : "inherit",
        maxHeight : fontSize
      }}
    >
      <td
        style = {{
          border : "inherit"
        }}
      >
        <select
          style = {{
            width : "100%",
            height : "100%"
          }}
          value = {rnaComplexIndex ?? -1}
          onChange = {function(e) {
            const newRnaComplexIndex = Number.parseInt(e.target.value);
            setRnaComplexIndex(newRnaComplexIndex);
          }}
        >
          <option
            style = {{
              display : "none"
            }}
          >
            Select an RNA complex
          </option>
          {flattenedRnaComplexProps.map(function({
            rnaComplexIndex,
            singularRnaComplexProps
          }) {
            return <option
              key = {rnaComplexIndex}
              value = {rnaComplexIndex}
            >
              {singularRnaComplexProps.name}
            </option>;
          })}
        </select>
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <select
          style = {{
            width : "100%",
            height : "100%"
          }}
          disabled = {rnaMoleculeNames.length === 0}
          value = {rnaMoleculeName0}
          onChange = {function(e) {
            const newRnaMoleculeName0 = e.target.value;
            setRnaMoleculeName0(newRnaMoleculeName0);
          }}
        >
          <option
            style = {{
              display : "none"
            }}
          >
            Select an RNA molecule
          </option>
          {rnaMoleculeNames.map(function(rnaMoleculeName) {
            return <option
              key = {rnaMoleculeName}
              value = {rnaMoleculeName}
            >
              {rnaMoleculeName}
            </option>;
          })}
        </select>
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <InputWithValidator.Integer
          style = {{
            verticalAlign : "middle",
            width : "100%",
            height : "100%"
          }}
          disabledFlag = {singularRnaMoleculeProps0 === undefined}
          value = {nucleotideIndex0 ?? NaN}
          setValue = {setNucleotideIndex0}
          stringToValue = {function(valueAsString : string) {
            const toValueAttempt = parseIntReturnUndefinedOnFail(valueAsString);
            if (toValueAttempt !== undefined && !(toValueAttempt in (singularRnaMoleculeProps0 as RnaMolecule.ExternalProps).nucleotideProps)) {
              return {
                errorMessage : `Nucleotide #${toValueAttempt} does not exist in RNA molecule #1`
              };
            }
            return toValueAttempt;
          }}
        />
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <select
          style = {{
            width : "100%",
            height : "100%"
          }}
          disabled = {rnaMoleculeNames.length === 0}
          value = {rnaMoleculeName1}
          onChange = {function(e) {
            const rnaMoleculeName1 = e.target.value;
            setRnaMoleculeName1(rnaMoleculeName1);
          }}
        >
          <option
            style = {{
              display : "none"
            }}
          >
            Select an RNA molecule
          </option>
          {rnaMoleculeNames.map(function(rnaMoleculeName) {
            return <option
              key = {rnaMoleculeName}
              value = {rnaMoleculeName}
            >
              {rnaMoleculeName}
            </option>;
          })}
        </select>
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <InputWithValidator.Integer
          style = {{
            verticalAlign : "middle",
            width : "100%",
            height : "100%"
          }}
          disabledFlag = {singularRnaMoleculeProps1 === undefined}
          value = {nucleotideIndex1 ?? NaN}
          setValue = {setNucleotideIndex1}
          stringToValue = {function(valueAsString : string) {
            const toValueAttempt = parseIntReturnUndefinedOnFail(valueAsString);
            if (toValueAttempt !== undefined && !(toValueAttempt in (singularRnaMoleculeProps1 as RnaMolecule.ExternalProps).nucleotideProps)) {
              return {
                errorMessage : `Nucleotide #${toValueAttempt} does not exist in RNA molecule #2`
              };
            }
            return toValueAttempt;
          }}
        />
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <InputWithValidator.Integer
          style = {{
            width : "100%",
            height : "100%"
          }}
          value = {length ?? NaN}
          setValue = {setLength}
          stringToValue = {function(valueAsString : string) {
            const toValueAttempt = parseIntReturnUndefinedOnFail(valueAsString);
            if (toValueAttempt !== undefined && toValueAttempt < 0) {
              return {
                errorMessage : `Length must be non-negative`
              };
            }
            return toValueAttempt;
          }}
        />
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <select
          style = {{
            width : "100%",
            height : "100%"
          }}
          value = {type ?? -1}
          onChange = {function(e) {
            const newType = e.target.value;
            setType(newType === "auto" ? undefined : newType as _BasePair.Type);
          }}
        >
          <option
            style = {{
              display : "none"
            }}
          >
            Select a base-pair type
          </option>
          {["auto", ..._BasePair.types].map(function(_type) {
            return <option
              key = {_type}
              value = {_type}
            >
              {_type}
            </option>;
          })}
        </select>
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize,
          textAlign : "center"
        }}
      >
        <span
          style = {{
            width : "100%",
            height : "100%",
            textAlign : "center"
          }}
        >
          N/A
        </span>
      </td>
      <td
        style = {{
          border : "inherit",
          maxHeight : fontSize
        }}
      >
        <button
          disabled = {!(
            rnaComplexIndex !== undefined &&
            rnaMoleculeName0 !== undefined &&
            rnaMoleculeName1 !== undefined &&
            nucleotideIndex0 !== undefined && 
            nucleotideIndex1 !== undefined &&
            length !== undefined &&
            length >= 0
          )}
          style = {{
            width : "100%",
            height : "100%"
          }}
          onClick = {addButtonOnClick}
        >
          Add
        </button>
      </td>
    </tr>;
  }

  export function GraphicsBasedEditor(props : EditorProps) {
    return <></>;
  }
}