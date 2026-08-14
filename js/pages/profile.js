/*
 * AlumniX User Profile Controller
 * Manages displaying and updating user profile details.
 */

document.addEventListener("DOMContentLoaded", async () => {
  const user = window.authService?.requireAuth();
  if (!user) return;

  const initials = user.full_name 
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2)
    : "AX";

  document.getElementById("profile-avatar").textContent = initials;
  document.getElementById("profile-display-name").textContent = user.full_name || "KIT Member";
  document.getElementById("profile-display-role").textContent = `${user.role === 'alumni' ? 'Alumnus' : 'Student'} • ${user.department || 'KIT'}`;
  document.getElementById("profile-badge-role").textContent = user.role === 'alumni' ? '🎓 Verified Alumnus' : '⚡ Verified Student';

  document.getElementById("prof-email").value = user.email || "";
  document.getElementById("prof-fullname").value = user.full_name || "";
  document.getElementById("prof-department").value = user.department || "Computer Science & Engineering";

  // Fetch full profile info from backend
  try {
    const res = await window.apiClient.get(`/api/profile-me?user_id=${user.id}`);
    const uData = res.user || {};
    if (document.getElementById("prof-interest")) {
      document.getElementById("prof-interest").value = uData.interest_area || "";
    }
  } catch (err) {
    console.warn("[Profile] Load error:", err);
  }

  // Handle Form Submit
  const form = document.getElementById("profile-edit-form");
  form?.addEventListener("submit", async (e) => {
    e.preventDefault();
    const fullName = document.getElementById("prof-fullname").value.trim();
    const department = document.getElementById("prof-department").value;
    const interestArea = document.getElementById("prof-interest").value.trim();
    const btn = document.getElementById("btn-save-profile");

    try {
      btn.disabled = true;
      btn.textContent = "Saving...";

      await window.apiClient.patch("/api/profile-me", {
        user_id: user.id,
        full_name: fullName,
        department,
        interest_area: interestArea
      });

      user.full_name = fullName;
      user.department = department;
      window.authService.setCurrentUser(user);

      alert("Profile updated successfully!");
      window.location.reload();
    } catch (err) {
      alert("Failed to update profile: " + (err.message || "Error"));
      btn.disabled = false;
      btn.textContent = "Save Changes ✓";
    }
  });
});
