"use strict";
exports.__esModule = true;
exports.MouseButtonIndices = exports.parseFloatReturnUndefinedOnFail = exports.parseIntReturnUndefinedOnFail = exports.numberToFormattedStringHelper = exports.FLOATING_POINT_REGEX = exports.ONE_OVER_LOG_OF_SCALE_BASE = exports.SCALE_BASE = exports.DEFAULT_BACKGROUND_COLOR_CSS_STRING = exports.DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT = exports.DEFAULT_TRANSLATION_MAGNITUDE = exports.DEFAULT_STROKE_WIDTH = void 0;
var Color_1 = require("../data_structures/Color");
exports.DEFAULT_STROKE_WIDTH = 0.2;
exports.DEFAULT_TRANSLATION_MAGNITUDE = 0.5;
exports.DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT = 2;
exports.DEFAULT_BACKGROUND_COLOR_CSS_STRING = (0, Color_1.toCSS)(Color_1.CHARCOAL_GRAY);
exports.SCALE_BASE = 1.1;
exports.ONE_OVER_LOG_OF_SCALE_BASE = 1 / Math.log(exports.SCALE_BASE);
exports.FLOATING_POINT_REGEX = "-?(?:(?:\\d+)|(?:(?:\\d+)?\\.\\d+))(?:e-?\\d+)?";
var numberToFormattedStringHelper = function (n, numberOfDecimalDigitsCount) {
    if (numberOfDecimalDigitsCount === void 0) { numberOfDecimalDigitsCount = exports.DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT; }
    return n.toFixed(numberOfDecimalDigitsCount);
};
exports.numberToFormattedStringHelper = numberToFormattedStringHelper;
var parseIntReturnUndefinedOnFail = function (s) {
    return /^-?(0x)?\d+$/.test(s) ? Number.parseInt(s) : undefined;
};
exports.parseIntReturnUndefinedOnFail = parseIntReturnUndefinedOnFail;
var parseFloatReturnUndefinedOnFail = function (s) {
    var attemptToString = Number.parseFloat(s);
    return Number.isNaN(attemptToString) ? undefined : attemptToString;
};
exports.parseFloatReturnUndefinedOnFail = parseFloatReturnUndefinedOnFail;
var MouseButtonIndices;
(function (MouseButtonIndices) {
    MouseButtonIndices[MouseButtonIndices["Left"] = 0] = "Left";
    MouseButtonIndices[MouseButtonIndices["Middle"] = 1] = "Middle";
    MouseButtonIndices[MouseButtonIndices["Right"] = 2] = "Right";
})(MouseButtonIndices = exports.MouseButtonIndices || (exports.MouseButtonIndices = {}));
;
