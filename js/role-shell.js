/*
 * AlumniX Dynamic Role Shell & Navigation Component
 * Renders header bar, desktop sidebar, mobile drawer, and bottom tab bar based on user role.
 */

document.addEventListener("DOMContentLoaded", () => {
  renderAppShell();
});

function renderAppShell() {
  const user = window.authService ? window.authService.getCurrentUser() : null;
  const currentPath = window.location.pathname.split("/").pop() || "index.html";

  // Public pages don't render internal application shell
  if (currentPath === "index.html" || currentPath === "login.html" || currentPath === "signup.html") {
    return;
  }

  const role = user ? user.role : "student";
  const userInitials = user && user.full_name 
    ? user.full_name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) 
    : "AX";

  // 1. Inject Top Header if header-container exists
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

    // Hamburger click handler
    document.getElementById("hamburger-toggle")?.addEventListener("click", () => {
      document.querySelector(".sidebar")?.classList.toggle("open");
    });
  }

  // 2. Inject Sidebar Navigation
  const sidebarContainer = document.getElementById("sidebar-container");
  if (sidebarContainer) {
    let navItems = [];

    if (role === "alumni") {
      navItems = [
        { label: "Dashboard", href: "dashboard.html", icon: "📊" },
        { label: "Alumni Directory", href: "directory.html", icon: "👥" },
        { label: "Job Board", href: "jobs.html", icon: "💼" },
        { label: "Mentorship Requests", href: "mentorship-requests.html", icon: "📩" },
        { label: "My Alumni Profile", href: "register-alumni.html", icon: "🎓" },
        { label: "My Account", href: "profile.html", icon: "👤" }
      ];
    } else {
      // Student view
      navItems = [
        { label: "Dashboard", href: "dashboard.html", icon: "📊" },
        { label: "AI Matchmaker", href: "matchmaker.html", icon: "🎯" },
        { label: "Alumni Directory", href: "directory.html", icon: "👥" },
        { label: "Job Board", href: "jobs.html", icon: "💼" },
        { label: "AI Mentor Chat", href: "chat.html", icon: "🤖" },
        { label: "My Roadmap", href: "roadmap.html", icon: "🗺️" },
        { label: "Mentorship Requests", href: "mentorship-requests.html", icon: "📩" },
        { label: "My Profile", href: "profile.html", icon: "👤" }
      ];
    }

    const navItemsHTML = navItems.map(item => {
      const isActive = currentPath === item.href;
      return `
        <li class="nav-item ${isActive ? 'active' : ''}">
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

  // 3. Inject Mobile Bottom Navigation Bar
  const bottomNavContainer = document.getElementById("bottom-nav-container");
  if (bottomNavContainer) {
    let bottomTabs = [];
    if (role === "alumni") {
      bottomTabs = [
        { label: "Home", href: "dashboard.html", icon: "🏠" },
        { label: "Requests", href: "mentorship-requests.html", icon: "📩" },
        { label: "Directory", href: "directory.html", icon: "👥" },
        { label: "Jobs", href: "jobs.html", icon: "💼" },
        { label: "Profile", href: "profile.html", icon: "👤" }
      ];
    } else {
      bottomTabs = [
        { label: "Home", href: "dashboard.html", icon: "🏠" },
        { label: "Match AI", href: "matchmaker.html", icon: "🎯" },
        { label: "Directory", href: "directory.html", icon: "👥" },
        { label: "Jobs", href: "jobs.html", icon: "💼" },
        { label: "Roadmap", href: "roadmap.html", icon: "🗺️" }
      ];
    }

    const bottomTabsHTML = bottomTabs.map(tab => {
      const isActive = currentPath === tab.href;
      return `
        <a href="${tab.href}" class="bottom-tab-item ${isActive ? 'active' : ''}">
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
