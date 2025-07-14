import { ElementInfo } from '../components/new_sidebar/panels/InformationPanel';

export type FullKeys = {
  rnaComplexIndex: number;
  rnaMoleculeName: string;
  nucleotideIndex: number;
};

export type RnaComplexProps = Record<number, any>;

/**
 * Detects the structure type and range for a nucleotide
 */
function detectStructureInfo(
  nucleotideIndex: number,
  rnaMolecule: any,
  rnaComplex: any,
  rnaMoleculeName: string
): ElementInfo['structureInfo'] {
  try {
    const basePairs = rnaComplex.basePairs?.[rnaMoleculeName] || {};
    const nucleotideProps = rnaMolecule.nucleotideProps || {};
    
    // Check if this nucleotide is base paired
    const basePair = basePairs[nucleotideIndex];
    if (basePair) {
      // This nucleotide is base paired - detect if it's part of a helix
      const partnerIndex = basePair.partnerIndex;
      
      // Look for consecutive base pairs to identify helix
      let helixStart = nucleotideIndex;
      let helixEnd = nucleotideIndex;
      let partnerStart = partnerIndex;
      let partnerEnd = partnerIndex;
      
      // Extend backwards
      while (helixStart > 1) {
        const prevBp = basePairs[helixStart - 1];
        if (prevBp && prevBp.partnerIndex === partnerStart + 1) {
          helixStart--;
          partnerStart++;
        } else {
          break;
        }
      }
      
      // Extend forwards
      const maxIndex = Math.max(...Object.keys(nucleotideProps).map(Number));
      while (helixEnd < maxIndex) {
        const nextBp = basePairs[helixEnd + 1];
        if (nextBp && nextBp.partnerIndex === partnerEnd - 1) {
          helixEnd++;
          partnerEnd--;
        } else {
          break;
        }
      }
      
      const helixLength = helixEnd - helixStart + 1;
      
      if (helixLength >= 2) {
        // Calculate GC content
        let gcCount = 0;
        for (let i = helixStart; i <= helixEnd; i++) {
          const nt = nucleotideProps[i];
          if (nt && (nt.symbol === 'G' || nt.symbol === 'C')) {
            gcCount++;
          }
        }
        const gcContent = Math.round((gcCount / helixLength) * 100);
        
        return {
          type: helixLength >= 4 ? 'helix' : 'stacked_helix',
          name: `Helix (${helixStart}-${helixEnd})`,
          range: { start: helixStart, end: helixEnd },
          helixInfo: { length: helixLength, gcContent }
        };
      }
    }
    
    // Check for single strand regions
    let singleStrandStart = nucleotideIndex;
    let singleStrandEnd = nucleotideIndex;
    
    // Extend backwards to find unpaired nucleotides
    while (singleStrandStart > 1 && !basePairs[singleStrandStart - 1]) {
      singleStrandStart--;
    }
    
    // Extend forwards to find unpaired nucleotides
    const maxIndex = Math.max(...Object.keys(nucleotideProps).map(Number));
    while (singleStrandEnd < maxIndex && !basePairs[singleStrandEnd + 1]) {
      singleStrandEnd++;
    }
    
    if (singleStrandEnd > singleStrandStart) {
      const length = singleStrandEnd - singleStrandStart + 1;
      
      // Determine if it's a loop, bulge, or single strand
      const hasPairedNeighbors = basePairs[singleStrandStart - 1] || basePairs[singleStrandEnd + 1];
      
      let structureType: 'helix' | 'single_strand' | 'loop' | 'bulge' | 'junction' | 'stacked_helix' | 'unknown' = 'single_strand';
      let structureName = `Single Strand (${singleStrandStart}-${singleStrandEnd})`;
      
      if (hasPairedNeighbors) {
        if (length <= 3) {
          structureType = 'bulge';
          structureName = `Bulge (${singleStrandStart}-${singleStrandEnd})`;
        } else if (length <= 10) {
          structureType = 'loop';
          structureName = `Loop (${singleStrandStart}-${singleStrandEnd})`;
        } else {
          structureType = 'junction';
          structureName = `Junction (${singleStrandStart}-${singleStrandEnd})`;
        }
      }
      
      return {
        type: structureType,
        name: structureName,
        range: { start: singleStrandStart, end: singleStrandEnd }
      };
    }
    
    return {
      type: 'unknown',
      name: 'Unknown Structure'
    };
  } catch (error) {
    console.warn('Error detecting structure info:', error);
    return {
      type: 'unknown',
      name: 'Unknown Structure'
    };
  }
}

/**
 * Extracts element information from right-click context
 */
export function extractElementInfo(
  fullKeys: FullKeys,
  rnaComplexProps: RnaComplexProps,
  elementType: 'nucleotide' | 'basepair' | 'label' = 'nucleotide'
): ElementInfo {
  const { rnaComplexIndex, rnaMoleculeName, nucleotideIndex } = fullKeys;
  
  try {
    // Get the RNA complex
    const rnaComplex = rnaComplexProps[rnaComplexIndex];
    if (!rnaComplex) {
      return {
        type: 'unknown',
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex,
      };
    }

    // Get the RNA molecule
    const rnaMolecule = rnaComplex.rnaMoleculeProps?.[rnaMoleculeName];
    if (!rnaMolecule) {
      return {
        type: 'unknown',
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex,
      };
    }

    // Get the nucleotide
    // In most cases the nucleotideIndex passed to us is the *relative* index (i.e. the key used in
    // `nucleotideProps`).  However, in some scenarios – notably when interacting with data coming
    // from external editors or when full-keys have been reconstructed from absolute coordinates –
    // the index can be the *absolute* index (firstNucleotideIndex + relativeIndex).  In that case the
    // direct lookup will fail and we need to try a fallback that converts between the two spaces.

    let nucleotide = rnaMolecule.nucleotideProps?.[nucleotideIndex];

    if (!nucleotide) {
      // Attempt to convert an absolute index into the stored relative index (if information is
      // available).  This covers the common case where `nucleotideIndex` already includes
      // `firstNucleotideIndex`.
      const firstNucIdx: number | undefined = (rnaMolecule as any).firstNucleotideIndex;
      if (firstNucIdx !== undefined && !Number.isNaN(firstNucIdx)) {
        const relative = nucleotideIndex - firstNucIdx;
        nucleotide = rnaMolecule.nucleotideProps?.[relative];
        if (nucleotide) {
          // We found the nucleotide after converting – update nucleotideIndex so downstream logic
          // (GC-content calculation, base-pair lookup, etc.) uses the correct relative index.
          fullKeys.nucleotideIndex = relative;
        }
      }
    }

    if (!nucleotide) {
      // As a last resort, try the inverse conversion (relative→absolute) in case the stored keys are
      // unexpectedly absolute. This is unlikely but harmless to attempt.
      const firstNucIdx: number | undefined = (rnaMolecule as any).firstNucleotideIndex;
      if (firstNucIdx !== undefined && !Number.isNaN(firstNucIdx)) {
        const absolute = nucleotideIndex + firstNucIdx;
        nucleotide = rnaMolecule.nucleotideProps?.[absolute];
      }
    }

    if (!nucleotide) {
      return {
        type: 'unknown',
        rnaComplexIndex,
        rnaMoleculeName,
        nucleotideIndex,
      };
    }
    
    // Extract basic nucleotide information
    const elementInfo: ElementInfo = {
      type: elementType,
      nucleotideSymbol: nucleotide.symbol,
      nucleotideIndex,
      rnaComplexIndex,
      rnaMoleculeName,
      complexName: rnaComplex.name || `Complex ${rnaComplexIndex}`,
      moleculeName: rnaMoleculeName,
      position: {
        x: nucleotide.x || 0,
        y: nucleotide.y || 0,
      },
    };

    // Add color information if available
    if (nucleotide.color) {
      elementInfo.color = nucleotide.color.asHex?.() || nucleotide.color.toString?.() || 'Unknown';
    }

    // Check for base pair information (for both nucleotides and base pairs)
    const basePairs = rnaComplex.basePairs?.[rnaMoleculeName];
    if (basePairs) {
      const basePair = basePairs[nucleotideIndex];
      if (basePair) {
        const partnerMolecule = basePair.partnerMolecule || rnaMoleculeName;
        const partnerRnaMolecule = rnaComplex.rnaMoleculeProps?.[partnerMolecule];
        const partnerNucleotide = partnerRnaMolecule?.nucleotideProps?.[basePair.partnerIndex];
        
        elementInfo.basePairType = basePair.type || 'Watson-Crick';
        elementInfo.basePairPartner = {
          nucleotideIndex: basePair.partnerIndex,
          nucleotideSymbol: partnerNucleotide?.symbol,
          rnaMoleculeName: partnerMolecule,
        };
      }
    }

    // Add structure information
    elementInfo.structureInfo = detectStructureInfo(nucleotideIndex, rnaMolecule, rnaComplex, rnaMoleculeName);

    // Add label information if it's a label
    if (elementType === 'label') {
      if (nucleotide.labelContentProps) {
        elementInfo.labelContent = nucleotide.labelContentProps.text || nucleotide.labelContentProps.content;
      }
    }

    // Add additional properties
    const additionalInfo: Record<string, any> = {};
    
    if (nucleotide.labelLineProps) {
      additionalInfo.hasLabelLine = true;
      additionalInfo.labelLinePoints = nucleotide.labelLineProps.points?.length || 0;
    }
    
    if (nucleotide.labelContentProps) {
      additionalInfo.hasLabelContent = true;
      if (nucleotide.labelContentProps.font) {
        additionalInfo.labelFont = nucleotide.labelContentProps.font;
      }
    }

    if (Object.keys(additionalInfo).length > 0) {
      elementInfo.additionalInfo = additionalInfo;
    }

    return elementInfo;
  } catch (error) {
    console.warn('Error extracting element info:', error);
    return {
      type: 'unknown',
      rnaComplexIndex,
      rnaMoleculeName,
      nucleotideIndex,
    };
  }
}

/**
 * Extracts element information from JSX content (for right-click menus)
 */
export function extractElementInfoFromContent(
  content: JSX.Element,
  fallbackInfo?: Partial<ElementInfo>
): ElementInfo | undefined {
  // This is a fallback method when we can't extract from the right-click context directly
  // We'll use the fallback info if provided
  if (fallbackInfo) {
    return {
      type: 'unknown',
      ...fallbackInfo,
    };
  }
  
  return undefined;
} 