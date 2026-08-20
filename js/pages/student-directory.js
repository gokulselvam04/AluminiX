/*
 * AlumniX Student Directory Page Controller
 * Allows alumni to browse students and send connection requests.
 */

document.addEventListener("DOMContentLoaded", () => {
  const currentUser = window.authService?.getCurrentUser();

  const searchInput = document.getElementById("stud-search-input");
  const deptFilter = document.getElementById("stud-dept-filter");
  const interestFilter = document.getElementById("stud-interest-filter");
  const countLabel = document.getElementById("student-directory-count-label");

  let debounceTimer;

  function loadStudents() {
    const search = searchInput?.value.trim() || "";
    const dept = deptFilter?.value || "All";
    const interest = interestFilter?.value || "All";

    window.apiClient.get("/api/students", { search, dept })
      .then(res => {
        let list = res.students || [];

        // Filter by interest area in-memory
        if (interest && interest !== "All") {
          list = list.filter(s => 
            s.interest_area && s.interest_area.toLowerCase().includes(interest.toLowerCase())
          );
        }

        if (countLabel) countLabel.textContent = `Showing ${list.length} Student${list.length === 1 ? '' : 's'}`;
        renderStudentGrid(list);
      })
      .catch(err => {
        console.error("[Student Directory] Error loading students:", err);
        renderStudentGrid([]);
      });
  }

  // Event Listeners for Live Filtering
  searchInput?.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(loadStudents, 300);
  });

  deptFilter?.addEventListener("change", loadStudents);
  interestFilter?.addEventListener("change", loadStudents);

  // Initial Load
  loadStudents();
  setupStudentDirectoryModal();
});

function renderStudentGrid(studentList) {
  const grid = document.getElementById("student-cards-grid");
  const currentUser = window.authService?.getCurrentUser();
  if (!grid) return;

  if (studentList.length === 0) {
    grid.innerHTML = `
      <div class="card" style="grid-column: 1 / -1; text-align: center; padding: 48px;">
        <h3 style="font-size: 1.2rem; margin-bottom: 8px;">No Students Found</h3>
        <p class="text-sm text-muted">Try adjusting your search keywords or filter selections.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = studentList.map(item => {
    const name = item.full_name || "KIT Student";
    const dept = item.department || "CSE";
    const interest = item.interest_area || "Software Development";
    const targetRole = item.target_role || "Software Engineer";
    const roadmapPercent = item.roadmap_percent || 0;
    const studentId = item.id;

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
                <span class="mono-tag">${dept}</span>
              </div>
            </div>

            <span class="pill pill-neutral">
              ${interest}
            </span>
          </div>

          <div style="margin-bottom: 12px;">
            <span style="font-weight: 600; font-size: 0.95rem; color: var(--text-primary);">Target Role:</span>
            <span class="text-sm text-muted"> ${targetRole}</span>
          </div>

          ${roadmapPercent > 0 ? `
            <div style="margin-bottom: 16px;">
              <div style="font-size: 0.85rem; font-weight: 500; margin-bottom: 4px;">Roadmap Progress</div>
              <div style="width: 100%; height: 6px; background-color: var(--bg-page); border-radius: var(--radius-sm); overflow: hidden;">
                <div style="width: ${roadmapPercent}%; height: 100%; background-color: var(--primary); transition: width 0.3s ease;"></div>
              </div>
              <div style="font-size: 0.8rem; color: var(--text-muted); margin-top: 4px;">${roadmapPercent}% Complete</div>
            </div>
          ` : ''}

        </div>

        <div style="border-top: 1px solid var(--border-default); padding-top: 14px; display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
          <button type="button" class="btn btn-primary btn-sm stud-open-modal-btn"
            data-id="${studentId}"
            data-name="${name}"
            data-interest="${interest}">
            Send Connection Request
          </button>
        </div>
      </div>
    `;
  }).join("");

  // Attach modal handlers
  document.querySelectorAll(".stud-open-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-id");
      const name = btn.getAttribute("data-name");
      const interest = btn.getAttribute("data-interest");
      openStudentModal(id, name, interest);
    });
  });

  if (window.applyDataRoleFilters && currentUser) {
    window.applyDataRoleFilters(currentUser.role);
  }
}

function setupStudentDirectoryModal() {
  const modal = document.getElementById("stud-connection-modal");
  const closeX = document.getElementById("stud-modal-close-x");
  const cancelBtn = document.getElementById("stud-modal-cancel-btn");
  const form = document.getElementById("stud-connection-request-form");

  function closeModal() {
    modal?.classList.remove("open");
  }

  closeX?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = window.authService?.getCurrentUser();
    const studentId = document.getElementById("stud-modal-student-id").value;
    const message = document.getElementById("stud-request-message").value.trim();
    const submitBtn = document.getElementById("stud-modal-submit-btn");

    if (!user || !studentId || !message) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      // First, get the alumnus profile id for this user
      const profileRes = await window.apiClient.get(`/api/alumni-profile?user_id=${user.id}`);
      if (!profileRes.alumni_profile || !profileRes.alumni_profile.id) {
        alert("Could not find your alumni profile. Please complete your profile first.");
        submitBtn.disabled = false;
        submitBtn.textContent = "Send Request →";
        return;
      }

      const alumniId = profileRes.alumni_profile.id;

      await window.apiClient.post("/api/mentorship-request", {
        student_id: studentId,
        alumni_id: alumniId,
        message,
        initiated_by: "alumni"
      });

      alert("Connection request sent successfully!");
      closeModal();
      document.getElementById("stud-request-message").value = "";
    } catch (err) {
      alert("Failed to send request: " + (err.message || "Error"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Request →";
    }
  });
}

function openStudentModal(studentId, name, interest) {
  const modal = document.getElementById("stud-connection-modal");
  const modalName = document.getElementById("stud-modal-student-name");
  const modalSubtitle = document.getElementById("stud-modal-student-subtitle");
  const modalIdInput = document.getElementById("stud-modal-student-id");

  if (modalName) modalName.textContent = `Connect with ${name}`;
  if (modalSubtitle) modalSubtitle.textContent = `Interest: ${interest}`;
  if (modalIdInput) modalIdInput.value = studentId;

  modal?.classList.add("open");
}
