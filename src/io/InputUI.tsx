import { RnaComplex } from "../components/app_specific/RnaComplex";
import FileExtension from "./FileExtension";
import { xrnaInputFileHandler } from "./XrnaInputFileHandler";
import { jsonInputFileHandler } from "./JsonInputFileHandler";
import { strInputFileHandler } from "./StrInputFileHandler";
import { svgInputFileHandler } from "./SvgInputFileHandler";

export type ParsedInputFile = {
  complexDocumentName : string,
  rnaComplexProps : Array<RnaComplex.ExternalProps>
};

export type InputFileReader = (inputFileContent : string) => ParsedInputFile;

export type InputFileExtension = Extract<FileExtension, FileExtension.XRNA | FileExtension.XML | FileExtension.JSON | FileExtension.STR | FileExtension.SVG>;

export const InputFileExtension = {
  [FileExtension.XRNA] : FileExtension.XRNA,
  [FileExtension.XML] : FileExtension.XML,
  [FileExtension.JSON] : FileExtension.JSON,
  [FileExtension.STR] : FileExtension.STR,
  [FileExtension.SVG] : FileExtension.SVG
} as const;

export const inputFileExtensions = Object.values(InputFileExtension);

export const inputFileReadersRecord : Record<InputFileExtension, InputFileReader> = {
  [InputFileExtension.xrna] : xrnaInputFileHandler,
  [InputFileExtension.xml] : xrnaInputFileHandler,
  [InputFileExtension.json] : jsonInputFileHandler,
  [InputFileExtension.str] : strInputFileHandler,
  [InputFileExtension.svg] : svgInputFileHandler
}