import { Nucleotide } from "../components/app_specific/Nucleotide";
import { RnaComplex, insertBasePair, DuplicateBasePairKeysHandler } from "../components/app_specific/RnaComplex";
import { RnaMolecule } from "../components/app_specific/RnaMolecule";
import { InputFileReader, ParsedInputFile } from "./InputUI";

const DEFAULT_DOCUMENT_NAME = "Dot-bracket import";
const MINIMUM_RADIUS = 40;
const RADIUS_PER_NUCLEOTIDE = 6;

const bracketOpenToCloseMap : Record<string, string> = {
  "(" : ")",
  "[" : "]",
  "{" : "}",
  "<" : ">"
};

const bracketCloseToOpenMap : Record<string, string> = Object.entries(bracketOpenToCloseMap).reduce(
  function(accumulator, [open, close]) {
    accumulator[close] = open;
    return accumulator;
  },
  {} as Record<string, string>
);

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

function sanitizeStructure(structureLine : string) {
  return structureLine.replace(/\s+/g, "");
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

    // Sequence line
    while (index < lines.length && lines[index].trim().length === 0) {
      index++;
    }
    if (index >= lines.length) {
      throw new Error(`No sequence found for entry "${entryName}".`);
    }
    const sequenceLine = lines[index].trim();
    if (sequenceLine.startsWith(">")) {
      throw new Error(`Sequence for entry "${entryName}" is missing.`);
    }
    if (sequenceLine.startsWith("#")) {
      throw new Error(`Sequence for entry "${entryName}" cannot be a comment.`);
    }
    const sequence = sanitizeSequence(sequenceLine);
    index++;

    // Optional structure line
    let structure : string | undefined = undefined;
    while (index < lines.length) {
      const candidate = lines[index].trim();
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
      structure = sanitizeStructure(candidate);
      index++;
      break;
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

type BasePairIndex = {
  openSymbol : string,
  index : number
};

function parseBasePairs(structure : string) {
  const stacks : Record<string, Array<BasePairIndex>> = {};
  const basePairs = new Array<[number, number]>();

  for (let i = 0; i < structure.length; i++) {
    const symbol = structure[i];
    if (symbol === ".") {
      continue;
    }

    const isLowercase = /[a-z]/.test(symbol);
    const isUppercase = /[A-Z]/.test(symbol);

    if (symbol in bracketOpenToCloseMap || isLowercase) {
      const openSymbol = isLowercase ? symbol : symbol;
      if (!(openSymbol in stacks)) {
        stacks[openSymbol] = [];
      }
      stacks[openSymbol].push({
        openSymbol,
        index : i
      });
      continue;
    }

    let expectedOpenSymbol : string | undefined = undefined;
    if (symbol in bracketCloseToOpenMap) {
      expectedOpenSymbol = bracketCloseToOpenMap[symbol];
    } else if (isUppercase) {
      expectedOpenSymbol = symbol.toLowerCase();
    }

    if (expectedOpenSymbol === undefined) {
      throw new Error(`Unrecognized structure character "${symbol}" at position ${i + 1}.`);
    }

    const stack = stacks[expectedOpenSymbol];
    if (stack === undefined || stack.length === 0) {
      throw new Error(`Unbalanced structure: found closing "${symbol}" at position ${i + 1} without matching opening.`);
    }

    const { index : openingIndex } = stack.pop() as BasePairIndex;
    basePairs.push([
      openingIndex,
      i
    ]);
  }

  for (const [openSymbol, stack] of Object.entries(stacks)) {
    if (stack.length > 0) {
      const { index } = stack[stack.length - 1];
      throw new Error(`Unbalanced structure: opening "${openSymbol}" at position ${index + 1} has no matching closing character.`);
    }
  }

  return basePairs;
}

function generateCircularLayout(sequenceLength : number) {
  const radius = Math.max(MINIMUM_RADIUS, sequenceLength * RADIUS_PER_NUCLEOTIDE);
  const centerOffset = radius + 10;
  const positions = new Array<{ x : number, y : number }>(sequenceLength);

  if (sequenceLength <= 1) {
    const angle = -Math.PI / 2;
    positions[0] = {
      x : centerOffset + radius * Math.cos(angle),
      y : centerOffset + radius * Math.sin(angle)
    };
    return positions;
  }

  const desiredGapNucleotideCount = Math.min(2, Math.max(0, sequenceLength - 2));
  const baseSpacing = (2 * Math.PI) / sequenceLength;
  const gapAngle = (desiredGapNucleotideCount + 1) * baseSpacing;
  const usableAngle = (2 * Math.PI) - gapAngle;
  const angleIncrement = usableAngle / (sequenceLength - 1);
  const startAngle = -Math.PI / 2 + gapAngle / 2;

  for (let i = 0; i < sequenceLength; i++) {
    const angle = startAngle + i * angleIncrement;
    positions[i] = {
      x : centerOffset + radius * Math.cos(angle),
      y : centerOffset + radius * Math.sin(angle)
    };
  }

  return positions;
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

    const positions = generateCircularLayout(sequence.length || 1);

    for (let i = 0; i < sequence.length; i++) {
      const rawSymbol = sequence[i];
      const sanitizedSymbol = rawSymbol === "T" ? Nucleotide.Symbol.U : rawSymbol;
      const symbol = Nucleotide.isSymbol(sanitizedSymbol) ? sanitizedSymbol : Nucleotide.Symbol.N;
      const { x, y } = positions[i];
      singularRnaMoleculeProps.nucleotideProps[i] = {
        symbol,
        x,
        y
      };
    }

    if (structure !== undefined) {
      const basePairs = parseBasePairs(structure);
      for (const [index0, index1] of basePairs) {
        insertBasePair(
          singularRnaComplexProps,
          rnaMoleculeName,
          index0,
          rnaMoleculeName,
          index1,
          DuplicateBasePairKeysHandler.DO_NOTHING
        );
      }
    }

    return singularRnaComplexProps;
  });

  const output : ParsedInputFile = {
    complexDocumentName : documentName,
    rnaComplexProps
  };

  return output;
};
