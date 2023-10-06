export enum FileExtension {
  XRNA = "xrna",
  XML = "xml",
  JSON = "json",
  TR = "tr",
  CSV = "csv",
  BPSEQ = "bpseq",
  SVG = "svg",
  STR = "str",
}

export const fileExtensionDescriptions : Record<FileExtension, string> = {
  [FileExtension.XRNA] : "the native input-file format of XRNA (an extension of .xml)",
  [FileExtension.XML] : "a data-file format native to the internet. Highly similar to .xrna",
  [FileExtension.JSON] : "a general-purpose data-file format native to the internet. Logically equivalent to .xrna",
  [FileExtension.CSV] : "a comma-separated-values file. Logically equivalent to .xrna. Intended for use with RiboVision",
  [FileExtension.BPSEQ] : "a simplified representation of the nucleotides of the scene.",
  [FileExtension.TR] : "a XML-like format for R2DT. Contains nucleotides with 2D coordinates.",
  [FileExtension.SVG] : "an image-file format. Can be converted to other file formats using external tools",
  [FileExtension.STR] : "an image-file format containing nucleotide sequences and base pairs"
};

export const fileExtensions = Object.values(FileExtension);

export default FileExtension;