"use strict";
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
exports.__esModule = true;
exports.median = exports.getLineBoundingPath = exports.isEmpty = exports.max = exports.min = exports.parseInteger = exports.subtractNumbersNegated = exports.subtractNumbers = exports.degreesToRadians = exports.radiansToDegrees = exports.sortedArraySplice = exports.HandleQueryNotFound = exports.binarySearch = exports.areEqual = exports.compare = exports.sign = exports.flattenRecordWithStringKeys = exports.flattenRecordWithNumberKeys = exports.flattenRecordWithIntegerKeys = exports.flattenRecord = exports.range = exports.DEFAULT_EPSILON = void 0;
var Vector2D_1 = require("../data_structures/Vector2D");
exports.DEFAULT_EPSILON = 1E-7;
function range(stopExclusive, startInclusive, step) {
    if (startInclusive === void 0) { startInclusive = 0; }
    if (step === void 0) { step = 1; }
    if ((stopExclusive - startInclusive) * step <= 0) {
        throw "Infinite loop error";
    }
    var range = [];
    for (var index = startInclusive; index < stopExclusive; index += step) {
        range.push(index);
    }
    return range;
}
exports.range = range;
function flattenRecord(record, parser) {
    var output = Object.entries(record);
    for (var i = 0; i < output.length; i++) {
        output[i][0] = parser(output[i][0]);
    }
    return output;
}
exports.flattenRecord = flattenRecord;
function flattenRecordWithIntegerKeys(record) {
    return flattenRecord(record, Number.parseInt);
}
exports.flattenRecordWithIntegerKeys = flattenRecordWithIntegerKeys;
function flattenRecordWithNumberKeys(record) {
    return flattenRecord(record, Number.parseFloat);
}
exports.flattenRecordWithNumberKeys = flattenRecordWithNumberKeys;
function flattenRecordWithStringKeys(record) {
    return flattenRecord(record, function (s) {
        return s;
    });
}
exports.flattenRecordWithStringKeys = flattenRecordWithStringKeys;
function sign(n, epsilon) {
    if (epsilon === void 0) { epsilon = exports.DEFAULT_EPSILON; }
    return n < -epsilon ? -1 : n < epsilon ? 0 : 1;
}
exports.sign = sign;
function compare(n0, n1, epsilon) {
    if (epsilon === void 0) { epsilon = exports.DEFAULT_EPSILON; }
    return sign(n0 - n1, epsilon);
}
exports.compare = compare;
function areEqual(n0, n1, epsilon) {
    if (epsilon === void 0) { epsilon = exports.DEFAULT_EPSILON; }
    return compare(n0, n1, epsilon) === 0;
}
exports.areEqual = areEqual;
function binarySearch(array, comparator) {
    if (array.length === 0) {
        return null;
    }
    var arrayIndexLowBound = 0;
    var arrayIndexHighBound = array.length - 1;
    while (true) {
        var arrayIndex = (arrayIndexLowBound + arrayIndexHighBound) >> 1;
        var arrayEntry = array[arrayIndex];
        var comparison = comparator(arrayEntry);
        if (comparison === 0) {
            return {
                arrayEntry: arrayEntry,
                arrayIndex: arrayIndex
            };
        }
        if (comparison > 0) {
            arrayIndexHighBound = arrayIndex - 1;
        }
        else {
            arrayIndexLowBound = arrayIndex + 1;
        }
        if (arrayIndexLowBound > arrayIndexHighBound) {
            break;
        }
    }
    return null;
}
exports.binarySearch = binarySearch;
var HandleQueryNotFound;
(function (HandleQueryNotFound) {
    HandleQueryNotFound["THROW_ERROR"] = "Throw error";
    HandleQueryNotFound["DELETE_AND_ADD"] = "Delete and add";
    HandleQueryNotFound["DELETE"] = "Delete";
    HandleQueryNotFound["ADD"] = "Add";
    HandleQueryNotFound["DO_NOTHING"] = "Do nothing";
})(HandleQueryNotFound = exports.HandleQueryNotFound || (exports.HandleQueryNotFound = {}));
function sortedArraySplice(sortedArray, comparator, deleteCount, toBeInserted, handleQueryNotFound) {
    if (toBeInserted === void 0) { toBeInserted = []; }
    if (handleQueryNotFound === void 0) { handleQueryNotFound = HandleQueryNotFound.THROW_ERROR; }
    var arrayIndexLowBound = 0;
    var arrayIndexHighBound = sortedArray.length - 1;
    var queryNotFoundFlag = true;
    while (arrayIndexLowBound <= arrayIndexHighBound) {
        var arrayIndex = (arrayIndexLowBound + arrayIndexHighBound) >> 1;
        var comparison = comparator(sortedArray[arrayIndex]);
        if (comparison === 0) {
            arrayIndexLowBound = arrayIndex;
            queryNotFoundFlag = false;
            break;
        }
        if (comparison > 0) {
            arrayIndexHighBound = arrayIndex - 1;
        }
        else {
            arrayIndexLowBound = arrayIndex + 1;
        }
    }
    var finalDeleteCount = deleteCount;
    var finalToBeInserted = toBeInserted;
    if (queryNotFoundFlag) {
        switch (handleQueryNotFound) {
            case HandleQueryNotFound.THROW_ERROR: {
                throw "The query was not found within the input sorted array.";
            }
            case HandleQueryNotFound.DELETE_AND_ADD: {
                // Insert and delete.
                break;
            }
            case HandleQueryNotFound.DELETE: {
                // Insert nothing.
                finalToBeInserted = [];
                break;
            }
            case HandleQueryNotFound.ADD: {
                // Delete nothing.
                finalDeleteCount = 0;
                break;
            }
            case HandleQueryNotFound.DO_NOTHING: {
                // Insert nothing.
                finalToBeInserted = [];
                // Delete nothing.
                finalDeleteCount = 0;
                break;
            }
            default: {
                throw "Unhandled switch case.";
            }
        }
    }
    sortedArray.splice.apply(sortedArray, __spreadArray([arrayIndexLowBound, finalDeleteCount], finalToBeInserted, false));
}
exports.sortedArraySplice = sortedArraySplice;
function radiansToDegrees(angle) {
    // 57.2957795131 === 180 / Math.PI
    return angle * 57.2957795131;
}
exports.radiansToDegrees = radiansToDegrees;
function degreesToRadians(angle) {
    // 0.01745329251 === Math.PI / 180
    return angle * 0.01745329251;
}
exports.degreesToRadians = degreesToRadians;
function subtractNumbers(number0, number1) {
    // Obviously, this function is trivial, but I don't want to have to write it repeatedly.
    // It is used for the sake of comparators. The default is alphanumeric, instead of numeric.
    return number0 - number1;
}
exports.subtractNumbers = subtractNumbers;
function subtractNumbersNegated(number0, number1) {
    return number1 - number0;
}
exports.subtractNumbersNegated = subtractNumbersNegated;
// This function exists strictly to enable the following: array.map(parseInteger).
// array.map(Number.parseInt) does not work.
function parseInteger(string) {
    return Number.parseInt(string);
}
exports.parseInteger = parseInteger;
function minMaxHelper(comparator, array, condition) {
    if (array.length === 0) {
        return undefined;
    }
    var extremum = array[0];
    for (var i = 1; i < array.length; i++) {
        var t = array[i];
        if (condition(comparator(t, extremum))) {
            extremum = t;
        }
    }
    return extremum;
}
function min(comparator) {
    var array = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        array[_i - 1] = arguments[_i];
    }
    return minMaxHelper(comparator, array, function (n) {
        return n > 0;
    });
}
exports.min = min;
function max(comparator) {
    var array = [];
    for (var _i = 1; _i < arguments.length; _i++) {
        array[_i - 1] = arguments[_i];
    }
    return minMaxHelper(comparator, array, function (n) {
        return n < 0;
    });
}
exports.max = max;
function isEmpty(object) {
    for (var _key in object) {
        return false;
    }
    return true;
}
exports.isEmpty = isEmpty;
function getLineBoundingPath(v0, v1, invertArcsFlag, boundingPathRadius) {
    if (invertArcsFlag === void 0) { invertArcsFlag = false; }
    if (boundingPathRadius === void 0) { boundingPathRadius = 1; }
    var difference = (0, Vector2D_1.subtract)(v1, v0);
    var scaledOrthogonal = (0, Vector2D_1.scaleUp)((0, Vector2D_1.orthogonalize)(difference), boundingPathRadius / (0, Vector2D_1.magnitude)(difference));
    var v0TranslatedPositively = (0, Vector2D_1.add)(v0, scaledOrthogonal);
    var v0TranslatedNegatively = (0, Vector2D_1.subtract)(v0, scaledOrthogonal);
    var v1TranslatedPositively = (0, Vector2D_1.add)(v1, scaledOrthogonal);
    var v1TranslatedNegatively = (0, Vector2D_1.subtract)(v1, scaledOrthogonal);
    return "M ".concat(v0TranslatedPositively.x, " ").concat(v0TranslatedPositively.y, " A 1 1 0 0 ").concat(invertArcsFlag ? 1 : 0, " ").concat(v0TranslatedNegatively.x, " ").concat(v0TranslatedNegatively.y, " L ").concat(v1TranslatedNegatively.x, " ").concat(v1TranslatedNegatively.y, " A 1 1 0 0 ").concat(invertArcsFlag ? 1 : 0, " ").concat(v1TranslatedPositively.x, " ").concat(v1TranslatedPositively.y, " z");
}
exports.getLineBoundingPath = getLineBoundingPath;
function median(numbers) {
    numbers.sort(subtractNumbers);
    var middleIndex = numbers.length >> 1;
    if (numbers.length % 2 == 0) {
        return (numbers[middleIndex - 1] + numbers[middleIndex]) * 0.5;
    }
    else {
        return numbers[middleIndex];
    }
}
exports.median = median;
