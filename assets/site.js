/*
 * Light, dependency-free interactivity for the IPHS 400 site.
 * No framework, no build step, no external requests. Every effect here
 * is progressive enhancement: if this file fails to load, every page
 * still renders and functions correctly with no JS at all.
 */
(function () {
  "use strict";

  /* Real per-week dates, taken directly from each weeks/week-NN.html page
     (not re-derived from the academic-calendar description, to avoid
     compounding an off-by-one into something students rely on). Each
     week's window runs Monday-to-Sunday around its actual class date(s);
     the gap between Week 13 and Week 14 is Thanksgiving recess. */
  var COURSE_WEEKS = [
    { n: 1, start: "2026-08-24", end: "2026-08-30" },
    { n: 2, start: "2026-08-31", end: "2026-09-06" },
    { n: 3, start: "2026-09-07", end: "2026-09-13" },
    { n: 4, start: "2026-09-14", end: "2026-09-20" },
    { n: 5, start: "2026-09-21", end: "2026-09-27" },
    { n: 6, start: "2026-09-28", end: "2026-10-04" },
    { n: 7, start: "2026-10-05", end: "2026-10-11" },
    { n: 8, start: "2026-10-12", end: "2026-10-18" },
    { n: 9, start: "2026-10-19", end: "2026-10-25" },
    { n: 10, start: "2026-10-26", end: "2026-11-01" },
    { n: 11, start: "2026-11-02", end: "2026-11-08" },
    { n: 12, start: "2026-11-09", end: "2026-11-15" },
    { n: 13, start: "2026-11-16", end: "2026-11-20" },
    { n: 14, start: "2026-11-30", end: "2026-12-06" },
    { n: 15, start: "2026-12-07", end: "2026-12-18" }
  ];

  /* Real graded/required deadlines, taken directly from the "Summary of
     Assignments and Weights" table in core/assignments.html. */
  var COURSE_DEADLINES = [
    { label: "Mini-Project 1 — Dev Environment", date: "2026-09-04" },
    { label: "Mini-Project 2 — Agent + Skills Config", date: "2026-09-25" },
    { label: "Mini-Project 3 — Harness + Hooks", date: "2026-10-23" },
    { label: "Final Project proposal", date: "2026-11-13" },
    { label: "Mini-Project 4 — SDLC Capstone", date: "2026-11-20" },
    { label: "Final Project (poster + code + release form)", date: "2026-12-18" }
  ];

  document.addEventListener("DOMContentLoaded", function () {
    highlightActiveNavLink();
    addCompactTitle();
    measureHeroHeight();
    watchHeaderScroll();
    revealSectionsOnScroll();
    addBackToTopButton();
    addScrollProgressBar();
    highlightCurrentWeek();
    addNextDeadlineBanner();
  });

  /** A thin bar at the very top of the viewport that fills left-to-right
   *  as you scroll through the page. */
  function addScrollProgressBar() {
    var bar = document.createElement("div");
    bar.className = "scroll-progress";
    document.body.appendChild(bar);

    var update = function () {
      var max = document.documentElement.scrollHeight - window.innerHeight;
      var pct = max > 0 ? Math.min(100, (window.scrollY / max) * 100) : 0;
      bar.style.width = pct + "%";
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update, { passive: true });
  }

  /** On the Schedule page, mark whichever week's date range contains
   *  today with a small "This week" badge. Does nothing on any other
   *  page, and does nothing at all if today falls in a gap between
   *  weeks (e.g. Thanksgiving recess) rather than guessing. */
  function highlightCurrentWeek() {
    if (!/schedule\.html$/.test(window.location.pathname)) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var current = COURSE_WEEKS.filter(function (w) {
      return today >= new Date(w.start + "T00:00:00") && today <= new Date(w.end + "T00:00:00");
    })[0];
    if (!current) return;

    var weekNum = current.n < 10 ? "0" + current.n : "" + current.n;
    var link = document.querySelector('a[href$="week-' + weekNum + '.html"]');
    if (!link) return;

    var li = link.closest("li");
    if (li) li.classList.add("is-current-week");

    var badge = document.createElement("span");
    badge.className = "current-week-badge";
    badge.textContent = "This week";
    link.appendChild(badge);
  }

  /** On the Assignments page, show a small banner naming the next
   *  upcoming graded/required deadline and how many days away it is. */
  function addNextDeadlineBanner() {
    if (!/assignments\.html$/.test(window.location.pathname)) return;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var upcoming = COURSE_DEADLINES.map(function (d) {
      return { label: d.label, date: new Date(d.date + "T00:00:00") };
    })
      .filter(function (d) {
        return d.date >= today;
      })
      .sort(function (a, b) {
        return a.date - b.date;
      })[0];
    if (!upcoming) return;

    var days = Math.round((upcoming.date - today) / 86400000);
    var dayLabel = days === 0 ? "today" : days === 1 ? "tomorrow" : "in " + days + " days";
    var dateStr = upcoming.date.toLocaleDateString("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric"
    });

    var banner = document.createElement("p");
    banner.className = "deadline-banner";

    var strong = document.createElement("strong");
    strong.textContent = "Next deadline: ";
    banner.appendChild(strong);
    banner.appendChild(document.createTextNode(upcoming.label + " — " + dateStr + " (" + dayLabel + ")"));

    var firstSection = document.querySelector(".page-content .section");
    if (firstSection && firstSection.parentNode) {
      firstSection.parentNode.insertBefore(banner, firstSection);
    }
  }

  /** Measure the hero's natural height into a CSS custom property, so the
   *  collapse-on-scroll animation works for any amount of hero content
   *  (a bare title, or a title plus tagline) without a guessed pixel cap.
   *  Re-measures on resize and once the webfont finishes loading, since
   *  Fraunces swapping in can change the title's wrapped height. */
  function measureHeroHeight() {
    var hero = document.querySelector(".hero");
    if (!hero) return;
    var measure = function () {
      hero.style.setProperty("--hero-h", hero.scrollHeight + "px");
    };
    measure();
    window.addEventListener("resize", measure, { passive: true });
    if (document.fonts && document.fonts.ready) {
      document.fonts.ready.then(measure);
    }
  }

  /** Clone the hero's own title text into a small label in the branding
   *  bar. Hidden by CSS until .is-scrolled — this is what appears in
   *  place of the large title once it collapses on scroll. */
  function addCompactTitle() {
    var heroH1 = document.querySelector(".hero h1");
    var branding = document.querySelector(".site-branding");
    if (!heroH1 || !branding) return;
    var label = document.createElement("span");
    label.className = "compact-title";
    label.textContent = heroH1.textContent;
    branding.appendChild(label);
  }

  /** Mark the nav link matching the current page as active/aria-current,
   *  independent of whatever class="active" was hand-authored on the page. */
  function highlightActiveNavLink() {
    var links = document.querySelectorAll(".main-nav a");
    links.forEach(function (link) {
      var isCurrent = link.pathname === window.location.pathname;
      link.classList.toggle("active", isCurrent);
      if (isCurrent) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  }

  /** Condense the header once scrolled, and hide it entirely while
   *  scrolling down (so reading has the full screen) — reappearing the
   *  moment the visitor scrolls back up, the way most reading-focused
   *  sites behave. Always visible again near the very top of the page. */
  function watchHeaderScroll() {
    var header = document.querySelector(".site-header");
    if (!header) return;

    // Trackpad/momentum scrolling fires many small, noisy scroll events —
    // including brief reversals mid-gesture. Comparing frame-to-frame
    // deltas against a small threshold reacts to that noise and flickers.
    // Instead, only commit to a direction once the scroll position has
    // moved a real distance from where we last decided anything.
    var baseline = window.scrollY;
    var hidden = false;
    var scrolled = false;
    var ticking = false;
    var THRESHOLD = 32;

    var update = function () {
      var y = Math.max(0, window.scrollY);

      // Separate on/off thresholds (hysteresis) so hovering right at the
      // boundary can't flip this back and forth every frame.
      if (!scrolled && y > 16) {
        scrolled = true;
      } else if (scrolled && y < 6) {
        scrolled = false;
      }
      header.classList.toggle("is-scrolled", scrolled);

      if (y < 80) {
        hidden = false;
        baseline = y;
      } else if (y - baseline > THRESHOLD) {
        hidden = true;
        baseline = y;
      } else if (y - baseline < -THRESHOLD) {
        hidden = false;
        baseline = y;
      }

      header.classList.toggle("header-hidden", hidden);
      ticking = false;
    };

    update();
    window.addEventListener(
      "scroll",
      function () {
        if (!ticking) {
          window.requestAnimationFrame(update);
          ticking = true;
        }
      },
      { passive: true }
    );
  }

  /** Fade/slide each .section into view as it scrolls into the viewport.
   *  The reveal-init class is only ever added here, so a page with JS
   *  disabled never hides its content in the first place. */
  function revealSectionsOnScroll() {
    var sections = document.querySelectorAll(".page-content .section");
    if (!sections.length) return;

    if (!("IntersectionObserver" in window)) {
      return; // no observer support: leave content in its default visible state
    }

    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" }
    );

    sections.forEach(function (section) {
      section.classList.add("reveal-init");
      observer.observe(section);
    });
  }

  /** Inject a fixed "back to top" button that fades in once the visitor
   *  has scrolled a bit, and smooth-scrolls to top on click. */
  function addBackToTopButton() {
    var btn = document.createElement("a");
    btn.href = "#";
    btn.className = "back-to-top";
    btn.setAttribute("aria-label", "Back to top");
    btn.setAttribute("title", "Back to top");
    btn.textContent = "↑";

    btn.addEventListener("click", function (event) {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });

    document.body.appendChild(btn);

    var toggle = function () {
      btn.classList.toggle("is-visible", window.scrollY > 400);
    };
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
  }

})();
