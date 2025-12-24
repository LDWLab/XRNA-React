import { RnaComplexProps } from "../App";

export function ctFileWriter(
  rnaComplexProps: RnaComplexProps,
  rnaComplexName: string
) {
  const lines = new Array<string>();

  for (let rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;

    for (let rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
      const singularRnaMoleculeProps =
        singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName] || {};

      const nucleotideIndices = Object.keys(singularRnaMoleculeProps.nucleotideProps)
        .map(Number)
        .sort((a, b) => a - b);

      const nucleotideCount = nucleotideIndices.length;
      if (nucleotideCount === 0) {
        continue;
      }

      const entryName =
        singularRnaComplexProps.name !== rnaMoleculeName
          ? `${singularRnaComplexProps.name} - ${rnaMoleculeName}`
          : rnaMoleculeName;

      lines.push(`${nucleotideCount}\t${entryName}`);

      const firstNucleotideIndex = singularRnaMoleculeProps.firstNucleotideIndex;

      for (let i = 0; i < nucleotideCount; i++) {
        const nucleotideIndex = nucleotideIndices[i];
        const singularNucleotideProps =
          singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];

        const displayIndex = nucleotideIndex + firstNucleotideIndex;
        const symbol = singularNucleotideProps.symbol;
        const prevIndex = i === 0 ? 0 : nucleotideIndices[i - 1] + firstNucleotideIndex;
        const nextIndex =
          i === nucleotideCount - 1 ? 0 : nucleotideIndices[i + 1] + firstNucleotideIndex;

        let pairedIndex = 0;

        if (nucleotideIndex in basePairsPerRnaMolecule) {
          const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
          for (const basePairPerNucleotide of basePairsPerNucleotide) {
            if (basePairPerNucleotide.rnaMoleculeName === rnaMoleculeName) {
              const pairedRnaMolecule =
                singularRnaComplexProps.rnaMoleculeProps[
                  basePairPerNucleotide.rnaMoleculeName
                ];
              pairedIndex =
                basePairPerNucleotide.nucleotideIndex +
                pairedRnaMolecule.firstNucleotideIndex;
              break;
            }
          }
        }

        lines.push(
          `${displayIndex}\t${symbol}\t${prevIndex}\t${nextIndex}\t${pairedIndex}\t${displayIndex}`
        );
      }
    }
  }

  return lines.join("\n");
}
