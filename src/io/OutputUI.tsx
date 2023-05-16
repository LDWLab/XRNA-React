import { RnaComplexProps } from "../App";
import { jsonFileWriter } from "./JsonFileWriter";
import { xrnaFileWriter } from "./XrnaFileWriter";

export enum OutputFileExtension {
  XRNA = "xrna",
  // TR = "tr",
  // CSV = "csv",
  // JPG = "jpg",
  // BPSEQ = "bpseq",
  JSON = "json",
  // SVG = "svg"
}

export const outputFileExtensions = Object.values(OutputFileExtension);

export type OutputFileWriter = (
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) => string;

export const outputFileWritersMap : Record<OutputFileExtension, OutputFileWriter> = {
  [OutputFileExtension.XRNA] : xrnaFileWriter,
  [OutputFileExtension.JSON] : jsonFileWriter
};