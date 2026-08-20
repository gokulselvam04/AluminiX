/*
 * AlumniX Job & Referral Board Controller
 * Manages job listings display, tab filtering for alumni, and job posting modal.
 */

document.addEventListener("DOMContentLoaded", () => {
  const user = window.authService?.requireAuth();
  if (!user) return;

  loadJobs("all", user);
  setupJobModal(user);

  // Tab Listeners for Alumni
  document.getElementById("tab-all-jobs")?.addEventListener("click", (e) => {
    document.getElementById("tab-all-jobs").classList.add("active");
    document.getElementById("tab-my-jobs")?.classList.remove("active");
    loadJobs("all", user);
  });

  document.getElementById("tab-my-jobs")?.addEventListener("click", (e) => {
    document.getElementById("tab-my-jobs").classList.add("active");
    document.getElementById("tab-all-jobs")?.classList.remove("active");
    loadJobs("my", user);
  });
});

async function loadJobs(filterMode, user) {
  const grid = document.getElementById("jobs-grid-container");
  if (!grid) return;

  try {
    const res = await window.apiClient.get("/api/jobs");
    let jobs = res.jobs || [];

    if (filterMode === "my" && user) {
      jobs = jobs.filter(j => j.alumni_profiles?.users?.email === user.email || j.posted_by === user.id);
    }

    if (jobs.length === 0) {
      grid.innerHTML = `
        <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
          <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No Job Postings Available</h3>
          <p class="text-sm text-muted">
            ${filterMode === 'my' ? 'You have not posted any job listings yet.' : 'Check back soon as KIT alumni post new referral opportunities.'}
          </p>
        </div>
      `;
      return;
    }

    grid.innerHTML = jobs.map(job => {
      const posterName = job.alumni_profiles?.users?.full_name || "KIT Alumnus";
      const posterCompany = job.alumni_profiles?.company || job.company;
      const typePillClass = job.type === "Internship" ? "pill-neutral" : "pill-green";
      const dateStr = job.created_at ? new Date(job.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "Recent";

      return `
        <div class="card card-hover" style="display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            
            <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 10px; margin-bottom: 12px;">
              <span class="pill ${typePillClass}">${job.type || 'Full-time'}</span>
              <span class="mono-tag">${dateStr}</span>
            </div>

            <h3 style="font-size: 1.2rem; margin-bottom: 4px; color: var(--text-primary);">${job.title}</h3>
            <p class="text-sm font-semibold" style="color: var(--primary-green); margin-bottom: 12px;">
              ${job.company} • <span style="color: var(--text-secondary); font-weight: normal;">${job.location}</span>
            </p>

            <p class="text-sm text-muted" style="margin-bottom: 16px; line-clamp: 3; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
              ${job.description}
            </p>

          </div>

          <div style="border-top: 1px solid var(--border-default); padding-top: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
            <div class="text-xs text-muted">
              Posted by <strong style="color: var(--text-primary);">${posterName}</strong>
            </div>
            <button type="button" class="btn btn-secondary btn-sm" onclick="alert('Position: ${escapeJsStr(job.title)}\\nCompany: ${escapeJsStr(job.company)}\\n\\nDescription:\\n${escapeJsStr(job.description)}')">
              View Details
            </button>
          </div>

        </div>
      `;
    }).join("");

  } catch (err) {
    console.error("[Jobs] Error loading jobs:", err);
    grid.innerHTML = `<p class="text-sm text-muted">Unable to load job listings.</p>`;
  }
}

function setupJobModal(user) {
  const modal = document.getElementById("post-job-modal");
  const openBtn = document.getElementById("btn-open-post-job");
  const closeX = document.getElementById("job-modal-close-x");
  const cancelBtn = document.getElementById("job-modal-cancel-btn");
  const form = document.getElementById("post-job-form");

  function closeModal() { modal?.classList.remove("open"); }
  openBtn?.addEventListener("click", () => modal?.classList.add("open"));
  closeX?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("job-title").value.trim();
    const company = document.getElementById("job-company").value.trim();
    const location = document.getElementById("job-location").value.trim();
    const jobType = document.getElementById("job-type").value;
    const tag = document.getElementById("job-tag").value.trim() || "General";
    const description = document.getElementById("job-description").value.trim();
    const submitBtn = document.getElementById("job-modal-submit-btn");

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Publishing...";

      await window.apiClient.post("/api/jobs", {
        user_id: user.id,
        title,
        company,
        location,
        type: jobType,
        tag,
        description
      });

      alert("Job referral posted successfully!");
      closeModal();
      form.reset();
      loadJobs("all", user);

    } catch (err) {
      alert("Failed to post job: " + (err.message || "Error"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Publish Job Post →";
    }
  });
}

function escapeJsStr(str) {
  return (str || "").replace(/'/g, "\\'").replace(/\n/g, "\\n");
}
