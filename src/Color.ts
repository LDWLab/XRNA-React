class Color {
  public red : number;
  public green : number;
  public blue : number;
  public alpha : number | null;

  public static readonly BLACK : Color = new Color(0, 0, 0);

  public constructor(red : number, green : number, blue : number, alpha : number | null = null) {
    this.red = red;
    this.green = green;
    this.blue = blue;
    this.alpha = alpha;
  }

  public toCSS() : string {
    let cssRgb = `${this.red}, ${this.green}, ${this.blue}`;
    return this.alpha == null || Number.isNaN(this.alpha) ? `rgb(${cssRgb})` : `rgba(${cssRgb}, ${this.alpha})`;
  }

  public static fromHexadecimal(hexadecimal : string, format : "argb" | "rgba" | "rgb") : Color {
    hexadecimal = hexadecimal.toLocaleLowerCase();
    if (!/^[a-f\d]+$/.test(hexadecimal)) {
      throw "The input hexadecimal string did not match the expected format: " + hexadecimal;
    }
    let parsedHexadecimal = Number.parseInt(hexadecimal, 16);
    let alpha = NaN;
    // 16 = 2^4
    // Two hex digits occupy 8 bits.
    switch (format) {
      case "argb":
        alpha = parsedHexadecimal >>> 24;
        break;
      case "rgba":
        alpha = parsedHexadecimal & 255;
        parsedHexadecimal >>>= 8;
        break;
    }
    return new Color((parsedHexadecimal >>> 16) & 255, (parsedHexadecimal >>> 8) & 255, parsedHexadecimal & 255, alpha);
  }
}

export default Color;