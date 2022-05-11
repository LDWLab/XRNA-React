interface FileWriter {
    () : string;
  }

const outputFileWriters : Record<string, FileWriter> = {
  "xrna" : () => "This is an XRNA file.",
  "svg" : () => "This is an SVG file.",
  "tr" : () => "This is a TR file.",
  "csv" : () => "This is a CSV file.",
  "bpseq" : () => "This is a BPSeq file.",
  "jpg" : () => "This is a JPG file.",
  "json" : () => "This is a JSON file."
};

export type { FileWriter };
export default outputFileWriters;