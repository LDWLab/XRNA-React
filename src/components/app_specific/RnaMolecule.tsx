import { useMemo } from "react";
import { Context, NucleotideKeysToRerenderPerRnaMolecule } from "../../context/Context";
import Scaffolding from "../generic/Scaffolding";
import { Nucleotide } from "./Nucleotide";

export namespace RnaMolecule {
  export type ExternalProps = {
    firstNucleotideIndex : number,
    nucleotideProps : Record<number, Nucleotide.ExternalProps>
  };

  export type Props = ExternalProps & {
    nucleotideKeysToRerender : NucleotideKeysToRerenderPerRnaMolecule
  };

  export function Component(props : Props) {
    const {
      firstNucleotideIndex,
      nucleotideProps,
      nucleotideKeysToRerender
    } = props;
    const flattenedNucleotideProps = useMemo(
      function() {
        const flattenedNucleotideProps = Object.entries(nucleotideProps).map(function([
          nucleotideIndexAsString,
          singularNucleotideProps
        ]) {
          return {
            scaffoldingKey : Number.parseInt(nucleotideIndexAsString),
            props : singularNucleotideProps
          };
        });
        flattenedNucleotideProps.sort(function(
          singularFlattenedNucleotideProps0,
          singularFlattenedNucleotideProps1
        ) {
          return singularFlattenedNucleotideProps0.scaffoldingKey - singularFlattenedNucleotideProps1.scaffoldingKey
        });
        return flattenedNucleotideProps;
      },
      [nucleotideProps]
    );
    return <g>
      <Context.RnaMolecule.FirstNucleotideIndex.Provider
        value = {firstNucleotideIndex}
        // value = {flattenedNucleotideProps.length === 0 ? NaN : flattenedNucleotideProps[0].scaffoldingKey}
      >
        <Scaffolding.Component<number, Nucleotide.ExternalProps>
          sortedProps = {flattenedNucleotideProps}
          childComponent = {Nucleotide.Component}
          propsToRerenderKeys = {nucleotideKeysToRerender}
          comparator = {function(nucleotideIndex0, nucleotideIndex1) {
            return nucleotideIndex0 - nucleotideIndex1;
          }}
        />
      </Context.RnaMolecule.FirstNucleotideIndex.Provider>
    </g>;
  }
}