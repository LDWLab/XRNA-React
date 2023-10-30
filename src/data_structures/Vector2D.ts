import { DEFAULT_EPSILON, sign } from "../utils/Utils";
import { Line2D } from "./Geometry";

export type Vector2D = {
  x : number,
  y : number
};

export type PolarVector2D = {
  radius : number,
  angle : number
};

export function add(v0 : Vector2D, v1 : Vector2D) : Vector2D {
  return {
    x : v0.x + v1.x,
    y : v0.y + v1.y
  };
}

export function subtract(v0 : Vector2D, v1 : Vector2D) : Vector2D {
  return {
    x : v0.x - v1.x,
    y : v0.y - v1.y
  };
}

export function negate(v : Vector2D) : Vector2D {
  return scaleUp(v, -1);
}

export function scaleUp(v : Vector2D, scalar : number) : Vector2D {
  return {
    x : v.x * scalar,
    y : v.y * scalar
  };
}

export function scaleDown(v : Vector2D, scalar : number) : Vector2D {
  return scaleUp(v, 1.0 / scalar);
}

export function normalize(v : Vector2D) {
  return scaleDown(v, magnitude(v));
}

export function orthogonalizeRight(v : Vector2D) {
  // Equivalent to a 90-degree turn right.
  return {
    x : v.y, 
    y : -v.x
  };
}

export function orthogonalizeLeft(v : Vector2D) {
  // Equivalent to a 90-degree turn left.
  return {
    x : -v.y, 
    y : v.x
  };
}

export const orthogonalize = orthogonalizeLeft;

export function interpolate(v0 : Vector2D, v1 : Vector2D, interpolationFactor : number) : Vector2D {
  let oneMinusInterpolationFactor = 1 - interpolationFactor;
  return {
    x : oneMinusInterpolationFactor * v0.x + interpolationFactor * v1.x,
    y : oneMinusInterpolationFactor * v0.y + interpolationFactor * v1.y
  };
}

export function magnitudeSquared(v : Vector2D) : number {
  return (
    v.x * v.x +
    v.y * v.y
  );
}

export function magnitude(v : Vector2D) : number {
  return Math.sqrt(magnitudeSquared(v));
}

export function distanceSquared(v0 : Vector2D, v1 : Vector2D) : number {
  return magnitudeSquared(subtract(v0, v1));
}

export function distance(v0 : Vector2D, v1 : Vector2D) : number {
  return magnitude(subtract(v0, v1));
}

export function dotProduct(v0 : Vector2D, v1 : Vector2D) : number {
  return (
    v0.x * v1.x + 
    v0.y * v1.y
  );
}

export function crossProduct(v0 : Vector2D, v1 : Vector2D) {
  /*
              |i    j    k   |
  v0 x v1 == |v0.x v0.y v0.z|
              |v1.x v1.y v1.z|
  
  (v0 x v1) * k == v0.x * v1.y - v0.y * v1.x
  */
  return (
    v0.x * v1.y -
    v0.y * v1.x
  );
}

export function asAngle(v : Vector2D) : number {
  return Math.atan2(v.y, v.x);
}

export function toNormalCartesian(angle : number) {
  return {
    x : Math.cos(angle), 
    y : Math.sin(angle)
  };
}

export function toCartesian(p : PolarVector2D) : Vector2D {
  return scaleUp(
    toNormalCartesian(p.angle),
    p.radius
  );
}

export function toPolar(v : Vector2D) : PolarVector2D {
  return {
    radius : magnitude(v),
    angle : asAngle(v)
  };
}

export function angleBetween(v0 : Vector2D, v1 : Vector2D) : number {
  return Math.acos(dotProduct(v0, v1) / Math.sqrt(magnitudeSquared(v0) * magnitudeSquared(v1)));
}

export function angleBetweenNormalVectors(v0 : Vector2D, v1 : Vector2D) : number {
  return Math.acos(dotProduct(v0, v1));
}

export function scalarProject(v : Vector2D, direction : Vector2D) {
  return dotProduct(v, direction) / magnitude(direction);
}

export function project(v : Vector2D, direction : Vector2D) : Vector2D {
  return scaleUp(direction, dotProduct(v, direction) / magnitudeSquared(direction));
}

export function reject(v : Vector2D, direction : Vector2D) : Vector2D {
  return subtract(v, project(v, direction));
}

export function projectAndReject(v : Vector2D, direction : Vector2D) : { projection : Vector2D, rejection : Vector2D } {
  const projection = project(v, direction);
  const rejection = subtract(v, projection);
  return {
    projection,
    rejection
  }
}

export function projectUsingNormalDirection(v : Vector2D, normalDirection : Vector2D) {
  return scaleUp(normalDirection, dotProduct(v, normalDirection));
}

export function rejectUsingNormalDirection(v : Vector2D, normalDirection : Vector2D) {
  return subtract(v, projectUsingNormalDirection(v, normalDirection));
}

export function projectAndRejectUsingNormalDirection(v : Vector2D, normalDirection : Vector2D) {
  const projection = projectUsingNormalDirection(v, normalDirection);
  const rejection = subtract(v, projection);
  return {
    projection,
    rejection
  }
}

export function rotationDirection(dv0 : Vector2D, dv1 : Vector2D) {
  return sign(crossProduct(dv0, dv1));
}

export function distanceSquaredBetweenVector2DAndLineSegment(
  vector : Vector2D,
  lineSegment : Line2D,
  epsilonSquared = DEFAULT_EPSILON * DEFAULT_EPSILON
) {
  const dv = subtract(
    lineSegment.v1,
    lineSegment.v0
  );
  const magnitudeSquared_ = magnitudeSquared(dv);
  if (magnitudeSquared_ >= epsilonSquared) {
    return distance(
      vector,
      lineSegment.v0
    );
  } else {
    let interpolationFactor = dotProduct(
      subtract(
        vector,
        lineSegment.v0
      ),
      dv
    );
    if (interpolationFactor < 0) {
      interpolationFactor = 0;
    } else if (interpolationFactor > 1) {
      interpolationFactor = 1;
    }
    const interpolatedVector = interpolate(
      lineSegment.v0,
      lineSegment.v1,
      interpolationFactor
    );
    return distanceSquared(
      vector,
      interpolatedVector
    );
  }
}