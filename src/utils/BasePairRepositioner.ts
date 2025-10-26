import { add, subtract, normalize, scaleUp, magnitude } from "../data_structures/Vector2D";
import { Setting, SettingsRecord } from "../ui/Setting";
import { BasePair, getBasePairType } from "../components/app_specific/BasePair";

export function repositionNucleotidesForBasePairs(
  complex: any,
  mol0: string,
  mol1: string,
  startIdx0: number,
  startIdx1: number,
  length: number,
  basePairType: BasePair.Type | undefined,
  settingsRecord: SettingsRecord
): void {
  const mp0 = complex.rnaMoleculeProps[mol0];
  const mp1 = complex.rnaMoleculeProps[mol1];
  if (!mp0 || !mp1) return;

  const canonicalDistance = settingsRecord[Setting.CANONICAL_BASE_PAIR_DISTANCE] as number;
  const wobbleDistance = settingsRecord[Setting.WOBBLE_BASE_PAIR_DISTANCE] as number;
  const mismatchDistance = settingsRecord[Setting.MISMATCH_BASE_PAIR_DISTANCE] as number;
  const contiguousDistance = settingsRecord[Setting.DISTANCE_BETWEEN_CONTIGUOUS_BASE_PAIRS] as number;

  for (let i = 0; i < length; i++) {
    const currentIdx0 = startIdx0 + i;
    const currentIdx1 = startIdx1 - i;

    if (!(currentIdx0 in mp0.nucleotideProps) || !(currentIdx1 in mp1.nucleotideProps)) {
      break;
    }

    const nuc0 = mp0.nucleotideProps[currentIdx0];
    const nuc1 = mp1.nucleotideProps[currentIdx1];

    let currentBasePairType = basePairType;
    if (nuc0.symbol && nuc1.symbol) {
      try {
        currentBasePairType = getBasePairType(nuc0.symbol, nuc1.symbol);
      } catch (_) {
        currentBasePairType = BasePair.Type.MISMATCH;
      }
    }

    let basePairDistance = canonicalDistance;
    if (currentBasePairType === BasePair.Type.WOBBLE) {
      basePairDistance = wobbleDistance;
    } else if (currentBasePairType === BasePair.Type.MISMATCH) {
      basePairDistance = mismatchDistance;
    }

    if (i === 0) {
      const currentCenter = {
        x: (nuc0.x + nuc1.x) / 2,
        y: (nuc0.y + nuc1.y) / 2,
      };

      const currentVector = subtract(nuc1, nuc0);
      const currentDistance = magnitude(currentVector);

      if (currentDistance > 0) {
        const direction = normalize(currentVector);
        const halfDistance = basePairDistance / 2;

        nuc0.x = currentCenter.x - direction.x * halfDistance;
        nuc0.y = currentCenter.y - direction.y * halfDistance;
        nuc1.x = currentCenter.x + direction.x * halfDistance;
        nuc1.y = currentCenter.y + direction.y * halfDistance;
      }
    } else {
      const prevIdx0 = startIdx0 + i - 1;
      const prevIdx1 = startIdx1 - i + 1;

      if (prevIdx0 in mp0.nucleotideProps && prevIdx1 in mp1.nucleotideProps) {
        const prevNuc0 = mp0.nucleotideProps[prevIdx0];
        const prevNuc1 = mp1.nucleotideProps[prevIdx1];

        const prevCenter = {
          x: (prevNuc0.x + prevNuc1.x) / 2,
          y: (prevNuc0.y + prevNuc1.y) / 2,
        };

        const currentCenter = {
          x: (nuc0.x + nuc1.x) / 2,
          y: (nuc0.y + nuc1.y) / 2,
        };

        const direction = subtract(currentCenter, prevCenter);
        const dirMag = magnitude(direction);

        if (dirMag > 0) {
          const normalizedDirection = normalize(direction);
          const newCenter = add(prevCenter, scaleUp(normalizedDirection, contiguousDistance));

          const nucleotideVector = subtract(nuc1, nuc0);
          const nucDist = magnitude(nucleotideVector);

          if (nucDist > 0) {
            const nucleotideDirection = normalize(nucleotideVector);
            const halfDistance = basePairDistance / 2;

            nuc0.x = newCenter.x - nucleotideDirection.x * halfDistance;
            nuc0.y = newCenter.y - nucleotideDirection.y * halfDistance;
            nuc1.x = newCenter.x + nucleotideDirection.x * halfDistance;
            nuc1.y = newCenter.y + nucleotideDirection.y * halfDistance;
          }
        }
      }
    }
  }
}
