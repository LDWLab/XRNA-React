"use strict";
exports.__esModule = true;
exports.distanceSquaredBetweenVector2DAndLineSegment = exports.rotationDirection = exports.projectAndRejectUsingNormalDirection = exports.rejectUsingNormalDirection = exports.projectUsingNormalDirection = exports.projectAndReject = exports.reject = exports.project = exports.scalarProject = exports.angleBetweenNormalVectors = exports.angleBetween = exports.toPolar = exports.toCartesian = exports.toNormalCartesian = exports.asAngle = exports.crossProduct = exports.dotProduct = exports.distance = exports.distanceSquared = exports.magnitude = exports.magnitudeSquared = exports.interpolate = exports.orthogonalize = exports.orthogonalizeLeft = exports.orthogonalizeRight = exports.normalize = exports.scaleDown = exports.scaleUp = exports.negate = exports.subtract = exports.add = void 0;
var Utils_1 = require("../utils/Utils");
function add(v0, v1) {
    return {
        x: v0.x + v1.x,
        y: v0.y + v1.y
    };
}
exports.add = add;
function subtract(v0, v1) {
    return {
        x: v0.x - v1.x,
        y: v0.y - v1.y
    };
}
exports.subtract = subtract;
function negate(_a) {
    var x = _a.x, y = _a.y;
    return {
        x: -x,
        y: -y
    };
}
exports.negate = negate;
function scaleUp(_a, scalar) {
    var x = _a.x, y = _a.y;
    return {
        x: x * scalar,
        y: y * scalar
    };
}
exports.scaleUp = scaleUp;
function scaleDown(v, scalar) {
    return scaleUp(v, 1.0 / scalar);
}
exports.scaleDown = scaleDown;
function normalize(v) {
    return scaleDown(v, magnitude(v));
}
exports.normalize = normalize;
function orthogonalizeRight(_a) {
    var x = _a.x, y = _a.y;
    // Equivalent to a 90-degree turn right.
    return {
        x: y,
        y: -x
    };
}
exports.orthogonalizeRight = orthogonalizeRight;
function orthogonalizeLeft(_a) {
    var x = _a.x, y = _a.y;
    // Equivalent to a 90-degree turn left.
    return {
        x: -y,
        y: x
    };
}
exports.orthogonalizeLeft = orthogonalizeLeft;
exports.orthogonalize = orthogonalizeLeft;
function interpolate(v0, v1, interpolationFactor) {
    var oneMinusInterpolationFactor = 1 - interpolationFactor;
    return {
        x: oneMinusInterpolationFactor * v0.x + interpolationFactor * v1.x,
        y: oneMinusInterpolationFactor * v0.y + interpolationFactor * v1.y
    };
}
exports.interpolate = interpolate;
function magnitudeSquared(_a) {
    var x = _a.x, y = _a.y;
    return (x * x +
        y * y);
}
exports.magnitudeSquared = magnitudeSquared;
function magnitude(v) {
    return Math.sqrt(magnitudeSquared(v));
}
exports.magnitude = magnitude;
function distanceSquared(v0, v1) {
    return magnitudeSquared(subtract(v0, v1));
}
exports.distanceSquared = distanceSquared;
function distance(v0, v1) {
    return magnitude(subtract(v0, v1));
}
exports.distance = distance;
function dotProduct(v0, v1) {
    return (v0.x * v1.x +
        v0.y * v1.y);
}
exports.dotProduct = dotProduct;
function crossProduct(v0, v1) {
    /*
                |i    j    k   |
    v0 x v1 == |v0.x v0.y v0.z|
                |v1.x v1.y v1.z|
    
    (v0 x v1) * k == v0.x * v1.y - v0.y * v1.x
    */
    return (v0.x * v1.y -
        v0.y * v1.x);
}
exports.crossProduct = crossProduct;
function asAngle(_a) {
    var x = _a.x, y = _a.y;
    return Math.atan2(y, x);
}
exports.asAngle = asAngle;
function toNormalCartesian(angle) {
    return {
        x: Math.cos(angle),
        y: Math.sin(angle)
    };
}
exports.toNormalCartesian = toNormalCartesian;
function toCartesian(p) {
    return scaleUp(toNormalCartesian(p.angle), p.radius);
}
exports.toCartesian = toCartesian;
function toPolar(v) {
    return {
        radius: magnitude(v),
        angle: asAngle(v)
    };
}
exports.toPolar = toPolar;
function angleBetween(v0, v1) {
    return Math.acos(dotProduct(v0, v1) / Math.sqrt(magnitudeSquared(v0) * magnitudeSquared(v1)));
}
exports.angleBetween = angleBetween;
function angleBetweenNormalVectors(v0, v1) {
    return Math.acos(dotProduct(v0, v1));
}
exports.angleBetweenNormalVectors = angleBetweenNormalVectors;
function scalarProject(v, direction) {
    return dotProduct(v, direction) / magnitude(direction);
}
exports.scalarProject = scalarProject;
function project(v, direction) {
    return scaleUp(direction, dotProduct(v, direction) / magnitudeSquared(direction));
}
exports.project = project;
function reject(v, direction) {
    return subtract(v, project(v, direction));
}
exports.reject = reject;
function projectAndReject(v, direction) {
    var projection = project(v, direction);
    var rejection = subtract(v, projection);
    return {
        projection: projection,
        rejection: rejection
    };
}
exports.projectAndReject = projectAndReject;
function projectUsingNormalDirection(v, normalDirection) {
    return scaleUp(normalDirection, dotProduct(v, normalDirection));
}
exports.projectUsingNormalDirection = projectUsingNormalDirection;
function rejectUsingNormalDirection(v, normalDirection) {
    return subtract(v, projectUsingNormalDirection(v, normalDirection));
}
exports.rejectUsingNormalDirection = rejectUsingNormalDirection;
function projectAndRejectUsingNormalDirection(v, normalDirection) {
    var projection = projectUsingNormalDirection(v, normalDirection);
    var rejection = subtract(v, projection);
    return {
        projection: projection,
        rejection: rejection
    };
}
exports.projectAndRejectUsingNormalDirection = projectAndRejectUsingNormalDirection;
function rotationDirection(dv0, dv1) {
    return (0, Utils_1.sign)(crossProduct(dv0, dv1));
}
exports.rotationDirection = rotationDirection;
function distanceSquaredBetweenVector2DAndLineSegment(vector, lineSegment, epsilonSquared) {
    if (epsilonSquared === void 0) { epsilonSquared = Utils_1.DEFAULT_EPSILON * Utils_1.DEFAULT_EPSILON; }
    var dv = subtract(lineSegment.v1, lineSegment.v0);
    var magnitudeSquared_ = magnitudeSquared(dv);
    if (magnitudeSquared_ >= epsilonSquared) {
        return distance(vector, lineSegment.v0);
    }
    else {
        var interpolationFactor = dotProduct(subtract(vector, lineSegment.v0), dv);
        if (interpolationFactor < 0) {
            interpolationFactor = 0;
        }
        else if (interpolationFactor > 1) {
            interpolationFactor = 1;
        }
        var interpolatedVector = interpolate(lineSegment.v0, lineSegment.v1, interpolationFactor);
        return distanceSquared(vector, interpolatedVector);
    }
}
exports.distanceSquaredBetweenVector2DAndLineSegment = distanceSquaredBetweenVector2DAndLineSegment;
