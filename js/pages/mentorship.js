/*
 * AlumniX Mentorship Requests Controller
 * Fetches mentorship requests and provides Accept / Decline actions for alumni.
 */

document.addEventListener("DOMContentLoaded", () => {
  const user = window.authService?.requireAuth();
  if (!user) return;

  const titleEl = document.getElementById("mentorship-page-title");
  const subtitleEl = document.getElementById("mentorship-page-subtitle");

  if (user.role === "alumni") {
    if (titleEl) titleEl.textContent = "Incoming Mentorship Requests";
    if (subtitleEl) subtitleEl.textContent = "Review and accept mentorship connections from Karpagam Institute of Technology students.";
  } else {
    if (titleEl) titleEl.textContent = "My Sent Mentorship Requests";
    if (subtitleEl) subtitleEl.textContent = "Track response statuses from alumni mentors.";
  }

  loadMentorshipRequests(user);
});

async function loadMentorshipRequests(user) {
  const container = document.getElementById("requests-list-container");
  if (!container) return;

  try {
    const res = await window.apiClient.get(`/api/mentorship-requests?user_id=${user.id}&role=${user.role}`);
    const requests = res.requests || [];

    if (requests.length === 0) {
      container.innerHTML = `
        <div class="card" style="text-align: center; padding: 48px;">
          <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No Requests ${user.role === 'alumni' ? 'Received' : 'Sent'} Yet</h3>
          <p class="text-sm text-muted">
            ${user.role === 'alumni' 
              ? 'When students request mentorship via the Directory or AI Matchmaker, they will appear here.' 
              : 'Use the AI Matchmaker or Alumni Directory to reach out to verified alumni mentors!'}
          </p>
          ${user.role === 'student' ? '<div style="margin-top: 16px;"><a href="matchmaker.html" class="btn btn-primary btn-sm">Find a Mentor →</a></div>' : ''}
        </div>
      `;
      return;
    }

    container.innerHTML = requests.map(req => {
      const status = req.status || "pending";
      let statusPillClass = "pill-neutral";
      if (status === "accepted") statusPillClass = "pill-green";
      if (status === "declined") statusPillClass = "pill-alert";

      let otherPartyName = "KIT Member";
      let otherPartySubtitle = "";

      if (user.role === "alumni") {
        otherPartyName = req.users?.full_name || "Student Requester";
        otherPartySubtitle = `${req.users?.department || 'KIT Student'} (${req.users?.email || ''})`;
      } else {
        otherPartyName = req.alumni_profiles?.users?.full_name || "Alumni Mentor";
        otherPartySubtitle = `${req.alumni_profiles?.job_role || 'Engineer'} @ ${req.alumni_profiles?.company || 'Company'}`;
      }

      const dateStr = req.created_at ? new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "Recent";

      return `
        <div class="card card-hover" style="padding: 24px; border: 1px solid var(--border-default);">
          
          <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 14px;">
            <div>
              <h3 style="font-size: 1.2rem; margin-bottom: 2px;">${otherPartyName}</h3>
              <p class="text-sm text-muted">${otherPartySubtitle}</p>
            </div>

            <div style="display: flex; align-items: center; gap: 10px;">
              <span class="mono-tag">${dateStr}</span>
              <span class="pill ${statusPillClass}" style="text-transform: capitalize;">${status}</span>
            </div>
          </div>

          <div style="background-color: var(--bg-page); padding: 14px; border-radius: var(--radius-md); font-size: 0.95rem; margin-bottom: 16px; border: 1px solid var(--border-default);">
            "${req.message}"
          </div>

          ${user.role === "alumni" && status === "pending" ? `
            <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-default); padding-top: 14px;">
              <button type="button" class="btn btn-secondary btn-sm action-update-req" data-id="${req.id}" data-status="declined">
                Decline
              </button>
              <button type="button" class="btn btn-primary btn-sm action-update-req" data-id="${req.id}" data-status="accepted">
                Accept Request ✓
              </button>
            </div>
          ` : ''}

        </div>
      `;
    }).join("");

    // Attach click events for Accept / Decline
    document.querySelectorAll(".action-update-req").forEach(btn => {
      btn.addEventListener("click", async () => {
        const requestId = btn.getAttribute("data-id");
        const newStatus = btn.getAttribute("data-status");
        try {
          btn.disabled = true;
          await window.apiClient.patch("/api/mentorship-request", {
            request_id: requestId,
            status: newStatus
          });
          loadMentorshipRequests(user);
        } catch (err) {
          alert("Failed to update status: " + (err.message || "Error"));
        }
      });
    });

  } catch (err) {
    console.error("[Mentorship] Load error:", err);
    container.innerHTML = `<p class="text-sm text-muted">Error loading mentorship requests.</p>`;
  }
}
