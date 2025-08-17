import React, { useEffect, useMemo, useRef, useState, useContext } from 'react';
import { RnaComplexProps } from '../../../App';
import { BasePair as _BasePair } from '../../app_specific/BasePair';
import { RnaComplex, insertBasePair, DuplicateBasePairKeysHandler, compareBasePairKeys } from '../../app_specific/RnaComplex';
import { Context } from '../../../context/Context';
import Color, { fromCssString as parseColorCss, HandleUndefined } from '../../../data_structures/Color';
import { useTheme } from '../../../context/ThemeContext';

type Level = 'command' | 'success' | 'error' | 'warning' | 'info';

type HistoryLine = { ts: Date; level: Level; text: string };

type ParsedCommand =
  | { kind: 'add' | 'delete' | 'edit'; nt1: number; nt2: number; complexName?: string; bpType?: string; subtype?: string; length: number; safe: boolean }
  | { kind: 'reformat'; start?: number; end?: number };

export interface CommandTerminalProps {
  rnaComplexProps: RnaComplexProps;
}

export const CommandTerminal: React.FC<CommandTerminalProps> = ({ rnaComplexProps }) => {
  const [visible, setVisible] = useState<boolean>(false);
  const [input, setInput] = useState<string>('');
  const [history, setHistory] = useState<HistoryLine[]>([]);
  const [navIdx, setNavIdx] = useState<number>(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const setBasePairKeysToEdit = useContext(Context.BasePair.SetKeysToEdit);
  const setNucleotideKeysToRerender = useContext(Context.Nucleotide.SetKeysToRerender);
  const pushToUndoStack = useContext(Context.App.PushToUndoStack);
  const { theme } = useTheme();

  const commandNames = useMemo(() => ['add', 'delete', 'edit', 'reformat', 'color'], []);

  type SignatureDoc = { signature: string; lines: string[] } | null;

  const signatureDoc: SignatureDoc = useMemo(() => {
    const t = input.trim();
    const m = /^([a-zA-Z_][a-zA-Z0-9_]*)\s*\(?/.exec(t);
    if (!m) return null;
    const name = m[1].toLowerCase();
    switch (name) {
      case 'add':
        return {
          signature: 'add(nt1_index:int, nt2_index:int, complex:str?, bp_type:str=auto, subtype:str?, length:int=±n, safe:bool=True)',
          lines: [
            'nt1_index: required integer (formatted index)',
            'nt2_index: required integer (formatted index)',
            'complex: optional string; required in multi-complex scenes',
            "bp_type: 'auto'|'canonical'|'wobble'|'mismatch' (ignored if subtype provided)",
            "subtype: optional custom directed type like cWW/tHS",
            'length: positive → nt1++, nt2--; negative → nt1--, nt2++ (default 1)',
            'safe: boolean (default True); True=error on duplicates, False=warn and add'
          ]
        };
      case 'delete':
        return {
          signature: 'delete(nt1_index:int, nt2_index:int, complex:str?, length:int=±n, safe:bool=True)',
          lines: [
            'nt1_index, nt2_index: required integers',
            'complex: optional string; required in multi-complex scenes',
            'length: positive → nt1++, nt2--; negative → nt1--, nt2++',
            'safe: boolean (default True); True=error if not found, False=warn and skip'
          ]
        };
      case 'edit':
        return {
          signature: 'edit(nt1_index:int, nt2_index:int, complex:str?, bp_type:str, subtype:str?, length:int=±n, safe:bool=True)',
          lines: [
            'Requires bp_type or subtype',
            'length: positive → nt1++, nt2--; negative → nt1--, nt2++',
            'safe: True=error if not found, False=warn and create'
          ]
        };
      case 'reformat':
        return {
          signature: 'reformat(start:int?, end:int?)',
          lines: [
            'If both omitted: full reformat',
            'If provided: repositions nucleotides only within [start, end]'
          ]
        };
      case 'color':
        return {
          signature: "color(target:int|string, color_value:string)",
          lines: [
            "target: 'start-end' for a range, or single index; multiple segments separated by ';'",
            "color_value: CSS color name or hex (e.g., 'red', '#FF0000')"
          ]
        };
      default:
        return null;
    }
  }, [input]);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code === 'Backquote') {
        e.preventDefault();
        setVisible(v => !v);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (visible) {
      // Focus input when visible
      setTimeout(() => inputRef.current?.focus(), 0);
    }
  }, [visible]);

  useEffect(() => {
    // Auto scroll to bottom on new output
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight });
  }, [history.length]);

  function ts(): string {
    const d = new Date();
    const p = (n: number) => n.toString().padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }

  function append(level: Level, text: string) {
    setHistory(h => [...h, { ts: new Date(), level, text }]);
  }

  function complexIndexByName(name?: string): number | undefined {
    if (name) {
      for (const [idxStr, c] of Object.entries(rnaComplexProps)) {
        if (c.name.toLowerCase() === name.toLowerCase()) return parseInt(idxStr);
      }
      return undefined;
    }
    const keys = Object.keys(rnaComplexProps);
    if (keys.length === 1) return parseInt(keys[0]);
    return undefined; // ambiguous
  }

  function resolveMoleculeByFormattedIndex(rnaComplexIndex: number, formattedIndex: number): string | undefined {
    const complex = rnaComplexProps[rnaComplexIndex];
    if (!complex) return undefined;
    for (const [molName, mp] of Object.entries(complex.rnaMoleculeProps)) {
      const idx = formattedIndex - mp.firstNucleotideIndex;
      if (idx in mp.nucleotideProps) return molName;
    }
    return undefined;
  }

  function hasBasePair(complex: RnaComplex.ExternalProps, mol0: string, idx0: number, mol1: string, idx1: number): boolean {
    const arr = complex.basePairs[mol0]?.[idx0];
    if (!arr) return false;
    return !!arr.find(m => m.rnaMoleculeName === mol1 && m.nucleotideIndex === idx1);
  }

  function typeFrom(bpType?: string, subtype?: string): _BasePair.Type | undefined | 'custom_error' {
    if (subtype) {
      const parsed = parseSubtype(subtype);
      if (!parsed) return 'custom_error';
      const { orientation, edgeA, edgeB } = parsed;
      return `${orientation}_${edgeA}_${edgeB}` as _BasePair.Type;
    }
    switch ((bpType || 'auto').toLowerCase()) {
      case 'auto': return undefined;
      case 'canonical': return _BasePair.Type.CANONICAL;
      case 'wobble': return _BasePair.Type.WOBBLE;
      case 'mismatch': return _BasePair.Type.MISMATCH;
      case 'custom': return 'custom_error'; // needs subtype
      default: return 'custom_error';
    }
  }

  function parseSubtype(s: string): { orientation: 'cis' | 'trans'; edgeA: 'watson_crick' | 'hoogsteen' | 'sugar_edge'; edgeB: 'watson_crick' | 'hoogsteen' | 'sugar_edge' } | null {
    // Expect forms like cWW, tHS, cSH
    if (!/^[ct][WHS]{2}$/.test(s)) return null;
    const o = s[0] === 'c' ? 'cis' as const : 'trans' as const;
    const map: Record<string, 'watson_crick' | 'hoogsteen' | 'sugar_edge'> = { W: 'watson_crick', H: 'hoogsteen', S: 'sugar_edge' };
    const eA = map[s[1]];
    const eB = map[s[2]];
    return { orientation: o, edgeA: eA, edgeB: eB };
  }

  function stripQuotes(s: string): string { return s.replace(/^['"]|['"]$/g, ''); }

  function parse(input: string): ParsedCommand | { error: string } | { kind: 'color'; target: string; color: string } {
    const trimmed = input.trim();
    const m = /^([a-zA-Z_][a-zA-Z0-9_]*)\((.*)\)$/.exec(trimmed);
    if (!m) return { error: 'Syntax error: commands must be in form name(arg1, ..., key=value, ...)' };
    const name = m[1];
    const inner = m[2].trim();
    // Split by commas (no nested args expected)
    const parts = inner.length ? inner.split(',').map(s => s.trim()).filter(s => s.length > 0) : [];
    const positionals: string[] = [];
    const named: Record<string, string> = {};
    for (const p of parts) {
      const eq = p.indexOf('=');
      if (eq === -1) positionals.push(p);
      else {
        const k = p.slice(0, eq).trim();
        const v = p.slice(eq + 1).trim();
        if (!k) return { error: 'Syntax error: empty parameter name' };
        named[k] = stripQuotes(v);
      }
    }
    const low = name.toLowerCase();
    if (low === 'reformat') {
      const start = named.start !== undefined ? parseInt(named.start) : undefined;
      const end = named.end !== undefined ? parseInt(named.end) : undefined;
      if ((named.start !== undefined && Number.isNaN(start!)) || (named.end !== undefined && Number.isNaN(end!))) {
        return { error: 'Type error: reformat parameters start/end must be integers' };
      }
      return { kind: 'reformat', start, end };
    }
    if (low === 'color') {
      if (positionals.length !== 2) return { error: 'Syntax error: color(target, color_value)' };
      return { kind: 'color', target: stripQuotes(positionals[0]), color: stripQuotes(positionals[1]) };
    }
    if (low !== 'add' && low !== 'delete' && low !== 'edit') return { error: `Unknown command: ${name}` };
    if (positionals.length < 2) return { error: 'Syntax error: first two positional arguments must be nt1_index, nt2_index' };
    if (positionals.length > 2) return { error: 'Syntax error: too many positional arguments' };
    const nt1 = parseInt(positionals[0]);
    const nt2 = parseInt(positionals[1]);
    if (Number.isNaN(nt1) || Number.isNaN(nt2)) return { error: 'Type error: nt1_index and nt2_index must be integers' };
    const complexName = named.complex;
    const bpType = named.bp_type;
    const subtype = named.subtype;
    const length = named.length !== undefined ? parseInt(named.length) : 1;
    if (Number.isNaN(length) || length === 0) return { error: 'Type error: length must be a non-zero integer' };
    const safe = named.safe !== undefined ? (named.safe.toLowerCase() === 'true' ? true : named.safe.toLowerCase() === 'false' ? false : (() => { throw new Error('Type error: safe must be true or false'); })()) : true;
    return { kind: low as any, nt1, nt2, complexName, bpType, subtype, length, safe };
  }

  function onSubmit() {
    const raw = input;
    if (!raw.trim()) return;
    append('command', `> ${raw}`);
    setNavIdx(-1);
    try {
      const p = parse(raw);
      if ((p as any).error) {
        append('error', (p as any).error);
      } else {
        execute(p as any);
      }
    } catch (e: any) {
      append('error', e?.message ?? String(e));
    } finally {
      setInput('');
    }
  }

  function execute(cmd: ParsedCommand | { kind: 'color'; target: string; color: string }) {
    if (cmd.kind === 'reformat') {
      if (cmd.start === undefined && cmd.end === undefined) {
        window.dispatchEvent(new CustomEvent('triggerReformatAll'));
        append('success', 'Reformat triggered');
      } else {
        const startVal: number | undefined = cmd.start;
        const endVal: number | undefined = cmd.end;
        window.dispatchEvent(new CustomEvent('triggerReformatRange', { detail: { start: startVal, end: endVal } }));
        append('success', `Reformat range ${startVal ?? '-∞'}..${endVal ?? '+∞'} triggered`);
      }
      return;
    }
    // Handle color command separately
    if ((cmd as any).kind === 'color') {
      const rcIndex = complexIndexByName(undefined);
      if (rcIndex === undefined) { append('error', 'Ambiguous complex: specify a single complex in scene to use color()'); return; }
      const complex = rnaComplexProps[rcIndex];
      const { target, color } = (cmd as any) as { kind: 'color'; target: string; color: string };
      try {
        // Parse color
        const parsedColor = parseCssColor(color);
        // Parse target ranges
        const ranges = parseTargetRanges(target);
        pushToUndoStack();
        let appliedCount = 0;
        for (const [molName, mp] of Object.entries(complex.rnaMoleculeProps)) {
          for (const [relIndexStr, nProps] of Object.entries(mp.nucleotideProps as Record<string, any>)) {
            const relIndex = parseInt(relIndexStr);
            const absIndex = relIndex + mp.firstNucleotideIndex; // absolute index
            if (inAnyRange(absIndex, ranges)) {
              // Update primary nucleotide symbol color (text fill)
              (nProps as any).color = parsedColor;
              // Also update label content color if present for consistency
              const lc = (nProps as any).labelContentProps ?? {};
              lc.color = parsedColor;
              (nProps as any).labelContentProps = lc;
              appliedCount++;
            }
          }
        }
        // Nudge nucleotide re-render by dispatching a small SetKeysToRerender
        const rerender: any = {};
        if (appliedCount > 0) {
          for (const [molName, mp] of Object.entries(complex.rnaMoleculeProps)) {
            const hits: number[] = [];
            for (const [relIndexStr] of Object.entries(mp.nucleotideProps as Record<string, any>)) {
              const relIndex = parseInt(relIndexStr);
              const absIndex = relIndex + mp.firstNucleotideIndex;
              if (inAnyRange(absIndex, ranges)) hits.push(relIndex);
            }
            if (hits.length) rerender[molName] = hits;
          }
          setNucleotideKeysToRerender({ [rcIndex]: rerender });
        }
        append('success', `Applied color to ${appliedCount} nucleotide(s)`);
      } catch (e: any) {
        append('error', e?.message ?? String(e));
      }
      return;
    }

    // Resolve complex index (non-color flow)
    const cmdNd = cmd as Extract<ParsedCommand, { kind: 'add' | 'delete' | 'edit' }>;
    const rcIndex = complexIndexByName(cmdNd.complexName);
    if (rcIndex === undefined) {
      if (Object.keys(rnaComplexProps).length > 1 && !cmdNd.complexName) {
        append('error', 'Ambiguous complex: specify complex=[name]');
      } else {
        append('error', `Unknown complex: ${cmdNd.complexName ?? '(unspecified)'}`);
      }
      return;
    }
    const complex = rnaComplexProps[rcIndex];

    // Build target pairs across length
    const dir1: number = cmdNd.length > 0 ? 1 : -1; // nt1 direction
    const dir2: number = -dir1; // nt2 goes opposite
    const count: number = Math.abs(cmdNd.length);
    const pairs: Array<{ idx1: number; idx2: number; mol0: string; mol1: string; i0: number; i1: number } | { error: string }> = [];
    for (let i = 0; i < count; i++) {
      const idx1: number = cmdNd.nt1 + i * dir1;
      const idx2: number = cmdNd.nt2 + i * dir2;
      const mol0 = resolveMoleculeByFormattedIndex(rcIndex, idx1);
      const mol1 = resolveMoleculeByFormattedIndex(rcIndex, idx2);
      if (!mol0 || !mol1) {
        pairs.push({ error: `Out of bounds: (${idx1}, ${idx2})` });
        continue;
      }
      const mp0 = complex.rnaMoleculeProps[mol0];
      const mp1 = complex.rnaMoleculeProps[mol1];
      const i0: number = idx1 - mp0.firstNucleotideIndex;
      const i1: number = idx2 - mp1.firstNucleotideIndex;
      if (!(i0 in mp0.nucleotideProps) || !(i1 in mp1.nucleotideProps)) {
        pairs.push({ error: `Out of bounds: (${idx1}, ${idx2})` });
      } else {
        pairs.push({ idx1, idx2, mol0, mol1, i0, i1 });
      }
    }
    const firstError = pairs.find(p => 'error' in p) as any;
    if (firstError) { append('error', firstError.error); return; }

    // Resolve type if applicable
    let newType: _BasePair.Type | undefined | 'custom_error' = undefined;
    if (cmdNd.kind !== 'delete') {
      newType = typeFrom(cmdNd.bpType, cmdNd.subtype);
      if (newType === 'custom_error') { append('error', 'Invalid type: provide bp_type=[auto|canonical|wobble|mismatch] or subtype like cWW/tHS'); return; }
    }

    // Safety checks
    if (cmdNd.kind === 'add') {
      if (cmdNd.safe) {
        for (const p of pairs as any) {
          if (hasBasePair(complex, p.mol0, p.i0, p.mol1, p.i1)) {
            append('error', `Base pair already exists at (${p.idx1}, ${p.idx2})`);
            return;
          }
        }
      }
      // perform add
      pushToUndoStack();
      const addSignals: Array<{ keys0: RnaComplex.BasePairKeys; keys1: RnaComplex.BasePairKeys }> = [];
      for (const p of pairs as any) {
        const exists = hasBasePair(complex, p.mol0, p.i0, p.mol1, p.i1);
        if (exists && !cmdNd.safe) {
          append('warning', `Duplicate at (${p.idx1}, ${p.idx2}) — adding anyway`);
        }
        insertBasePair(complex, p.mol0, p.i0, p.mol1, p.i1, DuplicateBasePairKeysHandler.DO_NOTHING, { basePairType: newType as _BasePair.Type | undefined });
        const [keys0, keys1] = [
          { rnaMoleculeName: p.mol0, nucleotideIndex: p.i0 },
          { rnaMoleculeName: p.mol1, nucleotideIndex: p.i1 },
        ].sort(compareBasePairKeys);
        addSignals.push({ keys0, keys1 });
      }
      setBasePairKeysToEdit({ [rcIndex]: { add: addSignals, delete: [] } });
      append('success', `Added ${pairs.length} base pair(s)`);
      return;
    }

    if (cmdNd.kind === 'delete') {
      if (cmdNd.safe) {
        for (const p of pairs as any) {
          if (!hasBasePair(complex, p.mol0, p.i0, p.mol1, p.i1)) {
            append('error', `No base pair at (${p.idx1}, ${p.idx2})`);
            return;
          }
        }
      }
      pushToUndoStack();
      const delSignals: Array<{ keys0: RnaComplex.BasePairKeys; keys1: RnaComplex.BasePairKeys }> = [];
      for (const p of pairs as any) {
        const exists = hasBasePair(complex, p.mol0, p.i0, p.mol1, p.i1);
        if (!exists) {
          append('warning', `No base pair at (${p.idx1}, ${p.idx2}) — skipping`);
          continue;
        }
        // remove both directions
        const bp0 = complex.basePairs[p.mol0];
        if (bp0 && p.i0 in bp0) {
          const arr = bp0[p.i0];
          const idx = arr.findIndex(m => m.rnaMoleculeName === p.mol1 && m.nucleotideIndex === p.i1);
          if (idx !== -1) { if (arr.length === 1) delete bp0[p.i0]; else arr.splice(idx, 1); }
        }
        const bp1 = complex.basePairs[p.mol1];
        if (bp1 && p.i1 in bp1) {
          const arr = bp1[p.i1];
          const idx = arr.findIndex(m => m.rnaMoleculeName === p.mol0 && m.nucleotideIndex === p.i0);
          if (idx !== -1) { if (arr.length === 1) delete bp1[p.i1]; else arr.splice(idx, 1); }
        }
        const [keys0, keys1] = [
          { rnaMoleculeName: p.mol0, nucleotideIndex: p.i0 },
          { rnaMoleculeName: p.mol1, nucleotideIndex: p.i1 },
        ].sort(compareBasePairKeys);
        delSignals.push({ keys0, keys1 });
      }
      if (delSignals.length) setBasePairKeysToEdit({ [rcIndex]: { add: [], delete: delSignals } });
      append('success', `Deleted ${delSignals.length} base pair(s)`);
      return;
    }

    if (cmdNd.kind === 'edit') {
      if (newType === undefined) { append('error', 'edit requires bp_type or subtype'); return; }
      const typeVal = newType as _BasePair.Type | undefined;
      if (cmdNd.safe) {
        for (const p of pairs as any) {
          if (!hasBasePair(complex, p.mol0, p.i0, p.mol1, p.i1)) {
            append('error', `No base pair at (${p.idx1}, ${p.idx2})`);
            return;
          }
        }
      }
      pushToUndoStack();
      const addSignals: Array<{ keys0: RnaComplex.BasePairKeys; keys1: RnaComplex.BasePairKeys }> = [];
      const delSignals: Array<{ keys0: RnaComplex.BasePairKeys; keys1: RnaComplex.BasePairKeys }> = [];
      for (const p of pairs as any) {
        const exists = hasBasePair(complex, p.mol0, p.i0, p.mol1, p.i1);
        if (!exists && !cmdNd.safe) {
          append('warning', `No base pair at (${p.idx1}, ${p.idx2}) — creating new`);
        }
        insertBasePair(
          complex,
          p.mol0,
          p.i0,
          p.mol1,
          p.i1,
          exists ? DuplicateBasePairKeysHandler.DELETE_PREVIOUS_MAPPING : DuplicateBasePairKeysHandler.DO_NOTHING,
          { basePairType: typeVal }
        );
        const [keys0, keys1] = [
          { rnaMoleculeName: p.mol0, nucleotideIndex: p.i0 },
          { rnaMoleculeName: p.mol1, nucleotideIndex: p.i1 },
        ].sort(compareBasePairKeys);
        addSignals.push({ keys0, keys1 });
        if (exists) {
          // Ensure UI removes the old instance and adds the updated one
          delSignals.push({ keys0, keys1 });
        }
      }
      setBasePairKeysToEdit({ [rcIndex]: { add: addSignals, delete: delSignals } });
      append('success', `Edited ${pairs.length} base pair(s)`);
      return;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      onSubmit();
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const cmds = history.filter(h => h.level === 'command').map(h => h.text.slice(2));
      const nextIdx = navIdx < 0 ? cmds.length - 1 : Math.max(0, navIdx - 1);
      setNavIdx(nextIdx);
      setInput(cmds[nextIdx] ?? input);
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const cmds = history.filter(h => h.level === 'command').map(h => h.text.slice(2));
      const nextIdx = navIdx < 0 ? -1 : Math.min(cmds.length - 1, navIdx + 1);
      setNavIdx(nextIdx);
      setInput(nextIdx === -1 ? '' : (cmds[nextIdx] ?? ''));
      return;
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      const trimmed = input.trim();
      const m = /^([a-zA-Z_]*)$/.exec(trimmed);
      if (m) {
        const prefix = m[1];
        const match = commandNames.find(n => n.startsWith(prefix));
        if (match) setInput(match + '()');
      }
      return;
    }
  }

  const hintItems = useMemo(() => {
    const t = input.trim();
    const m = /^([a-zA-Z_]*)$/.exec(t);
    const prefix = m ? m[1] : '';
    return commandNames.filter(n => n.startsWith(prefix)).slice(0, 4);
  }, [input, commandNames]);

  // Helpers for color command
  function parseCssColor(input: string): Color {
    // normalize quotes and whitespace
    const s = input.trim().replace(/^['"]|['"]$/g, '');
    // allow hex (3/4/6/8 digits)
    if (/^#?[0-9a-fA-F]{3,4}$/.test(s) || /^#?[0-9a-fA-F]{6}([0-9a-fA-F]{2})?$/.test(s)) {
      const hex = s.startsWith('#') ? s : `#${s}`;
      // Color.fromCssString expects cssString; it understands #RRGGBB style
      return parseColorCss(hex, undefined as any, HandleUndefined.THROW_ERROR);
    }
    // allow named colors
    return parseColorCss(s.toLowerCase(), undefined as any, HandleUndefined.THROW_ERROR);
  }
  function parseTargetRanges(target: string): Array<{ start: number; end: number }> {
    const parts = target.split(';').map(s => s.trim()).filter(Boolean);
    if (parts.length === 0) throw new Error('color(): target is empty');
    const ranges: Array<{ start: number; end: number }> = [];
    for (const p of parts) {
      if (/^\d+$/.test(p)) {
        const v = parseInt(p);
        ranges.push({ start: v, end: v });
        continue;
      }
      const m = /^(\d+)\s*-\s*(\d+)$/.exec(p);
      if (!m) throw new Error(`color(): invalid target segment '${p}'`);
      const a = parseInt(m[1]);
      const b = parseInt(m[2]);
      const start = Math.min(a, b);
      const end = Math.max(a, b);
      ranges.push({ start, end });
    }
    return ranges;
  }
  function inAnyRange(idx: number, ranges: Array<{ start: number; end: number }>): boolean {
    for (const r of ranges) {
      if (idx >= r.start && idx <= r.end) return true;
    }
    return false;
  }

  if (!visible) return <div style={{ display: 'none' }} />;

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        height: 260,
        background: theme.colors.surface,
        color: theme.colors.text,
        fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
        borderTop: `1px solid ${theme.colors.border}`,
        boxShadow: theme.shadows.lg,
        zIndex: 2500,
        display: 'flex',
        flexDirection: 'column'
      }}
      onClick={() => inputRef.current?.focus()}
    >
      <div style={{ padding: '6px 10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${theme.colors.border}` }}>
        <div style={{ fontWeight: 700, fontSize: theme.typography.fontSize.sm, color: theme.colors.primary }}>XRNA Terminal</div>
        <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>Press ~ to hide</div>
      </div>
      <div ref={scrollRef} style={{ flex: 1, overflowY: 'auto', padding: '8px 10px' }}>
        {history.map((h, i) => (
          <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'baseline', whiteSpace: 'pre-wrap' }}>
            <span style={{ color: theme.colors.textSecondary, fontSize: theme.typography.fontSize.xs }}>[{tsFrom(h.ts)}]</span>
            <span style={{ color: colorFor(h.level) }}>{h.text}</span>
          </div>
        ))}
      </div>
      <div style={{ padding: '8px 10px', borderTop: `1px solid ${theme.colors.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: theme.colors.primary }}>&gt;</span>
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={onKeyDown}
            style={{
              flex: 1,
              background: 'transparent',
              border: 'none',
              outline: 'none',
              color: theme.colors.text,
              fontFamily: 'inherit',
              fontSize: theme.typography.fontSize.md
            }}
            placeholder="add(1, 150, length=3)"
          />
        </div>
        {(hintItems.length > 0 || signatureDoc) && (
          <div style={{ marginTop: 6 }}>
            {hintItems.length > 0 && (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: signatureDoc ? 6 : 0 }}>
                {hintItems.map(h => (
                  <span key={h} style={{ background: theme.colors.surfaceHover, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.md, padding: '2px 6px', fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>{h}</span>
                ))}
              </div>
            )}
            {signatureDoc && (
              <div style={{ background: theme.colors.backgroundSecondary, border: `1px solid ${theme.colors.border}`, borderRadius: theme.borderRadius.md, padding: '6px 8px' }}>
                <div style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.text, marginBottom: 4 }}>{signatureDoc.signature}</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr', rowGap: 2 }}>
                  {signatureDoc.lines.map((ln, i) => (
                    <div key={i} style={{ fontSize: theme.typography.fontSize.xs, color: theme.colors.textSecondary }}>- {ln}</div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );

  function tsFrom(d: Date): string {
    const p = (n: number) => n.toString().padStart(2, '0');
    return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  }
  function colorFor(level: Level): string {
    switch (level) {
      case 'command': return theme.colors.primary;
      case 'error': return theme.colors.error;
      case 'warning': return theme.colors.warning;
      case 'success': return theme.colors.success;
      default: return theme.colors.text;
    }
  }
};

export default CommandTerminal;


