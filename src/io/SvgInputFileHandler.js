"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.svgInputFileHandler = exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG_DEFAULT = exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG = exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG_DEFAULT = exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG = exports.SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME = exports.SVG_PROPERTY_XRNA_BASE_PAIR_TYPE = exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1 = exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0 = exports.SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX = exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1 = exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0 = exports.SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX = exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX = exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME = exports.SVG_PROPERTY_XRNA_COMPLEX_NAME = exports.SVG_PROPERTY_XRNA_TYPE = exports.SvgPropertyXrnaType = void 0;
var App_1 = require("../App");
var BasePair_1 = require("../components/app_specific/BasePair");
var Nucleotide_1 = require("../components/app_specific/Nucleotide");
var RnaComplex_1 = require("../components/app_specific/RnaComplex");
var AffineMatrix_1 = require("../data_structures/AffineMatrix");
var Color_1 = require("../data_structures/Color");
var Font_1 = require("../data_structures/Font");
var Constants_1 = require("../utils/Constants");
var ParseGraphicalData_1 = require("./ParseGraphicalData");
var SvgPropertyXrnaType;
(function (SvgPropertyXrnaType) {
    SvgPropertyXrnaType["SCENE"] = "scene";
    SvgPropertyXrnaType["RNA_COMPLEX"] = "rna_complex";
    SvgPropertyXrnaType["RNA_MOLECULE"] = "rna_molecule";
    SvgPropertyXrnaType["NUCLEOTIDE"] = "nucleotide";
    SvgPropertyXrnaType["LABEL_LINE"] = "label_line";
    SvgPropertyXrnaType["LABEL_CONTENT"] = "label_content";
    SvgPropertyXrnaType["BASE_PAIR"] = "base_pair";
    SvgPropertyXrnaType["PATH"] = "path";
    SvgPropertyXrnaType["CENTERLINE"] = "centerline";
})(SvgPropertyXrnaType = exports.SvgPropertyXrnaType || (exports.SvgPropertyXrnaType = {}));
;
var svgPropertyXrnaDataTypes = Object.values(SvgPropertyXrnaType);
function isSvgPropertyXrnaDataType(candidateSvgPropertyXrnaDataType) {
    return svgPropertyXrnaDataTypes.includes(candidateSvgPropertyXrnaDataType);
}
var XrnaGtSvgId;
(function (XrnaGtSvgId) {
    XrnaGtSvgId["LETTERS"] = "Letters";
    XrnaGtSvgId["LABELS_LINES"] = "Labels_Lines";
    XrnaGtSvgId["LABELS_TEXT"] = "Labels_Text";
    XrnaGtSvgId["BASE_PAIR_LINES"] = "Nucleotide_Lines";
    XrnaGtSvgId["BASE_PAIR_CIRCLES"] = "Nucleotide_Circles";
})(XrnaGtSvgId || (XrnaGtSvgId = {}));
var xrnaGtSvgIds = Object.values(XrnaGtSvgId);
var SvgFileType;
(function (SvgFileType) {
    SvgFileType["XRNA_JS"] = "xrna.js";
    SvgFileType["XRNA_GT"] = "xrna_gt";
    SvgFileType["UNFORMATTED"] = "unformatted";
})(SvgFileType || (SvgFileType = {}));
exports.SVG_PROPERTY_XRNA_TYPE = "data-xrna_type";
exports.SVG_PROPERTY_XRNA_COMPLEX_NAME = "data-xrna_rna_complex_name";
exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME = "data-xrna_rna_molecule_name";
exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX = "data-xrna_rna_molecule_first_nucleotide_index";
exports.SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX = "data-xrna_formatted_nucleotide_index";
exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0 = "data-xrna_base_pair_rna_molecule_name_0";
exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1 = "data-xrna_base_pair_rna_molecule_name_1";
exports.SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX = "data-xrna_base_pair_formatted_nucleotide_index";
exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0 = "data-xrna_base_pair_formatted_nucleotide_index_0";
exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1 = "data-xrna_base_pair_formatted_nucleotide_index_1";
exports.SVG_PROPERTY_XRNA_BASE_PAIR_TYPE = "data-xrna_base_pair_type";
exports.SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME = "data-xrna_scene_name";
exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG = "data-xrna_relative_coordinates_flag";
exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG_DEFAULT = true;
exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG = "data-xrna_invert_y_axis_flag";
exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG_DEFAULT = false;
var SVG_PROPERTY_RECTANGLE_WIDTH = "rectangle_width";
var SVG_PROPERTY_RECTANGLE_HEIGHT = "rectangle_height";
var transformRegex = /matrix\(1\s+0\s+0\s+1\s+(-?[\d.]+)\s+(-?[\d.]+)\)/;
var styles = { defaults: {} };
function parseSvgElement(svgElement, cache, svgFileType) {
    var _a, _b, _c, _d, _e, _f, _g, _h, _j;
    var dataXrnaType = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_TYPE);
    if (dataXrnaType !== null) {
        if (!isSvgPropertyXrnaDataType(dataXrnaType)) {
            throw "Unrecognized SvgXrnaDataType \"".concat(dataXrnaType, "\"");
        }
    }
    var style = __assign({}, styles.root);
    for (var _i = 0, _k = svgElement.classList; _i < _k.length; _i++) {
        var _class = _k[_i];
        if (_class in styles.defaults) {
            style = __assign(__assign({}, style), styles.defaults[_class]);
        }
    }
    if (svgElement.tagName in styles) {
        var stylesPerType = styles[svgElement.tagName];
        for (var _l = 0, _m = svgElement.classList; _l < _m.length; _l++) {
            var _class = _m[_l];
            if (_class in stylesPerType) {
                var stylesPerTypePerClass = stylesPerType[_class];
                style = __assign(__assign({}, style), stylesPerTypePerClass);
            }
        }
    }
    switch (svgFileType) {
        case SvgFileType.XRNA_JS: {
            if (dataXrnaType === null) {
                switch (svgElement.tagName) {
                    // case "text" : {
                    //   if (cache.parentSvgXrnaDataType === SvgPropertyXrnaType.NUCLEOTIDE) {
                    //     const symbol = svgElement.textContent;
                    //     if (symbol === null) {
                    //       throw `Required SVG element property "textContent" is required.`;
                    //     }
                    //     if (!Nucleotide.isSymbol(symbol)) {
                    //       throw `Required SVG element property "textContent" is not a supported nucleotide symbol`;
                    //     }
                    //     const singularNucleotideProps = cache.singularNucleotideProps as Nucleotide.ExternalProps;
                    //     singularNucleotideProps.symbol = symbol;
                    //     const font = structuredClone(Font.DEFAULT);
                    //     singularNucleotideProps.font = font
                    //     const fontStyle = svgElement.getAttribute("font-style");
                    //     if (fontStyle !== null) {
                    //       font.style = fontStyle;
                    //     }
                    //     const fontWeight = svgElement.getAttribute("font-weight");
                    //     if (fontWeight !== null) {
                    //       font.weight = fontWeight;
                    //     }
                    //     const fontFamily = svgElement.getAttribute("font-family");
                    //     if (fontFamily !== null) {
                    //       font.family = fontFamily;
                    //     }
                    //     const fontSize = svgElement.getAttribute("font-size");
                    //     if (fontSize !== null) {
                    //       font.size = fontSize;
                    //     }
                    //     const strokeWidth = svgElement.getAttribute("stroke-width");
                    //     if (strokeWidth !== null) {
                    //       singularNucleotideProps.strokeWidth = Number.parseFloat(strokeWidth);
                    //     }
                    //     const fill = svgElement.getAttribute("fill");
                    //     if (fill !== null) {
                    //       singularNucleotideProps.color = fromCssString(fill);
                    //     }
                    //   }
                    //   break;
                    // }
                    // case "polyline" : {
                    //   if (cache.parentSvgXrnaDataType === SvgPropertyXrnaType.LABEL_LINE) {
                    //     const singularLabelLineProps = cache.singularLabelLineProps;
                    //     if (singularLabelLineProps === undefined) {
                    //       throw "cache.singularLabelLineProps should not be undefined at this point. The input SVG file is broken.";
                    //     }
                    //     const points = svgElement.getAttribute("points");
                    //     if (points === null) {
                    //       throw `Required SVG-element property "points" is missing.`;
                    //     }
                    //     singularLabelLineProps.points = points.split(/\s+/).map(function(pointAsText : string) {
                    //       const pointRegexMatch = pointAsText.match(/(-?[\d.]+),\s*(-?[\d.]+)/);
                    //       if (pointRegexMatch === null) {
                    //         throw `Required SVG element property "points" does not match the expected format`;
                    //       }
                    //       return {
                    //         x : Number.parseFloat(pointRegexMatch[1]),
                    //         y : Number.parseFloat(pointRegexMatch[2])
                    //       };
                    //     });
                    //     const stroke = svgElement.getAttribute("stroke");
                    //     if (stroke !== null) {
                    //       singularLabelLineProps.color = fromCssString(stroke);
                    //     }
                    //     const strokeWidth = svgElement.getAttribute("stroke-width");
                    //     if (strokeWidth !== null) {
                    //       singularLabelLineProps.strokeWidth = Number.parseFloat(strokeWidth);
                    //     }
                    //   }
                    //   break;
                    // }
                }
            }
            else {
                var invertYAxisFlag_1 = (_a = cache.invertYAxisFlag) !== null && _a !== void 0 ? _a : exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG_DEFAULT;
                switch (dataXrnaType) {
                    case SvgPropertyXrnaType.SCENE: {
                        var complexDocumentName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME);
                        if (complexDocumentName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_COMPLEX_DOCUMENT_NAME, "\" is missing.");
                        }
                        cache.complexDocumentName = complexDocumentName;
                        var relativeCoordinatesFlag = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG);
                        if (relativeCoordinatesFlag == null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG, "\" is missing.");
                        }
                        cache.relativeCoordinatesFlag = relativeCoordinatesFlag === "true";
                        var invertYAxisFlag_2 = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG);
                        if (invertYAxisFlag_2 == null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_INVERT_Y_AXIS_FLAG, "\" is missing.");
                        }
                        cache.invertYAxisFlag = invertYAxisFlag_2 === "true";
                        break;
                    }
                    case SvgPropertyXrnaType.RNA_COMPLEX: {
                        var rnaComplexName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME);
                        if (rnaComplexName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME, "\" is missing.");
                        }
                        cache.singularRnaComplexProps = {
                            name: rnaComplexName,
                            rnaMoleculeProps: {},
                            basePairs: {}
                        };
                        var rnaComplexIndex = cache.rnaComplexProps.length;
                        cache.rnaComplexPropsByName[rnaComplexName] = cache.singularRnaComplexProps;
                        var labelLinesPerRnaComplex = [];
                        cache.labelLinesPerRnaComplex = labelLinesPerRnaComplex;
                        cache.labelLines[rnaComplexIndex] = labelLinesPerRnaComplex;
                        var labelContentsPerRnaComplex = [];
                        cache.labelContentsPerRnaComplex = labelContentsPerRnaComplex;
                        cache.labelContents[rnaComplexIndex] = labelContentsPerRnaComplex;
                        cache.rnaComplexProps.push(cache.singularRnaComplexProps);
                        cache.temporaryBasePairsPerRnaComplex = [];
                        break;
                    }
                    case SvgPropertyXrnaType.BASE_PAIR: {
                        var rnaComplexName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME);
                        if (rnaComplexName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME, "\" is missing.");
                        }
                        var rnaMoleculeName0 = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0);
                        if (rnaMoleculeName0 === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_0, "\" is missing.");
                        }
                        var formattedNucleotideIndex0 = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0);
                        if (formattedNucleotideIndex0 === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_0, "\" is missing.");
                        }
                        var rnaMoleculeName1 = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1);
                        if (rnaMoleculeName1 === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_BASE_PAIR_RNA_MOLECULE_NAME_1, "\" is missing.");
                        }
                        var formattedNucleotideIndex1 = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1);
                        if (formattedNucleotideIndex1 === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_BASE_PAIR_FORMATTED_NUCLEOTIDE_INDEX_1, "\" is missing.");
                        }
                        var basePairType = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_BASE_PAIR_TYPE);
                        if (basePairType === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_BASE_PAIR_TYPE, "\" is missing.");
                        }
                        if (!(0, BasePair_1.isBasePairType)(basePairType)) {
                            throw "Unrecognized BasePair.Type \"".concat(basePairType, "\"");
                        }
                        var temporaryBasePair = {
                            rnaMoleculeName0: rnaMoleculeName0,
                            formattedNucleotideIndex0: Number.parseInt(formattedNucleotideIndex0),
                            rnaMoleculeName1: rnaMoleculeName1,
                            formattedNucleotideIndex1: Number.parseInt(formattedNucleotideIndex1),
                            basePairType: basePairType
                        };
                        var stroke = svgElement.getAttribute("stroke");
                        if (stroke !== null && stroke !== "none") {
                            temporaryBasePair.color = (0, Color_1.fromCssString)(stroke);
                        }
                        var fill = svgElement.getAttribute("fill");
                        if (fill !== null && fill !== "none") {
                            temporaryBasePair.color = (0, Color_1.fromCssString)(fill);
                        }
                        var strokeWidth = svgElement.getAttribute("stroke-width");
                        if (strokeWidth !== null) {
                            temporaryBasePair.strokeWidth = Number.parseFloat(strokeWidth);
                        }
                        if (!(rnaComplexName in cache.temporaryBasePairsPerRnaComplexName)) {
                            cache.temporaryBasePairsPerRnaComplexName[rnaComplexName] = [];
                        }
                        cache.temporaryBasePairsPerRnaComplexName[rnaComplexName].push(temporaryBasePair);
                        break;
                    }
                    case SvgPropertyXrnaType.RNA_MOLECULE: {
                        var firstNucleotideIndexAsString = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX);
                        if (firstNucleotideIndexAsString === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX, "\" is missing.");
                        }
                        cache.singularRnaMoleculeProps = {
                            firstNucleotideIndex: Number.parseInt(firstNucleotideIndexAsString),
                            nucleotideProps: {}
                        };
                        var rnaMoleculeName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
                        if (rnaMoleculeName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, "\" is missing.");
                        }
                        if (cache.singularRnaComplexProps === undefined) {
                            throw "cache.singularRnaComplexProps should not be undefined at this point. The input SVG file is broken.";
                        }
                        cache.singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = cache.singularRnaMoleculeProps;
                        break;
                    }
                    case SvgPropertyXrnaType.NUCLEOTIDE: {
                        var rnaComplexName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME);
                        if (rnaComplexName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME, "\" is missing.");
                        }
                        if (!(rnaComplexName in cache.rnaComplexPropsByName)) {
                            var singularRnaComplexProps_1 = {
                                name: rnaComplexName,
                                rnaMoleculeProps: {},
                                basePairs: {}
                            };
                            cache.rnaComplexPropsByName[rnaComplexName] = singularRnaComplexProps_1;
                            cache.rnaComplexProps.push(singularRnaComplexProps_1);
                        }
                        var singularRnaComplexProps = cache.rnaComplexPropsByName[rnaComplexName];
                        var rnaMoleculeName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
                        if (rnaMoleculeName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, "\" is missing.");
                        }
                        var firstNucleotideIndexAsString = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX);
                        if (firstNucleotideIndexAsString === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_FIRST_NUCLEOTIDE_INDEX, "\" is missing.");
                        }
                        var firstNucleotideIndex = Number.parseInt(firstNucleotideIndexAsString);
                        if (!(rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps)) {
                            var singularRnaMoleculeProps_1 = {
                                firstNucleotideIndex: firstNucleotideIndex,
                                nucleotideProps: {}
                            };
                            singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps_1;
                        }
                        var singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
                        var transform = svgElement.getAttribute("transform");
                        if (transform === null) {
                            throw "Required SVG-element property \"transform\" is missing.";
                        }
                        var transformAsMatrix = (0, AffineMatrix_1.parseAffineMatrix)(transform);
                        var nucleotideIndexAsString = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX);
                        if (nucleotideIndexAsString === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX, "\" is missing.");
                        }
                        var nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
                        var symbol = svgElement.textContent;
                        if (symbol === null) {
                            throw "Required SVG-element property \"textContent\" is missing.";
                        }
                        if (!Nucleotide_1.Nucleotide.isSymbol(symbol)) {
                            throw "\"".concat(symbol, "\" is not a valid nucleotide symbol.");
                        }
                        var x = transformAsMatrix[4];
                        var y = transformAsMatrix[5];
                        if (invertYAxisFlag_1) {
                            y *= -1;
                        }
                        var singularNucleotideProps = {
                            x: x,
                            y: y,
                            symbol: symbol
                        };
                        singularRnaMoleculeProps.nucleotideProps[nucleotideIndex - firstNucleotideIndex] = singularNucleotideProps;
                        var font = structuredClone(Font_1["default"].DEFAULT);
                        singularNucleotideProps.font = font;
                        var fontStyle = svgElement.getAttribute("font-style");
                        if (fontStyle !== null) {
                            font.style = fontStyle;
                        }
                        else if (style.style !== undefined) {
                            font.style = style.style;
                        }
                        var fontWeight = svgElement.getAttribute("font-weight");
                        if (fontWeight !== null) {
                            font.weight = fontWeight;
                        }
                        else if (style.weight !== undefined) {
                            font.weight = style.weight;
                        }
                        var fontFamily = svgElement.getAttribute("font-family");
                        if (fontFamily !== null) {
                            font.family = fontFamily;
                        }
                        else if (style.family !== undefined) {
                            font.family = style.family;
                        }
                        var fontSize = svgElement.getAttribute("font-size");
                        if (fontSize !== null) {
                            font.size = fontSize;
                        }
                        else if (style.size !== undefined) {
                            font.size = style.size;
                        }
                        var strokeWidth = svgElement.getAttribute("stroke-width");
                        if (strokeWidth !== null) {
                            singularNucleotideProps.strokeWidth = Number.parseFloat(strokeWidth);
                        }
                        else if (style.strokeWidth !== undefined) {
                            singularNucleotideProps.strokeWidth = style.strokeWidth;
                        }
                        var fill = svgElement.getAttribute("fill");
                        if (fill !== null) {
                            singularNucleotideProps.color = (0, Color_1.fromCssString)(fill);
                        }
                        else if (style.fill !== undefined) {
                            singularNucleotideProps.color = style.fill;
                        }
                        // const formattedNucleotideIndexAsString = svgElement.getAttribute(SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX);
                        // if (formattedNucleotideIndexAsString === null) {
                        //   throw `Required SVG-element property "${SVG_PROPERTY_XRNA_NUCLEOTIDE_INDEX}" is missing.`;
                        // }
                        // const formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
                        // const transform = svgElement.getAttribute("transform");
                        // if (transform === null) {
                        //   throw `Required SVG-element property "transform" is missing.`;
                        // }
                        // const transformMatch = transform.match(/^translate\((-?[\d.]+), (-?[\d.]+)\)$/);
                        // if (transformMatch === null) {
                        //   throw `Required SVG-element property "transform" does not match the expected format`;
                        // }
                        // cache.singularNucleotideProps = {
                        //   x : Number.parseFloat(transformMatch[1]),
                        //   y : Number.parseFloat(transformMatch[2]),
                        //   // This is a placeholder.
                        //   symbol : Nucleotide.Symbol.A
                        // };
                        // const singularRnaMoleculeProps = cache.singularRnaMoleculeProps;
                        // if (singularRnaMoleculeProps === undefined) {
                        //   throw "cache.singularRnaMoleculeProps should not be undefined at this point. The input SVG file is broken.";
                        // }
                        // singularRnaMoleculeProps.nucleotideProps[formattedNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex] = cache.singularNucleotideProps;
                        break;
                    }
                    case SvgPropertyXrnaType.LABEL_LINE: {
                        var polylineChildElements = Array.from(svgElement.children).filter(function (childELement) { return childELement.tagName === "polyline"; });
                        if (polylineChildElements.length !== 1) {
                            throw "Label-line SVG groups must have exactly one polyline child element.";
                        }
                        var polylineChildElement = polylineChildElements[0];
                        var pointsAttribute = polylineChildElement.getAttribute("points");
                        if (pointsAttribute === null) {
                            throw "Required SVG-element property \"points\" is missing.";
                        }
                        var points = new Array();
                        points = pointsAttribute.split(/\s+/).map(function (pointAsText) {
                            var pointRegexMatch = pointAsText.match(/(-?[\d.]+),\s*(-?[\d.]+)/);
                            if (pointRegexMatch === null) {
                                throw "Required SVG element property \"points\" does not match the expected format";
                            }
                            var x = Number.parseFloat(pointRegexMatch[1]);
                            var y = Number.parseFloat(pointRegexMatch[2]);
                            if (invertYAxisFlag_1) {
                                y *= -1;
                            }
                            return {
                                x: x,
                                y: y
                            };
                        });
                        var stroke = svgElement.getAttribute("stroke");
                        var color = Color_1.BLACK;
                        if (stroke !== null) {
                            color = (0, Color_1.fromCssString)(stroke);
                        }
                        else if (style.stroke !== undefined) {
                            color = style.stroke;
                        }
                        var strokeWidth = Constants_1.DEFAULT_STROKE_WIDTH;
                        var strokeWidthAttribute = svgElement.getAttribute("stroke-width");
                        if (strokeWidthAttribute !== null) {
                            strokeWidth = Number.parseFloat(strokeWidthAttribute);
                        }
                        else if (style.strokeWidth !== undefined) {
                            strokeWidth = style.strokeWidth;
                        }
                        var singularLabelLineProps = {
                            points: points,
                            color: color,
                            strokeWidth: strokeWidth
                        };
                        var rnaComplexName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME);
                        if (rnaComplexName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME, "\" is missing.");
                        }
                        var rnaMoleculeName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
                        if (rnaMoleculeName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, "\" is missing.");
                        }
                        var formattedNucleotideIndexAsString = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX);
                        if (formattedNucleotideIndexAsString === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX, "\" is missing.");
                        }
                        var formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
                        if (!(rnaComplexName in cache.temporaryLabelData)) {
                            cache.temporaryLabelData[rnaComplexName] = {};
                        }
                        var temporaryLabelDataPerRnaComplexName = cache.temporaryLabelData[rnaComplexName];
                        if (!(rnaMoleculeName in temporaryLabelDataPerRnaComplexName)) {
                            temporaryLabelDataPerRnaComplexName[rnaMoleculeName] = {};
                        }
                        var temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName = temporaryLabelDataPerRnaComplexName[rnaMoleculeName];
                        if (!(formattedNucleotideIndex in temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName)) {
                            temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex] = {};
                        }
                        temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex].labelLineProps = singularLabelLineProps;
                        // cache.singularLabelLineProps = singularLabelLineProps;
                        // const singularNucleotideProps = cache.singularNucleotideProps;
                        // if (singularNucleotideProps === undefined) {
                        //   throw "cache.singularNucleotideProps should not be undefined at this point. The input SVG file is broken.";
                        // }
                        // singularNucleotideProps.labelLineProps = singularLabelLineProps;
                        break;
                    }
                    case SvgPropertyXrnaType.LABEL_CONTENT: {
                        var textContent = svgElement.textContent;
                        if (textContent === null) {
                            throw "Required SVG-element property \"textContent\" is missing.";
                        }
                        var transform = svgElement.getAttribute("transform");
                        if (transform === null) {
                            throw "Required SVG-element property \"transform\" is missing.";
                        }
                        var transformAsMatrix = (0, AffineMatrix_1.parseAffineMatrix)(transform);
                        // const transformRegexMatch = transform.match(/^translate\((-?[\d.]+),\s+(-?[\d.]+)\)/);
                        // if (transformRegexMatch === null) {
                        //   throw `Required SVG-element property "transform" does not match the expected format`;
                        // }
                        var font = structuredClone(Font_1["default"].DEFAULT);
                        var fontSize = svgElement.getAttribute("font-size");
                        if (fontSize !== null) {
                            font.size = fontSize;
                        }
                        else if (style.size !== undefined) {
                            font.size = style.size;
                        }
                        var fontStyle = svgElement.getAttribute("font-style");
                        if (fontStyle !== null) {
                            font.style = fontStyle;
                        }
                        else if (style.style !== undefined) {
                            font.style = style.style;
                        }
                        var fontWeight = svgElement.getAttribute("font-weight");
                        if (fontWeight !== null) {
                            font.weight = fontWeight;
                        }
                        else if (style.weight !== undefined) {
                            font.weight = style.weight;
                        }
                        var fontFamily = svgElement.getAttribute("font-family");
                        if (fontFamily !== null) {
                            font.family = fontFamily;
                        }
                        else if (style.family !== undefined) {
                            font.family = style.family;
                        }
                        var x = transformAsMatrix[4];
                        var y = transformAsMatrix[5];
                        if (invertYAxisFlag_1) {
                            y *= -1;
                        }
                        var labelContentProps = {
                            content: textContent,
                            x: x,
                            y: y,
                            font: font
                        };
                        var fill = svgElement.getAttribute("fill");
                        if (fill !== null) {
                            labelContentProps.color = (0, Color_1.fromCssString)(fill);
                        }
                        else if (style.fill !== undefined) {
                            labelContentProps.color = style.fill;
                        }
                        var strokeWidth = svgElement.getAttribute("stroke-width");
                        if (strokeWidth !== null) {
                            labelContentProps.strokeWidth = Number.parseFloat(strokeWidth);
                        }
                        else if (style.strokeWidth !== undefined) {
                            labelContentProps.strokeWidth = style.strokeWidth;
                        }
                        var rnaComplexName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME);
                        if (rnaComplexName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_COMPLEX_NAME, "\" is missing.");
                        }
                        var rnaMoleculeName = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME);
                        if (rnaMoleculeName === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_RNA_MOLECULE_NAME, "\" is missing.");
                        }
                        var formattedNucleotideIndexAsString = svgElement.getAttribute(exports.SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX);
                        if (formattedNucleotideIndexAsString === null) {
                            throw "Required SVG-element property \"".concat(exports.SVG_PROPERTY_XRNA_LABEL_FORMATTED_NUCLEOTIDE_INDEX, "\" is missing.");
                        }
                        var formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
                        if (!(rnaComplexName in cache.temporaryLabelData)) {
                            cache.temporaryLabelData[rnaComplexName] = {};
                        }
                        var temporaryLabelDataPerRnaComplexName = cache.temporaryLabelData[rnaComplexName];
                        if (!(rnaMoleculeName in temporaryLabelDataPerRnaComplexName)) {
                            temporaryLabelDataPerRnaComplexName[rnaMoleculeName] = {};
                        }
                        var temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName = temporaryLabelDataPerRnaComplexName[rnaMoleculeName];
                        if (!(formattedNucleotideIndex in temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName)) {
                            temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex] = {};
                        }
                        temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex].labelContentProps = labelContentProps;
                        // const singularNucleotideProps = cache.singularNucleotideProps;
                        // if (singularNucleotideProps === undefined) {
                        //   throw "cache.singularNucleotideProps should not be undefined at this point. The input SVG file is broken.";
                        // }
                        // singularNucleotideProps.labelContentProps = labelContentProps;
                        break;
                    }
                    case SvgPropertyXrnaType.PATH:
                    case SvgPropertyXrnaType.CENTERLINE: {
                        // These types are used for export/layer organization only.
                        // They don't need to be imported back into the app state.
                        break;
                    }
                    default: {
                        throw "Unrecognized SvgXrnaDataType \"".concat(dataXrnaType, "\"");
                    }
                }
            }
            break;
        }
        case SvgFileType.XRNA_GT: {
            switch (svgElement.tagName) {
                case "g": {
                    var groupId = svgElement.getAttribute("id");
                    // Replace null with undefined.
                    cache.mostRecentGroupId = groupId !== null && groupId !== void 0 ? groupId : undefined;
                    switch (groupId) {
                        case XrnaGtSvgId.LETTERS: {
                            var singularRnaMoleculeProps = {
                                nucleotideProps: {},
                                firstNucleotideIndex: 0
                            };
                            cache.rnaMoleculeCount++;
                            var rnaMoleculeName = "RNA molecule #".concat(cache.rnaMoleculeCount);
                            cache.currentRnaMoleculeName = rnaMoleculeName;
                            cache.singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
                            var graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustmentsPerRnaComplex;
                            graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] = {};
                            cache.graphicalAdjustmentsPerRnaMolecule = graphicalAdjustmentsPerRnaComplex[rnaMoleculeName];
                            break;
                        }
                    }
                    break;
                }
                case "text": {
                    switch (cache.mostRecentGroupId) {
                        case XrnaGtSvgId.LETTERS: {
                            var requiredAttributes = {
                                id: svgElement.getAttribute("id"),
                                transform: svgElement.getAttribute("transform"),
                                textContent: svgElement.textContent,
                                rectangleWidth: svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_WIDTH),
                                rectangleHeight: svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT)
                            };
                            for (var _o = 0, _p = Object.entries(requiredAttributes); _o < _p.length; _o++) {
                                var _q = _p[_o], attributeName = _q[0], attributeValue = _q[1];
                                if (attributeValue === null) {
                                    throw "Required SVG attribute \"".concat(attributeName, "\" is missing.");
                                }
                            }
                            var id = requiredAttributes.id;
                            var nucleotideIndex = Number.NaN;
                            if (/^-?\d+$/.test(id)) {
                                nucleotideIndex = Number.parseInt(id);
                            }
                            else {
                                var idRegexMatch = id.match(/^(\w+)_(\w+):(\d+)$/);
                                if (idRegexMatch === null) {
                                    throw "Unrecognized nucleotide-index format \"".concat(id, "\"");
                                }
                                cache.currentRnaMoleculeName = idRegexMatch[2];
                                nucleotideIndex = Number.parseInt(idRegexMatch[3]);
                            }
                            var textContent = requiredAttributes.textContent.trim();
                            if (!Nucleotide_1.Nucleotide.isSymbol(textContent)) {
                                throw "Unrecognized nucleotide symbol \"".concat(textContent, "\"");
                            }
                            var transform = requiredAttributes.transform;
                            var transformRegexMatch = transform.match(transformRegex);
                            if (transformRegexMatch === null) {
                                throw "Unrecognized transform format \"".concat(transform, "\"");
                            }
                            var singularNucleotideProps = {
                                symbol: textContent,
                                x: Number.parseFloat(transformRegexMatch[1]),
                                y: Number.parseFloat(transformRegexMatch[2])
                            };
                            var optionalAttributes = {
                                fill: svgElement.getAttribute("fill"),
                                fontFamily: svgElement.getAttribute("font-family"),
                                fontWeight: svgElement.getAttribute("font-weight"),
                                fontStyle: svgElement.getAttribute("font-style"),
                                fontSize: svgElement.getAttribute("font-size")
                            };
                            if (optionalAttributes.fill !== null) {
                                singularNucleotideProps.color = (0, Color_1.fromCssString)(optionalAttributes.fill);
                            }
                            var font = structuredClone(Font_1["default"].DEFAULT);
                            singularNucleotideProps.font = font;
                            if (optionalAttributes.fontFamily !== null) {
                                font.family = optionalAttributes.fontFamily;
                            }
                            if (optionalAttributes.fontWeight !== null) {
                                font.weight = optionalAttributes.fontWeight;
                            }
                            if (optionalAttributes.fontStyle !== null) {
                                font.style = optionalAttributes.fontStyle;
                            }
                            if (optionalAttributes.fontSize !== null) {
                                font.size = (0, Font_1.parseFontSize)(optionalAttributes.fontSize);
                            }
                            var graphicalAdjustment = (0, Nucleotide_1.getGraphicalAdjustment)({
                                width: Number.parseFloat(requiredAttributes.rectangleWidth),
                                height: Number.parseFloat(requiredAttributes.rectangleHeight)
                            });
                            var currentRnaMoleculeName = cache.currentRnaMoleculeName;
                            if (currentRnaMoleculeName === undefined) {
                                throw "cache.currentRnaMoleculeName should not be undefined at this point.";
                            }
                            var rnaMoleculeProps = cache.singularRnaComplexProps.rnaMoleculeProps;
                            if (!(currentRnaMoleculeName in rnaMoleculeProps)) {
                                var singularRnaMoleculeProps = {
                                    firstNucleotideIndex: 0,
                                    nucleotideProps: {}
                                };
                                cache.singularRnaMoleculeProps = singularRnaMoleculeProps;
                                cache.singularRnaComplexProps.rnaMoleculeProps[currentRnaMoleculeName] = singularRnaMoleculeProps;
                                var graphicalAdjustmentsPerRnaMolecule = {};
                                cache.graphicalAdjustmentsPerRnaMolecule = graphicalAdjustmentsPerRnaMolecule;
                                cache.graphicalAdjustmentsPerRnaComplex[currentRnaMoleculeName] = graphicalAdjustmentsPerRnaMolecule;
                            }
                            cache.singularRnaMoleculeProps.nucleotideProps[nucleotideIndex] = singularNucleotideProps;
                            cache.graphicalAdjustmentsPerRnaMolecule[nucleotideIndex] = graphicalAdjustment;
                            break;
                        }
                        case XrnaGtSvgId.LABELS_TEXT: {
                            var requiredAttributes = {
                                transform: svgElement.getAttribute("transform"),
                                textContent: svgElement.textContent,
                                rectangleWidth: svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_WIDTH),
                                rectangleHeight: svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT)
                            };
                            for (var _r = 0, _s = Object.entries(requiredAttributes); _r < _s.length; _r++) {
                                var _t = _s[_r], attributeName = _t[0], attributeValue = _t[1];
                                if (attributeValue === null) {
                                    throw "Required SVG attribute \"".concat(attributeName, "\" is missing.");
                                }
                            }
                            requiredAttributes.textContent = requiredAttributes.textContent.trim();
                            var transform = requiredAttributes.transform;
                            var transformRegexMatch = transform.match(transformRegex);
                            if (transformRegexMatch === null) {
                                throw "Unrecognized transform format ".concat(transform);
                            }
                            var optionalAttributes = {
                                fontFamily: svgElement.getAttribute("font-family"),
                                fontStyle: svgElement.getAttribute("font-style"),
                                fontWeight: svgElement.getAttribute("font-weight"),
                                fontSize: svgElement.getAttribute("font-size"),
                                color: svgElement.getAttribute("fill")
                            };
                            var font = structuredClone(Font_1["default"].DEFAULT);
                            if (optionalAttributes.fontFamily !== null) {
                                font.family = optionalAttributes.fontFamily;
                            }
                            if (optionalAttributes.fontStyle !== null) {
                                font.style = optionalAttributes.fontStyle;
                            }
                            if (optionalAttributes.fontWeight !== null) {
                                font.weight = optionalAttributes.fontWeight;
                            }
                            if (optionalAttributes.fontSize !== null) {
                                font.size = (0, Font_1.parseFontSize)(optionalAttributes.fontSize);
                            }
                            var color = structuredClone(Color_1.BLACK);
                            if (optionalAttributes.color !== null) {
                                color = (0, Color_1.fromCssString)(optionalAttributes.color);
                            }
                            var x = Number.parseFloat(transformRegexMatch[1]);
                            var y = Number.parseFloat(transformRegexMatch[2]);
                            var width = Number.parseFloat(requiredAttributes.rectangleWidth);
                            var height = Number.parseFloat(requiredAttributes.rectangleHeight);
                            cache.labelContentsPerRnaComplex.push({
                                labelContent: {
                                    content: requiredAttributes.textContent,
                                    x: x,
                                    y: y,
                                    font: font,
                                    color: color
                                },
                                rectangle: {
                                    width: width,
                                    height: height
                                }
                            });
                        }
                    }
                    break;
                }
                case "line": {
                    var requiredAttributes = {
                        x1: svgElement.getAttribute("x1"),
                        y1: svgElement.getAttribute("y1"),
                        x2: svgElement.getAttribute("x2"),
                        y2: svgElement.getAttribute("y2")
                    };
                    for (var _u = 0, _v = Object.entries(requiredAttributes); _u < _v.length; _u++) {
                        var _w = _v[_u], attributeName = _w[0], attributeValue = _w[1];
                        if (attributeValue === null) {
                            throw "Required SVG property ".concat(attributeName, " is missing.");
                        }
                    }
                    var optionalAttributes = {
                        color: svgElement.getAttribute("stroke"),
                        strokeWidth: svgElement.getAttribute("stroke-width")
                    };
                    var color = Color_1.BLACK;
                    if (optionalAttributes.color !== null) {
                        color = (0, Color_1.fromCssString)(optionalAttributes.color);
                    }
                    var strokeWidth = Constants_1.DEFAULT_STROKE_WIDTH;
                    if (optionalAttributes.strokeWidth !== null) {
                        strokeWidth = Number.parseFloat(optionalAttributes.strokeWidth);
                    }
                    var v0 = {
                        x: Number.parseFloat(requiredAttributes.x1),
                        y: Number.parseFloat(requiredAttributes.y1)
                    };
                    var v1 = {
                        x: Number.parseFloat(requiredAttributes.x2),
                        y: Number.parseFloat(requiredAttributes.y2)
                    };
                    switch (cache.mostRecentGroupId) {
                        case XrnaGtSvgId.BASE_PAIR_LINES: {
                            cache.basePairLinesPerRnaComplex.push({
                                v0: v0,
                                v1: v1,
                                basePairType: BasePair_1["default"].Type.CANONICAL,
                                color: color,
                                strokeWidth: strokeWidth
                            });
                            break;
                        }
                        case XrnaGtSvgId.LABELS_LINES: {
                            cache.labelLinesPerRnaComplex.push({
                                v0: v0,
                                v1: v1,
                                color: color,
                                strokeWidth: strokeWidth
                            });
                            break;
                        }
                    }
                    break;
                }
                case "circle": {
                    if (cache.mostRecentGroupId === XrnaGtSvgId.BASE_PAIR_CIRCLES) {
                        var requiredAttributes = {
                            cx: svgElement.getAttribute("cx"),
                            cy: svgElement.getAttribute("cy")
                        };
                        for (var _x = 0, _y = Object.entries(requiredAttributes); _x < _y.length; _x++) {
                            var _z = _y[_x], attributeName = _z[0], attributeValue = _z[1];
                            if (attributeValue === null) {
                                throw "Required SVG attribute \"".concat(attributeName, "\" is missing.");
                            }
                        }
                        var optionalAttributes = {
                            fill: svgElement.getAttribute("fill")
                        };
                        if (optionalAttributes.fill !== null) {
                            optionalAttributes.fill = optionalAttributes.fill.trim();
                        }
                        var basePairType = optionalAttributes.fill === null ? BasePair_1["default"].Type.MISMATCH : BasePair_1["default"].Type.WOBBLE;
                        cache.basePairCentersPerRnaComplex.push({
                            x: Number.parseFloat(requiredAttributes.cx),
                            y: Number.parseFloat(requiredAttributes.cy),
                            basePairType: basePairType
                        });
                    }
                }
            }
            break;
        }
        case SvgFileType.UNFORMATTED: {
            // TODO : Test these files!
            switch (svgElement.tagName) {
                case "circle": {
                    var requiredAttributes = {
                        cx: svgElement.getAttribute("cx"),
                        cy: svgElement.getAttribute("cy")
                    };
                    for (var _0 = 0, _1 = Object.entries(requiredAttributes); _0 < _1.length; _0++) {
                        var _2 = _1[_0], attributeName = _2[0], attributeValue = _2[1];
                        if (attributeValue === null) {
                            throw "Required SVG attribute \"".concat(attributeName, "\" is missing.");
                        }
                    }
                    var optionalAttributes = {
                        fill: svgElement.getAttribute("fill")
                    };
                    var fillAttribute = undefined;
                    if (optionalAttributes.fill !== null) {
                        optionalAttributes.fill = optionalAttributes.fill.trim();
                        fillAttribute = (0, Color_1.fromCssString)(optionalAttributes.fill);
                    }
                    var basePairType = optionalAttributes.fill === null ? BasePair_1["default"].Type.MISMATCH : BasePair_1["default"].Type.WOBBLE;
                    cache.basePairCentersPerRnaComplex.push({
                        x: Number.parseFloat(requiredAttributes.cx),
                        y: Number.parseFloat(requiredAttributes.cy),
                        basePairType: basePairType,
                        color: (_b = fillAttribute !== null && fillAttribute !== void 0 ? fillAttribute : style.fill) !== null && _b !== void 0 ? _b : style.stroke
                    });
                    break;
                }
                case "text": {
                    var requiredAttributes = {
                        textContent: svgElement.textContent
                    };
                    var textContent = requiredAttributes.textContent.trim();
                    for (var _3 = 0, _4 = Object.entries(requiredAttributes); _3 < _4.length; _3++) {
                        var _5 = _4[_3], attributeName = _5[0], attributeValue = _5[1];
                        if (attributeValue === null) {
                            throw "Required SVG attribute \"".concat(attributeName, "\" is missing.");
                        }
                    }
                    var optionalAttributes = {
                        transform: svgElement.getAttribute("transform"),
                        x: svgElement.getAttribute("x"),
                        y: svgElement.getAttribute("y"),
                        fontFamily: (_c = svgElement.getAttribute("font-family")) !== null && _c !== void 0 ? _c : style.family,
                        fontStyle: (_d = svgElement.getAttribute("font-style")) !== null && _d !== void 0 ? _d : style.style,
                        fontWeight: (_e = svgElement.getAttribute("font-weight")) !== null && _e !== void 0 ? _e : style.weight,
                        fontSize: (_f = svgElement.getAttribute("font-size")) !== null && _f !== void 0 ? _f : style.size,
                        color: (_h = (_g = svgElement.getAttribute("fill")) !== null && _g !== void 0 ? _g : style.fill) !== null && _h !== void 0 ? _h : style.stroke,
                        strokeWidth: (_j = svgElement.getAttribute("stroke-width")) !== null && _j !== void 0 ? _j : style.strokeWidth
                    };
                    var font = structuredClone(Font_1["default"].DEFAULT);
                    if (optionalAttributes.fontFamily) {
                        font.family = optionalAttributes.fontFamily;
                    }
                    if (optionalAttributes.fontStyle) {
                        font.style = optionalAttributes.fontStyle;
                    }
                    if (optionalAttributes.fontWeight) {
                        font.weight = optionalAttributes.fontWeight;
                    }
                    if (optionalAttributes.fontSize) {
                        if (typeof optionalAttributes.fontSize == "number") {
                            font.size = optionalAttributes.fontSize;
                        }
                        else {
                            font.size = (0, Font_1.parseFontSize)(optionalAttributes.fontSize);
                        }
                    }
                    var color = structuredClone(Color_1.BLACK);
                    if (optionalAttributes.color) {
                        if (typeof optionalAttributes.color == "object") {
                            color = optionalAttributes.color;
                        }
                        else {
                            color = (0, Color_1.fromCssString)(optionalAttributes.color);
                        }
                    }
                    var x = 0;
                    var y = 0;
                    if (optionalAttributes.transform !== null) {
                        var transformRegexMatch = optionalAttributes.transform.match(transformRegex);
                        if (transformRegexMatch !== null) {
                            x = Number.parseFloat(transformRegexMatch[1]);
                            y = Number.parseFloat(transformRegexMatch[2]);
                        }
                    }
                    if (optionalAttributes.x !== null) {
                        x = Number.parseFloat(optionalAttributes.x);
                    }
                    if (optionalAttributes.y !== null) {
                        y = Number.parseFloat(optionalAttributes.y);
                    }
                    var strokeWidth = Constants_1.DEFAULT_STROKE_WIDTH;
                    if (optionalAttributes.strokeWidth) {
                        if (typeof optionalAttributes.strokeWidth == "number") {
                            strokeWidth = optionalAttributes.strokeWidth;
                        }
                        else {
                            strokeWidth = Number.parseFloat(optionalAttributes.strokeWidth);
                        }
                    }
                    if (Nucleotide_1.Nucleotide.isSymbol(textContent)) {
                        var singularNucleotideProps = {
                            x: x,
                            y: y,
                            symbol: textContent,
                            color: color,
                            strokeWidth: strokeWidth,
                            font: font
                        };
                        cache.singularRnaMoleculeProps.nucleotideProps[cache.nucleotideCount] = singularNucleotideProps;
                        cache.nucleotideCount++;
                    }
                    else {
                        var width = svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_WIDTH);
                        if (width === null) {
                            throw "Required SVG property \"".concat(SVG_PROPERTY_RECTANGLE_WIDTH, "\" is missing.");
                        }
                        var height = svgElement.getAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT);
                        if (height === null) {
                            throw "Required SVG property \"".concat(SVG_PROPERTY_RECTANGLE_HEIGHT, "\" is missing.");
                        }
                        cache.labelContentsPerRnaComplex.push({
                            labelContent: {
                                x: x,
                                y: y,
                                content: textContent,
                                font: font,
                                color: color,
                                strokeWidth: strokeWidth
                            },
                            rectangle: {
                                width: Number.parseFloat(width),
                                height: Number.parseFloat(height)
                            }
                        });
                    }
                    break;
                }
                case "line": {
                    var requiredAttributes = {
                        x1: svgElement.getAttribute("x1"),
                        y1: svgElement.getAttribute("y1"),
                        x2: svgElement.getAttribute("x2"),
                        y2: svgElement.getAttribute("y2")
                    };
                    for (var _6 = 0, _7 = Object.entries(requiredAttributes); _6 < _7.length; _6++) {
                        var _8 = _7[_6], attributeName = _8[0], attributeValue = _8[1];
                        if (attributeValue === null) {
                            throw "Required SVG property ".concat(attributeName, " is missing.");
                        }
                    }
                    var optionalAttributes = {
                        color: svgElement.getAttribute("stroke"),
                        strokeWidth: svgElement.getAttribute("stroke-width")
                    };
                    var color = Color_1.BLACK;
                    if (optionalAttributes.color !== null) {
                        color = (0, Color_1.fromCssString)(optionalAttributes.color);
                    }
                    var strokeWidth = Constants_1.DEFAULT_STROKE_WIDTH;
                    if (optionalAttributes.strokeWidth !== null) {
                        strokeWidth = Number.parseFloat(optionalAttributes.strokeWidth);
                    }
                    var v0 = {
                        x: Number.parseFloat(requiredAttributes.x1),
                        y: Number.parseFloat(requiredAttributes.y1)
                    };
                    var v1 = {
                        x: Number.parseFloat(requiredAttributes.x2),
                        y: Number.parseFloat(requiredAttributes.y2)
                    };
                    // Because there is no context for SVG "line" elements (whether they are base pairs or label lines), I have no choice but to treat them as both.
                    cache.basePairLinesPerRnaComplex.push({
                        v0: v0,
                        v1: v1,
                        basePairType: BasePair_1["default"].Type.CANONICAL,
                        color: color,
                        strokeWidth: strokeWidth
                    });
                    cache.labelLinesPerRnaComplex.push({
                        v0: v0,
                        v1: v1,
                        color: color,
                        strokeWidth: strokeWidth
                    });
                    break;
                }
            }
            break;
        }
        default: {
            throw "Unhandled switch case.";
        }
    }
    var children = Array.from(svgElement.children);
    // Replace null with undefined.
    cache.parentSvgXrnaDataType = dataXrnaType !== null && dataXrnaType !== void 0 ? dataXrnaType : undefined;
    for (var _9 = 0, children_1 = children; _9 < children_1.length; _9++) {
        var childElement = children_1[_9];
        parseSvgElement(childElement, cache, svgFileType);
    }
    switch (dataXrnaType) {
        case SvgPropertyXrnaType.RNA_COMPLEX: {
            var singularRnaComplexProps = cache.singularRnaComplexProps;
            var temporaryBasePairsPerRnaComplex = cache.temporaryBasePairsPerRnaComplex;
            for (var _10 = 0, temporaryBasePairsPerRnaComplex_1 = temporaryBasePairsPerRnaComplex; _10 < temporaryBasePairsPerRnaComplex_1.length; _10++) {
                var temporaryBasePair = temporaryBasePairsPerRnaComplex_1[_10];
                var rnaMoleculeName0 = temporaryBasePair.rnaMoleculeName0, formattedNucleotideIndex0 = temporaryBasePair.formattedNucleotideIndex0, rnaMoleculeName1 = temporaryBasePair.rnaMoleculeName1, formattedNucleotideIndex1 = temporaryBasePair.formattedNucleotideIndex1, basePairType = temporaryBasePair.basePairType, color = temporaryBasePair.color, strokeWidth = temporaryBasePair.strokeWidth;
                if (!(rnaMoleculeName0 in singularRnaComplexProps.rnaMoleculeProps)) {
                    throw "Missing RNA molecule with the name \"".concat(rnaMoleculeName0, "\"");
                }
                var singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
                var nucleotideIndex0 = formattedNucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex;
                if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
                    throw "Missing nucleotide with the formatted index #".concat(formattedNucleotideIndex0);
                }
                if (!(rnaMoleculeName1 in singularRnaComplexProps.rnaMoleculeProps)) {
                    throw "Missing RNA molecule with the name \"".concat(rnaMoleculeName1, "\"");
                }
                var singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
                var nucleotideIndex1 = formattedNucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex;
                if (!(nucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
                    throw "Missing nucleotide with the formatted index #".concat(formattedNucleotideIndex1);
                }
                (0, RnaComplex_1.insertBasePair)(singularRnaComplexProps, rnaMoleculeName0, nucleotideIndex0, rnaMoleculeName1, nucleotideIndex1, RnaComplex_1.DuplicateBasePairKeysHandler.DO_NOTHING, {
                    basePairType: basePairType,
                    strokeWidth: strokeWidth,
                    color: color
                });
            }
            break;
        }
    }
}
function parseStyle(styleText) {
    var style = {};
    var styleAttributes = styleText.split(";");
    styleAttributes = styleAttributes.filter(
    // Eliminate blank lines.
    function (styleAttribute) { return !styleAttribute.match(/^\s*$/); });
    for (var _i = 0, styleAttributes_1 = styleAttributes; _i < styleAttributes_1.length; _i++) {
        var styleAttribute = styleAttributes_1[_i];
        var indicesOfColon = __spreadArray([], styleAttribute.matchAll(/:/g), true).map(function (match) { return match.index; });
        switch (indicesOfColon.length) {
            case 1: {
                var indexOfColon = indicesOfColon[0];
                var label = styleAttribute.substring(0, indexOfColon).trim();
                var datum = styleAttribute.substring(indexOfColon + 1).trim();
                switch (label) {
                    case "fill": {
                        style.fill = (0, Color_1.fromCssString)(datum);
                        break;
                    }
                    case "stroke": {
                        style.stroke = (0, Color_1.fromCssString)(datum);
                        break;
                    }
                    case "stroke-width": {
                        style.strokeWidth = Number.parseFloat(datum);
                        break;
                    }
                    case "font-size": {
                        style.size = datum;
                        break;
                    }
                    case "font-weight": {
                        style.weight = datum;
                        break;
                    }
                    case "font-family": {
                        style.family = datum;
                        break;
                    }
                }
                break;
            }
            default: {
                throw "Multiple colons found within style string.";
            }
        }
    }
    return style;
}
function svgInputFileHandler(inputFileContent) {
    var _a, _b;
    var cDataMatch = inputFileContent.match(/<!\[CDATA\[(.*)\]\]>/ms);
    styles = {
        defaults: {}
    };
    if (cDataMatch) {
        var lines = cDataMatch[1].split("\n");
        // Remove blank lines.
        lines = lines.filter(function (line) { return (!line.match(/^\s*$/)); });
        for (var _i = 0, lines_1 = lines; _i < lines_1.length; _i++) {
            var line = lines_1[_i];
            var lineMatch = line.match(/^\s*([\w-.]+)\s*\{(.*)\}\s*$/);
            if (!lineMatch) {
                continue;
            }
            var label = lineMatch[1];
            var indicesOfPeriod = __spreadArray([], label.matchAll(/\./g), true).map(function (match) { return match.index; });
            var type = void 0;
            var _class = void 0;
            switch (indicesOfPeriod.length) {
                case 0: {
                    type = label;
                    _class = "";
                    break;
                }
                case 1: {
                    var indexOfPeriod = indicesOfPeriod[0];
                    type = label.substring(0, indexOfPeriod);
                    _class = label.substring(indexOfPeriod + 1);
                    break;
                }
                default: {
                    continue;
                }
            }
            var style = parseStyle(lineMatch[2]);
            switch (type) {
                case "": {
                    styles.defaults[_class] = style;
                    break;
                }
                default: {
                    if (!(type in styles)) {
                        styles[type] = {};
                    }
                    var stylesPerType = styles[type];
                    switch (_class) {
                        case "": {
                            stylesPerType["default"] = style;
                            break;
                        }
                        default: {
                            stylesPerType[_class] = style;
                            break;
                        }
                    }
                    break;
                }
            }
        }
    }
    var rnaComplexProps = [];
    var cache = {
        rnaComplexProps: rnaComplexProps,
        graphicalAdjustments: {},
        basePairLinesPerRnaComplex: [],
        basePairCentersPerRnaComplex: [],
        rnaMoleculeCount: 0,
        nucleotideCount: 0,
        labelLines: {},
        labelContents: {},
        transform: (0, AffineMatrix_1.identity)(),
        rnaComplexPropsByName: {},
        temporaryBasePairsPerRnaComplexName: {},
        temporaryLabelData: {}
    };
    var svgFileType = SvgFileType.UNFORMATTED;
    if (/data-xrna_type/.test(inputFileContent)) {
        svgFileType = SvgFileType.XRNA_JS;
    }
    else if (/id\s*=\s*"Letters"/.test(inputFileContent)) {
        svgFileType = SvgFileType.XRNA_GT;
        var singularRnaComplexProps = {
            name: "RNA complex",
            rnaMoleculeProps: {},
            basePairs: {}
        };
        var rnaComplexIndex = rnaComplexProps.length;
        rnaComplexProps.push(singularRnaComplexProps);
        cache.singularRnaComplexProps = singularRnaComplexProps;
        var labelLinesPerRnaComplex = [];
        cache.labelLinesPerRnaComplex = labelLinesPerRnaComplex;
        cache.labelLines[rnaComplexIndex] = labelLinesPerRnaComplex;
        var labelContentsPerRnaComplex = [];
        cache.labelContentsPerRnaComplex = labelContentsPerRnaComplex;
        cache.labelContents[rnaComplexIndex] = labelContentsPerRnaComplex;
        cache.graphicalAdjustments[rnaComplexIndex] = {};
        cache.graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustments[0];
    }
    else {
        svgFileType = SvgFileType.UNFORMATTED;
        var singularRnaComplexProps = {
            name: "RNA complex",
            rnaMoleculeProps: {},
            basePairs: {}
        };
        rnaComplexProps.push(singularRnaComplexProps);
        cache.singularRnaComplexProps = singularRnaComplexProps;
        var DEFAULT_RNA_COMPLEX_INDEX = 0;
        cache.graphicalAdjustments[DEFAULT_RNA_COMPLEX_INDEX] = {};
        cache.labelLines[DEFAULT_RNA_COMPLEX_INDEX] = [];
        cache.labelContents[DEFAULT_RNA_COMPLEX_INDEX] = [];
        cache.graphicalAdjustmentsPerRnaComplex = cache.graphicalAdjustments[DEFAULT_RNA_COMPLEX_INDEX];
        var singularRnaMoleculeProps = {
            firstNucleotideIndex: 1,
            nucleotideProps: {}
        };
        var rnaMoleculeName = "RNA molecule";
        cache.currentRnaMoleculeName = rnaMoleculeName;
        singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName] = singularRnaMoleculeProps;
        cache.singularRnaMoleculeProps = singularRnaMoleculeProps;
        cache.graphicalAdjustmentsPerRnaComplex[rnaMoleculeName] = {};
        cache.graphicalAdjustmentsPerRnaMolecule = cache.graphicalAdjustmentsPerRnaComplex[rnaMoleculeName];
        cache.labelLinesPerRnaComplex = [];
        cache.labelContentsPerRnaComplex = [];
    }
    if ([
        SvgFileType.UNFORMATTED,
        SvgFileType.XRNA_GT
    ].includes(svgFileType)) {
        var testSpace = document.getElementById(App_1.TEST_SPACE_ID);
        testSpace.innerHTML = inputFileContent;
        for (var _c = 0, _d = Array.from(testSpace.querySelectorAll("text")); _c < _d.length; _c++) {
            var textElement = _d[_c];
            var rectangle = textElement.getBBox();
            textElement.setAttribute(SVG_PROPERTY_RECTANGLE_WIDTH, "".concat(rectangle.width));
            textElement.setAttribute(SVG_PROPERTY_RECTANGLE_HEIGHT, "".concat(rectangle.height));
        }
        inputFileContent = testSpace.innerHTML;
        testSpace.innerHTML = "";
    }
    var parsedElements = new DOMParser().parseFromString(inputFileContent, "image/svg+xml");
    var topLevelSvgElements = Array.from(parsedElements.children);
    var svgElement = parsedElements.querySelector("svg");
    if (!svgElement) {
        throw "No svg element was found within the input file.";
    }
    var svgStyle = parseStyle(svgElement.style.cssText);
    styles.root = svgStyle;
    for (var _e = 0, topLevelSvgElements_1 = topLevelSvgElements; _e < topLevelSvgElements_1.length; _e++) {
        var topLevelSvgElement = topLevelSvgElements_1[_e];
        parseSvgElement(topLevelSvgElement, cache, svgFileType);
    }
    function deleteEmptyRnaMolecules() {
        for (var _i = 0, _a = Object.values(rnaComplexProps); _i < _a.length; _i++) {
            var singularRnaComplexProps = _a[_i];
            var rnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps;
            for (var _b = 0, _c = Object.entries(rnaMoleculeProps); _b < _c.length; _b++) {
                var _d = _c[_b], rnaMoleculeName = _d[0], singularRnaMoleculeProps = _d[1];
                if (Object.values(singularRnaMoleculeProps.nucleotideProps).length === 0) {
                    delete rnaMoleculeProps[rnaMoleculeName];
                }
            }
        }
    }
    switch (svgFileType) {
        case SvgFileType.XRNA_JS: {
            var relativeCoordinatesFlag = (_a = cache.relativeCoordinatesFlag) !== null && _a !== void 0 ? _a : exports.SVG_PROPERTY_XRNA_RELATIVE_COORDINATES_FLAG_DEFAULT;
            for (var _f = 0, _g = Object.keys(cache.temporaryBasePairsPerRnaComplexName); _f < _g.length; _f++) {
                var rnaComplexName = _g[_f];
                if (!(rnaComplexName in cache.temporaryBasePairsPerRnaComplexName)) {
                    throw "A base pair within the input file referenced RNA complex \"".concat(rnaComplexName, ",\" which was not present within the input file.");
                }
                var singularRnaComplexProps = cache.rnaComplexPropsByName[rnaComplexName];
                var temporaryBasePairs = cache.temporaryBasePairsPerRnaComplexName[rnaComplexName];
                for (var _h = 0, temporaryBasePairs_1 = temporaryBasePairs; _h < temporaryBasePairs_1.length; _h++) {
                    var _j = temporaryBasePairs_1[_h], rnaMoleculeName0 = _j.rnaMoleculeName0, rnaMoleculeName1 = _j.rnaMoleculeName1, formattedNucleotideIndex0 = _j.formattedNucleotideIndex0, formattedNucleotideIndex1 = _j.formattedNucleotideIndex1, basePairType = _j.basePairType, strokeWidth = _j.strokeWidth, color = _j.color;
                    if (!(rnaMoleculeName0 in singularRnaComplexProps.rnaMoleculeProps)) {
                        throw "A base pair within the input file referenced RNA molecule \"".concat(rnaMoleculeName0, ",\" which was not present within the RNA complex.");
                    }
                    var singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
                    if (!(rnaMoleculeName1 in singularRnaComplexProps.rnaMoleculeProps)) {
                        throw "A base pair within the input file referenced RNA molecule \"".concat(rnaMoleculeName1, ",\" which was not present within the RNA complex.");
                    }
                    var singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
                    (0, RnaComplex_1.insertBasePair)(singularRnaComplexProps, rnaMoleculeName0, formattedNucleotideIndex0 - singularRnaMoleculeProps0.firstNucleotideIndex, rnaMoleculeName1, formattedNucleotideIndex1 - singularRnaMoleculeProps1.firstNucleotideIndex, RnaComplex_1.DuplicateBasePairKeysHandler.DO_NOTHING, {
                        basePairType: basePairType,
                        strokeWidth: strokeWidth,
                        color: color
                    });
                }
            }
            for (var _k = 0, _l = Object.keys(cache.temporaryLabelData); _k < _l.length; _k++) {
                var rnaComplexName = _l[_k];
                var temporaryLabelDataPerRnaComplexName = cache.temporaryLabelData[rnaComplexName];
                if (!(rnaComplexName in cache.rnaComplexPropsByName)) {
                    throw "RNA-complex name \"".concat(rnaComplexName, "\" was referenced by a label, but was not present in the input file.");
                }
                var singularRnaComplexProps = cache.rnaComplexPropsByName[rnaComplexName];
                for (var _m = 0, _o = Object.keys(temporaryLabelDataPerRnaComplexName); _m < _o.length; _m++) {
                    var rnaMoleculeName = _o[_m];
                    var temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName = temporaryLabelDataPerRnaComplexName[rnaMoleculeName];
                    if (!(rnaMoleculeName in singularRnaComplexProps.rnaMoleculeProps)) {
                        throw "RNA-molecule name \"".concat(rnaMoleculeName, "\" was referenced by a label, but was not present in the input file.");
                    }
                    var singularRnaMoleculeProps = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName];
                    for (var _p = 0, _q = Object.keys(temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName); _p < _q.length; _p++) {
                        var formattedNucleotideIndexAsString = _q[_p];
                        var formattedNucleotideIndex = Number.parseInt(formattedNucleotideIndexAsString);
                        var _r = temporaryLabelDataPerRnaComplexNamePerRnaMoleculeName[formattedNucleotideIndex], labelLineProps = _r.labelLineProps, labelContentProps = _r.labelContentProps;
                        var nucleotideIndex = formattedNucleotideIndex - singularRnaMoleculeProps.firstNucleotideIndex;
                        var singularNucleotideProps = singularRnaMoleculeProps.nucleotideProps[nucleotideIndex];
                        if (labelLineProps !== undefined) {
                            if (!relativeCoordinatesFlag) {
                                for (var _s = 0, _t = labelLineProps.points; _s < _t.length; _s++) {
                                    var point = _t[_s];
                                    point.x -= singularNucleotideProps.x;
                                    point.y -= singularNucleotideProps.y;
                                }
                            }
                            singularNucleotideProps.labelLineProps = labelLineProps;
                        }
                        if (labelContentProps !== undefined) {
                            singularNucleotideProps.labelContentProps = labelContentProps;
                            labelContentProps.x -= singularNucleotideProps.x;
                            labelContentProps.y -= singularNucleotideProps.y;
                        }
                    }
                }
            }
            break;
        }
        case SvgFileType.XRNA_GT: {
            deleteEmptyRnaMolecules();
            for (var _u = 0, _v = Object.entries(cache.labelContents); _u < _v.length; _u++) {
                var _w = _v[_u], rnaComplexIndexAsString = _w[0], labelContentsPerRnaComplex = _w[1];
                for (var _x = 0, labelContentsPerRnaComplex_1 = labelContentsPerRnaComplex; _x < labelContentsPerRnaComplex_1.length; _x++) {
                    var _y = labelContentsPerRnaComplex_1[_x], labelContent = _y.labelContent, rectangle = _y.rectangle;
                    labelContent.x -= rectangle.width * 0.125;
                    labelContent.y += rectangle.height * 0.25;
                }
            }
            (0, ParseGraphicalData_1.parseGraphicalData)(rnaComplexProps, {
                0: cache.basePairLinesPerRnaComplex
            }, {
                0: cache.basePairCentersPerRnaComplex
            }, cache.graphicalAdjustments, cache.labelLines, cache.labelContents);
            break;
        }
        case SvgFileType.UNFORMATTED: {
            deleteEmptyRnaMolecules();
            (0, ParseGraphicalData_1.parseGraphicalData)(rnaComplexProps, {
                0: cache.basePairLinesPerRnaComplex
            }, {
                0: cache.basePairCentersPerRnaComplex
            }, cache.graphicalAdjustments, cache.labelLines, cache.labelContents);
            break;
        }
        default: {
            throw "Unhandled switch case.";
        }
    }
    return {
        complexDocumentName: (_b = cache.complexDocumentName) !== null && _b !== void 0 ? _b : "Scene",
        rnaComplexProps: rnaComplexProps
    };
}
exports.svgInputFileHandler = svgInputFileHandler;
