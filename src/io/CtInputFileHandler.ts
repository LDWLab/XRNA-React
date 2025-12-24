import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { InputFileReader, ParsedInputFile } from "./InputUI";
import { applyBasePairsToRnaComplex, BasePairIndexPair } from "./SecondaryStructureUtils";
import { generateCircularLayout, calculateEntryOffset } from "./LayoutUtils";

const DEFAULT_DOCUMENT_NAME = "CT import";

type CtNucleotide = {
  index: number;
  symbol: string;
  pairedWith: number;
};

type CtEntry = {
  name: string;
  energy?: number;
  nucleotides: Array<CtNucleotide>;
};

function parseCtFile(inputFileContent: string): {
  entries: Array<CtEntry>;
  documentName: string;
} {
  const lines = inputFileContent.split(/\r?\n/);
  const entries = new Array<CtEntry>();
  let documentName = DEFAULT_DOCUMENT_NAME;
  let i = 0;

  while (i < lines.length) {
    const rawLine = lines[i];
    const line = rawLine.trim();

    if (line.length === 0) {
      i++;
      continue;
    }

    if (line.startsWith("#")) {
      i++;
      continue;
    }

    const headerParts = line.split(/\s+/);
    const nucleotideCount = parseInt(headerParts[0], 10);

    if (isNaN(nucleotideCount) || nucleotideCount <= 0) {
      throw new Error(`Invalid CT header line: "${line}". Expected nucleotide count as first field.`);
    }

    let entryName = DEFAULT_DOCUMENT_NAME;
    let energy: number | undefined = undefined;

    const energyMatch = line.match(/ENERGY\s*=\s*([-\d.]+)/i);
    if (energyMatch) {
      energy = parseFloat(energyMatch[1]);
    }

    const titleStart = line.indexOf(headerParts[0]) + headerParts[0].length;
    let titlePart = line.substring(titleStart).trim();

    if (energyMatch) {
      const energyIndex = titlePart.toUpperCase().indexOf("ENERGY");
      if (energyIndex !== -1) {
        const afterEnergy = titlePart.substring(energyIndex);
        const energyEndMatch = afterEnergy.match(/ENERGY\s*=\s*[-\d.]+\s*/i);
        if (energyEndMatch) {
          titlePart = titlePart.substring(0, energyIndex) +
                      afterEnergy.substring(energyEndMatch[0].length);
        }
      }
    }

    titlePart = titlePart.trim();
    if (titlePart.length > 0) {
      entryName = titlePart;
      if (documentName === DEFAULT_DOCUMENT_NAME) {
        documentName = entryName;
      }
    }

    i++;

    const nucleotides = new Array<CtNucleotide>();
    let nucleotidesRead = 0;

    while (nucleotidesRead < nucleotideCount && i < lines.length) {
      const dataLine = lines[i].trim();

      if (dataLine.length === 0) {
        i++;
        continue;
      }

      if (dataLine.startsWith("#")) {
        i++;
        continue;
      }

      const parts = dataLine.split(/\s+/);
      if (parts.length < 5) {
        throw new Error(`Invalid CT data line: "${dataLine}". Expected at least 5 columns.`);
      }

      const index = parseInt(parts[0], 10);
      const symbol = parts[1].toUpperCase();
      const pairedWith = parseInt(parts[4], 10);

      if (isNaN(index)) {
        throw new Error(`Invalid nucleotide index in line: "${dataLine}"`);
      }
      if (isNaN(pairedWith)) {
        throw new Error(`Invalid paired index in line: "${dataLine}"`);
      }

      nucleotides.push({
        index,
        symbol,
        pairedWith,
      });

      nucleotidesRead++;
      i++;
    }

    if (nucleotidesRead !== nucleotideCount) {
      throw new Error(
        `CT entry "${entryName}": Expected ${nucleotideCount} nucleotides but found ${nucleotidesRead}.`
      );
    }

    entries.push({
      name: entryName,
      energy,
      nucleotides,
    });
  }

  if (entries.length === 0) {
    throw new Error("No entries found in CT file.");
  }

  return { entries, documentName };
}

function extractBasePairsFromCt(nucleotides: Array<CtNucleotide>): Array<BasePairIndexPair> {
  const basePairs = new Array<BasePairIndexPair>();
  const seen = new Set<string>();

  for (const nucleotide of nucleotides) {
    if (nucleotide.pairedWith === 0) {
      continue;
    }

    const i = nucleotide.index - 1;
    const j = nucleotide.pairedWith - 1;

    const key = i < j ? `${i}-${j}` : `${j}-${i}`;
    if (!seen.has(key)) {
      seen.add(key);
      basePairs.push([Math.min(i, j), Math.max(i, j)]);
    }
  }

  return basePairs;
}

export const ctInputFileHandler: InputFileReader = function (inputFileContent) {
  const { entries, documentName } = parseCtFile(inputFileContent);

  const rnaComplexProps = entries.map(function (entry, entryIndex) {
    const { name, nucleotides } = entry;
    const rnaComplexName = name;
    const rnaMoleculeName = nucleotides.length > 0 ? name : `RNA molecule ${entryIndex + 1}`;

    const singularRnaMoleculeProps: RnaMolecule.ExternalProps = {
      firstNucleotideIndex: 1,
      nucleotideProps: {},
    };

    const singularRnaComplexProps: RnaComplex.ExternalProps = {
      name: rnaComplexName,
      rnaMoleculeProps: {
        [rnaMoleculeName]: singularRnaMoleculeProps,
      },
      basePairs: {},
    };

    const { offsetX, offsetY } = calculateEntryOffset(entryIndex, nucleotides.length);
    const positions = generateCircularLayout(nucleotides.length || 1, offsetX, offsetY);

    for (let i = 0; i < nucleotides.length; i++) {
      const rawSymbol = nucleotides[i].symbol;
      const sanitizedSymbol = rawSymbol === "T" ? Nucleotide.Symbol.U : rawSymbol;
      const symbol = Nucleotide.isSymbol(sanitizedSymbol)
        ? sanitizedSymbol
        : Nucleotide.Symbol.N;
      const { x, y } = positions[i];
      singularRnaMoleculeProps.nucleotideProps[i] = {
        symbol,
        x,
        y,
      };
    }

    const basePairs = extractBasePairsFromCt(nucleotides);
    if (basePairs.length > 0) {
      applyBasePairsToRnaComplex(singularRnaComplexProps, rnaMoleculeName, basePairs);
    }

    return singularRnaComplexProps;
  });

  const output: ParsedInputFile = {
    complexDocumentName: documentName,
    rnaComplexProps,
  };

  return output;
};
