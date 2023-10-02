import { CHARCOAL_GRAY, toCSS } from "../data_structures/Color";

export const DEFAULT_STROKE_WIDTH = 0.2;
export const DEFAULT_TRANSLATION_MAGNITUDE = 0.5;
export const DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT = 2;
export const DEFAULT_BACKGROUND_COLOR_CSS_STRING = toCSS(CHARCOAL_GRAY);
export const SCALE_BASE = 1.1;
export const ONE_OVER_LOG_OF_SCALE_BASE = 1 / Math.log(SCALE_BASE);

export const FLOATING_POINT_REGEX = "-?(?:(?:\\d+)|(?:(?:\\d+)?\\.\\d+))(?:e-?\\d+)?";

export const numberToFormattedStringHelper = function(n : number, numberOfDecimalDigitsCount = DEFAULT_FORMATTED_NUMBER_DECIMAL_DIGITS_COUNT) {
  return n.toFixed(numberOfDecimalDigitsCount);
};
export const parseIntReturnUndefinedOnFail = function(s : string) {
  return /^-?(0x)?\d+$/.test(s) ? Number.parseInt(s) : undefined;
}
export const parseFloatReturnUndefinedOnFail = function(s : string) {
  let attemptToString = Number.parseFloat(s);
  return Number.isNaN(attemptToString) ? undefined : attemptToString;
}

export enum MouseButtonIndices {
  Left = 0,
  Middle = 1,
  Right = 2
};