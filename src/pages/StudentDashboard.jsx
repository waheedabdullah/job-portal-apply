import { useEffect, useState } from "react";
import {
  addDoc,
  collection,
  doc,
  onSnapshot,
  query,
  serverTimestamp,
  updateDoc,
  where,
} from "firebase/firestore";
import { toast } from "react-toastify";
import { db } from "../firebase";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";
import StatusBadge from "../components/StatusBadge";
import Loader from "../components/Loader";
import { byNewest, formatDate } from "../utils/format";
import { analyzeCvWithAI, matchJobWithCv } from "../services/analyzeCv";

export default function StudentDashboard() {
  const { user, profile } = useAuth();
  const [tab, setTab] = useState("browse");
  const [jobs, setJobs] = useState(null);
  const [apps, setApps] = useState(null);
  const [applyingId, setApplyingId] = useState(null);

  const [cvText, setCvText] = useState("");
  const [analysis, setAnalysis] = useState(null);
  const [savingCv, setSavingCv] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);

  const [matchingId, setMatchingId] = useState(null);
  const [matchResult, setMatchResult] = useState(null); // { job, result }

  useEffect(() => {
    setCvText(profile?.cvText || "");
    setAnalysis(profile?.cvAnalysis || null);
  }, [profile?.cvText, profile?.cvAnalysis]);

  useEffect(() => {
    const unsubJobs = onSnapshot(collection(db, "jobs"), (snap) => {
      setJobs(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
    });
    const unsubApps = onSnapshot(
      query(collection(db, "applications"), where("studentId", "==", user.uid)),
      (snap) => {
        setApps(snap.docs.map((d) => ({ id: d.id, ...d.data() })).sort(byNewest));
      }
    );
    return () => {
      unsubJobs();
      unsubApps();
    };
  }, [user.uid]);

  const appliedJobIds = new Set((apps || []).map((a) => a.jobId));
  const hasCv = Boolean((profile?.cvText || cvText || "").trim().length >= 40);

  const handleApply = async (job) => {
    setApplyingId(job.id);
    try {
      await addDoc(collection(db, "applications"), {
        jobId: job.id,
        jobTitle: job.title,
        companyId: job.companyId,
        companyName: job.companyName,
        studentId: user.uid,
        studentName: profile?.name || "",
        studentEmail: user.email,
        status: "pending",
        createdAt: serverTimestamp(),
      });
      toast.success("Application submitted!");
    } catch {
      toast.error("Could not apply. Please try again.");
    } finally {
      setApplyingId(null);
    }
  };

  const saveCv = async () => {
    setSavingCv(true);
    try {
      await updateDoc(doc(db, "users", user.uid), {
        cvText: cvText.trim(),
        cvUpdatedAt: serverTimestamp(),
      });
      toast.success("CV saved.");
    } catch {
      toast.error("Could not save CV. Check Firestore rules are published.");
    } finally {
      setSavingCv(false);
    }
  };

  const analyzeCv = async () => {
    setAnalyzing(true);
    try {
      const result = await analyzeCvWithAI(cvText);
      const payload = {
        ...result,
        analyzedAt: new Date().toISOString(),
      };
      setAnalysis(payload);
      toast.success("AI analysis complete!");

      try {
        await updateDoc(doc(db, "users", user.uid), {
          cvText: cvText.trim(),
          cvUpdatedAt: serverTimestamp(),
          cvAnalysis: payload,
        });
      } catch {
        toast.warn("AI worked, but CV could not be saved to Firestore.");
      }
    } catch (err) {
      toast.error(err.message || "AI analysis failed.");
    } finally {
      setAnalyzing(false);
    }
  };

  const handleMatch = async (job) => {
    const text = (profile?.cvText || cvText || "").trim();
    if (text.length < 40) {
      toast.error("Save your CV first in My CV (AI), then try Match.");
      setTab("cv");
      return;
    }

    setMatchingId(job.id);
    try {
      const result = await matchJobWithCv(text, job);
      setMatchResult({ job, result });
    } catch (err) {
      toast.error(err.message || "Match failed.");
    } finally {
      setMatchingId(null);
    }
  };

  return (
    <>
      <Navbar subtitle="Student" />
      <div className="container">
        <h1>Student Dashboard</h1>
        <p className="muted">
          Browse jobs, check AI match score, and analyze your CV.
        </p>

        <div className="tabs">
          <button
            type="button"
            className={tab === "browse" ? "active" : ""}
            onClick={() => setTab("browse")}
          >
            Browse Jobs {jobs && <span className="tab-count">{jobs.length}</span>}
          </button>
          <button
            type="button"
            className={tab === "apps" ? "active" : ""}
            onClick={() => setTab("apps")}
          >
            My Applications {apps && <span className="tab-count">{apps.length}</span>}
          </button>
          <button
            type="button"
            className={tab === "cv" ? "active" : ""}
            onClick={() => setTab("cv")}
          >
            My CV (AI)
          </button>
        </div>

        {tab === "browse" &&
          (jobs === null ? (
            <Loader />
          ) : jobs.length === 0 ? (
            <div className="card empty">
              No jobs available right now. Please check again later.
            </div>
          ) : (
            <>
              {!hasCv && (
                <p className="muted" style={{ marginBottom: "1rem" }}>
                  Tip: save your CV in <strong>My CV (AI)</strong> to use{" "}
                  <strong>AI Match</strong> on jobs.
                </p>
              )}
              <div className="card-grid">
                {jobs.map((job) => {
                  const applied = appliedJobIds.has(job.id);
                  return (
                    <div className="card job-card" key={job.id}>
                      <h3>{job.title}</h3>
                      <div className="job-company">{job.companyName}</div>
                      <div className="job-meta">
                        <span className="chip">{job.location}</span>
                        <span className="chip">{job.type}</span>
                        {job.salary && <span className="chip">{job.salary}</span>}
                        <span className="chip">{formatDate(job.createdAt)}</span>
                      </div>
                      <p className="job-desc">{job.description}</p>
                      <div className="job-foot">
                        <div className="row-actions">
                          <button
                            type="button"
                            className="btn btn-outline btn-sm"
                            disabled={matchingId === job.id}
                            onClick={() => handleMatch(job)}
                          >
                            {matchingId === job.id ? "Matching..." : "AI Match"}
                          </button>
                          {applied ? (
                            <StatusBadge value="applied" />
                          ) : (
                            <button
                              type="button"
                              className="btn btn-primary btn-sm"
                              disabled={applyingId === job.id}
                              onClick={() => handleApply(job)}
                            >
                              {applyingId === job.id ? "Applying..." : "Apply Now"}
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ))}

        {tab === "apps" &&
          (apps === null ? (
            <Loader />
          ) : apps.length === 0 ? (
            <div className="card empty">
              You have not applied to any jobs yet. Start from "Browse Jobs".
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Job</th>
                    <th>Company</th>
                    <th>Applied On</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {apps.map((a) => (
                    <tr key={a.id}>
                      <td>
                        <strong>{a.jobTitle}</strong>
                      </td>
                      <td>{a.companyName}</td>
                      <td>{formatDate(a.createdAt)}</td>
                      <td>
                        <StatusBadge value={a.status} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

        {tab === "cv" && (
          <div className="cv-layout">
            <form
              className="card form-card"
              onSubmit={(e) => {
                e.preventDefault();
                saveCv();
              }}
            >
              <h2>My CV</h2>
              <p className="muted">
                Paste your CV text below. Then click <strong>Analyze with AI</strong> or use{" "}
                <strong>AI Match</strong> on Browse Jobs.
              </p>
              <div className="field">
                <label>CV Text</label>
                <textarea
                  rows={14}
                  value={cvText}
                  onChange={(e) => setCvText(e.target.value)}
                  placeholder={`Example:\nAli Khan\nFrontend Developer\nSkills: HTML, CSS, JavaScript, React\nExperience: Built 3 React projects...\nEducation: BS Computer Science`}
                  required
                />
              </div>
              <div className="row-actions">
                <button type="submit" className="btn btn-outline" disabled={savingCv || analyzing}>
                  {savingCv ? "Saving..." : "Save CV"}
                </button>
                <button
                  type="button"
                  className="btn btn-primary"
                  disabled={analyzing || savingCv || !cvText.trim()}
                  onClick={analyzeCv}
                >
                  {analyzing ? "Analyzing..." : "Analyze with AI"}
                </button>
              </div>
            </form>

            <div className="card ai-result-card">
              <h2>AI Analysis</h2>
              {!analysis ? (
                <p className="muted empty-inline">
                  No analysis yet. Paste your CV and click Analyze with AI.
                </p>
              ) : (
                <>
                  <div className="ai-score-wrap">
                    <div className="ai-score">{analysis.score}</div>
                    <div>
                      <strong>CV Score</strong>
                      <p className="muted">Out of 100</p>
                    </div>
                  </div>
                  <div className="ai-block">
                    <h3>Summary</h3>
                    <p>{analysis.summary}</p>
                  </div>
                  <div className="ai-block">
                    <h3>Skills</h3>
                    <div className="job-meta">
                      {(analysis.skills || []).map((s) => (
                        <span className="chip" key={s}>
                          {s}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="ai-block">
                    <h3>Strengths</h3>
                    <ul className="ai-list">
                      {(analysis.strengths || []).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                  <div className="ai-block">
                    <h3>Improvements</h3>
                    <ul className="ai-list">
                      {(analysis.improvements || []).map((s) => (
                        <li key={s}>{s}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>

      {matchResult && (
        <div className="modal-backdrop" onClick={() => setMatchResult(null)}>
          <div
            className="card modal-card"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="section-head">
              <div>
                <h2>AI Job Match</h2>
                <p className="muted">
                  {matchResult.job.title} · {matchResult.job.companyName}
                </p>
              </div>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setMatchResult(null)}
              >
                Close
              </button>
            </div>

            <div className="ai-score-wrap">
              <div className="ai-score">{matchResult.result.matchScore}</div>
              <div>
                <strong>{matchResult.result.verdict}</strong>
                <p className="muted">Match score out of 100</p>
              </div>
            </div>

            <div className="ai-block">
              <h3>Matched Skills</h3>
              <div className="job-meta">
                {(matchResult.result.matchedSkills || []).length === 0 ? (
                  <span className="muted">None detected</span>
                ) : (
                  matchResult.result.matchedSkills.map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="ai-block">
              <h3>Missing Skills</h3>
              <div className="job-meta">
                {(matchResult.result.missingSkills || []).length === 0 ? (
                  <span className="muted">Looking good</span>
                ) : (
                  matchResult.result.missingSkills.map((s) => (
                    <span className="chip" key={s}>
                      {s}
                    </span>
                  ))
                )}
              </div>
            </div>

            <div className="ai-block">
              <h3>Tips</h3>
              <ul className="ai-list">
                {(matchResult.result.tips || []).map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
