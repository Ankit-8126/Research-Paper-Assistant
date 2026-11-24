
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPapers } from "../services/api";
import "../styles/search.css";

function SearchPapers() {
    const [papers, setPapers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getPapers();

                setPapers(data);
            } catch (error) {
                console.error(error);
                setError(
                    error.message || "Unable to load research papers."
                );
            } finally {
                setLoading(false);
            }
        };

        fetchPapers();
    }, []);

    const filteredPapers = papers.filter((paper) => {
        const search = searchQuery.toLowerCase().trim();

        return (
            paper.title?.toLowerCase().includes(search) ||
            paper.file_name?.toLowerCase().includes(search)
        );
    });

    const clearSearch = () => {
        setSearchQuery("");
    };

    return (
        <main className="search-page">

            <section className="search-header">
                <div>
                    <span className="search-eyebrow">
                        RESEARCH DISCOVERY
                    </span>

                    <h1>
                        Find the research
                        <br />
                        you need.
                    </h1>

                    <p>
                        Explore your uploaded academic papers,
                        discover relevant studies, and build your
                        research library.
                    </p>
                </div>

                <div className="search-header-note">
                    <span>RESEARCH LIBRARY</span>
                    <strong>{papers.length}</strong>
                    <small>Available papers</small>
                </div>
            </section>

            <section className="search-controls">

                <div className="main-search-box">
                    <span className="search-icon">⌕</span>

                    <input
                        type="text"
                        placeholder="Search papers by title or filename..."
                        value={searchQuery}
                        onChange={(e) =>
                            setSearchQuery(e.target.value)
                        }
                    />
                </div>

                {searchQuery.trim() !== "" && (
                    <div className="search-filter-row">
                        <button
                            type="button"
                            className="clear-search-button"
                            onClick={clearSearch}
                        >
                            Clear Search
                        </button>
                    </div>
                )}

            </section>

            <section className="search-results-heading">

                <div>
                    <span>SEARCH RESULTS</span>

                    <h2>
                        {loading
                            ? "Loading papers..."
                            : `${filteredPapers.length} ${
                                filteredPapers.length === 1
                                    ? "paper"
                                    : "papers"
                            } found`}
                    </h2>
                </div>

                <span className="search-results-description">
                    Showing papers from your research library
                </span>

            </section>

            <section className="search-results">

                {loading ? (
                    <div className="search-empty">
                        <h2>Loading research papers...</h2>
                        <p>Please wait while we fetch your papers.</p>
                    </div>

                ) : error ? (
                    <div className="search-empty">
                        <h2>Unable to load papers</h2>
                        <p>{error}</p>
                    </div>

                ) : filteredPapers.length > 0 ? (
                    filteredPapers.map((paper, index) => (
                        <article
                            className="search-paper-card"
                            key={paper.id}
                        >

                            <div className="search-paper-number">
                                {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="search-paper-content">

                                <div className="search-paper-meta-top">
                                    <span>Research Paper</span>

                                    <span className="search-paper-year">
                                        PDF Document
                                    </span>
                                </div>

                                <Link
                                    to={`/paper/${paper.id}`}
                                    className="search-paper-title"
                                >
                                    {paper.title}
                                </Link>

                                <p className="search-paper-authors">
                                    {paper.file_name}
                                </p>

                                <p className="search-paper-abstract">
                                    Uploaded research paper available
                                    in your personal research library.
                                </p>

                                <div className="search-paper-footer">

                                    <div className="search-paper-journal">
                                        <span>DOCUMENT</span>

                                        <strong>
                                            PDF Research Paper
                                        </strong>
                                    </div>

                                    <Link
                                        to={`/paper/${paper.id}`}
                                        className="search-view-button"
                                    >
                                        View Paper →
                                    </Link>

                                </div>

                            </div>

                        </article>
                    ))

                ) : (
                    <div className="search-empty">

                        <div className="search-empty-icon">
                            ⌕
                        </div>

                        <h2>
                            {papers.length === 0
                                ? "No research papers available"
                                : "No papers found"}
                        </h2>

                        <p>
                            {papers.length === 0
                                ? "Upload a PDF to start building your research library."
                                : "Try a different search term to find your research papers."}
                        </p>

                        {papers.length === 0 ? (
                            <Link
                                to="/upload"
                                className="search-view-button"
                            >
                                Upload Paper
                            </Link>
                        ) : (
                            <button
                                type="button"
                                className="clear-search-button"
                                onClick={clearSearch}
                            >
                                Reset Search
                            </button>
                        )}

                    </div>
                )}

            </section>

        </main>
    );
}

export default SearchPapers;
