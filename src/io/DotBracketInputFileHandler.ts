import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { InputFileReader, ParsedInputFile } from "./InputUI";
import {
  sanitizeStructure,
  parseBasePairsFromDotBracket,
  applyBasePairsToRnaComplex,
  isStructureCandidate,
} from "./SecondaryStructureUtils";
import { generateCircularLayout, calculateEntryOffset } from "./LayoutUtils";

const DEFAULT_DOCUMENT_NAME = "Dot-bracket import";

type DotBracketEntry = {
  name : string,
  sequence : string,
  structure? : string
};

type ParsedDotBracket = {
  entries : Array<DotBracketEntry>,
  documentName : string
};

function sanitizeSequence(sequenceLine : string) {
  return sequenceLine.replace(/\s+/g, "").toUpperCase();
}

function parseDotBracketFile(inputFileContent : string) : ParsedDotBracket {
  const lines = inputFileContent.split(/\r?\n/);
  const entries = new Array<DotBracketEntry>();
  let documentName = DEFAULT_DOCUMENT_NAME;

  let index = 0;
  while (index < lines.length) {
    const rawLine = lines[index];
    const trimmedLine = rawLine.trim();

    if (trimmedLine.length === 0) {
      index++;
      continue;
    }

    if (trimmedLine.startsWith("#")) {
      if (documentName === DEFAULT_DOCUMENT_NAME && trimmedLine.length > 1) {
        documentName = trimmedLine.substring(1).trim() || DEFAULT_DOCUMENT_NAME;
      }
      index++;
      continue;
    }

    if (!trimmedLine.startsWith(">")) {
      throw new Error(`Unexpected content while parsing dot-bracket file: "${trimmedLine}"`);
    }

    const entryName = trimmedLine.substring(1).trim() || `Entry ${entries.length + 1}`;
    index++;

    let sequence = "";
    let structure : string | undefined = undefined;
    let parsingStructure = false;

    while (index < lines.length) {
      const candidateRaw = lines[index];
      const candidate = candidateRaw.trim();
      if (candidate.length === 0) {
        index++;
        continue;
      }
      if (candidate.startsWith("#")) {
        index++;
        continue;
      }
      if (candidate.startsWith(">")) {
        break;
      }

      if (!parsingStructure) {
        if (sequence.length > 0 && isStructureCandidate(candidate)) {
          structure = (structure ?? "") + sanitizeStructure(candidate);
          parsingStructure = true;
        } else {
          sequence += sanitizeSequence(candidate);
        }
      } else {
        structure = (structure ?? "") + sanitizeStructure(candidate);
      }

      index++;
    }

    if (sequence.length === 0) {
      throw new Error(`No sequence found for entry "${entryName}".`);
    }

    if (structure !== undefined && structure.length !== sequence.length) {
      throw new Error(`Structure length (${structure.length}) does not match sequence length (${sequence.length}) for entry "${entryName}".`);
    }

    entries.push({
      name : entryName,
      sequence,
      structure
    });
  }

  if (entries.length === 0) {
    throw new Error("No entries were found in the provided dot-bracket file.");
  }

  return {
    entries,
    documentName
  };
}

export const dotBracketInputFileHandler : InputFileReader = function(inputFileContent : string) {
  const {
    entries,
    documentName
  } = parseDotBracketFile(inputFileContent);

  const rnaComplexProps = entries.map(function(entry, entryIndex) {
    const {
      name,
      sequence,
      structure
    } = entry;
    const rnaComplexName = name;
    const rnaMoleculeName = sequence.length > 0 ? name : `RNA molecule ${entryIndex + 1}`;

    const singularRnaMoleculeProps : RnaMolecule.ExternalProps = {
      firstNucleotideIndex : 1,
      nucleotideProps : {}
    };

    const singularRnaComplexProps : RnaComplex.ExternalProps = {
      name : rnaComplexName,
      rnaMoleculeProps : {
        [rnaMoleculeName] : singularRnaMoleculeProps
      },
      basePairs : {}
    };

    const { offsetX, offsetY } = calculateEntryOffset(entryIndex, sequence.length);
    const positions = generateCircularLayout(sequence.length || 1, offsetX, offsetY);

    for (let i = 0; i < sequence.length; i++) {
      const rawSymbol = sequence[i];
      const sanitizedSymbol = Nucleotide.sanitizeSymbol(rawSymbol);
      const symbol = Nucleotide.isSymbol(sanitizedSymbol) ? sanitizedSymbol : Nucleotide.Symbol.N;
      const { x, y } = positions[i];
      singularRnaMoleculeProps.nucleotideProps[i] = {
        symbol,
        x,
        y
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

  const output : ParsedInputFile = {
    complexDocumentName : documentName,
    rnaComplexProps
  };

  return output;
};
