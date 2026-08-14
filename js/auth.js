/* 
 * AlumniX Production Authentication & Role Session Management
 * Integrates Supabase Auth client + backend /api/auth-complete-signup table synchronization
 */

const ALLOWED_STUDENT_EMAIL_DOMAIN = "@kite.ac.in";

class AuthService {
  constructor() {
    this.initAuthListener();
  }

  initAuthListener() {
    if (window.supabaseClient) {
      window.supabaseClient.auth.onAuthStateChange((event, session) => {
        console.log("[Auth] Auth state event:", event);
        if (event === "SIGNED_IN" && session && session.user) {
          this.syncSessionUser(session.user);
        } else if (event === "SIGNED_OUT") {
          this.setCurrentUser(null);
        }
      });
    }
  }

  async syncSessionUser(authUser) {
    if (!authUser) return;
    try {
      const res = await window.apiClient.get(`/api/profile-me?user_id=${authUser.id}`);
      if (res && res.user) {
        const sessionUser = {
          id: res.user.id,
          email: res.user.email,
          role: res.user.role,
          full_name: res.user.full_name,
          department: res.user.department,
          institution: res.user.institution || 'Karpagam Institute of Technology'
        };
        this.setCurrentUser(sessionUser);
      }
    } catch (err) {
      console.warn("[Auth] Sync user profile error:", err);
    }
  }

  getCurrentUser() {
    try {
      const stored = localStorage.getItem("alumnix_user_session");
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error("[Auth] Session parse error:", e);
    }
    return null;
  }

  setCurrentUser(user) {
    if (user) {
      localStorage.setItem("alumnix_user_session", JSON.stringify(user));
    } else {
      localStorage.removeItem("alumnix_user_session");
    }
  }

  // Student Signup Flow
  async signUpStudent({ fullName, email, department, currentBatch, password }) {
    if (!email.toLowerCase().endsWith(ALLOWED_STUDENT_EMAIL_DOMAIN)) {
      throw new Error(`Student email must end with institutional domain (${ALLOWED_STUDENT_EMAIL_DOMAIN})`);
    }

    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }

    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        // 1. Call Supabase Auth signUp
        const { data, error } = await window.supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: 'student', department },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) {
          if (error.message.includes('rate') || error.message.includes('limit')) {
            lastError = error;
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retry
              continue;
            }
          }
          throw new Error(error.message);
        }

        if (!data || !data.user) throw new Error("User creation failed in Supabase Auth.");

        const realUserId = data.user.id;

        // 2. Call backend /api/auth-complete-signup using Service Role client
        await window.apiClient.post('/api/auth-complete-signup', {
          user_id: realUserId,
          email,
          role: 'student',
          full_name: fullName,
          department,
          institution: 'Karpagam Institute of Technology'
        });

        const sessionUser = {
          id: realUserId,
          email,
          role: 'student',
          full_name: fullName,
          department,
          institution: 'Karpagam Institute of Technology'
        };

        this.setCurrentUser(sessionUser);
        return sessionUser;
      } catch (err) {
        if (retries === 0 || !err.message.includes('rate')) {
          throw err;
        }
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error("Signup failed after multiple attempts. Please try again later.");
  }

  // Alumni Signup Flow
  async signUpAlumni({ fullName, email, batchYear, department, company, jobRole, password }) {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }

    let retries = 3;
    let lastError = null;

    while (retries > 0) {
      try {
        // 1. Call Supabase Auth signUp
        const { data, error } = await window.supabaseClient.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, role: 'alumni', department },
            emailRedirectTo: window.location.origin
          }
        });

        if (error) {
          if (error.message.includes('rate') || error.message.includes('limit')) {
            lastError = error;
            retries--;
            if (retries > 0) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
          }
          throw new Error(error.message);
        }

        if (!data || !data.user) throw new Error("User creation failed in Supabase Auth.");

        const realUserId = data.user.id;

        // 2. Call backend /api/auth-complete-signup
        await window.apiClient.post('/api/auth-complete-signup', {
          user_id: realUserId,
          email,
          role: 'alumni',
          full_name: fullName,
          department,
          institution: 'Karpagam Institute of Technology'
        });

        // 3. Pre-register preliminary alumni profile
        await window.apiClient.post('/api/alumni-profile', {
          user_id: realUserId,
          batch_year: parseInt(batchYear) || 2020,
          department,
          company,
          job_role: jobRole,
          industry: 'Software Development',
          bio: `KIT Alumnus (${batchYear}). ${jobRole} at ${company}.`,
          mentor_available: true
        });

        const sessionUser = {
          id: realUserId,
          email,
          role: 'alumni',
          full_name: fullName,
          department,
          institution: 'Karpagam Institute of Technology',
          needsProfileSetup: true
        };

        this.setCurrentUser(sessionUser);
        return sessionUser;
      } catch (err) {
        if (retries === 0 || !err.message.includes('rate')) {
          throw err;
        }
        retries--;
        if (retries > 0) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
    }

    throw lastError || new Error("Signup failed after multiple attempts. Please try again later.");
  }

  // Login Flow
  async login(email, password, expectedRole) {
    if (!window.supabaseClient) {
      throw new Error("Supabase client is not initialized.");
    }

    // Call Supabase Auth signInWithPassword
    const { data, error } = await window.supabaseClient.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw new Error(error.message);
    if (!data || !data.user) throw new Error("Authentication failed.");

    const realUserId = data.user.id;

    // Fetch user profile row from database via /api/profile-me
    let userRole = expectedRole || 'student';
    let fullName = data.user.user_metadata?.full_name || email.split('@')[0];
    let department = 'Computer Science & Engineering';

    try {
      const profileRes = await window.apiClient.get(`/api/profile-me?user_id=${realUserId}`);
      if (profileRes && profileRes.user) {
        userRole = profileRes.user.role;
        fullName = profileRes.user.full_name || fullName;
        department = profileRes.user.department || department;
      }
    } catch (e) {
      console.warn("[Auth] Profile fetch warning:", e);
    }

    const sessionUser = {
      id: realUserId,
      email: data.user.email,
      role: userRole,
      full_name: fullName,
      department,
      institution: 'Karpagam Institute of Technology'
    };

    this.setCurrentUser(sessionUser);
    return sessionUser;
  }

  // Logout Flow
  async logout() {
    if (window.supabaseClient) {
      try {
        await window.supabaseClient.auth.signOut();
      } catch (e) {}
    }
    this.setCurrentUser(null);
    window.location.href = "index.html";
  }

  // Auth Guard for Protected Pages
  async requireAuth(requiredRole = null) {
    const user = this.getCurrentUser();
    if (!user) {
      window.location.href = "login.html";
      return null;
    }

    if (requiredRole && user.role !== requiredRole) {
      window.location.href = "dashboard.html";
      return null;
    }

    return user;
  }
}

window.authService = new AuthService();
