// blog.js — Japan 2026 Travel Blog (Supabase Backend)
// ======================================================

// ── Trip Date Mapping ──────────────────────────────────────────
var TRIP_DAYS = [
  { day: 1,  date: '2026-06-28', weekday: 'Sunday' },
  { day: 2,  date: '2026-06-29', weekday: 'Monday' },
  { day: 3,  date: '2026-06-30', weekday: 'Tuesday' },
  { day: 4,  date: '2026-07-01', weekday: 'Wednesday' },
  { day: 5,  date: '2026-07-02', weekday: 'Thursday' },
  { day: 6,  date: '2026-07-03', weekday: 'Friday' },
  { day: 7,  date: '2026-07-04', weekday: 'Saturday' },
  { day: 8,  date: '2026-07-05', weekday: 'Sunday' },
  { day: 9,  date: '2026-07-06', weekday: 'Monday' },
  { day: 10, date: '2026-07-07', weekday: 'Tuesday' },
  { day: 11, date: '2026-07-08', weekday: 'Wednesday' },
  { day: 12, date: '2026-07-09', weekday: 'Thursday' },
  { day: 13, date: '2026-07-10', weekday: 'Friday' },
  { day: 14, date: '2026-07-11', weekday: 'Saturday' },
  { day: 15, date: '2026-07-12', weekday: 'Sunday' }
];

var FAMILY_MEMBERS = ['舅父仔', '嫲嫲', '婆婆', 'Ryan', 'Mom', 'Dad'];

// ── Helpers ────────────────────────────────────────────────────
function formatDate(dateStr) {
  var d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function timeAgo(ts) {
  if (!ts) return '';
  var d = new Date(ts);
  var diff = Date.now() - d.getTime();
  var mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return mins + 'm ago';
  var hours = Math.floor(mins / 60);
  if (hours < 24) return hours + 'h ago';
  var days = Math.floor(hours / 24);
  return days + 'd ago';
}

function toast(message, type) {
  type = type || 'info';
  var container = document.getElementById('toast-container');
  var el = document.createElement('div');
  el.className = 'toast toast--' + type;
  el.textContent = message;
  el.addEventListener('click', function() { el.remove(); });
  container.appendChild(el);
  setTimeout(function() {
    if (el.parentNode) { el.classList.add('toast--out'); setTimeout(function() { el.remove(); }, 300); }
  }, 4000);
}

// ── Path Router ────────────────────────────────────────────────
function getBlogPage() {
  var path = window.location.pathname;
  if (path === '/jp26/leungfamily/add/' || path === '/jp26/leungfamily/add') return 'add';
  if (path.indexOf('/jp26/leungfamily') === 0) return 'family';
  return 'public';
}

// ── Password Gate ──────────────────────────────────────────────
function getSession() {
  try {
    var raw = localStorage.getItem('jp26_session');
    if (!raw) return null;
    var session = JSON.parse(raw);
    if (session.token === 'jp26_2026_authenticated' && session.identity) return session;
  } catch (e) {}
  return null;
}

function saveSession(identity) {
  var session = { identity: identity, token: 'jp26_2026_authenticated', ts: Date.now() };
  localStorage.setItem('jp26_session', JSON.stringify(session));
  return session;
}

function showPasswordGate() {
  var overlay = document.getElementById('pw-overlay');
  overlay.classList.remove('hidden');
  document.getElementById('pw-input').value = '';
  document.getElementById('pw-error').textContent = '';
  document.getElementById('blog-nav').classList.add('hidden');
  var identityDiv = document.getElementById('pw-identity');
  if (!getSession()) { identityDiv.classList.remove('hidden'); }
  else { identityDiv.classList.add('hidden'); }
}

function hidePasswordGate() {
  document.getElementById('pw-overlay').classList.add('hidden');
  document.getElementById('blog-nav').classList.remove('hidden');
}

function handlePasswordSubmit() {
  var input = document.getElementById('pw-input');
  var code = input.value.trim();
  var errorEl = document.getElementById('pw-error');
  var card = document.querySelector('.pw-card');

  if (code === '281013') {
    var identityEl = document.querySelector('input[name="identity"]:checked');
    var identity = identityEl ? identityEl.value : null;
    var existingSession = getSession();

    if (existingSession && existingSession.identity !== 'unset') {
      hidePasswordGate();
      renderCurrentPage();
      return;
    }

    if (!identity && !existingSession) {
      errorEl.textContent = 'Please select who you are first';
      return;
    }

    saveSession(identity || existingSession.identity);
    errorEl.textContent = '';
    card.classList.remove('shake');
    hidePasswordGate();
    renderCurrentPage();
  } else {
    errorEl.textContent = 'That\'s not the right code. Try again!';
    card.classList.add('shake');
    setTimeout(function() { card.classList.remove('shake'); }, 400);
    input.value = '';
    input.focus();
  }
}

// ── Render Controller ──────────────────────────────────────────
function renderCurrentPage() {
  var page = getBlogPage();
  var main = document.getElementById('blog-main');
  main.innerHTML = '';

  document.querySelectorAll('.blog-nav-link').forEach(function(l) {
    l.classList.remove('active');
    if (l.getAttribute('data-blog-page') === page || (page === 'family' && l.getAttribute('data-blog-page') === 'family')) {
      l.classList.add('active');
    }
  });

  var addLink = document.querySelector('.blog-nav-link--add');
  if (page === 'family' || page === 'add') addLink.classList.remove('hidden');
  else addLink.classList.add('hidden');

  if (page === 'public') {
    renderPublicBlog();
  } else if (page === 'family') {
    if (!getSession()) {
      showPasswordGate();
      main.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Please unlock to continue...</p></div>';
    } else {
      hidePasswordGate();
      renderFamilyBlog();
    }
  } else if (page === 'add') {
    if (!getSession()) {
      showPasswordGate();
      main.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Please unlock to continue...</p></div>';
    } else {
      hidePasswordGate();
      renderAddForm();
    }
  }
}

// ── Calendar Rendering ─────────────────────────────────────────
function renderCalendar(container, postsMap, isFamily) {
  var grid = document.createElement('div');
  grid.className = 'calendar-grid';

  TRIP_DAYS.forEach(function(tripDay) {
    var post = postsMap[tripDay.day];
    var card = document.createElement('div');

    if (post) {
      card.className = 'day-card';
      card.addEventListener('click', function() { renderPostDetail(post, isFamily); });

      if (post.cover_image) {
        var img = document.createElement('img');
        img.className = 'day-card__image';
        img.src = post.cover_image;
        img.alt = post.title || ('Day ' + tripDay.day);
        img.loading = 'lazy';
        card.appendChild(img);
      } else {
        var ph = document.createElement('div');
        ph.className = 'day-card__image-placeholder';
        ph.textContent = 'Day ' + tripDay.day;
        card.appendChild(ph);
      }

      var badge = document.createElement('span');
      badge.className = 'day-card__badge';
      badge.textContent = 'Day ' + tripDay.day;
      card.appendChild(badge);

      var body = document.createElement('div');
      body.className = 'day-card__body';
      body.innerHTML = '<div class="day-card__date">' + formatDate(tripDay.date) + ' · ' + tripDay.weekday + '</div>' +
        (post.location ? '<div class="day-card__location">📍 ' + post.location + '</div>' : '') +
        '<div class="day-card__title">' + (post.title || ('Day ' + tripDay.day)) + '</div>' +
        '<div class="day-card__author">By ' + post.author + '</div>';
      card.appendChild(body);
    } else {
      card.className = 'day-card day-card--empty';
      card.innerHTML = '<div class="day-card__image-placeholder">Day ' + tripDay.day + '</div>' +
        '<span class="day-card__badge">Day ' + tripDay.day + '</span>' +
        '<div class="day-card__body"><div class="day-card__date">' + formatDate(tripDay.date) + ' · ' + tripDay.weekday + '</div>' +
        '<div class="day-card__title" style="color:var(--text-muted)">No post yet</div></div>';
      card.title = 'Day ' + tripDay.day + ' — ' + formatDate(tripDay.date) + ' — No post yet';

      if (isFamily) {
        card.className = 'day-card day-card--add';
        card.style.cursor = 'pointer';
        card.addEventListener('click', function() { window.location.href = '/jp26/leungfamily/add/?day=' + tripDay.day; });
      }
    }
    grid.appendChild(card);
  });
  container.appendChild(grid);
}

// ── Public Blog ─────────────────────────────────────────────────
function renderPublicBlog() {
  var main = document.getElementById('blog-main');
  main.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Loading public blog...</p></div>';

  window.supabaseReady.then(function() {
    window.supabase.from('jp26_posts')
      .select('*')
      .eq('is_public', true)
      .order('day', { ascending: true })
      .then(function(result) {
        if (result.error) throw result.error;
        var postsMap = {};
        (result.data || []).forEach(function(row) { postsMap[row.day] = row; });

        main.innerHTML = '';
        var header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>🇯🇵 Kyushu & Kansai 2026</h1><p>A 15-day family trip across Japan. Click a day to explore.</p>';
        main.appendChild(header);

        if (!result.data || result.data.length === 0) {
          var empty = document.createElement('div');
          empty.className = 'empty-state';
          empty.innerHTML = '<div class="empty-state__icon">📸</div><div class="empty-state__title">No public posts yet</div><div class="empty-state__text">Check back soon for trip highlights!</div>';
          main.appendChild(empty);
        } else {
          renderCalendar(main, postsMap, false);
        }
      })
      .catch(function(err) {
        console.error(err);
        main.innerHTML = '<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__title">Could not load posts</div><div class="empty-state__text">' + (err.message || 'Unknown error') + '</div></div>';
      });
  });
}

// ── Family Blog ─────────────────────────────────────────────────
function renderFamilyBlog() {
  var main = document.getElementById('blog-main');
  main.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Loading family blog...</p></div>';

  window.supabaseReady.then(function() {
    window.supabase.from('jp26_posts')
      .select('*')
      .order('day', { ascending: true })
      .then(function(result) {
        if (result.error) throw result.error;
        var postsMap = {};
        (result.data || []).forEach(function(row) {
          if (!postsMap[row.day] || (row.updated_at && postsMap[row.day].updated_at && new Date(row.updated_at) > new Date(postsMap[row.day].updated_at))) {
            postsMap[row.day] = row;
          }
        });

        var session = getSession();
        main.innerHTML = '';
        var header = document.createElement('div');
        header.className = 'page-header';
        header.innerHTML = '<h1>👨‍👩‍👦 Family Memories</h1><p>Welcome back, ' + (session ? session.identity : '') + '! All our Japan memories in one place.</p>';
        main.appendChild(header);
        renderCalendar(main, postsMap, true);
      })
      .catch(function(err) {
        console.error(err);
        main.innerHTML = '<div class="empty-state"><div class="empty-state__icon">⚠️</div><div class="empty-state__title">Could not load posts</div><div class="empty-state__text">' + (err.message || 'Unknown error') + '</div></div>';
      });
  });
}

// ── Post Detail View ────────────────────────────────────────────
function renderPostDetail(post, isFamily) {
  var main = document.getElementById('blog-main');
  main.innerHTML = '';
  var container = document.createElement('div');
  container.className = 'post-detail';

  var backLink = document.createElement('a');
  backLink.href = isFamily ? '/jp26/leungfamily/' : '/jp26/';
  backLink.className = 'post-detail__back';
  backLink.textContent = '← Back to calendar';
  backLink.addEventListener('click', function(e) {
    e.preventDefault();
    window.history.pushState({}, '', backLink.href);
    if (isFamily) renderFamilyBlog(); else renderPublicBlog();
  });
  container.appendChild(backLink);

  // Cover image
  if (post.cover_image) {
    var cover = document.createElement('img');
    cover.className = 'post-detail__cover';
    cover.src = post.cover_image;
    cover.alt = post.title;
    container.appendChild(cover);
  }

  // Header
  var header = document.createElement('div');
  header.className = 'post-detail__header';
  header.innerHTML = '<div class="post-detail__meta">' +
    '<span class="post-detail__badge">Day ' + post.day + '</span>' +
    '<span class="post-detail__date">' + formatDate(post.date) + '</span>' +
    (post.location ? '<span class="post-detail__location">📍 ' + post.location + '</span>' : '') +
    '</div>' +
    '<h1 class="post-detail__title">' + (post.title || 'Day ' + post.day) + '</h1>' +
    '<div class="post-detail__author">By ' + post.author + '</div>';
  container.appendChild(header);

  // Rich content
  if (post.content_html) {
    var contentDiv = document.createElement('div');
    contentDiv.className = 'post-detail__content';
    contentDiv.innerHTML = post.content_html;
    container.appendChild(contentDiv);
  }

  // Photo gallery
  if (post.images && Array.isArray(post.images) && post.images.length > 0 && post.images[0]) {
    container.appendChild(createGallery('Photos', post.images, 'image'));
  }

  // Videos
  if (post.videos && Array.isArray(post.videos) && post.videos.length > 0 && post.videos[0]) {
    var vidTitle = document.createElement('div');
    vidTitle.className = 'gallery-title';
    vidTitle.textContent = 'Videos (' + post.videos.length + ')';
    container.appendChild(vidTitle);
    post.videos.forEach(function(url) {
      var vid = document.createElement('video');
      vid.className = 'video-item';
      vid.src = url;
      vid.controls = true;
      vid.preload = 'metadata';
      container.appendChild(vid);
    });
  }

  // Edit button (family only)
  if (isFamily) {
    var session = getSession();
    if (session && session.identity === post.author) {
      var editBtn = document.createElement('a');
      editBtn.href = '/jp26/leungfamily/add/?edit=' + post.id;
      editBtn.className = 'post-detail__back';
      editBtn.style.cssText = 'margin-left:12px;';
      editBtn.textContent = '✏️ Edit this post';
      container.appendChild(editBtn);
    }
  }

  main.appendChild(container);
  renderComments(container, post.id, isFamily);
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function createGallery(title, items, type) {
  var wrapper = document.createElement('div');
  var hdr = document.createElement('div');
  hdr.className = 'gallery-title';
  hdr.textContent = title + ' (' + items.length + ')';
  wrapper.appendChild(hdr);

  var grid = document.createElement('div');
  grid.className = 'gallery-grid';
  items.forEach(function(url, idx) {
    if (!url) return;
    if (type === 'image') {
      var thumb = document.createElement('img');
      thumb.className = 'gallery-item';
      thumb.src = url;
      thumb.alt = 'Photo ' + (idx + 1);
      thumb.loading = 'lazy';
      thumb.addEventListener('click', function() { openLightbox(items.filter(Boolean), idx); });
      grid.appendChild(thumb);
    }
  });
  wrapper.appendChild(grid);
  return wrapper;
}

// ── Lightbox ────────────────────────────────────────────────────
var lightboxData = { images: [], index: 0 };

function openLightbox(images, index) {
  lightboxData.images = images;
  lightboxData.index = index;
  var lb = document.getElementById('lightbox');
  if (!lb) {
    lb = document.createElement('div');
    lb.className = 'lightbox';
    lb.id = 'lightbox';
    lb.innerHTML = '<button class="lightbox__close">&times;</button>' +
      '<button class="lightbox__nav lightbox__nav--prev">‹</button>' +
      '<button class="lightbox__nav lightbox__nav--next">›</button>' +
      '<img src="" alt="">';
    document.body.appendChild(lb);

    lb.querySelector('.lightbox__close').addEventListener('click', function(e) { e.stopPropagation(); lb.classList.add('hidden'); });
    lb.addEventListener('click', function() { lb.classList.add('hidden'); });
    lb.querySelector('.lightbox__nav--prev').addEventListener('click', function(e) {
      e.stopPropagation();
      lightboxData.index = (lightboxData.index - 1 + lightboxData.images.length) % lightboxData.images.length;
      updateLightboxImage(lb);
    });
    lb.querySelector('.lightbox__nav--next').addEventListener('click', function(e) {
      e.stopPropagation();
      lightboxData.index = (lightboxData.index + 1) % lightboxData.images.length;
      updateLightboxImage(lb);
    });
    lb.querySelector('img').addEventListener('click', function(e) { e.stopPropagation(); });
    document.addEventListener('keydown', function(e) {
      if (lb.classList.contains('hidden')) return;
      if (e.key === 'Escape') lb.classList.add('hidden');
      if (e.key === 'ArrowLeft') { lightboxData.index = (lightboxData.index - 1 + lightboxData.images.length) % lightboxData.images.length; updateLightboxImage(lb); }
      if (e.key === 'ArrowRight') { lightboxData.index = (lightboxData.index + 1) % lightboxData.images.length; updateLightboxImage(lb); }
    });
  }
  updateLightboxImage(lb);
  lb.classList.remove('hidden');
}

function updateLightboxImage(lb) {
  lb.querySelector('img').src = lightboxData.images[lightboxData.index];
  var nav = lb.querySelectorAll('.lightbox__nav');
  var show = lightboxData.images.length > 1 ? '' : 'none';
  nav.forEach(function(n) { n.style.display = show; });
}

// ── Comments ────────────────────────────────────────────────────
function renderComments(container, postId, isFamily) {
  var section = document.createElement('div');
  section.className = 'comments-section';
  section.innerHTML = '<div class="comments-title">Comments</div><div id="comments-list-' + postId + '"></div>';

  var listDiv = section.querySelector('#comments-list-' + postId);

  window.supabase.from('jp26_comments')
    .select('*')
    .eq('post_id', postId)
    .order('created_at', { ascending: true })
    .then(function(result) {
      listDiv.innerHTML = '';
      if (!result.data || result.data.length === 0) {
        listDiv.innerHTML = '<p style="color:var(--text-muted);font-size:0.85rem;">No comments yet. Be the first!</p>';
      }
      (result.data || []).forEach(function(row) {
        var el = document.createElement('div');
        el.className = 'comment';
        el.innerHTML = '<div class="comment__author">' + row.author +
          '<span class="comment__time">' + timeAgo(row.created_at) + '</span></div>' +
          '<div class="comment__content">' + row.content + '</div>';
        listDiv.appendChild(el);
      });
    });

  // Comment form (visible to authenticated family)
  if (isFamily || getSession()) {
    var form = document.createElement('div');
    form.className = 'comment-form';
    var selectId = 'comment-author-' + postId;
    var inputId = 'comment-input-' + postId;
    var btnId = 'comment-submit-' + postId;

    form.innerHTML = '<select id="' + selectId + '">' +
      FAMILY_MEMBERS.map(function(m) { return '<option value="' + m + '">' + m + '</option>'; }).join('') +
      '</select>' +
      '<input type="text" id="' + inputId + '" placeholder="Write a comment..." maxlength="500">' +
      '<button id="' + btnId + '">Post</button>';

    section.appendChild(form);

    document.getElementById(btnId).addEventListener('click', function() {
      var input = document.getElementById(inputId);
      var content = input.value.trim();
      if (!content) return;

      var btn = document.getElementById(btnId);
      btn.disabled = true;
      btn.textContent = '...';

      var currentUid = window.supabase.auth.user() ? window.supabase.auth.user().id : null;

      window.supabase.from('jp26_comments').insert({
        post_id: postId,
        author: document.getElementById(selectId).value,
        author_uid: currentUid,
        content: content
      }).then(function(res) {
        if (res.error) { toast('Error: ' + res.error.message, 'error'); btn.disabled = false; btn.textContent = 'Post'; return; }
        input.value = '';
        btn.disabled = false;
        btn.textContent = 'Post';
        renderComments(container, postId, isFamily);
      });
    });
  }

  container.appendChild(section);
}

// ── Add / Edit Form ────────────────────────────────────────────
var quillEditor = null;

function renderAddForm() {
  var main = document.getElementById('blog-main');
  main.innerHTML = '<div class="loading"><div class="loading__spinner"></div><p>Loading editor...</p></div>';

  var isEdit = false;
  var editPostId = null;
  var params = new URLSearchParams(window.location.search);
  if (params.get('edit')) { isEdit = true; editPostId = params.get('edit'); }

  window.supabaseReady.then(function() {
    var loadPromise = Promise.resolve(null);
    if (isEdit && editPostId) {
      loadPromise = window.supabase.from('jp26_posts').select('*').eq('id', editPostId).single()
        .then(function(res) { return res.data || null; })
        .catch(function() { return null; });
    }

    loadPromise.then(function(existingPost) {
      buildAddForm(main, existingPost, isEdit);
    });
  });
}

function buildAddForm(main, existingPost, isEdit) {
  main.innerHTML = '';
  var session = getSession();
  var params = new URLSearchParams(window.location.search);
  var container = document.createElement('div');
  container.className = 'form-section';

  container.innerHTML = '<h1>' + (isEdit ? '✏️ Edit Post' : '📝 Add a New Post') + '</h1>';

  // Day selector
  var dayGroup = createFormGroup('Day');
  var daySelect = document.createElement('select');
  daySelect.className = 'form-input';
  daySelect.id = 'form-day';
  TRIP_DAYS.forEach(function(td) {
    var opt = document.createElement('option');
    opt.value = td.day;
    opt.textContent = 'Day ' + td.day + ' — ' + formatDate(td.date) + ' (' + td.weekday + ')';
    if (existingPost && existingPost.day === td.day) opt.selected = true;
    if (!existingPost && parseInt(params.get('day')) === td.day) opt.selected = true;
    daySelect.appendChild(opt);
  });
  dayGroup.appendChild(daySelect);

  // Date (auto-filled)
  var dateGroup = createFormGroup('Date');
  var dateInput = document.createElement('input');
  dateInput.type = 'text';
  dateInput.className = 'form-input';
  dateInput.id = 'form-date';
  dateInput.readOnly = true;
  dateGroup.appendChild(dateInput);

  function updateDateFromDay() {
    var td = TRIP_DAYS.find(function(d) { return d.day === parseInt(daySelect.value); });
    if (td) dateInput.value = td.date + ' (' + td.weekday + ')';
  }
  daySelect.addEventListener('change', updateDateFromDay);
  updateDateFromDay();
  if (existingPost) dateInput.value = existingPost.date;

  var row1 = document.createElement('div');
  row1.className = 'form-row';
  row1.appendChild(dayGroup);
  row1.appendChild(dateGroup);
  container.appendChild(row1);

  // Location
  var locGroup = createFormGroup('Location');
  var locInput = document.createElement('input');
  locInput.type = 'text'; locInput.className = 'form-input'; locInput.id = 'form-location';
  locInput.placeholder = 'e.g. Fukuoka, Hiroshima, Kyoto...';
  if (existingPost && existingPost.location) locInput.value = existingPost.location;
  locGroup.appendChild(locInput);
  container.appendChild(locGroup);

  // Title
  var titleGroup = createFormGroup('Title');
  var titleInput = document.createElement('input');
  titleInput.type = 'text'; titleInput.className = 'form-input'; titleInput.id = 'form-title';
  titleInput.placeholder = 'e.g. Arrival in Fukuoka';
  if (existingPost && existingPost.title) titleInput.value = existingPost.title;
  titleGroup.appendChild(titleInput);
  container.appendChild(titleGroup);

  // Cover image
  var coverGroup = createFormGroup('Cover Image');
  var coverZone = createUploadZone('cover-upload', 'Click to upload cover image', 'JPG, PNG, WebP');
  coverGroup.appendChild(coverZone);
  var coverPreview = document.createElement('div');
  coverPreview.className = 'upload-previews';
  coverPreview.id = 'cover-preview';
  if (existingPost && existingPost.cover_image) {
    var thumb = document.createElement('div');
    thumb.className = 'upload-preview';
    thumb.innerHTML = '<img src="' + existingPost.cover_image + '" alt="Current cover">';
    coverPreview.appendChild(thumb);
  }
  coverGroup.appendChild(coverPreview);
  container.appendChild(coverGroup);

  // Rich text editor
  var editorGroup = createFormGroup('Content');
  var editorContainer = document.createElement('div');
  editorContainer.className = 'editor-container';
  editorContainer.id = 'quill-editor';
  editorGroup.appendChild(editorContainer);
  container.appendChild(editorGroup);

  // Additional images
  var imagesGroup = createFormGroup('Additional Photos');
  var imagesZone = createUploadZone('images-upload', 'Click to upload additional photos', 'JPG, PNG, WebP — multiple allowed');
  imagesZone.querySelector('input').setAttribute('multiple', '');
  imagesGroup.appendChild(imagesZone);
  var imagesPreview = document.createElement('div');
  imagesPreview.className = 'upload-previews';
  imagesPreview.id = 'images-preview';
  if (existingPost && existingPost.images) {
    existingPost.images.forEach(function(url) {
      if (!url) return;
      var thumb = document.createElement('div');
      thumb.className = 'upload-preview';
      thumb.innerHTML = '<img src="' + url + '" alt=""><button class="upload-preview__remove" data-url="' + url + '">×</button>';
      imagesPreview.appendChild(thumb);
    });
  }
  imagesGroup.appendChild(imagesPreview);
  container.appendChild(imagesGroup);

  // Additional videos
  var videosGroup = createFormGroup('Additional Videos');
  var videosZone = createUploadZone('videos-upload', 'Click to upload videos', 'MP4, MOV, WebM — multiple allowed');
  videosZone.querySelector('input').setAttribute('multiple', '');
  videosGroup.appendChild(videosZone);
  var videosPreview = document.createElement('div');
  videosPreview.className = 'upload-previews';
  videosPreview.id = 'videos-preview';
  if (existingPost && existingPost.videos) {
    existingPost.videos.forEach(function(url) {
      if (!url) return;
      var thumb = document.createElement('div');
      thumb.className = 'upload-preview';
      thumb.innerHTML = '<video src="' + url + '"></video><button class="upload-preview__remove" data-url="' + url + '">×</button>';
      videosPreview.appendChild(thumb);
    });
  }
  videosGroup.appendChild(videosPreview);
  container.appendChild(videosGroup);

  // Author
  var authorGroup = createFormGroup('Author');
  var authorInput = document.createElement('input');
  authorInput.type = 'text'; authorInput.className = 'form-input'; authorInput.readOnly = true;
  authorInput.value = session ? session.identity : (existingPost ? existingPost.author : '');
  authorGroup.appendChild(authorInput);
  container.appendChild(authorGroup);

  // Public toggle
  var publicGroup = createFormGroup('Visibility');
  var toggleDiv = document.createElement('div');
  toggleDiv.className = 'toggle-group';
  var toggleBtn = document.createElement('button');
  toggleBtn.className = 'toggle-switch';
  toggleBtn.type = 'button';
  var isCurrentlyPublic = existingPost ? existingPost.is_public : true;
  if (isCurrentlyPublic) toggleBtn.classList.add('on');
  var toggleLabel = document.createElement('span');
  toggleLabel.className = 'toggle-label';
  toggleLabel.textContent = isCurrentlyPublic ? 'Public — visible on /jp26/' : 'Private — family only';
  toggleBtn.addEventListener('click', function() {
    toggleBtn.classList.toggle('on');
    toggleLabel.textContent = toggleBtn.classList.contains('on') ? 'Public — visible on /jp26/' : 'Private — family only';
  });
  toggleDiv.appendChild(toggleBtn);
  toggleDiv.appendChild(toggleLabel);
  publicGroup.appendChild(toggleDiv);
  container.appendChild(publicGroup);

  // Submit
  var submitBtn = document.createElement('button');
  submitBtn.className = 'btn-submit';
  submitBtn.textContent = isEdit ? 'Update Post' : 'Publish Post';
  submitBtn.addEventListener('click', function() { handleFormSubmit(isEdit, editPostId, existingPost); });
  container.appendChild(submitBtn);

  var progressArea = document.createElement('div');
  progressArea.id = 'upload-progress';
  progressArea.style.marginTop = '16px';
  container.appendChild(progressArea);

  main.appendChild(container);

  // Init Quill
  quillEditor = new Quill('#quill-editor', {
    theme: 'snow',
    modules: { toolbar: [
      [{ 'font': ['sans-serif', 'serif'] }],
      [{ 'size': ['small', false, 'large', 'huge'] }],
      ['bold', 'italic', 'underline'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]},
    placeholder: 'Write about this day...'
  });

  if (existingPost && existingPost.content) {
    try {
      quillEditor.setContents(typeof existingPost.content === 'string' ? JSON.parse(existingPost.content) : existingPost.content);
    } catch(e) {}
  }

  // Upload handlers
  setupUploadHandlers();
}

function createFormGroup(labelText) {
  var g = document.createElement('div');
  g.className = 'form-group';
  var l = document.createElement('label');
  l.className = 'form-label';
  l.textContent = labelText;
  g.appendChild(l);
  return g;
}

function createUploadZone(id, text, formats) {
  var zone = document.createElement('div');
  zone.className = 'upload-zone';
  zone.innerHTML = '<div class="upload-zone__icon">📁</div><div class="upload-zone__text">' + text + '</div><div class="upload-zone__formats">' + formats + '</div>';
  var input = document.createElement('input');
  input.type = 'file';
  input.id = id;
  input.accept = 'image/jpeg,image/png,image/webp,image/heic,image/heif,image/avif,video/mp4,video/quicktime,video/webm';
  zone.appendChild(input);
  zone.addEventListener('click', function() { input.click(); });
  return zone;
}

function setupUploadHandlers() {
  document.getElementById('cover-upload').addEventListener('change', function(e) { handleFileSelect(e.target.files, 'cover-preview'); });
  document.getElementById('images-upload').addEventListener('change', function(e) { handleFileSelect(e.target.files, 'images-preview'); });
  document.getElementById('videos-upload').addEventListener('change', function(e) { handleFileSelect(e.target.files, 'videos-preview'); });

  document.querySelectorAll('.upload-preview__remove').forEach(function(btn) {
    btn.addEventListener('click', function(e) { e.stopPropagation(); btn.parentElement.remove(); });
  });
}

function handleFileSelect(files, previewId) {
  var preview = document.getElementById(previewId);
  Array.from(files).forEach(function(file) {
    var isVideo = file.type.startsWith('video/');
    var isValid = isVideo ?
      ['video/mp4', 'video/quicktime', 'video/webm'].indexOf(file.type) !== -1 :
      ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'image/avif'].indexOf(file.type) !== -1;

    if (!isValid) { toast('Skipped unsupported file: ' + file.name, 'error'); return; }

    var thumb = document.createElement('div');
    thumb.className = 'upload-preview';
    var url = URL.createObjectURL(file);
    thumb.innerHTML = (isVideo ? '<video src="' + url + '"></video>' : '<img src="' + url + '" alt="">') +
      '<button class="upload-preview__remove">×</button>';
    thumb._file = file;
    thumb.querySelector('.upload-preview__remove').addEventListener('click', function(ev) {
      ev.stopPropagation(); URL.revokeObjectURL(url); thumb.remove();
    });
    preview.appendChild(thumb);
  });
}

// ── Form Submit ────────────────────────────────────────────────
function handleFormSubmit(isEdit, editPostId, existingPost) {
  var day = parseInt(document.getElementById('form-day').value);
  var date = document.getElementById('form-date').value.split(' (')[0];
  var location = document.getElementById('form-location').value.trim();
  var title = document.getElementById('form-title').value.trim();
  var author = getSession() ? getSession().identity : '';
  var isPublic = document.querySelector('.toggle-switch').classList.contains('on');
  var content = quillEditor.getContents();
  var contentHtml = quillEditor.root.innerHTML;

  if (!title) { toast('Please enter a title', 'error'); return; }

  var submitBtn = document.querySelector('.btn-submit');
  submitBtn.disabled = true;
  submitBtn.innerHTML = '<span class="spinner"></span> Saving...';
  var progressArea = document.getElementById('upload-progress');

  // Collect existing URLs to keep
  var existingCover = existingPost ? existingPost.cover_image : '';
  var existingImages = []; var existingVideos = [];
  document.querySelectorAll('#images-preview .upload-preview__remove[data-url]').forEach(function(b) { existingImages.push(b.getAttribute('data-url')); });
  document.querySelectorAll('#videos-preview .upload-preview__remove[data-url]').forEach(function(b) { existingVideos.push(b.getAttribute('data-url')); });
  // If cover wasn't replaced, keep existing
  var coverRemoveBtn = document.querySelector('#cover-preview .upload-preview__remove[data-url]');
  if (coverRemoveBtn) existingCover = coverRemoveBtn.getAttribute('data-url');

  // Collect new files
  var newCoverFiles = []; var newImageFiles = []; var newVideoFiles = [];
  document.querySelectorAll('#cover-preview .upload-preview').forEach(function(el) { if (el._file) newCoverFiles.push(el._file); });
  document.querySelectorAll('#images-preview .upload-preview').forEach(function(el) { if (el._file) newImageFiles.push(el._file); });
  document.querySelectorAll('#videos-preview .upload-preview').forEach(function(el) { if (el._file) newVideoFiles.push(el._file); });

  var allNewFiles = newCoverFiles.concat(newImageFiles).concat(newVideoFiles);

  if (allNewFiles.length === 0) {
    savePost(isEdit, editPostId, day, date, location, title, content, contentHtml, existingCover, existingImages, existingVideos, author, isPublic, submitBtn);
    return;
  }

  var totalFiles = allNewFiles.length;
  var uploadedCount = 0;
  var newCoverUrl = existingCover;
  var newImageUrls = [];
  var newVideoUrls = [];

  function updateProgress() {
    uploadedCount++;
    var pct = Math.round((uploadedCount / totalFiles) * 100);
    progressArea.innerHTML = '<div class="progress-bar"><div class="progress-bar__fill" style="width:' + pct + '%"></div></div>' +
      '<p style="font-size:0.8rem;color:var(--text-muted);margin-top:4px;">Uploaded ' + uploadedCount + ' of ' + totalFiles + ' files...</p>';
  }

  function finishUploads() {
    progressArea.innerHTML = '';
    savePost(isEdit, editPostId, day, date, location, title, content, contentHtml, newCoverUrl, existingImages.concat(newImageUrls), existingVideos.concat(newVideoUrls), author, isPublic, submitBtn);
  }

  function uploadFile(file, prefix) {
    return new Promise(function(resolve, reject) {
      var ext = file.name.split('.').pop().toLowerCase();
      var path = prefix + Date.now() + '_' + Math.random().toString(36).slice(2, 6) + '.' + ext;

      if (file.type.startsWith('image/') && file.type !== 'image/gif') {
        resizeImage(file, 1200).then(function(blob) {
          doUpload(blob, path, resolve, reject);
        }).catch(function() { doUpload(file, path, resolve, reject); });
      } else {
        doUpload(file, path, resolve, reject);
      }
    });
  }

  function doUpload(blob, path, resolve, reject) {
    window.supabase.storage.from('jp26').upload(path, blob, { contentType: blob.type, upsert: true })
      .then(function(res) {
        if (res.error) return reject(res.error);
        var urlData = window.supabase.storage.from('jp26').getPublicUrl(path);
        resolve(urlData.data.publicUrl);
      })
      .catch(reject);
  }

  var tempId = isEdit ? editPostId : 'post_' + Date.now();
  var promises = [];

  if (newCoverFiles.length > 0) {
    promises.push(uploadFile(newCoverFiles[0], 'images/' + tempId + '/cover_').then(function(url) { newCoverUrl = url; updateProgress(); }));
  }

  newImageFiles.forEach(function(file) {
    promises.push(uploadFile(file, 'images/' + tempId + '/img_').then(function(url) { newImageUrls.push(url); updateProgress(); }));
  });

  newVideoFiles.forEach(function(file) {
    promises.push(uploadFile(file, 'videos/' + tempId + '/vid_').then(function(url) { newVideoUrls.push(url); updateProgress(); }));
  });

  Promise.all(promises).then(finishUploads).catch(function(err) {
    progressArea.innerHTML = '';
    toast('Upload failed: ' + (err.message || 'Unknown error'), 'error');
    submitBtn.disabled = false;
    submitBtn.textContent = isEdit ? 'Update Post' : 'Publish Post';
  });
}

function savePost(isEdit, postId, day, date, location, title, content, contentHtml, coverImage, images, videos, author, isPublic, submitBtn) {
  var data = {
    day: day,
    date: date,
    location: location,
    title: title,
    content: content,
    content_html: contentHtml,
    cover_image: coverImage,
    images: images.filter(Boolean),
    videos: videos.filter(Boolean),
    author: author,
    is_public: isPublic,
    updated_at: new Date().toISOString()
  };

  var savePromise;
  if (isEdit && postId) {
    savePromise = window.supabase.from('jp26_posts').update(data).eq('id', postId);
  } else {
    data.author_uid = window.supabase.auth.user() ? window.supabase.auth.user().id : null;
    data.created_at = new Date().toISOString();
    savePromise = window.supabase.from('jp26_posts').insert(data);
  }

  savePromise.then(function(res) {
    if (res.error) throw res.error;
    submitBtn.disabled = false;
    submitBtn.textContent = isEdit ? 'Update Post' : 'Publish Post';
    toast('Post ' + (isEdit ? 'updated' : 'published') + '! 🎉', 'success');
    setTimeout(function() { window.location.href = '/jp26/leungfamily/'; }, 1000);
  }).catch(function(err) {
    submitBtn.disabled = false;
    submitBtn.textContent = isEdit ? 'Update Post' : 'Publish Post';
    toast('Could not save: ' + (err.message || 'Unknown error'), 'error');
  });
}

function resizeImage(file, maxWidth) {
  return new Promise(function(resolve, reject) {
    var img = new Image();
    img.onload = function() {
      if (img.width <= maxWidth) { resolve(file); return; }
      var canvas = document.createElement('canvas');
      var scale = maxWidth / img.width;
      canvas.width = maxWidth;
      canvas.height = img.height * scale;
      canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(function(blob) { resolve(blob); }, file.type, 0.85);
    };
    img.onerror = function() { resolve(file); };
    img.src = URL.createObjectURL(file);
  });
}

// ── Init ────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('pw-submit').addEventListener('click', handlePasswordSubmit);
  document.getElementById('pw-input').addEventListener('keydown', function(e) { if (e.key === 'Enter') handlePasswordSubmit(); });

  document.querySelectorAll('.blog-nav-link').forEach(function(link) {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      var page = link.getAttribute('data-blog-page');
      var urls = { public: '/jp26/', family: '/jp26/leungfamily/', add: '/jp26/leungfamily/add/' };
      window.history.pushState({}, '', urls[page]);
      renderCurrentPage();
    });
  });

  window.addEventListener('popstate', renderCurrentPage);
  renderCurrentPage();
});
