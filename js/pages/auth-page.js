/*
 * AlumniX Auth Page Handler (login.html & signup.html)
 * Controls segmented role toggle state, form switching, validation, and auth execution.
 */

document.addEventListener("DOMContentLoaded", () => {
  let activeRole = "student";

  // Check URL query parameters for pre-selected role (e.g. ?role=alumni)
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.get("role") === "alumni") {
    activeRole = "alumni";
  }

  const roleStudentBtn = document.getElementById("role-toggle-student");
  const roleAlumniBtn = document.getElementById("role-toggle-alumni");
  const authHeading = document.getElementById("auth-heading");
  const authSubheading = document.getElementById("auth-subheading");
  const alertContainer = document.getElementById("auth-alert-container");

  const groupStudent = document.getElementById("group-student-fields");
  const groupAlumni = document.getElementById("group-alumni-fields");
  const emailLabel = document.getElementById("label-email");
  const emailHint = document.getElementById("email-domain-hint");
  const emailInput = document.getElementById("signup-email") || document.getElementById("login-email");

  // Function to update role toggle state & form fields
  function setRole(role) {
    activeRole = role;
    if (role === "alumni") {
      roleAlumniBtn?.classList.add("active");
      roleStudentBtn?.classList.remove("active");
      if (authSubheading) authSubheading.textContent = "Reconnect and give back as an alumnus";
      
      if (groupStudent) groupStudent.style.display = "none";
      if (groupAlumni) groupAlumni.style.display = "block";
      if (emailLabel) emailLabel.textContent = "Personal / Work Email";
      if (emailHint) emailHint.style.display = "none";
      if (emailInput) emailInput.placeholder = "alex@company.com";
    } else {
      roleStudentBtn?.classList.add("active");
      roleAlumniBtn?.classList.remove("active");
      if (authSubheading) authSubheading.textContent = "Continue your journey as a student";
      
      if (groupStudent) groupStudent.style.display = "block";
      if (groupAlumni) groupAlumni.style.display = "none";
      if (emailLabel) emailLabel.textContent = "Institution Email (@kite.ac.in)";
      if (emailHint) emailHint.style.display = "inline";
      if (emailInput) emailInput.placeholder = "aravind@kite.ac.in";
    }
  }

  // Bind role toggle click events
  roleStudentBtn?.addEventListener("click", () => setRole("student"));
  roleAlumniBtn?.addEventListener("click", () => setRole("alumni"));

  // Apply initial role
  setRole(activeRole);

  // Helper for displaying inline alert messages
  function showAlert(msg, isSuccess = false) {
    if (!alertContainer) return;
    alertContainer.style.display = "block";
    alertContainer.className = isSuccess ? "alert-box alert-success" : "alert-box alert-error";
    alertContainer.innerHTML = `
      <span>${isSuccess ? '✅' : '⚠️'}</span>
      <span>${msg}</span>
    `;
  }

  function hideAlert() {
    if (alertContainer) alertContainer.style.display = "none";
  }

  // --- LOGIN FORM SUBMIT HANDLER ---
  const loginForm = document.getElementById("login-form");
  loginForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const email = document.getElementById("login-email")?.value.trim();
    const password = document.getElementById("login-password")?.value;
    const submitBtn = document.getElementById("login-submit-btn");

    if (!email || !password) {
      showAlert("Please enter both email and password.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Authenticating...";

      const user = await window.authService.login(email, password, activeRole);
      showAlert("Login successful! Redirecting...", true);

      setTimeout(() => {
        if (user.role === "alumni" && user.needsProfileSetup) {
          window.location.href = "register-alumni.html";
        } else {
          window.location.href = "dashboard.html";
        }
      }, 500);

    } catch (err) {
      console.error("[Auth] Login error:", err);
      showAlert(err.message || "Invalid credentials or account does not exist.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Log in →";
    }
  });

  // --- SIGNUP FORM SUBMIT HANDLER ---
  const signupForm = document.getElementById("signup-form");
  signupForm?.addEventListener("submit", async (e) => {
    e.preventDefault();
    hideAlert();

    const fullName = document.getElementById("signup-fullname")?.value.trim();
    const email = document.getElementById("signup-email")?.value.trim();
    const department = document.getElementById("signup-department")?.value;
    const password = document.getElementById("signup-password")?.value;
    const confirmPassword = document.getElementById("signup-confirm-password")?.value;
    const submitBtn = document.getElementById("signup-submit-btn");

    if (!fullName || !email || !password) {
      showAlert("Please fill in all required fields.");
      return;
    }

    if (password !== confirmPassword) {
      showAlert("Passwords do not match. Please verify and try again.");
      return;
    }

    try {
      submitBtn.disabled = true;
      submitBtn.textContent = "Creating Account...";

      if (activeRole === "student") {
        const currentBatch = document.getElementById("signup-batch")?.value;
        const user = await window.authService.signUpStudent({
          fullName,
          email,
          department,
          currentBatch,
          password
        });
        showAlert("Student account created successfully! Loading dashboard...", true);
        setTimeout(() => { window.location.href = "dashboard.html"; }, 600);

      } else {
        // Alumni Signup
        const batchYear = document.getElementById("signup-grad-year")?.value;
        const company = document.getElementById("signup-company")?.value.trim();
        const jobRole = document.getElementById("signup-jobrole")?.value.trim();

        if (!company || !jobRole) {
          showAlert("Alumni must provide current company and job role.");
          submitBtn.disabled = false;
          submitBtn.textContent = "Create Account →";
          return;
        }

        const user = await window.authService.signUpAlumni({
          fullName,
          email,
          batchYear,
          department,
          company,
          jobRole,
          password
        });

        showAlert("Alumni account created! Proceeding to profile registration...", true);
        setTimeout(() => { window.location.href = "register-alumni.html"; }, 600);
      }

    } catch (err) {
      console.error("[Auth] Signup error:", err);
      showAlert(err.message || "Account creation failed. Please check inputs.");
      submitBtn.disabled = false;
      submitBtn.textContent = "Create Account →";
    }
  });
});
