import { RnaComplex } from "../components/app_specific/RnaComplex";
import FileExtension from "./FileExtension";
import { xrnaInputFileHandler } from "./XrnaInputFileHandler";
import { jsonInputFileHandler as r2dtLegacyJsonInputFileHandler } from "./JsonInputFileHandler";
import { jsonInputFileHandler } from "./JsonInputFileHandler_relative_coordinates";
import { strInputFileHandler } from "./StrInputFileHandler";
import { dotBracketInputFileHandler } from "./DotBracketInputFileHandler";
import { svgInputFileHandler } from "./SvgInputFileHandler";

export type ParsedInputFile = {
  complexDocumentName : string,
  rnaComplexProps : Array<RnaComplex.ExternalProps>
};

export type InputFileReader = (inputFileContent : string) => ParsedInputFile;

export type InputFileExtension = Extract<FileExtension, FileExtension.XRNA | FileExtension.XML | FileExtension.JSON | FileExtension.STR | FileExtension.SVG | FileExtension.DOT_BRACKET>;

export const InputFileExtension = {
  [FileExtension.XRNA] : FileExtension.XRNA,
  [FileExtension.XML] : FileExtension.XML,
  [FileExtension.JSON] : FileExtension.JSON,
  [FileExtension.STR] : FileExtension.STR,
  [FileExtension.SVG] : FileExtension.SVG,
  [FileExtension.DOT_BRACKET] : FileExtension.DOT_BRACKET
} as const;

export const inputFileExtensions = Object.values(InputFileExtension);

export const inputFileReadersRecord : Record<InputFileExtension, InputFileReader> = {
  [InputFileExtension.xrna] : xrnaInputFileHandler,
  [InputFileExtension.xml] : xrnaInputFileHandler,
  [InputFileExtension.json] : jsonInputFileHandler,
  [InputFileExtension.str] : strInputFileHandler,
  [InputFileExtension.svg] : svgInputFileHandler,
  [InputFileExtension.dbn] : dotBracketInputFileHandler
}

export const r2dtLegacyInputFileReadersRecord = {
  ...inputFileReadersRecord,
  [InputFileExtension.json] : r2dtLegacyJsonInputFileHandler
};

export const defaultInvertYAxisFlagRecord : Record<InputFileExtension, boolean> = {
  [InputFileExtension.xrna] : false,
  [InputFileExtension.xml] : false,
  [InputFileExtension.json] : true,
  [InputFileExtension.str] : false,
  [InputFileExtension.svg] : false,
  [InputFileExtension.dbn] : false,
};