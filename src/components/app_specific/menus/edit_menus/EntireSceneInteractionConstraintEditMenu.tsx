import { useContext, useMemo, useState } from "react";
import { BasePairKeysToRerender, Context, NucleotideKeysToRerender } from "../../../../context/Context";
import { RnaComplexProps } from "../../../../App";
import { Vector2D } from "../../../../data_structures/Vector2D";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import { ColorsAndPositionsEditor } from "../../../../ui/InteractionConstraint/InteractionConstraints/ColorsAndPositionsEditor";

export namespace EntireSceneInteractionConstraintEditMenu {
  export type Props = {
    setNucleotideKeysToRerender : (nucleotideKeysToRerender : NucleotideKeysToRerender) => void,
    setBasePairKeysToRerender : (basePairKeysToRerender : BasePairKeysToRerender) => void,
    rnaComplexProps : RnaComplexProps
  };

  export function Component(props : Props) {
    const {
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      rnaComplexProps
    } = props;
    // Begin context data.
    const _complexDocumentName = useContext(Context.App.ComplexDocumentName);
    const _setComplexDocumentName = useContext(Context.App.SetComplexDocumentName);
    // Begin state data.
    const [
      complexDocumentName,
      setComplexDocumentName
    ] = useState(_complexDocumentName);
    // Begin memo data.
    const orientationEditor = useMemo(
      function() {
        const positions = new Array<Vector2D>();
        const flattenedRnaComplexProps = Object.entries(rnaComplexProps).map(function([
          rnaComplexIndexAsString,
          singularRnaComplexProps
        ]) {
          return {
            rnaComplexIndex : Number.parseInt(rnaComplexIndexAsString),
            singularRnaComplexProps
          };
        });
        flattenedRnaComplexProps.reverse();
        let boundingVectors = {
          0 : {
            x : -1,
            y : 0
          },
          1 : {
            x : 1,
            y : 0
          }
        };
        const nucleotideKeysToRerender : NucleotideKeysToRerender = {};
        const basePairKeysToRerender : BasePairKeysToRerender = {};
        function rerender() {
          setNucleotideKeysToRerender(structuredClone(nucleotideKeysToRerender));
          setBasePairKeysToRerender(structuredClone(basePairKeysToRerender));
        }
        for (let { rnaComplexIndex, singularRnaComplexProps } of flattenedRnaComplexProps) {
          const flattenedRnaMoleculeProps = Object.entries(singularRnaComplexProps.rnaMoleculeProps);
          flattenedRnaMoleculeProps.reverse();
          const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
          nucleotideKeysToRerender[rnaComplexIndex] = {};
          const nucleotideKeysToRerenderPerRnaComplex = nucleotideKeysToRerender[rnaComplexIndex];
          basePairKeysToRerender[rnaComplexIndex] = [];
          const basePairKeysToRerenderPerRnaComplex = basePairKeysToRerender[rnaComplexIndex];
          for (let [rnaMoleculeName, singularRnaMoleculeProps] of flattenedRnaMoleculeProps) {
            const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
            nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName] = [];
            const nucleotideKeysToRerenderPerRnaMolecule = nucleotideKeysToRerenderPerRnaComplex[rnaMoleculeName];
            const flattenedNucleotideProps = Object.entries(singularRnaMoleculeProps.nucleotideProps).map(function([
              nucleotideIndexAsString,
              singularNucleotideProps
            ]) {
              return {
                nucleotideIndex : Number.parseInt(nucleotideIndexAsString),
                singularNucleotideProps
              };
            });
            for (let { nucleotideIndex, singularNucleotideProps } of flattenedNucleotideProps) {
              nucleotideKeysToRerenderPerRnaMolecule.push(nucleotideIndex);
              positions.push(singularNucleotideProps);
              if (nucleotideIndex in basePairsPerRnaMolecule) {
                basePairKeysToRerenderPerRnaComplex.push({
                  rnaMoleculeName,
                  nucleotideIndex
                });
                const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
                boundingVectors = {
                  0 : singularNucleotideProps,
                  1 : singularRnaComplexProps.rnaMoleculeProps[mappedBasePairInformation.rnaMoleculeName].nucleotideProps[mappedBasePairInformation.nucleotideIndex]
                };
              }
            }
          }
        }
        return <ColorsAndPositionsEditor.Component
          boundingVector0 = {boundingVectors[0]}
          boundingVector1 = {boundingVectors[1]}
          positions = {positions}
          onUpdatePositions = {rerender}
        />
      },
      [rnaComplexProps]
    );
    return <>
      <label>
        Name:&nbsp;
        <input
          type = "text"
          value = {complexDocumentName}
          onChange = {function(e) {
            const newComplexDocumentName = e.target.value;
            setComplexDocumentName(newComplexDocumentName);
            _setComplexDocumentName(newComplexDocumentName);
          }}
        />
      </label>
      <br/>
      {orientationEditor}
    </>;
  }
}