export const DEFAULT_EPSILON = 1E-7;

export function flattenRecord<K extends string | number | symbol, T>(record : Record<K, T>, parser : (keyAsString : string) => K) {
  const output = Object.entries(record) as Array<[string | K, T]>;
  for (let i = 0; i < output.length; i++) {
    output[i][0] = parser(output[i][0] as string);
  }
  return output as Array<[K, T]>;
}

export function flattenRecordWithIntegerKeys<T>(record : Record<number, T>) {
  return flattenRecord(record, Number.parseInt);
}

export function flattenRecordWithNumberKeys<T>(record : Record<number, T>) {
  return flattenRecord(record, Number.parseFloat);
}

export function flattenRecordWithStringKeys<T>(record : Record<string, T>) {
  return flattenRecord(record, function(s : string) {
    return s;
  });
}
export function sign(n : number, epsilon = DEFAULT_EPSILON) : -1 | 0 | 1 {
  return n < -epsilon ? -1 : n < epsilon ? 0 : 1;
}

export function compare(n0 : number, n1 : number, epsilon = DEFAULT_EPSILON) : number {
  return sign(n0 - n1, epsilon);
}

export function areEqual(n0 : number, n1 : number, epsilon = DEFAULT_EPSILON) : boolean {
  return compare(n0, n1, epsilon) === 0;
}

export function binarySearch<T>(array : Array<T>, comparator : (t : T) => number) : { arrayEntry : T, arrayIndex : number } | null {
  if (array.length === 0) {
    return null;
  }
  let arrayIndexLowBound = 0;
  let arrayIndexHighBound = array.length - 1;
  while (true) {
    let arrayIndex = (arrayIndexLowBound + arrayIndexHighBound) >> 1;
    let arrayEntry = array[arrayIndex];
    let comparison = comparator(arrayEntry);
    if (comparison === 0) {
      return {
        arrayEntry,
        arrayIndex
      };
    }
    if (comparison > 0) {
      arrayIndexHighBound = arrayIndex - 1;
    } else {
      arrayIndexLowBound = arrayIndex + 1;
    }
    if (arrayIndexLowBound > arrayIndexHighBound) {
      break;
    }
  }
  return null;
}

export enum HandleQueryNotFound {
  THROW_ERROR = "Throw error",
  DELETE_AND_ADD = "Delete and add",
  DELETE = "Delete",
  ADD = "Add",
  DO_NOTHING = "Do nothing"
}

export function sortedArraySplice<T>(
  sortedArray : Array<T>,
  comparator : (t : T) => number,
  deleteCount : number,
  toBeInserted : Array<T> = [],
  handleQueryNotFound = HandleQueryNotFound.THROW_ERROR
) {
  let arrayIndexLowBound = 0;
  let arrayIndexHighBound = sortedArray.length - 1;
  let queryNotFoundFlag = true;
  while (arrayIndexLowBound <= arrayIndexHighBound) {
    let arrayIndex = (arrayIndexLowBound + arrayIndexHighBound) >> 1;
    let comparison = comparator(sortedArray[arrayIndex]);
    if (comparison === 0) {
      arrayIndexLowBound = arrayIndex;
      queryNotFoundFlag = false;
      break;
    }
    if (comparison > 0) {
      arrayIndexHighBound = arrayIndex - 1;
    } else {
      arrayIndexLowBound = arrayIndex + 1;
    }
  }
  let finalDeleteCount = deleteCount;
  let finalToBeInserted = toBeInserted;
  if (queryNotFoundFlag) {
    switch (handleQueryNotFound) {
      case HandleQueryNotFound.THROW_ERROR : {
        throw "The query was not found within the input sorted array.";
      }
      case HandleQueryNotFound.DELETE_AND_ADD : {
        // Insert and delete.
        break;
      }
      case HandleQueryNotFound.DELETE : {
        // Insert nothing.
        finalToBeInserted = [];
        break;
      }
      case HandleQueryNotFound.ADD : {
        // Delete nothing.
        finalDeleteCount = 0;
        break;
      }
      case HandleQueryNotFound.DO_NOTHING : {
        // Insert nothing.
        finalToBeInserted = [];
        finalDeleteCount = 0;
        break;
      }
      default : {
        throw "Unhandled switch case.";
      }
    }
  }
  sortedArray.splice(arrayIndexLowBound, finalDeleteCount, ...finalToBeInserted);
}

export function radiansToDegrees(angle : number) {
  // 57.2957795131 === 180 / Math.PI
  return angle * 57.2957795131;
}

export function degreesToRadians(angle : number) {
  // 0.01745329251 === Math.PI / 180
  return angle * 0.01745329251;
}

export function subtractNumbers(
  number0 : number,
  number1 : number
) {
  // Obviously, this function is trivial, but I don't want to have to write it repeatedly.
  // It is used for the sake of comparators. The default is alphanumeric, instead of numeric.
  return number0 - number1;
}

export function subtractNumbersNegated(
  number0 : number,
  number1 : number
) {
  return number1 - number0;
}

// This function exists strictly to enable the following: array.map(parseInteger).
// array.map(Number.parseInt) does not work.
export function parseInteger(string : string) {
  return Number.parseInt(string);
}

function minMaxHelper<T>(
  comparator : (t0 : T, t1 : T) => number,
  array : Array<T>,
  condition : (n : number) => boolean
) : T | undefined {
    if (array.length === 0) {
      return undefined;
    }
    let extremum = array[0];
    for (let i = 1; i < array.length; i++) {
      let t = array[i];
      if (condition(comparator(t, extremum))) {
        extremum = t;
      }
    }
    return extremum;
}

export function min<T>(
  comparator : (t0 : T, t1 : T) => number,
  ...array : Array<T>
) {
  return minMaxHelper(
    comparator,
    array,
    function(n : number) {
      return n > 0;
    } 
  );
}

export function max<T>(
  comparator : (t0 : T, t1 : T) => number,
  ...array : Array<T>
) {
  return minMaxHelper(
    comparator,
    array,
    function(n : number) {
      return n < 0;
    } 
  );
}