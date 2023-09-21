import { RnaComplexProps } from "../App";
import { csvFileWriter } from "./CsvFileWriter";
import FileExtension from "./FileExtension";
import { jsonFileWriter } from "./JsonFileWriter";
import { xrnaFileWriter } from "./XrnaFileWriter";

export type OutputFileExtension = Extract<FileExtension, FileExtension.XRNA | FileExtension.JSON | FileExtension.CSV>;

export const OutputFileExtension = {
  [FileExtension.XRNA] : FileExtension.XRNA,
  [FileExtension.JSON] : FileExtension.JSON,
  [FileExtension.CSV] : FileExtension.CSV
} as const;

export const outputFileExtensions = Object.values(OutputFileExtension);

export type OutputFileWriter = (
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) => string;

export const outputFileWritersMap : Record<OutputFileExtension, OutputFileWriter> = {
  [OutputFileExtension.xrna] : xrnaFileWriter,
  [OutputFileExtension.json] : jsonFileWriter,
  [OutputFileExtension.csv] : csvFileWriter
};