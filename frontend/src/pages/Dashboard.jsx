
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { getPapers } from "../services/api";
import "../styles/dashboard.css";

function Dashboard() {
    const { user } = useAuth();

    const [papers, setPapers] = useState([]);
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                setError("");

                const paperData = await getPapers();
                setPapers(paperData);

                const userId = user?.user_id;

                if (userId) {
                    const storageKey = `researchTrackerTasks_${userId}`;
                    const savedTasks = localStorage.getItem(storageKey);

                    if (savedTasks) {
                        try {
                            const parsedTasks = JSON.parse(savedTasks);
                            setTasks(Array.isArray(parsedTasks) ? parsedTasks : []);
                        } catch {
                            setTasks([]);
                        }
                    } else {
                        setTasks([]);
                    }
                } else {
                    setTasks([]);
                }

            } catch (error) {
                console.error(error);
                setError(error.message || "Unable to load dashboard data.");
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user?.user_id]);

    const totalPapers = papers.length;

    const inReviewPapers = papers.filter((paper) =>
        [
            "Ready for Review",
            "Submitted",
            "Under Review",
            "Revision Required"
        ].includes(paper.status)
    ).length;

    const publishedPapers = papers.filter(
        (paper) => paper.status === "Published"
    ).length;

    const completedTasks = tasks.filter(
        (task) => task.status === "Completed"
    ).length;

    const inProgressTasks = tasks.filter(
        (task) => task.status === "In Progress"
    ).length;

    const totalTasks = tasks.length;

    const taskProgress = totalTasks > 0
        ? Math.round((completedTasks / totalTasks) * 100)
        : 0;

    const reviewProgress = totalPapers > 0
        ? Math.round((inReviewPapers / totalPapers) * 100)
        : 0;

    const publishedProgress = totalPapers > 0
        ? Math.round((publishedPapers / totalPapers) * 100)
        : 0;

    const formatDate = (date) => {
        if (!date) return "Date unavailable";

        return new Date(date).toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });
    };

    const recentPapers = [...papers]
        .sort((a, b) => {
            return new Date(b.created_at || 0) -
                new Date(a.created_at || 0);
        })
        .slice(0, 5);

    return (
        <main className="dashboard-page">

            <section className="dashboard-header">
                <div>
                    <span className="dashboard-eyebrow">
                        RESEARCH WORKSPACE
                    </span>

                    <h1>
                        Welcome back,{" "}
                        <span>{user?.name || "Researcher"}</span>
                    </h1>

                    <p>
                        Continue your research journey and keep your
                        academic work organized.
                    </p>
                </div>

                <Link
                    to="/upload"
                    className="dashboard-primary-button"
                >
                    + Upload Paper
                </Link>
            </section>

            {error && (
                <div className="dashboard-panel">
                    <p>{error}</p>
                    <button onClick={() => window.location.reload()}>
                        Try Again
                    </button>
                </div>
            )}

            <section className="dashboard-stats">

                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">
                        SAVED PAPERS
                    </span>

                    <strong>{loading ? "..." : totalPapers}</strong>

                    <span className="dashboard-stat-note">
                        Papers in your library
                    </span>
                </div>

                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">
                        IN REVIEW
                    </span>

                    <strong>{loading ? "..." : inReviewPapers}</strong>

                    <span className="dashboard-stat-note">
                        Papers submitted or under review
                    </span>
                </div>

                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">
                        CITATIONS
                    </span>

                    <strong>—</strong>

                    <span className="dashboard-stat-note">
                        Citation data not connected yet
                    </span>
                </div>

                <div className="dashboard-stat-card">
                    <span className="dashboard-stat-label">
                        TASKS
                    </span>

                    <strong>{loading ? "..." : totalTasks}</strong>

                    <span className="dashboard-stat-note">
                        Research tasks tracked
                    </span>
                </div>

            </section>

            <section className="dashboard-main-grid">

                <div className="dashboard-panel progress-panel">

                    <div className="dashboard-panel-heading">
                        <div>
                            <span>RESEARCH PROGRESS</span>
                            <h2>Current progress</h2>
                        </div>

                        <Link to="/tracker">
                            View tracker →
                        </Link>
                    </div>

                    <div className="dashboard-progress-list">

                        <div className="dashboard-progress-item">
                            <div className="progress-item-top">
                                <span>Task Completion</span>
                                <strong>{loading ? "..." : `${taskProgress}%`}</strong>
                            </div>

                            <div className="progress-track">
                                <span
                                    style={{ width: `${taskProgress}%` }}
                                ></span>
                            </div>
                        </div>

                        <div className="dashboard-progress-item">
                            <div className="progress-item-top">
                                <span>Papers In Review</span>
                                <strong>{loading ? "..." : `${reviewProgress}%`}</strong>
                            </div>

                            <div className="progress-track">
                                <span
                                    style={{ width: `${reviewProgress}%` }}
                                ></span>
                            </div>
                        </div>

                        <div className="dashboard-progress-item">
                            <div className="progress-item-top">
                                <span>Published Papers</span>
                                <strong>{loading ? "..." : `${publishedProgress}%`}</strong>
                            </div>

                            <div className="progress-track">
                                <span
                                    style={{ width: `${publishedProgress}%` }}
                                ></span>
                            </div>
                        </div>

                    </div>

                    <p className="dashboard-stat-note">
                        Task progress is based on completed tasks.
                        Paper percentages are based on your total uploaded papers.
                    </p>
                </div>

                <div className="dashboard-panel">

                    <div className="dashboard-panel-heading">
                        <div>
                            <span>QUICK ACTIONS</span>
                            <h2>Research tools</h2>
                        </div>
                    </div>

                    <div className="dashboard-actions">

                        <Link to="/search" className="dashboard-action">
                            <div className="dashboard-action-icon">⌕</div>
                            <div>
                                <strong>Search Papers</strong>
                                <span>Discover relevant studies</span>
                            </div>
                            <b>→</b>
                        </Link>

                        <Link to="/upload" className="dashboard-action">
                            <div className="dashboard-action-icon">□</div>
                            <div>
                                <strong>Upload PDF</strong>
                                <span>Analyze a research paper</span>
                            </div>
                            <b>→</b>
                        </Link>

                        <Link to="/chat" className="dashboard-action">
                            <div className="dashboard-action-icon">◌</div>
                            <div>
                                <strong>Ask Research AI</strong>
                                <span>Discuss your research</span>
                            </div>
                            <b>→</b>
                        </Link>

                        <Link to="/citations" className="dashboard-action">
                            <div className="dashboard-action-icon">¶</div>
                            <div>
                                <strong>Manage Citations</strong>
                                <span>Organize your references</span>
                            </div>
                            <b>→</b>
                        </Link>

                    </div>
                </div>

            </section>

            <section className="dashboard-panel dashboard-activity">

                <div className="dashboard-panel-heading">
                    <div>
                        <span>RECENT ACTIVITY</span>
                        <h2>Recently added papers</h2>
                    </div>

                    <Link to="/my-research">
                        View all →
                    </Link>
                </div>

                <div className="activity-list">

                    {loading ? (
                        <p>Loading recent activity...</p>
                    ) : recentPapers.length > 0 ? (
                        recentPapers.map((paper, index) => (
                            <div className="activity-item" key={paper.id}>

                                <div className="activity-marker">
                                    {String(index + 1).padStart(2, "0")}
                                </div>

                                <div className="activity-content">
                                    <strong>{paper.title}</strong>

                                    <span>
                                        Status: {paper.status || "In Progress"}
                                    </span>
                                </div>

                                <time>
                                    {formatDate(paper.created_at)}
                                </time>

                            </div>
                        ))
                    ) : (
                        <div className="my-research-empty">
                            <h3>No research activity yet</h3>
                            <p>
                                Your uploaded research papers will appear here.
                            </p>

                            <Link
                                to="/upload"
                                className="dashboard-primary-button"
                            >
                                Upload Your First Paper
                            </Link>
                        </div>
                    )}

                </div>

            </section>

            <section className="dashboard-bottom">

                <div>
                    <span>KEEP GOING</span>

                    <h2>Continue building your research.</h2>

                    <p>
                        Explore papers, organize your literature,
                        and keep your research progress on track.
                    </p>
                </div>

                <Link
                    to="/search"
                    className="dashboard-secondary-button"
                >
                    Explore Papers →
                </Link>

            </section>

        </main>
    );
}

export default Dashboard;
