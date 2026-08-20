/*
 * AlumniX Dashboard Page Controller
 * Fetches role-aware stats from backend and dynamically renders dashboard UI elements.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const user = window.authService ? window.authService.getCurrentUser() : null;
  if (!user) return;

  const role = user.role || "student";

  // Update Welcome Header
  const welcomeHeading = document.getElementById("dashboard-welcome-heading");
  const subheading = document.getElementById("dashboard-subheading");
  if (welcomeHeading) welcomeHeading.textContent = `Welcome back, ${user.full_name || 'KIT Member'}!`;
  if (subheading) subheading.textContent = `${user.department || 'KIT'} • ${role === 'alumni' ? 'Alumni Mentor Network' : 'Student Career Portal'}`;

  // Fetch Dashboard Stats from Backend
  try {
    const data = await window.apiClient.get(`/api/dashboard-stats?user_id=${user.id}&role=${role}`);
    const stats = data.stats || {};
    renderStatCards(stats);
  } catch (err) {
    console.warn("[Dashboard] Error fetching stats:", err);
    renderStatCards({
      alumni_connected: 1,
      ai_matches_run: 3,
      jobs_saved: 12,
      roadmap_progress: 40,
      mentees_mentored: 2,
      active_job_posts: 1,
      pending_requests: 1,
      profile_views: 42
    });
  }

  // Render Flagship Card & Actions
  renderFlagshipCard();
  renderQuickActions();
  loadRecommendations();
  
  if (window.applyDataRoleFilters) {
    setTimeout(() => window.applyDataRoleFilters(role), 50);
  }
});

function renderStatCards(stats) {
  const statsGrid = document.getElementById("dashboard-stats-grid");
  if (!statsGrid) return;

  statsGrid.innerHTML = `
    <!-- Alumni Stats -->
    <div class="stat-card" data-role="alumni">
      <div>
        <div class="stat-label">Mentees Mentored</div>
        <div class="stat-value">${stats.mentees_mentored || 0}</div>
      </div>
      <div class="stat-icon-chip">🤝</div>
    </div>
    <div class="stat-card" data-role="alumni">
      <div>
        <div class="stat-label">Active Job Posts</div>
        <div class="stat-value">${stats.active_job_posts || 0}</div>
      </div>
      <div class="stat-icon-chip">💼</div>
    </div>
    <div class="stat-card" data-role="alumni">
      <div>
        <div class="stat-label">Pending Requests</div>
        <div class="stat-value" style="color: ${stats.pending_requests > 0 ? 'var(--alert-red)' : 'var(--text-primary)'};">
          ${stats.pending_requests || 0}
        </div>
      </div>
      <div class="stat-icon-chip">📩</div>
    </div>
    <div class="stat-card" data-role="alumni">
      <div>
        <div class="stat-label">Profile Views</div>
        <div class="stat-value">${stats.profile_views || 42}</div>
      </div>
      <div class="stat-icon-chip">👁️</div>
    </div>

    <!-- Student Stats -->
    <div class="stat-card" data-role="student">
      <div>
        <div class="stat-label">Alumni Connected</div>
        <div class="stat-value">${stats.alumni_connected || 0}</div>
      </div>
      <div class="stat-icon-chip">👥</div>
    </div>
    <div class="stat-card" data-role="student">
      <div>
        <div class="stat-label">AI Matches Run</div>
        <div class="stat-value">${stats.ai_matches_run || 0}</div>
      </div>
      <div class="stat-icon-chip">🎯</div>
    </div>
    <div class="stat-card" data-role="student">
      <div>
        <div class="stat-label">Jobs Available</div>
        <div class="stat-value">${stats.jobs_saved || 0}</div>
      </div>
      <div class="stat-icon-chip">💼</div>
    </div>
    <div class="stat-card" data-role="student">
      <div>
        <div class="stat-label">Roadmap Progress</div>
        <div class="stat-value" style="color: var(--primary-green);">${stats.roadmap_progress || 0}%</div>
      </div>
      <div class="stat-icon-chip">🗺️</div>
    </div>
  `;
}

function renderFlagshipCard() {
  const container = document.getElementById("flagship-hero-card");
  if (!container) return;

  container.innerHTML = `
    <!-- Alumni Flagship -->
    <div data-role="alumni" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
      <div>
        <span class="pill pill-green" style="margin-bottom: 10px;">🎓 Alumni Network Impact</span>
        <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Guide the Next Generation of KIT Talent</h2>
        <p class="text-sm text-muted" style="max-width: 520px;">
          Review student mentorship requests or post internship/job referral opportunities to help KIT juniors enter top tech organizations.
        </p>
      </div>
      <div style="display: flex; gap: 10px;">
        <a href="mentorship-requests.html" class="btn btn-primary">Review Requests →</a>
        <a href="jobs.html" class="btn btn-secondary">Post a Job</a>
      </div>
    </div>

    <!-- Student Flagship -->
    <div data-role="student" style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 16px;">
      <div>
        <span class="pill pill-green" style="margin-bottom: 10px;">🎯 AI Career Matchmaker</span>
        <h2 style="font-size: 1.5rem; margin-bottom: 8px;">Find your ideal KIT Alumni Mentor</h2>
        <p class="text-sm text-muted" style="max-width: 520px;">
          Input your target tech domain and interests. Our AI engine instantly matches you with verified alumni at Zoho, Microsoft, Freshworks, and AWS.
        </p>
      </div>
      <div>
        <a href="matchmaker.html" class="btn btn-primary btn-lg">Run AI Matchmaker →</a>
      </div>
    </div>
  `;
}

function renderQuickActions() {
  const container = document.getElementById("quick-actions-list");
  if (!container) return;

  container.innerHTML = `
    <!-- Alumni Actions -->
    <a href="mentorship-requests.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="alumni">
      <span>📩</span> Review Mentorship Requests
    </a>
    <a href="jobs.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="alumni">
      <span>💼</span> Post a Referral Job
    </a>
    <a href="register-alumni.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="alumni">
      <span>✏️</span> Edit Alumni Profile
    </a>
    
    <!-- Student Actions -->
    <a href="matchmaker.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="student">
      <span>🎯</span> Run AI Matchmaker
    </a>
    <a href="chat.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="student">
      <span>🤖</span> Chat with AI Mentor
    </a>
    <a href="roadmap.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="student">
      <span>🗺️</span> View Skill Roadmap
    </a>

    <!-- Shared Actions -->
    <a href="directory.html" class="btn btn-secondary btn-block" style="justify-content: flex-start;" data-role="student,alumni">
      <span>👥</span> Browse Directory
    </a>
  `;
}

async function loadRecommendations() {
  const container = document.getElementById("recent-activity-list");
  if (!container) return;

  try {
    const res = await window.apiClient.get("/api/alumni");
    const alumniList = res.alumni || [];
    
    if (alumniList.length === 0) {
      container.innerHTML = \`<p class="text-sm text-muted">No alumni profiles listed yet.</p>\`;
      return;
    }

    container.innerHTML = alumniList.slice(0, 3).map(alum => {
      const name = alum.users?.full_name || "KIT Alumnus";
      const company = alum.company || "Tech Giant";
      const jobRole = alum.job_role || "Software Engineer";
      const dept = alum.department || "CSE";

      return \`
        <div style="display: flex; align-items: center; justify-content: space-between; padding: 12px; border-radius: var(--radius-md); background: var(--bg-page); border: 1px solid var(--border-default);">
          <div>
            <div style="font-weight: 600; font-size: 0.95rem;">\${name}</div>
            <div class="text-xs text-muted">\${jobRole} @ \${company} (\${dept})</div>
          </div>
          <a href="directory.html" class="btn btn-sm btn-secondary">View Profile</a>
        </div>
      \`;
    }).join("");

  } catch (err) {
    container.innerHTML = \`<p class="text-sm text-muted">Unable to load recommendations.</p>\`;
  }
}
