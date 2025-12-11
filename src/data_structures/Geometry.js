"use strict";
exports.__esModule = true;
exports.getBoundingCircle = exports.getBoundingCircleGivenVectorsAreNotColinear = exports.interpolate = exports.intersectNonparallel2dLines = exports.intersect2dLines = void 0;
var Utils_1 = require("../utils/Utils");
var Vector2D_1 = require("./Vector2D");
function intersect2dLines(l0, l1) {
    var _crossProduct = (0, Vector2D_1.crossProduct)(l0.direction, l1.direction);
    if ((0, Utils_1.sign)(_crossProduct) === 0) {
        if ((0, Utils_1.sign)((0, Vector2D_1.crossProduct)((0, Vector2D_1.subtract)(l0.anchor, l1.anchor), l0.direction)) === 0) {
            return l0;
        }
        else {
            return null;
        }
    }
    else {
        return intersectNonparallel2dLines(l0, l1, _crossProduct);
    }
}
exports.intersect2dLines = intersect2dLines;
function intersectNonparallel2dLines(l0, l1, denominator) {
    if (denominator === void 0) { denominator = (0, Vector2D_1.crossProduct)(l0.direction, l1.direction); }
    // See https://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect
    return (0, Vector2D_1.crossProduct)((0, Vector2D_1.subtract)(l1.anchor, l0.anchor), l1.direction) / denominator;
}
exports.intersectNonparallel2dLines = intersectNonparallel2dLines;
function interpolate(l, interpolationFactor) {
    return (0, Vector2D_1.add)(l.anchor, (0, Vector2D_1.scaleUp)(l.direction, interpolationFactor));
}
exports.interpolate = interpolate;
function getBoundingCircleGivenVectorsAreNotColinear(v0, v1, v2) {
    var line0 = {
        anchor: (0, Vector2D_1.scaleUp)((0, Vector2D_1.add)(v1, v2), 0.5),
        direction: (0, Vector2D_1.orthogonalize)((0, Vector2D_1.subtract)(v1, v2))
    };
    var line1 = {
        anchor: (0, Vector2D_1.scaleUp)((0, Vector2D_1.add)(v0, v2), 0.5),
        direction: (0, Vector2D_1.orthogonalize)((0, Vector2D_1.subtract)(v0, v2))
    };
    var center = interpolate(line0, intersectNonparallel2dLines(line0, line1));
    return {
        center: center,
        radius: (0, Vector2D_1.distance)(center, v0)
    };
}
exports.getBoundingCircleGivenVectorsAreNotColinear = getBoundingCircleGivenVectorsAreNotColinear;
function getBoundingCircle(v0, v1, v2) {
    var difference0 = (0, Vector2D_1.subtract)(v1, v2);
    var difference1 = (0, Vector2D_1.subtract)(v0, v2);
    if ((0, Utils_1.sign)((0, Vector2D_1.crossProduct)(difference0, difference1)) === 0) {
        // The vectors are colinear.
        var indexOfMaximumValue_1 = 0;
        var diameterSquared = [
            difference0,
            difference1,
            (0, Vector2D_1.subtract)(v1, v0)
        ].map(Vector2D_1.magnitudeSquared).reduce(function (previousValue, currentValue, currentIndex) {
            if (currentValue >= previousValue) {
                indexOfMaximumValue_1 = currentIndex;
                return currentValue;
            }
            else {
                return previousValue;
            }
        });
        var radius = Math.sqrt(diameterSquared) * 0.5;
        var boundingVertices = void 0;
        switch (indexOfMaximumValue_1) {
            case 0: {
                boundingVertices = [v1, v2];
                break;
            }
            case 1: {
                boundingVertices = [v0, v2];
                break;
            }
            case 2: {
                boundingVertices = [v0, v1];
                break;
            }
            default: {
                throw "This state should be impossible.";
            }
        }
        var center = (0, Vector2D_1.scaleUp)((0, Vector2D_1.add)(boundingVertices[0], boundingVertices[1]), 0.5);
        return {
            center: center,
            radius: radius
        };
    }
    else {
        return getBoundingCircleGivenVectorsAreNotColinear(v0, v1, v2);
    }
}
exports.getBoundingCircle = getBoundingCircle;
