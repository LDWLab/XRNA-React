import { Vector2D } from "./Vector2D";
import Color from './Color';
import Font from "./Font";

type NucleotideSymbol = "A" | "C" | "G" | "U";

enum BasePairType {
  CANONICAL,
  WOBBLE,
  MISMATCH
}

type BasePair = {
  rnaMoleculeIndex : number,
  nucleotideIndex : number,
  type : BasePairType
}

type LabelLine = {
  endpoint0 : Vector2D,
  endpoint1 : Vector2D,
  strokeWidth : number,
  color : Color
};

type LabelContent = {
  position : Vector2D,
  content : string,
  font : Font,
  color : Color
};

class Nucleotide {
  public symbol : NucleotideSymbol;
  public position : Vector2D;
  public basePair : BasePair | null;
  public labelLine : LabelLine | null;
  public labelContent : LabelContent | null;
  public color : Color;
  public font : Font;

  public constructor(symbol : NucleotideSymbol, position : Vector2D, basePair : BasePair | null = null, labelLine : LabelLine | null = null, labelContent : LabelContent | null = null, color : Color | null = null, font : Font | null = null) {
    this.symbol = symbol;
    this.position = position;
    this.basePair = basePair;
    this.labelLine = labelLine;
    this.labelContent = labelContent;
    this.color = color ?? Color.BLACK;
    this.font = font ? font : Font.DEFAULT_FONT;
  }

  public static getBasePairType(symbol0 : NucleotideSymbol, symbol1 : NucleotideSymbol) : BasePairType {
    switch (`${symbol0}_${symbol1}`) {
      case "A_A":
      case "C_C":
      case "G_G":
      case "U_U":
      case "A_C":
      case "C_A":
      case "C_U":
      case "U_C":
        return BasePairType.MISMATCH;
      case "A_G":
      case "G_A":
      case "G_U":
      case "U_G":
        return BasePairType.WOBBLE;
      case "A_U":
      case "U_A":
      case "C_G":
      case "G_C":
        return BasePairType.CANONICAL;
    }
    throw `Unsupported base-pair type between ${symbol0} and ${symbol1}`;
  }
}

export { Nucleotide, type NucleotideSymbol, type BasePair, type LabelLine, type LabelContent, BasePairType }