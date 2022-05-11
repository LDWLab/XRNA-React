import { RNAMolecule } from "./RNAMolecule";

class RNAComplex {
  public name : string;
  public rnaMolecules : Array<RNAMolecule>;
  
  public constructor(name : string) {
    this.name = name;
    this.rnaMolecules = new Array<RNAMolecule>();
  }
}

export { RNAComplex };