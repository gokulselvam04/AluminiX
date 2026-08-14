/*
 * AlumniX Supabase Realtime Subscription Engine
 * Listens for live database changes on mentorship_requests and jobs tables across active user browsers.
 */

class RealtimeService {
  constructor() {
    this.activeChannels = [];
  }

  init() {
    if (!window.supabaseClient) {
      console.warn("[Realtime] Supabase client not initialized.");
      return;
    }

    const user = window.authService ? window.authService.getCurrentUser() : null;
    if (!user) return;

    this.subscribeMentorshipRequests(user);
    this.subscribeJobs();
  }

  subscribeMentorshipRequests(user) {
    if (!window.supabaseClient) return;

    const channel = window.supabaseClient.channel('realtime-mentorship')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'mentorship_requests' },
        (payload) => {
          console.log("[Realtime] New Mentorship Request inserted:", payload);
          const newReq = payload.new;
          // Notify if current user is alumni or relevant
          window.dispatchEvent(new CustomEvent('alumnix:new_mentorship_request', { detail: newReq }));
          
          if (user.role === 'alumni') {
            this.showToastNotification("📩 New Mentorship Request received from a KIT student!");
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'mentorship_requests' },
        (payload) => {
          console.log("[Realtime] Mentorship Request status updated:", payload);
          const updatedReq = payload.new;
          window.dispatchEvent(new CustomEvent('alumnix:mentorship_status_changed', { detail: updatedReq }));

          if (user.role === 'student' && updatedReq.student_id === user.id) {
            this.showToastNotification(`🔔 Mentorship request status updated to "${updatedReq.status}"!`);
          }
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Mentorship channel status:", status);
      });

    this.activeChannels.push(channel);
  }

  subscribeJobs() {
    if (!window.supabaseClient) return;

    const channel = window.supabaseClient.channel('realtime-jobs')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'jobs' },
        (payload) => {
          console.log("[Realtime] New Job posted:", payload);
          const newJob = payload.new;
          window.dispatchEvent(new CustomEvent('alumnix:new_job_posted', { detail: newJob }));
          this.showToastNotification(`💼 New referral opportunity posted: ${newJob.title} @ ${newJob.company}`);
        }
      )
      .subscribe((status) => {
        console.log("[Realtime] Jobs channel status:", status);
      });

    this.activeChannels.push(channel);
  }

  showToastNotification(message) {
    let toast = document.getElementById("alumnix-toast-container");
    if (!toast) {
      toast = document.createElement("div");
      toast.id = "alumnix-toast-container";
      toast.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background-color: var(--surface-card, #ffffff);
        border: 1px solid var(--primary-green, #4CAF50);
        color: var(--text-primary, #1A1F1C);
        padding: 14px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.15);
        z-index: 9999;
        font-size: 0.9rem;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: 10px;
        transition: opacity 0.3s ease;
      `;
      document.body.appendChild(toast);
    }

    toast.innerHTML = `<span>✨</span><span>${message}</span>`;
    toast.style.opacity = "1";

    setTimeout(() => {
      if (toast) toast.style.opacity = "0";
    }, 4500);
  }

  unsubscribeAll() {
    this.activeChannels.forEach(ch => {
      if (window.supabaseClient) window.supabaseClient.removeChannel(ch);
    });
    this.activeChannels = [];
  }
}

window.realtimeService = new RealtimeService();

document.addEventListener("DOMContentLoaded", () => {
  window.realtimeService.init();
});
