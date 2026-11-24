
import { useEffect, useState } from "react";
import "../styles/citation-manager.css";
import { getPapers } from "../services/api";

const STORAGE_KEY = "researchAI_citation_metadata";

const createDefaultMetadata = (paper) => {
    const title = paper.title || paper.file_name || "Research Paper";

    return {
        authors: "",
        year: "",
        title: title.replace(/\.pdf$/i, ""),
        journal: "",
        volume: "",
        issue: "",
        pages: "",
        doi: "",
        url: "",
    };
};

const getAuthorSurname = (authors) => {
    if (!authors || !authors.trim()) {
        return "Unknown Author";
    }

    const firstAuthor = authors
        .split(";")[0]
        .split("&")[0]
        .trim();

    const surname = firstAuthor.split(",")[0].trim();

    return surname || firstAuthor;
};

const getSourceLink = (metadata) => {
    if (metadata.doi) {
        return `https://doi.org/${metadata.doi.replace(
            /^https?:\/\/(dx\.)?doi\.org\//i,
            ""
        )}`;
    }

    return metadata.url || "";
};

const generateCitation = (metadata, style, index) => {
    const authors = metadata.authors.trim();
    const title = metadata.title.trim();
    const year = metadata.year.trim();
    const journal = metadata.journal.trim();
    const volume = metadata.volume.trim();
    const issue = metadata.issue.trim();
    const pages = metadata.pages.trim();
    const sourceLink = getSourceLink(metadata);

    const volumeIssue = [
        volume ? `vol. ${volume}` : "",
        issue ? `no. ${issue}` : "",
    ].filter(Boolean).join(", ");

    const pageText = pages ? `pp. ${pages}` : "";

    if (style === "APA") {
        let citation = authors ? `${authors}. ` : "";
        citation += `(${year || "n.d."}). `;
        citation += title ? `${title}.` : "[Title unavailable].";

        if (journal) {
            citation += ` ${journal}`;

            if (volume) {
                citation += `, ${volume}`;
            }

            if (issue) {
                citation += `(${issue})`;
            }

            if (pages) {
                citation += `, ${pages}`;
            }

            citation += ".";
        }

        if (sourceLink) {
            citation += ` ${sourceLink}`;
        }

        return citation;
    }

    if (style === "MLA") {
        let citation = authors ? `${authors}. ` : "";
        citation += title ? `"${title}." ` : "";

        if (journal) {
            citation += `${journal}, `;
        }

        if (volumeIssue) {
            citation += `${volumeIssue}, `;
        }

        if (year) {
            citation += `${year}, `;
        }

        if (pageText) {
            citation += `${pageText}.`;
        }

        citation = citation.trim();

        if (sourceLink) {
            citation += ` ${sourceLink}.`;
        }

        return citation || "[Incomplete citation]";
    }

    if (style === "Chicago") {
        let citation = authors ? `${authors}. ` : "";
        citation += title ? `"${title}." ` : "";

        if (journal) {
            citation += `${journal} `;
        }

        if (volume) {
            citation += volume;
        }

        if (issue) {
            citation += `, no. ${issue}`;
        }

        if (year) {
            citation += ` (${year})`;
        }

        if (pages) {
            citation += `: ${pages}`;
        }

        citation = citation.trim();

        if (citation && !citation.endsWith(".")) {
            citation += ".";
        }

        if (sourceLink) {
            citation += ` ${sourceLink}`;
        }

        return citation || "[Incomplete citation]";
    }

    if (style === "IEEE") {
        let citation = `[${index + 1}] `;

        if (authors) {
            citation += `${authors}, `;
        }

        if (title) {
            citation += `"${title}," `;
        }

        if (journal) {
            citation += `${journal}, `;
        }

        if (volumeIssue) {
            citation += `${volumeIssue}, `;
        }

        if (pageText) {
            citation += `${pageText}, `;
        }

        if (year) {
            citation += `${year}.`;
        } else {
            citation = citation.trim().replace(/,$/, ".");
        }

        if (sourceLink) {
            citation += ` ${sourceLink}`;
        }

        return citation;
    }

    return title;
};

const generateInTextCitation = (metadata, style, index) => {
    const surname = getAuthorSurname(metadata.authors);
    const year = metadata.year || "n.d.";

    if (style === "APA") {
        return `(${surname}, ${year})`;
    }

    if (style === "MLA") {
        return `(${surname})`;
    }

    if (style === "Chicago") {
        return `(${surname} ${year})`;
    }

    return `[${index + 1}]`;
};

function CitationManager() {
    const [citationStyle, setCitationStyle] = useState("APA");
    const [searchQuery, setSearchQuery] = useState("");
    const [copiedId, setCopiedId] = useState(null);

    const [papers, setPapers] = useState([]);
    const [metadataByPaper, setMetadataByPaper] = useState({});

    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [copyMessage, setCopyMessage] = useState("");

    useEffect(() => {
        const loadPapers = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getPapers();

                setPapers(data);

                const savedMetadata = localStorage.getItem(STORAGE_KEY);

                if (savedMetadata) {
                    try {
                        setMetadataByPaper(JSON.parse(savedMetadata));
                    } catch {
                        setMetadataByPaper({});
                    }
                }
            } catch (err) {
                setError(
                    err.message || "Unable to load research papers."
                );
            } finally {
                setLoading(false);
            }
        };

        loadPapers();
    }, []);

    useEffect(() => {
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(metadataByPaper)
        );
    }, [metadataByPaper]);

    const getMetadata = (paper) => {
        return (
            metadataByPaper[paper.id] ||
            createDefaultMetadata(paper)
        );
    };

    const updateMetadata = (paper, field, value) => {
        setMetadataByPaper((previous) => {
            const current = previous[paper.id] ||
                createDefaultMetadata(paper);

            return {
                ...previous,
                [paper.id]: {
                    ...current,
                    [field]: value,
                },
            };
        });
    };

    const copyText = async (text, id) => {
        try {
            await navigator.clipboard.writeText(text);

            setCopiedId(id);
            setCopyMessage("Copied successfully!");

            setTimeout(() => {
                setCopiedId(null);
                setCopyMessage("");
            }, 1800);
        } catch {
            setCopyMessage("Unable to copy. Please try again.");

            setTimeout(() => {
                setCopyMessage("");
            }, 2500);
        }
    };

    const filteredPapers = papers.filter((paper) => {
        const query = searchQuery.toLowerCase().trim();

        if (!query) {
            return true;
        }

        const metadata = getMetadata(paper);

        const title = metadata.title.toLowerCase();
        const fileName = (paper.file_name || "").toLowerCase();
        const authors = metadata.authors.toLowerCase();
        const journal = metadata.journal.toLowerCase();

        return (
            title.includes(query) ||
            fileName.includes(query) ||
            authors.includes(query) ||
            journal.includes(query)
        );
    });

    const completeCount = papers.filter((paper) => {
        const metadata = getMetadata(paper);

        return (
            metadata.authors.trim() &&
            metadata.year.trim() &&
            metadata.title.trim() &&
            (metadata.journal.trim() ||
                metadata.doi.trim() ||
                metadata.url.trim())
        );
    }).length;

    const copyAllReferences = () => {
        const references = filteredPapers.map((paper, index) => {
            const metadata = getMetadata(paper);

            return generateCitation(
                metadata,
                citationStyle,
                index
            );
        });

        if (references.length === 0) {
            setCopyMessage("No references available to copy.");
            return;
        }

        const referenceList = references.join("\n\n");

        copyText(referenceList, "all");
    };

    const renderMetadataField = (
        paper,
        field,
        label,
        placeholder
    ) => {
        const metadata = getMetadata(paper);

        return (
            <div className="citation-form-field">
                <label>{label}</label>

                <input
                    type="text"
                    value={metadata[field] || ""}
                    placeholder={placeholder}
                    onChange={(event) =>
                        updateMetadata(
                            paper,
                            field,
                            event.target.value
                        )
                    }
                />
            </div>
        );
    };

    return (
        <main className="citation-page">
            <div className="citation-header">
                <div>
                    <span className="citation-label">
                        ACADEMIC RESEARCH TOOLS
                    </span>

                    <h1>Citation Manager</h1>

                    <p>
                        Generate, manage and organize academic
                        references for your research papers.
                    </p>
                </div>

                <div className="citation-style">
                    <label htmlFor="citationStyle">
                        Citation Style
                    </label>

                    <select
                        id="citationStyle"
                        value={citationStyle}
                        onChange={(event) =>
                            setCitationStyle(event.target.value)
                        }
                    >
                        <option value="APA">APA 7th Edition</option>
                        <option value="MLA">MLA 9th Edition</option>
                        <option value="Chicago">Chicago</option>
                        <option value="IEEE">IEEE</option>
                    </select>
                </div>
            </div>

            <section className="citation-summary">
                <div>
                    <span>📚</span>
                    <strong>{papers.length}</strong>
                    <p>Research Papers</p>
                </div>

                <div>
                    <span>📝</span>
                    <strong>{papers.length}</strong>
                    <p>Generated References</p>
                </div>

                <div>
                    <span>✓</span>
                    <strong>{completeCount}</strong>
                    <p>Complete Metadata</p>
                </div>

                <div>
                    <span>⚙️</span>
                    <strong>{citationStyle}</strong>
                    <p>Selected Style</p>
                </div>
            </section>

            <section className="citation-list-section">
                <div className="citation-section-heading">
                    <div>
                        <h2>Your References</h2>

                        <span>
                            {filteredPapers.length} papers found
                        </span>
                    </div>

                    <div className="citation-toolbar">
                        <input
                            type="text"
                            className="citation-search"
                            placeholder="Search title, author or journal..."
                            value={searchQuery}
                            onChange={(event) =>
                                setSearchQuery(event.target.value)
                            }
                        />

                        <button
                            type="button"
                            className="citation-copy-all"
                            onClick={copyAllReferences}
                            disabled={filteredPapers.length === 0}
                        >
                            {copiedId === "all"
                                ? "✓ Copied All"
                                : "Copy All References"}
                        </button>
                    </div>
                </div>

                {copyMessage && (
                    <div className="citation-feedback">
                        {copyMessage}
                    </div>
                )}

                {loading ? (
                    <div className="citation-empty">
                        <h3>Loading research papers...</h3>
                    </div>
                ) : error ? (
                    <div className="citation-empty">
                        <h3>Unable to load references</h3>
                        <p>{error}</p>
                    </div>
                ) : filteredPapers.length > 0 ? (
                    <div className="citation-list">
                        {filteredPapers.map((paper, index) => {
                            const metadata = getMetadata(paper);

                            const citation = generateCitation(
                                metadata,
                                citationStyle,
                                index
                            );

                            const inTextCitation =
                                generateInTextCitation(
                                    metadata,
                                    citationStyle,
                                    index
                                );

                            const isComplete = Boolean(
                                metadata.authors.trim() &&
                                metadata.year.trim() &&
                                metadata.title.trim() &&
                                (
                                    metadata.journal.trim() ||
                                    metadata.doi.trim() ||
                                    metadata.url.trim()
                                )
                            );

                            return (
                                <article
                                    key={paper.id}
                                    className="citation-card"
                                >
                                    <div className="citation-card-header">
                                        <div>
                                            <span className="citation-type">
                                                {citationStyle}
                                            </span>

                                            <h3>
                                                {metadata.title}
                                            </h3>

                                            <span
                                                className={
                                                    isComplete
                                                        ? "citation-status complete"
                                                        : "citation-status incomplete"
                                                }
                                            >
                                                {isComplete
                                                    ? "Metadata complete"
                                                    : "Metadata incomplete"}
                                            </span>
                                        </div>

                                        <div className="citation-actions">
                                            <button
                                                type="button"
                                                className="copy-button"
                                                onClick={() =>
                                                    copyText(
                                                        citation,
                                                        paper.id
                                                    )
                                                }
                                            >
                                                {copiedId === paper.id
                                                    ? "✓ Copied"
                                                    : "Copy Citation"}
                                            </button>
                                        </div>
                                    </div>

                                    <div className="citation-result">
                                        <span>GENERATED REFERENCE</span>
                                        <p>{citation}</p>
                                    </div>

                                    <div className="citation-intext">
                                        <div>
                                            <span>IN-TEXT CITATION</span>
                                            <strong>
                                                {inTextCitation}
                                            </strong>
                                        </div>

                                        <button
                                            type="button"
                                            onClick={() =>
                                                copyText(
                                                    inTextCitation,
                                                    `intext-${paper.id}`
                                                )
                                            }
                                        >
                                            {copiedId ===
                                            `intext-${paper.id}`
                                                ? "Copied"
                                                : "Copy"}
                                        </button>
                                    </div>

                                    <div className="citation-edit-actions">
                                        <button
                                            type="button"
                                            className="citation-edit-button"
                                            onClick={() =>
                                                setEditingId(
                                                    editingId === paper.id
                                                        ? null
                                                        : paper.id
                                                )
                                            }
                                        >
                                            {editingId === paper.id
                                                ? "Close Details"
                                                : "Edit Bibliographic Details"}
                                        </button>
                                    </div>

                                    {editingId === paper.id && (
                                        <div className="citation-editor">
                                            <div className="citation-editor-heading">
                                                <h4>
                                                    Bibliographic Details
                                                </h4>

                                                <p>
                                                    Enter the details
                                                    from the original
                                                    research paper.
                                                </p>
                                            </div>

                                            {renderMetadataField(
                                                paper,
                                                "authors",
                                                "Author(s)",
                                                "e.g. Sharma, A.; Verma, R."
                                            )}

                                            {renderMetadataField(
                                                paper,
                                                "year",
                                                "Publication Year",
                                                "e.g. 2024"
                                            )}

                                            {renderMetadataField(
                                                paper,
                                                "title",
                                                "Paper Title",
                                                "Enter original paper title"
                                            )}

                                            {renderMetadataField(
                                                paper,
                                                "journal",
                                                "Journal / Conference",
                                                "Enter journal name"
                                            )}

                                            <div className="citation-form-grid">
                                                {renderMetadataField(
                                                    paper,
                                                    "volume",
                                                    "Volume",
                                                    "e.g. 12"
                                                )}

                                                {renderMetadataField(
                                                    paper,
                                                    "issue",
                                                    "Issue",
                                                    "e.g. 2"
                                                )}

                                                {renderMetadataField(
                                                    paper,
                                                    "pages",
                                                    "Page Numbers",
                                                    "e.g. 45-58"
                                                )}
                                            </div>

                                            {renderMetadataField(
                                                paper,
                                                "doi",
                                                "DOI",
                                                "e.g. 10.1234/example"
                                            )}

                                            {renderMetadataField(
                                                paper,
                                                "url",
                                                "Paper URL",
                                                "https://example.com/paper"
                                            )}

                                            <div className="citation-editor-note">
                                                Details are saved
                                                automatically in this
                                                browser.
                                            </div>

                                            <button
                                                type="button"
                                                className="citation-save-button"
                                                onClick={() =>
                                                    setEditingId(null)
                                                }
                                            >
                                                Save Details
                                            </button>
                                        </div>
                                    )}
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <div className="citation-empty">
                        <div>📚</div>

                        <h3>No research papers found</h3>

                        <p>
                            Upload a research paper or try another
                            search term.
                        </p>
                    </div>
                )}
            </section>
        </main>
    );
}

export default CitationManager;
