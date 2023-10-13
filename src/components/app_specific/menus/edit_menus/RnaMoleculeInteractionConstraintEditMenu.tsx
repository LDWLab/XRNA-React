import { useContext, useEffect, useMemo, useState } from "react";
import { RnaComplexProps } from "../../../../App";
import InputWithValidator from "../../../generic/InputWithValidator";
import { BasePairKeysToRerender, Context, NucleotideKeysToRerender } from "../../../../context/Context";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import { Vector2D, add } from "../../../../data_structures/Vector2D";
import { parseInteger, subtractNumbers, subtractNumbersNegated } from "../../../../utils/Utils";

export namespace RnaMoleculeInteractionConstraintEditMenu {
    export type Props = {
      initialName : string,
      rnaComplexIndex : number,
      rnaComplexProps : RnaComplexProps,
      setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
      setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void
    };
  
    export function Component(props : Props) {
      const {
        initialName,
        rnaComplexIndex,
        rnaComplexProps,
        setNucleotideKeysToRerender,
        setBasePairKeysToRerender
      } = props;
      const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
      const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
      // Begin context data.
      const updateRnaMoleculeNameHelper = useContext(Context.App.UpdateRnaMoleculeNameHelper);
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
      const orientationEditor : JSX.Element = useMemo(
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
          for (let nucleotideIndex of nucleotideIndices) {
            nucleotideKeysToRerenderPerRnaMolecule.unshift(nucleotideIndex);
            const singularNucleotideProps = nucleotideProps[nucleotideIndex];
            toBeDragged.unshift(singularNucleotideProps);
            if (nucleotideIndex in basePairsPerRnaMolecule) {
              basePairKeysToRerenderPerRnaComplex.unshift({
                rnaMoleculeName : initialName,
                nucleotideIndex
              });
              const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
              if (mappedBasePairInformation.rnaMoleculeName !== initialName) {
                return <>
                  Cannot re-position nucleotides of this RNA molecule, because it is base-paired to another RNA molecule.
                  <AppSpecificOrientationEditor.Component
                    initialCenter = {{
                      x : 0,
                      y : 0
                    }}
                    positions = {[]}
                    onUpdatePositions = {function() {
                      // Do nothing.
                    }}
                    normal = {{
                      x : 1,
                      y : 0
                    }}
                    disabledFlag = {true}
                  />
                </>;
              }
              boundingVectors = {
                0 : singularNucleotideProps,
                1 : nucleotideProps[mappedBasePairInformation.nucleotideIndex]
              };
            }
          }
          if (boundingVectors === undefined) {
            const boundingVector0 = nucleotideProps[0];
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
          return <AppSpecificOrientationEditor.Simplified
            positions = {toBeDragged}
            onUpdatePositions = {function() {
              setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
              setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
            }}
            boundingVector0 = {boundingVectors[0]}
            boundingVector1 = {boundingVectors[1]}
          />
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
        {orientationEditor}
      </>;
    }
  }