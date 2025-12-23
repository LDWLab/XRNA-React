import React, { useEffect, useState, useRef } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { ThemeToggle } from "../../ui/ThemeToggle";
import { Button } from "./Button";
import { FileDown, FolderOpen, Save, ChevronDown, Download, Import } from "lucide-react";
import { OutputFileExtension } from "../../../io/OutputUI";
import { LEFT_PANEL_WIDTH } from '../../../App';
import { outputFileExtensions } from "../../../io/OutputUI";
import {
  inputFileExtensions,
  InputFileExtension
} from "../../../io/InputUI";

// Custom Dropdown Component
interface CustomDropdownProps {
  value: string;
  options: Array<{ value: string; label: string; tooltip?: string }>;
  onChange: (value: string) => void;
  theme: any;
}

const CustomDropdown: React.FC<CustomDropdownProps> = ({ value, options, onChange, theme }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [tooltip, setTooltip] = useState<{ text: string; x: number; y: number } | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setTooltip(null); // Clear tooltip when dropdown closes
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Clear tooltip when dropdown closes
  useEffect(() => {
    if (!isOpen) {
      setTooltip(null);
    }
  }, [isOpen]);

  return (
    <div ref={dropdownRef} style={{ position: 'relative', minWidth: 80 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          height: theme.buttonSizes.md.height,
          padding: theme.buttonSizes.md.padding,
          border: `1px solid ${theme.colors.border}`,
          borderRadius: theme.buttonSizes.md.borderRadius,
          fontSize: theme.buttonSizes.md.fontSize,
          background: theme.colors.background,
          color: theme.colors.text,
          cursor: 'pointer',
          outline: 'none',
          transition: theme.transitions.default,
          fontFamily: theme.typography.fontFamily,
          fontWeight: theme.typography.fontWeight.normal,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minWidth: '100%',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = theme.colors.primary;
          e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}25`;
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = theme.colors.border;
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        <span>{selectedOption?.label || 'Select'}</span>
        <ChevronDown 
          size={16} 
          style={{ 
            transition: theme.transitions.default,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)'
          }} 
        />
      </button>
      
      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.borderRadius.md,
            boxShadow: theme.shadows.lg,
            zIndex: 1000,
            maxHeight: 240,
            overflowY: 'auto',
            marginTop: 4,
          }}
        >
          {options.map((option) => (
            <div
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
                setTooltip(null); // Clear tooltip when option is selected
              }}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                fontSize: theme.typography.fontSize.sm,
                fontFamily: theme.typography.fontFamily,
                borderBottom: `1px solid ${theme.colors.borderLight}`,
                transition: theme.transitions.fast,
                background: option.value === value ? theme.colors.primary : 'transparent',
                color: option.value === value ? theme.colors.textInverse : theme.colors.text,
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = theme.colors.surfaceHover;
                }
                if (option.tooltip) {
                  const rect = e.currentTarget.getBoundingClientRect();
                  setTooltip({
                    text: option.tooltip,
                    x: Math.max(rect.left + rect.width / 2, 100),
                    y: rect.top - 8
                  });
                }
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) {
                  e.currentTarget.style.background = 'transparent';
                }
                setTooltip(null);
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      )}
      
      {/* Tooltip */}
      {tooltip && (
        <div
          style={{
            position: 'fixed',
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translateX(-50%) translateY(-100%)',
            background: theme.colors.surface,
            color: theme.colors.text,
            padding: '8px 12px',
            borderRadius: theme.borderRadius.md,
            border: `1px solid ${theme.colors.border}`,
            boxShadow: theme.shadows.lg,
            fontSize: theme.typography.fontSize.sm,
            fontFamily: theme.typography.fontFamily,
            whiteSpace: 'nowrap',
            zIndex: 1001,
            pointerEvents: 'none',
          }}
        >
          {tooltip.text}
          {/* Tooltip arrow */}
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: 0,
              height: 0,
              borderLeft: '6px solid transparent',
              borderRight: '6px solid transparent',
              borderTop: `6px solid ${theme.colors.surface}`,
              filter: `drop-shadow(0 1px 1px ${theme.colors.border})`,
            }}
          />
        </div>
      )}
    </div>
  );
};
const tooltipMap: Record<OutputFileExtension, string> = {
  [OutputFileExtension.json] : 'Structured format, maximum support for all features',
  [OutputFileExtension.bpseq]: 'Base Pair Sequence - No support for non-canonical base pairs',
  [OutputFileExtension.ct]: 'Connectivity Table - RNAstructure format for secondary structure',
  [OutputFileExtension.svg]: 'Scalable Vector Graphics - Suitable for publications',
  // 'png': 'Portable Network Graphics - No support for non-canonical base pairs',
  // 'pdf': 'Portable Document Format - No support for non-canonical base pairs',
  [OutputFileExtension.csv]: 'Comma Separated Values - No support for non-canonical base pairs',
  [OutputFileExtension.tr]: 'Traveler Format - No support for non-canonical base pairs',
  [OutputFileExtension.xrna]: 'XRNA native format - No support for non-canonical base pairs',
  [OutputFileExtension.dbn]: 'Dot-bracket secondary structure (sequence + structure, including pseudoknots)'
};
type ExportFormats = Array<{ value: OutputFileExtension; label: string; tooltip?: string }>;

const EXPORT_FORMATS : ExportFormats = outputFileExtensions.map(
  (ext) => {
    return {
      value: ext,
      label: ext.toUpperCase(),
      tooltip: tooltipMap[ext] || `Export as ${ext.toUpperCase()} format`
    };
  }
);

export type TopbarProps = {
  onImport?: () => void;
  onSave?: () => void;
  onExportWithFormat?: (filename: string, format: OutputFileExtension) => void;
  fileName?: string;
  onFileNameChange?: (name: string) => void;
  exportFormat?: OutputFileExtension;
  exportFormats?: ExportFormats;
  onExportFormatChange?: (format: OutputFileExtension) => void;
  downloadButtonReference: React.MutableRefObject<HTMLButtonElement | null>;
  saveButtonsDisabledFlag : boolean;
  onDownload : () => void;
};

export const TOPBAR_HEIGHT = 56;

export const Topbar: React.FC<TopbarProps> = ({
  onImport,
  onSave,
  onExportWithFormat,
  fileName = "",
  onFileNameChange,
  exportFormat,
  exportFormats = EXPORT_FORMATS,
  onExportFormatChange,
  downloadButtonReference,
  saveButtonsDisabledFlag,
  onDownload
}) => {
  const { theme } = useTheme();
  
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: LEFT_PANEL_WIDTH,
        right: 0,
        height: TOPBAR_HEIGHT,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        background: theme.colors.surface,
        borderBottom: `1px solid ${theme.colors.border}`,
        zIndex: 1200,
        transition: theme.transitions.default,
      }}
    >
      <div
        style={{
          height: "4px",
          background: `linear-gradient(90deg, ${theme.colors.accent}, ${theme.colors.primary})`,
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 10,
        }}
      />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {onImport && (
          <Button
            label="Import"
            onClick={onImport}
            variant="accent"
            icon={<Import size={12} />}
          />
        )}
        <input
          type="text"
          placeholder="Enter name to export"
          value={fileName}
          onChange={(e) => onFileNameChange?.(e.target.value)}
          style={{
            height: theme.buttonSizes.md.height,
            padding: theme.buttonSizes.md.padding,
            border: `1px solid ${theme.colors.border}`,
            borderRadius: theme.buttonSizes.md.borderRadius,
            fontSize: theme.buttonSizes.md.fontSize,
            background: theme.colors.background,
            color: theme.colors.text,
            minWidth: 180,
            transition: theme.transitions.default,
          }}
          onFocus={(e) => {
            e.currentTarget.style.borderColor = theme.colors.primary;
            e.currentTarget.style.boxShadow = `0 0 0 3px ${theme.colors.primary}25`;
          }}
          onBlur={(e) => {
            e.currentTarget.style.borderColor = theme.colors.border;
            e.currentTarget.style.boxShadow = "none";
          }}
        />
        <CustomDropdown
          value={exportFormat ?? ""}
          options={exportFormats}
          onChange={(value) => onExportFormatChange?.(value as OutputFileExtension)}
          theme={theme}
        />
        {onSave && <>
          <Button
            label="Save"
            onClick={onSave}
            disabled={saveButtonsDisabledFlag || !exportFormat}
            variant="secondary"
            icon={<Save size={12} />}
            ref = {downloadButtonReference}
          />
          <Button
            label="Export"
            variant="primary"
            icon={<FileDown size={12} />}
            disabled={saveButtonsDisabledFlag || !exportFormat}
            onClick={() => {
              if (!exportFormat) {
                return;
              }
              onExportWithFormat?.(fileName, exportFormat)
            }}
          />
        </>}
        {!onSave && <Button
          label="Download"
          onClick={onDownload}
          disabled={saveButtonsDisabledFlag || !exportFormat}
          variant="secondary"
          icon={<Download size={12} />}
          ref = {downloadButtonReference}
        />}
      </div>
      <ThemeToggle />
    </div>
  );
};
