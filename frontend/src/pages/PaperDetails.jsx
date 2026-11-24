
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import "../styles/paper-details.css";

import {
    getPapers,
    extractPaperText,
    getPaperSummary,
    getPaperKeyPoints,
    getPaperPdf,
} from "../services/api";

// Render Markdown bold text
function renderBoldText(text) {
    const cleanedText = text
        .split("\n")
        .map((line) => {
            const boldCount = (line.match(/\*\*/g) || []).length;

            if (boldCount % 2 !== 0) {
                line = line.replace(/\*\*(?![\s\S]*\*\*)/, "");
            }

            return line.replace(/(?<!\*)\*(?!\*)/g, "");
        })
        .join("\n");

    const parts = cleanedText.split(/(\*\*.*?\*\*)/g);

    return parts.map((part, index) => {
        if (part.startsWith("**") && part.endsWith("**")) {
            return (
                <strong key={index}>
                    {part.slice(2, -2)}
                </strong>
            );
        }

        return part;
    });
}

// Split AI summary into separate sections
function formatSummary(summary) {
    if (!summary) return [];

    return summary
        .replace(/\r/g, "")
        .split(/(?=\*\*\s*\d+\.\s*[^*]+\*\*)/g)
        .map((section) => section.trim())
        .filter((section) => section.length > 0);
}

// Clean and format AI key points
function formatKeyPoints(points) {
    if (!points) return [];

    const pointList = Array.isArray(points)
        ? points
        : points.split("\n");

    const formattedPoints = pointList
        .map((point) => {
            return String(point)
                .replace(/\*\*/g, "")
                .replace(/^[\s\-*•\d.)]+/, "")
                .trim();
        })
        .filter((point) => {
            if (!point) return false;

            const heading =
                /^(main contributions|key findings|research limitations|conclusion)\s*:?\s*$/i;

            return !heading.test(point);
        });

    return formattedPoints;
}

function PaperDetails() {
    const { id } = useParams();

    const [paper, setPaper] = useState(null);
    const [summary, setSummary] = useState("");
    const [keyPoints, setKeyPoints] = useState([]);

    const [pdfUrl, setPdfUrl] = useState("");
    const [pdfLoading, setPdfLoading] = useState(true);
    const [pdfError, setPdfError] = useState("");

    const [saved, setSaved] = useState(false);
    const [citation, setCitation] = useState("");
    const [copied, setCopied] = useState(false);

    const [loading, setLoading] = useState(true);
    const [analyzing, setAnalyzing] = useState(false);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadPaper = async () => {
            try {
                setLoading(true);
                setError("");

                setPaper(null);
                setSummary("");
                setKeyPoints([]);

                setPdfUrl("");
                setPdfLoading(true);
                setPdfError("");

                const papers = await getPapers();

                let selectedPaper = null;

                for (const item of papers) {
                    if (String(item.id) === String(id)) {
                        selectedPaper = item;
                        break;
                    }
                }

                if (!selectedPaper) {
                    setError("Paper not found.");
                    return;
                }

                setPaper(selectedPaper);
                setAnalyzing(true);

                // Fetch original PDF
                try {
                    const pdfBlob = await getPaperPdf(id);
                    const objectUrl = URL.createObjectURL(pdfBlob);

                    setPdfUrl(objectUrl);
                } catch (pdfErr) {
                    setPdfError(
                        pdfErr.message || "Unable to load PDF."
                    );
                } finally {
                    setPdfLoading(false);
                }

                // Extract text from uploaded PDF
                await extractPaperText(id);

                // Generate AI summary and key points
                const results = await Promise.allSettled([
                    getPaperSummary(id),
                    getPaperKeyPoints(id),
                ]);

                if (results[0].status === "fulfilled") {
                    setSummary(results[0].value.summary || "");
                }

                if (results[1].status === "fulfilled") {
                    const points =
                        results[1].value.key_points || "";

                    setKeyPoints(formatKeyPoints(points));
                }

                if (
                    results[0].status === "rejected" &&
                    results[1].status === "rejected"
                ) {
                    setError(
                        "PDF extracted, but AI analysis could not be generated. Please try again."
                    );
                }
            } catch (err) {
                setError(
                    err.message || "Unable to load this paper."
                );
            } finally {
                setLoading(false);
                setAnalyzing(false);
            }
        };

        loadPaper();

        return () => {
            setPdfUrl((currentUrl) => {
                if (currentUrl) {
                    URL.revokeObjectURL(currentUrl);
                }

                return "";
            });
        };
    }, [id]);

    // Generate citation
    const generateCitation = () => {
        if (!paper) return;

        const title =
            paper.title || paper.file_name || "Research Paper";

        const generatedCitation =
            `${title}. Research Paper Assistant.`;

        setCitation(generatedCitation);
        setCopied(false);
    };

    // Copy citation
    const copyCitation = async () => {
        if (!citation) return;

        try {
            await navigator.clipboard.writeText(citation);

            setCopied(true);

            setTimeout(() => {
                setCopied(false);
            }, 1800);
        } catch {
            setCopied(false);
        }
    };

    // Loading screen
    if (loading) {
        return (
            <main className="paper-details-page">
                <section className="paper-not-found">
                    <h1>Loading Research Paper...</h1>

                    <p>
                        Please wait while we load your paper
                        and generate AI analysis.
                    </p>
                </section>
            </main>
        );
    }

    // Paper not found
    if (!paper) {
        return (
            <main className="paper-details-page">
                <section className="paper-not-found">
                    <span>RESEARCH PAPER</span>

                    <h1>Paper not found</h1>

                    <p>
                        {error ||
                            "The research paper could not be found in your library."}
                    </p>

                    <Link
                        to="/search"
                        className="paper-details-primary-button"
                    >
                        Back to Papers
                    </Link>
                </section>
            </main>
        );
    }

    const summarySections = formatSummary(summary);

    return (
        <main className="paper-details-page">

            {/* Breadcrumb */}
            <div className="paper-breadcrumb">
                <Link to="/search">Papers</Link>
                <span>→</span>
                <span>Paper Details</span>
            </div>

            {/* Paper Header */}
            <section className="paper-details-header">

                <div className="paper-details-category">
                    RESEARCH PAPER
                </div>

                <h1>
                    {paper.title || paper.file_name}
                </h1>

                <p className="paper-details-authors">
                    Uploaded PDF: {paper.file_name}
                </p>

                <div className="paper-details-meta">
                    <span>Research Paper Assistant</span>
                    <span>•</span>
                    <span>Paper ID: {paper.id}</span>
                </div>

                <div className="paper-details-actions">

                    <button
                        type="button"
                        className={
                            saved
                                ? "paper-action-button saved"
                                : "paper-action-button"
                        }
                        onClick={() => setSaved(!saved)}
                    >
                        {saved
                            ? "Saved to Research"
                            : "Save to Research"}
                    </button>

                    <Link
                        to={`/chat?paperId=${id}`}
                        className="paper-ai-button"
                    >
                        Ask Research AI
                    </Link>

                </div>

            </section>

            {/* Paper Layout */}
            <section className="paper-details-layout">

                {/* Main Content */}
                <article className="paper-details-main">

                    {error && (
                        <div className="paper-content-section">
                            <p>{error}</p>
                        </div>
                    )}

                    {/* AI Summary */}
                    <section className="paper-content-section">

                        <span className="paper-section-label">
                            AI SUMMARY
                        </span>

                        <h2>About this research</h2>

                        {analyzing && !summary ? (
                            <p className="paper-abstract">
                                Generating AI summary...
                            </p>
                        ) : summarySections.length > 0 ? (
                            <div className="paper-abstract">
                                {summarySections.map(
                                    (section, index) => {
                                        const headingMatch =
                                            section.match(
                                                /^\*\*\s*\d+\.\s*(.*?)\*\*\s*/
                                            );

                                        const heading = headingMatch
                                            ? headingMatch[1]
                                            : "";

                                        const content = headingMatch
                                            ? section
                                                .slice(headingMatch[0].length)
                                                .trim()
                                            : section;

                                        return (
                                            <p key={index}>
                                                {heading && (
                                                    <>
                                                        <strong>
                                                            {heading}
                                                        </strong>
                                                        {" "}
                                                    </>
                                                )}

                                                {renderBoldText(content)}
                                            </p>
                                        );
                                    }
                                )}
                            </div>
                        ) : (
                            <p className="paper-abstract">
                                AI summary is not available.
                            </p>
                        )}

                    </section>

                    {/* Key Findings */}
                    <section className="paper-content-section">

                        <span className="paper-section-label">
                            KEY FINDINGS
                        </span>

                        <h2>Research key points</h2>

                        {analyzing && keyPoints.length === 0 ? (
                            <p>Generating key points...</p>
                        ) : keyPoints.length > 0 ? (
                            <div className="paper-findings">

                                {keyPoints.map((point, index) => (
                                    <div
                                        className="paper-finding"
                                        key={index}
                                    >
                                        <span>
                                            {String(index + 1).padStart(2, "0")}
                                        </span>

                                        <p>
                                            {renderBoldText(point)}
                                        </p>
                                    </div>
                                ))}

                            </div>
                        ) : (
                            <p>Key points are not available.</p>
                        )}

                    </section>

                    {/* Uploaded Document */}
                    <section className="paper-content-section">

                        <span className="paper-section-label">
                            DOCUMENT
                        </span>

                        <h2>Uploaded research paper</h2>

                        <div className="paper-keywords">
                            <span>{paper.file_name}</span>
                        </div>

                        <div className="paper-document-actions">

                            {pdfLoading ? (
                                <p>Loading PDF...</p>
                            ) : pdfError ? (
                                <p>{pdfError}</p>
                            ) : pdfUrl ? (
                                <>
                                    <a
                                        href={pdfUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="paper-details-primary-button"
                                    >
                                        View PDF
                                    </a>

                                    <a
                                        href={pdfUrl}
                                        download={paper.file_name}
                                        className="paper-details-secondary-button"
                                    >
                                        Download PDF
                                    </a>
                                </>
                            ) : (
                                <p>PDF is not available.</p>
                            )}

                        </div>

                    </section>

                </article>

                {/* Sidebar */}
                <aside className="paper-details-sidebar">

                    {/* Paper Information */}
                    <div className="paper-sidebar-card">

                        <span className="paper-sidebar-label">
                            PAPER INFORMATION
                        </span>

                        <div className="paper-info-row">
                            <span>Category</span>
                            <strong>Research Paper</strong>
                        </div>

                        <div className="paper-info-row">
                            <span>File Name</span>
                            <strong>{paper.file_name}</strong>
                        </div>

                        <div className="paper-info-row">
                            <span>Paper ID</span>
                            <strong>#{paper.id}</strong>
                        </div>

                        <div className="paper-info-row">
                            <span>Analysis</span>
                            <strong>
                                {analyzing
                                    ? "In Progress"
                                    : summary || keyPoints.length > 0
                                        ? "Completed"
                                        : "Unavailable"}
                            </strong>
                        </div>

                    </div>

                    {/* Citation */}
                    <div className="paper-sidebar-card citation-card">

                        <span className="paper-sidebar-label">
                            CITATION
                        </span>

                        <h3>Generate reference</h3>

                        <p>
                            Create a basic reference for this
                            uploaded research paper.
                        </p>

                        <button
                            type="button"
                            className="citation-generate-button"
                            onClick={generateCitation}
                        >
                            Generate Citation
                        </button>

                        {citation && (
                            <div className="citation-result">

                                <p>{citation}</p>

                                <button
                                    type="button"
                                    className="citation-copy-button"
                                    onClick={copyCitation}
                                >
                                    {copied
                                        ? "Copied"
                                        : "Copy Citation"}
                                </button>

                            </div>
                        )}

                    </div>

                    {/* Research AI */}
                    <div className="paper-sidebar-card ai-card">

                        <span className="paper-sidebar-label">
                            RESEARCH AI
                        </span>

                        <h3>
                            Have questions about this paper?
                        </h3>

                        <p>
                            Ask questions about the research,
                            methodology, findings, or concepts.
                        </p>

                        <Link
                            to={`/chat?paperId=${id}`}
                            className="paper-ai-sidebar-button"
                        >
                            Ask Research AI →
                        </Link>

                    </div>

                </aside>

            </section>

            {/* Bottom Navigation */}
            <section className="paper-details-bottom">

                <div>
                    <span>CONTINUE RESEARCHING</span>

                    <h2>
                        Explore more research papers.
                    </h2>

                    <p>
                        Discover related studies and continue
                        building your research library.
                    </p>
                </div>

                <Link
                    to="/search"
                    className="paper-details-secondary-button"
                >
                    Explore Papers →
                </Link>

            </section>

        </main>
    );
}

export default PaperDetails;
