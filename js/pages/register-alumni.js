/*
 * AlumniX Register Alumni Profile Controller
 * Manages alumni onboarding form state, pre-filling data, and submitting profile updates.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const user = window.authService?.requireAuth("alumni");
  if (!user) return;

  const nameInput = document.getElementById("alum-fullname");
  if (nameInput && user.full_name) nameInput.value = user.full_name;

  const deptSelect = document.getElementById("alum-dept");
  if (deptSelect && user.department) deptSelect.value = user.department;

  // Try to load existing profile if available
  try {
    const profileRes = await window.apiClient.get(`/api/profile-me?user_id=${user.id}`);
    const alumProf = profileRes.alumni_profile;
    if (alumProf) {
      if (document.getElementById("alum-batch")) document.getElementById("alum-batch").value = alumProf.batch_year || 2020;
      if (document.getElementById("alum-company")) document.getElementById("alum-company").value = alumProf.company || "";
      if (document.getElementById("alum-role")) document.getElementById("alum-role").value = alumProf.job_role || "";
      if (document.getElementById("alum-industry")) document.getElementById("alum-industry").value = alumProf.industry || "Software Development";
      if (document.getElementById("alum-linkedin")) document.getElementById("alum-linkedin").value = alumProf.linkedin_url || "";
      if (document.getElementById("alum-bio")) document.getElementById("alum-bio").value = alumProf.bio || "";
      if (document.getElementById("alum-mentor-toggle")) document.getElementById("alum-mentor-toggle").checked = alumProf.mentor_available !== false;
    }
  } catch (err) {
    console.warn("[RegisterAlumni] Load profile error:", err);
  }

  // Handle Submit
  const form = document.getElementById("alumni-profile-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const fullName = document.getElementById("alum-fullname").value.trim();
    const batchYear = document.getElementById("alum-batch").value;
    const department = document.getElementById("alum-dept").value;
    const company = document.getElementById("alum-company").value.trim();
    const jobRole = document.getElementById("alum-role").value.trim();
    const industry = document.getElementById("alum-industry").value;
    const linkedinUrl = document.getElementById("alum-linkedin").value.trim();
    const bio = document.getElementById("alum-bio").value.trim();
    const mentorAvailable = document.getElementById("alum-mentor-toggle").checked;

    const btn = document.getElementById("btn-save-alumni-profile");

    try {
      btn.disabled = true;
      btn.textContent = "Saving Profile...";

      // Update user full name if changed
      await window.apiClient.patch("/api/profile-me", {
        user_id: user.id,
        full_name: fullName,
        department
      });

      // Update alumni profile
      await window.apiClient.post("/api/alumni-profile", {
        user_id: user.id,
        batch_year: parseInt(batchYear) || 2020,
        department,
        company,
        job_role: jobRole,
        industry,
        linkedin_url: linkedinUrl,
        bio,
        mentor_available: mentorAvailable
      });

      // Update session user metadata
      user.full_name = fullName;
      user.department = department;
      user.needsProfileSetup = false;
      window.authService.setCurrentUser(user);

      alert("Alumni profile saved successfully!");
      window.location.href = "dashboard.html";

    } catch (err) {
      console.error("[RegisterAlumni] Save error:", err);
      alert("Failed to save alumni profile: " + (err.message || "Error"));
      btn.disabled = false;
      btn.textContent = "Save & Continue to Dashboard →";
    }
  });
});
