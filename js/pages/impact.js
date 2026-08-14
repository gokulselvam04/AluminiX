/*
 * AlumniX Impact Dashboard Controller
 * Fetches public platform metrics and populates analytics cards.
 */

document.addEventListener("DOMContentLoaded", async () => {
  try {
    const res = await window.apiClient.get("/api/impact-stats");
    const m = res.metrics || {};

    if (document.getElementById("val-connections")) {
      document.getElementById("val-connections").textContent = m.connections_made || 312;
    }
    if (document.getElementById("val-jobs")) {
      document.getElementById("val-jobs").textContent = m.jobs_filled_referral || 94;
    }
    if (document.getElementById("val-mentors")) {
      document.getElementById("val-mentors").textContent = m.active_mentors || 320;
    }
    if (document.getElementById("val-response")) {
      document.getElementById("val-response").textContent = `${m.avg_response_time_hrs || 4.2} hrs`;
    }
  } catch (err) {
    console.warn("[Impact] Stats load error:", err);
  }
});
