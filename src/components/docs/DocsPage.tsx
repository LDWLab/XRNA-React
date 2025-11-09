import React, { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import { ThemeProvider } from "../../context/ThemeContext";
import ThemeToggle from "../ui/ThemeToggle";
import { Button } from "../new_sidebar/layout/Button";
import { X, Minus, Plus, Type } from "lucide-react";
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
  figureId?: string;
};

type DocCodeBlock = {
  type: "code";
  language?: string;
  label?: string;
  content: string;
};

type DocContentBlock =
  | DocParagraphBlock
  | DocListBlock
  | DocNoteBlock
  | DocTableBlock
  | DocImageBlock
  | DocCodeBlock;

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
  kind: "text" | "em" | "strong" | "code" | "figureRef";
  value: string;
  figureId?: string;
};

function tokenizeRichText(text: string): RichTextSegment[] {
  const segments: RichTextSegment[] = [];
  const pattern = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*]+\*|Figure\s*\[([^\]]+)\])/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(text)) !== null) {
    if (match.index > lastIndex) {
      segments.push({ kind: "text", value: text.slice(lastIndex, match.index) });
    }
    const token = match[0];
    if (token.startsWith("`")) {
      segments.push({ kind: "code", value: token.slice(1, -1) });
    } else if (token.startsWith("**")) {
      segments.push({ kind: "strong", value: token.slice(2, -2) });
    } else if (token.startsWith("*")) {
      segments.push({ kind: "em", value: token.slice(1, -1) });
    } else if (token.startsWith("Figure")) {
      const figureId = match[2];
      segments.push({ kind: "figureRef", value: token, figureId });
    }
    lastIndex = pattern.lastIndex;
  }
  if (lastIndex < text.length) {
    segments.push({ kind: "text", value: text.slice(lastIndex) });
  }
  return segments.filter((segment) => segment.value.length > 0);
}

function buildFigureRegistry(sections: DocSection[]): Map<string, number> {
  const registry = new Map<string, number>();
  let figureNumber = 1;

  function processSection(section: DocSection) {
    section.content?.forEach((block) => {
      if (block.type === "image" && block.figureId) {
        registry.set(block.figureId, figureNumber++);
      }
    });
    section.subsections?.forEach(processSection);
  }

  sections.forEach(processSection);
  return registry;
}

function renderRichText(text: string, figureRegistry?: Map<string, number>) {
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
      case "strong":
        return (
          <strong key={index} className="docs-strong">
            {segment.value}
          </strong>
        );
      case "em":
        return (
          <em key={index} className="docs-emphasis">
            {segment.value}
          </em>
        );
      case "figureRef": {
        const figureNum = segment.figureId && figureRegistry ? figureRegistry.get(segment.figureId) : undefined;
        if (figureNum) {
          return (
            <a
              key={index}
              href={`#figure-${segment.figureId}`}
              className="docs-figure-ref"
              onClick={(e) => {
                e.preventDefault();
                const element = document.getElementById(`figure-${segment.figureId}`);
                element?.scrollIntoView({ behavior: "smooth", block: "center" });
              }}
            >
              Figure {figureNum}
            </a>
          );
        }
        return <Fragment key={index}>{segment.value}</Fragment>;
      }
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
  const [openTocSections, setOpenTocSections] = useState<Set<string>>(new Set());
  const [fontScale, setFontScale] = useState<number>(1.2);
  const [expandedImage, setExpandedImage] = useState<{ 
    src: string; 
    alt: string; 
    caption?: string;
    sectionTitle?: string;
    sectionContent?: DocContentBlock[];
  } | null>(null);

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
      setOpenTocSections(new Set());
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

  const figureRegistry = useMemo(() => {
    if (loadState.status !== "ready") {
      return new Map<string, number>();
    }
    return buildFigureRegistry(loadState.docs.sections);
  }, [loadState]);

  const toggleTocSection = useCallback((id: string) => {
    setOpenTocSections((previous) => {
      const next = new Set(previous);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const ensureTocVisibility = useCallback((entry: FlattenedSection) => {
    setOpenTocSections((previous) => {
      const next = new Set(previous);
      if (entry.level === 2) {
        next.add(entry.id);
      } else if (entry.ancestors.length > 0) {
        next.add(entry.ancestors[0]);
      }
      return next;
    });
  }, []);

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

  const handleImageClick = useCallback((block: DocImageBlock, sectionTitle?: string, sectionContent?: DocContentBlock[]) => {
    setExpandedImage({
      src: resolveAssetUrl(block.src),
      alt: block.alt,
      caption: block.caption,
      sectionTitle,
      sectionContent,
    });
  }, []);

  const closeExpandedImage = useCallback(() => {
    setExpandedImage(null);
  }, []);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && expandedImage) {
        closeExpandedImage();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [expandedImage, closeExpandedImage]);

  const renderContentBlock = useCallback((block: DocContentBlock, key: string | number, figReg: Map<string, number>, sectionTitle?: string, allContent?: DocContentBlock[]) => {
    switch (block.type) {
      case "paragraph":
        return (
          <p key={key} className="docs-paragraph">
            {renderRichText(block.text, figReg)}
          </p>
        );
      case "list": {
        const ListTag = block.style === "ordered" ? "ol" : "ul";
        return (
          <ListTag key={key} className="docs-list">
            {block.items.map((item, index) => (
              <li key={index}>{renderRichText(item, figReg)}</li>
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
            <span className="docs-note__content">{renderRichText(block.text, figReg)}</span>
          </div>
        );
      case "table":
        return (
          <div key={key} className="docs-table-wrapper">
            <table className="docs-table">
              <thead>
                <tr>
                  {block.headers.map((header, index) => (
                    <th key={index}>{renderRichText(header, figReg)}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {block.rows.map((row, rowIndex) => (
                  <tr key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                      <td key={cellIndex}>{renderRichText(cell, figReg)}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      case "image": {
        const figNum = block.figureId ? figReg.get(block.figureId) : undefined;
        return (
          <figure 
            key={key}
            id={block.figureId ? `figure-${block.figureId}` : undefined}
            className={`docs-image${getImageWidthClass(block.width)}`}
            onClick={() => handleImageClick(block, sectionTitle, allContent)}
            style={{ cursor: "pointer" }}
          >
            <img src={resolveAssetUrl(block.src)} alt={block.alt} loading="lazy" />
            {(figNum || block.caption) ? (
              <figcaption className="docs-image__caption">
                {figNum ? <span className="docs-figure-number">Figure {figNum}.</span> : null}
                {block.caption ? <span>{renderRichText(block.caption, figReg)}</span> : null}
              </figcaption>
            ) : null}
          </figure>
        );
      }
      case "code": {
        const lines = block.content;
        return (
          <figure key={key} className="docs-code-block">
            {block.label ? (
              <figcaption className="docs-code-block__label">{block.label}</figcaption>
            ) : null}
            <pre className="docs-code-block__pre">
              <code className={`docs-code-block__code${block.language ? ` language-${block.language}` : ""}`}>
                {lines}
              </code>
            </pre>
          </figure>
        );
      }
      default:
        return null;
    }
  }, [handleImageClick]);

  const handleTocLinkClick = useCallback(
    (event: React.MouseEvent<HTMLAnchorElement>, entry: FlattenedSection) => {
      event.preventDefault();
      ensureTocVisibility(entry);
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
    [ensureTocVisibility]
  );

  const renderSection = useCallback(
    (section: DocSection, figReg: Map<string, number>, level = 2): JSX.Element => {
      const headingLevel = Math.min(level, 6);
      const HeadingTag = `h${headingLevel}` as keyof JSX.IntrinsicElements;

      if (level > 2) {
        return (
          <article key={section.id} id={section.id} className="docs-subsection">
            <HeadingTag className="docs-subsection__heading">{section.title}</HeadingTag>
            {section.summary ? (
              <p className="docs-subsection__summary">{renderRichText(section.summary, figReg)}</p>
            ) : null}
            {section.content?.map((block, index) =>
              renderContentBlock(block, `${section.id}-block-${index}`, figReg, section.title, section.content)
            )}
            {section.subsections?.length
              ? section.subsections.map((subsection) =>
                  renderSection(subsection, figReg, level + 1)
                )
              : null}
          </article>
        );
      }

      const isOpen = openSections.has(section.id);
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
              <p className="docs-section__summary">{renderRichText(section.summary, figReg)}</p>
            ) : null}
          </header>
          <div className="docs-section__body" id={contentId} hidden={!isOpen}>
            {section.content?.map((block, index) =>
              renderContentBlock(block, `${section.id}-block-${index}`, figReg, section.title, section.content)
            )}
            {section.subsections?.length
              ? section.subsections.map((subsection) =>
                  renderSection(subsection, figReg, level + 1)
                )
              : null}
          </div>
        </section>
      );
    },
    [openSections, toggleSection, renderContentBlock]
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
    <>
      {expandedImage && (
        <div 
          className="docs-image-modal" 
          onClick={closeExpandedImage}
          role="dialog"
          aria-modal="true"
          aria-label="Expanded image view"
        >
          <button 
            className="docs-image-modal__close"
            onClick={closeExpandedImage}
            aria-label="Close expanded image (Press Escape)"
            title="Close (Esc)"
          >
            <X size={20} />
          </button>
          <div 
            className="docs-image-modal__content"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="docs-image-modal__image-container">
              <img 
                src={expandedImage.src} 
                alt={expandedImage.alt}
                className="docs-image-modal__img"
              />
              {expandedImage.caption && (
                <div className="docs-image-modal__caption">
                  {renderRichText(expandedImage.caption, figureRegistry)}
                </div>
              )}
            </div>
            {expandedImage.sectionContent && expandedImage.sectionContent.length > 0 && (
              <div className="docs-image-modal__context">
                {expandedImage.sectionTitle && (
                  <h3 className="docs-image-modal__context-title">{expandedImage.sectionTitle}</h3>
                )}
                <div className="docs-image-modal__context-content">
                  {expandedImage.sectionContent.map((block, index) => {
                    if (block.type === 'image') return null;
                    return renderContentBlock(block, `modal-${index}`, figureRegistry);
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
      <div className="docs-container" style={{ '--docs-scale': fontScale } as React.CSSProperties}>
        <header className="docs-header">
          <div className="docs-header__content">
            <h1 className="docs-header__title">{docs.title}</h1>
            <div className="docs-header__controls">
              <div className="docs-font-controls">
                <Button
                  label=""
                  variant="simpleHighlight"
                  icon={<Minus size={12} />}
                  hint="Decrease font size"
                  onClick={() => setFontScale(s => Math.max(0.8, s - 0.1))}
                  disabled={fontScale <= 0.8}
                />
                <Button
                  label=""
                  variant="simpleHighlight"
                  icon={<Type size={12} />}
                  hint="Reset font size"
                  onClick={() => setFontScale(1)}
                />
                <Button
                  label=""
                  variant="simpleHighlight"
                  icon={<Plus size={12} />}
                  hint="Increase font size"
                  onClick={() => setFontScale(s => Math.min(1.4, s + 0.1))}
                  disabled={fontScale >= 1.4}
                />
              </div>
              <Button
                label=""
                variant="secondary"
                icon={<X size={14} />}
                hint="Close documentation"
                onClick={() => { window.location.hash = "#/"; }}
              />
              <ThemeToggle className="docs-theme-toggle" />
            </div>
          </div>
        </header>
        <main className="docs-page">
          <aside className="docs-page__toc" aria-label="Table of contents">
            <div className="docs-page__toc-header">
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
            {tableOfContents.map((entry: FlattenedSection) => {
              const isTopLevel = entry.level === 2;
              const topAncestorId = isTopLevel ? entry.id : entry.ancestors[0];
              const isVisible =
                isTopLevel || (topAncestorId ? openTocSections.has(topAncestorId) : false);

              if (!isVisible) {
                return null;
              }

              if (isTopLevel) {
                const isOpen = openTocSections.has(entry.id);
                const hasChildren = tableOfContents.some(
                  (candidate: FlattenedSection) => candidate.ancestors[0] === entry.id
                );

                return (
                  <li key={entry.id} data-level={entry.level}>
                    <div className="docs-toc-item">
                      {hasChildren ? (
                        <button
                          type="button"
                          className="docs-toc-toggle"
                          onClick={() => toggleTocSection(entry.id)}
                          aria-expanded={isOpen}
                          aria-label={`${isOpen ? "Collapse" : "Expand"} ${entry.title}`}
                        >
                          <span className="docs-toc-toggle__chevron" aria-hidden="true">
                            ▾
                          </span>
                        </button>
                      ) : (
                        <span className="docs-toc-toggle docs-toc-toggle--spacer" aria-hidden="true">
                          ▸
                        </span>
                      )}
                      <a
                        href={`#/docs?section=${entry.id}`}
                        onClick={(event) => handleTocLinkClick(event, entry)}
                        className="docs-toc-link"
                        style={{ paddingLeft: `${(entry.level - 2) * 12}px` }}
                      >
                        {entry.title}
                      </a>
                    </div>
                  </li>
                );
              }

              return (
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
              );
            })}
          </ol>
          </nav>
        </aside>
        <div className="docs-page__content" role="main" aria-label="Documentation content">
        {docs.sections.map((section) => renderSection(section, figureRegistry))}
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
                    <p>{renderRichText(resource.description, figureRegistry)}</p>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        ) : null}
        </div>
      </main>
    </div>
  </>);
};

const DocsPage: React.FC = () => (
  <ThemeProvider>
    <DocsContent />
  </ThemeProvider>
);

export default DocsPage;
