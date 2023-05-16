import { RnaComplex } from "../components/app_specific/RnaComplex";
import { jsonInputFileHandler } from "./JsonInputFileHandler";
import { xrnaInputFileHandler } from "./XrnaInputFileHandler";

export type ParsedInputFile = {
  complexDocumentName : string,
  rnaComplexProps : Array<RnaComplex.ExternalProps>
};

export type InputFileReader = (inputFileContent : string) => ParsedInputFile;

export enum InputFileExtension {
  XRNA = "xrna",
  XML = "xml",
  JSON = "json"
}

export const inputFileExtensions = Object.values(InputFileExtension);

export const inputFileReadersRecord : Record<InputFileExtension, InputFileReader> = {
  [InputFileExtension.XRNA] : xrnaInputFileHandler,
  [InputFileExtension.XML] : xrnaInputFileHandler,
  [InputFileExtension.JSON] : jsonInputFileHandler
}