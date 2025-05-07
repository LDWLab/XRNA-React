export enum ColorFormat {
  RGB = "RGB",
  RGBA = "RGBA",
  ARGB = "ARGB",
  BGR = "BGR",
  BGRA = "BGRA",
  ABGR = "ABGR"
}

export const colorFormats = Object.values(ColorFormat);

export type ByteIndex = 0 | 1 | 2 | 3;

export type ByteMap = { red : ByteIndex, green : ByteIndex, blue : ByteIndex, alpha? : ByteIndex | undefined };

export const byteMaps : Record<ColorFormat, ByteMap> = {
  [ColorFormat.RGB] : {
    red : 2,
    green : 1,
    blue : 0
  },
  [ColorFormat.RGBA] : {
    red : 3,
    green : 2,
    blue : 1,
    alpha : 0
  },
  [ColorFormat.ARGB] : {
    red : 2,
    green : 1,
    blue : 0,
    alpha : 3
  },
  [ColorFormat.BGR] : {
    red : 0,
    green : 1,
    blue : 2
  },
  [ColorFormat.BGRA] : {
    red : 1,
    green : 2,
    blue : 3,
    alpha : 0
  },
  [ColorFormat.ABGR] : {
    red : 0,
    green : 1,
    blue : 2,
    alpha : 3
  }
}
  
export type Color = {
  red : number;
  green : number;
  blue : number;
  alpha? : number;
};
  
export const DEFAULT_ALPHA = 255;
export const DEFAULT_COLOR_FORMAT = ColorFormat.RGB;
export const BLACK : Color = {
  red : 0,
  green : 0,
  blue : 0,
  alpha : DEFAULT_ALPHA
};
export const BRIGHT_GRAY : Color = {
  red : 192,
  green : 192,
  blue : 192,
  alpha : DEFAULT_ALPHA
};
export const CHARCOAL_GRAY : Color = {
  red : 54,
  green : 64,
  blue : 79
};
export const FOREST_GREEN : Color = {
  red : 1,
  green : 68,
  blue : 33
}

export function toCSS(color : Color) : string {
  let cssRgb = `${color.red}, ${color.green}, ${color.blue}`;
  return color.alpha == null || Number.isNaN(color.alpha) || color.alpha === 255 ? `rgb(${cssRgb})` : `rgba(${cssRgb}, ${color.alpha / 255})`;
}

export function fromHexadecimal(hexadecimal : string, colorFormat : ColorFormat) : Color {
  return fromNumber(Number.parseInt(hexadecimal, 16), colorFormat);
}

export function fromNumber(_number : number, colorFormat : ColorFormat = ColorFormat.RGB) : Color {
  let splitBits = {
    // Right-most 8 bits
    0 : _number & 255,
    1 : (_number >>> 8) & 255,
    2 : (_number >>> 16) & 255,
    // Left-most 8 bits.
    3 : (_number >>> 24) & 255
  };
  let byteMap = byteMaps[colorFormat];
  let fromNumber : Color = {
    red : splitBits[byteMap.red],
    green : splitBits[byteMap.green],
    blue : splitBits[byteMap.blue]
  };
  if (byteMap.alpha !== undefined) {
    fromNumber = {
      ...fromNumber,
      alpha : splitBits[byteMap.alpha]
    };
  }
  return fromNumber;
}

export function toNumber(color : Color, colorFormat : ColorFormat) : number {
  let byteMap = byteMaps[colorFormat];
  let toNumber = byteMap.alpha === undefined || color.alpha === undefined ? 0 : (color.alpha << (byteMap.alpha * 8));
  return (
    (color.red << (byteMap.red * 8)) |
    (color.green << (byteMap.green * 8)) |
    (color.blue << (byteMap.blue * 8)) |
    toNumber
  );
}

export function toHexadecimal(
  color : Color,
  colorFormat : ColorFormat = ColorFormat.RGB,
  providePaddingFlag = false
) : string {
  const withoutPadding = toNumber(color, colorFormat).toString(16).toUpperCase();
  if (!providePaddingFlag) {
    return withoutPadding;
  }
  return "0".repeat(2 * colorFormat.length - withoutPadding.length) + withoutPadding;
}

export enum HandleUndefined {
  THROW_ERROR = "throw error",
  RETURN_BLACK = "return black",
  RETURN_TRANSPARENT = "return transparent"
};

export function fromCssString(
  cssString : string,
  colorFormat : ColorFormat = ColorFormat.RGB,
  handleUndefined : HandleUndefined = HandleUndefined.RETURN_BLACK
) : Color {
  let match = /^rgb\((\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})\)$/.exec(cssString);
  if (match !== null) {
    return {
      red : Number.parseInt(match[1]),
      green : Number.parseInt(match[2]),
      blue : Number.parseInt(match[3])
    };
  }
  match = /^rgba\((\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)(\d{1,3})(?:\s*,\s*|\s+)([\d\.]+)\)$/.exec(cssString);
  if (match !== null) {
    return {
      red : Number.parseInt(match[1]),
      green : Number.parseInt(match[2]),
      blue : Number.parseInt(match[3]),
      alpha : Number.parseFloat(match[4]) * 255
    };
  }
  match = /^rgb\(([\d\.]+)(?:\s*,\s*|\s+)([\d\.]+)(?:\s*,\s*|\s+)([\d\.]+)\)$/.exec(cssString);
  if (match !== null) {
    return {
      red : Number.parseFloat(match[1]),
      green : Number.parseFloat(match[2]),
      blue : Number.parseFloat(match[3])
    };
  }
  match = /^rgba\(([\d\.]+)(?:\s*,\s*|\s+)([\d\.]+)(?:\s*,\s*|\s+)([\d\.]+)(?:\s*,\s*|\s+)([\d\.]+)\)$/.exec(cssString);
  if (match !== null) {
    return {
      red : Number.parseFloat(match[1]),
      green : Number.parseFloat(match[2]),
      blue : Number.parseFloat(match[3]),
      alpha : Number.parseFloat(match[4]) * 255
    };
  }
  match = /^\d+$/.exec(cssString);
  if (match !== null) {
    return fromNumber(
      Number.parseInt(match[0]),
      colorFormat
    );
  }
  match = /^#([abcdefABCDEF\d]+)$/.exec(cssString);
  if (match !== null) {
    return fromHexadecimal(
      match[1],
      colorFormat
    );
  }
  if (cssString === "undefined") {
    switch (handleUndefined) {
      case HandleUndefined.RETURN_BLACK : {
        return BLACK;
      }
      case HandleUndefined.RETURN_TRANSPARENT : {
        return {
          red : 0,
          green : 0,
          blue : 0,
          alpha : 0
        };
      }
      case HandleUndefined.THROW_ERROR : {
        throw `Unsupported color literal "${cssString}"`;
      }
      default : {
        throw "Unhandled switch case";
      }
    }
  }
  switch (cssString) {
    case "none" : {
      return {
        red : 0,
        blue : 0,
        green : 0,
        alpha : 0
      };
    }
    case "black" : {
      return {
        red : 0,
        green : 0,
        blue : 0
      };
    }
    case "silver" : {
      return {
        red : 192,
        green : 192,
        blue : 192
      };
    }
    case "gray" : {
      return {
        red : 128,
        green : 128,
        blue : 128
      };
    }
    case "white" : {
      return {
        red : 255,
        green : 255,
        blue : 255
      };
    }
    case "maroon" : {
      return {
        red : 128,
        green : 0,
        blue : 0
      };
    }
    case "red" : {
      return {
        red : 255,
        green : 0,
        blue : 0
      };
    }
    case "purple" : {
      return {
        red : 128,
        green : 0,
        blue : 128
      };
    }
    case "fuchsia" : {
      return {
        red : 255,
        green : 0,
        blue : 255
      };
    }
    case "green" : {
      return {
        red : 0,
        green : 128,
        blue : 0
      };
    }
    case "lime" : {
      return {
        red : 0,
        green : 255,
        blue : 0
      };
    }
    case "olive" : {
      return {
        red : 128,
        green : 128,
        blue : 0
      };
    }
    case "yellow" : {
      return {
        red : 255,
        green : 255,
        blue : 0
      };
    }
    case "navy" : {
      return {
        red : 0,
        green : 0,
        blue : 128
      };
    }
    case "blue" : {
      return {
        red : 0,
        green : 0,
        blue : 255
      };
    }
    case "teal" : {
      return {
        red : 0,
        green : 128,
        blue : 128
      };
    }
    case "aqua" : {
      return {
        red : 0,
        green : 255,
        blue : 255
      };
    }
    case "aliceblue" : {
      return {
        red : 240,
        green : 248,
        blue : 255
      };
    }
    case "antiquewhite" : {
      return {
        red : 250,
        green : 235,
        blue : 215
      };
    }
    case "aquamarine" : {
      return {
        red : 127,
        green : 255,
        blue : 212
      };
    }
    case "azure" : {
      return {
        red : 240,
        green : 255,
        blue : 255
      };
    }
    case "beige" : {
      return {
        red : 245,
        green : 245,
        blue : 220
      };
    }
    case "bisque" : {
      return {
        red : 255,
        green : 228,
        blue : 196
      };
    }
    case "blanchedalmond" : {
      return {
        red : 255,
        green : 235,
        blue : 205
      };
    }
    case "blueviolet" : {
      return {
        red : 138,
        green : 43,
        blue : 226
      };
    }
    case "brown" : {
      return {
        red : 165,
        green : 42,
        blue : 42
      };
    }
    case "burlywood" : {
      return {
        red : 222,
        green : 184,
        blue : 135
      };
    }
    case "cadetblue" : {
      return {
        red : 95,
        green : 158,
        blue : 160
      };
    }
    case "chartreuse" : {
      return {
        red : 127,
        green : 255,
        blue : 0
      };
    }
    case "chocolate" : {
      return {
        red : 210,
        green : 105,
        blue : 30
      };
    }
    case "coral" : {
      return {
        red : 255,
        green : 127,
        blue : 80
      };
    }
    case "cornflowerblue" : {
      return {
        red : 100,
        green : 149,
        blue : 237
      };
    }
    case "cornsilk" : {
      return {
        red : 255,
        green : 248,
        blue : 220
      };
    }
    case "crimson" : {
      return {
        red : 220,
        green : 20,
        blue : 60
      };
    }
    case "cyan" : {
      return {
        red : 0,
        green : 255,
        blue : 255
      };
    }
    case "darkblue" : {
      return {
        red : 0,
        green : 0,
        blue : 139
      };
    }
    case "darkcyan" : {
      return {
        red : 0,
        green : 139,
        blue : 139
      };
    }
    case "darkgoldenrod" : {
      return {
        red : 184,
        green : 134,
        blue : 11
      };
    }
    case "darkgreen" : {
      return {
        red : 0,
        green : 100,
        blue : 0
      };
    }
    case "darkkhaki" : {
      return {
        red : 189,
        green : 183,
        blue : 107
      };
    }
    case "darkmagenta" : {
      return {
        red : 139,
        green : 0,
        blue : 139
      };
    }
    case "darkolivegreen" : {
      return {
        red : 85,
        green : 107,
        blue : 47
      };
    }
    case "darkorange" : {
      return {
        red : 255,
        green : 140,
        blue : 0
      };
    }
    case "darkorchid" : {
      return {
        red : 139,
        green : 0,
        blue : 0
      };
    }
    case "darksalmon" : {
      return {
        red : 233,
        green : 150,
        blue : 122
      };
    }
    case "darkseagreen" : {
      return {
        red : 143,
        green : 188,
        blue : 143
      };
    }
    case "darkslateblue" : {
      return {
        red : 72,
        green : 61,
        blue : 139
      };
    }
    case "darkslategray" : {
      return {
        red : 47,
        green : 79,
        blue : 79
      };
    }
    case "darkturqoise" : {
      return {
        red : 0,
        green : 206,
        blue : 209
      };
    }
    case "darkviolet" : {
      return {
        red : 148,
        green : 0,
        blue : 211
      };
    }
    case "deeppink" : {
      return {
        red : 255,
        green : 20,
        blue : 147
      };
    }
    case "deepskyblue" : {
      return {
        red : 0,
        green : 191,
        blue : 255
      };
    }
    case "dimgray" : {
      return {
        red : 105,
        green : 105,
        blue : 105
      };
    }
    case "dodgerblue" : {
      return {
        red : 30,
        green : 144,
        blue : 255
      };
    }
    case "firebrick" : {
      return {
        red : 178,
        green : 34,
        blue : 34
      };
    }
    case "floralwhite" : {
      return {
        red : 255,
        green : 250,
        blue : 240
      };
    }
    case "forestgreen" : {
      return {
        red : 34,
        green : 139,
        blue : 34
      };
    }
    case "gainsboro" : {
      return {
        red : 220,
        green : 220,
        blue : 220
      };
    }
    case "ghostwhite" : {
      return {
        red : 248,
        green : 248,
        blue : 255
      };
    }
    case "gold" : {
      return {
        red : 255,
        green : 215,
        blue : 0
      };
    }
    case "goldenrod" : {
      return {
        red : 218,
        green : 165,
        blue : 32
      };
    }
    case "greenyellow" : {
      return {
        red : 173,
        green : 255,
        blue : 47
      };
    }
    case "honeydew" : {
      return {
        red : 240,
        green : 255,
        blue : 240
      };
    }
    case "hotpink" : {
      return {
        red : 255,
        green : 105,
        blue : 180
      };
    }
    case "indianred" : {
      return {
        red : 205,
        green : 92,
        blue : 92
      };
    }
    case "indigo" : {
      return {
        red : 75,
        green : 0,
        blue : 130
      };
    }
    case "ivory" : {
      return {
        red : 255,
        green : 255,
        blue : 240
      };
    }
    case "khaki" : {
      return {
        red : 240,
        green : 230,
        blue : 140
      };
    }
    case "lavender" : {
      return {
        red : 230,
        green : 230,
        blue : 250
      };
    }
    case "lavenderblush" : {
      return {
        red : 255,
        green : 240,
        blue : 245
      };
    }
    case "lawngreen" : {
      return {
        red : 124,
        green : 252,
        blue : 0
      };
    }
    case "lemonchiffon" : {
      return {
        red : 255,
        green : 250,
        blue : 205
      };
    }
    case "lightblue" : {
      return {
        red : 173,
        green : 216,
        blue : 230
      };
    }
    case "lightcoral" : {
      return {
        red : 240,
        green : 128,
        blue : 128
      };
    }
    case "lightcyan" : {
      return {
        red : 224,
        green : 255,
        blue : 255
      };
    }
    case "lightgoldenrodyellow" : {
      return {
        red : 250,
        green : 250,
        blue : 210
      };
    }
    case "lightgray" : {
      return {
        red : 211,
        green : 211,
        blue : 211
      };
    }
    case "lightgreen" : {
      return {
        red : 148,
        green : 238,
        blue : 144
      };
    }
    case "lightgrey" : {
      return {
        red : 211,
        green : 211,
        blue : 211
      };
    }
    case "lightpink" : {
      return {
        red : 255,
        green : 182,
        blue : 193
      };
    }
    case "lightsalmon" : {
      return {
        red : 255,
        green : 160,
        blue : 122
      };
    }
    case "lightseagreen" : {
      return {
        red : 32,
        green : 178,
        blue : 170
      };
    }
    case "lightskyblue" : {
      return {
        red : 135,
        green : 206,
        blue : 250
      };
    }
    case "lightslategray" : {
      return {
        red : 119,
        green : 136,
        blue : 153
      };
    }
    case "lightslategrey" : {
      return {
        red : 119,
        green : 136,
        blue : 153
      };
    }
    case "lightsleetblue" : {
      return {
        red : 176,
        green : 196,
        blue : 222
      };
    }
    case "lightyellow" : {
      return {
        red : 255,
        green : 255,
        blue : 224
      };
    }
    case "lime" : {
      return {
        red : 0,
        green : 255,
        blue : 0
      };
    }
    case "limegreen" : {
      return {
        red : 50,
        green : 205,
        blue : 50
      };
    }
    case "linen" : {
      return {
        red : 250,
        green : 240,
        blue : 230
      };
    }
    case "magenta" : {
      return {
        red : 255,
        green : 0,
        blue : 255
      };
    }
    case "maroon" : {
      return {
        red : 128,
        green : 0,
        blue : 0
      };
    }
    case "mediumaquamarine" : {
      return {
        red : 102,
        green : 205,
        blue : 170
      };
    }
    case "mediumblue" : {
      return {
        red : 0,
        green : 0,
        blue : 205
      };
    }
    case "mediumorchid" : {
      return {
        red : 186,
        green : 85,
        blue : 211
      };
    }
    case "mediumpruple" : {
      return {
        red : 147,
        green : 112,
        blue : 219
      };
    }
    case "mediumseagreen" : {
      return {
        red : 60,
        green : 179,
        blue : 113
      };
    }
    case "mediumslateblue" : {
      return {
        red : 123,
        green : 104,
        blue : 238
      };
    }
    case "mediumspringgreen" : {
      return {
        red : 0,
        green : 250,
        blue : 154
      };
    }
    case "mediumturquiose" : {
      return {
        red : 72,
        green : 209,
        blue : 204
      };
    }
    case "mediumvioletred" : {
      return {
        red : 199,
        green : 21,
        blue : 133
      };
    }
    case "midnightblue" : {
      return {
        red : 25,
        green : 25,
        blue : 112
      };
    }
    case "mintcream" : {
      return {
        red : 245,
        green : 255,
        blue : 250
      };
    }
    case "mistyrose" : {
      return {
        red : 255,
        green : 228,
        blue : 225
      };
    }
    case "moccasin" : {
      return {
        red : 255,
        green : 228,
        blue : 181
      };
    }
    case "navajowhite" : {
      return {
        red : 255,
        green : 222,
        blue : 173
      };
    }
    case "navy" : {
      return {
        red : 0,
        green : 0,
        blue : 128
      };
    }
    case "oldlace" : {
      return {
        red : 253,
        green : 245,
        blue : 230
      };
    }
    case "olive" : {
      return {
        red : 128,
        green : 128,
        blue : 0
      };
    }
    case "olivedrab" : {
      return {
        red : 107,
        green : 142,
        blue : 35
      };
    }
    case "orange" : {
      return {
        red : 255,
        green : 165,
        blue : 0
      };
    }
    case "orangered" : {
      return {
        red : 255,
        green : 69,
        blue : 0
      };
    }
    case "orchid" : {
      return {
        red : 218,
        green : 112,
        blue : 214
      };
    }
    case "palegoldenrod" : {
      return {
        red : 238,
        green : 232,
        blue : 170
      };
    }
    case "palegreen" : {
      return {
        red : 152,
        green : 251,
        blue : 152
      };
    }
    case "paleturquoise" : {
      return {
        red : 175,
        green : 238,
        blue : 238
      };
    }
    case "palevioletred" : {
      return {
        red : 219,
        green : 112,
        blue : 147
      };
    }
    case "papayawhip" : {
      return {
        red : 255,
        green : 239,
        blue : 213
      };
    }
    case "peachpuff" : {
      return {
        red : 255,
        green : 218,
        blue : 185
      };
    }
    case "peru" : {
      return {
        red : 205,
        green : 133,
        blue : 63
      };
    }
    case "pink" : {
      return {
        red : 255,
        green : 192,
        blue : 203
      };
    }
    case "plum" : {
      return {
        red : 221,
        green : 160,
        blue : 221
      };
    }
    case "powderblue" : {
      return {
        red : 176,
        green : 224,
        blue : 230
      };
    }
    case "pruple" : {
      return {
        red : 128,
        green : 0,
        blue : 128
      };
    }
    case "red" : {
      return {
        red : 255,
        green : 0,
        blue : 0
      };
    }
    case "rosybrown" : {
      return {
        red : 188,
        green : 143,
        blue : 143
      };
    }
    case "royalblue" : {
      return {
        red : 65,
        green : 105,
        blue : 225
      };
    }
    case "saddlebrown" : {
      return {
        red : 139,
        green : 69,
        blue : 19
      };
    }
    case "salmon" : {
      return {
        red : 250,
        green : 128,
        blue : 114
      };
    }
    case "sandybrown" : {
      return {
        red : 244,
        green : 264,
        blue : 96
      };
    }
    case "seagreen" : {
      return {
        red : 46,
        green : 139,
        blue : 87
      };
    }
    case "seashell" : {
      return {
        red : 255,
        green : 245,
        blue : 238
      };
    }
    case "sienna" : {
      return {
        red : 160,
        green : 82,
        blue : 45
      };
    }
    case "silver" : {
      return {
        red : 192,
        green : 192,
        blue : 192
      };
    }
    case "skyblue" : {
      return {
        red : 135,
        green : 206,
        blue : 235
      };
    }
    case "slateblue" : {
      return {
        red : 106,
        green : 80,
        blue : 205
      };
    }
    case "slategray" : {
      return {
        red : 112,
        green : 128,
        blue : 144
      };
    }
    case "slategrey" : {
      return {
        red : 112,
        green : 128,
        blue : 144
      };
    }
    case "snow" : {
      return {
        red : 255,
        green : 250,
        blue : 250
      };
    }
    case "springgreen" : {
      return {
        red : 0,
        green : 255,
        blue : 127
      };
    }
    case "steelblue" : {
      return {
        red : 70,
        green : 130,
        blue : 180
      };
    }
    case "tan" : {
      return {
        red : 210,
        green : 180,
        blue : 140
      };
    }
    case "teal" : {
      return {
        red : 0,
        green : 128,
        blue : 128
      };
    }
    case "thistle" : {
      return {
        red : 216,
        green : 191,
        blue : 216
      };
    }
    case "tomato" : {
      return {
        red : 255,
        green : 99,
        blue : 71
      };
    }
    case "turquoise" : {
      return {
        red : 64,
        green : 224,
        blue : 208
      };
    }
    case "violet" : {
      return {
        red : 238,
        green : 130,
        blue : 238
      };
    }
    case "wheat" : {
      return {
        red : 245,
        green : 222,
        blue : 179
      };
    }
    case "white" : {
      return {
        red : 255,
        green : 255,
        blue : 255
      };
    }
    case "yellow" : {
      return {
        red : 255,
        green : 255,
        blue : 0
      };
    }
    case "yellowgreen" : {
      return {
        red : 154,
        green : 205,
        blue : 50
      };
    }
    default : {
      throw `Unsupported color literal: ${cssString}`
    }
  }
}

export function areEqual(color0 : Color, color1 : Color) : boolean {
  return (
    color0.red === color1.red && 
    color0.green === color1.green && 
    color0.blue === color1.blue && 
    color0.alpha === color1.alpha
  );
}
  
  export default Color;