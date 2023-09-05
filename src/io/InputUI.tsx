import { RnaComplex } from "../components/app_specific/RnaComplex";
import FileExtension from "./FileExtension";
import { jsonInputFileHandler } from "./JsonInputFileHandler";
import { xrnaInputFileHandler } from "./XrnaInputFileHandler";

export type ParsedInputFile = {
  complexDocumentName : string,
  rnaComplexProps : Array<RnaComplex.ExternalProps>
};

export type InputFileReader = (inputFileContent : string) => ParsedInputFile;

export type InputFileExtension = Extract<FileExtension, FileExtension.XRNA | FileExtension.XML | FileExtension.JSON>;

export const InputFileExtension = {
  [FileExtension.XRNA] : FileExtension.XRNA,
  [FileExtension.XML] : FileExtension.XML,
  [FileExtension.JSON] : FileExtension.JSON
} as const;

export const inputFileExtensions = Object.values(InputFileExtension);

export const inputFileReadersRecord : Record<InputFileExtension, InputFileReader> = {
  [InputFileExtension.xrna] : xrnaInputFileHandler,
  [InputFileExtension.xml] : xrnaInputFileHandler,
  [InputFileExtension.json] : jsonInputFileHandler
}