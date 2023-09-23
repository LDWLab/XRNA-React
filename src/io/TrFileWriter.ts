import { RnaComplexProps } from "../App";
import { numberToFormattedStringHelper } from "../utils/Constants";
import { OUTPUT_BOUNDS, OUTPUT_MIDPOINT } from "./OutputUI";

export function trFileWriter(
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) {
  const nucleotideBounds = {
    x : {
      min : Number.POSITIVE_INFINITY,
      max : Number.NEGATIVE_INFINITY
    },
    y : {
      min : Number.POSITIVE_INFINITY,
      max : Number.NEGATIVE_INFINITY
    }
  };
  for (let singularRnaComplexProps of Object.values(rnaComplexProps)) {
    for (let singularRnaMoleculeProps of Object.values(singularRnaComplexProps.rnaMoleculeProps)) {
      for (let singularNucleotideProps of Object.values(singularRnaMoleculeProps.nucleotideProps)) {
        const x = singularNucleotideProps.x;
        const y = singularNucleotideProps.y;
        if (x < nucleotideBounds.x.min) {
          nucleotideBounds.x.min = x;
        }
        if (x > nucleotideBounds.x.max) {
          nucleotideBounds.x.max = x;
        }
        if (y < nucleotideBounds.y.min) {
          nucleotideBounds.y.min = y;
        }
        if (y > nucleotideBounds.y.max) {
          nucleotideBounds.y.max = y;
        }
      }
    }
  }
  const inputMidpoint = {
    x : (nucleotideBounds.x.min + nucleotideBounds.x.max) * 0.5,
    y : (nucleotideBounds.y.min + nucleotideBounds.y.max) * 0.5
  };
  const scaleX = Math.min(
    (OUTPUT_BOUNDS.x.max - OUTPUT_BOUNDS.x.min) / (nucleotideBounds.x.max - nucleotideBounds.x.min),
    (OUTPUT_BOUNDS.y.max - OUTPUT_BOUNDS.y.min) / (nucleotideBounds.y.max  - nucleotideBounds.y.min)
  );
  const scaleY = -scaleX;
  // console.log("nucleotideBounds", nucleotideBounds);
  // console.log("scaleX", scaleX);
  // console.log("scaleY", scaleY);
  // console.log("scaleX", scaleX);


  const lines = new Array<string>();
  for (let rnaComplexIndexAsString in rnaComplexProps) {
    const rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
    const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
    lines.push(`<!-- <rnaComplex name="${singularRnaComplexProps.name.replace(`"`, `\\"`)}"> -->`);
    const rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
    for (let rnaMoleculeName in rnaMoleculeProps) {
      lines.push(`<structure name="${rnaMoleculeName.replace(`"`, `\\"`)}">`);
      const singularRnaMoleculeProps = rnaMoleculeProps[rnaMoleculeName];
      const nucleotideProps = singularRnaMoleculeProps.nucleotideProps;
      for (let nucleotideIndexAsString in nucleotideProps) {
        const nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
        const formattedNucleotideIndex = nucleotideIndex + singularRnaMoleculeProps.firstNucleotideIndex;
        const singularNucleotideProps = nucleotideProps[nucleotideIndex];
        const x = scaleX * (singularNucleotideProps.x - inputMidpoint.x) + OUTPUT_MIDPOINT.x;
        const y = scaleY * (singularNucleotideProps.y - inputMidpoint.y) + OUTPUT_MIDPOINT.y;
        lines.push(`<point x="${numberToFormattedStringHelper(x, 3)}" y="${numberToFormattedStringHelper(y, 3)}" b="${singularNucleotideProps.symbol}" numbering-label="${formattedNucleotideIndex}" />`);
      }
      lines.push(`</structure>`);
    }
    lines.push(`<!-- </rnaComplex> -->`);
  }
  return lines.join("\n");
}