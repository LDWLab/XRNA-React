import { sign } from "../utils/Utils";
import { Vector2D, add, crossProduct, distance, magnitudeSquared, orthogonalize, scaleUp, subtract } from "./Vector2D";

export type Circle = {
  center : Vector2D,
  radius : number
};

export type ParametricLine2D = {
  anchor : Vector2D,
  direction : Vector2D
};

export type Line2D = {
  v0 : Vector2D,
  v1 : Vector2D
};

export function intersect2dLines(l0 : ParametricLine2D, l1 : ParametricLine2D) : number | ParametricLine2D | null {
  let _crossProduct = crossProduct(l0.direction, l1.direction);
  if (sign(_crossProduct) === 0) {
    if (sign(crossProduct(subtract(l0.anchor, l1.anchor), l0.direction)) === 0) {
      return l0;
    } else {
      return null;
    }
  } else {
    return intersectNonparallel2dLines(l0, l1, _crossProduct);
  }
}

export function intersectNonparallel2dLines(l0 : ParametricLine2D, l1 : ParametricLine2D, denominator = crossProduct(l0.direction, l1.direction)) : number {
  // See https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
  return crossProduct(
    subtract(
      l1.anchor,
      l0.anchor
    ),
    l1.direction
  ) / denominator;
}

export function interpolate(l : ParametricLine2D, interpolationFactor : number) : Vector2D {
  return add(
    l.anchor,
    scaleUp(
      l.direction,
      interpolationFactor
    )
  );
}

export function getBoundingCircleGivenVectorsAreNotColinear(v0 : Vector2D, v1 : Vector2D, v2 : Vector2D) : Circle {
  let line0 = {
    anchor : scaleUp(
      add(
        v1,
        v2
      ),
      0.5
    ),
    direction : orthogonalize(
      subtract(
        v1,
        v2
      )
    )
  };
  let line1 = {
    anchor : scaleUp(
      add(
        v0,
        v2
      ),
      0.5
    ),
    direction : orthogonalize(
      subtract(
        v0,
        v2
      )
    )
  };
  let center = interpolate(
    line0,
    intersectNonparallel2dLines(
      line0,
      line1
    )
  );
  return {
    center,
    radius : distance(
      center,
      v0
    )
  };
}

export function getBoundingCircle(v0 : Vector2D, v1 : Vector2D, v2 : Vector2D) : Circle {
  let difference0 = subtract(v1, v2);
  let difference1 = subtract(v0, v2);
  if (sign(crossProduct(difference0, difference1)) === 0) {
    // The vectors are colinear.
    let indexOfMaximumValue = 0;
    let diameterSquared = [
      difference0,
      difference1,
      subtract(v1, v0)
    ].map(magnitudeSquared).reduce((previousValue : number, currentValue : number, currentIndex : number) => {
      if (currentValue >= previousValue) {
        indexOfMaximumValue = currentIndex;
        return currentValue;
      } else {
        return previousValue;
      }
    });
    let radius = Math.sqrt(diameterSquared) * 0.5;
    let boundingVertices : [Vector2D, Vector2D];
    switch (indexOfMaximumValue) {
      case 0 : {
        boundingVertices = [v1, v2];
        break;
      }
      case 1 : {
        boundingVertices = [v0, v2];
        break;
      }
      case 2 : {
        boundingVertices = [v0, v1];
        break;
      }
      default : {
        throw "This state should be impossible.";
      }
    }
    let center = scaleUp(
      add(
        boundingVertices[0],
        boundingVertices[1]
      ),
      0.5
    );
    return {
      center,
      radius
    };
  } else {
    return getBoundingCircleGivenVectorsAreNotColinear(
      v0,
      v1,
      v2
    );
  }
}