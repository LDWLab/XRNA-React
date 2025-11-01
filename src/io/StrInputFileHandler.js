"use strict";
exports.__esModule = true;
exports.strInputFileHandler = void 0;
var ParseGraphicalData_1 = require("./ParseGraphicalData");
function strInputFileHandler(inputFileContent) {
    var _a, _b, _c, _d, _e, _f, _g;
    var defaultFontSize = 4;
    var regexMatch = /basefont[^\}]*\{[^\}]+\}[^\}\d]*(\d+)[^\}]*\}/.exec(inputFileContent);
    if (regexMatch !== null) {
        defaultFontSize = Number.parseInt(regexMatch[1]);
    }
    var regexMatchAll = inputFileContent.matchAll(/(text|line)\s*\{/g);
    var nucleotideProps = new Array();
    var basePairLines = new Array();
    var rnaComplexIndex = 0;
    var complexDocumentName = "Scene";
    var rnaComplexName = "RNA complex";
    var rnaMoleculeName = "RNA molecule";
    // The following data structures are necessary; later on, they might become relevant to STR parsing.
    // As far as I can tell, they don't exist in this type of input file.
    var labelLines = (_a = {},
        _a[rnaComplexIndex] = [],
        _a);
    var labelContents = (_b = {},
        _b[rnaComplexIndex] = [],
        _b);
    var basePairCenters = new Array();
    for (var _i = 0, regexMatchAll_1 = regexMatchAll; _i < regexMatchAll_1.length; _i++) {
        var regexMatch_1 = regexMatchAll_1[_i];
        var openCloseBracketBalanceIndex = 1;
        var index = regexMatch_1.index;
        if (index === undefined) {
            throw "index should never be undefined.";
        }
        var end = index + regexMatch_1[0].length;
        var previousIndex = end - 1;
        while (openCloseBracketBalanceIndex > 0) {
            var incrementedPreviousIndex = previousIndex + 1;
            var indexOfNextOpenBracket = inputFileContent.indexOf("{", incrementedPreviousIndex);
            var indexOfNextCloseBracket = inputFileContent.indexOf("}", incrementedPreviousIndex);
            if (indexOfNextOpenBracket === -1) {
                if (indexOfNextCloseBracket === -1) {
                    throw "This STR file is improper; it contains an unclosed bracket.";
                }
                else {
                    previousIndex = indexOfNextCloseBracket;
                    openCloseBracketBalanceIndex--;
                }
            }
            else if (indexOfNextCloseBracket === -1) {
                previousIndex = indexOfNextOpenBracket;
                openCloseBracketBalanceIndex++;
            }
            else if (indexOfNextCloseBracket < indexOfNextOpenBracket) {
                previousIndex = indexOfNextCloseBracket;
                openCloseBracketBalanceIndex--;
            }
            else {
                // Note: it is impossible for indexOfNextCloseBracket == indexOfNextOpenBracket.
                // Therefore, indexOfNextCloseBracket > indexOfNextOpenBracket.
                previousIndex = indexOfNextOpenBracket;
                openCloseBracketBalanceIndex++;
            }
        }
        var subcontents = inputFileContent.substring(end, previousIndex);
        var label = regexMatch_1[1];
        switch (label) {
            case "text": {
                var regex = /\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s*\}.*(A|C|G|U)\s+0\s*$/;
                var textRegexMatch = subcontents.match(regex);
                if (textRegexMatch !== null) {
                    nucleotideProps.push({
                        x: Number.parseFloat(textRegexMatch[1]),
                        y: Number.parseFloat(textRegexMatch[2]),
                        symbol: textRegexMatch[3]
                    });
                }
                break;
            }
            case "line": {
                var regex = /\{\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\}/;
                var lineRegexMatch = subcontents.match(regex);
                if (lineRegexMatch === null) {
                    throw "lineRegexMatch should never be null.";
                }
                basePairLines.push({
                    v0: {
                        x: Number.parseFloat(lineRegexMatch[1]),
                        y: Number.parseFloat(lineRegexMatch[2])
                    },
                    v1: {
                        x: Number.parseFloat(lineRegexMatch[3]),
                        y: Number.parseFloat(lineRegexMatch[4])
                    }
                });
                break;
            }
        }
    }
    // As far as I can tell, this file type encodes only a single RNA molecule.
    // Therefore, I have hardcoded a single RNA molecule within a single RNA complex.
    var singularRnaMoleculeProps = {
        firstNucleotideIndex: 1,
        nucleotideProps: nucleotideProps
    };
    var singularRnaComplexProps = {
        name: rnaComplexName,
        rnaMoleculeProps: (_c = {},
            _c[rnaMoleculeName] = singularRnaMoleculeProps,
            _c),
        basePairs: {}
    };
    var rnaComplexProps = [
        singularRnaComplexProps
    ];
    (0, ParseGraphicalData_1.parseGraphicalData)(rnaComplexProps, (_d = {},
        _d[rnaComplexIndex] = basePairLines,
        _d), (_e = {},
        _e[rnaComplexIndex] = basePairCenters,
        _e), (_f = {},
        _f[rnaComplexIndex] = (_g = {},
            _g[rnaMoleculeName] = [],
            _g),
        _f), labelLines, labelContents);
    return {
        complexDocumentName: complexDocumentName,
        rnaComplexProps: rnaComplexProps
    };
}
exports.strInputFileHandler = strInputFileHandler;
