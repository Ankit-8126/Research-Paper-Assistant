
import { useState } from "react";
import { searchPublishedPapers } from "../services/api";
import "../styles/published-papers.css";

function PublishedPapers() {
    const [query, setQuery] = useState("");
    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [searched, setSearched] = useState(false);
    const [totalResults, setTotalResults] = useState(0);

    const handleSearch = async (event) => {
        event.preventDefault();

        if (!query.trim()) {
            setError("Please enter a research topic.");
            return;
        }

        try {
            setLoading(true);
            setError("");
            setSearched(true);
            setPapers([]);

            const data = await searchPublishedPapers(query.trim());

            setPapers(data.papers || []);
            setTotalResults(data.total_results || 0);
        } catch (err) {
            setError(err.message || "Unable to search published papers.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="published-page">
            <div className="published-header">
                <span className="published-label">RESEARCH DISCOVERY</span>

                <h1>Published Research Papers</h1>

                <p>
                    Discover academic research papers from across the world.
                    Search by topic, title, or research keywords.
                </p>

                <form className="published-search" onSubmit={handleSearch}>
                    <input
                        type="text"
                        placeholder="Enter a research topic..."
                        value={query}
                        onChange={(event) => setQuery(event.target.value)}
                    />

                    <button type="submit" disabled={loading}>
                        {loading ? "Searching..." : "Search Papers"}
                    </button>
                </form>

                <div className="published-examples">
                    Try: Generative AI in Healthcare, Machine Learning,
                    Natural Language Processing
                </div>
            </div>

            <div className="published-results">
                {loading && (
                    <div className="published-message">
                        Searching research papers...
                    </div>
                )}

                {error && (
                    <div className="published-error">
                        {error}
                    </div>
                )}

                {!loading && searched && !error && (
                    <>
                        <div className="published-results-heading">
                            <h2>Search Results</h2>

                            <span>
                                {totalResults.toLocaleString()} matching records
                            </span>
                        </div>

                        {papers.length === 0 ? (
                            <div className="published-message">
                                No papers found. Try another research topic.
                            </div>
                        ) : (
                            <div className="published-list">
                                {papers.map((paper, index) => (
                                    <article
                                        className="published-card"
                                        key={paper.id || index}
                                    >
                                        <div className="published-card-top">
                                            <span className="published-year">
                                                {paper.publication_year || "Year unavailable"}
                                            </span>

                                            {paper.is_open_access && (
                                                <span className="open-access">
                                                    Open Access
                                                </span>
                                            )}
                                        </div>

                                        <h3>{paper.title}</h3>

                                        <p className="published-authors">
                                            {paper.authors?.length
                                                ? paper.authors.join(", ")
                                                : "Authors not available"}
                                        </p>

                                        <div className="published-meta">
                                            <span>
                                                {paper.journal || "Journal not available"}
                                            </span>

                                            <span>
                                                {paper.citations || 0} citations
                                            </span>
                                        </div>

                                        <div className="published-abstract">
                                            <h4>Abstract</h4>

                                            <p>{paper.abstract}</p>
                                        </div>

                                        {paper.doi && (
                                            <p className="published-doi">
                                                DOI: {paper.doi}
                                            </p>
                                        )}

                                        <div className="published-actions">
                                            {paper.paper_url && (
                                                <a
                                                    href={paper.paper_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="read-paper-btn"
                                                >
                                                    Read Paper
                                                </a>
                                            )}

                                            {paper.pdf_url && (
                                                <a
                                                    href={paper.pdf_url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="pdf-paper-btn"
                                                >
                                                    View PDF
                                                </a>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {!searched && !loading && (
                    <div className="published-message">
                        Search for a topic to discover published research papers.
                    </div>
                )}
            </div>
        </div>
    );
}

export default PublishedPapers;
