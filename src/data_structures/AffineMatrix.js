"use strict";
exports.__esModule = true;
exports.affineMatrixToString = exports.identity = exports.transformVector = exports.parseAffineMatrix = exports.multiplyAffineMatrices = void 0;
function multiplyAffineMatrices(m0, m1) {
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
    var a0 = m0[0], b0 = m0[1], c0 = m0[2], d0 = m0[3], e0 = m0[4], f0 = m0[5];
    var a1 = m1[0], b1 = m1[1], c1 = m1[2], d1 = m1[3], e1 = m1[4], f1 = m1[5];
    return [
        a0 * a1 + c0 * b1,
        b0 * a1 + d0 * b1,
        a0 * c1 + c0 * d1,
        b0 * c1 + d0 * d1,
        a0 * e1 + c0 * f1 + e0,
        b0 * e1 + d0 * f1 + f0
    ];
}
exports.multiplyAffineMatrices = multiplyAffineMatrices;
var rotateMatrixParser = {
    minimum: 1,
    maximum: 1,
    parser: function (inputNumbers) {
        var angle = inputNumbers[0];
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        return [cos, sin, -sin, cos, 0, 0];
    }
};
var matrixParserRecord = {
    "matrix": {
        minimum: 6,
        maximum: 6,
        parser: function (inputNumbers) {
            return inputNumbers;
        }
    },
    "translate": {
        minimum: 2,
        maximum: 2,
        parser: function (inputNumbers) {
            return [1, 0, 0, 1, inputNumbers[0], inputNumbers[1]];
        }
    },
    "translatex": {
        minimum: 1,
        maximum: 1,
        parser: function (inputNumbers) {
            return [1, 0, 0, 1, inputNumbers[0], 0];
        }
    },
    "translatey": {
        minimum: 1,
        maximum: 1,
        parser: function (inputNumbers) {
            return [1, 0, 0, 1, 0, inputNumbers[0]];
        }
    },
    "scale": {
        minimum: 1,
        maximum: 2,
        parser: function (inputNumbers) {
            var scaleX = inputNumbers[0];
            var scaleY = scaleX;
            if (inputNumbers.length > 1) {
                scaleY = inputNumbers[1];
            }
            return [scaleX, 0, 0, scaleY, 0, 0];
        }
    },
    "scalex": {
        minimum: 1,
        maximum: 1,
        parser: function (inputNumbers) {
            return [inputNumbers[0], 0, 0, 1, 0, 0];
        }
    },
    "scaley": {
        minimum: 1,
        maximum: 1,
        parser: function (inputNumbers) {
            return [1, 0, 0, inputNumbers[0], 0, 0];
        }
    },
    "rotate": rotateMatrixParser,
    "rotatez": rotateMatrixParser,
    "skew": {
        minimum: 1,
        maximum: 2,
        parser: function (inputNumbers) {
            var skewXAngle = inputNumbers[0];
            var skewY = 0;
            if (inputNumbers.length > 1) {
                skewY = Math.tan(inputNumbers[1]);
            }
            return [1, skewY, Math.tan(skewXAngle), 1, 0, 0];
        }
    },
    "skewx": {
        minimum: 1,
        maximum: 1,
        parser: function (inputNumbers) {
            return [1, 0, Math.tan(inputNumbers[0]), 1, 0, 0];
        }
    },
    "skewy": {
        maximum: 1,
        minimum: 1,
        parser: function (inputNumbers) {
            return [1, Math.tan(inputNumbers[0]), 0, 1, 0, 0];
        }
    }
};
function parseAffineMatrix(inputString) {
    inputString = inputString.toLowerCase();
    var regex = /^\s*([a-z]+)\s*\(([\d.,\s-e]+)\)\s*$/;
    var regexMatch = inputString.match(regex);
    if (regexMatch == null) {
        throw "Unrecognized input-text format";
    }
    var transformType = regexMatch[1];
    if (!(transformType in matrixParserRecord)) {
        throw "Unrecognized transform type.";
    }
    var _a = matrixParserRecord[transformType], minimum = _a.minimum, maximum = _a.maximum, parser = _a.parser;
    var transformNumbers = regexMatch[2];
    transformNumbers = transformNumbers.trim();
    transformNumbers = transformNumbers.replaceAll(/\s*,\s*/g, ",");
    transformNumbers = transformNumbers.replaceAll(/\s+/g, ",");
    var numbers = transformNumbers.split(",").map(Number.parseFloat);
    var numbersLength = numbers.length;
    if (numbersLength < minimum) {
        throw "The number of input numbers (".concat(numbersLength, ") is less than the minimum required (").concat(minimum, ")");
    }
    if (numbersLength > maximum) {
        throw "The number of input numbers (".concat(numbersLength, ") is greater than the maximum required (").concat(maximum, ")");
    }
    return parser(numbers);
}
exports.parseAffineMatrix = parseAffineMatrix;
function transformVector(_a, _b) {
    var a = _a[0], b = _a[1], c = _a[2], d = _a[3], e = _a[4], f = _a[5];
    var x = _b.x, y = _b.y;
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
        x: a * x + c * y + e,
        y: b * x + d * y + f
    };
}
exports.transformVector = transformVector;
function identity() {
    return [1, 0, 0, 1, 0, 0];
}
exports.identity = identity;
function affineMatrixToString(_a) {
    var a = _a[0], b = _a[1], c = _a[2], d = _a[3], e = _a[4], f = _a[5];
    return "matrix(".concat(a, ", ").concat(b, ", ").concat(c, ", ").concat(d, ", ").concat(e, ", ").concat(f, ")");
}
exports.affineMatrixToString = affineMatrixToString;
