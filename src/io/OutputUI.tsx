import { RnaComplexProps } from "../App";
import FileExtension from "./FileExtension";
import { jsonFileWriter as r2dtLegacyJsonFileWriter } from "./JsonFileWriter";
import { jsonFileWriter } from "./JsonFileWriter_relative_coordinates";
import { xrnaFileWriter } from "./XrnaFileWriter";
import { csvFileWriter } from "./CsvFileWriter";
import { bpseqFileWriter } from "./BpseqFileWriter";
import { trFileWriter } from "./TrFileWriter";
import { svgFileWriter } from "./SvgFileWriter";

// Note that these values are arbitrary, but they come from the XRNA Java program.
export const OUTPUT_BOUNDS = {
  x : {
    max : 576,
    min : 36
  },
  y : {
    max : 756,
    min : 36
  }
};
export const OUTPUT_MIDPOINT = {
  x : (OUTPUT_BOUNDS.x.min + OUTPUT_BOUNDS.x.max) * 0.5,
  y : (OUTPUT_BOUNDS.y.min + OUTPUT_BOUNDS.y.max) * 0.5
};

export type OutputFileExtension = Extract<FileExtension, FileExtension.XRNA | FileExtension.JSON | FileExtension.CSV | FileExtension.BPSEQ | FileExtension.TR | FileExtension.SVG>;

export const OutputFileExtension = {
  [FileExtension.XRNA] : FileExtension.XRNA,
  [FileExtension.JSON] : FileExtension.JSON,
  [FileExtension.CSV] : FileExtension.CSV,
  [FileExtension.BPSEQ] : FileExtension.BPSEQ,
  [FileExtension.TR] : FileExtension.TR,
  [FileExtension.SVG] : FileExtension.SVG
} as const;

export const outputFileExtensions = Object.values(OutputFileExtension);

export type OutputFileWriter = (
  rnaComplexProps : RnaComplexProps,
  complexDocumentName : string
) => string;

export const outputFileWritersMap : Record<OutputFileExtension, OutputFileWriter> = {
  [OutputFileExtension.xrna] : xrnaFileWriter,
  [OutputFileExtension.json] : jsonFileWriter,
  [OutputFileExtension.csv] : csvFileWriter,
  [OutputFileExtension.bpseq] : bpseqFileWriter,
  [OutputFileExtension.tr] : trFileWriter,
  [OutputFileExtension.svg] : svgFileWriter
};

export const r2dtLegacyOutputFileWritersMap = {
  ...outputFileWritersMap,
  [OutputFileExtension.json] : r2dtLegacyJsonFileWriter
};