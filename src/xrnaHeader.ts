export default 
`<!DOCTYPE ComplexDocument [
<!ELEMENT ComplexDocument (SceneNodeGeom?, ComplexDocument*, Label*, LabelList*, Complex*, WithComplex*)>
<!ATTLIST ComplexDocument Name CDATA #REQUIRED Author CDATA #IMPLIED ExpandUponWrite CDATA #IMPLIED PSScale CDATA #IMPLIED LandscapeMode CDATA #IMPLIED> 
<!ELEMENT Complex (SceneNodeGeom?, Label*, LabelList*, RNAMolecule*, ProteinMolecule*)>
<!ATTLIST Complex Name CDATA #REQUIRED Author CDATA #IMPLIED> 
<!ELEMENT WithComplex (SceneNodeGeom?, Label*, LabelList*, RNAMolecule*, ProteinMolecule*)>
<!ATTLIST WithComplex Name CDATA #REQUIRED Author CDATA #IMPLIED> 
<!ELEMENT RNAMolecule (SceneNodeGeom?, Label*, LabelList*, Nuc*, NucSegment*, (NucListData | Nuc)*, RNAFile*, BasePairs*, BasePair*, Parent?, AlignmentFile?)>
<!ATTLIST RNAMolecule Name CDATA #REQUIRED Author CDATA #IMPLIED>
<!-- parent is like for e.coli being the numbering --> 
<!ELEMENT Parent (RNAMolecule)>
<!ELEMENT AlignmentFile (#PCDATA)> 
<!ELEMENT BasePairs EMPTY>
<!ATTLIST BasePairs nucID CDATA #REQUIRED bpNucID CDATA #REQUIRED length CDATA #REQUIRED bpName CDATA #IMPLIED>
<!-- BasePair can be used after above BasePairs is implemented and refers to base pairs already set, even across strands. -->
<!ELEMENT BasePair EMPTY>
<!ATTLIST BasePair RefID CDATA #IMPLIED RefIDs CDATA #IMPLIED Type (Canonical | Wobble | MisMatch | Weak | Phosphate | Unknown) 'Unknown' Line5PDeltaX CDATA #IMPLIED Line5PDeltaY CDATA #IMPLIED Line3PDeltaX CDATA #IMPLIED Line3PDeltaY CDATA #IMPLIED LabelDeltaX CDATA #IMPLIED LabelDeltaY CDATA #IMPLIED Label5PSide CDATA #IMPLIED> 
<!ELEMENT NucListData (#PCDATA)>
<!ATTLIST NucListData StartNucID CDATA #IMPLIED DataType (NucChar | NucID.NucChar | NucID.NucChar.XPos.YPos | NucChar.XPos.YPos | NucID.NucChar.XPos.YPos.FormatType.BPID) 'NucID.NucChar.XPos.YPos.FormatType.BPID'> 
<!ELEMENT Label (StringLabel | CircleLabel | Trianglelabel | LineLabel | ParallelogramLabel)>
<!ATTLIST Label XPos CDATA #REQUIRED YPos CDATA #REQUIRED Color CDATA #IMPLIED>
<!ELEMENT StringLabel EMPTY> 
<!ATTLIST StringLabel FontName CDATA #IMPLIED FontType CDATA #IMPLIED FontSize CDATA #REQUIRED Angle CDATA #IMPLIED  Text CDATA #REQUIRED>
<!ELEMENT CircleLabel EMPTY> 
<!ATTLIST CircleLabel Arc0 CDATA #IMPLIED Arc1 CDATA #IMPLIED Radius CDATA #IMPLIED LineWidth CDATA #IMPLIED IsOpen CDATA #IMPLIED>
<!ELEMENT TriangleLabel EMPTY>
<!ATTLIST TriangleLabel TopPtX CDATA #REQUIRED TopPtY CDATA #REQUIRED LeftPtX CDATA #REQUIRED LeftPtY CDATA #REQUIRED RightPtX CDATA #REQUIRED RightPtY CDATA #REQUIRED LineWidth CDATA #IMPLIED IsOpen CDATA #IMPLIED>
<!ELEMENT LineLabel EMPTY> 
<!ATTLIST LineLabel X1 CDATA #REQUIRED Y1 CDATA #REQUIRED LineWidth CDATA #IMPLIED> 
<!ELEMENT ParallelogramLabel EMPTY>
<!ATTLIST ParallelogramLabel Angle1 CDATA #REQUIRED Side1 CDATA #REQUIRED Angle2 CDATA #REQUIRED Side2 CDATA #REQUIRED LineWidth CDATA #IMPLIED IsOpen CDATA #IMPLIED> 
<!ELEMENT LabelList (#PCDATA)>
<!ELEMENT NucSegment (NucChars)> 
<!ATTLIST NucSegment StartNucID CDATA #IMPLIED> 
<!ELEMENT NucChars (#PCDATA)>
<!ELEMENT NucSymbol (#PCDATA)> 
<!ELEMENT Nuc (Label*, LabelList?, NucSymbol?)>
<!ATTLIST Nuc NucID CDATA #IMPLIED NucChar CDATA #IMPLIED XPos CDATA #IMPLIED YPos CDATA #IMPLIED Color CDATA #IMPLIED FontID CDATA #IMPLIED FontSize CDATA #IMPLIED FormatType CDATA #IMPLIED BPParent CDATA #IMPLIED BPNucID CDATA #IMPLIED RefID CDATA #IMPLIED RefIDs CDATA #IMPLIED IsHidden CDATA #IMPLIED GroupName CDATA #IMPLIED IsSchematic CDATA #IMPLIED SchematicColor CDATA #IMPLIED SchematicLineWidth CDATA #IMPLIED SchematicBPLineWidth CDATA #IMPLIED SchematicBPGap CDATA #IMPLIED SchematicFPGap CDATA #IMPLIED SchematicTPGap CDATA #IMPLIED IsNucPath CDATA #IMPLIED NucPathColor CDATA #IMPLIED NucPathLineWidth CDATA #IMPLIED>
<!ELEMENT RNAFile EMPTY>
<!ATTLIST RNAFile FileName CDATA #REQUIRED FileType (NucChar | NucID.NucChar | NucID.NucChar.XPos.YPos | NucID.NucChar.XPos.YPos.FormatType.BPID) 'NucID.NucChar.XPos.YPos.FormatType.BPID'>
<!ELEMENT SceneNodeGeom EMPTY>
<!ATTLIST SceneNodeGeom CenterX CDATA #IMPLIED CenterY CDATA #IMPLIED Scale CDATA #IMPLIED>
]>`;