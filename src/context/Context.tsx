import { createContext } from "react";
import { RnaComplexKey, RnaMoleculeKey, NucleotideKey, FullKeys } from "../App";
import { RnaComplex as _RnaComplex } from "../components/app_specific/RnaComplex";
import { Nucleotide as _Nucleotide } from "../components/app_specific/Nucleotide";
import { LabelContent as _LabelContent } from "../components/app_specific/LabelContent";
import { BasePair as _BasePair } from "../components/app_specific/BasePair";
import { LabelLine as _LabelLine } from "../components/app_specific/LabelLine";
import { DEFAULT_SETTINGS } from "../ui/Setting";
import { InteractionConstraint } from "../ui/InteractionConstraint/InteractionConstraints";
import Font from "../data_structures/Font";
import Color, { BLACK } from "../data_structures/Color";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";

export type NucleotideKeysToRerenderPerRnaMolecule = Array<NucleotideKey>;
export type NucleotideKeysToRerenderPerRnaComplex = Record<RnaMoleculeKey, NucleotideKeysToRerenderPerRnaMolecule>;
export type NucleotideKeysToRerender = Record<RnaComplexKey, NucleotideKeysToRerenderPerRnaComplex>;

export type BasePairKeysToRerenderPerRnaComplex = Array<_RnaComplex.BasePairKeys>;
export type BasePairKeysToRerender = Record<RnaComplexKey, BasePairKeysToRerenderPerRnaComplex>;

export namespace Context {
  export namespace App {
    export const SetMouseOverText = createContext(function(mouseOverText : string) { /* Do nothing. */ })
    export const Settings = createContext(DEFAULT_SETTINGS);
    export const ComplexDocumentName = createContext("");
    export const SetComplexDocumentName = createContext(function(newComplexDocumentName : string) { /* Do nothing. */ });
    export const UpdateRnaMoleculeNameHelper = createContext(function(
      rnaComplexIndex : number,
      oldRnaMoleculeName : string,
      newRnaMoleculeName : string
    ) { /* Do nothing. */ });
    export const InteractionConstraintOptions = createContext(InteractionConstraint.DEFAULT_OPTIONS);
    export const UpdateInteractionConstraintOptions = createContext(function(options : Partial<InteractionConstraint.Options>) { /* Do nothing. */ });
    export type RerenderTriggersPerNucleotide = {
      setX : (x : number) => void
    };
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
    export const SetKeysToRerender = createContext(function(nucleotideKeysToRerender : NucleotideKeysToRerender) { /* Do nothing. */ });
    export const LabelsOnlyFlag = createContext(false);
  }

  export namespace BasePair {
    export type Distances = Record<_BasePair.Type, number>;
    export type AllDistances = {
      distances : Distances,
      radius : number,
      helixDistance : number
    };
    export const DEFAULT_RADIUS = 1;

    export const DEFAULT_DISTANCES = {} as Distances;
    for (const basePairType of _BasePair.types) {
      DEFAULT_DISTANCES[basePairType] = DEFAULT_RADIUS * 12;
    }
    export const Radius = createContext(DEFAULT_RADIUS);
    export type KeysToEditPerRnaComplexType = {
      add : Array<_RnaComplex.BasePairKeys>,
      delete : Array<_RnaComplex.BasePairKeys>
    };
    export const DataToEditPerRnaComplex = createContext<KeysToEditPerRnaComplexType | undefined>({
      add : [],
      delete : []
    });
    export type KeysToEdit = Record<RnaComplexKey, KeysToEditPerRnaComplexType>;
    export type SetKeysToEdit = (keysToEdit : KeysToEdit) => void;
    export const SetKeysToEdit = createContext(function(keysToEdit : KeysToEdit) { /* Do nothing. */ });
    export const SetKeysToRerender = createContext(function(basePairKeysToRerender : BasePairKeysToRerender) { /* Do nothing. */ });
    export const UpdateAverageDistances = createContext(function(
      rnaComplexKey : RnaComplexKey,
      distances : AllDistances
    ) {
      // Do nothing.
    });
    export const AverageDistances = createContext<Record<RnaComplexKey, AllDistances>>({});
    export const AverageStrokeWidth = createContext<number>(DEFAULT_STROKE_WIDTH);
  };

  export namespace Label {
    export const ClassName = createContext<string | undefined>(undefined);

    export namespace Content {
      export const OnMouseDownHelper = createContext(function(
        e : React.MouseEvent<_LabelContent.SvgRepresentation>,
        fullKeys : FullKeys
      ) { /* Do nothing. */ });
      export type Style = {
        font : Font,
        color : Color
      };
      export const DefaultStyles = createContext<Record<RnaComplexKey, Record<RnaMoleculeKey, Style>>>({});
      export const UpdateDefaultStyle = createContext(function(
        rnaComplexKey : RnaComplexKey,
        rnaMoleculeKey : RnaMoleculeKey,
        defaultStyle : Style
      ) { /* Do nothing. */});
    }
    
    export namespace Line {
      export namespace Body {
        export const OnMouseDownHelper = createContext(function(
          e : React.MouseEvent<_LabelLine.BodySvgRepresentation>,
          fullKeys : FullKeys,
          helper : () => void
        ) { /* Do nothing. */ });
        }

      export namespace Endpoint {
        export const OnMouseDownHelper = createContext(function(
          e : React.MouseEvent<_LabelLine.EndpointSvgRepresentation>,
          fullKeys : FullKeys,
          pointIndex : number,
          helper : () => void
        ) { /* Do nothing. */ });
      }
    }
  }

  export namespace OrientationEditor {
    export const ResetDataTrigger = createContext(false);
  }

  export namespace Collapsible {
    export const Width = createContext<"auto" | "100%" | number | undefined>(undefined);
  }
};