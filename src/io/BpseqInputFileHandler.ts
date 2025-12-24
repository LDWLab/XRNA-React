import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { InputFileReader, ParsedInputFile } from "./InputUI";
import { applyBasePairsToRnaComplex, BasePairIndexPair } from "./SecondaryStructureUtils";
import { generateCircularLayout, calculateEntryOffset } from "./LayoutUtils";

const DEFAULT_DOCUMENT_NAME = "BPSEQ import";

type BpseqNucleotide = {
  index: number;
  symbol: string;
  pairedWith: number;
};

type BpseqEntry = {
  name: string;
  nucleotides: Array<BpseqNucleotide>;
};

function parseBpseqFile(inputFileContent: string): {
  entries: Array<BpseqEntry>;
  documentName: string;
} {
  const lines = inputFileContent.split(/\r?\n/);
  const entries = new Array<BpseqEntry>();
  let documentName = DEFAULT_DOCUMENT_NAME;
  let currentEntryName = DEFAULT_DOCUMENT_NAME;
  let currentNucleotides = new Array<BpseqNucleotide>();
  let lastIndex = 0;
  let entryCount = 0;

  function finalizeCurrentEntry() {
    if (currentNucleotides.length > 0) {
      const name = currentEntryName !== DEFAULT_DOCUMENT_NAME
        ? currentEntryName
        : `Entry ${entryCount + 1}`;
      entries.push({
        name,
        nucleotides: currentNucleotides,
      });
      entryCount++;
      currentNucleotides = new Array<BpseqNucleotide>();
      currentEntryName = DEFAULT_DOCUMENT_NAME;
      lastIndex = 0;
    }
  }

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }

    if (line.startsWith("#")) {
      const commentContent = line.substring(1).trim();
      if (commentContent.startsWith("bpRNA File:")) {
        finalizeCurrentEntry();
        currentEntryName = commentContent.substring("bpRNA File:".length).trim();
        if (documentName === DEFAULT_DOCUMENT_NAME) {
          documentName = currentEntryName;
        }
      } else if (currentEntryName === DEFAULT_DOCUMENT_NAME && commentContent.length > 0) {
        if (currentNucleotides.length === 0) {
          currentEntryName = commentContent;
          if (documentName === DEFAULT_DOCUMENT_NAME) {
            documentName = commentContent;
          }
        }
      }
      continue;
    }

    const parts = line.split(/\s+/);
    if (parts.length < 3) {
      throw new Error(`Invalid BPSEQ line format: "${line}". Expected: index base paired_index`);
    }

    const index = parseInt(parts[0], 10);
    const symbol = parts[1].toUpperCase();
    const pairedWith = parseInt(parts[2], 10);

    if (isNaN(index)) {
      throw new Error(`Invalid nucleotide index in line: "${line}"`);
    }
    if (isNaN(pairedWith)) {
      throw new Error(`Invalid paired index in line: "${line}"`);
    }

    if (index === 1 && lastIndex > 1) {
      finalizeCurrentEntry();
    }

    currentNucleotides.push({
      index,
      symbol,
      pairedWith,
    });
    lastIndex = index;
  }

  finalizeCurrentEntry();

  if (entries.length === 0) {
    throw new Error("No nucleotides found in BPSEQ file.");
  }

  return { entries, documentName };
}

function extractBasePairsFromBpseq(nucleotides: Array<BpseqNucleotide>): Array<BasePairIndexPair> {
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

export const bpseqInputFileHandler: InputFileReader = function (inputFileContent) {
  const { entries, documentName } = parseBpseqFile(inputFileContent);

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

    const basePairs = extractBasePairsFromBpseq(nucleotides);
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
