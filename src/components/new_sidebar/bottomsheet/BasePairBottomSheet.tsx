import React, { useEffect, useMemo, useRef, useState, useContext, useCallback } from "react";
import { Theme, useTheme } from "../../../context/ThemeContext";
import {
  RnaComplexProps,
  RnaMoleculeKey,
  NucleotideKey,
  RnaComplexKey,
  FullKeys,
} from "../../../App";
import BasePair, { getBasePairType } from "../../app_specific/BasePair";
import { RnaMolecule } from "../../app_specific/RnaMolecule";
import {
  RnaComplex,
  compareBasePairKeys,
  insertBasePair,
  DuplicateBasePairKeysHandler,
  selectRelevantBasePairKeys,
  compareFullBasePairKeys,
} from "../../app_specific/RnaComplex";
import { Context } from "../../../context/Context";
import { Setting } from "../../../ui/Setting";
import { Vector2D, add, subtract, scaleUp, normalize, magnitude, orthogonalize, dotProduct, negate } from "../../../data_structures/Vector2D";
import { Pencil, Check, Trash2, X, Download, Upload } from "lucide-react";
import { repositionNucleotidesForBasePairs } from "../../../utils/BasePairRepositioner";
import { Helix, iterateOverFreeNucleotidesAndHelicesPerScene } from "../../../ui/InteractionConstraint/InteractionConstraints";

export type FullKeysRecord = Record<
  RnaComplexKey,
  Record<RnaMoleculeKey, Set<NucleotideKey>>
>;

export interface BasePairBottomSheetProps {
  open: boolean;
  onClose: () => void;
  rnaComplexProps: RnaComplexProps;
  globalHelices : Array<Helix>;
  errorMessage? : string;
  constrainRelevantHelices : (helices : Array<Helix>) => Array<Helix>;
  handleNewBasePair : (fullKeys0 : FullKeys, fullKeys1 : FullKeys) => void;
  removeBasePair : (rnaComplexIndex : RnaComplexKey, rnaMoleculeName0 : RnaMoleculeKey, rnaMoleculeName1 : RnaMoleculeKey, nucleotideIndex0 : NucleotideKey, nucleotideIndex1 : NucleotideKey) => void;
  reformatSelectedHelices : (selectedHelices : Array<Helix>) => void;
}

type Orientation = "cis" | "trans";
type Edge = "watson_crick" | "hoogsteen" | "sugar_edge";
type TypeBase = "auto" | "canonical" | "wobble" | "mismatch" | "custom";

type Row = {
  rnaComplexIndex: number;
  rnaComplexName: string;
  rnaMoleculeName0: string;
  nucleotideIndex0: number;
  formattedNucleotideIndex0: number;
  rnaMoleculeName1: string;
  nucleotideIndex1: number;
  formattedNucleotideIndex1: number;
  type?: BasePair.Type;
};

type GroupedRow = {
  rnaComplexIndex: number;
  rnaComplexName: string;
  rnaMoleculeName0: string;
  nucleotideIndex0Start: number;
  nucleotideIndex0End: number;
  formattedNucleotideIndex0Start: number;
  formattedNucleotideIndex0End: number;
  rnaMoleculeName1: string;
  nucleotideIndex1Start: number;
  nucleotideIndex1End: number;
  formattedNucleotideIndex1Start: number;
  formattedNucleotideIndex1End: number;
  type?: BasePair.Type;
  length: number;
  isGrouped: true;
};

function parseDirectedType(t?: BasePair.Type): {
  orientation?: Orientation;
  edgeA?: Edge;
  edgeB?: Edge;
} {
  if (!t) return {};
  if (
    t === BasePair.Type.CANONICAL ||
    t === BasePair.Type.WOBBLE ||
    t === BasePair.Type.MISMATCH
  )
    return {};
  const tokens = String(t).split("_");
  if (tokens.length === 0) return {};
  const o = tokens[0];
  if (o !== "cis" && o !== "trans") return {};
  const orientation = o as Orientation;
  let i = 1;
  function readEdge(): Edge | undefined {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a === "watson" && b === "crick") {
      i += 2;
      return "watson_crick";
    }
    if (a === "sugar" && b === "edge") {
      i += 2;
      return "sugar_edge";
    }
    if (a === "hoogsteen") {
      i += 1;
      return "hoogsteen";
    }
    return undefined;
  }
  const edgeA = readEdge();
  const edgeB = readEdge();
  if (!edgeA || !edgeB) return { orientation };
  return { orientation, edgeA, edgeB };
}

function assembleDirectedType(
  orientation?: Orientation,
  edgeA?: Edge,
  edgeB?: Edge
): BasePair.Type | undefined {
  if (!orientation || !edgeA || !edgeB) return undefined;
  const value = `${orientation}_${edgeA}_${edgeB}` as BasePair.Type;
  return value;
}

function decomposeTypeBase(t?: BasePair.Type): TypeBase {
  if (!t) return "auto";
  switch (t) {
    case BasePair.Type.CANONICAL:
      return "canonical";
    case BasePair.Type.WOBBLE:
      return "wobble";
    case BasePair.Type.MISMATCH:
      return "mismatch";
    default:
      return "custom";
  }
}

function formatTypeBaseLabel(typeBase: TypeBase): string {
  return typeBase === "custom" ? "LW schema" : typeBase;
}

function IconButton(props: {
  title?: string;
  onClick?: () => void;
  kind: "edit" | "delete" | "save" | "cancel";
  theme : Theme;
}) {
  const { title, onClick, kind, theme } = props;
  const base: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.background,
    color: theme.colors.text,
    cursor: "pointer",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const iconMap = {
    edit: Pencil,
    delete: Trash2,
    save: Check,
    cancel: X,
  };

  const Icon = iconMap[kind];
  return (
    <button title={title} onClick={onClick} style={base}>
      <Icon size={16} />
    </button>
  );
}

const MemoizedIconButton = React.memo(IconButton);

function getBasePairTypeFromNucleotides(symbol0: string, symbol1: string): BasePair.Type {
  // Import the getBasePairType function logic
  // This is a simplified version - in a real implementation, you'd want to use the actual function
  const normalizedSymbol0 = symbol0.toUpperCase();
  const normalizedSymbol1 = symbol1.toUpperCase();
  
  // Watson-Crick base pairs
  if ((normalizedSymbol0 === 'A' && normalizedSymbol1 === 'U') || 
      (normalizedSymbol0 === 'U' && normalizedSymbol1 === 'A') ||
      (normalizedSymbol0 === 'G' && normalizedSymbol1 === 'C') || 
      (normalizedSymbol0 === 'C' && normalizedSymbol1 === 'G')) {
    return BasePair.Type.CANONICAL;
  }
  
  // Wobble base pairs (G-U)
  if ((normalizedSymbol0 === 'G' && normalizedSymbol1 === 'U') || 
      (normalizedSymbol0 === 'U' && normalizedSymbol1 === 'G')) {
    return BasePair.Type.WOBBLE;
  }
  
  // Everything else is a mismatch
  return BasePair.Type.MISMATCH;
}

export const BasePairBottomSheet: React.FC<BasePairBottomSheetProps> = ({
  open,
  onClose,
  rnaComplexProps,
  globalHelices,
  errorMessage,
  constrainRelevantHelices: constrainRelevantHelices,
  handleNewBasePair,
  removeBasePair,
  reformatSelectedHelices
}) => {
  const { theme } = useTheme();
  const [height, setHeight] = useState<number>(360);
  const [isResizing, setIsResizing] = useState(false);
  type ViewMode = "Base Pairs" | "Helices";
  const [viewMode, setViewMode] = useState<ViewMode>("Base Pairs");
  type SelectionMode = "Constrained" | "Global"
  const [selectionMode, setSelectionMode] = useState<SelectionMode>("Constrained");
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHRef = useRef<number>(360);
  const globalHelicesRef = useRef(globalHelices);
  globalHelicesRef.current = globalHelices;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [repositionWithCalculatedDistances, setRepositionWithCalculatedDistances] = useState<boolean>(false);
  const repositionWithCalculatedDistancesReference = useRef(repositionWithCalculatedDistances);
  repositionWithCalculatedDistancesReference.current = repositionWithCalculatedDistances;
  const [rnaComplexesAreASingleton, setRnaComplexesAreASingleton] = useState<boolean>(true);
  const [rnaMoleculesAreASingleton, setRnaMoleculesAreASingleton] = useState<boolean>(true);
  type AddForm = {
    rnaComplexIndex?: number;
    rnaMoleculeName0?: string;
    formattedNucleotideIndex0?: number;
    rnaMoleculeName1?: string;
    formattedNucleotideIndex1?: number;
    length?: number;
    typeBase: TypeBase;
    orientation?: Orientation;
    edgeA?: Edge;
    edgeB?: Edge;
  };
  const [addForm, setAddForm] = useState<AddForm>(() => {
    const defaultComplexIndex = rnaComplexesAreASingleton ? Number.parseInt(Object.keys(rnaComplexProps)[0]) : undefined;
    let defaultMoleculeName0: string | undefined = undefined;
    let defaultMoleculeName1: string | undefined = undefined;
    
    if (defaultComplexIndex !== undefined && rnaComplexProps[defaultComplexIndex]) {
      const moleculeNames = Object.keys(rnaComplexProps[defaultComplexIndex].rnaMoleculeProps);
      if (moleculeNames.length > 0) {
        defaultMoleculeName0 = moleculeNames[0];
        defaultMoleculeName1 = moleculeNames[0];
      }
    }
    
    return {
      typeBase: "auto",
      rnaComplexIndex: defaultComplexIndex,
      rnaMoleculeName0: defaultMoleculeName0,
      rnaMoleculeName1: defaultMoleculeName1,
      length: 1
    };
  });
  const [editRowIndex, setEditRowIndex] = useState<number>();
  const [editForm, setEditForm] = useState<{
    rnaComplexIndex?: number;
    rnaMoleculeName0?: string;
    formattedNucleotideIndex0?: number;
    rnaMoleculeName1?: string;
    formattedNucleotideIndex1?: number;
    typeBase?: TypeBase;
    orientation?: Orientation;
    edgeA?: Edge;
    edgeB?: Edge;
    length?: number;
  }>({});
  const [updateCalculatedRowsTrigger, setUpdateCalculatedRowsTrigger] = useState(false);

  const rnaComplexPropsReference = useRef<RnaComplexProps>(rnaComplexProps);
  rnaComplexPropsReference.current = rnaComplexProps;
  const isResizingReference = useRef(isResizing);
  isResizingReference.current = isResizing;

  const setBasePairKeysToEdit = useContext(Context.BasePair.SetKeysToEdit);
  const setBasePairKeysToEditReference = useRef(setBasePairKeysToEdit);
  const pushToUndoStack = useContext(Context.App.PushToUndoStack);
  const pushToUndoStackReference = useRef(pushToUndoStack);
  pushToUndoStackReference.current = pushToUndoStack;
  const settingsRecord = useContext(Context.App.Settings);
  const averageDistances = useContext(Context.BasePair.AverageDistances);
  const averageDistancesReference = useRef(averageDistances);
  averageDistancesReference.current = averageDistances;
  const settingsRecordReference = useRef(settingsRecord);
  settingsRecordReference.current = settingsRecord;

  useEffect(
    () => {
      function onMove(e: MouseEvent) {
        const isResizing = isResizingReference.current;
        if (!isResizing) return;
        const dy = startYRef.current - e.clientY;
        const newH = Math.min(
          Math.max(startHRef.current + dy, 220),
          window.innerHeight - 80
        );
        setHeight(newH);
      }
      function onUp() {
        const isResizing = isResizingReference.current;
        if (isResizing) setIsResizing(false);
      }
      window.addEventListener("mousemove", onMove);
      window.addEventListener("mouseup", onUp);
      return () => {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("mouseup", onUp);
      };
    },
    []
  );

  const filteredHelices = useMemo(
    () => selectionMode === "Constrained" ? constrainRelevantHelices(globalHelices) : globalHelices,
    [
      selectionMode,
      constrainRelevantHelices,
      globalHelices
    ]
  );
  const filteredHelicesRef = useRef(filteredHelices);
  filteredHelicesRef.current = filteredHelices;

  const { selectedBasePairs, selectedHelices } = useMemo(
    () => {
      const selectedBasePairs : Array<Row> = [];
      const selectedHelices : Array<GroupedRow> = [];
      for (const helix of filteredHelices) {
        const {
          rnaComplexIndex,
          rnaMoleculeName0,
          rnaMoleculeName1,
          start,
          stop
        } = helix;
        const singularRnaComplexProps = rnaComplexProps[rnaComplexIndex];
        const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName0];
        const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[rnaMoleculeName1];
        const length = Math.abs(start[0] - stop[0]) + 1;
        const increment0 = Math.sign(stop[0] - start[0]);
        const increment1 = Math.sign(stop[1] - start[1]);
        let nucleotideIndex0 = start[0];
        let nucleotideIndex1 = start[1];
        let helixBasePairType: undefined | null | BasePair.Type = undefined;

        for (let i = 0; i < length; i++) {
          const basePairsPerRnaMolecule0 = singularRnaComplexProps.basePairs[rnaMoleculeName0];
          const basePairsPerNucleotide0 = basePairsPerRnaMolecule0?.[nucleotideIndex0];
          const relevantBasePair = basePairsPerNucleotide0?.find(
            (basePair) => (
              basePair.rnaMoleculeName === rnaMoleculeName1 &&
              basePair.nucleotideIndex === nucleotideIndex1
            )
          );

          if (relevantBasePair === undefined) {
            helixBasePairType = null;
            nucleotideIndex0 += increment0;
            nucleotideIndex1 += increment1;
            continue;
          }

          const basePairType = relevantBasePair.basePairType;

          if (helixBasePairType === undefined) {
            helixBasePairType = basePairType ?? null;
          } else if (helixBasePairType !== basePairType) {
            helixBasePairType = null;
          }

          selectedBasePairs.push({
            rnaComplexIndex,
            rnaComplexName: singularRnaComplexProps.name,
            rnaMoleculeName0,
            nucleotideIndex0,
            formattedNucleotideIndex0:
              singularRnaMoleculeProps0.firstNucleotideIndex + nucleotideIndex0,
            rnaMoleculeName1,
            nucleotideIndex1,
            formattedNucleotideIndex1:
              singularRnaMoleculeProps1.firstNucleotideIndex + nucleotideIndex1,
            type: basePairType,
          });

          nucleotideIndex0 += increment0;
          nucleotideIndex1 += increment1;
        }
        selectedHelices.push({
          rnaComplexIndex,
          rnaComplexName: singularRnaComplexProps.name,
          rnaMoleculeName0,
          nucleotideIndex0Start: start[0],
          nucleotideIndex0End: stop[0],
          formattedNucleotideIndex0Start:
            start[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
          formattedNucleotideIndex0End:
            stop[0] + singularRnaMoleculeProps0.firstNucleotideIndex,
          rnaMoleculeName1,
          nucleotideIndex1Start: start[1],
          nucleotideIndex1End: stop[1],
          formattedNucleotideIndex1Start:
            start[1] + singularRnaMoleculeProps1.firstNucleotideIndex,
          formattedNucleotideIndex1End:
            stop[1] + singularRnaMoleculeProps1.firstNucleotideIndex,
          type: helixBasePairType === null ? undefined : helixBasePairType,
          length,
          isGrouped: true,
        });
      }
      return {
        selectedBasePairs,
        selectedHelices,
      };
    },
    [
      rnaComplexProps,
      filteredHelices,
    ]
  );
  const rows = useMemo(
    () => (viewMode === "Base Pairs" ? selectedBasePairs : selectedHelices),
    [viewMode, selectedHelices, selectedBasePairs]
  );

  const csvEscape = useCallback(
    (value: string) => {
      if (value == null) return "";
      const needsQuotes = /[",\n]/.test(value);
      const escaped = value.replace(/"/g, '""');
      return needsQuotes ? `"${escaped}"` : escaped;
    },
    []
  );

  const splitCsvLine = useCallback(
    (line: string): string[] => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (inQuotes) {
          if (ch === '"') {
            if (i + 1 < line.length && line[i + 1] === '"') {
              current += '"';
              i++;
            } else {
              inQuotes = false;
            }
          } else {
            current += ch;
          }
        } else {
          if (ch === ',') {
            result.push(current);
            current = "";
          } else if (ch === '"') {
            inQuotes = true;
          } else {
            current += ch;
          }
        }
      }
      result.push(current);
      return result;
    },
    []
  );

  const isGroupedRow = useCallback(
    (row: Row | GroupedRow): row is GroupedRow => (row as GroupedRow).isGrouped === true,
    []
  );

  const exportCsv = useCallback(
    () => {
      const header = [
        "rnaComplexName",
        "rnaMoleculeName0",
        "formattedNucleotideIndex0",
        "rnaMoleculeName1",
        "formattedNucleotideIndex1",
        "typeBase",
        "orientation",
        "edgeA",
        "edgeB",
      ].join(",");
      
      // Expand grouped rows back to individual rows for export
      const expandedRows: Row[] = [];
      for (const r of rows) {
        if (isGroupedRow(r)) {
          // Expand grouped row into individual rows
          // Determine direction of second strand
          const direction1 = r.nucleotideIndex1End > r.nucleotideIndex1Start ? 1 : -1;
          const direction1Formatted = r.formattedNucleotideIndex1End > r.formattedNucleotideIndex1Start ? 1 : -1;
          
          for (let i = 0; i < r.length; i++) {
            expandedRows.push({
              rnaComplexIndex: r.rnaComplexIndex,
              rnaComplexName: r.rnaComplexName,
              rnaMoleculeName0: r.rnaMoleculeName0,
              nucleotideIndex0: r.nucleotideIndex0Start + i,
              formattedNucleotideIndex0: r.formattedNucleotideIndex0Start + i,
              rnaMoleculeName1: r.rnaMoleculeName1,
              nucleotideIndex1: r.nucleotideIndex1Start + (i * direction1),
              formattedNucleotideIndex1: r.formattedNucleotideIndex1Start + (i * direction1Formatted),
              type: r.type,
            });
          }
        } else {
          expandedRows.push(r);
        }
      }
      
      const lines = expandedRows.map((r) => {
        const base = decomposeTypeBase(r.type);
        const { orientation, edgeA, edgeB } = parseDirectedType(r.type);
        return [
          csvEscape(r.rnaComplexName),
          csvEscape(r.rnaMoleculeName0),
          String(r.formattedNucleotideIndex0),
          csvEscape(r.rnaMoleculeName1),
          String(r.formattedNucleotideIndex1),
          csvEscape(base),
          csvEscape(orientation ?? ""),
          csvEscape(edgeA ?? ""),
          csvEscape(edgeB ?? ""),
        ].join(",");
      });
      const csv = [header, ...lines].join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "base_pairs.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
    [isGroupedRow, csvEscape, rows]
  );
  const parseAndApplyCsv = useCallback(
    (text: string) => {
      const rnaComplexProps = rnaComplexPropsReference.current;
      const normalized = text.replace(/\r\n?/g, "\n");
      const lines = normalized.split("\n").filter((l) => l.trim().length > 0);
      if (lines.length === 0) {
        throw "CSV is empty.";
      }
      const header = splitCsvLine(lines[0]).map((s) => s.trim());
      const expected = [
        "rnaComplexName",
        "rnaMoleculeName0",
        "formattedNucleotideIndex0",
        "rnaMoleculeName1",
        "formattedNucleotideIndex1",
        "typeBase",
        "orientation",
        "edgeA",
        "edgeB",
      ];
      if (
        header.length !== expected.length ||
        !expected.every((h, i) => header[i] === h)
      ) {
        throw `CSV header is invalid. Expected: ${expected.join(",")}`;
      }

      type Op = {
        rnaComplexIndex: number;
        mol0: string;
        idx0: number;
        mol1: string;
        idx1: number;
        type?: BasePair.Type;
      };

      const ops: Op[] = [];

      const allowedTypeBases = new Set([
        "auto",
        "canonical",
        "wobble",
        "mismatch",
        "custom",
      ] as const);
      const allowedOrientations = new Set(["cis", "trans"] as const);
      const allowedEdges = new Set([
        "watson_crick",
        "hoogsteen",
        "sugar_edge",
      ] as const);

      for (let i = 1; i < lines.length; i++) {
        const raw = lines[i];
        if (raw.trim().length === 0) continue;
        const cols = splitCsvLine(raw).map((c) => c.trim());
        if (cols.length !== expected.length) {
          throw `Line #${i + 1} has ${cols.length} column(s); expected ${expected.length}.`;
        }
        const [
          complexName,
          mol0,
          idx0Str,
          mol1,
          idx1Str,
          typeBaseStr,
          orientationStr,
          edgeAStr,
          edgeBStr,
        ] = cols;

        const entry = Object.entries(rnaComplexProps).find(
          ([, c]) => c.name === complexName
        );
        if (!entry) {
          throw `Line #${i + 1}: Unknown RNA complex name '${complexName}'.`;
        }
        const rnaComplexIndex = parseInt(entry[0]);
        const complex = rnaComplexProps[rnaComplexIndex];

        if (!(mol0 in complex.rnaMoleculeProps)) {
          throw `Line #${i + 1}: Unknown RNA molecule #1 '${mol0}'.`;
        }
        if (!(mol1 in complex.rnaMoleculeProps)) {
          throw `Line #${i + 1}: Unknown RNA molecule #2 '${mol1}'.`;
        }
        const mp0 = complex.rnaMoleculeProps[mol0];
        const mp1 = complex.rnaMoleculeProps[mol1];

        if (!/^[-+]?\d+$/.test(idx0Str)) {
          throw `Line #${i + 1}: formattedNucleotideIndex0 is not an integer.`;
        }
        if (!/^[-+]?\d+$/.test(idx1Str)) {
          throw `Line #${i + 1}: formattedNucleotideIndex1 is not an integer.`;
        }
        const formatted0 = parseInt(idx0Str);
        const formatted1 = parseInt(idx1Str);
        const idx0 = formatted0 - mp0.firstNucleotideIndex;
        const idx1 = formatted1 - mp1.firstNucleotideIndex;
        if (!(idx0 in mp0.nucleotideProps)) {
          throw `Line #${i + 1}: Nucleotide #1 index '${formatted0}' does not exist in '${mol0}'.`;
        }
        if (!(idx1 in mp1.nucleotideProps)) {
          throw `Line #${i + 1}: Nucleotide #2 index '${formatted1}' does not exist in '${mol1}'.`;
        }

        const tb = typeBaseStr.toLowerCase();
        if (!allowedTypeBases.has(tb as any)) {
          throw `Line #${i + 1}: Invalid typeBase '${typeBaseStr}'.`;
        }
        let newType: BasePair.Type | undefined;
        if (tb === "auto") newType = undefined;
        else if (tb === "canonical") newType = BasePair.Type.CANONICAL;
        else if (tb === "wobble") newType = BasePair.Type.WOBBLE;
        else if (tb === "mismatch") newType = BasePair.Type.MISMATCH;
        else if (tb === "custom") {
          const o = orientationStr as Orientation;
          const eA = edgeAStr as Edge;
          const eB = edgeBStr as Edge;
          if (!allowedOrientations.has(o as any)) {
            throw `Line #${i + 1}: orientation must be 'cis' or 'trans' for custom types.`;
          }
          if (!allowedEdges.has(eA as any) || !allowedEdges.has(eB as any)) {
            throw `Line #${i + 1}: edgeA/edgeB must be one of watson_crick, hoogsteen, sugar_edge.`;
          }
          newType = assembleDirectedType(o, eA, eB);
          if (!newType) {
            throw `Line #${i + 1}: invalid custom type configuration.`;
          }
        }

        ops.push({ rnaComplexIndex, mol0, idx0, mol1, idx1, type: newType });
      }

      // Build previous full set of existing base pairs (to delete)
      const prevDeletes: Record<number, Array<{ keys0: any; keys1: any }>> = {};
      for (const [rcIndexStr, complex] of Object.entries(rnaComplexProps)) {
        const rcIndex = parseInt(rcIndexStr);
        prevDeletes[rcIndex] = [];
        for (const [molName, perMol] of Object.entries(complex.basePairs)) {
          for (const [nucIdxStr, perNuc] of Object.entries(perMol)) {
            const nucIdx = parseInt(nucIdxStr);
            for (const mapped of perNuc) {
              const keysA = { rnaMoleculeName: molName, nucleotideIndex: nucIdx };
              const keysB = {
                rnaMoleculeName: mapped.rnaMoleculeName,
                nucleotideIndex: mapped.nucleotideIndex,
              };
              const [keys0, keys1] = [keysA, keysB].sort(compareBasePairKeys);
              // include only one direction
              if (keys0.rnaMoleculeName === keysA.rnaMoleculeName && keys0.nucleotideIndex === keysA.nucleotideIndex) {
                prevDeletes[rcIndex].push({ keys0, keys1 });
              }
            }
          }
        }
      }

      // Prepare 'add' signals from ops
      const adds: Record<number, Array<{ keys0: any; keys1: any }>> = {};
      for (const op of ops) {
        if (!(op.rnaComplexIndex in adds)) adds[op.rnaComplexIndex] = [];
        const [keys0, keys1] = [
          { rnaMoleculeName: op.mol0, nucleotideIndex: op.idx0 },
          { rnaMoleculeName: op.mol1, nucleotideIndex: op.idx1 },
        ].sort(compareBasePairKeys);
        adds[op.rnaComplexIndex].push({ keys0, keys1 });
      }

      // Override: clear all base pairs then apply CSV as ground truth
      pushToUndoStack();
      for (const [rcIndexStr, complex] of Object.entries(rnaComplexProps)) {
        const rcIndex = parseInt(rcIndexStr);
        // Clear all existing base pairs
        (complex as any).basePairs = {};
      }
      // Insert new base pairs
      for (const op of ops) {
        const complex = rnaComplexProps[op.rnaComplexIndex];
        insertBasePair(
          complex,
          op.mol0,
          op.idx0,
          op.mol1,
          op.idx1,
          DuplicateBasePairKeysHandler.DO_NOTHING,
          { basePairType: op.type }
        );
      }
      // Signal UI of deletes then adds per complex
      const edits: any = {};
      const complexIndices = new Set<number>([...Object.keys(rnaComplexProps).map((k) => parseInt(k)), ...ops.map((o) => o.rnaComplexIndex)]);
      for (const rcIndex of complexIndices) {
        edits[rcIndex] = {
          add: adds[rcIndex] ?? [],
          delete: prevDeletes[rcIndex] ?? [],
        };
      }
      setBasePairKeysToEdit(edits);
    },
    [splitCsvLine, setBasePairKeysToEdit, pushToUndoStack]
  );

  const onImportClick = useCallback(
    () => fileInputRef.current?.click(),
    []
  );

  const onCsvFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Reset for subsequent selections of the same file name
      e.currentTarget.value = "";
      if (!file) return;
      const text = await file.text();
      try {
        parseAndApplyCsv(text);
      } catch (error) {
        alert(typeof error === "string" ? error : (error as Error).message);
      }
    },
    [parseAndApplyCsv]
  );

  const getSymbolByFormattedIndex = useCallback(
    (
      rnaComplexIndex: number,
      molName: string,
      formattedIndex: number
    ) => {
      const rnaComplexProps = rnaComplexPropsReference.current;
      const complex = rnaComplexProps[rnaComplexIndex];
      if (!complex) return undefined;
      const mp = complex.rnaMoleculeProps[molName];
      if (!mp) return undefined;
      const idx = formattedIndex - mp.firstNucleotideIndex;
      if (!(idx in mp.nucleotideProps)) return undefined;
      const sym = mp.nucleotideProps[idx]?.symbol;
      return sym?.toUpperCase();
    },
    []
  );

  const deleteRow = useCallback(
    (row: Row | GroupedRow) => {
      const rnaComplexProps = rnaComplexPropsReference.current;
      const helices = globalHelicesRef.current;
      const complex = rnaComplexProps[row.rnaComplexIndex];
      if (!complex) {
        return;
      }
      pushToUndoStack();
      const bp0 = complex.basePairs[row.rnaMoleculeName0];
      const bp1 = complex.basePairs[row.rnaMoleculeName1];
      const basePairKeysToEdit : Context.BasePair.KeysToEdit = {
        [row.rnaComplexIndex] : { add: [], delete: [] },
      };
      const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[row.rnaComplexIndex];
      const nucleotideKeysOfBasePairsToDelete: Array<[number, number]> = [];
      function pushNucleotideIndexPair(
        nucleotideIndex0 : number,
        nucleotideIndex1 : number
      ) {
        basePairKeysToEditPerRnaComplex.delete.push({
          keys0 : {
            rnaMoleculeName: row.rnaMoleculeName0,
            nucleotideIndex: nucleotideIndex0,
          },
          keys1 : {
            rnaMoleculeName: row.rnaMoleculeName1,
            nucleotideIndex: nucleotideIndex1,
          },
        });
        nucleotideKeysOfBasePairsToDelete.push([nucleotideIndex0, nucleotideIndex1]);
      }
      if ("nucleotideIndex0" in row) {
        pushNucleotideIndexPair(row.nucleotideIndex0, row.nucleotideIndex1);
      } else {
        let nucleotideIndex0 = row.nucleotideIndex0Start;
        let nucleotideIndex1 = row.nucleotideIndex1Start;
        const direction0 = row.nucleotideIndex0End > row.nucleotideIndex0Start ? 1 : -1;
        const direction1 = row.nucleotideIndex1End > row.nucleotideIndex1Start ? 1 : -1;
        for (let i = 0; i < row.length; i++) {
          pushNucleotideIndexPair(
            nucleotideIndex0,
            nucleotideIndex1
          );
          nucleotideIndex0 += direction0;
          nucleotideIndex1 += direction1;
        }
      }
      setBasePairKeysToEdit(basePairKeysToEdit);
      for (const [nucleotideIndex0, nucleotideIndex1] of nucleotideKeysOfBasePairsToDelete) {
        if (bp0 && nucleotideIndex0 in bp0) {
          const arr = bp0[nucleotideIndex0];
          const idx = arr.findIndex(
            (m) =>
              m.rnaMoleculeName === row.rnaMoleculeName1 &&
              m.nucleotideIndex === nucleotideIndex1
          );
          if (idx !== -1) {
            if (arr.length === 1) delete bp0[nucleotideIndex0];
            else arr.splice(idx, 1);
          }
        }
        if (bp1 && nucleotideIndex1 in bp1) {
          const arr = bp1[nucleotideIndex1];
          const idx = arr.findIndex(
            (m) =>
              m.rnaMoleculeName === row.rnaMoleculeName0 &&
              m.nucleotideIndex === nucleotideIndex0
          );
          if (idx !== -1) {
            if (arr.length === 1) delete bp1[nucleotideIndex1];
            else arr.splice(idx, 1);
          }
        }
        removeBasePair(
          row.rnaComplexIndex,
          row.rnaMoleculeName0,
          row.rnaMoleculeName1,
          nucleotideIndex0,
          nucleotideIndex1
        );
      }
    },
    [
      pushToUndoStack,
      setBasePairKeysToEdit,
      removeBasePair
    ]
  );

  const addBasePair = useCallback(
    () => {
      const rnaComplexProps = rnaComplexPropsReference.current;
      const repositionWithCalculatedDistances = repositionWithCalculatedDistancesReference.current;
      const form = addForm;
      if (form.rnaComplexIndex == null) return;
      const complex = rnaComplexProps[form.rnaComplexIndex];
      if (!complex) return;
      const mol0 = form.rnaMoleculeName0!;
      const mol1 = form.rnaMoleculeName1!;
      const mp0 = complex.rnaMoleculeProps[mol0 as string];
      const mp1 = complex.rnaMoleculeProps[mol1 as string];
      if (!mp0 || !mp1) return;
      if (
        form.formattedNucleotideIndex0 == null ||
        form.formattedNucleotideIndex1 == null
      )
        return;
      const idx0 = form.formattedNucleotideIndex0 - mp0.firstNucleotideIndex;
      const idx1 = form.formattedNucleotideIndex1 - mp1.firstNucleotideIndex;
      if (!(idx0 in mp0.nucleotideProps) || !(idx1 in mp1.nucleotideProps))
        return;
      if (
        mol0 === mol1 &&
        idx0 === idx1
      ) {
        return;
      }
      const length = form.length ?? 1;
      const newType =
        form.typeBase === "custom"
          ? assembleDirectedType(form.orientation, form.edgeA, form.edgeB)
          : form.typeBase === "canonical"
          ? BasePair.Type.CANONICAL
          : form.typeBase === "wobble"
          ? BasePair.Type.WOBBLE
          : form.typeBase === "mismatch"
          ? BasePair.Type.MISMATCH
          : undefined;
      
      pushToUndoStack();
      
      // If reposition is enabled, reposition nucleotides before adding base pairs
      if (repositionWithCalculatedDistances) {
        repositionNucleotidesForBasePairs(
          complex,
          mol0,
          mol1,
          idx0,
          idx1,
          length,
          newType,
          settingsRecord
        );
      }
      
      // Create multiple base pairs based on length
      const addedPairs: Array<{ keys0: any; keys1: any }> = [];
      for (let i = 0; i < length; i++) {
        const currentIdx0 = idx0 + i;
        const currentIdx1 = idx1 - i;
        
        // Check if both indices exist in their respective molecules
        if (!(currentIdx0 in mp0.nucleotideProps) || !(currentIdx1 in mp1.nucleotideProps)) {
          break; // Stop if we've reached the end of either molecule
        }
        
        insertBasePair(
          complex,
          mol0,
          currentIdx0,
          mol1,
          currentIdx1,
          DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
          { basePairType: newType }
        );
        
        const [keys0, keys1] = [
          { rnaMoleculeName: mol0, nucleotideIndex: currentIdx0 },
          { rnaMoleculeName: mol1, nucleotideIndex: currentIdx1 },
        ].sort(compareBasePairKeys);
        addedPairs.push({ keys0, keys1 });
      }
      
      setBasePairKeysToEdit({
        [form.rnaComplexIndex]: { add: addedPairs, delete: [] },
      });
      setShowAdd(false);
      setAddForm({ typeBase: "auto" });
      handleNewBasePair(
        {
          rnaComplexIndex : form.rnaComplexIndex!,
          rnaMoleculeName : form.rnaMoleculeName0!,
          nucleotideIndex : idx0
        },
        {
          rnaComplexIndex : form.rnaComplexIndex!,
          rnaMoleculeName : form.rnaMoleculeName1!,
          nucleotideIndex : idx1
        }
      );
    },
    [
      addForm,
      setBasePairKeysToEdit,
      pushToUndoStack,
      handleNewBasePair
    ]
  );

  const beginEdit = useCallback(
    (
      row : Row | GroupedRow,
      rowIndex : number
    ) => {
      const rnaComplexProps = rnaComplexPropsReference.current!;
      let nucleotideIndex0: number;
      let nucleotideIndex1: number;
      if ("nucleotideIndex0" in row) {
        nucleotideIndex0 = row.nucleotideIndex0;
        nucleotideIndex1 = row.nucleotideIndex1;
      } else {
        nucleotideIndex0 = row.nucleotideIndex0Start;
        nucleotideIndex1 = row.nucleotideIndex1Start;
      }
      setEditRowIndex(rowIndex);
      const complex = rnaComplexProps[row.rnaComplexIndex];
      const mp0 = complex.rnaMoleculeProps[row.rnaMoleculeName0];
      const mp1 = complex.rnaMoleculeProps[row.rnaMoleculeName1];
      const pd = parseDirectedType(row.type);
      setEditForm({
        rnaComplexIndex: row.rnaComplexIndex,
        rnaMoleculeName0: row.rnaMoleculeName0,
        formattedNucleotideIndex0:
          nucleotideIndex0 + mp0.firstNucleotideIndex,
        rnaMoleculeName1: row.rnaMoleculeName1,
        formattedNucleotideIndex1:
          nucleotideIndex1 + mp1.firstNucleotideIndex,
        typeBase: decomposeTypeBase(row.type),
        orientation: pd.orientation,
        edgeA: pd.edgeA,
        edgeB: pd.edgeB,
      });
    },
    []
  );

  const saveBasePairEdit = useCallback(
    (row : Row) => {
      const form = editForm;
      if (
        form.rnaComplexIndex === undefined ||
        form.rnaMoleculeName0 === undefined ||
        form.rnaMoleculeName1 === undefined ||
        form.formattedNucleotideIndex0 === undefined ||
        form.formattedNucleotideIndex1 === undefined
      )
        return;
      // Re-resolve molecules by edited formatted indices
      const resolvedMol0 = form.rnaMoleculeName0;
      const resolvedMol1 = form.rnaMoleculeName1;
      const complex = rnaComplexProps[form.rnaComplexIndex];
      const mp0 = complex.rnaMoleculeProps[resolvedMol0];
      const mp1 = complex.rnaMoleculeProps[resolvedMol1];
      const newIdx0 = form.formattedNucleotideIndex0 - mp0.firstNucleotideIndex;
      const newIdx1 = form.formattedNucleotideIndex1 - mp1.firstNucleotideIndex;
      if (!(newIdx0 in mp0.nucleotideProps) || !(newIdx1 in mp1.nucleotideProps))
        return;
      pushToUndoStack();
      // delete old
      const oldC = rnaComplexProps[row.rnaComplexIndex];
      const bp0 = oldC.basePairs[row.rnaMoleculeName0];
      if (bp0 && row.nucleotideIndex0 in bp0) {
        const arr = bp0[row.nucleotideIndex0];
        const idx = arr.findIndex(
          (m) =>
            m.rnaMoleculeName === row.rnaMoleculeName1 &&
            m.nucleotideIndex === row.nucleotideIndex1
        );
        if (idx !== -1) {
          if (arr.length === 1) delete bp0[row.nucleotideIndex0];
          else arr.splice(idx, 1);
        }
      }
      const bp1 = oldC.basePairs[row.rnaMoleculeName1];
      if (bp1 && row.nucleotideIndex1 in bp1) {
        const arr = bp1[row.nucleotideIndex1];
        const idx = arr.findIndex(
          (m) =>
            m.rnaMoleculeName === row.rnaMoleculeName0 &&
            m.nucleotideIndex === row.nucleotideIndex0
        );
        if (idx !== -1) {
          if (arr.length === 1) delete bp1[row.nucleotideIndex1];
          else arr.splice(idx, 1);
        }
      }
      // add new with possibly updated type
      let newType: BasePair.Type | undefined = undefined;
      if (form.typeBase === "custom") newType = assembleDirectedType(form.orientation, form.edgeA, form.edgeB);
      else if (form.typeBase === "canonical") newType = BasePair.Type.CANONICAL;
      else if (form.typeBase === "wobble") newType = BasePair.Type.WOBBLE;
      else if (form.typeBase === "mismatch") newType = BasePair.Type.MISMATCH;
      insertBasePair(
        oldC,
        resolvedMol0,
        newIdx0,
        resolvedMol1,
        newIdx1,
        DuplicateBasePairKeysHandler.DO_NOTHING,
        { basePairType: newType }
      );
      const sortedOld = [
        {
          rnaMoleculeName: row.rnaMoleculeName0,
          nucleotideIndex: row.nucleotideIndex0,
        },
        {
          rnaMoleculeName: row.rnaMoleculeName1,
          nucleotideIndex: row.nucleotideIndex1,
        },
      ].sort(compareBasePairKeys);
      const oldKeys0 = sortedOld[0];
      const oldKeys1 = sortedOld[1];
      const sortedNew = [
        { rnaMoleculeName: resolvedMol0 as string, nucleotideIndex: newIdx0 },
        { rnaMoleculeName: resolvedMol1 as string, nucleotideIndex: newIdx1 },
      ].sort(compareBasePairKeys);
      const newKeys0 = sortedNew[0];
      const newKeys1 = sortedNew[1];
      setBasePairKeysToEdit({
        [row.rnaComplexIndex]: {
          add: [{ keys0: newKeys0, keys1: newKeys1 }],
          delete: [{ keys0: oldKeys0, keys1: oldKeys1 }],
        },
      });
    },
    [editForm]
  );

  const saveGroupedBasePairEdit = useCallback(
    (row : GroupedRow) => {
      const rnaComplexProps = rnaComplexPropsReference.current;
      if (
        editForm.rnaComplexIndex === undefined ||
        editForm.rnaMoleculeName0 === undefined ||
        editForm.rnaMoleculeName1 === undefined
      ) {
        return;
      }
      const editFormLength = editForm.length ?? row.length;
      pushToUndoStack();
      const basePairKeysToEdit : Context.BasePair.KeysToEdit = {
        [editForm.rnaComplexIndex] : { add: [], delete: [] },
      };
      const basePairKeysToEditPerRnaComplex = basePairKeysToEdit[editForm.rnaComplexIndex];

      const singularRnaComplexProps = rnaComplexProps[editForm.rnaComplexIndex];
      const singularRnaMoleculeProps0 = singularRnaComplexProps.rnaMoleculeProps[editForm.rnaMoleculeName0];
      const singularRnaMoleculeProps1 = singularRnaComplexProps.rnaMoleculeProps[editForm.rnaMoleculeName1];
      const basePairsPerRnaMolecule0 = singularRnaComplexProps.basePairs[editForm.rnaMoleculeName0];
      const basePairsPerRnaMolecule1 = singularRnaComplexProps.basePairs[editForm.rnaMoleculeName1];

      let direction0 = Math.sign(row.nucleotideIndex0End - row.nucleotideIndex0Start);
      let direction1 = Math.sign(row.nucleotideIndex1End - row.nucleotideIndex1Start);
      let nucleotideIndex0 = row.nucleotideIndex0Start;
      let nucleotideIndex1 = row.nucleotideIndex1Start;
      for (let i = 0; i < row.length; i++) {
        const basePairsPerNucleotide0 = basePairsPerRnaMolecule0[nucleotideIndex0];
        const basePairsPerNucleotide1 = basePairsPerRnaMolecule1[nucleotideIndex1];
        for (const {
          array,
          record,
          nucleotideIndex,
          target
        } of [
          {
            array : basePairsPerNucleotide0,
            record : basePairsPerRnaMolecule0,
            nucleotideIndex : nucleotideIndex0,
            target : {
              rnaMoleculeName : editForm.rnaMoleculeName1,
              nucleotideIndex : nucleotideIndex1
            }
          },
          {
            array : basePairsPerNucleotide1,
            record : basePairsPerRnaMolecule1,
            nucleotideIndex : nucleotideIndex1,
            target : {
              rnaMoleculeName : editForm.rnaMoleculeName0,
              nucleotideIndex : nucleotideIndex0
            }
          }
        ]) {
          if (array.length === 1) {
            delete record[nucleotideIndex];
          } else {
            array.splice(
              array.findIndex(({ rnaMoleculeName, nucleotideIndex }) => (
                rnaMoleculeName === target.rnaMoleculeName &&
                nucleotideIndex === target.nucleotideIndex
              )),
              1
            );
          }
        }
        basePairKeysToEditPerRnaComplex.delete.push({
          keys0 : {
            rnaMoleculeName : editForm.rnaMoleculeName0,
            nucleotideIndex : nucleotideIndex0
          },
          keys1 : {
            rnaMoleculeName : editForm.rnaMoleculeName1,
            nucleotideIndex : nucleotideIndex1
          }
        });
        nucleotideIndex0 += direction0;
        nucleotideIndex1 += direction1;
      }
      
      let basePairType: BasePair.Type | undefined;
      switch (editForm.typeBase) {
        case "custom" : {
          basePairType = assembleDirectedType(
            editForm.orientation,
            editForm.edgeA,
            editForm.edgeB
          );
          break;
        }
        case "canonical" : {
          basePairType = BasePair.Type.CANONICAL;
          break;
        }
        case "wobble" : {
          basePairType = BasePair.Type.WOBBLE;
          break;
        }
        case "mismatch" : {
          basePairType = BasePair.Type.MISMATCH;
          break;
        }
        case "auto" : {
          basePairType = undefined;
          break;
        }
        default : {
          throw new Error("Unhandled switch case");
        }
      }
      direction0 = 1;
      direction1 = -1;
      nucleotideIndex0 = row.nucleotideIndex0Start;
      nucleotideIndex1 = row.nucleotideIndex1Start;
      for (let i = 0; i < editFormLength; i++) {
        insertBasePair(
          singularRnaComplexProps,
          editForm.rnaMoleculeName0,
          nucleotideIndex0,
          editForm.rnaMoleculeName1,
          nucleotideIndex1,
          DuplicateBasePairKeysHandler.DO_NOTHING,
          { basePairType }
        );
        basePairKeysToEditPerRnaComplex.add.push({
          keys0 : {
            rnaMoleculeName : editForm.rnaMoleculeName0,
            nucleotideIndex : nucleotideIndex0 
          },
          keys1 : {
            rnaMoleculeName : editForm.rnaMoleculeName1,
            nucleotideIndex : nucleotideIndex1
          }
        });
        nucleotideIndex0 += direction0;
        nucleotideIndex1 += direction1;
      }

      [basePairKeysToEditPerRnaComplex.add, basePairKeysToEditPerRnaComplex.delete].forEach(array => array.sort(compareFullBasePairKeys));
      setBasePairKeysToEdit(basePairKeysToEdit);

      handleNewBasePair(
        undefined as any as FullKeys,
        undefined as any as FullKeys
      );
    },
    [editForm]
  );

  const displayOrientation = useCallback(
    (row: Row | GroupedRow) : string => {
      const { orientation } = parseDirectedType(row.type);
      if (orientation) return orientation;
      // If not custom, derive meaningful default
      const base = decomposeTypeBase(row.type);
      if (base === "canonical") return "cis";
      if (base === "wobble") return "cis";
      if (base === "mismatch") return "cis";
      if (base === "auto") return "auto";
      return "cis";
    },
    []
  );

  const displayEdgeA = useCallback(
    (row: Row | GroupedRow): string => {
      const { edgeA } = parseDirectedType(row.type);
      if (edgeA) return edgeA;
      const base = decomposeTypeBase(row.type);
      return base === "auto"
        ? "auto"
        : base === "canonical"
        ? "watson_crick"
        : base === "wobble"
        ? "watson_crick"
        : "unknown";
    },
    []
  );

  const displayEdgeB = useCallback(
    (row: Row | GroupedRow): string => {
      const { edgeB } = parseDirectedType(row.type);
      if (edgeB) return edgeB;
      const base = decomposeTypeBase(row.type);
      return base === "auto"
        ? "auto"
        : base === "canonical"
        ? "watson_crick"
        : base === "wobble"
        ? "hoogsteen"
        : "unknown";
    },
    []
  );

  const thStyle = useCallback(
    (width: number): React.CSSProperties => ({
        position: "sticky",
        top: 0,
        zIndex: 1,
        textAlign: "center",
        fontSize: 13,
        textTransform: "uppercase",
        letterSpacing: 0.3,
        padding: "10px 12px",
        minWidth: width,
        maxWidth: width,
        whiteSpace: "nowrap",
        background: theme.colors.surfaceHover,
        borderBottom: `1px solid ${theme.colors.border}`,
        borderInline: `1px solid ${theme.colors.border}`,
        color: theme.colors.text
    }),
    [theme]
  );

  const tdStyle = useCallback(
    (width: number): React.CSSProperties => ({
      padding: "8px 12px",
      minWidth: width,
      maxWidth: width,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 12,
      textAlign: "center",
      color: theme.colors.text
    }),
    [theme]
  );

  const sel = useCallback(
    (enabled: boolean = true): React.CSSProperties => ({
      width: 130,
      padding: "6px 8px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      background: theme.colors.background,
      color: theme.colors.text,
      opacity: enabled ? 1 : 0.6,
    }),
    [theme]
  );

  const inp = useCallback(
    (): React.CSSProperties => ({
      width: 100,
      padding: "6px 8px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: theme.colors.text,
      background: theme.colors.background,
    }),
    [theme]
  );

  const btn = useCallback(
    (): React.CSSProperties => ({
      padding: "6px 10px",
      borderRadius: 8,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.background,
      fontSize: 12,
      fontWeight: 600,
      color: theme.colors.text,
      cursor: "pointer"
    }),
    [theme]
  );

  const inpCell = useCallback(
    (): React.CSSProperties => ({
      width: "100%",
      padding: "4px 6px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: theme.colors.text,
      background: theme.colors.background,
    }),
    [theme]
  );

  const btnSmall = useCallback(
    (): React.CSSProperties => ({
      padding: "4px 8px",
      borderRadius: 6,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.background,
      fontSize: 11,
      fontWeight: 600,
      color: theme.colors.text,
      cursor: "pointer",
    }),
    [theme]
  );

  const treatNoncanonicalBasePairsAsUnpairedFlag = useMemo(
    () => settingsRecord[Setting.TREAT_NON_CANONICAL_BASE_PAIRS_AS_UNPAIRED],
    [settingsRecord]
  );

  const treatNoncanonicalBasePairsAsUnpairedFlagReference = useRef(treatNoncanonicalBasePairsAsUnpairedFlag);
  treatNoncanonicalBasePairsAsUnpairedFlagReference.current = treatNoncanonicalBasePairsAsUnpairedFlag;

  const reformatAll = useCallback(
    () => reformatSelectedHelices(filteredHelicesRef.current),
    []
  );

  useEffect(
    () => {
      const newRnaComplexesAreASingleton = Object.keys(rnaComplexProps).length === 1;
      setRnaComplexesAreASingleton(newRnaComplexesAreASingleton);
      setRnaMoleculesAreASingleton(
        newRnaComplexesAreASingleton &&
        Object.keys(Object.values(rnaComplexProps)[0].rnaMoleculeProps).length === 1
      );
    },
    [rnaComplexProps]
  );

  useEffect(
    () => setEditRowIndex(undefined),
    [
      viewMode,
      selectionMode
    ]
  );

  return (
    <div
      ref={sheetRef}
      style={{
        position: "fixed",
        left: 429,
        right: 0,
        bottom: 0,
        height: open ? height : 0,
        transform: open ? "translateY(0)" : "translateY(100%)",
        transition: "transform 0.3s ease, height 0.3s ease",
        background: theme.colors.surface,
        // boxShadow: theme.shadows.lg,
        borderTop: `1px solid ${theme.colors.border}`,
        zIndex: 2100,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={(e) => {
          setIsResizing(true);
          startYRef.current = e.clientY;
          startHRef.current = height;
        }}
        style={{
          height: 10,
          cursor: "ns-resize",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: 48,
            height: 4,
            borderRadius: 2,
            background: theme.colors.border,
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          padding: "10px 16px",
          borderBottom: `1px solid ${theme.colors.border}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          background: theme.colors.surface,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div
            style={{
              display: "flex",
              gap: 6,
              background: theme.colors.surfaceHover,
              padding: "4px",
              borderRadius: 8,
            }}
          >
            {(["Base Pairs", "Helices"] as Array<ViewMode>).map((t) => (
              <button
                key={t}
                onClick={() => setViewMode(t)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    viewMode === t
                      ? theme.colors.background
                      : "transparent",
                  color: theme.colors.text,
                  boxShadow: viewMode === t ? theme.shadows.sm : "none",
                  cursor: "pointer",
                }}
              >
                {t}
              </button>
            ))}
            &nbsp;|&nbsp;
            {(["Constrained", "Global"] as Array<SelectionMode>).map((selectionModeI) => (
              <button
                key={selectionModeI}
                onClick={() => setSelectionMode(selectionModeI)}
                style={{
                  padding: "6px 10px",
                  borderRadius: 6,
                  border: "none",
                  fontSize: 12,
                  fontWeight: 600,
                  background:
                    selectionMode === selectionModeI
                      ? theme.colors.background
                      : "transparent",
                  color: theme.colors.text,
                  boxShadow: selectionMode === selectionModeI ? theme.shadows.sm : "none",
                  cursor: "pointer",
                }}
              >
                {selectionModeI}
              </button>
            ))}
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {/* Import/Export CSV */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".csv,text/csv"
            style={{ display: "none" }}
            onChange={onCsvFileChange}
          />
          <button
            onClick={exportCsv}
            title="Export table to CSV"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.background,
              color: theme.colors.text,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.3,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Download size={14} /> Export
          </button>
          <button
            onClick={onImportClick}
            title="Import table from CSV"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.background,
              color: theme.colors.text,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.3,
              cursor: "pointer",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Upload size={14} /> Import
          </button>
          {/* Stylized Reformat button (note: behavior delegated to existing editor elsewhere) */}
          <button
            onClick={reformatAll}
            title="Re-format all base pairs"
            style={{
              padding: "8px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.primary}`,
              background: theme.colors.primary,
              color: theme.colors.textInverse,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.3,
              cursor: "pointer",
            }}
          >
            Re-format all
          </button>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              fontSize: 16,
              color: theme.colors.textSecondary,
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>
      </div>

      {/* Table and controls */}
      <div style={{ flex: 1, overflow: "auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            padding: "8px 12px",
            gap: 8,
          }}
        >
          {showAdd && (
            <div
              style={{
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                borderTop: `1px dashed ${theme.colors.border}`,
                borderBottom: `1px dashed ${theme.colors.border}`,
              }}
            >
              {/* Complex selector */}
              {!rnaComplexesAreASingleton && <select
                value={addForm.rnaComplexIndex ?? ""}
                onChange={(e) => {
                  const rnaComplexIndex = e.target.value === ""
                    ? undefined
                    : parseInt(e.target.value);
                  const rnaMoleculesAreASingleton = (
                    rnaComplexIndex !== undefined &&
                    Object.keys(rnaComplexProps[rnaComplexIndex].rnaMoleculeProps).length === 1
                  );
                  setRnaMoleculesAreASingleton(rnaMoleculesAreASingleton);
                  const newAddForm : Partial<AddForm> = {
                    rnaComplexIndex
                  };
                  // Always set the first available molecule names as defaults
                  if (rnaComplexIndex !== undefined) {
                    const moleculeNames = Object.keys(rnaComplexProps[rnaComplexIndex].rnaMoleculeProps);
                    if (moleculeNames.length > 0) {
                      newAddForm.rnaMoleculeName0 = moleculeNames[0];
                      newAddForm.rnaMoleculeName1 = moleculeNames[0];
                    }
                  }
                  setAddForm((f) => ({
                    ...f,
                    newAddForm
                  }));
                }}
                style={{ ...sel(), marginRight: 8 }}
              >
                <option 
                  value=""
                  hidden
                >
                  Complex Name
                </option>
                {Object.entries(rnaComplexProps).map(([k, c]) => (
                  <option key={k} value={k}>
                    {c.name}
                  </option>
                ))}
              </select>}

              {/* Molecule selector #1 */}
              {!rnaMoleculesAreASingleton && <select
                value = {addForm.rnaMoleculeName0 ?? ""}
                onChange = {(e) => setAddForm((f) => ({
                  ...f,
                  rnaMoleculeName0:
                    e.target.value === ""
                      ? undefined
                      : e.target.value,
                }))}
                style={{ 
                  ...sel(),
                  marginRight: 8,
                  opacity: addForm.rnaComplexIndex == null ? 0.6 : 1,
                  cursor: addForm.rnaComplexIndex == null ? "not-allowed" : "text",
                  background:
                    addForm.rnaComplexIndex == null
                    ? theme.colors.surfaceHover
                    : theme.colors.background,
                  color:
                    addForm.rnaComplexIndex == null
                    ? theme.colors.textSecondary
                    : theme.colors.text
                }}
              >
                <option 
                  value=""
                  hidden
                >
                  Mol Name #1
                </option>
                {(addForm.rnaComplexIndex == undefined ? [] : Object.entries(rnaComplexProps[addForm.rnaComplexIndex].rnaMoleculeProps)).map(
                  ([rnaMoleculeName, singularRnaMoleculeProps]) => <option
                    key={rnaMoleculeName}
                    value={rnaMoleculeName}
                  >
                    {rnaMoleculeName}
                  </option>
                )}
                disabled = {addForm.rnaComplexIndex == null}
              </select>}

              {/* Nuc #1 (index) compressed */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: 180,
                  marginRight: 8,
                }}
              >
                {(() => {
                  const rc = addForm.rnaComplexIndex;
                  const idx = addForm.formattedNucleotideIndex0;
                  let initial = "UNK";
                  if (rc != null && idx != null) {
                    const mol = addForm.rnaMoleculeName0;
                    if (mol) {
                      const sym = getSymbolByFormattedIndex(rc, mol, idx);
                      initial = sym === undefined ? "UNK" : sym[0].toUpperCase();
                    }
                  }
                  return (
                    <span title={initial} style={{ fontWeight: 700 }}>
                      {initial}
                    </span>
                  );
                })()}
                <input
                  type="number"
                  placeholder="nt #1"
                  value={addForm.formattedNucleotideIndex0 ?? ""}
                  onChange={(e) =>
                    setAddForm((f) => ({
                      ...f,
                      formattedNucleotideIndex0:
                        e.target.value === ""
                          ? undefined
                          : parseInt(e.target.value),
                    }))
                  }
                  disabled = {addForm.rnaMoleculeName0 == null}
                  style={{
                    ...inpCell(),
                    opacity: addForm.rnaMoleculeName0 == null ? 0.6 : 1,
                    cursor: addForm.rnaMoleculeName0 == null ? "not-allowed" : "text",
                    background:
                      addForm.rnaMoleculeName0 == null
                      ? theme.colors.surfaceHover
                      : theme.colors.background,
                    color:
                      addForm.rnaMoleculeName0 == null
                      ? theme.colors.textSecondary
                      : theme.colors.text,
                  }}
                />
              </div>

              {/* Molecule selector #2 */}
              {!rnaMoleculesAreASingleton && <select
                value = {addForm.rnaMoleculeName1 ?? ""}
                onChange = {(e) => setAddForm((f) => ({
                  ...f,
                  rnaMoleculeName1:
                    e.target.value === ""
                      ? undefined
                      : e.target.value,
                }))}
                style={{ 
                  ...sel(),
                  marginRight: 8,
                  opacity: addForm.rnaComplexIndex == null ? 0.6 : 1,
                  cursor: addForm.rnaComplexIndex == null ? "not-allowed" : "text",
                  background:
                    addForm.rnaComplexIndex == null
                    ? theme.colors.surfaceHover
                    : theme.colors.background,
                  color:
                    addForm.rnaComplexIndex == null
                    ? theme.colors.textSecondary
                    : theme.colors.text
                }}
              >
                <option 
                  value=""
                  hidden
                >
                  Mol Name #2
                </option>
                {(addForm.rnaComplexIndex == undefined ? [] : Object.entries(rnaComplexProps[addForm.rnaComplexIndex].rnaMoleculeProps)).map(
                  ([rnaMoleculeName, singularRnaMoleculeProps]) => <option
                    key={rnaMoleculeName}
                    value={rnaMoleculeName}
                  >
                    {rnaMoleculeName}
                  </option>
                )}
                disabled = {addForm.rnaComplexIndex == null}
              </select>}

              {/* Nuc #2 (index) compressed */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  width: 180,
                  marginRight: 8,
                }}
              >
                {(() => {
                  const rc = addForm.rnaComplexIndex;
                  const idx = addForm.formattedNucleotideIndex1;
                  let initial = "UNK";
                  if (rc != null && idx != null) {
                  const mol = addForm.rnaMoleculeName1;
                  if (mol) {
                    const sym = getSymbolByFormattedIndex(rc, mol, idx);
                    initial = sym === undefined ? "UNK" : sym[0].toUpperCase();
                  }
                  }
                  return (
                  <span title={initial} style={{ fontWeight: 700 }}>
                    {initial}
                  </span>
                  );
                })()}
                <input
                  type="number"
                  placeholder="nt #2"
                  value={addForm.formattedNucleotideIndex1 ?? ""}
                  onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    formattedNucleotideIndex1:
                    e.target.value === ""
                      ? undefined
                      : parseInt(e.target.value),
                  }))}
                  style={{
                    ...inpCell(),
                    opacity: addForm.rnaMoleculeName1 == null ? 0.6 : 1,
                    cursor: addForm.rnaMoleculeName1 == null ? "not-allowed" : "text",
                    background:
                      addForm.rnaMoleculeName1 == null
                      ? theme.colors.surfaceHover
                      : theme.colors.background,
                    color:
                      addForm.rnaMoleculeName1 == null
                      ? theme.colors.textSecondary
                      : theme.colors.text,
                  }}
                  disabled={addForm.rnaMoleculeName1 == null}
                />
              </div>

              {/* Type and custom sub-fields */}
              <select
                value={addForm.typeBase}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    typeBase: e.target.value as TypeBase,
                  }))
                }
                style={{ ...sel(true), marginRight: 8 }}
              >
                <option value={"auto"}>auto</option>
                <option value={"canonical"}>canonical</option>
                <option value={"wobble"}>wobble</option>
                <option value={"mismatch"}>mismatch</option>
                <option value={"custom"}>{formatTypeBaseLabel("custom")}</option>
              </select>
              <select
                value={addForm.orientation ?? ""}
                disabled={addForm.typeBase !== "custom"}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    orientation: e.target.value as Orientation,
                  }))
                }
                style={{
                  ...sel(addForm.typeBase === "custom"),
                  marginRight: 8,
                }}
              >
                <option value="" hidden>
                  orientation (auto)
                </option>
                <option value={"cis"}>cis</option>
                <option value={"trans"}>trans</option>
              </select>
              <select
                value={addForm.edgeA ?? ""}
                disabled={addForm.typeBase !== "custom"}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, edgeA: e.target.value as Edge }))
                }
                style={{
                  ...sel(addForm.typeBase === "custom"),
                  marginRight: 8,
                }}
              >
                <option value="" hidden>
                  edge A (auto)
                </option>
                <option value={"watson_crick"}>watson_crick</option>
                <option value={"hoogsteen"}>hoogsteen</option>
                <option value={"sugar_edge"}>sugar_edge</option>
              </select>
              <select
                value={addForm.edgeB ?? ""}
                disabled={addForm.typeBase !== "custom"}
                onChange={(e) =>
                  setAddForm((f) => ({ ...f, edgeB: e.target.value as Edge }))
                }
                style={{
                  ...sel(addForm.typeBase === "custom"),
                  marginRight: 8,
                }}
              >
                <option value="" hidden>
                  edge B (auto)
                </option>
                <option value={"watson_crick"}>watson_crick</option>
                <option value={"hoogsteen"}>hoogsteen</option>
                <option value={"sugar_edge"}>sugar_edge</option>
              </select>
              <input
                type="number"
                min="1"
                max="100"
                placeholder="Length"
                value={addForm.length ?? ""}
                onChange={(e) =>
                  setAddForm((f) => ({
                    ...f,
                    length:
                      e.target.value === ""
                        ? undefined
                        : Math.max(1, parseInt(e.target.value) || 1),
                  }))
                }
                style={{
                  ...inp(),
                  width: 80,
                  marginRight: 8,
                }}
                title="Number of consecutive base pairs to create"
              />
              
              {/* Reposition checkbox */}
              <label style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px',
                marginRight: '8px',
                padding: '4px 8px',
                borderRadius: '4px',
                backgroundColor: repositionWithCalculatedDistances ? theme.colors.primary + '20' : 'transparent',
                border: repositionWithCalculatedDistances ? `1px solid ${theme.colors.primary}` : '1px solid transparent',
                transition: 'all 0.2s ease',
                cursor: 'pointer'
              }}>
                <input
                  type="checkbox"
                  checked={repositionWithCalculatedDistances}
                  onChange={(e) => setRepositionWithCalculatedDistances(e.target.checked)}
                  style={{ margin: 0, transform: 'scale(0.9)' }}
                />
                <span style={{ 
                  fontSize: '11px',
                  fontWeight: repositionWithCalculatedDistances ? '600' : '400',
                  color: repositionWithCalculatedDistances ? theme.colors.primary : theme.colors.text,
                  whiteSpace: 'nowrap'
                }}>
                  Reposition
                </span>
              </label>
              
              <button
                onClick={addBasePair}
                style={{
                  padding: "6px 10px",
                  borderRadius: 8,
                  border: `1px solid ${theme.colors.border}`,
                  background: theme.colors.background,
                  fontSize: 12,
                  fontWeight: 700,
                  color: theme.colors.text,
                }}
                disabled = {
                  addForm.rnaComplexIndex == null ||
                  addForm.rnaMoleculeName0 === undefined ||
                  addForm.rnaMoleculeName1 === undefined ||
                  addForm.formattedNucleotideIndex0 == null ||
                  addForm.formattedNucleotideIndex1 == null ||
                  (addForm.length ?? 1) < 1
                }
              >
                Add
              </button>
            </div>
          )}
          <button
            onClick={() => {
              if (!showAdd) {
                // Set default values with first available molecule names
                const defaultComplexIndex = rnaComplexesAreASingleton ? Number.parseInt(Object.keys(rnaComplexProps)[0]) : undefined;
                let defaultMoleculeName0: string | undefined = undefined;
                let defaultMoleculeName1: string | undefined = undefined;
                
                if (defaultComplexIndex !== undefined) {
                  const moleculeNames = Object.keys(rnaComplexProps[defaultComplexIndex].rnaMoleculeProps);
                  if (moleculeNames.length > 0) {
                    defaultMoleculeName0 = moleculeNames[0];
                    defaultMoleculeName1 = moleculeNames[0];
                  }
                }
                
                setAddForm({
                  rnaComplexIndex: defaultComplexIndex,
                  rnaMoleculeName0: defaultMoleculeName0,
                  rnaMoleculeName1: defaultMoleculeName1,
                  formattedNucleotideIndex0: undefined,
                  formattedNucleotideIndex1: undefined,
                  length: 1,
                  typeBase: "auto"
                });
              }
              setShowAdd(!showAdd);
            }}
            style={{
              padding: "6px 10px",
              borderRadius: 8,
              border: `1px solid ${theme.colors.border}`,
              background: theme.colors.background,
              fontSize: 12,
              fontWeight: 600,
              color: theme.colors.text,
              marginLeft: "auto",
            }}
          >
            {showAdd ? "Cancel" : "Add Base Pair"}
          </button>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {!rnaComplexesAreASingleton && <th style={thStyle(120)}>Complex</th>}
              {!rnaMoleculesAreASingleton && <th style={thStyle(80)}>Mol#1</th>}
              <th style={thStyle(80)}>Nt (index) a</th>
              {!rnaMoleculesAreASingleton && <th style={thStyle(80)}>Mol#2</th>}
              <th style={thStyle(80)}>Nt (index) b</th>
              {viewMode === "Helices" && <th style={thStyle(80)}>Length</th>}
              <th style={thStyle(120)}>Type</th>
              <th style={thStyle(100)}>Orientation</th>
              <th style={thStyle(130)}>Edge A</th>
              <th style={thStyle(130)}>Edge B</th>
              <th style={thStyle(90)}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const isGrouped = isGroupedRow(r);
              const isEditing = editRowIndex === i;
              const base = isEditing
                ? editForm.typeBase ?? decomposeTypeBase(r.type)
                : decomposeTypeBase(r.type);
              const pd = parseDirectedType(r.type);
              const efOrientation = isEditing
                ? editForm.orientation ??
                  pd.orientation ??
                  (base === "auto" ? undefined : "cis")
                : undefined;
              const efEdgeA = isEditing
                ? editForm.edgeA ?? undefined
                : undefined;
              const efEdgeB = isEditing
                ? editForm.edgeB ?? undefined
                : undefined;
              return (
                <tr
                  key={i}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    background:
                      i % 2 === 0
                        ? theme.colors.background
                        : theme.colors.surface,
                  }}
                >
                  {!rnaComplexesAreASingleton && <td style={tdStyle(120)}>{r.rnaComplexName}</td>}
                  {/* Mol #1 */}
                  {!rnaMoleculesAreASingleton && <td style={tdStyle(60)}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      {isEditing ? (
                        <select
                          value = {
                            editForm.rnaMoleculeName0 ??
                            r.rnaMoleculeName0
                          }
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              rnaMoleculeName0:
                                e.target.value === ""
                                  ? undefined
                                  : e.target.value,
                            }))
                          }
                        >
                          {Object.entries(rnaComplexProps[r.rnaComplexIndex].rnaMoleculeProps).map(([rnaMoleculeName, singularRnaMoleculeProps]) => <option
                            key = {rnaMoleculeName}
                            value = {rnaMoleculeName}
                          >
                            {rnaMoleculeName}
                          </option>)}
                        </select>
                      ) : (
                        <span>{r.rnaMoleculeName0}</span>
                      )}
                    </div>
                  </td>}
                  {/* Nuc #1 (index) */}
                  <td style={tdStyle(60)}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      {(() => {
                        if (isGrouped) {
                          const symbolStart = getSymbolByFormattedIndex(
                            r.rnaComplexIndex,
                            r.rnaMoleculeName0,
                            r.formattedNucleotideIndex0Start
                          );
                          const initialStart = symbolStart === undefined ? "UNK" : symbolStart[0].toUpperCase();
                          return (
                            <>
                              <span
                                title={`${r.rnaMoleculeName0} (${symbolStart})`}
                                style={{ fontWeight: 700 }}
                              >
                                {initialStart}
                              </span>
                              <span>
                                {r.formattedNucleotideIndex0Start}
                              </span>
                            </>
                          );
                        }
                        const symbol = getSymbolByFormattedIndex(
                          r.rnaComplexIndex,
                          r.rnaMoleculeName0,
                          isEditing
                            ? editForm.formattedNucleotideIndex0 ??
                                r.formattedNucleotideIndex0
                            : r.formattedNucleotideIndex0
                        );
                        const initial =
                          symbol === undefined ? "UNK" : symbol[0].toUpperCase();
                        return (
                          <>
                            <span
                              title={`${r.rnaMoleculeName0} (${symbol})`}
                              style={{ fontWeight: 700 }}
                            >
                              {initial}
                            </span>
                            {isEditing ? (
                              <input
                                type="number"
                                value={
                                  editForm.formattedNucleotideIndex0 ??
                                  r.formattedNucleotideIndex0
                                }
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    formattedNucleotideIndex0:
                                      e.target.value === ""
                                        ? undefined
                                        : parseInt(e.target.value),
                                  }))
                                }
                                style={inpCell()}
                              />
                            ) : (
                              <span>{r.formattedNucleotideIndex0}</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  {/* Mol #2 */}
                  {!rnaMoleculesAreASingleton && <td style={tdStyle(60)}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      {isEditing ? (
                        <select
                          value = {
                            editForm.rnaMoleculeName1 ??
                            r.rnaMoleculeName1
                          }
                          onChange={(e) =>
                            setEditForm((f) => ({
                              ...f,
                              rnaMoleculeName1:
                                e.target.value === ""
                                  ? undefined
                                  : e.target.value,
                            }))
                          }
                        >
                          {Object.entries(rnaComplexProps[r.rnaComplexIndex].rnaMoleculeProps).map(([rnaMoleculeName, singularRnaMoleculeProps]) => <option
                            key = {rnaMoleculeName}
                            value = {rnaMoleculeName}
                          >
                            {rnaMoleculeName}
                          </option>)}
                        </select>
                      ) : (
                        <span>{r.rnaMoleculeName1}</span>
                      )}
                    </div>
                  </td>}
                  {/* Nuc #2 (index) */}
                  <td style={tdStyle(60)}>
                    <div
                      style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}
                    >
                      {(() => {
                        if (isGrouped) {
                          const symbolStart = getSymbolByFormattedIndex(
                            r.rnaComplexIndex,
                            r.rnaMoleculeName1,
                            r.formattedNucleotideIndex1Start
                          );
                          const initialStart = symbolStart === undefined ? "UNK" : symbolStart[0].toUpperCase();
                          return (
                            <>
                              <span
                                title={`${r.rnaMoleculeName1} (${symbolStart})`}
                                style={{ fontWeight: 700 }}
                              >
                                {initialStart}
                              </span>
                              <span>
                                {r.formattedNucleotideIndex1Start}
                              </span>
                            </>
                          );
                        }
                        const symbol = getSymbolByFormattedIndex(
                          r.rnaComplexIndex,
                          r.rnaMoleculeName1,
                          isEditing
                            ? editForm.formattedNucleotideIndex1 ??
                                r.formattedNucleotideIndex1
                            : r.formattedNucleotideIndex1
                        );
                        const initial =
                          symbol === undefined ? "UNK" : symbol[0].toUpperCase();
                        return (
                          <>
                            <span
                              title={`${r.rnaMoleculeName1} (${symbol})`}
                              style={{ fontWeight: 700 }}
                            >
                              {initial}
                            </span>
                            {isEditing ? (
                              <input
                                type="number"
                                value={
                                  editForm.formattedNucleotideIndex1 ??
                                  r.formattedNucleotideIndex1
                                }
                                onChange={(e) =>
                                  setEditForm((f) => ({
                                    ...f,
                                    formattedNucleotideIndex1:
                                      e.target.value === ""
                                        ? undefined
                                        : parseInt(e.target.value),
                                  }))
                                }
                                style={inpCell()}
                              />
                            ) : (
                              <span>{r.formattedNucleotideIndex1}</span>
                            )}
                          </>
                        );
                      })()}
                    </div>
                  </td>
                  {/* Length (only in grouped mode) */}
                  {viewMode === "Helices" && (
                    isEditing ? <td style={tdStyle(60)}>
                      <input
                        type = "number"
                        min = "1"
                        value = {editForm.length ?? (isGrouped ? r.length : 1)}
                        onChange = {(e) => setEditForm((f) => ({
                          ...f,
                          length : e.target.value === "" ? undefined : parseInt(e.target.value)
                        }))}
                      />
                    </td> : <td style={tdStyle(60)}>
                      <span style={{
                        fontSize : 12,
                        color : theme.colors.text
                      }}>
                        {isGrouped ? r.length : 1}
                      </span>
                    </td>
                  )}
                  {/* Type base */}
                  <td style={tdStyle(120)}>
                    {isEditing ? (
                      <select
                        value={base}
                        onChange={(e) => {
                          const next = e.target.value as TypeBase;
                          if (next === "custom") {
                            const parsed = parseDirectedType(r.type);
                            const baseFromRow = decomposeTypeBase(r.type);
                            const seededOrientation: Orientation =
                              editForm.orientation ??
                              parsed.orientation ??
                              "cis";
                            const seededEdgeA: Edge =
                              editForm.edgeA ?? parsed.edgeA ?? "watson_crick";
                            const seededEdgeB: Edge =
                              editForm.edgeB ??
                              parsed.edgeB ??
                              (baseFromRow === "wobble"
                                ? "hoogsteen"
                                : "watson_crick");
                            setEditForm((f) => ({
                              ...f,
                              typeBase: next,
                              orientation: seededOrientation,
                              edgeA: seededEdgeA,
                              edgeB: seededEdgeB,
                            }));
                          } else {
                            setEditForm((f) => ({ ...f, typeBase: next }));
                          }
                        }}
                        style={sel(true)}
                      >
                        <option value={"auto"}>auto</option>
                        <option value={"canonical"}>canonical</option>
                        <option value={"wobble"}>wobble</option>
                        <option value={"mismatch"}>mismatch</option>
                        <option value={"custom"}>{formatTypeBaseLabel("custom")}</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: theme.colors.text }}>
                        {formatTypeBaseLabel(decomposeTypeBase(r.type))}
                      </span>
                    )}
                  </td>
                  {/* Orientation */}
                  <td style={tdStyle(100)}>
                    {isEditing && base === "custom" ? (
                      <select
                        value={efOrientation ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            orientation:
                              (e.target.value as Orientation) || undefined,
                          }))
                        }
                        style={sel(true)}
                      >
                        <option value="" hidden>
                          —
                        </option>
                        <option value={"cis"}>cis</option>
                        <option value={"trans"}>trans</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: theme.colors.text }}>
                        {displayOrientation(r)}
                      </span>
                    )}
                  </td>
                  {/* Edge A */}
                  <td style={tdStyle(130)}>
                    {isEditing && base === "custom" ? (
                      <select
                        value={efEdgeA ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            edgeA: (e.target.value as Edge) || undefined,
                          }))
                        }
                        style={sel(true)}
                      >
                        <option value="" hidden>
                          —
                        </option>
                        <option value={"watson_crick"}>watson_crick</option>
                        <option value={"hoogsteen"}>hoogsteen</option>
                        <option value={"sugar_edge"}>sugar_edge</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: theme.colors.text }}>
                        {displayEdgeA(r)}
                      </span>
                    )}
                  </td>
                  {/* Edge B */}
                  <td style={tdStyle(130)}>
                    {isEditing && base === "custom" ? (
                      <select
                        value={efEdgeB ?? ""}
                        onChange={(e) =>
                          setEditForm((f) => ({
                            ...f,
                            edgeB: (e.target.value as Edge) || undefined,
                          }))
                        }
                        style={sel(true)}
                      >
                        <option value="" hidden>
                          —
                        </option>
                        <option value={"watson_crick"}>watson_crick</option>
                        <option value={"hoogsteen"}>hoogsteen</option>
                        <option value={"sugar_edge"}>sugar_edge</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: theme.colors.text }}>
                        {displayEdgeB(r)}
                      </span>
                    )}
                  </td>
                  {/* Action */}
                  <td style={{ ...tdStyle(70), textAlign: "center" }}>
                    {isEditing ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <MemoizedIconButton
                          title="Save"
                          onClick={() => {
                            if ("isGrouped" in r) {
                              saveGroupedBasePairEdit(r);
                            } else {
                              saveBasePairEdit(r);
                            }
                            setEditRowIndex(undefined);
                            setUpdateCalculatedRowsTrigger(prev => !prev);
                          }}
                          kind="save"
                          theme={theme}
                        />
                        <MemoizedIconButton
                          title="Cancel"
                          onClick={() => setEditRowIndex(undefined)}
                          kind="cancel"
                          theme={theme}
                        />
                      </div>
                    ) : (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <MemoizedIconButton
                          title="Edit"
                          onClick={() => beginEdit(r, i)}
                          kind="edit"
                          theme={theme}
                        />
                        <MemoizedIconButton
                          title="Delete"
                          onClick={() => {
                            deleteRow(r);
                            setUpdateCalculatedRowsTrigger(prev => !prev);
                          }}
                          kind="delete"
                          theme={theme}
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {errorMessage && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: theme.colors.error
                  }}
                >
                  {errorMessage}
                </td>
              </tr>
            )}
            {!errorMessage && rows.length === 0 && (
              <tr>
                <td
                  colSpan={10}
                  style={{
                    padding: 16,
                    textAlign: "center",
                    color: theme.colors.textSecondary,
                  }}
                >
                  No base pairs found. Use the "Add Base Pair" button above to
                  create new ones.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const MemoizedBasePairBottomSheet = React.memo(BasePairBottomSheet);