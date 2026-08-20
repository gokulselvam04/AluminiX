/*
 * AlumniX Directory Page Controller
 * Handles alumni search, filtering, grid rendering, and mentorship request modals.
 */

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.authService?.getCurrentUser();

  const searchInput = document.getElementById("dir-search-input");
  const deptFilter = document.getElementById("dir-dept-filter");
  const industryFilter = document.getElementById("dir-industry-filter");
  const countLabel = document.getElementById("directory-count-label");

  let debounceTimer;

  function loadAlumni() {
    const search = searchInput?.value.trim() || "";
    const dept = deptFilter?.value || "All";
    const industry = industryFilter?.value || "All";
    const mentor_available = document.getElementById("dir-mentor-toggle")?.checked ? "true" : "";

    window.apiClient.get("/api/alumni", { search, dept, industry, mentor_available })
      .then(res => {
        const list = res.alumni || [];
        if (countLabel) countLabel.textContent = `Showing ${list.length} Alumni Mentor${list.length === 1 ? '' : 's'}`;
        renderAlumniGrid(list);
      })
      .catch(err => {
        console.error("[Directory] Error loading alumni:", err);
        renderAlumniGrid([]);
      });
  }

  // Event Listeners for Live Filtering
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadAlumni, 300);
  });

  deptFilter?.addEventListener("change", loadAlumni);
  industryFilter?.addEventListener("change", loadAlumni);
  document.getElementById("dir-mentor-toggle")?.addEventListener("change", loadAlumni);

  // Initial Load
  loadAlumni();
  setupDirectoryModal();
});

function renderAlumniGrid(alumniList) {
  const grid = document.getElementById("alumni-cards-grid");
  const currentUser = window.authService?.getCurrentUser();
  if (!grid) return;

  if (alumniList.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
        <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No Alumni Found</h3>
        <p class="text-sm text-muted">Try adjusting your search keywords or filter selections.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = alumniList.map(item => {
    const name = item.users?.full_name || "KIT Alumnus";
    const company = item.company || "Tech Enterprise";
    const jobRole = item.job_role || "Software Specialist";
    const dept = item.department || "CSE";
    const batch = item.batch_year || 2020;
    const bio = item.bio || "Passionate about mentoring Karpagam Institute of Technology students.";
    const isMentorAvailable = item.mentor_available !== false;
    const linkedin = item.linkedin_url || "#";
    const alumniId = item.id;

    const isStudent = currentUser && currentUser.role === "student";

    return `
      <div class="card card-hover" style="display: flex; flex-direction: column; justify-content: space-between;">
        <div>
          
          <div style="display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 14px;">
            <div style="display: flex; align-items: center; gap: 12px;">
              <div class="user-avatar-initial" style="width: 44px; height: 44px; font-size: 1.1rem;">
                ${name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
              </div>
              <div>
                <h3 style="font-size: 1.15rem; margin-bottom: 2px;">${name}</h3>
                <span class="mono-tag">${dept} '<sup>${String(batch).slice(2)}</sup></span>
              </div>
            </div>

            <span class="pill ${isMentorAvailable ? 'pill-green' : 'pill-neutral'}">
              ${isMentorAvailable ? 'Open to mentor' : 'Unavailable'}
            </span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">${jobRole}</span>
            <span class="text-sm text-muted"> @ ${company}</span>
          </div>

          <p class="text-sm text-muted" style="margin-bottom: 16px; line-clamp: 3; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;">
            ${bio}
          </p>

        </div>

        <div style="border-top: 1px solid var(--border-default); padding-top: 14px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
          <a href="${linkedin}" target="_blank" class="text-xs text-muted">🔗 LinkedIn</a>
          ${isMentorAvailable ? `
            <button type="button" class="btn btn-primary btn-sm dir-open-modal-btn"
              data-id="${alumniId}"
              data-name="${name}"
              data-role-attr="student"
              data-role="student"
              data-job="${jobRole} @ ${company}">
              Request Mentorship
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }).join("");

  // Attach modal handlers
  document.querySelectorAll(".dir-open-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      const role = btn.getAttribute("data-job");
      openDirectoryModal(id, name, role);
    });
  });

  if (window.applyDataRoleFilters && currentUser) {
    window.applyDataRoleFilters(currentUser.role);
  }
}

function setupDirectoryModal() {
  const modal = document.getElementById("dir-mentorship-modal");
  const closeX = document.getElementById("dir-modal-close-x");
  const cancelBtn = document.getElementById("dir-modal-cancel-btn");
  const form = document.getElementById("dir-mentorship-request-form");

  function closeModal() {
    modal?.classList.remove("open");
  }

  closeX?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = window.authService?.getCurrentUser();
    const alumniId = document.getElementById("dir-modal-alumni-id").value;
    const message = document.getElementById("dir-request-message").value.trim();
    const submitBtn = document.getElementById("dir-modal-submit-btn");

    if (!user || !alumniId || !message) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      await window.apiClient.post("/api/mentorship-request", {
        student_id: user.id,
        alumni_id: alumniId,
        message,
        initiated_by: "student"
      });

      alert("Mentorship request sent successfully!");
      closeModal();
      document.getElementById("dir-request-message").value = "";
    } catch (err) {
      alert("Failed to send request: " + (err.message || "Error"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Request →";
    }
  });
}

function openDirectoryModal(alumniId, name, role) {
  const modal = document.getElementById("dir-mentorship-modal");
  const modalName = document.getElementById("dir-modal-alumni-name");
  const modalSubtitle = document.getElementById("dir-modal-alumni-subtitle");
  const modalIdInput = document.getElementById("dir-modal-alumni-id");

  if (modalName) modalName.textContent = `Connect with ${name}`;
  if (modalSubtitle) modalSubtitle.textContent = role;
  if (modalIdInput) modalIdInput.value = alumniId;

  modal?.classList.add("open");
}
