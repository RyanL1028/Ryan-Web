// ── Page Navigation ──────────────────────────────────────────
var navLinks = document.querySelectorAll('.nav-link');
var pages = document.querySelectorAll('.page-section');
var navbar = document.querySelector('.navbar');
var footer = document.querySelector('.footer');

function showPage(pageName, updateHash) {
  if (typeof updateHash === 'undefined') updateHash = true;

  pages.forEach(function(p) { p.classList.remove('active'); });
  navLinks.forEach(function(l) { l.classList.remove('active'); });

  var page = document.getElementById('page-' + pageName);
  var link = document.querySelector('[data-page="' + pageName + '"]');

  if (page) page.classList.add('active');
  if (link) link.classList.add('active');

  // Update hash for hash-based pages only
  if (updateHash && pageName !== 'sch-links') {
    if (window.location.hash !== '#' + pageName) {
      history.replaceState(null, '', '#' + pageName);
    }
  }

  // Show/hide nav and footer for sch-links (standalone view)
  if (pageName === 'sch-links') {
    if (navbar) navbar.style.display = 'none';
    if (footer) footer.style.display = 'none';
  } else {
    if (navbar) navbar.style.display = '';
    if (footer) footer.style.display = '';
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
  observeSections();
}

navLinks.forEach(function(link) {
  link.addEventListener('click', function(e) {
    e.preventDefault();
    showPage(link.dataset.page);
  });
});

// ── Scroll-reveal ────────────────────────────────────────────
var observer = new IntersectionObserver(
  function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0 }
);

function observeSections() {
  var sections = document.querySelectorAll('.page-section.active .section');
  sections.forEach(function(s) {
    s.classList.remove('visible');
    observer.observe(s);
  });

  requestAnimationFrame(function() {
    requestAnimationFrame(function() {
      document.querySelectorAll('.page-section.active .section:not(.visible)').forEach(function(s) {
        var rect = s.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) {
          s.classList.add('visible');
          observer.unobserve(s);
        }
      });
    });
  });
}

// ── Load page from URL path or hash ───────────────────────────
function getPageFromPath() {
  // Check for /sch-links path first
  if (window.location.pathname === '/sch-links') {
    return 'sch-links';
  }

  // Then check hash
  var hash = window.location.hash.replace('#', '');
  var valid = ['home', 'achievements', 'performances'];
  return valid.indexOf(hash) !== -1 ? hash : 'home';
}

showPage(getPageFromPath(), false);

window.addEventListener('hashchange', function() {
  showPage(getPageFromPath(), false);
});
