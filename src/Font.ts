class PartialFont {
  public family : string;
  public style : string;
  public weight : string;

  public static readonly DEFAULT_FONT_ID = 0;
  public static readonly DEFAULT_PARTIAL_FONT : PartialFont = PartialFont.fromFontId(PartialFont.DEFAULT_FONT_ID);

  constructor(family : string, style : string, weight : string) {
    this.family = family;
    this.style = style;
    this.weight = weight;
  }

  public static fromFontId(fontId : number) : PartialFont {
    // Adapted from StringUtil.java:ssFontToFont
    switch (fontId) {
        case 0: {
            return new PartialFont('Helvetica', 'normal', 'normal');
        }
        case 1: {
          return new PartialFont('Helvetica', 'italic', 'normal');
        }
        case 2: {
          return new PartialFont('Helvetica', 'normal', 'bold');
        }
        case 3: {
          return new PartialFont('Helvetica', 'italic', 'bold');
        }
        case 4: {
          return new PartialFont('TimesRoman', 'normal', 'normal');
        }
        case 5: {
          return new PartialFont('TimesRoman', 'italic', 'normal');
        }
        case 6: {
          return new PartialFont('TimesRoman', 'normal', 'bold');
        }
        case 7: {
          return new PartialFont('TimesRoman', 'italic', 'bold');
        }
        case 8: {
          return new PartialFont('Courier', 'normal', 'normal');
        }
        case 9: {
          return new PartialFont('Courier', 'italic', 'normal');
        }
        case 10: {
          return new PartialFont('Courier', 'normal', 'bold');
        }
        case 11: {
          return new PartialFont('Courier', 'italic', 'bold');
        }
        case 12: {
          return new PartialFont('TimesRoman', 'normal', 'normal');
        }
        case 13: {
          return new PartialFont('Dialog', 'normal', 'normal');
        }
        case 14: {
          return new PartialFont('Dialog', 'italic', 'normal');
        }
        case 15: {
          return new PartialFont('Dialog', 'normal', 'bold');
        }
        case 16: {
          return new PartialFont('Dialog', 'italic', 'bold');
        }
        case 17: {
          return new PartialFont('DialogInput', 'normal', 'normal');
        }
        case 18: {
          return new PartialFont('DialogInput', 'italic', 'normal');
        }
        case 19: {
          return new PartialFont('DialogInput', 'normal', 'bold');
        }
        case 20: {
          return new PartialFont('DialogInput', 'italic', 'bold');
        }
        default: {
          return new PartialFont('Helvetica', 'normal', 'normal');
        }
    }
  }

  public toFontId() : number {
    // A logical inversion of fontIdToFont. Implemented for backward compatibility.
    switch (`${this.family}_${this.style}_${this.weight}`) {
        default:
        case 'Helvetica_normal_normal':
            return 0;
        case 'Helvetica_italic_normal':
            return 1;
        case 'Helvetica_normal_bold':
            return 2;
        case 'Helvetica_italic_bold':
            return 3;
        case 'TimesRoman_normal_normal':
            return 4;
        case 'TimesRoman_italic_normal':
            return 5;
        case 'TimesRoman_normal_bold':
            return 6;
        case 'TimesRoman_italic_bold':
            return 7;
        case 'Courier_normal_normal':
            return 8;
        case 'Courier_italic_normal':
            return 9;
        case 'Courier_normal_bold':
            return 10;
        case 'Courier_italic_bold':
            return 11;
        case 'TimesRoman_normal_normal':
            return 12;
        case 'Dialog_normal_normal':
            return 13;
        case 'Dialog_italic_normal':
            return 14;
        case 'Dialog_normal_bold':
            return 15;
        case 'Dialog_italic_bold':
            return 16;
        case 'DialogInput_normal_normal':
            return 17;
        case 'DialogInput_italic_normal':
            return 18;
        case 'DialogInput_normal_bold':
            return 19;
        case 'DialogInput_italic_bold':
            return 20;
    }
  }
}

class Font extends PartialFont {
  public size : number;

  public static readonly DEFAULT_FONT_SIZE = 8;
  public static readonly DEFAULT_FONT = Font.fromPartialFont(PartialFont.DEFAULT_PARTIAL_FONT, Font.DEFAULT_FONT_SIZE);

  constructor(family : string, style : string, weight : string, size : number = Font.DEFAULT_FONT_SIZE) {
    super(family, style, weight)
    this.size = size;
  }

  public static fromPartialFont(partialFont : PartialFont, size : number = Font.DEFAULT_FONT_SIZE) : Font {
    return new Font(partialFont.family, partialFont.style, partialFont.weight, size);
  }

  public static override fromFontId(fontId : number, size : number = Font.DEFAULT_FONT_SIZE) {
    return Font.fromPartialFont(PartialFont.fromFontId(fontId), size);
  }
}

export default Font;
export { PartialFont }