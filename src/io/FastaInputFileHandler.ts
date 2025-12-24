import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { InputFileReader, ParsedInputFile } from "./InputUI";
import {
  sanitizeStructure,
  isStructureCandidate,
  parseBasePairsFromDotBracket,
  applyBasePairsToRnaComplex,
} from "./SecondaryStructureUtils";
import { generateCircularLayout, calculateEntryOffset } from "./LayoutUtils";

const DEFAULT_DOCUMENT_NAME = "FASTA import";

type FastaEntry = {
  name: string;
  sequence: string;
  structure?: string;
};

function sanitizeSequence(sequenceLine: string) {
  return sequenceLine.replace(/\s+/g, "").toUpperCase();
}

function parseFastaFile(inputFileContent: string): {
  entries: Array<FastaEntry>;
  documentName: string;
} {
  const lines = inputFileContent.split(/\r?\n/);
  const entries = new Array<FastaEntry>();
  let currentEntry: FastaEntry | undefined = undefined;
  let documentName = DEFAULT_DOCUMENT_NAME;
  let parsingStructure = false;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (line.length === 0) {
      continue;
    }
    if (line.startsWith("#")) {
      if (documentName === DEFAULT_DOCUMENT_NAME && line.length > 1) {
        documentName = line.substring(1).trim() || DEFAULT_DOCUMENT_NAME;
      }
      continue;
    }
    if (line.startsWith(">")) {
      if (currentEntry !== undefined) {
        entries.push(currentEntry);
      }
      const name = line.substring(1).trim() || `Entry ${entries.length + 1}`;
      currentEntry = {
        name,
        sequence: "",
        structure: undefined,
      };
      parsingStructure = false;
      continue;
    }
    if (currentEntry === undefined) {
      throw new Error(
        "FASTA data must start with a header line beginning with '>'"
      );
    }
    if (!parsingStructure) {
      if (currentEntry.sequence.length > 0 && isStructureCandidate(line)) {
        currentEntry.structure = sanitizeStructure(line);
        parsingStructure = true;
      } else {
        currentEntry.sequence += sanitizeSequence(line);
      }
    } else {
      currentEntry.structure =
        (currentEntry.structure ?? "") + sanitizeStructure(line);
    }
  }

  if (currentEntry !== undefined) {
    entries.push(currentEntry);
  }

  if (entries.length === 0) {
    throw new Error("No entries were found in the provided FASTA file.");
  }

  for (const entry of entries) {
    if (entry.sequence.length === 0) {
      throw new Error(`Entry "${entry.name}" does not contain a sequence.`);
    }
    if (
      entry.structure !== undefined &&
      entry.structure.length !== entry.sequence.length
    ) {
      throw new Error(
        `Structure length (${entry.structure.length}) does not match sequence length (${entry.sequence.length}) for entry "${entry.name}".`
      );
    }
  }

  return { entries, documentName };
}

export const fastaInputFileHandler: InputFileReader = function (inputFileContent) {
  const { entries, documentName } = parseFastaFile(inputFileContent);

  const rnaComplexProps = entries.map(function (entry, entryIndex) {
    const { name, sequence, structure } = entry;
    const rnaComplexName = name;
    const rnaMoleculeName =
      sequence.length > 0 ? name : `RNA molecule ${entryIndex + 1}`;

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

    const { offsetX, offsetY } = calculateEntryOffset(entryIndex, sequence.length);
    const positions = generateCircularLayout(sequence.length || 1, offsetX, offsetY);

    for (let i = 0; i < sequence.length; i++) {
      const rawSymbol = sequence[i];
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

    if (structure !== undefined) {
      const basePairs = parseBasePairsFromDotBracket(structure);
      applyBasePairsToRnaComplex(
        singularRnaComplexProps,
        rnaMoleculeName,
        basePairs
      );
    }

    return singularRnaComplexProps;
  });

  const output: ParsedInputFile = {
    complexDocumentName: documentName,
    rnaComplexProps,
  };

  return output;
};
