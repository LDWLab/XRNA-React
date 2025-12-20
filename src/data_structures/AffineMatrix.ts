import { MouseButtonIndices } from "../utils/Constants";
import { Vector2D } from "./Vector2D";

export type AffineMatrix = [number, number, number, number, number, number];

export function multiplyAffineMatrices(m0 : AffineMatrix, m1 : AffineMatrix) : AffineMatrix {
    // [a0 c0 e0] * [a1 c1 e1]
    // [b0 d0 f0]   [b1 d1 f1]
    // =
    // [a0 c0 e0] * [a1 c1 e1]
    // [b0 d0 f0]   [b1 d1 f1]
    // [0  0  1 ]   [0  0  1 ]
    // =
    // [a0a1 + c0b1 a0c1 + c0d1 a0e1 + c0f1 + e0]
    // [b0a1 + d0b1 b0c1 + d0d1 b0e1 + d0f1 + f0]
    // [0           0           1               ]
    const [a0, b0, c0, d0, e0, f0] = m0;
    const [a1, b1, c1, d1, e1, f1] = m1;
    return [
        a0 * a1 + c0 * b1,
        b0 * a1 + d0 * b1,
        a0 * c1 + c0 * d1,
        b0 * c1 + d0 * d1,
        a0 * e1 + c0 * f1 + e0,
        b0 * e1 + d0 * f1 + f0
    ];
}

const rotateMatrixParser : MatrixParser = {
    minimum : 1,
    maximum : 1,
    parser : function(inputNumbers : number[]) : AffineMatrix {
        // SVG rotate() uses degrees, but Math.cos/sin expect radians
        const angleInRadians = inputNumbers[0] * Math.PI / 180;
        const cos = Math.cos(angleInRadians);
        const sin = Math.sin(angleInRadians);
        return [cos, sin, -sin, cos, 0, 0];
    }
};

type MatrixParser = {
    minimum : number,
    maximum : number,
    parser : (inputNumbers : number[]) => AffineMatrix
}
const matrixParserRecord : Record<string, MatrixParser> = {
    "matrix" : {
        minimum : 6,
        maximum : 6,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            return inputNumbers as AffineMatrix;
        }
    },
    "translate" : {
        minimum : 2,
        maximum : 2,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            return [1, 0, 0, 1, inputNumbers[0], inputNumbers[1]];
        }
    },
    "translatex" : {
        minimum : 1,
        maximum : 1,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            return [1, 0, 0, 1, inputNumbers[0], 0];
        }
    },
    "translatey" : {
        minimum : 1,
        maximum : 1,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            return [1, 0, 0, 1, 0, inputNumbers[0]];
        }
    },
    "scale" : {
        minimum : 1,
        maximum : 2,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            const scaleX = inputNumbers[0];
            let scaleY = scaleX;
            if (inputNumbers.length > 1) {
                scaleY = inputNumbers[1];
            }
            return [scaleX, 0, 0, scaleY, 0, 0];
        }
    },
    "scalex" : {
        minimum : 1,
        maximum : 1,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            return [inputNumbers[0], 0, 0, 1, 0, 0];
        }
    },
    "scaley" : {
        minimum : 1,
        maximum : 1,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            return [1, 0, 0, inputNumbers[0], 0, 0];
        }  
    },
    "rotate" : rotateMatrixParser,
    "rotatez" : rotateMatrixParser,
    "skew" : {
        minimum : 1,
        maximum : 2,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            // SVG skew uses degrees, convert to radians for Math.tan
            const skewXAngleRad = inputNumbers[0] * Math.PI / 180;
            let skewY = 0;
            if (inputNumbers.length > 1) {
                skewY = Math.tan(inputNumbers[1] * Math.PI / 180);
            }
            return [1, skewY, Math.tan(skewXAngleRad), 1, 0, 0];
        }
    },
    "skewx" : {
        minimum : 1,
        maximum : 1,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            // SVG skewX uses degrees, convert to radians for Math.tan
            return [1, 0, Math.tan(inputNumbers[0] * Math.PI / 180), 1, 0, 0];
        }
    },
    "skewy" : {
        maximum : 1,
        minimum : 1,
        parser : function(inputNumbers : number[]) : AffineMatrix {
            // SVG skewY uses degrees, convert to radians for Math.tan
            return [1, Math.tan(inputNumbers[0] * Math.PI / 180), 0, 1, 0, 0];
        }
    }
};

export function parseAffineMatrix(inputString : string) : AffineMatrix {
    inputString = inputString.toLowerCase();
    const regex = /^\s*([a-z]+)\s*\(([\d.,\s-e]+)\)\s*$/;
    const regexMatch = inputString.match(regex);
    if (regexMatch == null) {
        throw "Unrecognized input-text format";
    }
    const transformType = regexMatch[1];
    if (!(transformType in matrixParserRecord)) {
        throw "Unrecognized transform type.";
    }
    const {
        minimum,
        maximum,
        parser
    } = matrixParserRecord[transformType];

    let transformNumbers = regexMatch[2];
    transformNumbers = transformNumbers.trim();
    transformNumbers = transformNumbers.replaceAll(/\s*,\s*/g,",");
    transformNumbers = transformNumbers.replaceAll(/\s+/g, ",");
    const numbers = transformNumbers.split(",").map(Number.parseFloat);
    const numbersLength = numbers.length;
    if (numbersLength < minimum) {
        throw `The number of input numbers (${numbersLength}) is less than the minimum required (${minimum})`;
    }
    if (numbersLength > maximum) {
        throw `The number of input numbers (${numbersLength}) is greater than the maximum required (${maximum})`;
    }
    return parser(numbers);
}

export function transformVector([a, b, c, d, e, f] : AffineMatrix, {x, y} : Vector2D) : Vector2D {
    // matrix == [a, b, c, d, e, f].
    // vector = [x, y, 1]
    // matrix * vector 
    // == 
    // [a c e] * [x]
    // [b d f]   [y]
    // [0 0 1]   [1]
    // ==
    // [a * x + c * y + e]
    // [b * x + d * y + f]
    // [1                ]
    return {
        x : a * x + c * y + e,
        y : b * x + d * y + f
    };
}

export function identity() : AffineMatrix {
    return [1, 0, 0, 1, 0, 0];
}

export function affineMatrixToString([a, b, c, d, e, f] : AffineMatrix) {
    return `matrix(${a}, ${b}, ${c}, ${d}, ${e}, ${f})`;
}