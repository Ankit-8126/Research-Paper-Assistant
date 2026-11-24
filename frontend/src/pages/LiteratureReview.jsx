
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../styles/literature-review.css";
import { getPapers } from "../services/api";

function LiteratureReview() {
    const navigate = useNavigate();

    const [papers, setPapers] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("All");
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const loadPapers = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getPapers();

                const paperList = Array.isArray(data) ? data : [];

                const updatedPapers = paperList.map((paper) => ({
                    ...paper,
                    status: "To Review",
                }));

                setPapers(updatedPapers);
            } catch (err) {
                setError(err.message || "Unable to load research papers.");
            } finally {
                setLoading(false);
            }
        };

        loadPapers();
    }, []);

    const updateStatus = (id, newStatus) => {
        setPapers((currentPapers) =>
            currentPapers.map((paper) =>
                paper.id === id
                    ? { ...paper, status: newStatus }
                    : paper
            )
        );
    };

    const handleOpenPaper = () => {
        if (papers.length > 0) {
            navigate(`/paper/${papers[0].id}`);
        } else {
            navigate("/upload");
        }
    };

    const filteredPapers = papers.filter((paper) => {
        const search = searchQuery.toLowerCase().trim();

        const title = (paper.title || "").toLowerCase();
        const fileName = (paper.file_name || "").toLowerCase();

        const matchesSearch =
            title.includes(search) ||
            fileName.includes(search);

        const matchesStatus =
            statusFilter === "All" ||
            paper.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const completedCount = papers.filter(
        (paper) => paper.status === "Completed"
    ).length;

    const inProgressCount = papers.filter(
        (paper) => paper.status === "In Progress"
    ).length;

    const toReviewCount = papers.filter(
        (paper) => paper.status === "To Review"
    ).length;

    const progressPercentage =
        papers.length > 0
            ? Math.round((completedCount / papers.length) * 100)
            : 0;

    return (
        <main className="literature-review-page">

            <section className="literature-header">

                <div>
                    <span className="literature-eyebrow">
                        LITERATURE WORKSPACE
                    </span>

                    <h1>
                        Build your
                        <br />
                        literature review.
                    </h1>

                    <p>
                        Organize research papers, track your reading
                        progress, and prepare a structured literature review.
                    </p>
                </div>

                <button
                    type="button"
                    className="literature-primary-button"
                    onClick={handleOpenPaper}
                >
                    {papers.length > 0
                        ? "Open First Paper"
                        : "Upload a Paper"}
                </button>

            </section>

            <section className="literature-overview">

                <div className="literature-overview-card">
                    <span>TOTAL PAPERS</span>
                    <strong>{papers.length}</strong>
                    <small>In your review workspace</small>
                </div>

                <div className="literature-overview-card">
                    <span>COMPLETED</span>
                    <strong>{completedCount}</strong>
                    <small>Research papers reviewed</small>
                </div>

                <div className="literature-overview-card">
                    <span>IN PROGRESS</span>
                    <strong>{inProgressCount}</strong>
                    <small>Currently being analyzed</small>
                </div>

                <div className="literature-overview-card">
                    <span>TO REVIEW</span>
                    <strong>{toReviewCount}</strong>
                    <small>Papers waiting for review</small>
                </div>

            </section>

            <section className="literature-progress">

                <div className="literature-progress-heading">
                    <div>
                        <span>REVIEW PROGRESS</span>
                        <h2>Research coverage</h2>
                    </div>

                    <strong>{progressPercentage}%</strong>
                </div>

                <div className="literature-progress-track">
                    <span
                        style={{
                            width: `${progressPercentage}%`,
                        }}
                    ></span>
                </div>

                <p>
                    {completedCount} of {papers.length} papers have been
                    completed.
                </p>

            </section>

            <section className="literature-toolbar">

                <div className="literature-search">
                    <span>⌕</span>

                    <input
                        type="text"
                        placeholder="Search your literature..."
                        value={searchQuery}
                        onChange={(e) =>
                            setSearchQuery(e.target.value)
                        }
                    />
                </div>

                <div className="literature-filter">
                    <label htmlFor="literature-status">
                        STATUS
                    </label>

                    <select
                        id="literature-status"
                        value={statusFilter}
                        onChange={(e) =>
                            setStatusFilter(e.target.value)
                        }
                    >
                        <option value="All">All Statuses</option>
                        <option value="To Review">To Review</option>
                        <option value="In Progress">In Progress</option>
                        <option value="Completed">Completed</option>
                    </select>
                </div>

            </section>

            <section className="literature-list">

                <div className="literature-list-heading">
                    <div>
                        <span>RESEARCH PAPERS</span>
                        <h2>
                            {filteredPapers.length}{" "}
                            {filteredPapers.length === 1
                                ? "paper"
                                : "papers"}
                        </h2>
                    </div>

                    <span>
                        Update each paper as you progress
                    </span>
                </div>

                {loading ? (
                    <div className="literature-empty">
                        <h2>Loading research papers...</h2>
                    </div>
                ) : error ? (
                    <div className="literature-empty">
                        <h2>Unable to load research papers</h2>
                        <p>{error}</p>
                    </div>
                ) : filteredPapers.length > 0 ? (
                    filteredPapers.map((paper, index) => (
                        <article
                            className="literature-paper-card"
                            key={paper.id}
                        >

                            <div className="literature-paper-number">
                                {String(index + 1).padStart(2, "0")}
                            </div>

                            <div className="literature-paper-main">

                                <div className="literature-paper-top">
                                    <span>
                                        Uploaded Research Paper
                                    </span>

                                    <span
                                        className={`literature-status ${
                                            paper.status === "Completed"
                                                ? "literature-status-completed"
                                                : paper.status === "In Progress"
                                                    ? "literature-status-progress"
                                                    : "literature-status-review"
                                        }`}
                                    >
                                        {paper.status}
                                    </span>
                                </div>

                                <Link
                                    to={`/paper/${paper.id}`}
                                    className="literature-paper-title"
                                >
                                    {paper.title || paper.file_name}
                                </Link>

                                <p className="literature-paper-authors">
                                    Author details not available
                                </p>

                                <div className="literature-paper-meta">
                                    <span>Publication year not available</span>
                                    <span>•</span>
                                    <span>
                                        Research paper #{paper.id}
                                    </span>
                                </div>

                            </div>

                            <div className="literature-paper-actions">

                                <select
                                    value={paper.status}
                                    onChange={(e) =>
                                        updateStatus(
                                            paper.id,
                                            e.target.value
                                        )
                                    }
                                    aria-label={`Update status for ${
                                        paper.title || paper.file_name
                                    }`}
                                >
                                    <option value="To Review">
                                        To Review
                                    </option>
                                    <option value="In Progress">
                                        In Progress
                                    </option>
                                    <option value="Completed">
                                        Completed
                                    </option>
                                </select>

                                <Link
                                    to={`/paper/${paper.id}`}
                                    className="literature-view-button"
                                >
                                    View Paper
                                </Link>

                            </div>

                        </article>
                    ))
                ) : (
                    <div className="literature-empty">

                        <div className="literature-empty-icon">
                            ≡
                        </div>

                        <h2>
                            {papers.length === 0
                                ? "No research papers uploaded"
                                : "No research papers found"}
                        </h2>

                        <p>
                            {papers.length === 0
                                ? "Upload a PDF to add it to your literature workspace."
                                : "Try changing your search or status filter."}
                        </p>

                        <Link
                            to="/upload"
                            className="literature-secondary-button"
                        >
                            Upload Research Paper
                        </Link>

                    </div>
                )}

            </section>

            <section className="literature-bottom">

                <div>
                    <span>RESEARCH WORKFLOW</span>

                    <h2>
                        Discover. Compare. Understand.
                    </h2>

                    <p>
                        Keep your research organized while building a
                        stronger understanding of the existing literature.
                    </p>
                </div>

                <Link
                    to="/citations"
                    className="literature-secondary-button"
                >
                    Manage Citations →
                </Link>

            </section>

        </main>
    );
}

export default LiteratureReview;
