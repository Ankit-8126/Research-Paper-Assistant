
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { getPapers } from "../services/api";
import "../styles/my-research.css";

function MyResearch() {
    const [savedPapers, setSavedPapers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchPapers = async () => {
            try {
                const data = await getPapers();

                const formattedPapers = data.map((paper) => ({
                    id: paper.id,
                    title: paper.title,
                    file_name: paper.file_name,
                    category: "Research Paper",
                    status: "Saved",
                }));

                setSavedPapers(formattedPapers);

            } catch (error) {
                console.error(error);
                setError(error.message || "Unable to load research papers.");
            } finally {
                setLoading(false);
            }
        };

        fetchPapers();
    }, []);

    const filteredPapers = savedPapers.filter((paper) => {
        const search = searchQuery.toLowerCase();

        return (
            paper.title.toLowerCase().includes(search) ||
            paper.file_name.toLowerCase().includes(search) ||
            paper.category.toLowerCase().includes(search)
        );
    });

    return (
        <main className="my-research-page">

            <section className="my-research-header">
                <div>
                    <span className="my-research-eyebrow">
                        YOUR RESEARCH LIBRARY
                    </span>

                    <h1>My Research</h1>

                    <p>
                        Keep your important research papers organized
                        and easy to revisit.
                    </p>
                </div>

                <Link
                    to="/search"
                    className="my-research-primary-button"
                >
                    + Find Papers
                </Link>
            </section>

            <section className="my-research-summary">

                <div className="research-summary-item">
                    <span>Total Papers</span>
                    <strong>{savedPapers.length}</strong>
                </div>

                <div className="research-summary-item">
                    <span>Saved</span>
                    <strong>{savedPapers.length}</strong>
                </div>

                <div className="research-summary-item">
                    <span>In Review</span>
                    <strong>0</strong>
                </div>

            </section>

            <section className="my-research-toolbar">

                <div className="my-research-search">
                    <span>⌕</span>

                    <input
                        type="text"
                        placeholder="Search your research library..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>

                <span className="my-research-result-count">
                    {filteredPapers.length}{" "}
                    {filteredPapers.length === 1 ? "paper" : "papers"}
                </span>

            </section>

            <section className="my-research-list">

                {loading ? (
                    <div className="my-research-empty">
                        <h2>Loading your research papers...</h2>
                        <p>Please wait while we fetch your papers.</p>
                    </div>

                ) : error ? (
                    <div className="my-research-empty">
                        <h2>Unable to load papers</h2>
                        <p>{error}</p>
                    </div>

                ) : filteredPapers.length > 0 ? (
                    filteredPapers.map((paper) => (
                        <article
                            className="research-paper-card"
                            key={paper.id}
                        >

                            <div className="research-paper-index">
                                <span>
                                    {String(paper.id).padStart(2, "0")}
                                </span>
                            </div>

                            <div className="research-paper-main">

                                <div className="research-paper-top">

                                    <span className="research-paper-category">
                                        {paper.category}
                                    </span>

                                    <span className="research-paper-status status-saved">
                                        {paper.status}
                                    </span>

                                </div>

                                <Link
                                    to={`/paper/${paper.id}`}
                                    className="research-paper-title"
                                >
                                    {paper.title}
                                </Link>

                                <p className="research-paper-authors">
                                    {paper.file_name}
                                </p>

                                <div className="research-paper-meta">
                                    <span>PDF Document</span>
                                </div>

                            </div>

                            <div className="research-paper-actions">

                                <Link
                                    to={`/paper/${paper.id}`}
                                    className="paper-view-button"
                                >
                                    View Paper
                                </Link>

                            </div>

                        </article>
                    ))

                ) : (
                    <div className="my-research-empty">

                        <div className="empty-research-icon">
                            □
                        </div>

                        <h2>No research papers found</h2>

                        <p>
                            {searchQuery
                                ? "Try a different search term."
                                : "Start building your research library by uploading research papers."}
                        </p>

                        {!searchQuery && (
                            <Link
                                to="/upload"
                                className="my-research-primary-button"
                            >
                                Upload Paper
                            </Link>
                        )}

                    </div>
                )}

            </section>

        </main>
    );
}

export default MyResearch;
