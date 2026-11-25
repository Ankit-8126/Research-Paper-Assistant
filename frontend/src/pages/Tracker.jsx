
import { useEffect, useState } from "react";
import { getPapers } from "../services/api";
import { useAuth } from "../context/AuthContext";
import "../styles/tracker.css";

const inReviewStatuses = [
    "Ready for Review",
    "Submitted",
    "Under Review",
    "Revision Required",
];

function Tracker() {
    const { user } = useAuth();

    const [papers, setPapers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        let isActive = true;

        const fetchPapers = async () => {
            try {
                setLoading(true);
                setError("");

                const data = await getPapers();

                if (isActive) {
                    setPapers(Array.isArray(data) ? data : []);
                }
            } catch (err) {
                if (isActive) {
                    setError(err.message || "Unable to load research papers.");
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                }
            }
        };

        if (user?.user_id || user?.id) {
            fetchPapers();
        } else {
            setPapers([]);
            setLoading(false);
        }

        return () => {
            isActive = false;
        };
    }, [user?.user_id, user?.id]);

    const totalPapers = papers.length;

    const inProgress = papers.filter(
        (paper) => paper.status === "In Progress"
    ).length;

    const inReview = papers.filter(
        (paper) => inReviewStatuses.includes(paper.status)
    ).length;

    const published = papers.filter(
        (paper) => paper.status === "Published"
    ).length;

    const progress = totalPapers === 0
        ? 0
        : Math.round((published / totalPapers) * 100);

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        });
    };

    if (loading) {
        return (
            <main className="tracker-page">
                <p>Loading your research papers...</p>
            </main>
        );
    }

    if (error) {
        return (
            <main className="tracker-page">
                <h2>Unable to load Tracker</h2>
                <p>{error}</p>
                <button onClick={() => window.location.reload()}>
                    Try Again
                </button>
            </main>
        );
    }

    return (
        <main className="tracker-page">
            <div className="tracker-header">
                <div>
                    <span className="tracker-label">
                        RESEARCH TRACKER
                    </span>

                    <h1>Track Your Research Progress</h1>

                    <p>
                        Monitor your research papers and their
                        current progress.
                    </p>
                </div>

                <div className="progress-circle">
                    <strong>{progress}%</strong>
                    <span>Published</span>
                </div>
            </div>

            <section className="tracker-overview">
                <div className="tracker-stat">
                    <span>📚</span>
                    <strong>{totalPapers}</strong>
                    <p>Total Papers</p>
                </div>

                <div className="tracker-stat">
                    <span>🔄</span>
                    <strong>{inProgress}</strong>
                    <p>In Progress</p>
                </div>

                <div className="tracker-stat">
                    <span>📝</span>
                    <strong>{inReview}</strong>
                    <p>In Review</p>
                </div>

                <div className="tracker-stat">
                    <span>✅</span>
                    <strong>{published}</strong>
                    <p>Published</p>
                </div>
            </section>

            <section className="tracker-section">
                <div className="tracker-section-heading">
                    <div>
                        <h2>Your Research Papers</h2>
                        <p>
                            Live status of papers from your research library.
                        </p>
                    </div>
                </div>

                <div className="task-list">
                    {papers.length > 0 ? (
                        papers.map((paper) => (
                            <article
                                key={paper.id}
                                className="task-card"
                            >
                                <div className="task-content">
                                    <div className="task-title-row">
                                        <h3>{paper.title}</h3>

                                        <span className="task-status">
                                            {paper.status || "In Progress"}
                                        </span>
                                    </div>

                                    <p>
                                        {paper.file_name}
                                    </p>

                                    <div className="task-actions">
                                        <span>
                                            Uploaded: {formatDate(paper.created_at)}
                                        </span>
                                    </div>
                                </div>
                            </article>
                        ))
                    ) : (
                        <div className="tracker-empty">
                            <div>📚</div>

                            <h3>No research papers found</h3>

                            <p>
                                Upload a research paper to see its
                                progress here.
                            </p>
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}

export default Tracker;
