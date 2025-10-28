import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";
import { Button } from "../new_sidebar/layout/Button";
import { X } from "lucide-react";
import "./DocsPage.css";

type DocNoteVariant = "tip" | "info" | "warning";

type DocParagraphBlock = {
  type: "paragraph";
  text: string;
};

type DocListBlock = {
  type: "list";
  style: "ordered" | "unordered";
  items: string[];
};

type DocNoteBlock = {
  type: "note";
  variant: DocNoteVariant;
  text: string;
};

type DocTableBlock = {
  type: "table";
  headers: string[];
  rows: string[][];
};

type DocImageWidth = "sm" | "md" | "lg" | "full";

type DocImageBlock = {
  type: "image";
  src: string;
  alt: string;
  caption?: string;
  width?: DocImageWidth;
};

type DocContentBlock =
  | DocParagraphBlock
  | DocListBlock
  | DocNoteBlock
  | DocTableBlock
  | DocImageBlock;

type DocSection = {
  id: string;
  title: string;
  summary?: string;
  content?: DocContentBlock[];
  subsections?: DocSection[];
};

type DocResource = {
  label: string;
  url: string;
  description?: string;
};

type DocsPayload = {
  title: string;
  version?: string;
  lastUpdated?: string;
  intro?: string;
  sections: DocSection[];
  resources?: DocResource[];
};

type LoadState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; docs: DocsPayload };

type FlattenedSection = {
  id: string;
  title: string;
  level: number;
  ancestors: string[];
};

const DOCS_ENDPOINT = `${process.env.PUBLIC_URL ?? ""}/docs/documentation.json`;

const NOTE_VARIANT_LABELS: Record<DocNoteVariant, string> = {
  tip: "Tip",
  info: "Info",
  warning: "Warning",
};

const NOTE_VARIANT_CLASSNAMES: Record<DocNoteVariant, string> = {
  tip: "docs-note--tip",
  info: "docs-note--info",
  warning: "docs-note--warning",
};

type RichTextSegment = {
  kind: "text" | "em" | "code";
  value: string;
};

function tokenizeRichText(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  const pattern = /(`[^`]+`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("`")) {
      segments.push({ kind: "code", value: token.slice(1, -1) });
    } else if (token.startsWith("*")) {
      segments.push({ kind: "em", value: token.slice(1, -1) });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }
  return segments.filter((segment) => segment.value.length > 0);
}

function renderRichText(text: string) {
  const segments = tokenizeRichText(text);
  if (segments.length === 0) {
    return text;
  }
  return segments.map((segment, index) => {
    switch (segment.kind) {
      case "code":
        return (
          <code key={index} className="docs-inline-code">
            {segment.value}
          </code>
        );
      case "em":
        return (
          <em key={index} className="docs-emphasis">
            {segment.value}
          </em>
        );
      default:
        return <Fragment key={index}>{segment.value}</Fragment>;
    }
  });
}

function resolveAssetUrl(src: string): string {
  if (/^(?:[a-z]+:)?\/\//i.test(src) || src.startsWith("data:")) {
    return src;
  }
  const publicUrl = process.env.PUBLIC_URL ?? "";
  const normalizedSrc = src.startsWith("/") ? src : `/${src}`;
  if (!publicUrl) {
    return normalizedSrc;
  }
  const separator = publicUrl.endsWith("/") ? "" : "/";
  return `${publicUrl}${separator}${normalizedSrc.replace(/^\/+/, "")}`;
}

function getImageWidthClass(width?: DocImageWidth): string {
  switch (width) {
    case "sm":
      return " docs-image--sm";
    case "md":
      return " docs-image--md";
    case "lg":
      return " docs-image--lg";
    case "full":
      return " docs-image--full";
    default:
      return "";
  }
}

function renderContentBlock(block: DocContentBlock, key: string | number) {
  switch (block.type) {
    case "paragraph":
      return (
        <p key={key} className="docs-paragraph">
          {renderRichText(block.text)}
        </p>
      );
    case "list": {
      const ListTag = block.style === "ordered" ? "ol" : "ul";
      return (
        <ListTag key={key} className="docs-list">
          {block.items.map((item, index) => (
            <li key={index}>{renderRichText(item)}</li>
          ))}
        </ListTag>
      );
    }
    case "note":
      return (
        <div
          key={key}
          className={`docs-note ${NOTE_VARIANT_CLASSNAMES[block.variant]}`}
        >
          <span className="docs-note__label">{NOTE_VARIANT_LABELS[block.variant]}</span>
          <span className="docs-note__content">{renderRichText(block.text)}</span>
        </div>
      );
    case "table":
      return (
        <div key={key} className="docs-table-wrapper">
          <table className="docs-table">
            <thead>
              <tr>
                {block.headers.map((header, index) => (
                  <th key={index}>{renderRichText(header)}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {block.rows.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td key={cellIndex}>{renderRichText(cell)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    case "image":
      return (
        <figure key={key} className={`docs-image${getImageWidthClass(block.width)}`}>
          <img src={resolveAssetUrl(block.src)} alt={block.alt} loading="lazy" />
          {block.caption ? (
            <figcaption className="docs-image__caption">
              {renderRichText(block.caption)}
            </figcaption>
          ) : null}
        </figure>
      );
    default:
      return null;
  }
}

function flattenSections(
  sections: DocSection[],
  ancestors: string[] = [],
  level = 2
): FlattenedSection[] {
  return sections.flatMap((section) => {
    const current: FlattenedSection = {
      id: section.id,
      title: section.title,
      level,
      ancestors,
    };
    const childAncestors = [...ancestors, section.id];
    const childLevel = Math.min(level + 1, 6);
    const nested = section.subsections
      ? flattenSections(section.subsections, childAncestors, childLevel)
      : [];
    return [current, ...nested];
  });
}

function collectSectionIds(sections: DocSection[]): string[] {
  return sections.flatMap((section) => [
    section.id,
    ...(section.subsections ? collectSectionIds(section.subsections) : []),
  ]);
}

const DocsContent: React.FC = () => {
  const [loadState, setLoadState] = useState<LoadState>({ status: "loading" });
  const [openSections, setOpenSections] = useState<Set<string>>(new Set());

  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        const response = await fetch(DOCS_ENDPOINT, { signal: controller.signal });
        if (!response.ok) {
          throw new Error(`Failed to load documentation (status ${response.status})`);
        }
        const payload = (await response.json()) as DocsPayload;
        setLoadState({ status: "ready", docs: payload });
      } catch (error) {
        if ((error as DOMException).name === "AbortError") {
          return;
        }
        setLoadState({
          status: "error",
          message:
            error instanceof Error
              ? error.message
              : "Unable to load documentation. Please try again later.",
        });
      }
    }

    load();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (loadState.status === "ready") {
      setOpenSections(new Set(collectSectionIds(loadState.docs.sections)));
    }
  }, [loadState]);

  useEffect(() => {
    if (loadState.status === "ready" && loadState.docs.title) {
      document.title = `${loadState.docs.title} | Documentation`;
    }
  }, [loadState]);

  const tableOfContents = useMemo(() => {
    if (loadState.status !== "ready") {
      return [] as FlattenedSection[];
    }
    return flattenSections(loadState.docs.sections);
  }, [loadState]);

  const toggleSection = useCallback((id: string) => {
    setOpenSections((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const handleTocLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, entry: FlattenedSection) => {
      event.preventDefault();
      setOpenSections((previous) => {
        const next = new Set(previous);
        entry.ancestors.forEach((ancestorId) => next.add(ancestorId));
        next.add(entry.id);
        return next;
      });

      const baseHash = "#/docs";
      const targetHash = `${baseHash}?section=${entry.id}`;
      if (window.location.hash !== targetHash) {
        window.location.hash = targetHash;
      }

      const targetElement = document.getElementById(entry.id);
      if (targetElement) {
        targetElement.scrollIntoView({ behavior: "smooth", block: "start" });
        targetElement.focus?.();
      }
    },
    []
  );

  const renderSection = useCallback(
    (section: DocSection, level = 2): JSX.Element => {
      const isOpen = openSections.has(section.id);
      const headingLevel = Math.min(level, 6);
      const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;
      const contentId = `${section.id}-content`;

      return (
        <section
          key={section.id}
          id={section.id}
          className={`docs-section${isOpen ? "" : " docs-section--collapsed"}`}
        >
          <header className="docs-section__header">
            <HeadingTag className="docs-section__heading">
              <button
                type="button"
                className="docs-section__toggle"
                onClick={() => toggleSection(section.id)}
                aria-expanded={isOpen}
                aria-controls={contentId}
              >
                <span className="docs-section__chevron" aria-hidden="true">
                  ▾
                </span>
                <span>{section.title}</span>
              </button>
            </HeadingTag>
            {section.summary ? (
              <p className="docs-section__summary">{renderRichText(section.summary)}</p>
            ) : null}
          </header>
          <div className="docs-section__body" id={contentId} hidden={!isOpen}>
            {section.content?.map((block, index) =>
              renderContentBlock(block, `${section.id}-block-${index}`)
            )}
            {section.subsections?.length ? (
              <div className="docs-section__subsections">
                {section.subsections.map((subsection) =>
                  renderSection(subsection, level + 1)
                )}
              </div>
            ) : null}
          </div>
        </section>
      );
    },
    [openSections, toggleSection]
  );

  if (loadState.status === "loading") {
    return (
      <main className="docs-page docs-page--centered">
        <div className="docs-status">
          <span className="docs-status__spinner" aria-hidden>
            ●
          </span>
          <span className="docs-status__label">Loading documentation…</span>
        </div>
      </main>
    );
  }

  if (loadState.status === "error") {
    return (
      <main className="docs-page docs-page--centered">
        <div className="docs-status docs-status--error">
          <span className="docs-status__label">{loadState.message}</span>
        </div>
      </main>
    );
  }

  const { docs } = loadState;

  return (
    <main className="docs-page">
      <aside className="docs-page__toc" aria-label="Table of contents">
        <div className="docs-page__toc-header">
          <div className="docs-page__toc-title-row">
            <h1>{docs.title}</h1>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
  <Button
    label=""
    variant="secondary"
    icon={<X size={12} />}
    hint="Close docs"
    onClick={() => { window.location.hash = "#/"; }}
  />
  <ThemeToggle className="docs-theme-toggle" />
</div>
          </div>
          <dl className="docs-meta">
            {docs.version ? (
              <div>
                <dt>Version</dt>
                <dd>{docs.version}</dd>
              </div>
            ) : null}
            {docs.lastUpdated ? (
              <div>
                <dt>Last updated</dt>
                <dd>{docs.lastUpdated}</dd>
              </div>
            ) : null}
          </dl>
        </div>
        <nav className="docs-toc-nav">
          <ol>
            {tableOfContents.map((entry) => (
              <li key={entry.id} data-level={entry.level}>
                <a
                  href={`#/docs?section=${entry.id}`}
                  onClick={(event) => handleTocLinkClick(event, entry)}
                  className="docs-toc-link"
                  style={{ paddingLeft: `${(entry.level - 2) * 12}px` }}
                >
                  {entry.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>
      </aside>
      <div className="docs-page__content">
        {docs.sections.map((section) => renderSection(section))}
        {docs.resources?.length ? (
          <section id="resources" className="docs-section docs-section--resources">
            <header className="docs-section__header">
              <h2>Resources</h2>
            </header>
            <ul className="docs-resources">
              {docs.resources.map((resource) => (
                <li key={resource.url}>
                  <a href={resource.url} target="_blank" rel="noreferrer">
                    {resource.label}
                  </a>
                  {resource.description ? (
                    <p>{renderRichText(resource.description)}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </main>
  );
};

const DocsPage: React.FC = () => (
  <ThemeProvider>
    <DocsContent />
  </ThemeProvider>
);

export default DocsPage;
