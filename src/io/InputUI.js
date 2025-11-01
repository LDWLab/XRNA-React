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
var _a, _b, _c, _d;
exports.__esModule = true;
exports.defaultInvertYAxisFlagRecord = exports.r2dtLegacyInputFileReadersRecord = exports.inputFileReadersRecord = exports.inputFileExtensions = exports.InputFileExtension = void 0;
var FileExtension_1 = require("./FileExtension");
var XrnaInputFileHandler_1 = require("./XrnaInputFileHandler");
var JsonInputFileHandler_1 = require("./JsonInputFileHandler");
var JsonInputFileHandler_relative_coordinates_1 = require("./JsonInputFileHandler_relative_coordinates");
var StrInputFileHandler_1 = require("./StrInputFileHandler");
var DotBracketInputFileHandler_1 = require("./DotBracketInputFileHandler");
var SvgInputFileHandler_1 = require("./SvgInputFileHandler");
exports.InputFileExtension = (_a = {},
    _a[FileExtension_1["default"].XRNA] = FileExtension_1["default"].XRNA,
    _a[FileExtension_1["default"].XML] = FileExtension_1["default"].XML,
    _a[FileExtension_1["default"].JSON] = FileExtension_1["default"].JSON,
    _a[FileExtension_1["default"].STR] = FileExtension_1["default"].STR,
    _a[FileExtension_1["default"].SVG] = FileExtension_1["default"].SVG,
    _a[FileExtension_1["default"].DOT_BRACKET] = FileExtension_1["default"].DOT_BRACKET,
    _a);
exports.inputFileExtensions = Object.values(exports.InputFileExtension);
exports.inputFileReadersRecord = (_b = {},
    _b[exports.InputFileExtension.xrna] = XrnaInputFileHandler_1.xrnaInputFileHandler,
    _b[exports.InputFileExtension.xml] = XrnaInputFileHandler_1.xrnaInputFileHandler,
    _b[exports.InputFileExtension.json] = JsonInputFileHandler_relative_coordinates_1.jsonInputFileHandler,
    _b[exports.InputFileExtension.str] = StrInputFileHandler_1.strInputFileHandler,
    _b[exports.InputFileExtension.svg] = SvgInputFileHandler_1.svgInputFileHandler,
    _b[exports.InputFileExtension.dbn] = DotBracketInputFileHandler_1.dotBracketInputFileHandler,
    _b);
exports.r2dtLegacyInputFileReadersRecord = __assign(__assign({}, exports.inputFileReadersRecord), (_c = {}, _c[exports.InputFileExtension.json] = JsonInputFileHandler_1.jsonInputFileHandler, _c));
exports.defaultInvertYAxisFlagRecord = (_d = {},
    _d[exports.InputFileExtension.xrna] = false,
    _d[exports.InputFileExtension.xml] = false,
    _d[exports.InputFileExtension.json] = true,
    _d[exports.InputFileExtension.str] = false,
    _d[exports.InputFileExtension.svg] = false,
    _d[exports.InputFileExtension.dbn] = false,
    _d);
