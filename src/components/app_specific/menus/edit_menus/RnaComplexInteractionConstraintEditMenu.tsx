import { useMemo, useState } from "react";
import { RnaComplex } from "../../RnaComplex";
import { AppSpecificOrientationEditor } from "../../editors/AppSpecificOrientationEditor";
import { Vector2D } from "../../../../data_structures/Vector2D";
import { subtractNumbersNegated } from "../../../../utils/Utils";
import { AllInOneEditor } from "../../../../ui/InteractionConstraint/InteractionConstraints/AllInOneEditor";

export namespace RnaComplexInteractionConstraintEditMenu {
  export type Props = {
    rerender : () => void,
    singularRnaComplexProps : RnaComplex.ExternalProps
  };

  export function Component(props : Props) {
    const {
      rerender,
      singularRnaComplexProps
    } = props;
    // Begin state data.
    const [
      rnaComplexName,
      setRnaComplexName
    ] = useState(singularRnaComplexProps.name);
    // Begin memo data.
    const orientationEditor = useMemo(
      function() {
        const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
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
        const positions = new Array<Vector2D>();
        const flattenedRnaMoleculeProps = Object.entries(singularRnaComplexProps.rnaMoleculeProps);
        flattenedRnaMoleculeProps.reverse();
        for (let [rnaMoleculeName, singularRnaMoleculeProps] of flattenedRnaMoleculeProps) {
          const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
          const flattenedNucleotideProps = Object.entries(singularRnaMoleculeProps.nucleotideProps).map(function([
            nucleotideIndexAsString,
            singularNucleotideProps
          ]) {
            return {
              nucleotideIndex : Number.parseInt(nucleotideIndexAsString),
              singularNucleotideProps
            };
          });
          flattenedNucleotideProps.sort(function(
            singularNucleotidePropsWithIndex0,
            singularNucleotidePropsWithIndex1
          ) {
            return singularNucleotidePropsWithIndex1.nucleotideIndex - singularNucleotidePropsWithIndex0.nucleotideIndex;
          });
          for (let { nucleotideIndex, singularNucleotideProps } of flattenedNucleotideProps) {
            positions.push(singularNucleotideProps);
            if (nucleotideIndex in basePairsPerRnaMolecule) {
              const mappedBasePairInformation = basePairsPerRnaMolecule[nucleotideIndex];
              boundingVectors = {
                0 : singularNucleotideProps,
                1 : singularRnaComplexProps.rnaMoleculeProps[mappedBasePairInformation.rnaMoleculeName].nucleotideProps[mappedBasePairInformation.nucleotideIndex]
              };
            }
          }
        }

        return <AllInOneEditor.Component
          boundingVector0 = {boundingVectors[0]}
          boundingVector1 = {boundingVectors[1]}
          positions = {positions}
          onUpdatePositions = {rerender}
        />;
      },
      [singularRnaComplexProps]
    );

    return <>
      <label>
        Name:&nbsp;
      </label>
      <input
        type = "text"
        value = {rnaComplexName}
        onChange = {function(e) {
          const newRnaComplexName = e.target.value;
          setRnaComplexName(newRnaComplexName);
          singularRnaComplexProps.name = newRnaComplexName;
        }}
      />
      <br/>
      {orientationEditor}
    </>;
  }
}