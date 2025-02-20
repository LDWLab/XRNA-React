import { RnaComplexProps } from "../App";

export function bpseqFileWriter(
  rnaComplexProps : RnaComplexProps,
  rnaComplexName : string
) {
  const lines = new Array<string>();
  for (let rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    const basePairsPerRnaComplex = singularRnaComplexProps.basePairs;
    lines.push(`# RNA complex "${singularRnaComplexProps.name}"`);
    for (let rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps) {
      lines.push(`# RNA molecule "${rnaMoleculeName}"`);
      const singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
      const basePairsPerRnaMolecule = basePairsPerRnaComplex[rnaMoleculeName];
      for (let nucleotideIndexAsString in singularRnaMoleculeProps.nucleotideProps) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        const singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
        if (nucleotideIndex in basePairsPerRnaMolecule) {
          const basePairsPerNucleotide = basePairsPerRnaMolecule[nucleotideIndex];
          for (const basePairPerNucleotide of basePairsPerNucleotide) {
            const basePairedRnaMoleculeName = basePairPerNucleotide.rnaMoleculeName;
            const singularBasePairedRnaMolecule = singularRnaComplexProps.rnaMoleculeProps[basePairedRnaMoleculeName];
            let line = `${nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex} ${singularNucleotideProps.symbol} ${basePairPerNucleotide.nucleotideIndex + singularBasePairedRnaMolecule.firstNucleotideIndex}`;
            if (rnaMoleculeName !== basePairedRnaMoleculeName) {
              line += ` # RNA molecule "${basePairedRnaMoleculeName}"`;
            }
            lines.push(line);
          }
        } else {
          lines.push(`${nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex} ${singularNucleotideProps.symbol} 0`);
        }
      }
    }
  }
  return lines.join("\n");
}