import { RnaComplex } from "../components/app_specific/RnaComplex";
import { BasePair } from "../components/app_specific/BasePair";
import { Nucleotide } from "../components/app_specific/Nucleotide";
import { distance } from "../data_structures/Vector2D";

export interface BasePairDistanceCalculation {
  canonicalDistance: number;
  wobbleDistance: number;
  mismatchDistance: number;
  contiguousDistance: number;
}

/**
 * Calculates base pair distances from an uploaded RNA structure
 * @param rnaComplexProps The parsed RNA complex data
 * @returns Calculated distances for different base pair types
 */
export function calculateBasePairDistances(
  rnaComplexProps: RnaComplex.ExternalProps[]
): BasePairDistanceCalculation {
  const canonicalDistances: number[] = [];
  const wobbleDistances: number[] = [];
  const mismatchDistances: number[] = [];
  const contiguousDistances: number[] = [];

  // Collect all base pair distances by type
  for (const complex of rnaComplexProps) {
    for (const [molName, molProps] of Object.entries(complex.rnaMoleculeProps)) {
      for (const [nucIndex, nucProps] of Object.entries(molProps.nucleotideProps)) {
        const basePairs = complex.basePairs[molName]?.[parseInt(nucIndex)];
        if (basePairs) {
          for (const basePair of basePairs) {
            const pairedMolName = basePair.rnaMoleculeName;
            const pairedNucIndex = basePair.nucleotideIndex;
            const pairedNucProps = complex.rnaMoleculeProps[pairedMolName]?.nucleotideProps[pairedNucIndex];
            
            if (pairedNucProps) {
              const dist = distance(nucProps, pairedNucProps);
              
              // Determine base pair type
              const basePairType = basePair.basePairType || 
                getBasePairType(nucProps.symbol, pairedNucProps.symbol);
              
              switch (basePairType) {
                case BasePair.Type.CANONICAL:
                case BasePair.Type.CIS_WATSON_CRICK_WATSON_CRICK:
                case BasePair.Type.TRANS_WATSON_CRICK_WATSON_CRICK:
                  canonicalDistances.push(dist);
                  break;
                case BasePair.Type.WOBBLE:
                  wobbleDistances.push(dist);
                  break;
                case BasePair.Type.MISMATCH:
                  mismatchDistances.push(dist);
                  break;
                default:
                  // Treat unknown types as mismatch
                  mismatchDistances.push(dist);
                  break;
              }
            }
          }
        }
      }
    }
  }

  // Calculate contiguous base pair distances
  for (const complex of rnaComplexProps) {
    for (const [molName, molProps] of Object.entries(complex.rnaMoleculeProps)) {
      const sortedIndices = Object.keys(molProps.nucleotideProps)
        .map(Number)
        .sort((a, b) => a - b);
      
      for (let i = 0; i < sortedIndices.length - 1; i++) {
        const currentIndex = sortedIndices[i];
        const nextIndex = sortedIndices[i + 1];
        
        // Check if both nucleotides are base paired
        const currentBasePairs = complex.basePairs[molName]?.[currentIndex];
        const nextBasePairs = complex.basePairs[molName]?.[nextIndex];
        
        if (currentBasePairs && currentBasePairs.length > 0 && 
            nextBasePairs && nextBasePairs.length > 0) {
          const currentNuc = molProps.nucleotideProps[currentIndex];
          const nextNuc = molProps.nucleotideProps[nextIndex];
          const dist = distance(currentNuc, nextNuc);
          contiguousDistances.push(dist);
        }
      }
    }
  }

  // Calculate medians
  const canonicalDistance = calculateMedian(canonicalDistances);
  const wobbleDistance = calculateMedian(wobbleDistances);
  const mismatchDistance = canonicalDistance * 1.2; // +20% of canonical
  const contiguousDistance = calculateMedian(contiguousDistances);

  return {
    canonicalDistance: canonicalDistance || 1, // fallback to 1 if no data
    wobbleDistance: wobbleDistance || canonicalDistance || 1,
    mismatchDistance: mismatchDistance || 1,
    contiguousDistance: contiguousDistance || 1
  };
}

/**
 * Calculates the median of an array of numbers
 */
function calculateMedian(numbers: number[]): number {
  if (numbers.length === 0) return 0;
  
  const sorted = [...numbers].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  } else {
    return sorted[mid];
  }
}

/**
 * Gets the base pair type for two nucleotide symbols
 */
function getBasePairType(symbol0: Nucleotide.Symbol, symbol1: Nucleotide.Symbol): BasePair.CanonicalType {
  if (symbol0 > symbol1) {
    // Ensure symbol0 <= symbol1
    const temp = symbol0;
    symbol0 = symbol1;
    symbol1 = temp;
  }

  const basePairTypeRecord = BasePair.typeRecord;
  let basePairType: BasePair.CanonicalType | undefined = undefined;
  if (symbol0 in basePairTypeRecord) {
    basePairType = (basePairTypeRecord[symbol0] as Partial<Record<Nucleotide.Symbol, BasePair.CanonicalType>>)[symbol1];
  }
  if (basePairType === undefined) {
    return BasePair.Type.MISMATCH; // Default to mismatch for unknown pairs
  }
  return basePairType;
}
