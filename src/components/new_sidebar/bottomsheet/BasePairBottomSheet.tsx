import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { RnaComplexProps, RnaMoleculeKey, NucleotideKey, RnaComplexKey } from '../../../App';
import { BasePair as _BasePair } from '../../app_specific/BasePair';
import { RnaComplex, compareBasePairKeys, insertBasePair, DuplicateBasePairKeysHandler } from '../../app_specific/RnaComplex';
import { Context } from '../../../context/Context';

export type FullKeysRecord = Record<RnaComplexKey, Record<RnaMoleculeKey, Set<NucleotideKey>>>;

export interface BasePairBottomSheetProps {
  open: boolean;
  onClose: () => void;
  rnaComplexProps: RnaComplexProps;
  selected?: FullKeysRecord; // left-click selection (optional)
}

type Orientation = 'cis' | 'trans';
type Edge = 'watson_crick' | 'hoogsteen' | 'sugar_edge';
type TypeBase = 'auto' | 'canonical' | 'wobble' | 'mismatch' | 'custom';

type Row = {
  rnaComplexIndex: number;
  rnaComplexName: string;
  rnaMoleculeName0: string;
  nucleotideIndex0: number; // formatted index in molecule (internal array key)
  formattedNucleotideIndex0: number; // absolute index displayed
  rnaMoleculeName1: string;
  nucleotideIndex1: number;
  formattedNucleotideIndex1: number;
  type?: _BasePair.Type;
};

function parseDirectedType(t?: _BasePair.Type): { orientation?: Orientation; edgeA?: Edge; edgeB?: Edge } {
  if (!t) return {};
  if (t === _BasePair.Type.CANONICAL || t === _BasePair.Type.WOBBLE || t === _BasePair.Type.MISMATCH) return {};
  const tokens = String(t).split('_');
  if (tokens.length === 0) return {};
  const o = tokens[0];
  if (o !== 'cis' && o !== 'trans') return {};
  const orientation = o as Orientation;
  let i = 1;
  function readEdge(): Edge | undefined {
    const a = tokens[i];
    const b = tokens[i + 1];
    if (a === 'watson' && b === 'crick') { i += 2; return 'watson_crick'; }
    if (a === 'sugar' && b === 'edge') { i += 2; return 'sugar_edge'; }
    if (a === 'hoogsteen') { i += 1; return 'hoogsteen'; }
    return undefined;
  }
  const edgeA = readEdge();
  const edgeB = readEdge();
  if (!edgeA || !edgeB) return { orientation };
  return { orientation, edgeA, edgeB };
}

function assembleDirectedType(orientation?: Orientation, edgeA?: Edge, edgeB?: Edge): _BasePair.Type | undefined {
  if (!orientation || !edgeA || !edgeB) return undefined;
  const value = `${orientation}_${edgeA}_${edgeB}` as _BasePair.Type;
  return value;
}

function decomposeTypeBase(t?: _BasePair.Type): TypeBase {
  if (!t) return 'auto';
  switch (t) {
    case _BasePair.Type.CANONICAL:
      return 'canonical';
    case _BasePair.Type.WOBBLE:
      return 'wobble';
    case _BasePair.Type.MISMATCH:
      return 'mismatch';
    default:
      return 'custom';
  }
}

export const BasePairBottomSheet: React.FC<BasePairBottomSheetProps> = ({ open, onClose, rnaComplexProps, selected }) => {
  const [height, setHeight] = useState<number>(360);
  const [isResizing, setIsResizing] = useState(false);
  const [activeTab, setActiveTab] = useState<'Global' | 'Selected'>('Global');
  const sheetRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef<number>(0);
  const startHRef = useRef<number>(360);
  const [showAdd, setShowAdd] = useState<boolean>(false);
  const [addForm, setAddForm] = useState<{
    rnaComplexIndex?: number;
    rnaMoleculeName0?: string;
    formattedNucleotideIndex0?: number;
    rnaMoleculeName1?: string;
    formattedNucleotideIndex1?: number;
    typeBase: TypeBase;
    orientation?: Orientation;
    edgeA?: Edge;
    edgeB?: Edge;
  }>({ typeBase: 'auto' });
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
      const newH = Math.min(Math.max(startHRef.current + dy, 220), window.innerHeight - 80);
      setHeight(newH);
    }
    function onUp() {
      if (isResizing) setIsResizing(false);
    }
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
    return () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
  }, [isResizing]);

  function computeRowsAll(): Row[] {
    const result: Row[] = [];
    for (const [rcIndexStr, complex] of Object.entries(rnaComplexProps)) {
      const rnaComplexIndex = parseInt(rcIndexStr);
      const rnaComplexName = complex.name;
      for (const [molName, basePairsPerMol] of Object.entries(complex.basePairs)) {
        const molProps0 = complex.rnaMoleculeProps[molName];
        for (const [nucIndexStr, basePairsPerNuc] of Object.entries(basePairsPerMol)) {
          const nucleotideIndex0 = parseInt(nucIndexStr);
          for (const mapped of basePairsPerNuc) {
            const keys0 = { rnaMoleculeName: molName, nucleotideIndex: nucleotideIndex0 };
            const keys1 = { rnaMoleculeName: mapped.rnaMoleculeName, nucleotideIndex: mapped.nucleotideIndex };
            const [a] = [keys0, keys1].sort(compareBasePairKeys);
            if (a.rnaMoleculeName !== keys0.rnaMoleculeName || a.nucleotideIndex !== keys0.nucleotideIndex) {
              continue; // only include one direction
            }
            const molProps1 = complex.rnaMoleculeProps[mapped.rnaMoleculeName];
            result.push({
              rnaComplexIndex,
              rnaComplexName,
              rnaMoleculeName0: molName,
              nucleotideIndex0,
              formattedNucleotideIndex0: nucleotideIndex0 + molProps0.firstNucleotideIndex,
              rnaMoleculeName1: mapped.rnaMoleculeName,
              nucleotideIndex1: mapped.nucleotideIndex,
              formattedNucleotideIndex1: mapped.nucleotideIndex + molProps1.firstNucleotideIndex,
              type: mapped.basePairType,
            });
          }
        }
      }
    }
    result.sort((r0, r1) => (
      (r0.rnaComplexIndex - r1.rnaComplexIndex) ||
      r0.rnaMoleculeName0.localeCompare(r1.rnaMoleculeName0) ||
      (r0.nucleotideIndex0 - r1.nucleotideIndex0) ||
      r0.rnaMoleculeName1.localeCompare(r1.rnaMoleculeName1) ||
      (r0.nucleotideIndex1 - r1.nucleotideIndex1)
    ));
    return result;
  }

  function computeRowsSelected(rowsAll: Row[]): Row[] {
    if (!selected || Object.keys(selected).length === 0) return [];
    const setHas = (rc: number, mol: string, idx: number) => !!selected[rc]?.[mol]?.has(idx);
    return rowsAll.filter(r => setHas(r.rnaComplexIndex, r.rnaMoleculeName0, r.nucleotideIndex0) || setHas(r.rnaComplexIndex, r.rnaMoleculeName1, r.nucleotideIndex1));
  }

  const allRows = computeRowsAll();
  const rows = activeTab === 'Global' ? allRows : computeRowsSelected(allRows);

  function resolveMoleculeByFormattedIndex(rnaComplexIndex: number, formattedIndex: number): string | undefined {
    const complex = rnaComplexProps[rnaComplexIndex];
    if (!complex) return undefined;
    for (const [molName, mp] of Object.entries(complex.rnaMoleculeProps)) {
      const idx = formattedIndex - mp.firstNucleotideIndex;
      if (idx in mp.nucleotideProps) return molName;
    }
    return undefined;
  }

  function getSymbolByFormattedIndex(rnaComplexIndex: number, molName: string, formattedIndex: number): string {
    const complex = rnaComplexProps[rnaComplexIndex];
    if (!complex) return 'UNK';
    const mp = complex.rnaMoleculeProps[molName];
    if (!mp) return 'UNK';
    const idx = formattedIndex - mp.firstNucleotideIndex;
    if (!(idx in mp.nucleotideProps)) return 'UNK';
    const sym = (mp.nucleotideProps as any)[idx]?.symbol as string | undefined;
    return sym ? sym.toUpperCase() : 'UNK';
  }

  function updateTypeForRow(row: Row, typeBase: TypeBase, orientation?: Orientation, edgeA?: Edge, edgeB?: Edge) {
    const complex = rnaComplexProps[row.rnaComplexIndex];
    if (!complex) return;

    let newType: _BasePair.Type | undefined;
    switch (typeBase) {
      case 'auto': newType = undefined; break;
      case 'canonical': newType = _BasePair.Type.CANONICAL; break;
      case 'wobble': newType = _BasePair.Type.WOBBLE; break;
      case 'mismatch': newType = _BasePair.Type.MISMATCH; break;
      case 'custom': newType = assembleDirectedType(orientation, edgeA, edgeB); break;
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
      { rnaMoleculeName: row.rnaMoleculeName0, nucleotideIndex: row.nucleotideIndex0 },
      { rnaMoleculeName: row.rnaMoleculeName1, nucleotideIndex: row.nucleotideIndex1 },
    ].sort(compareBasePairKeys);

    setBasePairKeysToEdit({
      [row.rnaComplexIndex]: {
        add: [{ keys0, keys1 }],
        delete: [],
      }
    });
  }

  function renderTypeControls(row: Row) {
    const base: TypeBase = decomposeTypeBase(row.type);
    const { orientation, edgeA, edgeB } = parseDirectedType(row.type);

    const isCustom = base === 'custom';

    const selectStyle: React.CSSProperties = {
      width: 110,
      padding: '6px 8px',
      border: '1px solid #e2e8f0',
      borderRadius: 6,
      fontSize: 12,
      color: '#0f172a',
      background: '#ffffff',
    };

    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <select
          value={base}
          onChange={(e) => {
            const tb = e.target.value as TypeBase;
            updateTypeForRow(row, tb, orientation, edgeA, edgeB);
          }}
          style={selectStyle}
        >
          <option value={'auto'}>auto</option>
          <option value={'canonical'}>canonical</option>
          <option value={'wobble'}>wobble</option>
          <option value={'mismatch'}>mismatch</option>
          <option value={'custom'}>custom</option>
        </select>

        <select
          value={orientation ?? ''}
          onChange={(e) => updateTypeForRow(row, 'custom', (e.target.value as Orientation) || undefined, edgeA, edgeB)}
          disabled={!isCustom}
          style={{ ...selectStyle, opacity: isCustom ? 1 : 0.6 }}
        >
          <option value={''} hidden>orientation</option>
          <option value={'cis'}>cis</option>
          <option value={'trans'}>trans</option>
        </select>

        <select
          value={edgeA ?? ''}
          onChange={(e) => updateTypeForRow(row, 'custom', orientation, (e.target.value as Edge) || undefined, edgeB)}
          disabled={!isCustom}
          style={{ ...selectStyle, opacity: isCustom ? 1 : 0.6 }}
        >
          <option value={''} hidden>edge A</option>
          <option value={'watson_crick'}>watson_crick</option>
          <option value={'hoogsteen'}>hoogsteen</option>
          <option value={'sugar_edge'}>sugar_edge</option>
        </select>

        <select
          value={edgeB ?? ''}
          onChange={(e) => updateTypeForRow(row, 'custom', orientation, edgeA, (e.target.value as Edge) || undefined)}
          disabled={!isCustom}
          style={{ ...selectStyle, opacity: isCustom ? 1 : 0.6 }}
        >
          <option value={''} hidden>edge B</option>
          <option value={'watson_crick'}>watson_crick</option>
          <option value={'hoogsteen'}>hoogsteen</option>
          <option value={'sugar_edge'}>sugar_edge</option>
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
      const idx = arr.findIndex(m => m.rnaMoleculeName === row.rnaMoleculeName1 && m.nucleotideIndex === row.nucleotideIndex1);
      if (idx !== -1) {
        if (arr.length === 1) delete bp0[row.nucleotideIndex0]; else arr.splice(idx, 1);
      }
    }
    const bp1 = complex.basePairs[row.rnaMoleculeName1];
    if (bp1 && row.nucleotideIndex1 in bp1) {
      const arr = bp1[row.nucleotideIndex1];
      const idx = arr.findIndex(m => m.rnaMoleculeName === row.rnaMoleculeName0 && m.nucleotideIndex === row.nucleotideIndex0);
      if (idx !== -1) {
        if (arr.length === 1) delete bp1[row.nucleotideIndex1]; else arr.splice(idx, 1);
      }
    }

    const [keys0, keys1] = [
      { rnaMoleculeName: row.rnaMoleculeName0, nucleotideIndex: row.nucleotideIndex0 },
      { rnaMoleculeName: row.rnaMoleculeName1, nucleotideIndex: row.nucleotideIndex1 },
    ].sort(compareBasePairKeys);
    setBasePairKeysToEdit({
      [row.rnaComplexIndex]: {
        add: [],
        delete: [{ keys0, keys1 }],
      }
    });
  }

  function addBasePair() {
    const form = addForm;
    if (form.rnaComplexIndex == null) return;
    const complex = rnaComplexProps[form.rnaComplexIndex];
    if (!complex) return;
    // Auto-resolve molecules by formatted index
    const mol0 = resolveMoleculeByFormattedIndex(form.rnaComplexIndex, form.formattedNucleotideIndex0 ?? NaN) ?? Object.keys(complex.rnaMoleculeProps)[0];
    const mol1 = resolveMoleculeByFormattedIndex(form.rnaComplexIndex, form.formattedNucleotideIndex1 ?? NaN) ?? Object.keys(complex.rnaMoleculeProps)[0];
    const mp0 = complex.rnaMoleculeProps[mol0 as string];
    const mp1 = complex.rnaMoleculeProps[mol1 as string];
    if (!mp0 || !mp1) return;
    if (form.formattedNucleotideIndex0 == null || form.formattedNucleotideIndex1 == null) return;
    const idx0 = form.formattedNucleotideIndex0 - mp0.firstNucleotideIndex;
    const idx1 = form.formattedNucleotideIndex1 - mp1.firstNucleotideIndex;
    if (!(idx0 in mp0.nucleotideProps) || !(idx1 in mp1.nucleotideProps)) return;
    const newType = form.typeBase === 'custom' ? assembleDirectedType(form.orientation, form.edgeA, form.edgeB)
                   : form.typeBase === 'canonical' ? _BasePair.Type.CANONICAL
                   : form.typeBase === 'wobble' ? _BasePair.Type.WOBBLE
                   : form.typeBase === 'mismatch' ? _BasePair.Type.MISMATCH
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
      [form.rnaComplexIndex]: { add: [{ keys0, keys1 }], delete: [] }
    });
    setShowAdd(false);
    setAddForm({ typeBase: 'auto' });
  }

  function beginEdit(row: Row) {
    setEditRowKey(`${row.rnaComplexIndex}:${row.rnaMoleculeName0}:${row.nucleotideIndex0}:${row.rnaMoleculeName1}:${row.nucleotideIndex1}`);
    const complex = rnaComplexProps[row.rnaComplexIndex];
    const mp0 = complex.rnaMoleculeProps[row.rnaMoleculeName0];
    const mp1 = complex.rnaMoleculeProps[row.rnaMoleculeName1];
    const pd = parseDirectedType(row.type);
    setEditForm({
      rnaComplexIndex: row.rnaComplexIndex,
      rnaMoleculeName0: row.rnaMoleculeName0,
      formattedNucleotideIndex0: row.nucleotideIndex0 + mp0.firstNucleotideIndex,
      rnaMoleculeName1: row.rnaMoleculeName1,
      formattedNucleotideIndex1: row.nucleotideIndex1 + mp1.firstNucleotideIndex,
      typeBase: decomposeTypeBase(row.type),
      orientation: pd.orientation,
      edgeA: pd.edgeA,
      edgeB: pd.edgeB,
    });
  }

  function saveEdit(row: Row) {
    const form = editForm;
    if (form.rnaComplexIndex == null || !form.rnaMoleculeName0 || !form.rnaMoleculeName1 || form.formattedNucleotideIndex0 == null || form.formattedNucleotideIndex1 == null) return;
    // Re-resolve molecules by edited formatted indices
    const fallbackMol0 = form.rnaMoleculeName0 as string;
    const fallbackMol1 = form.rnaMoleculeName1 as string;
    const resolvedMol0 = (resolveMoleculeByFormattedIndex(form.rnaComplexIndex, form.formattedNucleotideIndex0) ?? fallbackMol0) as string;
    const resolvedMol1 = (resolveMoleculeByFormattedIndex(form.rnaComplexIndex, form.formattedNucleotideIndex1) ?? fallbackMol1) as string;
    const complex = rnaComplexProps[form.rnaComplexIndex];
    const mp0 = complex.rnaMoleculeProps[resolvedMol0 as string];
    const mp1 = complex.rnaMoleculeProps[resolvedMol1 as string];
    const newIdx0 = form.formattedNucleotideIndex0 - mp0.firstNucleotideIndex;
    const newIdx1 = form.formattedNucleotideIndex1 - mp1.firstNucleotideIndex;
    if (!(newIdx0 in mp0.nucleotideProps) || !(newIdx1 in mp1.nucleotideProps)) return;
    pushToUndoStack();
    // delete old
    const oldC = rnaComplexProps[row.rnaComplexIndex];
    const bp0 = oldC.basePairs[row.rnaMoleculeName0];
    if (bp0 && row.nucleotideIndex0 in bp0) {
      const arr = bp0[row.nucleotideIndex0];
      const idx = arr.findIndex(m => m.rnaMoleculeName === row.rnaMoleculeName1 && m.nucleotideIndex === row.nucleotideIndex1);
      if (idx !== -1) { if (arr.length === 1) delete bp0[row.nucleotideIndex0]; else arr.splice(idx, 1); }
    }
    const bp1 = oldC.basePairs[row.rnaMoleculeName1];
    if (bp1 && row.nucleotideIndex1 in bp1) {
      const arr = bp1[row.nucleotideIndex1];
      const idx = arr.findIndex(m => m.rnaMoleculeName === row.rnaMoleculeName0 && m.nucleotideIndex === row.nucleotideIndex0);
      if (idx !== -1) { if (arr.length === 1) delete bp1[row.nucleotideIndex1]; else arr.splice(idx, 1); }
    }
    // add new with possibly updated type
    let newType: _BasePair.Type | undefined = undefined;
    if (form.typeBase === 'custom') newType = assembleDirectedType(form.orientation, form.edgeA, form.edgeB);
    else if (form.typeBase === 'canonical') newType = _BasePair.Type.CANONICAL;
    else if (form.typeBase === 'wobble') newType = _BasePair.Type.WOBBLE;
    else if (form.typeBase === 'mismatch') newType = _BasePair.Type.MISMATCH;
    insertBasePair(oldC, resolvedMol0, newIdx0, resolvedMol1, newIdx1, DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING, { basePairType: newType });
    const sortedOld = [
      { rnaMoleculeName: row.rnaMoleculeName0, nucleotideIndex: row.nucleotideIndex0 },
      { rnaMoleculeName: row.rnaMoleculeName1, nucleotideIndex: row.nucleotideIndex1 },
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
      [row.rnaComplexIndex]: { add: [{ keys0: newKeys0, keys1: newKeys1 }], delete: [{ keys0: oldKeys0, keys1: oldKeys1 }] }
    });
    setEditRowKey(null);
  }

  function updateRowIndices(row: Row, newFormatted0?: number, newFormatted1?: number) {
    // Only nt1 and nt2 are mandatory; update whichever was edited.
    const complex = rnaComplexProps[row.rnaComplexIndex];
    if (!complex) return;
    const mp0 = complex.rnaMoleculeProps[row.rnaMoleculeName0];
    const mp1 = complex.rnaMoleculeProps[row.rnaMoleculeName1];
    let idx0 = row.nucleotideIndex0;
    let idx1 = row.nucleotideIndex1;
    if (newFormatted0 != null) {
      const candidate = newFormatted0 - mp0.firstNucleotideIndex;
      if (candidate in mp0.nucleotideProps) idx0 = candidate; else return;
    }
    if (newFormatted1 != null) {
      const candidate = newFormatted1 - mp1.firstNucleotideIndex;
      if (candidate in mp1.nucleotideProps) idx1 = candidate; else return;
    }
    if (idx0 === row.nucleotideIndex0 && idx1 === row.nucleotideIndex1) return;
    pushToUndoStack();
    // remove existing mapping
    const bp0 = complex.basePairs[row.rnaMoleculeName0];
    if (bp0 && row.nucleotideIndex0 in bp0) {
      const arr = bp0[row.nucleotideIndex0];
      const i = arr.findIndex(m => m.rnaMoleculeName === row.rnaMoleculeName1 && m.nucleotideIndex === row.nucleotideIndex1);
      if (i !== -1) { if (arr.length === 1) delete bp0[row.nucleotideIndex0]; else arr.splice(i, 1); }
    }
    const bp1 = complex.basePairs[row.rnaMoleculeName1];
    if (bp1 && row.nucleotideIndex1 in bp1) {
      const arr = bp1[row.nucleotideIndex1];
      const i = arr.findIndex(m => m.rnaMoleculeName === row.rnaMoleculeName0 && m.nucleotideIndex === row.nucleotideIndex0);
      if (i !== -1) { if (arr.length === 1) delete bp1[row.nucleotideIndex1]; else arr.splice(i, 1); }
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
      { rnaMoleculeName: row.rnaMoleculeName0, nucleotideIndex: row.nucleotideIndex0 },
      { rnaMoleculeName: row.rnaMoleculeName1, nucleotideIndex: row.nucleotideIndex1 },
    ].sort(compareBasePairKeys);
    const [newKeys0, newKeys1] = [
      { rnaMoleculeName: row.rnaMoleculeName0, nucleotideIndex: idx0 },
      { rnaMoleculeName: row.rnaMoleculeName1, nucleotideIndex: idx1 },
    ].sort(compareBasePairKeys);
    setBasePairKeysToEdit({
      [row.rnaComplexIndex]: { add: [{ keys0: newKeys0, keys1: newKeys1 }], delete: [{ keys0: oldKeys0, keys1: oldKeys1 }] }
    });
  }

  function displayOrientation(row: Row): string {
    const { orientation } = parseDirectedType(row.type);
    if (orientation) return orientation;
    // If not custom, derive meaningful default
    const base = decomposeTypeBase(row.type);
    if (base === 'canonical') return 'cis';
    if (base === 'wobble') return 'cis';
    if (base === 'mismatch') return 'cis';
    if (base === 'auto') return 'auto';
    return 'cis';
  }
  function displayEdgeA(row: Row): string {
    const { edgeA } = parseDirectedType(row.type);
    if (edgeA) return edgeA;
    const base = decomposeTypeBase(row.type);
    return base === 'auto' ? 'auto' : base === 'canonical' ? 'watson_crick' : base === 'wobble' ? 'watson_crick' : 'unknown';
  }
  function displayEdgeB(row: Row): string {
    const { edgeB } = parseDirectedType(row.type);
    if (edgeB) return edgeB;
    const base = decomposeTypeBase(row.type);
    return base === 'auto' ? 'auto' : base === 'canonical' ? 'watson_crick' : base === 'wobble' ? 'hoogsteen' : 'unknown';
  }

  return (
    <div
      ref={sheetRef}
      style={{
        position: 'fixed',
        left: 420,
        right: 0,
        bottom: 0,
        height: open ? height : 0,
        transform: open ? 'translateY(0)' : 'translateY(100%)',
        transition: 'transform 0.3s ease, height 0.3s ease',
        background: '#ffffff',
        boxShadow: '0 -8px 24px rgba(0,0,0,0.12)',
        borderTop: '1px solid #e2e8f0',
        zIndex: 2100,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={(e) => { setIsResizing(true); startYRef.current = e.clientY; startHRef.current = height; }}
        style={{ height: 10, cursor: 'ns-resize', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
      >
        <div style={{ width: 48, height: 4, borderRadius: 2, background: '#cbd5e1' }} />
      </div>

      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 13, color: '#0f172a', letterSpacing: 0.3 }}>Base-Pair Editor</span>
          <div style={{ display: 'flex', gap: 6, background: '#f1f5f9', padding: '4px', borderRadius: 8 }}>
            {(['Global','Selected'] as const).map(t => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                style={{
                  padding: '6px 10px',
                  borderRadius: 6,
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 600,
                  background: activeTab === t ? '#ffffff' : 'transparent',
                  color: '#0f172a',
                  boxShadow: activeTab === t ? '0 1px 2px rgba(16,24,40,0.06)' : 'none',
                  cursor: 'pointer'
                }}
              >{t}</button>
            ))}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {/* Stylized Reformat button (note: behavior delegated to existing editor elsewhere) */}
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('triggerReformatAll'))}
            title="Re-format all base pairs"
            style={{
              padding: '8px 12px',
              borderRadius: 8,
              border: '1px solid #4338ca',
              background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
              color: '#ffffff',
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 0.3,
              cursor: 'pointer'
            }}
          >Re-format all</button>
          <button onClick={onClose} style={{ border: 'none', background: 'transparent', fontSize: 16, color: '#334155', cursor: 'pointer' }}>✕</button>
        </div>
      </div>

      {/* Table and controls */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '8px 12px', gap: 8 }}>
          <button
            onClick={() => setShowAdd(!showAdd)}
            style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', fontSize: 12, fontWeight: 600, color: '#0f172a' }}
          >{showAdd ? 'Close Add' : 'Add Base Pair'}</button>
        </div>
        {showAdd && (
          <div style={{ padding: '8px 12px', display: 'flex', alignItems: 'center', borderTop: '1px dashed #e2e8f0', borderBottom: '1px dashed #e2e8f0' }}>
            {/* Complex selector */}
            <select
              value={addForm.rnaComplexIndex ?? ''}
              onChange={(e) => setAddForm(f => ({ ...f, rnaComplexIndex: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
              style={{ ...sel(), marginRight: 8 }}
            >
              <option value="" hidden>complex</option>
              {Object.entries(rnaComplexProps).map(([k, c]) => <option key={k} value={k}>{c.name}</option>)}
            </select>

            {/* Mol #1 (index) compressed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 180, marginRight: 8 }}>
              {(() => {
                const rc = addForm.rnaComplexIndex;
                const idx = addForm.formattedNucleotideIndex0;
                let initial = 'UNK';
                if (rc != null && idx != null) {
                  const mol = resolveMoleculeByFormattedIndex(rc, idx);
                  if (mol) {
                    const sym = getSymbolByFormattedIndex(rc, mol, idx);
                    initial = sym === 'UNK' ? 'UNK' : sym[0].toUpperCase();
                  }
                }
                return <span title={initial} style={{ fontWeight: 700 }}>{initial}</span>;
              })()}
              <input
                type="number"
                placeholder="nt #1"
                value={addForm.formattedNucleotideIndex0 ?? ''}
                onChange={(e) => setAddForm(f => ({ ...f, formattedNucleotideIndex0: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                style={inpCell()}
              />
            </div>

            {/* Mol #2 (index) compressed */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 180, marginRight: 8 }}>
              {(() => {
                const rc = addForm.rnaComplexIndex;
                const idx = addForm.formattedNucleotideIndex1;
                let initial = 'UNK';
                if (rc != null && idx != null) {
                  const mol = resolveMoleculeByFormattedIndex(rc, idx);
                  if (mol) {
                    const sym = getSymbolByFormattedIndex(rc, mol, idx);
                    initial = sym === 'UNK' ? 'UNK' : sym[0].toUpperCase();
                  }
                }
                return <span title={initial} style={{ fontWeight: 700 }}>{initial}</span>;
              })()}
              <input
                type="number"
                placeholder="nt #2"
                value={addForm.formattedNucleotideIndex1 ?? ''}
                onChange={(e) => setAddForm(f => ({ ...f, formattedNucleotideIndex1: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                style={inpCell()}
              />
            </div>

            {/* Type and custom sub-fields */}
            <select value={addForm.typeBase} onChange={(e) => setAddForm(f => ({ ...f, typeBase: e.target.value as TypeBase }))} style={{ ...sel(true), marginRight: 8 }}>
              <option value={'auto'}>auto</option>
              <option value={'canonical'}>canonical</option>
              <option value={'wobble'}>wobble</option>
              <option value={'mismatch'}>mismatch</option>
              <option value={'custom'}>custom</option>
            </select>
            <select value={addForm.orientation ?? ''} disabled={addForm.typeBase !== 'custom'} onChange={(e) => setAddForm(f => ({ ...f, orientation: e.target.value as Orientation }))} style={{ ...sel(addForm.typeBase === 'custom'), marginRight: 8 }}>
              <option value="" hidden>orientation (auto)</option>
              <option value={'cis'}>cis</option>
              <option value={'trans'}>trans</option>
            </select>
            <select value={addForm.edgeA ?? ''} disabled={addForm.typeBase !== 'custom'} onChange={(e) => setAddForm(f => ({ ...f, edgeA: e.target.value as Edge }))} style={{ ...sel(addForm.typeBase === 'custom'), marginRight: 8 }}>
              <option value="" hidden>edge A (auto)</option>
              <option value={'watson_crick'}>watson_crick</option>
              <option value={'hoogsteen'}>hoogsteen</option>
              <option value={'sugar_edge'}>sugar_edge</option>
            </select>
            <select value={addForm.edgeB ?? ''} disabled={addForm.typeBase !== 'custom'} onChange={(e) => setAddForm(f => ({ ...f, edgeB: e.target.value as Edge }))} style={{ ...sel(addForm.typeBase === 'custom'), marginRight: 8 }}>
              <option value="" hidden>edge B (auto)</option>
              <option value={'watson_crick'}>watson_crick</option>
              <option value={'hoogsteen'}>hoogsteen</option>
              <option value={'sugar_edge'}>sugar_edge</option>
            </select>
            <button onClick={addBasePair} style={{ padding: '6px 10px', borderRadius: 8, border: '1px solid #e2e8f0', background: '#ffffff', fontSize: 12, fontWeight: 700, color: '#0f172a' }}>Add</button>
          </div>
        )}
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0', color: '#334155' }}>
              <th style={thStyle(120)}>Complex</th>
              <th style={thStyle(180)}>Mol #1 (index)</th>
              <th style={thStyle(180)}>Mol #2 (index)</th>
              <th style={thStyle(120)}>Type</th>
              <th style={thStyle(100)}>Orientation</th>
              <th style={thStyle(130)}>Edge A</th>
              <th style={thStyle(130)}>Edge B</th>
              <th style={thStyle(70)}>Action</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const rowKey = `${r.rnaComplexIndex}:${r.rnaMoleculeName0}:${r.nucleotideIndex0}:${r.rnaMoleculeName1}:${r.nucleotideIndex1}`;
              const isEditing = editRowKey === rowKey;
              const base = isEditing ? (editForm.typeBase ?? decomposeTypeBase(r.type)) : decomposeTypeBase(r.type);
              const pd = parseDirectedType(r.type);
              const efOrientation = isEditing ? (editForm.orientation ?? (pd.orientation ?? (base === 'auto' ? undefined : 'cis'))) : undefined;
              const efEdgeA = isEditing ? (editForm.edgeA ?? undefined) : undefined;
              const efEdgeB = isEditing ? (editForm.edgeB ?? undefined) : undefined;
              return (
              <tr key={`${rowKey}:${i}`} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? '#ffffff' : '#fbfcfe' }}>
                <td style={tdStyle(120)}>{r.rnaComplexName}</td>
                {/* Mol #1 (index) */}
                <td style={tdStyle(180)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const symbol = getSymbolByFormattedIndex(r.rnaComplexIndex, r.rnaMoleculeName0, isEditing ? (editForm.formattedNucleotideIndex0 ?? r.formattedNucleotideIndex0) : r.formattedNucleotideIndex0);
                      const initial = symbol === 'UNK' ? 'UNK' : symbol[0].toUpperCase();
                      return <span title={`${r.rnaMoleculeName0} (${symbol})`} style={{ fontWeight: 700 }}>{initial}</span>;
                    })()}
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.formattedNucleotideIndex0 ?? r.formattedNucleotideIndex0}
                        onChange={(e) => setEditForm(f => ({ ...f, formattedNucleotideIndex0: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                        style={inpCell()}
                      />
                    ) : (
                      <span>{r.formattedNucleotideIndex0}</span>
                    )}
                  </div>
                </td>
                {/* Mol #2 (index) */}
                <td style={tdStyle(180)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    {(() => {
                      const symbol = getSymbolByFormattedIndex(r.rnaComplexIndex, r.rnaMoleculeName1, isEditing ? (editForm.formattedNucleotideIndex1 ?? r.formattedNucleotideIndex1) : r.formattedNucleotideIndex1);
                      const initial = symbol === 'UNK' ? 'UNK' : symbol[0].toUpperCase();
                      return <span title={`${r.rnaMoleculeName1} (${symbol})`} style={{ fontWeight: 700 }}>{initial}</span>;
                    })()}
                    {isEditing ? (
                      <input
                        type="number"
                        value={editForm.formattedNucleotideIndex1 ?? r.formattedNucleotideIndex1}
                        onChange={(e) => setEditForm(f => ({ ...f, formattedNucleotideIndex1: e.target.value === '' ? undefined : parseInt(e.target.value) }))}
                        style={inpCell()}
                      />
                    ) : (
                      <span>{r.formattedNucleotideIndex1}</span>
                    )}
                  </div>
                </td>
                {/* Type base */}
                <td style={tdStyle(120)}>
                  {isEditing ? (
                    <select
                      value={base}
                      onChange={(e) => {
                        const next = e.target.value as TypeBase;
                        if (next === 'custom') {
                          const parsed = parseDirectedType(r.type);
                          const baseFromRow = decomposeTypeBase(r.type);
                          const seededOrientation: Orientation = (editForm.orientation ?? parsed.orientation ?? 'cis');
                          const seededEdgeA: Edge = (editForm.edgeA ?? parsed.edgeA ?? 'watson_crick');
                          const seededEdgeB: Edge = (editForm.edgeB ?? parsed.edgeB ?? (baseFromRow === 'wobble' ? 'hoogsteen' : 'watson_crick'));
                          setEditForm(f => ({ ...f, typeBase: next, orientation: seededOrientation, edgeA: seededEdgeA, edgeB: seededEdgeB }));
                        } else {
                          setEditForm(f => ({ ...f, typeBase: next }));
                        }
                      }}
                      style={sel(true)}
                    >
                      <option value={'auto'}>auto</option>
                      <option value={'canonical'}>canonical</option>
                      <option value={'wobble'}>wobble</option>
                      <option value={'mismatch'}>mismatch</option>
                      <option value={'custom'}>custom</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: '#0f172a' }}>{decomposeTypeBase(r.type)}</span>
                  )}
                </td>
                {/* Orientation */}
                <td style={tdStyle(100)}>
                  {isEditing && base === 'custom' ? (
                    <select
                      value={efOrientation ?? ''}
                      onChange={(e) => setEditForm(f => ({ ...f, orientation: (e.target.value as Orientation) || undefined }))}
                      style={sel(true)}
                    >
                      <option value="" hidden>—</option>
                      <option value={'cis'}>cis</option>
                      <option value={'trans'}>trans</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: '#0f172a' }}>{displayOrientation(r)}</span>
                  )}
                </td>
                {/* Edge A */}
                <td style={tdStyle(130)}>
                  {isEditing && base === 'custom' ? (
                    <select
                      value={efEdgeA ?? ''}
                      onChange={(e) => setEditForm(f => ({ ...f, edgeA: (e.target.value as Edge) || undefined }))}
                      style={sel(true)}
                    >
                      <option value="" hidden>—</option>
                      <option value={'watson_crick'}>watson_crick</option>
                      <option value={'hoogsteen'}>hoogsteen</option>
                      <option value={'sugar_edge'}>sugar_edge</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: '#0f172a' }}>{displayEdgeA(r)}</span>
                  )}
                </td>
                {/* Edge B */}
                <td style={tdStyle(130)}>
                  {isEditing && base === 'custom' ? (
                    <select
                      value={efEdgeB ?? ''}
                      onChange={(e) => setEditForm(f => ({ ...f, edgeB: (e.target.value as Edge) || undefined }))}
                      style={sel(true)}
                    >
                      <option value="" hidden>—</option>
                      <option value={'watson_crick'}>watson_crick</option>
                      <option value={'hoogsteen'}>hoogsteen</option>
                      <option value={'sugar_edge'}>sugar_edge</option>
                    </select>
                  ) : (
                    <span style={{ fontSize: 12, color: '#0f172a' }}>{displayEdgeB(r)}</span>
                  )}
                </td>
                {/* Action */}
                <td style={{ ...tdStyle(70), textAlign: 'center' }}>
                  {isEditing ? (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                      <IconButton title="Save" onClick={() => saveEdit(r)} kind="save" />
                      <IconButton title="Cancel" onClick={() => setEditRowKey(null)} kind="cancel" />
                    </div>
                  ) : (
                    <div style={{ display: 'flex', justifyContent: 'center', gap: 6 }}>
                      <IconButton title="Edit" onClick={() => beginEdit(r)} kind="edit" />
                      <IconButton title="Delete" onClick={() => deleteRow(r)} kind="delete" />
                    </div>
                  )}
                </td>
              </tr>
            );})}
            {rows.length === 0 && (
              <tr>
                <td colSpan={10} style={{ padding: 16, textAlign: 'center', color: '#64748b' }}>
                  {activeTab === 'Selected' ? 'No left-click selection yet.' : 'No base pairs to display.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

function thStyle(width: number): React.CSSProperties {
  return {
    position: 'sticky',
    top: 0,
    zIndex: 1,
    textAlign: 'left',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
    padding: '10px 12px',
    minWidth: width,
    maxWidth: width,
    whiteSpace: 'nowrap'
  };
}

function tdStyle(width: number): React.CSSProperties {
  return {
    padding: '8px 12px',
    minWidth: width,
    maxWidth: width,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: 12,
    color: '#0f172a'
  };
}

function sel(enabled: boolean = true): React.CSSProperties {
  return {
    width: 130,
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 12,
    background: '#ffffff',
    color: '#0f172a',
    opacity: enabled ? 1 : 0.6
  };
}

function inp(): React.CSSProperties {
  return {
    width: 100,
    padding: '6px 8px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 12,
    color: '#0f172a',
    background: '#ffffff'
  };
}

function btn(): React.CSSProperties {
  return {
    padding: '6px 10px',
    borderRadius: 8,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    fontSize: 12,
    fontWeight: 600,
    color: '#0f172a',
    cursor: 'pointer'
  };
}

function inpCell(): React.CSSProperties {
  return {
    width: '100%',
    padding: '4px 6px',
    border: '1px solid #e2e8f0',
    borderRadius: 6,
    fontSize: 12,
    color: '#0f172a',
    background: '#ffffff'
  };
}

function btnSmall(): React.CSSProperties {
  return {
    padding: '4px 8px',
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    fontSize: 12,
    fontWeight: 600,
    color: '#0f172a',
    cursor: 'pointer'
  };
}

export default BasePairBottomSheet;

function IconButton(props: { title?: string; onClick?: () => void; kind: 'edit' | 'delete' | 'save' | 'cancel' }) {
  const { title, onClick, kind } = props;
  const base: React.CSSProperties = {
    width: 28,
    height: 28,
    borderRadius: 6,
    border: '1px solid #e2e8f0',
    background: '#ffffff',
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center'
  };
  let glyph = '✎';
  if (kind === 'delete') glyph = '🗑';
  if (kind === 'save') glyph = '✔';
  if (kind === 'cancel') glyph = '✕';
  return (
    <button title={title} onClick={onClick} style={base}>
      <span style={{ fontSize: 12 }}>{glyph}</span>
    </button>
  );
}


