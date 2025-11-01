"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.parseGraphicalData = void 0;
var BasePair_1 = require("../components/app_specific/BasePair");
var RnaComplex_1 = require("../components/app_specific/RnaComplex");
var Vector2D_1 = require("../data_structures/Vector2D");
var Utils_1 = require("../utils/Utils");
var EPSILON_SQUARED = 1e-8;
var SCALARS_TO_TRY = [1, 1.5, 2, 2.5, 3, 3.5, 4];
var INCREASED_NUMBER_OF_NEIGHBORING_NUCLEOTIDES = {
    line: 5,
    center: 10
};
var constraints = {
    // For now, some of these constraints are equal. They will be adjusted accordingly upon testing input data.
    loose: {
        minimumDistanceRatio: 0.8,
        dotProductThreshold: Math.cos((0, Utils_1.degreesToRadians)(160))
    },
    normal: {
        minimumDistanceRatio: 0.8,
        dotProductThreshold: Math.cos((0, Utils_1.degreesToRadians)(170))
    },
    strict: {
        minimumDistanceRatio: 0.895,
        dotProductThreshold: Math.cos((0, Utils_1.degreesToRadians)(175))
    }
};
var TOO_FEW_NUCLEOTIDES_ERROR = "Too few nucleotides exist within the RNA complex (the number is less than the required number).";
function parseGraphicalData(rnaComplexProps, basePairLines, basePairCenters, graphicalAdjustments, labelLines, labelContents) {
    var _a, _b, _c, _d, _e, _f, _g, _h;
    if (graphicalAdjustments === void 0) { graphicalAdjustments = {}; }
    var allKeys = __spreadArray(["undefined"], BasePair_1["default"].canonicalTypes, true);
    var adjustedNucleotidePositions = {};
    var _loop_1 = function (rnaComplexIndexAsString, singularRnaComplexProps) {
        var _u, _v;
        var rnaComplexIndex = Number.parseInt(rnaComplexIndexAsString);
        var basePairLinesPerRnaComplex = basePairLines[rnaComplexIndex];
        var basePairCentersPerRnaComplex = basePairCenters[rnaComplexIndex];
        var graphicalAdjustmentsPerRnaComplex = (_a = graphicalAdjustments[rnaComplexIndex]) !== null && _a !== void 0 ? _a : {};
        adjustedNucleotidePositions[rnaComplexIndex] = {};
        var adjustedNucleotidePositionsPerRnaComplex = adjustedNucleotidePositions[rnaComplexIndex];
        var flattenedNucleotideProps = [];
        for (var _w = 0, _x = Object.entries(singularRnaComplexProps.rnaMoleculeProps); _w < _x.length; _w++) {
            var _y = _x[_w], rnaMoleculeName = _y[0], singularRnaMoleculeProps = _y[1];
            adjustedNucleotidePositionsPerRnaComplex[rnaMoleculeName] = {};
            var adjustedNucleotidePositionsPerRnaMolecule = adjustedNucleotidePositionsPerRnaComplex[rnaMoleculeName];
            var graphicalAdjustmentsPerRnaMolecule = (_b = graphicalAdjustmentsPerRnaComplex[rnaMoleculeName]) !== null && _b !== void 0 ? _b : {};
            for (var _z = 0, _0 = Object.entries(singularRnaMoleculeProps.nucleotideProps); _z < _0.length; _z++) {
                var _1 = _0[_z], nucleotideIndexAsString = _1[0], singularNucleotideProps = _1[1];
                var nucleotideIndex = Number.parseInt(nucleotideIndexAsString);
                var graphicalAdjustment = (_c = graphicalAdjustmentsPerRnaMolecule[nucleotideIndex]) !== null && _c !== void 0 ? _c : {
                    x: 0,
                    y: 0
                };
                var adjustedPosition = {
                    x: singularNucleotideProps.x - graphicalAdjustment.x * 0.5,
                    y: singularNucleotideProps.y + graphicalAdjustment.y
                };
                adjustedNucleotidePositionsPerRnaMolecule[nucleotideIndex] = adjustedPosition;
                flattenedNucleotideProps.push({
                    indices: {
                        rnaMoleculeName: rnaMoleculeName,
                        nucleotideIndex: nucleotideIndex,
                        arrayIndex: flattenedNucleotideProps.length
                    },
                    singularNucleotideProps: singularNucleotideProps,
                    adjustedPosition: adjustedPosition
                });
            }
        }
        var labelLinesPerRnaComplex = labelLines[rnaComplexIndex];
        var labelContentsPerRnaComplex = labelContents[rnaComplexIndex];
        function createLabel(_a, arrayIndex) {
            var vectorNearNucleotide = _a.vectorNearNucleotide, vectorNearLabelContent = _a.vectorNearLabelContent, labelContent = _a.labelContent, labelContentDimensions = _a.labelContentDimensions;
            var _b = flattenedNucleotideProps[arrayIndex], singularNucleotideProps = _b.singularNucleotideProps, adjustedPosition = _b.adjustedPosition;
            singularNucleotideProps.labelLineProps = {
                points: [
                    (0, Vector2D_1.subtract)(vectorNearNucleotide, adjustedPosition),
                    (0, Vector2D_1.subtract)(vectorNearLabelContent, adjustedPosition)
                ]
            };
            labelContent.x += labelContentDimensions.width * 0.5 - adjustedPosition.x;
            labelContent.y += -labelContentDimensions.height * 0.5 - adjustedPosition.y;
            singularNucleotideProps.labelContentProps = labelContent;
        }
        if (labelLinesPerRnaComplex.length > 0) {
            var pairedLabelData = new Array();
            var pairedLabelDataCandidates = {};
            for (var _2 = 0, labelContentsPerRnaComplex_1 = labelContentsPerRnaComplex; _2 < labelContentsPerRnaComplex_1.length; _2++) {
                var _3 = labelContentsPerRnaComplex_1[_2], labelContent = _3.labelContent, rectangle = _3.rectangle;
                var x = labelContent.x, y = labelContent.y;
                var width = rectangle.width, height = rectangle.height;
                var vectors = [
                    {
                        x: x,
                        y: y
                    },
                    {
                        x: x + width,
                        y: y
                    },
                    {
                        x: x + width,
                        y: y - height
                    },
                    {
                        x: x,
                        y: y - height
                    }
                ];
                var sides = [
                    {
                        v0: vectors[0],
                        v1: vectors[1]
                    },
                    {
                        v0: vectors[1],
                        v1: vectors[2]
                    },
                    {
                        v0: vectors[2],
                        v1: vectors[3]
                    },
                    {
                        v0: vectors[3],
                        v1: vectors[0]
                    }
                ];
                var closestDistanceData = {
                    distanceSquared: Number.POSITIVE_INFINITY,
                    vectorNearNucleotide: labelLinesPerRnaComplex[0].v0,
                    vectorNearLabelContent: labelLinesPerRnaComplex[0].v1,
                    labelLineIndex: NaN
                };
                for (var labelLineIndex_1 = 0; labelLineIndex_1 < labelLinesPerRnaComplex.length; labelLineIndex_1++) {
                    var labelLine = labelLinesPerRnaComplex[labelLineIndex_1];
                    var v0 = labelLine.v0, v1 = labelLine.v1;
                    for (var _4 = 0, _5 = [{ vector: v0, otherVector: v1 }, { vector: v1, otherVector: v0 }]; _4 < _5.length; _4++) {
                        var _6 = _5[_4], vector = _6.vector, otherVector = _6.otherVector;
                        for (var _7 = 0, sides_1 = sides; _7 < sides_1.length; _7++) {
                            var side = sides_1[_7];
                            var distanceSquared_ = (0, Vector2D_1.distanceSquaredBetweenVector2DAndLineSegment)(vector, side);
                            if (distanceSquared_ < closestDistanceData.distanceSquared) {
                                closestDistanceData = {
                                    distanceSquared: distanceSquared_,
                                    vectorNearNucleotide: otherVector,
                                    vectorNearLabelContent: vector,
                                    labelLineIndex: labelLineIndex_1
                                };
                            }
                        }
                    }
                }
                var labelLineIndex = closestDistanceData.labelLineIndex, vectorNearNucleotide = closestDistanceData.vectorNearNucleotide, vectorNearLabelContent = closestDistanceData.vectorNearLabelContent, distanceSquared_1 = closestDistanceData.distanceSquared;
                if (!(labelLineIndex in pairedLabelDataCandidates)) {
                    pairedLabelDataCandidates[labelLineIndex] = [];
                }
                pairedLabelDataCandidates[labelLineIndex].push({
                    vectorNearNucleotide: vectorNearNucleotide,
                    vectorNearLabelContent: vectorNearLabelContent,
                    labelContent: labelContent,
                    distanceSquared: distanceSquared_1,
                    labelContentDimensions: rectangle
                });
            }
            for (var _8 = 0, _9 = Object.entries(pairedLabelDataCandidates); _8 < _9.length; _8++) {
                var _10 = _9[_8], labelLineIndexAsString = _10[0], pairedLabelDataCandidateArray = _10[1];
                var labelLineIndex = Number.parseInt(labelLineIndexAsString);
                pairedLabelDataCandidateArray.sort(function (candidate0, candidate1) {
                    return candidate0.distanceSquared - candidate1.distanceSquared;
                });
                // It is less consequential to get labels wrong. Therefore, more distant label contents will simply be discarded.
                pairedLabelData.push(__assign(__assign({}, pairedLabelDataCandidateArray[0]), { labelLineIndex: labelLineIndex }));
            }
            var nucleotideIndexDeltaMultiplicities = {};
            var failedLabels_3 = new Array;
            for (var _11 = 0, pairedLabelData_1 = pairedLabelData; _11 < pairedLabelData_1.length; _11++) {
                var pairedLabelDatum = pairedLabelData_1[_11];
                var labelLineIndex = pairedLabelDatum.labelLineIndex, labelContent = pairedLabelDatum.labelContent, distanceSquared_2 = pairedLabelDatum.distanceSquared, vectorNearNucleotide = pairedLabelDatum.vectorNearNucleotide, vectorNearLabelContent = pairedLabelDatum.vectorNearLabelContent, labelContentDimensions = pairedLabelDatum.labelContentDimensions;
                var unfilteredNucleotideData = calculateNucleotideData(findClosestNucleotides(vectorNearNucleotide, 7).sliced, vectorNearNucleotide);
                var filteredNucleotideData = new Array();
                var labelLine = labelLinesPerRnaComplex[labelLineIndex];
                var labelLineDv = (0, Vector2D_1.normalize)((0, Vector2D_1.subtract)(vectorNearLabelContent, vectorNearNucleotide));
                var labelContentAsNumber = undefined;
                if (/^-?\d+$/.test(labelContent.content)) {
                    labelContentAsNumber = Number.parseInt(labelContent.content);
                }
                for (var _12 = 0, unfilteredNucleotideData_1 = unfilteredNucleotideData; _12 < unfilteredNucleotideData_1.length; _12++) {
                    var nucleotideDataI = unfilteredNucleotideData_1[_12];
                    var indices = nucleotideDataI.indices, dv = nucleotideDataI.dv, distance_1 = nucleotideDataI.distance;
                    dv = (0, Vector2D_1.normalize)(dv);
                    var dotProductI = (0, Vector2D_1.dotProduct)(labelLineDv, dv);
                    if (dotProductI >= constraints.loose.dotProductThreshold) {
                        continue;
                    }
                    filteredNucleotideData.push({
                        indices: indices,
                        distance: distance_1
                    });
                }
                switch (filteredNucleotideData.length) {
                    case 1: {
                        var indices = filteredNucleotideData[0].indices;
                        if (labelContentAsNumber !== undefined) {
                            var nucleotideIndexDelta = labelContentAsNumber - indices.nucleotideIndex;
                            if (!(nucleotideIndexDelta in nucleotideIndexDeltaMultiplicities)) {
                                nucleotideIndexDeltaMultiplicities[nucleotideIndexDelta] = {
                                    multiplicity: 0,
                                    candidates: []
                                };
                            }
                            var multiplicityData = nucleotideIndexDeltaMultiplicities[nucleotideIndexDelta];
                            multiplicityData.multiplicity++;
                            multiplicityData.candidates.push({
                                pairedLabelDatum: pairedLabelDatum,
                                arrayIndex: indices.arrayIndex,
                                labelContentAsNumber: labelContentAsNumber,
                                unfilteredNucleotideData: unfilteredNucleotideData
                            });
                        }
                        break;
                    }
                    default: {
                        failedLabels_3.push({
                            unfilteredNucleotideData: unfilteredNucleotideData,
                            pairedLabelDatum: pairedLabelDatum,
                            labelContentAsNumber: labelContentAsNumber
                        });
                        break;
                    }
                }
            }
            function createLabelWithSmallestDistance(pairedLabelDatum, unfilteredNucleotideData, minimumDistanceRatio, maximumDistanceRatio) {
                if (minimumDistanceRatio !== undefined &&
                    maximumDistanceRatio !== undefined) {
                    var distanceRatio = (0, Vector2D_1.distanceSquared)(pairedLabelDatum.labelContent, pairedLabelDatum.vectorNearLabelContent) / (0, Vector2D_1.distanceSquared)(pairedLabelDatum.vectorNearLabelContent, pairedLabelDatum.vectorNearNucleotide);
                    if (distanceRatio < minimumDistanceRatio ||
                        distanceRatio > maximumDistanceRatio) {
                        return;
                    }
                }
                unfilteredNucleotideData.sort(function (unfilteredNucleotideDatum0, unfilteredNucleotideDatum1) {
                    return unfilteredNucleotideDatum0.distance - unfilteredNucleotideDatum1.distance;
                });
                var arrayIndex = unfilteredNucleotideData[0].indices.arrayIndex;
                // if (flattenedNucleotideProps[arrayIndex].singularNucleotideProps.labelContentProps === undefined) {
                createLabel(pairedLabelDatum, arrayIndex);
                // }
            }
            var nucleotideIndexDeltaMultiplicitiesEntries = Object.entries(nucleotideIndexDeltaMultiplicities);
            if (nucleotideIndexDeltaMultiplicitiesEntries.length === 0) {
                for (var _13 = 0, failedLabels_1 = failedLabels_3; _13 < failedLabels_1.length; _13++) {
                    var _14 = failedLabels_1[_13], unfilteredNucleotideData = _14.unfilteredNucleotideData, pairedLabelDatum = _14.pairedLabelDatum;
                    createLabelWithSmallestDistance(pairedLabelDatum, unfilteredNucleotideData);
                }
            }
            else {
                var nucleotideIndexDeltasSortedByMultiplicities = nucleotideIndexDeltaMultiplicitiesEntries.map(function (_a) {
                    var nucleotideIndexDeltaAsString = _a[0], multiplicityData = _a[1];
                    return {
                        nucleotideIndexDelta: Number.parseInt(nucleotideIndexDeltaAsString),
                        multiplicityData: multiplicityData
                    };
                }).sort(function (nucleotideIndexDeltaWithMultiplicity0, nucleotideIndexDeltaWithMultiplicity1) {
                    return nucleotideIndexDeltaWithMultiplicity1.multiplicityData.multiplicity - nucleotideIndexDeltaWithMultiplicity0.multiplicityData.multiplicity;
                });
                var totalNucleotideIndexDeltasMultiplicity_1 = 0;
                for (var _15 = 0, nucleotideIndexDeltasSortedByMultiplicities_1 = nucleotideIndexDeltasSortedByMultiplicities; _15 < nucleotideIndexDeltasSortedByMultiplicities_1.length; _15++) {
                    var _16 = nucleotideIndexDeltasSortedByMultiplicities_1[_15], nucleotideIndexDelta = _16.nucleotideIndexDelta, multiplicityData = _16.multiplicityData;
                    totalNucleotideIndexDeltasMultiplicity_1 += multiplicityData.multiplicity;
                }
                var multiplicityData0 = nucleotideIndexDeltasSortedByMultiplicities[0];
                var minimumDistanceSquaredRatioForLabels = Number.POSITIVE_INFINITY;
                var maximumDistanceSquaredRatioForLabels = Number.NEGATIVE_INFINITY;
                for (var _17 = 0, _18 = multiplicityData0.multiplicityData.candidates; _17 < _18.length; _17++) {
                    var pairedLabelDatum = _18[_17].pairedLabelDatum;
                    var distanceSquaredRatioForLabel = (0, Vector2D_1.distanceSquared)(pairedLabelDatum.labelContent, pairedLabelDatum.vectorNearLabelContent) / (0, Vector2D_1.distanceSquared)(pairedLabelDatum.vectorNearLabelContent, pairedLabelDatum.vectorNearNucleotide);
                    if (distanceSquaredRatioForLabel < minimumDistanceSquaredRatioForLabels) {
                        minimumDistanceSquaredRatioForLabels = distanceSquaredRatioForLabel;
                    }
                    if (distanceSquaredRatioForLabel > maximumDistanceSquaredRatioForLabels) {
                        maximumDistanceSquaredRatioForLabels = distanceSquaredRatioForLabel;
                    }
                }
                nucleotideIndexDeltasSortedByMultiplicities = nucleotideIndexDeltasSortedByMultiplicities.filter(function (_a) {
                    var nucleotideIndexDelta = _a.nucleotideIndexDelta, multiplicityData = _a.multiplicityData;
                    var filterFlag = (multiplicityData.multiplicity > 1 &&
                        multiplicityData.multiplicity / totalNucleotideIndexDeltasMultiplicity_1 > 0.05);
                    if (filterFlag) {
                        for (var _i = 0, _b = multiplicityData.candidates; _i < _b.length; _i++) {
                            var _c = _b[_i], pairedLabelDatum = _c.pairedLabelDatum, arrayIndex = _c.arrayIndex;
                            createLabel(pairedLabelDatum, arrayIndex);
                        }
                    }
                    else {
                        for (var _d = 0, _e = multiplicityData.candidates; _d < _e.length; _d++) {
                            var _f = _e[_d], pairedLabelDatum = _f.pairedLabelDatum, arrayIndex = _f.arrayIndex, labelContentAsNumber = _f.labelContentAsNumber, unfilteredNucleotideData = _f.unfilteredNucleotideData;
                            failedLabels_3.push({
                                unfilteredNucleotideData: unfilteredNucleotideData,
                                pairedLabelDatum: pairedLabelDatum,
                                labelContentAsNumber: labelContentAsNumber
                            });
                        }
                    }
                    return filterFlag;
                });
                for (var _19 = 0, failedLabels_2 = failedLabels_3; _19 < failedLabels_2.length; _19++) {
                    var failedLabel = failedLabels_2[_19];
                    var unfilteredNucleotideData = failedLabel.unfilteredNucleotideData, pairedLabelDatum = failedLabel.pairedLabelDatum, labelContentAsNumber = failedLabel.labelContentAsNumber;
                    if (labelContentAsNumber === undefined) {
                        createLabelWithSmallestDistance(pairedLabelDatum, unfilteredNucleotideData, minimumDistanceSquaredRatioForLabels, maximumDistanceSquaredRatioForLabels);
                    }
                    else {
                        var foundMatchingNucleotideIndexDeltaFlag = false;
                        outerLoop: for (var _20 = 0, nucleotideIndexDeltasSortedByMultiplicities_2 = nucleotideIndexDeltasSortedByMultiplicities; _20 < nucleotideIndexDeltasSortedByMultiplicities_2.length; _20++) {
                            var nucleotideIndexDelta = nucleotideIndexDeltasSortedByMultiplicities_2[_20].nucleotideIndexDelta;
                            for (var _21 = 0, unfilteredNucleotideData_2 = unfilteredNucleotideData; _21 < unfilteredNucleotideData_2.length; _21++) {
                                var indices = unfilteredNucleotideData_2[_21].indices;
                                var nucleotideIndex = indices.nucleotideIndex, arrayIndex = indices.arrayIndex;
                                if (nucleotideIndexDelta === labelContentAsNumber - nucleotideIndex) {
                                    foundMatchingNucleotideIndexDeltaFlag = true;
                                    createLabel(pairedLabelDatum, arrayIndex);
                                    break outerLoop;
                                }
                            }
                        }
                        // if (!foundMatchingNucleotideIndexDeltaFlag) {
                        //   createLabelWithSmallestDistance(
                        //     pairedLabelDatum,
                        //     unfilteredNucleotideData,
                        //     minimumDistanceSquaredRatioForLabels,
                        //     maximumDistanceSquaredRatioForLabels
                        //   );
                        // }
                    }
                }
            }
        }
        var logFlag = false;
        var failedBasePairs = getInitialFailedBasePairs();
        var totalDistancesRecord = {};
        for (var _22 = 0, allKeys_1 = allKeys; _22 < allKeys_1.length; _22++) {
            var basePairTypeOrUndefined = allKeys_1[_22];
            totalDistancesRecord[basePairTypeOrUndefined] = {
                minimum: Number.POSITIVE_INFINITY,
                maximum: Number.NEGATIVE_INFINITY
            };
        }
        function getInitialFailedBasePairs() {
            var zeroCandidateBasePairs = {};
            for (var _i = 0, allKeys_2 = allKeys; _i < allKeys_2.length; _i++) {
                var basePairTypeOrUndefined = allKeys_2[_i];
                zeroCandidateBasePairs[basePairTypeOrUndefined] = {
                    lineData: [],
                    centerData: []
                };
            }
            return {
                zeroCandidateBasePairs: zeroCandidateBasePairs,
                tooManyCandidateBasePairs: {
                    lineDataWithIndices: [],
                    centerDataWithIndices: []
                }
            };
        }
        function findClosestNucleotides(target, count) {
            var indicesWithSquaredDistances = flattenedNucleotideProps.map(function (_a) {
                var indices = _a.indices, adjustedPosition = _a.adjustedPosition;
                return {
                    indices: indices,
                    adjustedPosition: adjustedPosition,
                    squaredDistance: (0, Vector2D_1.distanceSquared)(target, adjustedPosition)
                };
            });
            if (indicesWithSquaredDistances.length < count) {
                throw TOO_FEW_NUCLEOTIDES_ERROR;
            }
            indicesWithSquaredDistances.sort(function (indicesWithSquaredDistance0, indicesWithSquaredDistance1) {
                return indicesWithSquaredDistance0.squaredDistance - indicesWithSquaredDistance1.squaredDistance;
            });
            return {
                all: indicesWithSquaredDistances,
                sliced: indicesWithSquaredDistances.slice(0, count)
            };
        }
        function createBasePair(indices0, indices1, type) {
            (0, RnaComplex_1.insertBasePair)(singularRnaComplexProps, indices0.rnaMoleculeName, indices0.nucleotideIndex, indices1.rnaMoleculeName, indices1.nucleotideIndex, RnaComplex_1.DuplicateBasePairKeysHandler.THROW_ERROR, {
                basePairType: type
            });
            var distanceI = (0, Vector2D_1.distance)(flattenedNucleotideProps[indices0.arrayIndex].singularNucleotideProps, flattenedNucleotideProps[indices1.arrayIndex].singularNucleotideProps);
            var distanceRecord = totalDistancesRecord[type !== null && type !== void 0 ? type : "undefined"];
            if (distanceI < distanceRecord.minimum) {
                distanceRecord.minimum = distanceI;
            }
            if (distanceI > distanceRecord.maximum) {
                distanceRecord.maximum = distanceI;
            }
            delete flattenedNucleotideProps[indices0.arrayIndex];
            delete flattenedNucleotideProps[indices1.arrayIndex];
        }
        function calculateNucleotideData(closestNucleotides, center) {
            return closestNucleotides.map(function (_a) {
                var indices = _a.indices, adjustedPosition = _a.adjustedPosition, squaredDistance = _a.squaredDistance;
                return {
                    indices: indices,
                    dv: (0, Vector2D_1.subtract)(adjustedPosition, center),
                    distance: Math.sqrt(squaredDistance),
                    adjustedPosition: adjustedPosition
                };
            });
        }
        function attemptToCreateBasePairDefinedByLine(basePairLine, constraints, numberOfNeighboringNucleotides) {
            var dotProductThreshold = constraints.dotProductThreshold, minimumDistanceRatio = constraints.minimumDistanceRatio;
            var maximumDistanceRatio = 1 / minimumDistanceRatio;
            var baseLineDirection = (0, Vector2D_1.normalize)((0, Vector2D_1.subtract)(basePairLine.v1, basePairLine.v0));
            var negatedBaseLineDirection = (0, Vector2D_1.negate)(baseLineDirection);
            var closestNucleotides0 = findClosestNucleotides(basePairLine.v0, numberOfNeighboringNucleotides);
            var nucleotideData0 = calculateNucleotideData(closestNucleotides0.sliced, basePairLine.v0).filter(function (_a) {
                var dv = _a.dv;
                return (0, Vector2D_1.dotProduct)(dv, baseLineDirection) / (0, Vector2D_1.magnitude)(dv) < dotProductThreshold;
            });
            var closestNucleotides1 = findClosestNucleotides(basePairLine.v1, numberOfNeighboringNucleotides);
            var nucleotideData1 = calculateNucleotideData(closestNucleotides1.sliced, basePairLine.v1).filter(function (_a) {
                var dv = _a.dv;
                return (0, Vector2D_1.dotProduct)(dv, negatedBaseLineDirection) / (0, Vector2D_1.magnitude)(dv) < dotProductThreshold;
            });
            var length0 = nucleotideData0.length;
            var length1 = nucleotideData1.length;
            var filteredNucleotideData = new Array();
            var expectedBasePairType = basePairLine.basePairType;
            for (var i = 0; i < length0; i++) {
                var nucleotideDatumI = nucleotideData0[i];
                var indicesI = nucleotideDatumI.indices;
                var distanceI = nucleotideDatumI.distance;
                var symbolI = singularRnaComplexProps.rnaMoleculeProps[indicesI.rnaMoleculeName].nucleotideProps[indicesI.nucleotideIndex].symbol;
                for (var j = 0; j < length1; j++) {
                    var nucleotideDatumJ = nucleotideData1[j];
                    var indicesJ = nucleotideDatumJ.indices;
                    var distanceJ = nucleotideDatumJ.distance;
                    var symbolJ = singularRnaComplexProps.rnaMoleculeProps[indicesJ.rnaMoleculeName].nucleotideProps[indicesJ.nucleotideIndex].symbol;
                    if (indicesI.rnaMoleculeName === indicesJ.rnaMoleculeName &&
                        Math.abs(indicesI.nucleotideIndex - indicesJ.nucleotideIndex) <= 1) {
                        continue;
                    }
                    var type = (0, BasePair_1.getBasePairType)(symbolI, symbolJ);
                    if (expectedBasePairType !== undefined &&
                        expectedBasePairType !== type) {
                        continue;
                    }
                    var distanceRatio = distanceI / distanceJ;
                    if (distanceRatio < minimumDistanceRatio ||
                        distanceRatio > maximumDistanceRatio) {
                        continue;
                    }
                    filteredNucleotideData.push({
                        indices0: indicesI,
                        indices1: indicesJ,
                        totalDistance: distanceI + distanceJ,
                        distanceRatio: distanceRatio,
                        type: type
                    });
                }
            }
            var count = filteredNucleotideData.length;
            switch (count) {
                case 0: {
                    failedBasePairs.zeroCandidateBasePairs[expectedBasePairType !== null && expectedBasePairType !== void 0 ? expectedBasePairType : "undefined"].lineData.push({
                        line: basePairLine,
                        allClosestNucleotides: {
                            0: [],
                            1: []
                        }
                    });
                    break;
                }
                case 1: {
                    var nucleotidePair = filteredNucleotideData[0];
                    createBasePair(nucleotidePair.indices0, nucleotidePair.indices1, nucleotidePair.type);
                    break;
                }
                default: {
                    failedBasePairs.tooManyCandidateBasePairs.lineDataWithIndices.push({
                        line: basePairLine,
                        arrayIndices: filteredNucleotideData.map(function (_a) {
                            var indices0 = _a.indices0, indices1 = _a.indices1;
                            return {
                                0: indices0.arrayIndex,
                                1: indices1.arrayIndex
                            };
                        }),
                        allClosestNucleotides: {
                            0: closestNucleotides0.all,
                            1: closestNucleotides1.all
                        }
                    });
                    break;
                }
            }
            if (filteredNucleotideData.length !== 1 && logFlag) {
                console.error("Base-pair creation failed: ".concat(filteredNucleotideData.length, " (line; ").concat(basePairLine.basePairType, "; (").concat(basePairLine.v0.x, ", ").concat(basePairLine.v0.y, ")-(").concat(basePairLine.v1.x, ", ").concat(basePairLine.v1.y, "))"), filteredNucleotideData);
            }
        }
        function attemptToCreateBasePairDefinedByCenter(basePairCenter, constraints, numberOfNeighboringNucleotides) {
            var dotProductThreshold = constraints.dotProductThreshold, minimumDistanceRatio = constraints.minimumDistanceRatio;
            var maximumDistanceRatio = 1 / minimumDistanceRatio;
            var _a = findClosestNucleotides(basePairCenter, numberOfNeighboringNucleotides), all = _a.all, sliced = _a.sliced;
            var nucleotideData = calculateNucleotideData(sliced, basePairCenter);
            var filteredNucleotideData = new Array();
            var length = nucleotideData.length;
            var expectedBasePairType = basePairCenter.basePairType;
            for (var i = 0; i < length; i++) {
                var nucleotideDatumI = nucleotideData[i];
                var indicesI = nucleotideDatumI.indices;
                var distanceI = nucleotideDatumI.distance;
                var symbolI = singularRnaComplexProps.rnaMoleculeProps[indicesI.rnaMoleculeName].nucleotideProps[indicesI.nucleotideIndex].symbol;
                for (var j = i + 1; j < length; j++) {
                    var nucleotideDatumJ = nucleotideData[j];
                    var indicesJ = nucleotideDatumJ.indices;
                    var distanceJ = nucleotideDatumJ.distance;
                    var symbolJ = singularRnaComplexProps.rnaMoleculeProps[indicesJ.rnaMoleculeName].nucleotideProps[indicesJ.nucleotideIndex].symbol;
                    if (indicesI.rnaMoleculeName === indicesJ.rnaMoleculeName &&
                        Math.abs(indicesI.nucleotideIndex - indicesJ.nucleotideIndex) <= 1) {
                        continue;
                    }
                    var type = (0, BasePair_1.getBasePairType)(symbolI, symbolJ);
                    if (expectedBasePairType !== undefined &&
                        expectedBasePairType !== type) {
                        continue;
                    }
                    var dotProductIJ = (0, Vector2D_1.dotProduct)(nucleotideDatumI.dv, nucleotideDatumJ.dv) / (distanceI * distanceJ);
                    if (dotProductIJ >= dotProductThreshold) {
                        continue;
                    }
                    var distanceRatio = distanceI / distanceJ;
                    if (distanceRatio < minimumDistanceRatio ||
                        distanceRatio > maximumDistanceRatio) {
                        continue;
                    }
                    filteredNucleotideData.push({
                        indices0: indicesI,
                        indices1: indicesJ,
                        dotProduct: dotProductIJ,
                        totalDistance: distanceI + distanceJ,
                        distanceRatio: distanceRatio,
                        type: type
                    });
                }
            }
            var count = filteredNucleotideData.length;
            switch (count) {
                case 0: {
                    failedBasePairs.zeroCandidateBasePairs[expectedBasePairType !== null && expectedBasePairType !== void 0 ? expectedBasePairType : "undefined"].centerData.push({
                        center: basePairCenter,
                        allClosestNucleotides: []
                    });
                    break;
                }
                case 1: {
                    var nucleotidePair = filteredNucleotideData[0];
                    createBasePair(nucleotidePair.indices0, nucleotidePair.indices1, nucleotidePair.type);
                    break;
                }
                default: {
                    failedBasePairs.tooManyCandidateBasePairs.centerDataWithIndices.push({
                        center: basePairCenter,
                        arrayIndices: filteredNucleotideData.map(function (_a) {
                            var indices0 = _a.indices0, indices1 = _a.indices1;
                            return {
                                0: indices0.arrayIndex,
                                1: indices1.arrayIndex
                            };
                        }),
                        allClosestNucleotides: all
                    });
                    break;
                }
            }
            if (filteredNucleotideData.length !== 1 && logFlag) {
                console.error("Base-pair creation failed: ".concat(filteredNucleotideData.length, " (center; ").concat(basePairCenter.basePairType, "; ").concat(basePairCenter.x, ", ").concat(basePairCenter.y, ")"), filteredNucleotideData);
            }
        }
        var basePairTypeHandlingOrderOrdinals = (_u = {},
            _u[BasePair_1["default"].Type.WOBBLE] = 0,
            _u[BasePair_1["default"].Type.CANONICAL] = 1,
            _u[BasePair_1["default"].Type.CIS_WATSON_CRICK_WATSON_CRICK] = 2,
            _u[BasePair_1["default"].Type.TRANS_WATSON_CRICK_WATSON_CRICK] = 3,
            _u[BasePair_1["default"].Type.MISMATCH] = 4,
            _u["undefined"] = 5,
            _u);
        // This order minimizes ambiguous base pairs.
        var basePairTypeHandlingOrder = Object.entries(basePairTypeHandlingOrderOrdinals).sort(function (typeWithOrdinal0, typeWithOrdinal1) {
            return typeWithOrdinal0[1] - typeWithOrdinal1[1];
        }).map(function (_a) {
            var type = _a[0], ordinal = _a[1];
            return type;
        });
        var typedBasePairs = (_v = {
                "undefined": {
                    lines: [],
                    centers: []
                }
            },
            _v[BasePair_1["default"].Type.CANONICAL] = {
                lines: [],
                centers: []
            },
            _v[BasePair_1["default"].Type.MISMATCH] = {
                lines: [],
                centers: []
            },
            _v[BasePair_1["default"].Type.WOBBLE] = {
                lines: [],
                centers: []
            },
            _v[BasePair_1["default"].Type.CIS_WATSON_CRICK_WATSON_CRICK] = {
                lines: [],
                centers: []
            },
            _v[BasePair_1["default"].Type.TRANS_WATSON_CRICK_WATSON_CRICK] = {
                lines: [],
                centers: []
            },
            _v);
        for (var _23 = 0, basePairCentersPerRnaComplex_1 = basePairCentersPerRnaComplex; _23 < basePairCentersPerRnaComplex_1.length; _23++) {
            var basePairCenter = basePairCentersPerRnaComplex_1[_23];
            typedBasePairs[(_d = basePairCenter.basePairType) !== null && _d !== void 0 ? _d : "undefined"].centers.push(basePairCenter);
        }
        for (var _24 = 0, basePairLinesPerRnaComplex_1 = basePairLinesPerRnaComplex; _24 < basePairLinesPerRnaComplex_1.length; _24++) {
            var basePairLine = basePairLinesPerRnaComplex_1[_24];
            var basePairsPerType = typedBasePairs[(_e = basePairLine.basePairType) !== null && _e !== void 0 ? _e : "undefined"];
            if (EPSILON_SQUARED >= (0, Vector2D_1.distanceSquared)(basePairLine.v0, basePairLine.v1)) {
                // The vectors are effectively identical.
                basePairsPerType.centers.push(basePairLine.v0);
            }
            else {
                basePairsPerType.lines.push(basePairLine);
            }
        }
        // Make base pairs for every unambigious base pair.
        for (var _25 = 0, basePairTypeHandlingOrder_1 = basePairTypeHandlingOrder; _25 < basePairTypeHandlingOrder_1.length; _25++) {
            var basePairType = basePairTypeHandlingOrder_1[_25];
            var _26 = typedBasePairs[basePairType], centers = _26.centers, lines = _26.lines;
            for (var _27 = 0, lines_1 = lines; _27 < lines_1.length; _27++) {
                var line = lines_1[_27];
                attemptToCreateBasePairDefinedByLine(line, constraints.normal, 3);
            }
            for (var _28 = 0, centers_1 = centers; _28 < centers_1.length; _28++) {
                var center = centers_1[_28];
                attemptToCreateBasePairDefinedByCenter(center, constraints.normal, 6);
            }
        }
        var failedBasePairsWorkingCopy = structuredClone(failedBasePairs);
        failedBasePairs = getInitialFailedBasePairs();
        var remainderLines = new Array();
        var remainderCenters = new Array();
        var zeroCandidateBasePairs = failedBasePairsWorkingCopy.zeroCandidateBasePairs, tooManyCandidateBasePairs = failedBasePairsWorkingCopy.tooManyCandidateBasePairs;
        // Make a second attempt to create base pairs (of failed base pairs).
        for (var _29 = 0, _30 = tooManyCandidateBasePairs.lineDataWithIndices; _29 < _30.length; _29++) {
            var line = _30[_29];
            line.arrayIndices = line.arrayIndices.filter(function (arrayIndexPair) {
                return arrayIndexPair[0] in flattenedNucleotideProps && arrayIndexPair[1] in flattenedNucleotideProps;
            });
            switch (line.arrayIndices.length) {
                case 0: {
                    zeroCandidateBasePairs[(_f = line.line.basePairType) !== null && _f !== void 0 ? _f : "undefined"].lineData.push(line);
                    break;
                }
                case 1: {
                    // Create base pairs which are now unambiguous.
                    var arrayIndexPair = line.arrayIndices[0];
                    createBasePair(flattenedNucleotideProps[arrayIndexPair[0]].indices, flattenedNucleotideProps[arrayIndexPair[1]].indices, line.line.basePairType);
                    break;
                }
                default: {
                    remainderLines.push(line);
                    break;
                }
            }
        }
        for (var _31 = 0, _32 = tooManyCandidateBasePairs.centerDataWithIndices; _31 < _32.length; _31++) {
            var center = _32[_31];
            center.arrayIndices = center.arrayIndices.filter(function (arrayIndexPair) {
                return arrayIndexPair[0] in flattenedNucleotideProps && arrayIndexPair[1] in flattenedNucleotideProps;
            });
            switch (center.arrayIndices.length) {
                case 0: {
                    zeroCandidateBasePairs[(_g = center.center.basePairType) !== null && _g !== void 0 ? _g : "undefined"].centerData.push(center);
                    break;
                }
                case 1: {
                    // Create base pairs which are now unambiguous.
                    var arrayIndexPair = center.arrayIndices[0];
                    createBasePair(flattenedNucleotideProps[arrayIndexPair[0]].indices, flattenedNucleotideProps[arrayIndexPair[1]].indices, center.center.basePairType);
                    break;
                }
                default: {
                    remainderCenters.push(center);
                    break;
                }
            }
        }
        for (var _33 = 0, basePairTypeHandlingOrder_2 = basePairTypeHandlingOrder; _33 < basePairTypeHandlingOrder_2.length; _33++) {
            var basePairType = basePairTypeHandlingOrder_2[_33];
            var _34 = zeroCandidateBasePairs[basePairType], centerData = _34.centerData, lineData = _34.lineData;
            for (var _35 = 0, lineData_1 = lineData; _35 < lineData_1.length; _35++) {
                var lineDataI = lineData_1[_35];
                attemptToCreateBasePairDefinedByLine(lineDataI.line, constraints.loose, INCREASED_NUMBER_OF_NEIGHBORING_NUCLEOTIDES.line);
            }
            for (var _36 = 0, centerData_1 = centerData; _36 < centerData_1.length; _36++) {
                var centerDataI = centerData_1[_36];
                attemptToCreateBasePairDefinedByCenter(centerDataI.center, constraints.loose, INCREASED_NUMBER_OF_NEIGHBORING_NUCLEOTIDES.center);
            }
        }
        remainderLines.push.apply(remainderLines, failedBasePairs.tooManyCandidateBasePairs.lineDataWithIndices);
        remainderCenters.push.apply(remainderCenters, failedBasePairs.tooManyCandidateBasePairs.centerDataWithIndices);
        var compositeData = __spreadArray(__spreadArray([], remainderLines.map(function (lineData) {
            var line = lineData.line, arrayIndices = lineData.arrayIndices;
            return {
                center: __assign(__assign({}, (0, Vector2D_1.scaleUp)((0, Vector2D_1.add)(line.v0, line.v1), 0.5)), { basePairType: line.basePairType }),
                arrayIndices: arrayIndices
            };
        }), true), remainderCenters, true);
        // This sort function attempts to minimize the chances of overlapping base-pair candidates
        function sort(object0, object1) {
            return object0.arrayIndices.length - object1.arrayIndices.length;
        }
        compositeData.sort(sort);
        var _loop_2 = function (centerData) {
            var center = centerData.center, arrayIndices = centerData.arrayIndices;
            var distanceRecordPerType = totalDistancesRecord[(_h = center.basePairType) !== null && _h !== void 0 ? _h : "undefined"];
            arrayIndices = arrayIndices.filter(function (arrayIndicesI) {
                if (!(arrayIndicesI[0] in flattenedNucleotideProps)) {
                    return false;
                }
                if (!(arrayIndicesI[1] in flattenedNucleotideProps)) {
                    return false;
                }
                var singularFlattenedNucleotideProps0 = flattenedNucleotideProps[arrayIndicesI[0]];
                var singularFlattenedNucleotideProps1 = flattenedNucleotideProps[arrayIndicesI[1]];
                var distanceI = (0, Vector2D_1.distance)(singularFlattenedNucleotideProps0.singularNucleotideProps, singularFlattenedNucleotideProps1.singularNucleotideProps);
                if (distanceI < distanceRecordPerType.minimum * 0.95) {
                    return false;
                }
                if (distanceI > distanceRecordPerType.maximum * 1.05) {
                    return false;
                }
                return true;
            });
            if (arrayIndices.length === 0) {
                console.error("Base pairing failed.");
                return "continue";
            }
            var distanceData = arrayIndices.map(function (arrayIndicesI) {
                var singularFlattenedNucleotideProps0 = flattenedNucleotideProps[arrayIndicesI[0]];
                var singularFlattenedNucleotideProps1 = flattenedNucleotideProps[arrayIndicesI[1]];
                var distanceSquaredI = (0, Vector2D_1.distanceSquared)((0, Vector2D_1.scaleUp)((0, Vector2D_1.add)(singularFlattenedNucleotideProps0.singularNucleotideProps, singularFlattenedNucleotideProps1.singularNucleotideProps), 0.5), center);
                return {
                    distanceSquared: distanceSquaredI,
                    indices0: singularFlattenedNucleotideProps0.indices,
                    indices1: singularFlattenedNucleotideProps1.indices
                };
            });
            var minimizedDistanceData = distanceData[0];
            for (var i = 1; i < distanceData.length; i++) {
                var distanceDataI = distanceData[i];
                if (distanceDataI.distanceSquared < minimizedDistanceData.distanceSquared) {
                    minimizedDistanceData = distanceDataI;
                }
            }
            createBasePair(minimizedDistanceData.indices0, minimizedDistanceData.indices1, center.basePairType);
        };
        // remainderLines.sort(sort);
        // remainderCenters.sort(sort);
        for (var _37 = 0, compositeData_1 = compositeData; _37 < compositeData_1.length; _37++) {
            var centerData = compositeData_1[_37];
            _loop_2(centerData);
        }
    };
    for (var _i = 0, _j = Object.entries(rnaComplexProps); _i < _j.length; _i++) {
        var _k = _j[_i], rnaComplexIndexAsString = _k[0], singularRnaComplexProps = _k[1];
        _loop_1(rnaComplexIndexAsString, singularRnaComplexProps);
    }
    // Invert all y coordinates.
    for (var _l = 0, _m = Object.values(rnaComplexProps); _l < _m.length; _l++) {
        var singularRnaComplexProps = _m[_l];
        for (var _o = 0, _p = Object.values(singularRnaComplexProps.rnaMoleculeProps); _o < _p.length; _o++) {
            var singularRnaMoleculeProps = _p[_o];
            for (var _q = 0, _r = Object.values(singularRnaMoleculeProps.nucleotideProps); _q < _r.length; _q++) {
                var singularNucleotideProps = _r[_q];
                singularNucleotideProps.y *= -1;
                if (singularNucleotideProps.labelContentProps !== undefined) {
                    singularNucleotideProps.labelContentProps.y *= -1;
                }
                if (singularNucleotideProps.labelLineProps !== undefined) {
                    for (var _s = 0, _t = singularNucleotideProps.labelLineProps.points; _s < _t.length; _s++) {
                        var point = _t[_s];
                        point.y *= -1;
                    }
                }
            }
        }
    }
}
exports.parseGraphicalData = parseGraphicalData;
