import { useState, useEffect, useMemo, useContext } from "react";
import { DuplicateBasePairKeysHandler, RnaComplex, insertBasePair } from "../RnaComplex";
import { NucleotideKey, RnaComplexKey, RnaComplexProps, RnaMoleculeKey } from "../../../App";
import { Context } from "../../../context/Context";

export namespace BasePairsEditor {
  export type ParsedBasePair = {
    nucleotideIndex0 : NucleotideKey,
    nucleotideIndex1 : NucleotideKey,
    length : number,
    rnaMoleculeName0 : RnaMoleculeKey,
    rnaMoleculeName1 : RnaMoleculeKey,
    rnaComplexIndex : RnaComplexKey,
  };

  function parseBasePairs(basePairsText : string) : Array<ParsedBasePair> {
    const parsedBasePairs = new Array<ParsedBasePair>();
    const lines = basePairsText.split("\n");
    for (let i = 0; i < lines.length; i++) {
      let line = lines[i];
      line = line.trim();
      const dataAsText = line.split(/\s+/);
      if (dataAsText.length < 3) {
        throw `Too few arguments were provided in line #${i + 1}. At a minimum, nucleotide index 0, nucleotide index 1 and length are expected.`;
      }
      let nucleotideIndex0 = Number.parseInt(dataAsText[0]);
      if (Number.isNaN(nucleotideIndex0)) {
        throw "The first parameter provided - nucleotide index 1 - is not a number.";
      }
      let nucleotideIndex1 = Number.parseInt(dataAsText[1]);
      if (Number.isNaN(nucleotideIndex1)) {
        throw "The second parameter provided - nucleotide index 2 - is not a number.";
      }
      const length = Number.parseInt(dataAsText[2]);
      if (Number.isNaN(length)) {
        throw "The third parameter provided - length - is not a number.";
      }
      let rnaMoleculeName0 : string | undefined = defaultRnaMoleculeName0;
      if (dataAsText.length >= 4) {
        rnaMoleculeName0 = dataAsText[3];  
      }
      if (rnaMoleculeName0 === undefined) {
        alert("The fourth parameter - RNA molecule name 1 - was expected, but was not provided.");
        return;
      }
      let rnaMoleculeName1 : string | undefined = defaultRnaMoleculeName1;
      if (dataAsText.length >= 5) {
        rnaMoleculeName1 = dataAsText[4];
      }
      if (rnaMoleculeName1 === undefined) {
        alert("The fifth parameter - RNA molecule name 2 - was expected, but was not provided.");
        return;
      }
      let rnaComplexName : string | undefined = defaultRnaComplexName;
      if (dataAsText.length >= 6) {
        rnaComplexName = dataAsText[5];
      }
      if (rnaComplexName === undefined) {
        alert("The sixth parameter - RNA complex name - was expected, but was not provided.");
        return;
      }
      let foundRnaComplex : {
        props : RnaComplex.ExternalProps,
        index : number
      } | undefined = undefined;
      for (let i = 0; i < flattenedRnaComplexProps.length; i++) {
        const singularRnaComplexProps = flattenedRnaComplexProps[i];
        if (singularRnaComplexProps.name === rnaComplexName) {
          foundRnaComplex = {
            props : singularRnaComplexProps,
            index : i
          };
        }
      }
      if (foundRnaComplex === undefined) {
        alert("The sixth parameter - RNA complex name - did not match any known RNA complex's name.");
        return;
      }
      if (!(rnaMoleculeName0 in foundRnaComplex.props.rnaMoleculeProps)) {
        alert("The fourth parameter - RNA molecule name 1 - did not match any known RNA molecule's name.");
        return;
      }
      const singularRnaMoleculeProps0 = foundRnaComplex.props.rnaMoleculeProps[rnaMoleculeName0];
      if (!(rnaMoleculeName1 in foundRnaComplex.props.rnaMoleculeProps)) {
        alert("The fifth parameter - RNA molecule name 2 - did not match any known RNA molecule's name.");
        return;
      }
      const singularRnaMoleculeProps1 = foundRnaComplex.props.rnaMoleculeProps[rnaMoleculeName1];
      nucleotideIndex0 -= singularRnaMoleculeProps0.firstNucleotideIndex;
      if (!(nucleotideIndex0 in singularRnaMoleculeProps0.nucleotideProps)) {
        alert("The first parameter - nucleotide index 1 - did not match any known nucleotide index.");
        return;
      }
      nucleotideIndex1 -= singularRnaMoleculeProps1.firstNucleotideIndex;
      if (!(nucleotideIndex1 in singularRnaMoleculeProps1.nucleotideProps)) {
        alert("The second parameter - nucleotide index 2 - did not match any known nucleotide index.");
        return;
      }
      parsedBasePairs.push({
        nucleotideIndex0,
        nucleotideIndex1,
        length,
        rnaMoleculeName0,
        rnaMoleculeName1,
        rnaComplexIndex : foundRnaComplex.index
      });
    }
    return parsedBasePairs;
  }

  export type Props = {
    rnaComplexProps : RnaComplexProps,
    initialBasePairsText? : string,
    // string represents an error message. Void represents approval.
    approveParsedBasePairs : (parsedBasePairs : Array<ParsedBasePair>) => string | void,
    defaultRnaMoleculeName0? : string,
    defaultRnaMoleculeName1? : string,
    defaultRnaComplexName? : string
  };

  export function Component(props : Props) {
    const {
      rnaComplexProps,
      initialBasePairsText,
      approveParsedBasePairs,
      defaultRnaMoleculeName0,
      defaultRnaMoleculeName1,
      defaultRnaComplexName
    } = props;
    // Begin context data.
    const setBasePairDataToEdit = useContext(Context.BasePair.SetDataToEdit);
    // Begin state data.
    const [
      basePairsText,
      setBasePairsText
    ] = useState(initialBasePairsText ?? "");
    const [
      overrideConflictingBasePairsFlag,
      setOverrideConflictingBasePairsFlag
    ] = useState(false);
    // Begin memo data.
    const flattenedRnaComplexProps = useMemo(
      function() {
        return Object.values(rnaComplexProps);
      },
      [rnaComplexProps]
    );
    const x = useMemo(
      function() {
        
      },
      []
    );
    return <>
      <b>
        Base pairs:
      </b>
      <br/>
      <label>
        Override conflicting base pairs:&nbsp;
        <input
          type = "checkbox"
          onClick = {function() {
            setOverrideConflictingBasePairsFlag(!overrideConflictingBasePairsFlag);
          }}
        />
      </label>
      <br/>
      <textarea
        value = {basePairsText}
        onChange = {function(e) {
          const newBasePairsText = e.target.value;
          setBasePairsText(newBasePairsText);
        }}
      />
      <br/>
      <button
        onClick = {function() {
          try {

          } catch (error) {
            
          }
          const parsedBasePairs = parseBasePairs();
          const potentialErrorMessage = approveParsedBasePairs(parsedBasePairs);
          if (typeof potentialErrorMessage === "string") {
            alert(potentialErrorMessage);
            return;
          }
          const basePairKeysToEdit : Record<RnaComplexKey, Context.BasePair.KeysToEditPerRnaComplexType> = {};
          for (let parsedBasePair of parsedBasePairs) {
            let {
              nucleotideIndex0,
              nucleotideIndex1,
              length,
              rnaMoleculeName0,
              rnaMoleculeName1,
              rnaComplexIndex
            } = parsedBasePair;
            if (!(rnaComplexIndex in basePairKeysToEdit)) {
              basePairKeysToEdit[rnaComplexIndex] = {
                add : [],
                delete : []
              };
            }
            const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[rnaComplexIndex];
            for (let i = 0; i < length; i++) {
              const formattedNucleotideIndex0 = nucleotideIndex0 + i;
              const formattedNucleotideIndex1 = nucleotideIndex1 - i;
              basePairKeysToEditPerRnaComplex.add.push(
                {
                  rnaMoleculeName : rnaMoleculeName0,
                  nucleotideIndex : formattedNucleotideIndex0
                },
                {
                  rnaMoleculeName : rnaMoleculeName1,
                  nucleotideIndex : formattedNucleotideIndex1
                }
              );
              try {
                const basePairKeysToDelete = insertBasePair(
                  rnaComplexProps[rnaComplexIndex],
                  rnaMoleculeName0,
                  formattedNucleotideIndex0,
                  rnaMoleculeName1,
                  formattedNucleotideIndex1,
                  overrideConflictingBasePairsFlag ? DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING : DuplicateBasePairKeysHandler.THROW_ERROR
                );
                basePairKeysToEditPerRnaComplex.delete.push(...basePairKeysToDelete);
              } catch (error) {
                if (typeof error === "string") {
                  const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
                  const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
                  const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
                  alert(`The base pair between RNA molecule "${rnaMoleculeName0}", nucleotide index #${singularRnaMoleculeProps0.firstNucleotideIndex + formattedNucleotideIndex0} and "${rnaMoleculeName1}", nucleotide index #${singularRnaMoleculeProps1.firstNucleotideIndex + formattedNucleotideIndex1} was not created, because a conflicting, pre-existing base pair was found.`);
                } else {
                  throw error;
                }
              }
            }
          }
          setBasePairDataToEdit(basePairKeysToEdit);
        }}
      >
        Update base pairs
      </button>
    </>;
  }
}