/*
 * AlumniX AI Matchmaker Page Controller
 * Manages search submission, multi-stage loading animation, match card rendering, and mentorship request modal.
 */

document.addEventListener("DOMContentLoaded", () => {
  const user = window.authService?.requireAuth();
  if (!user) return;

  // Alumni attempting to visit matchmaker are redirected per prompt Section 4
  if (user.role === "alumni") {
    window.location.href = "dashboard.html";
    return;
  }

  // Pre-fill user department if available
  const deptSelect = document.getElementById("match-department");
  if (deptSelect && user.department) {
    deptSelect.value = user.department;
  }

  const form = document.getElementById("matchmaker-form");
  const loadingState = document.getElementById("matchmaker-loading-state");
  const stageTitle = document.getElementById("loading-stage-title");
  const stageDesc = document.getElementById("loading-stage-desc");
  const progressFill = document.getElementById("loading-progress-fill");

  const resultsSection = document.getElementById("matchmaker-results-section");
  const cardsContainer = document.getElementById("matchmaker-cards-container");
  const runBtn = document.getElementById("btn-run-matchmaker");

  // Form Submit Handler
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const department = document.getElementById("match-department").value;
    const targetPath = document.getElementById("match-target-path").value.trim();
    const interestText = document.getElementById("match-interest").value.trim();

    // 1. Hide results & show multi-stage loading state
    resultsSection.style.display = "none";
    loadingState.style.display = "block";
    runBtn.disabled = true;

    // Stage 1 animation
    stageTitle.textContent = "Connecting to KIT Alumni Database...";
    stageDesc.textContent = "Scanning active alumni mentors across Zoho, Freshworks, Microsoft, AWS, TCS...";
    if (progressFill) progressFill.style.width = "30%";

    // Stage 2 animation
    setTimeout(() => {
      stageTitle.textContent = "Scoring Candidate Profiles...";
      stageDesc.textContent = `Matching ${department} background with target '${targetPath}' expertise...`;
      if (progressFill) progressFill.style.width = "65%";
    }, 600);

    // Stage 3 animation
    setTimeout(() => {
      stageTitle.textContent = "Generating AI Match Rationales...";
      stageDesc.textContent = "Synthesizing personalized recommendation summaries for top 3 candidates...";
      if (progressFill) progressFill.style.width = "90%";
    }, 1200);

    try {
      // Execute backend matchmaker API
      const response = await window.apiClient.post("/api/matchmaker-run", {
        student_id: user.id,
        department,
        target_path: targetPath,
        interest_text: interestText
      });

      // Complete progress animation
      setTimeout(() => {
        if (progressFill) progressFill.style.width = "100%";
        loadingState.style.display = "none";
        runBtn.disabled = false;

        const matches = response.matches || [];
        renderMatchCards(matches);
        resultsSection.style.display = "block";

        // Smooth scroll to results
        resultsSection.scrollIntoView({ behavior: "smooth" });
      }, 1600);

    } catch (err) {
      console.error("[Matchmaker] Error:", err);
      loadingState.style.display = "none";
      runBtn.disabled = false;
      alert("Failed to run AI Matchmaker: " + (err.message || "Network error"));
    }
  });

  // Modal setup
  setupMentorshipModal();
});

function renderMatchCards(matches) {
  const container = document.getElementById("matchmaker-cards-container");
  if (!container) return;

  if (matches.length === 0) {
    container.innerHTML = `
      <div class="card" style="text-align: center; padding: 32px;">
        <p class="text-muted">No alumni mentors found matching your specific query. Try broadening your target path.</p>
      </div>
    `;
    return;
  }

  const rankBadges = ["🥇 #1 Top Match", "🥈 #2 Strong Match", "🥉 #3 Recommended Match"];

  container.innerHTML = matches.map((item, idx) => {
    const alum = item.alumnus || {};
    const name = alum.users?.full_name || "KIT Alumnus";
    const company = alum.company || "Tech Company";
    const jobRole = alum.job_role || "Software Engineer";
    const dept = alum.department || "CSE";
    const batch = alum.batch_year || 2020;
    const bio = alum.bio || "Passionate about guiding Karpagam Institute of Technology students.";
    const linkedin = alum.linkedin_url || "#";
    const alumniId = alum.id || `alum-${idx}`;

    return `
      <div class="card card-hover" style="border: 1px solid var(--border-hover); padding: 28px;">
        
        <div style="display: flex; align-items: flex-start; justify-content: space-between; flex-wrap: wrap; gap: 12px; margin-bottom: 16px;">
          <div style="display: flex; align-items: center; gap: 14px;">
            <div class="user-avatar-initial" style="width: 48px; height: 48px; font-size: 1.2rem;">
              ${name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)}
            </div>
            <div>
              <h3 style="font-size: 1.3rem; margin-bottom: 2px;">${name}</h3>
              <p class="text-sm text-muted">
                <strong style="color: var(--text-primary);">${jobRole}</strong> @ ${company} • ${dept} (Batch ${batch})
              </p>
            </div>
          </div>

          <span class="pill pill-green">${rankBadges[idx] || `#${idx+1} Match`}</span>
        </div>

        <p class="text-sm text-muted" style="margin-bottom: 16px;">${bio}</p>

        <!-- AI Rationale Callout -->
        <div style="background-color: var(--bg-page); border-left: 4px solid var(--primary-green); padding: 14px 18px; border-radius: 0 var(--radius-md) var(--radius-md) 0; margin-bottom: 20px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 600; font-size: 0.85rem; color: var(--primary-green); margin-bottom: 4px;">
            <span>✨ AI Match Rationale</span>
          </div>
          <p class="text-sm" style="color: var(--text-primary); font-style: italic;">
            "${item.rationale || 'Matched based on shared department background and active mentorship availability.'}"
          </p>
        </div>

        <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 12px; border-top: 1px solid var(--border-default); padding-top: 16px;">
          <a href="${linkedin}" target="_blank" class="text-xs text-muted" style="display: inline-flex; align-items: center; gap: 4px;">
            🔗 View LinkedIn Profile
          </a>
          <div style="display: flex; gap: 8px;">
            ${alum.whatsapp ? `<a href="https://wa.me/${alum.whatsapp.replace(/[^0-9]/g, '')}" target="_blank" class="btn btn-outline btn-sm">💬 WhatsApp</a>` : ''}
            ${alum.whatsapp ? `<a href="tel:${alum.whatsapp}" class="btn btn-outline btn-sm">📞 Call</a>` : ''}
            <button type="button" class="btn btn-primary btn-sm open-request-modal-btn" 
              data-alumni-id="${alumniId}" 
              data-alumni-name="${name}" 
              data-alumni-role="${jobRole} @ ${company}">
              📩 Request Mentorship
            </button>
          </div>
        </div>

      </div>
    `;
  }).join("");

  // Attach event listeners to open request modal
  document.querySelectorAll(".open-request-modal-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const alumId = btn.getAttribute("data-alumni-id");
      const alumName = btn.getAttribute("data-alumni-name");
      const alumRole = btn.getAttribute("data-alumni-role");
      openMentorshipModal(alumId, alumName, alumRole);
    });
  });
}

function setupMentorshipModal() {
  const modal = document.getElementById("mentorship-modal");
  const closeX = document.getElementById("modal-close-x");
  const cancelBtn = document.getElementById("modal-cancel-btn");
  const requestForm = document.getElementById("mentorship-request-form");

  function closeModal() {
    modal?.classList.remove("open");
  }

  closeX?.addEventListener("click", closeModal);
  cancelBtn?.addEventListener("click", closeModal);

  requestForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const user = window.authService?.getCurrentUser();
    const alumniId = document.getElementById("modal-alumni-id").value;
    const message = document.getElementById("request-message").value.trim();
    const submitBtn = document.getElementById("modal-submit-btn");

    if (!user || !alumniId || !message) return;

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Sending...";

      await window.apiClient.post("/api/mentorship-request", {
        student_id: user.id,
        alumni_id: alumniId,
        message
      });

      alert("Mentorship request sent successfully! You can track status on the Mentorship Requests page.");
      closeModal();
      document.getElementById("request-message").value = "";
    } catch (err) {
      alert("Failed to send request: " + (err.message || "Error"));
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Send Request →";
    }
  });
}

function openMentorshipModal(alumniId, name, role) {
  const modal = document.getElementById("mentorship-modal");
  const modalName = document.getElementById("modal-alumni-name");
  const modalSubtitle = document.getElementById("modal-alumni-subtitle");
  const modalIdInput = document.getElementById("modal-alumni-id");

  if (modalName) modalName.textContent = `Connect with ${name}`;
  if (modalSubtitle) modalSubtitle.textContent = role;
  if (modalIdInput) modalIdInput.value = alumniId;

  modal?.classList.add("open");
}
