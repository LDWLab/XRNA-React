import { createContext } from "react";
import { RnaComplexKey, RnaMoleculeKey, NucleotideKey, FullKeys } from "../App";
import { RnaComplex as _RnaComplex } from "../components/app_specific/RnaComplex";
import { Nucleotide as _Nucleotide } from "../components/app_specific/Nucleotide";
import { LabelContent as _LabelContent } from "../components/app_specific/LabelContent";
import { LabelLine as _LabelLine } from "../components/app_specific/LabelLine";
import { DEFAULT_SETTINGS } from "../ui/Setting";

export type NucleotideKeysToRerenderPerRnaMolecule = Array<NucleotideKey>;
export type NucleotideKeysToRerenderPerRnaComplex = Record<RnaMoleculeKey, NucleotideKeysToRerenderPerRnaMolecule>;
export type NucleotideKeysToRerender = Record<RnaComplexKey, NucleotideKeysToRerenderPerRnaComplex>;

export type BasePairKeysToRerenderPerRnaComplex = Array<_RnaComplex.BasePairKeys>;
export type BasePairKeysToRerender = Record<RnaComplexKey, BasePairKeysToRerenderPerRnaComplex>;

export namespace Context {
  export namespace App {
    export const ConditionallySetVisibility = createContext(function(setVisibility : (visibility : boolean) => void) { /* Do nothing. */ })
    export const SetMouseOverText = createContext(function(mouseOverText : string) { /* Do nothing. */ })
    export const Settings = createContext(DEFAULT_SETTINGS);
    export const ComplexDocumentName = createContext("");
    export const SetComplexDocumentName = createContext(function(newComplexDocumentName : string) { /* Do nothing. */ });
  }

  export namespace RnaComplex {
    export const Name = createContext("");
    export const Index = createContext(NaN);
    export const BasePairs = createContext<_RnaComplex.BasePairs>({});
  };

  export namespace RnaMolecule {
    export const Name = createContext("");
    export const FirstNucleotideIndex = createContext(NaN);
  };

  export namespace Nucleotide {
    export const OnMouseDownHelper = createContext(function(
      e : React.MouseEvent<_Nucleotide.SvgRepresentation>,
      fullKeys : FullKeys
    ) { /* Do nothing. */ });
    export const OnMouseOverHelper = createContext(function(
      e : React.MouseEvent<_Nucleotide.SvgRepresentation>,
      fullKeys : FullKeys
    ) { /* Do nothing. */ });
    export const Index = createContext(NaN);
  }

  export namespace BasePair {
    export const DEFAULT_RADIUS = {
      mismatch : 1,
      wobble: 0.5
    };
    export const Radius = createContext(DEFAULT_RADIUS);
  };

  export namespace Label {
    export namespace Content {
      export const OnMouseDownHelper = createContext(function(
      e : React.MouseEvent<_LabelContent.SvgRepresentation>,
      fullKeys : FullKeys
      ) { /* Do nothing. */ });
    }
    
    export namespace Line {
      export namespace Body {
        export const OnMouseDownHelper = createContext(function(
          e : React.MouseEvent<_LabelLine.BodySvgRepresentation>,
          fullKeys : FullKeys
        ) { /* Do nothing. */ });
        }

      export namespace Endpoint {
        export const OnMouseDownHelper = createContext(function(
          e : React.MouseEvent<_LabelLine.EndpointSvgRepresentation>,
          fullKeys : FullKeys,
          endpointIndex : 0 | 1
        ) { /* Do nothing. */ });
      }
    }
  }
};