"use strict";
exports.__esModule = true;
exports.dotBracketInputFileHandler = void 0;
var Nucleotide_1 = require("../components/app_specific/Nucleotide");
var RnaComplex_1 = require("../components/app_specific/RnaComplex");
var DEFAULT_DOCUMENT_NAME = "Dot-bracket import";
var MINIMUM_RADIUS = 40;
var RADIUS_PER_NUCLEOTIDE = 6;
var bracketOpenToCloseMap = {
    "(": ")",
    "[": "]",
    "{": "}",
    "<": ">"
};
var bracketCloseToOpenMap = Object.entries(bracketOpenToCloseMap).reduce(function (accumulator, _a) {
    var open = _a[0], close = _a[1];
    accumulator[close] = open;
    return accumulator;
}, {});
function sanitizeSequence(sequenceLine) {
    return sequenceLine.replace(/\s+/g, "").toUpperCase();
}
function sanitizeStructure(structureLine) {
    return structureLine.replace(/\s+/g, "");
}
function parseDotBracketFile(inputFileContent) {
    var lines = inputFileContent.split(/\r?\n/);
    var entries = new Array();
    var documentName = DEFAULT_DOCUMENT_NAME;
    var index = 0;
    while (index < lines.length) {
        var rawLine = lines[index];
        var trimmedLine = rawLine.trim();
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
            throw new Error("Unexpected content while parsing dot-bracket file: \"".concat(trimmedLine, "\""));
        }
        var entryName = trimmedLine.substring(1).trim() || "Entry ".concat(entries.length + 1);
        index++;
        // Sequence line
        while (index < lines.length && lines[index].trim().length === 0) {
            index++;
        }
        if (index >= lines.length) {
            throw new Error("No sequence found for entry \"".concat(entryName, "\"."));
        }
        var sequenceLine = lines[index].trim();
        if (sequenceLine.startsWith(">")) {
            throw new Error("Sequence for entry \"".concat(entryName, "\" is missing."));
        }
        if (sequenceLine.startsWith("#")) {
            throw new Error("Sequence for entry \"".concat(entryName, "\" cannot be a comment."));
        }
        var sequence = sanitizeSequence(sequenceLine);
        index++;
        // Optional structure line
        var structure = undefined;
        while (index < lines.length) {
            var candidate = lines[index].trim();
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
            throw new Error("Structure length (".concat(structure.length, ") does not match sequence length (").concat(sequence.length, ") for entry \"").concat(entryName, "\"."));
        }
        entries.push({
            name: entryName,
            sequence: sequence,
            structure: structure
        });
    }
    if (entries.length === 0) {
        throw new Error("No entries were found in the provided dot-bracket file.");
    }
    return {
        entries: entries,
        documentName: documentName
    };
}
function parseBasePairs(structure) {
    var stacks = {};
    var basePairs = new Array();
    for (var i = 0; i < structure.length; i++) {
        var symbol = structure[i];
        if (symbol === ".") {
            continue;
        }
        var isLowercase = /[a-z]/.test(symbol);
        var isUppercase = /[A-Z]/.test(symbol);
        if (symbol in bracketOpenToCloseMap || isLowercase) {
            var openSymbol = isLowercase ? symbol : symbol;
            if (!(openSymbol in stacks)) {
                stacks[openSymbol] = [];
            }
            stacks[openSymbol].push({
                openSymbol: openSymbol,
                index: i
            });
            continue;
        }
        var expectedOpenSymbol = undefined;
        if (symbol in bracketCloseToOpenMap) {
            expectedOpenSymbol = bracketCloseToOpenMap[symbol];
        }
        else if (isUppercase) {
            expectedOpenSymbol = symbol.toLowerCase();
        }
        if (expectedOpenSymbol === undefined) {
            throw new Error("Unrecognized structure character \"".concat(symbol, "\" at position ").concat(i + 1, "."));
        }
        var stack = stacks[expectedOpenSymbol];
        if (stack === undefined || stack.length === 0) {
            throw new Error("Unbalanced structure: found closing \"".concat(symbol, "\" at position ").concat(i + 1, " without matching opening."));
        }
        var openingIndex = stack.pop().index;
        basePairs.push([
            openingIndex,
            i
        ]);
    }
    for (var _i = 0, _a = Object.entries(stacks); _i < _a.length; _i++) {
        var _b = _a[_i], openSymbol = _b[0], stack = _b[1];
        if (stack.length > 0) {
            var index = stack[stack.length - 1].index;
            throw new Error("Unbalanced structure: opening \"".concat(openSymbol, "\" at position ").concat(index + 1, " has no matching closing character."));
        }
    }
    return basePairs;
}
function generateCircularLayout(sequenceLength) {
    var radius = Math.max(MINIMUM_RADIUS, sequenceLength * RADIUS_PER_NUCLEOTIDE);
    var centerOffset = radius + 10;
    var angleIncrement = (2 * Math.PI) / sequenceLength;
    var positions = new Array(sequenceLength);
    for (var i = 0; i < sequenceLength; i++) {
        var angle = -Math.PI / 2 + i * angleIncrement;
        positions[i] = {
            x: centerOffset + radius * Math.cos(angle),
            y: centerOffset + radius * Math.sin(angle)
        };
    }
    return positions;
}
var dotBracketInputFileHandler = function (inputFileContent) {
    var _a = parseDotBracketFile(inputFileContent), entries = _a.entries, documentName = _a.documentName;
    var rnaComplexProps = entries.map(function (entry, entryIndex) {
        var _a;
        var name = entry.name, sequence = entry.sequence, structure = entry.structure;
        var rnaComplexName = name;
        var rnaMoleculeName = sequence.length > 0 ? name : "RNA molecule ".concat(entryIndex + 1);
        var singularRnaMoleculeProps = {
            firstNucleotideIndex: 1,
            nucleotideProps: {}
        };
        var singularRnaComplexProps = {
            name: rnaComplexName,
            rnaMoleculeProps: (_a = {},
                _a[rnaMoleculeName] = singularRnaMoleculeProps,
                _a),
            basePairs: {}
        };
        var positions = generateCircularLayout(sequence.length || 1);
        for (var i = 0; i < sequence.length; i++) {
            var rawSymbol = sequence[i];
            var sanitizedSymbol = rawSymbol === "T" ? Nucleotide_1.Nucleotide.Symbol.U : rawSymbol;
            var symbol = Nucleotide_1.Nucleotide.isSymbol(sanitizedSymbol) ? sanitizedSymbol : Nucleotide_1.Nucleotide.Symbol.N;
            var _b = positions[i], x = _b.x, y = _b.y;
            singularRnaMoleculeProps.nucleotideProps[i] = {
                symbol: symbol,
                x: x,
                y: y
            };
        }
        if (structure !== undefined) {
            var basePairs = parseBasePairs(structure);
            for (var _i = 0, basePairs_1 = basePairs; _i < basePairs_1.length; _i++) {
                var _c = basePairs_1[_i], index0 = _c[0], index1 = _c[1];
                (0, RnaComplex_1.insertBasePair)(singularRnaComplexProps, rnaMoleculeName, index0, rnaMoleculeName, index1, RnaComplex_1.DuplicateBasePairKeysHandler.DO_NOTHING);
            }
        }
        return singularRnaComplexProps;
    });
    var output = {
        complexDocumentName: documentName,
        rnaComplexProps: rnaComplexProps
    };
    return output;
};
exports.dotBracketInputFileHandler = dotBracketInputFileHandler;
