import React, { useEffect, useMemo, useRef, useState, useContext } from "react";
import { useTheme } from "../../../context/ThemeContext";
import {
  RnaComplexProps,
  RnaMoleculeKey,
  NucleotideKey,
  RnaComplexKey,
} from "../../../App";
import { BasePair as _BasePair } from "../../app_specific/BasePair";
import { RnaMolecule } from "../../app_specific/RnaMolecule";
import {
  RnaComplex,
  compareBasePairKeys,
  insertBasePair,
  DuplicateBasePairKeysHandler,
} from "../../app_specific/RnaComplex";
import { Context } from "../../../context/Context";
import { Pencil, Check, Trash2, X, Download, Upload } from "lucide-react";

export type FullKeysRecord = Record<
  RnaComplexKey,
  Record<RnaMoleculeKey, Set<NucleotideKey>>
>;

export interface BasePairBottomSheetProps {
  open: boolean;
  onClose: () => void;
  rnaComplexProps: RnaComplexProps;
  selected?: FullKeysRecord; // left-click selection (optional)
  formatMode?: boolean; // indicates if we're in Format mode
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
  type?: _BasePair.Type;
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
  type?: _BasePair.Type;
  length: number;
  isGrouped: true;
};

function parseDirectedType(t?: _BasePair.Type): {
  orientation?: Orientation;
  edgeA?: Edge;
  edgeB?: Edge;
} {
  if (!t) return {};
  if (
    t === _BasePair.Type.CANONICAL ||
    t === _BasePair.Type.WOBBLE ||
    t === _BasePair.Type.MISMATCH
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
): _BasePair.Type | undefined {
  if (!orientation || !edgeA || !edgeB) return undefined;
  const value = `${orientation}_${edgeA}_${edgeB}` as _BasePair.Type;
  return value;
}

function decomposeTypeBase(t?: _BasePair.Type): TypeBase {
  if (!t) return "auto";
  switch (t) {
    case _BasePair.Type.CANONICAL:
      return "canonical";
    case _BasePair.Type.WOBBLE:
      return "wobble";
    case _BasePair.Type.MISMATCH:
      return "mismatch";
    default:
      return "custom";
  }
}

export const BasePairBottomSheet: React.FC<BasePairBottomSheetProps> = ({
  open,
  onClose,
  rnaComplexProps,
  selected,
  formatMode = false,
}) => {
  const { theme } = useTheme();
  const [height, setHeight] = useState<number>(360);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<"Global" | "Selected">("Global");
  const [viewMode, setViewMode] = useState<"Individual" | "Grouped">("Individual");
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHRef = useRef<number>(360);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [rnaComplexesAreASingleton, setRnaComplexesAreASingleton] = useState<boolean>(true);
  const [rnaMoleculesAreASingleton, setRnaMoleculesAreASingleton] = useState<boolean>(true);
  type AddForm = {
    rnaComplexIndex?: number;
    rnaMoleculeName0?: string;
    formattedNucleotideIndex0?: number;
    rnaMoleculeName1?: string;
    formattedNucleotideIndex1?: number;
    typeBase: TypeBase;
    orientation?: Orientation;
    edgeA?: Edge;
    edgeB?: Edge;
  };
  const [addForm, setAddForm] = useState<AddForm>({ 
    typeBase: "auto",
    rnaComplexIndex : rnaComplexesAreASingleton ? Number.parseInt(Object.keys(rnaComplexProps)[0]) : undefined
  });
  const [editRowKey, setEditRowKey] = useState<string | null>(null);
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
  }>({});

  const setBasePairKeysToEdit = useContext(Context.BasePair.SetKeysToEdit);
  const pushToUndoStack = useContext(Context.App.PushToUndoStack);

  useEffect(() => {
    function onMove(e: MouseEvent) {
      if (!isResizing) return;
      const dy = startYRef.current - e.clientY;
      const newH = Math.min(
        Math.max(startHRef.current + dy, 220),
        window.innerHeight - 80
      );
      setHeight(newH);
    }
    function onUp() {
      if (isResizing) setIsResizing(false);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, [isResizing]);

  function computeRowsAll(): Row[] {
    const result: Row[] = [];
    for (const [rcIndexStr, complex] of Object.entries(rnaComplexProps)) {
      const rnaComplexIndex = parseInt(rcIndexStr);
      const rnaComplexName = complex.name;
      for (const [molName, basePairsPerMol] of Object.entries(
        complex.basePairs
      )) {
        const molProps0 = complex.rnaMoleculeProps[molName];
        for (const [nucIndexStr, basePairsPerNuc] of Object.entries(
          basePairsPerMol
        )) {
          const nucleotideIndex0 = parseInt(nucIndexStr);
          for (const mapped of basePairsPerNuc) {
            const keys0 = {
              rnaMoleculeName: molName,
              nucleotideIndex: nucleotideIndex0,
            };
            const keys1 = {
              rnaMoleculeName: mapped.rnaMoleculeName,
              nucleotideIndex: mapped.nucleotideIndex,
            };
            const [a] = [keys0, keys1].sort(compareBasePairKeys);
            if (
              a.rnaMoleculeName !== keys0.rnaMoleculeName ||
              a.nucleotideIndex !== keys0.nucleotideIndex
            ) {
              continue; // only include one direction
            }
            const molProps1 = complex.rnaMoleculeProps[mapped.rnaMoleculeName];
            result.push({
              rnaComplexIndex,
              rnaComplexName,
              rnaMoleculeName0: molName,
              nucleotideIndex0,
              formattedNucleotideIndex0:
                nucleotideIndex0 + molProps0.firstNucleotideIndex,
              rnaMoleculeName1: mapped.rnaMoleculeName,
              nucleotideIndex1: mapped.nucleotideIndex,
              formattedNucleotideIndex1:
                mapped.nucleotideIndex + molProps1.firstNucleotideIndex,
              type: mapped.basePairType,
            });
          }
        }
      }
    }
    result.sort(
      (r0, r1) =>
        r0.rnaComplexIndex - r1.rnaComplexIndex ||
        r0.rnaMoleculeName0.localeCompare(r1.rnaMoleculeName0) ||
        r0.nucleotideIndex0 - r1.nucleotideIndex0 ||
        r0.rnaMoleculeName1.localeCompare(r1.rnaMoleculeName1) ||
        r0.nucleotideIndex1 - r1.nucleotideIndex1
    );
    return result;
  }

  function computeRowsSelected(rowsAll: Row[]): Row[] {
    if (!selected || Object.keys(selected).length === 0) return [];
    const setHas = (rc: number, mol: string, idx: number) =>
      !!selected[rc]?.[mol]?.has(idx);
    return rowsAll.filter(
      (r) =>
        setHas(r.rnaComplexIndex, r.rnaMoleculeName0, r.nucleotideIndex0) ||
        setHas(r.rnaComplexIndex, r.rnaMoleculeName1, r.nucleotideIndex1)
    );
  }

  function computeGroupedRows(individualRows: Row[]): (Row | GroupedRow)[] {
    if (individualRows.length === 0) return [];
    
    const grouped: (Row | GroupedRow)[] = [];
    let i = 0;
    
    while (i < individualRows.length) {
      const current = individualRows[i];
      let j = i + 1;
      
      // Determine the direction of the second strand (parallel or antiparallel)
      let direction1: number | null = null;
      if (i + 1 < individualRows.length) {
        const next = individualRows[i + 1];
        if (
          next.rnaComplexIndex === current.rnaComplexIndex &&
          next.rnaMoleculeName0 === current.rnaMoleculeName0 &&
          next.rnaMoleculeName1 === current.rnaMoleculeName1 &&
          next.type === current.type &&
          next.nucleotideIndex0 === current.nucleotideIndex0 + 1
        ) {
          // Determine if strand 1 is going up (+1) or down (-1)
          direction1 = next.nucleotideIndex1 - current.nucleotideIndex1;
        }
      }
      
      // Try to find consecutive rows with same properties
      while (j < individualRows.length) {
        const next = individualRows[j];
        const prev = individualRows[j - 1];
        
        // Check if next row can be grouped with previous
        // Strand 0 must increment by 1, strand 1 can increment or decrement by 1
        const canGroup = (
          next.rnaComplexIndex === prev.rnaComplexIndex &&
          next.rnaMoleculeName0 === prev.rnaMoleculeName0 &&
          next.rnaMoleculeName1 === prev.rnaMoleculeName1 &&
          next.type === prev.type &&
          next.nucleotideIndex0 === prev.nucleotideIndex0 + 1 &&
          (
            (direction1 === null && (next.nucleotideIndex1 === prev.nucleotideIndex1 + 1 || next.nucleotideIndex1 === prev.nucleotideIndex1 - 1)) ||
            (direction1 !== null && next.nucleotideIndex1 === prev.nucleotideIndex1 + direction1)
          )
        );
        
        if (!canGroup) break;
        j++;
      }
      
      // If we found a group (more than one consecutive row)
      if (j - i > 1) {
        const first = individualRows[i];
        const last = individualRows[j - 1];
        grouped.push({
          rnaComplexIndex: first.rnaComplexIndex,
          rnaComplexName: first.rnaComplexName,
          rnaMoleculeName0: first.rnaMoleculeName0,
          nucleotideIndex0Start: first.nucleotideIndex0,
          nucleotideIndex0End: last.nucleotideIndex0,
          formattedNucleotideIndex0Start: first.formattedNucleotideIndex0,
          formattedNucleotideIndex0End: last.formattedNucleotideIndex0,
          rnaMoleculeName1: first.rnaMoleculeName1,
          nucleotideIndex1Start: first.nucleotideIndex1,
          nucleotideIndex1End: last.nucleotideIndex1,
          formattedNucleotideIndex1Start: first.formattedNucleotideIndex1,
          formattedNucleotideIndex1End: last.formattedNucleotideIndex1,
          type: first.type,
          length: j - i,
          isGrouped: true,
        });
      } else {
        // Single row, keep as is
        grouped.push(current);
      }
      
      i = j;
    }
    
    return grouped;
  }

  const allRows = computeRowsAll();
  const selectedRows = computeRowsSelected(allRows);
  const baseRows = activeTab === "Global" ? allRows : selectedRows;
  const rows = viewMode === "Grouped" ? computeGroupedRows(baseRows) : baseRows;

  function csvEscape(value: string): string {
    if (value == null) return "";
    const needsQuotes = /[",\n]/.test(value);
    const escaped = value.replace(/"/g, '""');
    return needsQuotes ? `"${escaped}"` : escaped;
  }

  function splitCsvLine(line: string): string[] {
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
  }

  function exportCsv() {
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
  }

  function parseAndApplyCsv(text: string) {
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
      type?: _BasePair.Type;
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
      let newType: _BasePair.Type | undefined;
      if (tb === "auto") newType = undefined;
      else if (tb === "canonical") newType = _BasePair.Type.CANONICAL;
      else if (tb === "wobble") newType = _BasePair.Type.WOBBLE;
      else if (tb === "mismatch") newType = _BasePair.Type.MISMATCH;
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
  }

  function onImportClick() {
    fileInputRef.current?.click();
  }

  async function onCsvFileChange(e: React.ChangeEvent<HTMLInputElement>) {
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
  }

  function resolveMoleculeByFormattedIndex(
    rnaComplexIndex: number,
    formattedIndex: number
  ): string | undefined {
    const complex = rnaComplexProps[rnaComplexIndex];
    if (!complex) return undefined;
    for (const [molName, mp] of Object.entries(complex.rnaMoleculeProps)) {
      const idx = formattedIndex - mp.firstNucleotideIndex;
      if (idx in mp.nucleotideProps) return molName;
    }
    return undefined;
  }

  function getSymbolByFormattedIndex(
    rnaComplexIndex: number,
    molName: string,
    formattedIndex: number
  ): string {
    const complex = rnaComplexProps[rnaComplexIndex];
    if (!complex) return "UNK";
    const mp = complex.rnaMoleculeProps[molName];
    if (!mp) return "UNK";
    const idx = formattedIndex - mp.firstNucleotideIndex;
    if (!(idx in mp.nucleotideProps)) return "UNK";
    const sym = (mp.nucleotideProps as any)[idx]?.symbol as string | undefined;
    return sym ? sym.toUpperCase() : "UNK";
  }

  function updateTypeForRow(
    row: Row,
    typeBase: TypeBase,
    orientation?: Orientation,
    edgeA?: Edge,
    edgeB?: Edge
  ) {
    const complex = rnaComplexProps[row.rnaComplexIndex];
    if (!complex) return;

    let newType: _BasePair.Type | undefined;
    switch (typeBase) {
      case "auto":
        newType = undefined;
        break;
      case "canonical":
        newType = _BasePair.Type.CANONICAL;
        break;
      case "wobble":
        newType = _BasePair.Type.WOBBLE;
        break;
      case "mismatch":
        newType = _BasePair.Type.MISMATCH;
        break;
      case "custom":
        newType = assembleDirectedType(orientation, edgeA, edgeB);
        break;
    }

    // Apply mutation via insert, then trigger rerender by keysToEdit
    pushToUndoStack();
    insertBasePair(
      complex,
      row.rnaMoleculeName0,
      row.nucleotideIndex0,
      row.rnaMoleculeName1,
      row.nucleotideIndex1,
      DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
      { basePairType: newType }
    );

    const [keys0, keys1] = [
      {
        rnaMoleculeName: row.rnaMoleculeName0,
        nucleotideIndex: row.nucleotideIndex0,
      },
      {
        rnaMoleculeName: row.rnaMoleculeName1,
        nucleotideIndex: row.nucleotideIndex1,
      },
    ].sort(compareBasePairKeys);

    setBasePairKeysToEdit({
      [row.rnaComplexIndex]: {
        add: [{ keys0, keys1 }],
        delete: [],
      },
    });
  }

  function renderTypeControls(row: Row) {
    const base: TypeBase = decomposeTypeBase(row.type);
    const { orientation, edgeA, edgeB } = parseDirectedType(row.type);

    const isCustom = base === "custom";

    const selectStyle: React.CSSProperties = {
      width: 110,
      padding: "6px 8px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: theme.colors.text,
      background: theme.colors.background,
    };

    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          justifyContent: "center",
        }}
      >
        <select
          value={base}
          onChange={(e) => {
            const tb = e.target.value as TypeBase;
            updateTypeForRow(row, tb, orientation, edgeA, edgeB);
          }}
          style={selectStyle}
        >
          <option value={"auto"}>auto</option>
          <option value={"canonical"}>canonical</option>
          <option value={"wobble"}>wobble</option>
          <option value={"mismatch"}>mismatch</option>
          <option value={"custom"}>custom</option>
        </select>

        <select
          value={orientation ?? ""}
          onChange={(e) =>
            updateTypeForRow(
              row,
              "custom",
              (e.target.value as Orientation) || undefined,
              edgeA,
              edgeB
            )
          }
          disabled={!isCustom}
          style={{ ...selectStyle, opacity: isCustom ? 1 : 0.6 }}
        >
          <option value={""} hidden>
            orientation
          </option>
          <option value={"cis"}>cis</option>
          <option value={"trans"}>trans</option>
        </select>

        <select
          value={edgeA ?? ""}
          onChange={(e) =>
            updateTypeForRow(
              row,
              "custom",
              orientation,
              (e.target.value as Edge) || undefined,
              edgeB
            )
          }
          disabled={!isCustom}
          style={{ ...selectStyle, opacity: isCustom ? 1 : 0.6 }}
        >
          <option value={""} hidden>
            edge A
          </option>
          <option value={"watson_crick"}>watson_crick</option>
          <option value={"hoogsteen"}>hoogsteen</option>
          <option value={"sugar_edge"}>sugar_edge</option>
        </select>

        <select
          value={edgeB ?? ""}
          onChange={(e) =>
            updateTypeForRow(
              row,
              "custom",
              orientation,
              edgeA,
              (e.target.value as Edge) || undefined
            )
          }
          disabled={!isCustom}
          style={{ ...selectStyle, opacity: isCustom ? 1 : 0.6 }}
        >
          <option value={""} hidden>
            edge B
          </option>
          <option value={"watson_crick"}>watson_crick</option>
          <option value={"hoogsteen"}>hoogsteen</option>
          <option value={"sugar_edge"}>sugar_edge</option>
        </select>
      </div>
    );
  }

  function deleteRow(row: Row) {
    const complex = rnaComplexProps[row.rnaComplexIndex];
    if (!complex) return;
    pushToUndoStack();
    const bp0 = complex.basePairs[row.rnaMoleculeName0];
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
    const bp1 = complex.basePairs[row.rnaMoleculeName1];
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

    const [keys0, keys1] = [
      {
        rnaMoleculeName: row.rnaMoleculeName0,
        nucleotideIndex: row.nucleotideIndex0,
      },
      {
        rnaMoleculeName: row.rnaMoleculeName1,
        nucleotideIndex: row.nucleotideIndex1,
      },
    ].sort(compareBasePairKeys);
    setBasePairKeysToEdit({
      [row.rnaComplexIndex]: {
        add: [],
        delete: [{ keys0, keys1 }],
      },
    });
  }

  function addBasePair() {
    const form = addForm;
    if (form.rnaComplexIndex == null) return;
    const complex = rnaComplexProps[form.rnaComplexIndex];
    if (!complex) return;
    const mol0 = form.rnaMoleculeName0!;
    const mol1 = form.rnaMoleculeName1!;
    // Auto-resolve molecules by formatted index
    // const mol0 =
    //   resolveMoleculeByFormattedIndex(
    //     form.rnaComplexIndex,
    //     form.formattedNucleotideIndex0 ?? NaN
    //   ) ?? Object.keys(complex.rnaMoleculeProps)[0];
    // const mol1 =
    //   resolveMoleculeByFormattedIndex(
    //     form.rnaComplexIndex,
    //     form.formattedNucleotideIndex1 ?? NaN
    //   ) ?? Object.keys(complex.rnaMoleculeProps)[0];
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
    const newType =
      form.typeBase === "custom"
        ? assembleDirectedType(form.orientation, form.edgeA, form.edgeB)
        : form.typeBase === "canonical"
        ? _BasePair.Type.CANONICAL
        : form.typeBase === "wobble"
        ? _BasePair.Type.WOBBLE
        : form.typeBase === "mismatch"
        ? _BasePair.Type.MISMATCH
        : undefined;
    pushToUndoStack();
    insertBasePair(
      complex,
      mol0,
      idx0,
      mol1,
      idx1,
      DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
      { basePairType: newType }
    );
    const [keys0, keys1] = [
      { rnaMoleculeName: mol0, nucleotideIndex: idx0 },
      { rnaMoleculeName: mol1, nucleotideIndex: idx1 },
    ].sort(compareBasePairKeys);
    setBasePairKeysToEdit({
      [form.rnaComplexIndex]: { add: [{ keys0, keys1 }], delete: [] },
    });
    setShowAdd(false);
    setAddForm({ typeBase: "auto" });
  }

  function beginEdit(row: Row) {
    setEditRowKey(
      `${row.rnaComplexIndex}:${row.rnaMoleculeName0}:${row.nucleotideIndex0}:${row.rnaMoleculeName1}:${row.nucleotideIndex1}`
    );
    const complex = rnaComplexProps[row.rnaComplexIndex];
    const mp0 = complex.rnaMoleculeProps[row.rnaMoleculeName0];
    const mp1 = complex.rnaMoleculeProps[row.rnaMoleculeName1];
    const pd = parseDirectedType(row.type);
    setEditForm({
      rnaComplexIndex: row.rnaComplexIndex,
      rnaMoleculeName0: row.rnaMoleculeName0,
      formattedNucleotideIndex0:
        row.nucleotideIndex0 + mp0.firstNucleotideIndex,
      rnaMoleculeName1: row.rnaMoleculeName1,
      formattedNucleotideIndex1:
        row.nucleotideIndex1 + mp1.firstNucleotideIndex,
      typeBase: decomposeTypeBase(row.type),
      orientation: pd.orientation,
      edgeA: pd.edgeA,
      edgeB: pd.edgeB,
    });
  }

  function saveEdit(row: Row) {
    const form = editForm;
    if (
      form.rnaComplexIndex == null ||
      !form.rnaMoleculeName0 ||
      !form.rnaMoleculeName1 ||
      form.formattedNucleotideIndex0 == null ||
      form.formattedNucleotideIndex1 == null
    )
      return;
    // Re-resolve molecules by edited formatted indices
    const fallbackMol0 = form.rnaMoleculeName0 as string;
    const fallbackMol1 = form.rnaMoleculeName1 as string;
    const resolvedMol0 = form.rnaMoleculeName0;
    const resolvedMol1 = form.rnaMoleculeName1;
    // const resolvedMol0 = (resolveMoleculeByFormattedIndex(
    //   form.rnaComplexIndex,
    //   form.formattedNucleotideIndex0
    // ) ?? fallbackMol0) as string;
    // const resolvedMol1 = (resolveMoleculeByFormattedIndex(
    //   form.rnaComplexIndex,
    //   form.formattedNucleotideIndex1
    // ) ?? fallbackMol1) as string;
    const complex = rnaComplexProps[form.rnaComplexIndex];
    const mp0 = complex.rnaMoleculeProps[resolvedMol0 as string];
    const mp1 = complex.rnaMoleculeProps[resolvedMol1 as string];
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
    let newType: _BasePair.Type | undefined = undefined;
    if (form.typeBase === "custom")
      newType = assembleDirectedType(form.orientation, form.edgeA, form.edgeB);
    else if (form.typeBase === "canonical") newType = _BasePair.Type.CANONICAL;
    else if (form.typeBase === "wobble") newType = _BasePair.Type.WOBBLE;
    else if (form.typeBase === "mismatch") newType = _BasePair.Type.MISMATCH;
    insertBasePair(
      oldC,
      resolvedMol0,
      newIdx0,
      resolvedMol1,
      newIdx1,
      DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
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
    setEditRowKey(null);
  }

  function updateRowIndices(
    row: Row,
    newFormatted0?: number,
    newFormatted1?: number
  ) {
    // Only nt1 and nt2 are mandatory; update whichever was edited.
    const complex = rnaComplexProps[row.rnaComplexIndex];
    if (!complex) return;
    const mp0 = complex.rnaMoleculeProps[row.rnaMoleculeName0];
    const mp1 = complex.rnaMoleculeProps[row.rnaMoleculeName1];
    let idx0 = row.nucleotideIndex0;
    let idx1 = row.nucleotideIndex1;
    if (newFormatted0 != null) {
      const candidate = newFormatted0 - mp0.firstNucleotideIndex;
      if (candidate in mp0.nucleotideProps) idx0 = candidate;
      else return;
    }
    if (newFormatted1 != null) {
      const candidate = newFormatted1 - mp1.firstNucleotideIndex;
      if (candidate in mp1.nucleotideProps) idx1 = candidate;
      else return;
    }
    if (idx0 === row.nucleotideIndex0 && idx1 === row.nucleotideIndex1) return;
    pushToUndoStack();
    // remove existing mapping
    const bp0 = complex.basePairs[row.rnaMoleculeName0];
    if (bp0 && row.nucleotideIndex0 in bp0) {
      const arr = bp0[row.nucleotideIndex0];
      const i = arr.findIndex(
        (m) =>
          m.rnaMoleculeName === row.rnaMoleculeName1 &&
          m.nucleotideIndex === row.nucleotideIndex1
      );
      if (i !== -1) {
        if (arr.length === 1) delete bp0[row.nucleotideIndex0];
        else arr.splice(i, 1);
      }
    }
    const bp1 = complex.basePairs[row.rnaMoleculeName1];
    if (bp1 && row.nucleotideIndex1 in bp1) {
      const arr = bp1[row.nucleotideIndex1];
      const i = arr.findIndex(
        (m) =>
          m.rnaMoleculeName === row.rnaMoleculeName0 &&
          m.nucleotideIndex === row.nucleotideIndex0
      );
      if (i !== -1) {
        if (arr.length === 1) delete bp1[row.nucleotideIndex1];
        else arr.splice(i, 1);
      }
    }
    // add new mapping
    insertBasePair(
      complex,
      row.rnaMoleculeName0,
      idx0,
      row.rnaMoleculeName1,
      idx1,
      DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING,
      { basePairType: row.type }
    );
    const [oldKeys0, oldKeys1] = [
      {
        rnaMoleculeName: row.rnaMoleculeName0,
        nucleotideIndex: row.nucleotideIndex0,
      },
      {
        rnaMoleculeName: row.rnaMoleculeName1,
        nucleotideIndex: row.nucleotideIndex1,
      },
    ].sort(compareBasePairKeys);
    const [newKeys0, newKeys1] = [
      { rnaMoleculeName: row.rnaMoleculeName0, nucleotideIndex: idx0 },
      { rnaMoleculeName: row.rnaMoleculeName1, nucleotideIndex: idx1 },
    ].sort(compareBasePairKeys);
    setBasePairKeysToEdit({
      [row.rnaComplexIndex]: {
        add: [{ keys0: newKeys0, keys1: newKeys1 }],
        delete: [{ keys0: oldKeys0, keys1: oldKeys1 }],
      },
    });
  }

  function isGroupedRow(row: Row | GroupedRow): row is GroupedRow {
    return (row as GroupedRow).isGrouped === true;
  }

  function displayOrientation(row: Row | GroupedRow): string {
    const { orientation } = parseDirectedType(row.type);
    if (orientation) return orientation;
    // If not custom, derive meaningful default
    const base = decomposeTypeBase(row.type);
    if (base === "canonical") return "cis";
    if (base === "wobble") return "cis";
    if (base === "mismatch") return "cis";
    if (base === "auto") return "auto";
    return "cis";
  }
  function displayEdgeA(row: Row | GroupedRow): string {
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
  }
  function displayEdgeB(row: Row | GroupedRow): string {
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
  }

  function thStyle(width: number): React.CSSProperties {
    return {
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
      color: theme.colors.text,
    };
  }

  function tdStyle(width: number): React.CSSProperties {
    return {
      padding: "8px 12px",
      minWidth: width,
      maxWidth: width,
      overflow: "hidden",
      textOverflow: "ellipsis",
      whiteSpace: "nowrap",
      fontSize: 12,
      textAlign: "center",
      color: theme.colors.text,
    };
  }

  function sel(enabled: boolean = true): React.CSSProperties {
    return {
      width: 130,
      padding: "6px 8px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      background: theme.colors.background,
      color: theme.colors.text,
      opacity: enabled ? 1 : 0.6,
    };
  }

  function inp(): React.CSSProperties {
    return {
      width: 100,
      padding: "6px 8px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: theme.colors.text,
      background: theme.colors.background,
    };
  }

  function btn(): React.CSSProperties {
    return {
      padding: "6px 10px",
      borderRadius: 8,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.background,
      fontSize: 12,
      fontWeight: 600,
      color: theme.colors.text,
      cursor: "pointer",
    };
  }

  function inpCell(): React.CSSProperties {
    return {
      width: "100%",
      padding: "4px 6px",
      border: `1px solid ${theme.colors.border}`,
      borderRadius: 6,
      fontSize: 12,
      color: theme.colors.text,
      background: theme.colors.background,
    };
  }

  function btnSmall(): React.CSSProperties {
    return {
      padding: "4px 8px",
      borderRadius: 6,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.background,
      fontSize: 11,
      fontWeight: 600,
      color: theme.colors.text,
      cursor: "pointer",
    };
  }

  function IconButton(props: {
    title?: string;
    onClick?: () => void;
    kind: "edit" | "delete" | "save" | "cancel";
  }) {
    const { title, onClick, kind } = props;
    const base: React.CSSProperties = {
      width: 28,
      height: 28,
      borderRadius: 6,
      border: `1px solid ${theme.colors.border}`,
      background: theme.colors.background,
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
          <span
            style={{
              fontWeight: 700,
              fontSize: 13,
              color: theme.colors.text,
              letterSpacing: 0.3,
            }}
          >
            {formatMode ? "Base-Pair Editor" : "Base-Pair Editor"} -- Select Representation:
          </span>
          <div
            style={{
              display: "flex",
              gap: 6,
              background: theme.colors.surfaceHover,
              padding: "4px",
              borderRadius: 8,
            }}
          >
            {(["Individual", "Grouped"] as const).map((t) => (
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
            onClick={() =>
              window.dispatchEvent(new CustomEvent("triggerReformatAll"))
            }
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
                  if (rnaMoleculesAreASingleton) {
                    const rnaMoleculeName = Object.keys(rnaComplexProps[rnaComplexIndex].rnaMoleculeProps)[0];
                    newAddForm.rnaMoleculeName0 = rnaMoleculeName;
                    newAddForm.rnaMoleculeName1 = rnaMoleculeName;
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
                    const mol = addForm.rnaMoleculeName0;/* resolveMoleculeByFormattedIndex(rc, idx); */
                    if (mol) {
                      const sym = getSymbolByFormattedIndex(rc, mol, idx);
                      initial = sym === "UNK" ? "UNK" : sym[0].toUpperCase();
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
                    const mol = addForm.rnaMoleculeName1; /* resolveMoleculeByFormattedIndex(rc, idx); */
                    if (mol) {
                      const sym = getSymbolByFormattedIndex(rc, mol, idx);
                      initial = sym === "UNK" ? "UNK" : sym[0].toUpperCase();
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
                <option value={"custom"}>custom</option>
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
                  addForm.formattedNucleotideIndex1 == null
                }
              >
                Add
              </button>
            </div>
          )}
          <button
            onClick={() => {
              if (!showAdd) {
                setAddForm({
                  rnaComplexIndex : undefined,
                  rnaMoleculeName0 : undefined,
                  rnaMoleculeName1 : undefined,
                  formattedNucleotideIndex0 : undefined,
                  formattedNucleotideIndex1 : undefined,
                  typeBase : "auto"
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
              {viewMode === "Grouped" && <th style={thStyle(60)}>Length</th>}
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
              const rowKey = isGrouped 
                ? `${r.rnaComplexIndex}:${r.rnaMoleculeName0}:${r.nucleotideIndex0Start}-${r.nucleotideIndex0End}:${r.rnaMoleculeName1}:${r.nucleotideIndex1Start}-${r.nucleotideIndex1End}`
                : `${r.rnaComplexIndex}:${r.rnaMoleculeName0}:${r.nucleotideIndex0}:${r.rnaMoleculeName1}:${r.nucleotideIndex1}`;
              const isEditing = !isGrouped && editRowKey === rowKey;
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
                  key={`${rowKey}:${i}`}
                  style={{
                    borderBottom: `1px solid ${theme.colors.border}`,
                    background:
                      i % 2 === 0
                        ? theme.colors.background
                        : theme.colors.surface,
                  }}
                >
                  {!rnaComplexesAreASingleton &&<td style={tdStyle(120)}>{r.rnaComplexName}</td>}
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
                          const initialStart = symbolStart === "UNK" ? "UNK" : symbolStart[0].toUpperCase();
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
                          symbol === "UNK" ? "UNK" : symbol[0].toUpperCase();
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
                          const initialStart = symbolStart === "UNK" ? "UNK" : symbolStart[0].toUpperCase();
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
                          symbol === "UNK" ? "UNK" : symbol[0].toUpperCase();
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
                  {viewMode === "Grouped" && (
                    <td style={tdStyle(60)}>
                      <span style={{ fontSize: 12, color: theme.colors.text }}>
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
                        <option value={"custom"}>LW Schema</option>
                      </select>
                    ) : (
                      <span style={{ fontSize: 12, color: theme.colors.text }}>
                        {decomposeTypeBase(r.type)}
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
                    {isGrouped ? (
                      <span style={{ fontSize: 11, color: theme.colors.textSecondary }}>
                        —
                      </span>
                    ) : isEditing ? (
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "center",
                          gap: 6,
                        }}
                      >
                        <IconButton
                          title="Save"
                          onClick={() => saveEdit(r)}
                          kind="save"
                        />
                        <IconButton
                          title="Cancel"
                          onClick={() => setEditRowKey(null)}
                          kind="cancel"
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
                        <IconButton
                          title="Edit"
                          onClick={() => beginEdit(r)}
                          kind="edit"
                        />
                        <IconButton
                          title="Delete"
                          onClick={() => deleteRow(r)}
                          kind="delete"
                        />
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            {rows.length === 0 && (
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