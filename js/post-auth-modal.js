/**
 * AlumniX Post-Authentication Modal
 * Collects mandatory fields (department, role confirmation) after Google OAuth login/signup
 * Prevents users from bypassing required profile information
 */

class PostAuthModal {
  constructor() {
    this.isOpen = false;
    this.pendingUser = null;
    this.role = null;
  }

  /**
   * Show modal to collect mandatory fields for new/incomplete Google users
   */
  async show(user, role = 'student') {
    this.pendingUser = user;
    this.role = role;

    // Create modal HTML if it doesn't exist
    if (!document.getElementById('postAuthModalContainer')) {
      this.createModalHTML();
    }

    const modal = document.getElementById('postAuthModalContainer');
    if (modal) {
      modal.style.display = 'flex';
      this.isOpen = true;
      this.setupEventListeners();
      
      // Populate fields with user data
      const nameEl = document.getElementById('postAuthName');
      const emailEl = document.getElementById('postAuthEmail');
      const roleEl = document.getElementById('postAuthRole');
      
      if (nameEl) nameEl.value = user.full_name || user.name || '';
      if (emailEl) emailEl.value = user.email || '';
      if (roleEl) roleEl.value = role;
    }
  }

  /**
   * Hide modal
   */
  hide() {
    const modal = document.getElementById('postAuthModalContainer');
    if (modal) {
      modal.style.display = 'none';
      this.isOpen = false;
    }
  }

  /**
   * Create modal HTML structure
   */
  createModalHTML() {
    const modalHTML = `
      <div id="postAuthModalContainer" class="post-auth-modal-overlay" style="display: none;">
        <div class="post-auth-modal-content">
          <div class="post-auth-modal-header">
            <h2>Complete Your Profile</h2>
            <p>Just a few quick details to get you started</p>
          </div>

          <div class="post-auth-modal-body">
            <div id="postAuthAlert" class="post-auth-alert" style="display: none;"></div>

            <form id="postAuthForm" novalidate>
              <div class="post-auth-form-group">
                <label for="postAuthName">Full Name</label>
                <input 
                  type="text" 
                  id="postAuthName" 
                  placeholder="Your full name" 
                  required
                  readonly
                >
              </div>

              <div class="post-auth-form-group">
                <label for="postAuthEmail">Email Address</label>
                <input 
                  type="email" 
                  id="postAuthEmail" 
                  placeholder="your@email.com" 
                  required
                  readonly
                >
              </div>

              <div class="post-auth-form-group">
                <label for="postAuthRole">Role</label>
                <select id="postAuthRole" required disabled>
                  <option value="student">Student</option>
                  <option value="alumni">Alumni</option>
                </select>
              </div>

              <div class="post-auth-form-group">
                <label for="postAuthDept">Department *</label>
                <select id="postAuthDept" required>
                  <option value="">Select your department</option>
                  <option value="Computer Science">Computer Science & Engineering</option>
                  <option value="Electronics">Electronics & Communication</option>
                  <option value="Mechanical">Mechanical Engineering</option>
                  <option value="Civil">Civil Engineering</option>
                  <option value="Electrical">Electrical Engineering</option>
                  <option value="Information">Information Technology</option>
                </select>
              </div>

              <button type="submit" class="post-auth-submit-btn" id="postAuthSubmitBtn">
                Continue to Dashboard
              </button>
            </form>
          </div>
        </div>
      </div>

      <style>
        .post-auth-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.7);
          display: flex !important;
          align-items: center;
          justify-content: center;
          z-index: 9999;
          backdrop-filter: blur(4px);
        }

        .post-auth-modal-content {
          background: white;
          border-radius: 16px;
          width: 90%;
          max-width: 480px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          overflow: hidden;
          animation: modalSlideIn 0.3s ease;
        }

        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .post-auth-modal-header {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 32px 28px;
          text-align: center;
        }

        .post-auth-modal-header h2 {
          font-size: 24px;
          font-weight: 700;
          margin-bottom: 6px;
        }

        .post-auth-modal-header p {
          font-size: 13px;
          opacity: 0.9;
        }

        .post-auth-modal-body {
          padding: 32px 28px;
        }

        .post-auth-alert {
          padding: 12px 14px;
          border-radius: 8px;
          margin-bottom: 20px;
          font-size: 13px;
          display: none;
          animation: slideDown 0.3s ease;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            max-height: 0;
          }
          to {
            opacity: 1;
            max-height: 200px;
          }
        }

        .post-auth-alert.show {
          display: block;
        }

        .post-auth-alert.error {
          background: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .post-auth-alert.success {
          background: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .post-auth-form-group {
          margin-bottom: 20px;
        }

        .post-auth-form-group label {
          display: block;
          color: #333;
          font-weight: 600;
          margin-bottom: 8px;
          font-size: 13px;
        }

        .post-auth-form-group input,
        .post-auth-form-group select {
          width: 100%;
          padding: 11px 13px;
          border: 2px solid #e0e0e0;
          border-radius: 8px;
          font-size: 13px;
          font-family: inherit;
          transition: all 0.2s ease;
        }

        .post-auth-form-group input:focus,
        .post-auth-form-group select:focus {
          outline: none;
          border-color: #667eea;
          box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
        }

        .post-auth-form-group input[readonly] {
          background-color: #f8f9fa;
          cursor: not-allowed;
          color: #666;
        }

        .post-auth-form-group input[disabled],
        .post-auth-form-group select[disabled] {
          background-color: #f8f9fa;
          cursor: not-allowed;
          color: #666;
        }

        .post-auth-submit-btn {
          width: 100%;
          padding: 12px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
        }

        .post-auth-submit-btn:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
        }

        .post-auth-submit-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .post-auth-spinner {
          width: 12px;
          height: 12px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;

    const container = document.createElement('div');
    container.innerHTML = modalHTML;
    document.body.appendChild(container.firstElementChild);
  }

  /**
   * Setup event listeners for modal form
   */
  setupEventListeners() {
    const form = document.getElementById('postAuthForm');
    const submitBtn = document.getElementById('postAuthSubmitBtn');

    if (form) {
      form.removeEventListener('submit', this.handleSubmit.bind(this));
      form.addEventListener('submit', this.handleSubmit.bind(this));
    }
  }

  /**
   * Handle form submission
   */
  async handleSubmit(e) {
    e.preventDefault();

    const dept = document.getElementById('postAuthDept')?.value;
    const alert = document.getElementById('postAuthAlert');
    const submitBtn = document.getElementById('postAuthSubmitBtn');

    if (!dept) {
      this.showAlert('Please select your department', 'error');
      return;
    }

    submitBtn.disabled = true;
    submitBtn.innerHTML = '<span class="post-auth-spinner"></span> Saving...';

    try {
      // Update user record with department
      const updatedUser = {
        ...this.pendingUser,
        department: dept
      };

      // Check if Supabase client is available
      if (window.supabaseClient && window.supabaseClient.auth) {
        const { data: { session } } = await window.supabaseClient.auth.getSession();
        if (session && session.user) {
          // Update via backend API
          const res = await fetch('/api/profile-me', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              user_id: session.user.id,
              department: dept
            })
          });

          if (!res.ok) {
            const err = await res.json();
            throw new Error(err.error || 'Failed to update profile');
          }
        }
      }

      // Update localStorage
      updatedUser.department = dept;
      localStorage.setItem('alumnix_user_session', JSON.stringify(updatedUser));
      localStorage.setItem('alumnix_user', JSON.stringify(updatedUser));

      this.showAlert('Profile updated successfully! Redirecting...', 'success');
      this.hide();

      setTimeout(() => {
        window.location.href = 'dashboard.html';
      }, 800);
    } catch (err) {
      console.error('[PostAuthModal] Error:', err);
      this.showAlert(err.message || 'An error occurred. Please try again.', 'error');
      submitBtn.disabled = false;
      submitBtn.innerHTML = 'Continue to Dashboard';
    }
  }

  /**
   * Show alert message
   */
  showAlert(msg, type = 'error') {
    const alert = document.getElementById('postAuthAlert');
    if (alert) {
      alert.textContent = msg;
      alert.className = `post-auth-alert show ${type}`;
      if (type === 'success') {
        setTimeout(() => alert.classList.remove('show'), 2000);
      }
    }
  }
}

// Initialize global instance
window.postAuthModal = new PostAuthModal();
