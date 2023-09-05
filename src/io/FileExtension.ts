export enum FileExtension {
  XRNA = "xrna",
  XML = "xml",
  JSON = "json",
  // TR = "tr",
  // CSV = "csv",
  // JPG = "jpg",
  // BPSEQ = "bpseq",
  // SVG = "svg",
}

export const fileExtensionDescriptions : Record<FileExtension, string> = {
  [FileExtension.XRNA] : "the native input-file format of XRNA (an extension of .xml)",
  [FileExtension.XML] : "a data-file format native to the internet. Highly similar to .xrna",
  [FileExtension.JSON] : "a general-purpose data-file format native to the internet. Logically equivalent to .xrna"
};

export const fileExtensions = Object.values(FileExtension);

export default FileExtension;