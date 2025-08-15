export enum FileExtension {
  XML = "xml",
  JSON = "json",
  SVG = "svg",
  XRNA = "xrna",
  CSV = "csv",
  TR = "tr",
  BPSEQ = "bpseq",
  STR = "str",
}

export const fileExtensionDescriptions : Record<FileExtension, string> = {
  [FileExtension.XRNA] : "the native input-file format of XRNA (an extension of .xml)",
  [FileExtension.XML] : "a data-file format native to the internet. Highly similar to .xrna",
  [FileExtension.JSON] : "a general-purpose data-file format native to the internet. Logically equivalent to .xrna",
  [FileExtension.CSV] : "a comma-separated-values file. Logically equivalent to .xrna. Intended for use with RiboVision",
  [FileExtension.BPSEQ] : "a simplified, linear representation of the nucleotide sequence of the scene.",
  [FileExtension.TR] : "an XML-like format for R2DT. Contains nucleotides with 2D coordinates.",
  [FileExtension.SVG] : "an image-file format. Can be converted to other image-file formats (e.g. .jpg) using external tools",
  [FileExtension.STR] : "an image-file format containing nucleotide sequences and base pairs"
};

export const fileExtensions = Object.values(FileExtension);

export default FileExtension;