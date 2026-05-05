/**
 * FairRide - Navigation & Global UI Script (v2)
 * Handles: bottom nav links, hamburger drawer, dark mode
 * Works across: calculator.html, history.html, settings.html
 */

(function () {

  // ─── 1. DETECT CURRENT PAGE ─────────────────────────────────────────
  const path = window.location.pathname.split('/').pop() || 'calculator.html';
  const currentPage =
    path.includes('history')  ? 'history'  :
    path.includes('settings') ? 'settings' :
    'calculator';

  const PAGES = {
    calculator: 'calculator.html',
    history:    'history.html',
    settings:   'settings.html'
  };

  // ─── 2. FIX BOTTOM NAV LINKS ────────────────────────────────────────
  // Bottom nav is the LAST nav/footer on the page (not the top bar)
  function wireBottomNav() {
    // Collect all fixed bottom nav / footer containers
    const allFixed = Array.from(document.querySelectorAll('footer, nav'));
    // The bottom bar is always the LAST fixed element at the bottom
    const bottomBar = allFixed.filter(el => {
      const style = el.getAttribute('class') || '';
      return style.includes('bottom-0') || el.tagName === 'FOOTER';
    }).pop();

    if (!bottomBar) return;

    const links = bottomBar.querySelectorAll('a');
    links.forEach(a => {
      const text = a.textContent.trim().toLowerCase();
      if (text.includes('calculat')) {
        a.href = PAGES.calculator;
        a.addEventListener('click', e => { e.preventDefault(); window.location.href = PAGES.calculator; });
      } else if (text.includes('history')) {
        a.href = PAGES.history;
        a.addEventListener('click', e => { e.preventDefault(); window.location.href = PAGES.history; });
      } else if (text.includes('setting')) {
        a.href = PAGES.settings;
        a.addEventListener('click', e => { e.preventDefault(); window.location.href = PAGES.settings; });
      }
    });
  }

  // ─── 3. HAMBURGER / NAV DRAWER ───────────────────────────────────────
  function buildNavDrawer() {
    let drawerOpen = false;

    // --- Overlay ---
    const overlay = document.createElement('div');
    overlay.id = 'fr-overlay';
    Object.assign(overlay.style, {
      position: 'fixed', inset: '0', zIndex: '9998',
      background: 'rgba(0,0,0,0.38)',
      backdropFilter: 'blur(3px)',
      opacity: '0', pointerEvents: 'none',
      transition: 'opacity 0.28s ease'
    });

    // --- Drawer panel ---
    const drawer = document.createElement('aside');
    drawer.id = 'fr-drawer';
    Object.assign(drawer.style, {
      position: 'fixed', top: '0', left: '0', zIndex: '9999',
      width: '272px', height: '100%',
      background: '#f8f9fa',
      borderRadius: '0 2rem 2rem 0',
      boxShadow: '0 24px 64px rgba(25,28,29,0.22)',
      display: 'flex', flexDirection: 'column',
      padding: '2.5rem 0 1.5rem',
      transform: 'translateX(-100%)',
      transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
      fontFamily: "'Inter', sans-serif",
      overflowY: 'auto'
    });

    // --- Helpers ---
    const activeStyle = [
      'display:flex','align-items:center','gap:0.9rem',
      'background:#d1fae5','color:#065f46',
      'border-radius:9999px','padding:0.85rem 1.5rem',
      'font-weight:700','font-size:0.95rem',
      'text-decoration:none','margin:2px 1rem',
      'border:none','cursor:pointer','width:calc(100% - 2rem)'
    ].join(';');

    const inactiveStyle = [
      'display:flex','align-items:center','gap:0.9rem',
      'color:#374151',
      'border-radius:9999px','padding:0.85rem 1.5rem',
      'font-weight:600','font-size:0.95rem',
      'text-decoration:none','margin:2px 1rem',
      'border:none','background:transparent','cursor:pointer',
      'width:calc(100% - 2rem)','transition:background 0.2s'
    ].join(';');

    const navItem = (icon, label, page) => {
      const isActive = currentPage === page;
      const fillSet = isActive ? "font-variation-settings:'FILL' 1;" : '';
      const el = document.createElement('a');
      el.href = PAGES[page];
      el.setAttribute('style', isActive ? activeStyle : inactiveStyle);
      el.innerHTML = `
        <span class="material-symbols-outlined" style="font-size:22px;${fillSet}">${icon}</span>
        <span>${label}</span>
      `;
      if (!isActive) {
        el.addEventListener('mouseover', () => el.style.background = '#f0fdf4');
        el.addEventListener('mouseout',  () => el.style.background = 'transparent');
      }
      return el;
    };

    // --- Drawer HTML ---
    // Profile header
    const profileDiv = document.createElement('div');
    profileDiv.style.cssText = 'padding:0 2rem 2rem;';
    profileDiv.innerHTML = `
      <div style="position:relative;width:5rem;height:5rem;margin-bottom:1rem;">
        <div style="width:5rem;height:5rem;border-radius:9999px;overflow:hidden;border:3px solid rgba(46,204,113,0.25);">
          <img src="https://lh3.googleusercontent.com/aida-public/AB6AXuCyVc9BnMr3YimUnUmoLCjzaU-hDFDBzF2ZmZxq9xmvG6dvEEI6ZFVkczlwuE99tgPkju4bA6SDtLt1hRPRhe_mXQhgjui1_7bDrr_SBb62nMognhWrWapPc8dEYfaD9h1loIB7EIIQ_od9Lj2S9WFtJrQuEaRYz63zDF7o6_NTy2pxQGjz9Tzt1BCpnpcHpcN3RvEXYQvRdb9mZPO43RGE7YFhEIGh2ojALlTKx1FC14GNcqo5PzGiysq0q92CJ_JKrnRWhCkmBdA"
               style="width:100%;height:100%;object-fit:cover;" alt="Profile"/>
        </div>
        <div style="position:absolute;bottom:0;right:0;width:1.35rem;height:1.35rem;background:#2ecc71;border-radius:9999px;display:flex;align-items:center;justify-content:center;border:2px solid #f8f9fa;">
          <span class="material-symbols-outlined" style="font-size:12px;color:#005027;font-variation-settings:'FILL' 1;">verified</span>
        </div>
      </div>
      <h2 style="font-family:'Manrope',sans-serif;font-size:1.25rem;font-weight:800;color:#191c1d;letter-spacing:-0.03em;margin:0 0 4px;">Alex Thompson</h2>
      <span style="font-size:10px;font-weight:700;padding:2px 8px;background:#d1fae5;color:#065f46;border-radius:9999px;text-transform:uppercase;letter-spacing:-0.02em;">Premium Member</span>
    `;

    // Nav section
    const navSection = document.createElement('nav');
    navSection.style.cssText = 'flex:1;display:flex;flex-direction:column;gap:2px;padding:0.5rem 0;';
    navSection.appendChild(navItem('calculate', 'Calculator', 'calculator'));
    navSection.appendChild(navItem('history',   'History',    'history'));
    navSection.appendChild(navItem('settings',  'Settings',   'settings'));

    // Divider
    const divider = document.createElement('div');
    divider.style.cssText = 'height:1px;background:#e1e3e4;margin:0.75rem 1.5rem;';

    // Sign out
    const signOut = document.createElement('button');
    signOut.setAttribute('style', [
      'display:flex','align-items:center','gap:0.9rem',
      'color:#ba1a1a','padding:0.85rem 1.5rem',
      'border-radius:9999px','font-weight:700','font-size:0.95rem',
      'border:none','background:transparent','cursor:pointer',
      'width:calc(100% - 2rem)','margin:2px 1rem',
      'transition:background 0.2s'
    ].join(';'));
    signOut.innerHTML = `<span class="material-symbols-outlined" style="font-size:22px;">logout</span><span>Sign Out</span>`;
    signOut.addEventListener('mouseover', () => signOut.style.background = 'rgba(186,26,26,0.07)');
    signOut.addEventListener('mouseout',  () => signOut.style.background = 'transparent');
    signOut.addEventListener('click', () => {
      if (confirm('Sign out of FairRide?')) alert('Signed out! (Demo mode)');
    });

    // Brand footer
    const brand = document.createElement('div');
    brand.style.cssText = 'padding:1rem 2rem 0;border-top:1px solid #e1e3e4;margin-top:0.5rem;';
    brand.innerHTML = `
      <div style="font-family:'Manrope',sans-serif;font-size:1.25rem;font-weight:900;color:#006d37;">FairRide</div>
      <p style="font-size:10px;color:#9ca3af;letter-spacing:0.1em;text-transform:uppercase;margin:2px 0 0;">v2.4.0 · Emerald Edition</p>
    `;

    // Assemble drawer
    drawer.appendChild(profileDiv);
    drawer.appendChild(navSection);
    drawer.appendChild(divider);
    drawer.appendChild(signOut);
    drawer.appendChild(brand);

    // Add to DOM
    document.body.appendChild(overlay);
    document.body.appendChild(drawer);

    // --- Open / Close ---
    function openDrawer() {
      drawerOpen = true;
      drawer.style.transform = 'translateX(0)';
      overlay.style.opacity = '1';
      overlay.style.pointerEvents = 'auto';
    }
    function closeDrawer() {
      drawerOpen = false;
      drawer.style.transform = 'translateX(-100%)';
      overlay.style.opacity = '0';
      overlay.style.pointerEvents = 'none';
    }
    function toggleDrawer() { drawerOpen ? closeDrawer() : openDrawer(); }

    overlay.addEventListener('click', closeDrawer);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeDrawer(); });

    // --- Wire hamburger icon ─────────────────────────────────────────
    // Strategy: find ALL material-symbol spans with text "menu", make them clickable
    function wireMenuIcon() {
      const allSpans = document.querySelectorAll('span.material-symbols-outlined');
      allSpans.forEach(span => {
        if (span.textContent.trim() === 'menu') {
          span.style.cursor = 'pointer';

          // Walk up to find the nearest clickable ancestor (button or the span itself)
          const btn = span.closest('button') || span;
          // Remove any existing listeners by cloning (safety)
          const clone = btn.cloneNode(true);
          if (btn.parentNode) btn.parentNode.replaceChild(clone, btn);

          // Re-acquire the span inside the clone
          const targetSpan = clone.tagName === 'SPAN' ? clone : clone.querySelector('span.material-symbols-outlined');
          const clickTarget = clone;
          clickTarget.style.cursor = 'pointer';
          clickTarget.addEventListener('click', toggleDrawer);
        }
      });
    }

    wireMenuIcon();
  }

  // ─── 4. DARK MODE (Settings page) ────────────────────────────────────
  function wireDarkMode() {
    // Apply saved preference
    const saved = localStorage.getItem('fairRideTheme') || 'light';
    document.documentElement.className = saved;   // sets 'light' or 'dark'

    // Find Light / Dark buttons anywhere on the page
    document.querySelectorAll('button').forEach(btn => {
      const t = btn.textContent.trim().toLowerCase();
      if (t === 'light' || t === 'dark') {
        btn.style.cursor = 'pointer';
        btn.addEventListener('click', () => {
          const isDark = t === 'dark';
          const theme  = isDark ? 'dark' : 'light';
          localStorage.setItem('fairRideTheme', theme);
          document.documentElement.className = theme;

          // Re-style sibling buttons
          const container = btn.closest('.flex');
          if (container) {
            container.querySelectorAll('button').forEach(b => {
              const active = b.textContent.trim().toLowerCase() === t;
              b.style.background    = active ? '#ffffff' : 'transparent';
              b.style.boxShadow     = active ? '0 1px 3px rgba(0,0,0,0.12)' : 'none';
              b.style.fontWeight    = active ? '700' : '600';
              b.style.color         = active ? '#191c1d' : '#6b7280';
            });
          }
        });
      }
    });
  }

  // ─── 5. HISTORY PAGE: inject real saved trips ─────────────────────────
  function wireHistoryPage() {
    if (currentPage !== 'history') return;
    const raw = localStorage.getItem('fairRideHistory');
    if (!raw) return;
    try {
      const entries = JSON.parse(raw);
      if (!entries.length) return;
      const list = document.querySelector('.space-y-6');
      if (!list) return;

      const iconMap  = { Bike: 'two_wheeler', Auto: 'electric_rickshaw', Car: 'directions_car' };
      const recent   = entries.slice(-4).reverse();

      recent.forEach(entry => {
        const date = new Date(entry.savedAt).toLocaleString('en-IN', {
          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
        });
        const el = document.createElement('div');
        el.style.cssText = 'border-left: 3px solid #2ecc71;';
        el.className = 'bg-surface-container-low p-5 rounded-lg flex items-center justify-between hover:bg-surface-container transition-colors';
        el.innerHTML = `
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-full bg-primary-container/20 flex items-center justify-center text-primary">
              <span class="material-symbols-outlined" style="font-variation-settings:'FILL' 1;">${iconMap[entry.vehicle] || 'directions_car'}</span>
            </div>
            <div>
              <p class="text-[10px] font-bold text-on-surface-variant opacity-50">${date} · Live</p>
              <p class="font-bold text-on-surface">${entry.vehicle} Trip</p>
              <p class="text-xs text-on-surface-variant">${entry.distance} km · ${entry.fuel}</p>
            </div>
          </div>
          <p class="text-xl font-extrabold text-on-surface tracking-tight">₹${entry.totalFare}</p>
        `;
        list.insertBefore(el, list.firstChild);
      });
    } catch (e) { /* silent */ }
  }

  // ─── 6. BOOT ─────────────────────────────────────────────────────────
  function init() {
    wireBottomNav();
    buildNavDrawer();
    wireDarkMode();
    wireHistoryPage();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init(); // already parsed
  }

})();
