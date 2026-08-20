/*
 * AlumniX Mentorship Requests Controller
 * Two-way: both students and alumni can initiate / respond to requests.
 * Tabs:
 *   Student — "Sent by me" (initiated_by=student) | "Received" (initiated_by=alumni, can Accept/Decline)
 *   Alumni  — "Received"   (initiated_by=student, can Accept/Decline) | "Sent by me" (initiated_by=alumni)
 */

let _currentUser = null;
let _allRequests  = [];
let _activeTab    = null; // 'received' | 'sent'

document.addEventListener("DOMContentLoaded", () => {
  const user = window.authService?.getCurrentUser();
  if (!user) return;
  _currentUser = user;
  loadMentorshipRequests(user);
});

async function loadMentorshipRequests(user) {
  const titleEl    = document.getElementById("mentorship-page-title");
  const subtitleEl = document.getElementById("mentorship-page-subtitle");
  const tabsEl     = document.getElementById("mentorship-tabs");
  const container  = document.getElementById("requests-list-container");

  if (!container) return;

  if (titleEl) titleEl.textContent = "Mentorship Requests";
  if (subtitleEl) subtitleEl.textContent = "Manage your mentorship connections — sent and received.";

  try {
    const res = await window.apiClient.get(`/api/mentorship-requests?user_id=${user.id}&role=${user.role}`);
    _allRequests = res.requests || [];

    // Build tabs
    if (tabsEl) {
      if (user.role === "alumni") {
        tabsEl.innerHTML = `
          <div class="segmented-toggle" style="max-width: 360px; margin-bottom: 0;">
            <button type="button" class="segmented-toggle-btn active" data-tab="received">Received from Students</button>
            <button type="button" class="segmented-toggle-btn" data-tab="sent">Sent by Me</button>
          </div>`;
      } else {
        tabsEl.innerHTML = `
          <div class="segmented-toggle" style="max-width: 360px; margin-bottom: 0;">
            <button type="button" class="segmented-toggle-btn active" data-tab="sent">Sent by Me</button>
            <button type="button" class="segmented-toggle-btn" data-tab="received">Received from Alumni</button>
          </div>`;
      }

      tabsEl.querySelectorAll(".segmented-toggle-btn").forEach(btn => {
        btn.addEventListener("click", () => {
          tabsEl.querySelectorAll(".segmented-toggle-btn").forEach(b => b.classList.remove("active"));
          btn.classList.add("active");
          _activeTab = btn.getAttribute("data-tab");
          renderRequests(user, _activeTab);
        });
      });
    }

    // Default active tab
    _activeTab = user.role === "alumni" ? "received" : "sent";
    renderRequests(user, _activeTab);

  } catch (err) {
    console.error("[Mentorship] Load error:", err);
    container.innerHTML = `<p class="text-sm text-muted">Error loading mentorship requests.</p>`;
  }
}

function renderRequests(user, tab) {
  const container = document.getElementById("requests-list-container");
  if (!container) return;

  // Filter by direction
  let filtered;
  if (tab === "received") {
    // Show requests where the OTHER party initiated (so the current user is the responder)
    if (user.role === "alumni") {
      filtered = _allRequests.filter(r => r.initiated_by === "student" || !r.initiated_by); // backward-compat
    } else {
      filtered = _allRequests.filter(r => r.initiated_by === "alumni");
    }
  } else {
    // tab === "sent"
    if (user.role === "alumni") {
      filtered = _allRequests.filter(r => r.initiated_by === "alumni");
    } else {
      filtered = _allRequests.filter(r => r.initiated_by === "student" || !r.initiated_by);
    }
  }

  if (filtered.length === 0) {
    const emptyMsg = tab === "received"
      ? (user.role === "alumni" ? "No students have reached out yet." : "No alumni have reached out to you yet.")
      : (user.role === "alumni" ? "You haven't sent any connection requests yet. Browse the Student Directory to reach out." : "You haven't sent any mentorship requests yet. Use the AI Matchmaker or Alumni Directory to find a mentor.");
    const ctaLink = tab === "sent" && user.role === "alumni"
      ? `<div style="margin-top:16px;"><a href="student-directory.html" class="btn btn-primary btn-sm">Browse Student Directory →</a></div>`
      : tab === "sent" && user.role === "student"
      ? `<div style="margin-top:16px;"><a href="matchmaker.html" class="btn btn-primary btn-sm">Find a Mentor →</a></div>`
      : "";

    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 48px;">
        <h3 style="font-size: 1.2rem; margin-bottom: 8px;">Nothing here yet</h3>
        <p class="text-sm text-muted">${emptyMsg}</p>
        ${ctaLink}
      </div>`;
    return;
  }

  container.innerHTML = filtered.map(req => {
    const status = req.status || "pending";
    let statusPillClass = "pill-neutral";
    if (status === "accepted") statusPillClass = "pill-green";
    if (status === "declined") statusPillClass = "pill-alert";

    let otherPartyName     = "KIT Member";
    let otherPartySubtitle = "";

    if (user.role === "alumni") {
      // Both tabs show the student on the other side
      otherPartyName     = req.users?.full_name || "Student";
      otherPartySubtitle = req.users?.department || "KIT Student";
    } else {
      // Both tabs show the alumnus on the other side
      otherPartyName     = req.alumni_profiles?.users?.full_name || "Alumni Mentor";
      otherPartySubtitle = `${req.alumni_profiles?.job_role || "Engineer"} @ ${req.alumni_profiles?.company || "Company"}`;
    }

    const dateStr = req.created_at
      ? new Date(req.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
      : "Recent";

    // Show Accept/Decline only for the received tab AND only when pending
    const canRespond = tab === "received" && status === "pending";

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

        ${canRespond ? `
          <div style="display: flex; justify-content: flex-end; gap: 12px; border-top: 1px solid var(--border-default); padding-top: 14px;">
            <button type="button" class="btn btn-secondary btn-sm action-update-req" data-id="${req.id}" data-status="declined">
              Decline
            </button>
            <button type="button" class="btn btn-primary btn-sm action-update-req" data-id="${req.id}" data-status="accepted">
              Accept ✓
            </button>
          </div>
        ` : ""}
      </div>
    `;
  }).join("");

  // Attach click events for Accept / Decline
  container.querySelectorAll(".action-update-req").forEach(btn => {
    btn.addEventListener("click", async () => {
      const requestId = btn.getAttribute("data-id");
      const newStatus = btn.getAttribute("data-status");
      try {
        btn.disabled = true;
        await window.apiClient.patch("/api/mentorship-request", {
          request_id: requestId,
          status:     newStatus,
          user_id:    _currentUser.id
        });
        // Refresh
        loadMentorshipRequests(_currentUser);
      } catch (err) {
        alert("Failed to update status: " + (err.message || "Error"));
      }
    });
  });
}
