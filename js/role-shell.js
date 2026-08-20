/*
 * AlumniX Dynamic Role Shell & Navigation Component
 * Renders header bar, desktop sidebar, mobile drawer, and bottom tab bar based on user role.
 */

document.addEventListener("DOMContentLoaded", async () => {
  await initAppShell();
});

async function initAppShell() {
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  if (currentPath === "index.html" || currentPath === "login.html" || currentPath === "signup.html") {
    return;
  }

  if (!window.supabaseClient) {
    window.location.href = "login.html";
    return;
  }

  const { data: sessionData, error: sessionError } = await window.supabaseClient.auth.getSession();
  if (sessionError || !sessionData?.session?.user) {
    window.location.href = "login.html";
    return;
  }

  const authUser = sessionData.session.user;
  let authoritativeRole = null;
  let userDetails = null;

  try {
    const res = await window.apiClient.get(`/api/profile-me?user_id=${authUser.id}`);
    if (res && res.user && res.user.role) {
      authoritativeRole = res.user.role;
      userDetails = res.user;
      if (window.authService) {
        window.authService.setCurrentUser(res.user);
      }
    }
  } catch (err) {
    console.error("[Auth] Failed to fetch authoritative profile:", err);
  }

  if (!authoritativeRole) {
    window.location.href = "login.html";
    return;
  }

  const restrictedStudentPages = ["matchmaker.html", "chat.html", "roadmap.html", "register-alumni.html"];
  const alumniOnlyPages        = ["student-directory.html"];

  if (authoritativeRole === "alumni" && restrictedStudentPages.includes(currentPath)) {
    window.location.href = "dashboard.html";
    return;
  }
  if (authoritativeRole === "student" && (alumniOnlyPages.includes(currentPath))) {
    window.location.href = "dashboard.html";
    return;
  }

  renderAppShell(userDetails || authUser, authoritativeRole, currentPath);
  
  setTimeout(() => {
    applyDataRoleFilters(authoritativeRole);
  }, 100);
}

window.applyDataRoleFilters = function(role) {
  document.querySelectorAll("[data-role]").forEach(el => {
    const allowedRoles = el.getAttribute("data-role").split(",");
    if (!allowedRoles.includes(role)) {
      el.style.display = "none";
    }
  });
};

function renderAppShell(user, role, currentPath) {
  const userInitials = user && user.full_name 
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) 
    : "AX";

  const headerContainer = document.getElementById("top-header-container");
  if (headerContainer) {
    headerContainer.innerHTML = `
      <header class="top-header">
        <div style="display: flex; align-items: center; gap: 16px;">
          <button class="mobile-hamburger" id="hamburger-toggle" aria-label="Toggle menu">
            ☰
          </button>
          <a href="dashboard.html" class="logo-wrapper">
            <div class="logo-emblem">✨</div>
            <span><span class="logo-text-dark">Alumni</span><span class="logo-text-x">X</span></span>
          </a>
        </div>
        <div class="header-user-info">
          <span class="pill ${role === 'alumni' ? 'pill-green' : 'pill-neutral'}" style="text-transform: capitalize;">
            ${role === 'alumni' ? '🎓 Alumnus' : '⚡ Student'}
          </span>
          <div class="user-avatar-initial">${userInitials}</div>
          <button class="btn btn-sm btn-secondary" onclick="window.authService.logout()">Log out</button>
        </div>
      </header>
    `;

    document.getElementById("hamburger-toggle")?.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  }

  const sidebarContainer = document.getElementById("sidebar-container");
  if (sidebarContainer) {
    const navItems = [
      { label: "Dashboard",          href: "dashboard.html",         icon: "📊", roles: "student,alumni" },
      { label: "AI Matchmaker",        href: "matchmaker.html",         icon: "🎯", roles: "student" },
      { label: "Alumni Directory",     href: "directory.html",          icon: "👥", roles: "student,alumni" },
      { label: "Student Directory",    href: "student-directory.html",  icon: "🎓", roles: "alumni" },
      { label: "Job Board",            href: "jobs.html",               icon: "💼", roles: "student,alumni" },
      { label: "AI Mentor Chat",       href: "chat.html",               icon: "🤖", roles: "student" },
      { label: "My Roadmap",           href: "roadmap.html",            icon: "🗺️", roles: "student" },
      { label: "Mentorship Requests",  href: "mentorship-requests.html",icon: "📩", roles: "student,alumni" },
      { label: "My Alumni Profile",    href: "register-alumni.html",    icon: "🎓", roles: "alumni" },
      { label: "My Profile",           href: "profile.html",            icon: "👤", roles: "student,alumni" }
    ];

    const navItemsHTML = navItems.map(item => {
      const isActive = currentPath === item.href;
      return `
        <li class="nav-item ${isActive ? 'active' : ''}" data-role="${item.roles}">
          <a href="${item.href}">
            <span class="nav-icon">${item.icon}</span>
            <span>${item.label}</span>
          </a>
        </li>
      `;
    }).join("");

    sidebarContainer.innerHTML = `
      <aside class="sidebar">
        <div class="sidebar-header">
          <a href="dashboard.html" class="logo-wrapper">
            <div class="logo-emblem">✨</div>
            <span><span class="logo-text-dark">Alumni</span><span class="logo-text-x">X</span></span>
          </a>
        </div>
        <ul class="nav-list">
          ${navItemsHTML}
        </ul>
        <div class="sidebar-footer">
          <a href="impact.html" class="text-xs text-muted" style="display: flex; align-items: center; gap: 6px;">
            <span>🌐 Platform Impact Stats</span>
          </a>
        </div>
      </aside>
    `;
  }

  const bottomNavContainer = document.getElementById("bottom-nav-container");
  if (bottomNavContainer) {
    const bottomTabs = [
      { label: "Home", href: "dashboard.html", icon: "🏠", roles: "student,alumni" },
      { label: "Directory", href: "directory.html", icon: "👥", roles: "student,alumni" },
      { label: "Match AI", href: "matchmaker.html", icon: "🎯", roles: "student" },
      { label: "Requests", href: "mentorship-requests.html", icon: "📩", roles: "alumni" },
      { label: "Jobs", href: "jobs.html", icon: "💼", roles: "student,alumni" },
      { label: "Profile", href: "profile.html", icon: "👤", roles: "student,alumni" }
    ];

    const bottomTabsHTML = bottomTabs.map(tab => {
      const isActive = currentPath === tab.href;
      return `
        <a href="${tab.href}" class="bottom-tab-item ${isActive ? 'active' : ''}" data-role="${tab.roles}">
          <span class="icon">${tab.icon}</span>
          <span>${tab.label}</span>
        </a>
      `;
    }).join("");

    bottomNavContainer.innerHTML = `
      <nav class="bottom-tab-bar">
        ${bottomTabsHTML}
      </nav>
    `;
  }
}
