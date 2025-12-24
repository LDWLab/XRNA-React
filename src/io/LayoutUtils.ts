const MINIMUM_RADIUS = 40;
const RADIUS_PER_NUCLEOTIDE = 6;

export function generateCircularLayout(
  sequenceLength: number,
  offsetX: number = 0,
  offsetY: number = 0
) {
  const radius = Math.max(MINIMUM_RADIUS, sequenceLength * RADIUS_PER_NUCLEOTIDE);
  const centerOffset = radius + 10;
  const positions = new Array<{ x: number; y: number }>(sequenceLength);

  if (sequenceLength <= 1) {
    const angle = -Math.PI / 2;
    positions[0] = {
      x: centerOffset + radius * Math.cos(angle) + offsetX,
      y: centerOffset + radius * Math.sin(angle) + offsetY,
    };
    return positions;
  }

  const desiredGapNucleotideCount = Math.min(2, Math.max(0, sequenceLength - 2));
  const baseSpacing = (2 * Math.PI) / sequenceLength;
  const gapAngle = (desiredGapNucleotideCount + 1) * baseSpacing;
  const usableAngle = 2 * Math.PI - gapAngle;
  const angleIncrement = usableAngle / (sequenceLength - 1);
  const startAngle = -Math.PI / 2 + gapAngle / 2;

  for (let i = 0; i < sequenceLength; i++) {
    const angle = startAngle + i * angleIncrement;
    positions[i] = {
      x: centerOffset + radius * Math.cos(angle) + offsetX,
      y: centerOffset + radius * Math.sin(angle) + offsetY,
    };
  }

  return positions;
}

export function calculateEntryOffset(
  entryIndex: number,
  sequenceLength: number
): { offsetX: number; offsetY: number } {
  const radius = Math.max(MINIMUM_RADIUS, sequenceLength * RADIUS_PER_NUCLEOTIDE);
  const spacing = radius * 2 + 10;
  return {
    offsetX: entryIndex * spacing,
    offsetY: 0,
  };
}
