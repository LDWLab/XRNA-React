import { createContext } from "react";
import { RnaComplexKey, RnaMoleculeKey, NucleotideKey, FullKeys, RnaComplexProps as _RnaComplexProps, FullKeysRecord } from "../App";
import { RnaComplex as _RnaComplex } from "../components/app_specific/RnaComplex";
import { Nucleotide as _Nucleotide } from "../components/app_specific/Nucleotide";
import { LabelContent as _LabelContent } from "../components/app_specific/LabelContent";
import { BasePair as _BasePair } from "../components/app_specific/BasePair";
import { LabelLine as _LabelLine } from "../components/app_specific/LabelLine";
import { DEFAULT_SETTINGS } from "../ui/Setting";
import { InteractionConstraint } from "../ui/InteractionConstraint/InteractionConstraints";
import Font from "../data_structures/Font";
import Color from "../data_structures/Color";
import { DEFAULT_STROKE_WIDTH } from "../utils/Constants";
import React from "react";
import { ThemeProvider } from "../context/ThemeContext";

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
    export type UpdateRnaMoleculeNameHelper = (
      rnaComplexIndex : number,
      oldRnaMoleculeName : string,
      newRnaMoleculeName : string
    ) => void;
    export const UpdateRnaMoleculeNameHelper = createContext<UpdateRnaMoleculeNameHelper>(function(
      rnaComplexIndex : number,
      oldRnaMoleculeName : string,
      newRnaMoleculeName : string
    ) { /* Do nothing. */ });
    export const InteractionConstraintOptions = createContext(InteractionConstraint.DEFAULT_OPTIONS);
    export type UpdateInteractionConstraintOptions = (options : Partial<InteractionConstraint.Options>) => void;
    export const UpdateInteractionConstraintOptions = createContext<UpdateInteractionConstraintOptions>(function(options : Partial<InteractionConstraint.Options>) { /* Do nothing. */ });
    export type RerenderTriggersPerNucleotide = {
      setX : (x : number) => void
    };
    export const IndicesOfFrozenNucleotides = createContext<Record<RnaComplexKey, Record<RnaMoleculeKey, Set<NucleotideKey>>>>({});
    export const PushToUndoStack = createContext<() => void>(function() { /* Do nothing. */});
    export const RnaComplexProps = createContext<_RnaComplexProps | undefined>(undefined);
    export const SingularRnaComplexFlag = createContext<boolean | undefined>(undefined);
  }

  export namespace RnaComplex {
    export const Name = createContext("");
    export const Index = createContext(NaN);
    export const BasePairs = createContext<_RnaComplex.BasePairs>({});
    export const SingularRnaMoleculeFlag = createContext<boolean | undefined>(undefined);
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
    export type SetKeysToRerender = (nucleotideKeysToRerender : NucleotideKeysToRerender) => void;
    export const SetKeysToRerender = createContext<SetKeysToRerender>(function(nucleotideKeysToRerender : NucleotideKeysToRerender) { /* Do nothing. */ });
    export const LabelsOnlyFlag = createContext(false);
    export const Symbol = createContext<string>("");
    export const AverageBoundingRectHeight = createContext<number>(0);
  }

  export namespace BasePair {
    export const ClassName = createContext<string | undefined>(undefined);
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
    export type KeysToEditPerRnaComplex = {
      add : Array<{
        keys0 : _RnaComplex.BasePairKeys,
        keys1 : _RnaComplex.BasePairKeys
      }>,
      delete : Array<{
        keys0 : _RnaComplex.BasePairKeys,
        keys1 : _RnaComplex.BasePairKeys
      }>
    };
    export const DataToEditPerRnaComplex = createContext<KeysToEditPerRnaComplex | undefined>({
      add : [],
      delete : []
    });
    export type KeysToEdit = Record<RnaComplexKey, KeysToEditPerRnaComplex>;
    export type SetKeysToEdit = (keysToEdit : KeysToEdit) => void;
    export const SetKeysToEdit = createContext(function(keysToEdit : KeysToEdit) { /* Do nothing. */ });
    export type SetKeysToRerender = (basePairKeysToRerender : BasePairKeysToRerender) => void;
    export const SetKeysToRerender = createContext<SetKeysToRerender>(function(basePairKeysToRerender : BasePairKeysToRerender) { /* Do nothing. */ });
    export type UpdateAverageDistances = (
      rnaComplexKey : RnaComplexKey,
      distances : AllDistances
    ) => void;
    export const UpdateAverageDistances = createContext<UpdateAverageDistances>(function(
      rnaComplexKey : RnaComplexKey,
      distances : AllDistances
    ) {
      // Do nothing.
    });
    export type AverageDistances = Record<RnaComplexKey, AllDistances>;
    export const AverageDistances = createContext<AverageDistances>({});
    export const AverageStrokeWidth = createContext<number>(DEFAULT_STROKE_WIDTH);
    export type OnMouseDownHelper = (
      e : React.MouseEvent,
      fullKeys0 : FullKeys,
      fullKeys1 : FullKeys
    ) => void;
    export const OnMouseDownHelper = createContext<OnMouseDownHelper>(function(
      e : React.MouseEvent,
      fullKeys0 : FullKeys,
      fullKeys1 : FullKeys
    ) { /* Do nothing. */ });
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
      export type DefaultStyles = Record<RnaComplexKey, Record<RnaMoleculeKey, Style>>;
      export const DefaultStyles = createContext<DefaultStyles>({});
      export type UpdateDefaultStyle = (
        rnaComplexKey : RnaComplexKey,
        rnaMoleculeKey : RnaMoleculeKey,
        defaultStyle : Style
      ) => void;
      export const UpdateDefaultStyle = createContext<UpdateDefaultStyle>(function(
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

  export type Props = {
    children : React.ReactNode,
    settingsRecord : typeof DEFAULT_SETTINGS,
    setSettingsRecord : (newSettingsRecord : typeof DEFAULT_SETTINGS) => void,
    basePairOnMouseDownHelper : BasePair.OnMouseDownHelper,
    labelClassName? : string,
    basePairClassName? : string,
    pushToUndoStack : () => void,
    basePairRadius : number,
    indicesOfFrozenNucleotides : FullKeysRecord,
    labelContentDefaultStyles : Label.Content.DefaultStyles,
    basePairAverageDistances : BasePair.AverageDistances,
    updateBasePairAverageDistances : BasePair.UpdateAverageDistances,
    updateLabelContentDefaultStyles : Label.Content.UpdateDefaultStyle,
    interactionConstraintOptions : InteractionConstraint.Options,
    updateInteractionConstraintOptions : App.UpdateInteractionConstraintOptions,
    setNucleotideKeysToRerender : Nucleotide.SetKeysToRerender,
    setBasePairKeysToRerender : BasePair.SetKeysToRerender,
    updateRnaMoleculeNameHelper : App.UpdateRnaMoleculeNameHelper,
    setBasePairKeysToEdit : BasePair.SetKeysToEdit,
    singularRnaComplexFlag : boolean,
    averageNucleotideBoundingRectHeight : number
  };

  export function Component(props : Props) {
    const {
      children,
      settingsRecord,
      setSettingsRecord,
      basePairOnMouseDownHelper,
      labelClassName,
      basePairClassName,
      pushToUndoStack,
      basePairRadius,
      indicesOfFrozenNucleotides,
      labelContentDefaultStyles,
      basePairAverageDistances,
      updateBasePairAverageDistances,
      updateLabelContentDefaultStyles,
      interactionConstraintOptions,
      updateInteractionConstraintOptions,
      setNucleotideKeysToRerender,
      setBasePairKeysToRerender,
      updateRnaMoleculeNameHelper,
      setBasePairKeysToEdit,
      singularRnaComplexFlag,
      averageNucleotideBoundingRectHeight
    } = props;
    return <ThemeProvider
      settingsRecord={settingsRecord}
      updateSettings={(newSettings) => {
        const updatedSettings = { ...settingsRecord, ...newSettings };
        setSettingsRecord(updatedSettings);
      }}
    >
      <BasePair.OnMouseDownHelper.Provider value={basePairOnMouseDownHelper}>
        <App.PushToUndoStack.Provider value={pushToUndoStack}>
          <App.IndicesOfFrozenNucleotides.Provider value={indicesOfFrozenNucleotides}>
            <Label.ClassName.Provider value={labelClassName}>
              <BasePair.ClassName.Provider value={basePairClassName}>
                <BasePair.Radius.Provider value={basePairRadius}>
                  <BasePair.AverageDistances.Provider value={basePairAverageDistances}>
                    <BasePair.UpdateAverageDistances.Provider value={updateBasePairAverageDistances}>
                      <Label.Content.DefaultStyles.Provider value={labelContentDefaultStyles}>
                        <Label.Content.UpdateDefaultStyle.Provider value={updateLabelContentDefaultStyles}>
                          <App.InteractionConstraintOptions.Provider value={interactionConstraintOptions}>
                            <App.UpdateInteractionConstraintOptions.Provider value={updateInteractionConstraintOptions}>
                              <Nucleotide.SetKeysToRerender.Provider value={setNucleotideKeysToRerender}>
                                <BasePair.SetKeysToRerender.Provider value={setBasePairKeysToRerender}>
                                  <App.Settings.Provider value={settingsRecord}>
                                    <App.UpdateRnaMoleculeNameHelper.Provider value={updateRnaMoleculeNameHelper}>
                                      <BasePair.SetKeysToEdit.Provider value={setBasePairKeysToEdit}>
                                        <App.SingularRnaComplexFlag.Provider value = {singularRnaComplexFlag}>
                                          <Nucleotide.AverageBoundingRectHeight.Provider value = {averageNucleotideBoundingRectHeight}>
                                            {children}
                                          </Nucleotide.AverageBoundingRectHeight.Provider>
                                        </App.SingularRnaComplexFlag.Provider>
                                      </BasePair.SetKeysToEdit.Provider>
                                    </App.UpdateRnaMoleculeNameHelper.Provider>
                                  </App.Settings.Provider>
                                </BasePair.SetKeysToRerender.Provider>
                              </Nucleotide.SetKeysToRerender.Provider>
                            </App.UpdateInteractionConstraintOptions.Provider>
                          </App.InteractionConstraintOptions.Provider>
                        </Label.Content.UpdateDefaultStyle.Provider>
                      </Label.Content.DefaultStyles.Provider>
                    </BasePair.UpdateAverageDistances.Provider>
                  </BasePair.AverageDistances.Provider>
                </BasePair.Radius.Provider>
              </BasePair.ClassName.Provider>
            </Label.ClassName.Provider>
          </App.IndicesOfFrozenNucleotides.Provider>
        </App.PushToUndoStack.Provider>
      </BasePair.OnMouseDownHelper.Provider>
    </ThemeProvider>;
  }

  export const MemoizedComponent = React.memo(Component);
};