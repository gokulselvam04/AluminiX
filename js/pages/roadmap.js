/*
 * AlumniX Career Roadmap Page Controller
 * Handles roadmap generation, step checkbox toggling, and live progress updating.
 */

document.addEventListener("DOMContentLoaded", () => {
  const user = window.authService?.requireAuth();
  if (!user) return;

  if (user.role === "alumni") {
    window.location.href = "dashboard.html";
    return;
  }

  loadRoadmap(user, false);

  document.getElementById("btn-regenerate-roadmap")?.addEventListener("click", () => {
    if (confirm("Regenerate your AI Career Roadmap? This will refresh your milestone checklist.")) {
      loadRoadmap(user, true);
    }
  });
});

async function loadRoadmap(user, regenerate = false) {
  const container = document.getElementById("roadmap-steps-container");
  const targetTitle = document.getElementById("roadmap-target-title");
  const pctText = document.getElementById("roadmap-pct-text");
  const barFill = document.getElementById("roadmap-progress-bar-fill");

  if (!container) return;

  container.innerHTML = `<div class="card animate-pulse" style="padding: 24px;">Generating AI Career Roadmap...</div>`;

  try {
    const res = await window.apiClient.post("/api/roadmap-generate", {
      user_id: user.id,
      department: user.department || "Computer Science & Engineering",
      target_role: "Software Engineer",
      regenerate
    });

    const roadmapData = res.roadmap || {};
    const steps = roadmapData.steps || [];
    const percent = roadmapData.percent_complete || 0;
    const roleTitle = roadmapData.target_role || "Software Engineer";

    if (targetTitle) targetTitle.textContent = `${roleTitle} (${user.department || 'KIT'})`;
    if (pctText) pctText.textContent = `${percent}%`;
    if (barFill) barFill.style.width = `${percent}%`;

    renderStepsList(steps, user);

  } catch (err) {
    console.error("[Roadmap] Error loading roadmap:", err);
    container.innerHTML = `<p class="text-sm text-muted">Failed to generate roadmap steps.</p>`;
  }
}

function renderStepsList(steps, user) {
  const container = document.getElementById("roadmap-steps-container");
  if (!container) return;

  if (steps.length === 0) {
    container.innerHTML = `<p class="text-sm text-muted">No roadmap steps found.</p>`;
    return;
  }

  container.innerHTML = steps.map(step => {
    const isDone = step.completed === true;
    const catPill = step.category === "Project" ? "pill-neutral" : "pill-green";

    return `
      <div class="card card-hover" style="padding: 20px; border: 1px solid ${isDone ? 'var(--border-hover)' : 'var(--border-default)'}; background: ${isDone ? '#FAFCFA' : '#FFFFFF'}; transition: all 0.2s ease;">
        <div style="display: flex; align-items: flex-start; gap: 16px;">
          
          <input type="checkbox" class="step-checkbox" 
            data-id="${step.id}" 
            ${isDone ? 'checked' : ''} 
            style="width: 22px; height: 22px; margin-top: 2px; accent-color: var(--primary-green); cursor: pointer;">

          <div style="flex: 1;">
            <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px; margin-bottom: 4px;">
              <h3 style="font-size: 1.15rem; ${isDone ? 'text-decoration: line-through; color: var(--text-muted);' : ''}">
                Step ${step.id}: ${step.title}
              </h3>
              <span class="pill ${catPill}">${step.category || 'Milestone'}</span>
            </div>
            <p class="text-sm text-muted" style="margin-bottom: 0;">${step.description}</p>
          </div>

        </div>
      </div>
    `;
  }).join("");

  // Attach Checkbox Toggle Handlers
  document.querySelectorAll(".step-checkbox").forEach(chk => {
    chk.addEventListener("change", async (e) => {
      const stepId = chk.getAttribute("data-id");
      const isChecked = chk.checked;

      try {
        const patchRes = await window.apiClient.patch("/api/roadmap-progress", {
          user_id: user.id,
          step_id: stepId,
          completed: isChecked
        });

        const newPct = patchRes.percent_complete || 0;
        const pctText = document.getElementById("roadmap-pct-text");
        const barFill = document.getElementById("roadmap-progress-bar-fill");
        if (pctText) pctText.textContent = `${newPct}%`;
        if (barFill) barFill.style.width = `${newPct}%`;

        // Update card visual state
        const card = chk.closest(".card");
        const title = card?.querySelector("h3");
        if (title) {
          if (isChecked) {
            title.style.textDecoration = "line-through";
            title.style.color = "var(--text-muted)";
          } else {
            title.style.textDecoration = "none";
            title.style.color = "var(--text-primary)";
          }
        }

      } catch (err) {
        console.error("[Roadmap] Toggle step error:", err);
        chk.checked = !isChecked; // revert on failure
      }
    });
  });
}
