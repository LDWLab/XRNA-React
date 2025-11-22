"use strict";
var _a;
exports.__esModule = true;
exports.fileExtensions = exports.fileExtensionDescriptions = exports.FileExtension = void 0;
var FileExtension;
(function (FileExtension) {
    FileExtension["XML"] = "xml";
    FileExtension["JSON"] = "json";
    FileExtension["SVG"] = "svg";
    FileExtension["XRNA"] = "xrna";
    FileExtension["CSV"] = "csv";
    FileExtension["TR"] = "tr";
    FileExtension["BPSEQ"] = "bpseq";
    FileExtension["STR"] = "str";
    FileExtension["DOT_BRACKET"] = "dbn";
    FileExtension["FASTA"] = "fasta";
    FileExtension["FAS"] = "fas";
    FileExtension["FA"] = "fa";
})(FileExtension = exports.FileExtension || (exports.FileExtension = {}));
exports.fileExtensionDescriptions = (_a = {},
    _a[FileExtension.XRNA] = "the native input-file format of XRNA (an extension of .xml)",
    _a[FileExtension.XML] = "a data-file format native to the internet. Highly similar to .xrna",
    _a[FileExtension.JSON] = "a general-purpose data-file format native to the internet. Logically equivalent to .xrna",
    _a[FileExtension.CSV] = "a comma-separated-values file. Logically equivalent to .xrna. Intended for use with RiboVision",
    _a[FileExtension.BPSEQ] = "a simplified, linear representation of the nucleotide sequence of the scene.",
    _a[FileExtension.TR] = "an XML-like format for R2DT. Contains nucleotides with 2D coordinates.",
    _a[FileExtension.SVG] = "an image-file format. Can be converted to other image-file formats (e.g. .jpg) using external tools",
    _a[FileExtension.STR] = "an image-file format containing nucleotide sequences and base pairs",
    _a[FileExtension.DOT_BRACKET] = "a dot-bracket notation file describing nucleotide sequence and secondary structure",
    _a[FileExtension.FASTA] = "a FASTA sequence file containing nucleotide sequences without coordinates",
    _a[FileExtension.FAS] = "a FASTA sequence file (alias .fasta)",
    _a[FileExtension.FA] = "a FASTA sequence file (alias .fasta)",
    _a);
exports.fileExtensions = Object.values(FileExtension);
exports["default"] = FileExtension;
