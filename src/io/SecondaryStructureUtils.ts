import {
  RnaComplex,
  insertBasePair,
  DuplicateBasePairKeysHandler,
  isRelevantBasePairKeySetInPair,
} from "../components/app_specific/RnaComplex";

export type BasePairIndexPair = [number, number];

export const bracketOpenToCloseMap: Record<string, string> = {
  "(": ")",
  "[": "]",
  "{": "}",
  "<": ">",
};

export const bracketCloseToOpenMap: Record<string, string> = Object.entries(
  bracketOpenToCloseMap
).reduce(function (accumulator, [open, close]) {
  accumulator[close] = open;
  return accumulator;
}, {} as Record<string, string>);

export function sanitizeStructure(structureLine: string) {
  return structureLine.replace(/\s+/g, "");
}

export function isStructureCandidate(line: string) {
  const stripped = line.replace(/\s+/g, "");
  if (stripped.length === 0) {
    return false;
  }

  const hasBracketOrDot = /[().\[\]{}<>]/.test(stripped);
  if (!hasBracketOrDot) {
    return false;
  }

  for (let i = 0; i < stripped.length; i++) {
    const symbol = stripped[i];
    if (
      symbol === "." ||
      symbol in bracketOpenToCloseMap ||
      symbol in bracketCloseToOpenMap ||
      /[a-zA-Z]/.test(symbol)
    ) {
      continue;
    }
    return false;
  }

  return true;
}

type BasePairIndex = {
  openSymbol: string;
  index: number;
};

export function parseBasePairsFromDotBracket(
  structure: string
): BasePairIndexPair[] {
  const stacks: Record<string, Array<BasePairIndex>> = {};
  const basePairs = new Array<BasePairIndexPair>();

  for (let i = 0; i < structure.length; i++) {
    const symbol = structure[i];
    if (symbol === ".") {
      continue;
    }

    const isUppercase = /[A-Z]/.test(symbol);
    const isLowercase = /[a-z]/.test(symbol);

    if (symbol in bracketOpenToCloseMap) {
      const openSymbol = symbol;
      if (!(openSymbol in stacks)) {
        stacks[openSymbol] = [];
      }
      stacks[openSymbol].push({
        openSymbol,
        index: i,
      });
      continue;
    }

    if (isUppercase) {
      const openSymbol = symbol.toLowerCase();
      if (!(openSymbol in stacks)) {
        stacks[openSymbol] = [];
      }
      stacks[openSymbol].push({
        openSymbol,
        index: i,
      });
      continue;
    }

    let expectedOpenSymbol: string | undefined = undefined;
    if (symbol in bracketCloseToOpenMap) {
      expectedOpenSymbol = bracketCloseToOpenMap[symbol];
    } else if (isLowercase) {
      expectedOpenSymbol = symbol;
    }

    if (expectedOpenSymbol === undefined) {
      throw new Error(
        `Unrecognized structure character "${symbol}" at position ${i + 1}.`
      );
    }

    const stack = stacks[expectedOpenSymbol];
    if (stack === undefined || stack.length === 0) {
      throw new Error(
        `Unbalanced structure: found closing "${symbol}" at position ${
          i + 1
        } without matching opening.`
      );
    }

    const { index: openingIndex } = stack.pop() as BasePairIndex;
    basePairs.push([openingIndex, i]);
  }

  for (const [openSymbol, stack] of Object.entries(stacks)) {
    if (stack.length > 0) {
      const { index } = stack[stack.length - 1];
      throw new Error(
        `Unbalanced structure: opening "${openSymbol}" at position ${
          index + 1
        } has no matching closing character.`
      );
    }
  }

  return basePairs;
}

const BRACKET_PAIRS: Array<[string, string]> = [
  ["(", ")"],
  ["[", "]"],
  ["{", "}"],
  ["<", ">"],
];

const LETTER_OPENS = "abcdefghijklmnopqrstuvwxyz";

function getSymbolPairForColor(colorIndex: number): [string, string] {
  if (colorIndex < BRACKET_PAIRS.length) {
    return BRACKET_PAIRS[colorIndex];
  }
  const letterIndex = colorIndex - BRACKET_PAIRS.length;
  if (letterIndex >= LETTER_OPENS.length) {
    throw new Error(
      "Too many pseudoknots to encode using extended dot-bracket notation."
    );
  }
  const lower = LETTER_OPENS[letterIndex];
  const open = lower.toUpperCase();
  const close = lower;
  return [open, close];
}

type Interval = { i: number; j: number };

function intervalsCross(a: Interval, b: Interval): boolean {
  return (
    (a.i < b.i && b.i < a.j && a.j < b.j) ||
    (b.i < a.i && a.i < b.j && b.j < a.j)
  );
}

export function basePairsToDotBracket(
  sequenceLength: number,
  basePairs: BasePairIndexPair[]
): string {
  const intervals: Interval[] = basePairs.map(([i, j]) => {
    if (i === j) {
      throw new Error("Base pair cannot join a nucleotide to itself.");
    }
    const [left, right] = i < j ? [i, j] : [j, i];
    if (left < 0 || right >= sequenceLength) {
      throw new Error(
        `Base pair indices [${i}, ${j}] are out of range for sequence length ${sequenceLength}.`
      );
    }
    return { i: left, j: right };
  });

  intervals.sort(function (a, b) {
    return a.i - b.i || a.j - b.j;
  });

  const colorIntervals: Interval[][] = [];
  const intervalColors: number[] = new Array(intervals.length);

  for (let idx = 0; idx < intervals.length; idx++) {
    const current = intervals[idx];
    let assigned = false;
    for (let color = 0; color < colorIntervals.length; color++) {
      const existing = colorIntervals[color];
      let compatible = true;
      for (const other of existing) {
        if (intervalsCross(current, other)) {
          compatible = false;
          break;
        }
      }
      if (compatible) {
        intervalColors[idx] = color;
        existing.push(current);
        assigned = true;
        break;
      }
    }
    if (!assigned) {
      const maxColors = BRACKET_PAIRS.length + LETTER_OPENS.length;
      if (colorIntervals.length >= maxColors) {
        throw new Error(
          "Too many pseudoknots to encode using extended dot-bracket notation."
        );
      }
      intervalColors[idx] = colorIntervals.length;
      colorIntervals.push([current]);
    }
  }

  const chars = new Array<string>(sequenceLength).fill(".");

  for (let idx = 0; idx < intervals.length; idx++) {
    const interval = intervals[idx];
    const color = intervalColors[idx];
    const [open, close] = getSymbolPairForColor(color);
    chars[interval.i] = open;
    chars[interval.j] = close;
  }

  return chars.join("");
}

export function applyBasePairsToRnaComplex(
  singularRnaComplexProps: RnaComplex.ExternalProps,
  rnaMoleculeName: string,
  basePairs: BasePairIndexPair[],
  duplicateBasePairKeysHandler = DuplicateBasePairKeysHandler.DO_NOTHING
) {
  for (const [index0, index1] of basePairs) {
    insertBasePair(
      singularRnaComplexProps,
      rnaMoleculeName,
      index0,
      rnaMoleculeName,
      index1,
      duplicateBasePairKeysHandler
    );
  }
}

export function extractBasePairsFromRnaComplex(
  singularRnaComplexProps: RnaComplex.ExternalProps,
  rnaMoleculeName: string
): BasePairIndexPair[] {
  const result: BasePairIndexPair[] = [];
  const { basePairs } = singularRnaComplexProps;
  const basePairsPerRnaMolecule = basePairs[rnaMoleculeName];
  if (!basePairsPerRnaMolecule) {
    return result;
  }

  for (const [nucleotideIndexAsString, basePairsPerNucleotide] of Object.entries(
    basePairsPerRnaMolecule
  )) {
    const nucleotideIndex = Number.parseInt(nucleotideIndexAsString, 10);
    const keys0: RnaComplex.BasePairKeys = {
      rnaMoleculeName,
      nucleotideIndex,
    };
    for (const basePairPerNucleotide of basePairsPerNucleotide) {
      if (basePairPerNucleotide.rnaMoleculeName !== rnaMoleculeName) {
        continue;
      }
      const keys1: RnaComplex.BasePairKeys = {
        rnaMoleculeName: basePairPerNucleotide.rnaMoleculeName,
        nucleotideIndex: basePairPerNucleotide.nucleotideIndex,
      };
      if (!isRelevantBasePairKeySetInPair(keys0, keys1)) {
        continue;
      }
      result.push([nucleotideIndex, basePairPerNucleotide.nucleotideIndex]);
    }
  }

  return result;
}
