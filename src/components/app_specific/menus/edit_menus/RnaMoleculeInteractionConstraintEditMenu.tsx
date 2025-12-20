import { useContext, useEffect, useMemo, useState } from "react";
import { RnaComplexProps } from "../../../../App";
import InputWithValidator from "../../../generic/InputWithValidator";
import { BasePairKeysToRerender, Context, NucleotideKeysToRerender } from "../../../../context/Context";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import { Vector2D, add } from "../../../../data_structures/Vector2D";
import { parseInteger, subtractNumbers, subtractNumbersNegated } from "../../../../utils/Utils";
import { AllInOneEditor } from "../../../../ui/InteractionConstraint/InteractionConstraints/AllInOneEditor";

export namespace RnaMoleculeInteractionConstraintEditMenu {
    export type Props = {
      initialName : string,
      rnaComplexIndex : number,
      rnaMoleculeName : string,
      rnaComplexProps : RnaComplexProps,
      setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
      setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void
    };
  
    export function Component(props : Props) {
      const {
        initialName,
        rnaComplexIndex,
        rnaMoleculeName,
        rnaComplexProps,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender
      } = props;
      const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
      // Begin context data.
      const updateRnaMoleculeNameHelper = useContext(Context.App.UpdateRnaMoleculeNameHelper);
      const indicesOfFrozenNucleotides = useContext(Context.App.IndicesOfFrozenNucleotides);
      const indicesOfFrozenNucleotidesPerRnaComplex = rnaComplexIndex in indicesOfFrozenNucleotides ? indicesOfFrozenNucleotides[rnaComplexIndex] : {};
      const indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule = rnaMoleculeName in indicesOfFrozenNucleotidesPerRnaComplex ? indicesOfFrozenNucleotidesPerRnaComplex[rnaMoleculeName] : new Set<number>();
      // Begin state data.
      const [
        name,
        setName
      ] = useState(initialName);
      // Begin effects.
      useEffect(
        function() {
          setName(initialName)
        },
        [initialName]
      );
      // Begin memo data.
      const {
        orientationEditorProps,
        errorMessage
      } = useMemo(
        function() {
          const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[initialName];
          const basePairsPerRnaMolecule = basePairsPerRnaComplex[initialName];
          const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
          const nucleotideIndices = Object.keys(nucleotideProps).map(parseInteger);
          const toBeDragged = new Array<Vector2D>();
          const nucleotideKeysToRerender : NucleotideKeysToRerender = {
            [rnaComplexIndex] : {
              [initialName] : []
            }
          };
          const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
          const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[initialName];
          const basePairKeysToRerender : BasePairKeysToRerender = {
            [rnaComplexIndex] : []
          };
          const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
          let boundingVectors : { 0 : Vector2D, 1 : Vector2D } | undefined = undefined;
          // Iterate nucleotide indices in decrementing fashion.
          nucleotideIndices.sort(subtractNumbersNegated);
          let foundBasePairBetweenRnaMoleculesFlag = false;
          for (let nucleotideIndex of nucleotideIndices) {
            nucleotideKeysToRerenderPerRnaMolecule.unshift(nucleotideIndex);
            const singularNucleotideProps = nucleotideProps[nucleotideIndex];

            if (!indicesOfFrozenNucleotidesPerRnaComplexPerRnaMolecule.has(nucleotideIndex)) {
              toBeDragged.unshift(singularNucleotideProps);
            }
            if (basePairsPerRnaMolecule && nucleotideIndex in basePairsPerRnaMolecule) {
              basePairKeysToRerenderPerRnaComplex.unshift({
                rnaMoleculeName : initialName,
                nucleotideIndex
              });
              const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
              for (const basePairPerNucleotide of basePairsPerNucleotide) {
                if (basePairPerNucleotide.rnaMoleculeName !== initialName) {
                  foundBasePairBetweenRnaMoleculesFlag = true;
                }
              }
              const maximumBasePairedNucleotideIndex = basePairsPerNucleotide.reduce((maximumBasePairedNucleotideIndex, basePairPerNucleotide) => Math.max(maximumBasePairedNucleotideIndex, basePairPerNucleotide.nucleotideIndex), Number.NEGATIVE_INFINITY);
              boundingVectors = {
                0 : singularNucleotideProps,
                1 : nucleotideProps[maximumBasePairedNucleotideIndex]
              };
            }
          }
          if (boundingVectors === undefined) {
            const boundingVector0 = Object.values(nucleotideProps)[0];
            boundingVectors = {
              0 : add(
                boundingVector0,
                {
                  x : -1,
                  y : 0
                }
              ),
              1 : add(
                boundingVector0,
                {
                  x : 1,
                  y : 0
                }
              )
            };
          }
          function rerender() {
            setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
            setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
          }
          if (foundBasePairBetweenRnaMoleculesFlag) {
            return {
              errorMessage : "Cannot re-position nucleotides of this RNA molecule, because it is base-paired to another RNA molecule.",
              orientationEditorProps : {
                boundingVector0 : {
                  x : 0,
                  y : 0
                },
                boundingVector1 : {
                  x : 1,
                  y : 0
                },
                positions : toBeDragged,
                onUpdatePositions : rerender,
                disabledFlag : true
              }
            };
          }
          return {
            orientationEditorProps : {
              positions : toBeDragged,
              onUpdatePositions : rerender,
              boundingVector0 : boundingVectors[0],
              boundingVector1 : boundingVectors[1]
            },
            errorMessage : undefined
          };
          // <AppSpecificOrientationEditor.Simplified
          //   positions = {toBeDragged}
          //   onUpdatePositions = {function() {
          //     setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
          //     setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
          //   }}
          //   boundingVector0 = {boundingVectors[0]}
          //   boundingVector1 = {boundingVectors[1]}
          // />
        },
        [initialName]
      );

      return <>
        Name:&nbsp;
        <InputWithValidator.Component<string>
          value = {name}
          setValue = {function(newName) {
            setName(newName);
          }}
          valueToString = {function(value : string) {
            // Identity function.
            return value;
          }}
          stringToValue = {function(newRnaMoleculeName : string) {
            if (newRnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
              alert("This RNA-molecule name already represents a different molecule in this RNA complex. Change the name of the other RNA molecule first.");
              return {
                errorMessage : "This RNA-molecule name already represents a different molecule in this RNA complex. Change the name of the other RNA molecule first."
              };
            }
            updateRnaMoleculeNameHelper(
              rnaComplexIndex,
              name,
              newRnaMoleculeName
            );
            return newRnaMoleculeName;
          }}
          htmlInputType = {"text"}
        />
        <br/>
        {errorMessage && <>
          {errorMessage}
          <br/>
        </>}
        <AllInOneEditor.Simplified
          {...orientationEditorProps}
        />
      </>;
    }
  }