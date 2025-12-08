import { RnaComplexProps } from "../App";
import {
  basePairsToDotBracket,
  extractBasePairsFromRnaComplex,
} from "./SecondaryStructureUtils";

export function dotBracketFileWriter(
  rnaComplexProps: RnaComplexProps,
  complexDocumentName: string
) {
  const lines = new Array<string>();
  lines.push(`# ${complexDocumentName}`);

  for (const rnaComplexIndexAsString of Object.keys(rnaComplexProps)) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString, 10);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];

    for (const rnaMoleculeName of Object.keys(
      singularRnaComplexProps.rnaMoleculeProps
    )) {
      const singularRnaMoleculeProps =
        singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      const nucleotideIndices = Object.keys(
        singularRnaMoleculeProps.nucleotideProps
      )
        .map((value) => Number.parseInt(value, 10))
        .sort((a, b) => a - b);

      const sequenceLength = nucleotideIndices.length;
      const sequenceChars = nucleotideIndices.map((index) => {
        const { symbol } = singularRnaMoleculeProps.nucleotideProps[index];
        return symbol;
      });

      const basePairs = extractBasePairsFromRnaComplex(
        singularRnaComplexProps,
        rnaMoleculeName
      );
      const structure =
        basePairs.length === 0
          ? ".".repeat(sequenceLength)
          : basePairsToDotBracket(sequenceLength, basePairs);

      const multipleComplexes = Object.keys(rnaComplexProps).length > 1;
      const multipleMolecules =
        Object.keys(singularRnaComplexProps.rnaMoleculeProps).length > 1;
      const entryName = multipleComplexes || multipleMolecules
        ? `${singularRnaComplexProps.name} / ${rnaMoleculeName}`
        : singularRnaComplexProps.name;

      lines.push(`>${entryName}`);
      lines.push(sequenceChars.join(""));
      lines.push(structure);
      lines.push("");
    }
  }

  return lines.join("\n");
}
