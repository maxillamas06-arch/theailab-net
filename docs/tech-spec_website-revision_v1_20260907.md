# IPHS 400 Course Site — Revision Tech Spec

**Date:** 2026-09-07
**Source:** synthesizes every finding in [`report_web-revision_v1_20260907.md`](./report_web-revision_v1_20260907.md) (code review §§1–7, visual design critique §8) into actionable, independently implementable tasks.
**Scope:** `index.html`, `404.html`, `core/*.html`, `weeks/*.html`, `css/style.css`, `tests/`, `README.md`, `LICENSE`. Excludes `mi-sitio/` (unrelated scaffold) and pedagogical content judgments.
**How to use this document:** each task is self-contained — description, justification, files touched, and numbered implementation steps. Tasks within a priority tier are not strictly ordered relative to each other except where a step explicitly says so. **Run `pytest tests/ -v` after every task** (from repo root, with `.venv` activated: `source .venv/bin/activate && pytest tests/ -v`) — the existing 25-test suite is fast (<1s) and catches most structural regressions immediately.

**Priority definitions:**
- **High** — either a live functional defect (something a real visitor would hit), a legal/policy contradiction, or a rendered visual inconsistency visible within seconds of normal navigation. Fix first.
- **Medium** — meaningful gaps against accessibility/SEO/maintainability/design norms that don't break anything today but should not linger.
- **Low** — polish, refactors, and nice-to-haves. Safe to defer or batch together.

---

## Summary Table

| # | Task | Priority | Effort | Primary files |
|---|---|---|---|---|
| H1 | Fix/document `404.html` serving behavior | High | Small | `README.md`, optionally new `serve.py` |
| H2 | Resolve LICENSE vs. content-copyright conflict | High | Trivial | `LICENSE`, `README.md` |
| H3 | Add missing contact links (instructor + SASS email) | High | Trivial | `core/syllabus.html`, `core/about.html`, `core/policies.html` |
| H4 | Hyperlink all external resources sitewide | High | Small–Medium | `core/*.html` |
| H5 | Fix inconsistent list styling on Policies/About | High | Trivial | `core/policies.html`, `core/about.html` |
| H6 | Give the homepage hero real content | High | Trivial | `index.html` |
| M1 | De-duplicate About/Syllabus content | Medium | Small | `core/about.html`, `core/syllabus.html` |
| M2 | Accessibility: table `scope`/`caption`, `aria-current`, skip-link | Medium | Medium | all 22 `.html`, `css/style.css` |
| M3 | SEO/meta basics: description, favicon, OG tags, robots/sitemap | Medium | Medium | all 22 `.html`, new root files |
| M4 | Remove or justify dead CSS (~30% of stylesheet) | Medium | Small–Medium | `css/style.css` |
| M5 | "Add a page" checklist or lightweight templating | Medium | Small / Larger | `README.md`, optionally new `templates/`, `build.py` |
| M6 | Semantic color-coding (Permitted/Restricted AI use, etc.) | Medium | Small | `css/style.css`, `core/policies.html` |
| M7 | Fix wide-viewport layout waste + add sticky nav | Medium | Small | `css/style.css` |
| M8 | Rebalance table typography vs. body text | Medium | Trivial | `css/style.css` |
| L1 | Add `:focus-visible` styles + hover/focus transitions | Low | Trivial | `css/style.css` |
| L2 | Add cache-busting query string to stylesheet | Low | Small | all 22 `.html`, `tests/test_unit_html_structure.py` |
| L3 | Tokenize the spacing scale | Low | Medium | `css/style.css` |
| L4 | Add `prefers-color-scheme: dark` support | Low | Small | `css/style.css` |
| L5 | Refine heading letter-spacing at smaller sizes | Low | Trivial | `css/style.css` |
| L6 | Document removed security headers for future deployment | Low | Trivial | `README.md` |
| L7 | (Optional) Add one real code-sample/terminal visual element | Low | Small | one `weeks/*.html` page |
| L8 | Extend pytest suite (a11y, meta, cross-page, CSS-lint checks) | Low | Medium | `tests/` |

---

## High Priority

### H1. Fix or document `404.html`'s serving behavior

**Description:** `404.html`'s only trigger was a Netlify redirect rule removed earlier in this project's history. No mechanism in the repo now serves it on an actual missing page, under either the documented local workflow or any undetermined future host.

**Justification:** report §2.1. This is a live, verifiable functional gap, not a hypothetical — the file exists, is well-formed, and is completely unreachable through normal 404 behavior today.

**Files affected:** `README.md`; optionally a new `serve.py` at repo root.

**Steps:**
1. Decide the site's actual future hosting target. **Recommended: GitHub Pages** — it requires zero configuration and automatically serves a root `404.html` for any missing path, which resolves this issue with no code change at all.
2. Add a short "Deployment" note back to `README.md` stating the chosen target and that `404.html` is served automatically by it (or, for a different host, what config line achieves the same — e.g. nginx needs `error_page 404 /404.html;`).
3. For local-dev parity (so `404.html` is also visible while developing with `python3 -m http.server`, which has no custom-404 hook), either:
   - **(a)** Add a one-sentence caveat to the README's "Local Development" section: "Note: `python3 -m http.server` does not serve `404.html` on missing pages — this only happens on the deployed host." (Zero effort, honest, sufficient.) **— or —**
   - **(b)** Add a small drop-in replacement server for full local parity:
     ```python
     #!/usr/bin/env python3
     """Local dev server that serves 404.html on missing paths, like GitHub Pages does."""
     import http.server

     class Handler(http.server.SimpleHTTPRequestHandler):
         def send_error(self, code, message=None, explain=None):
             if code == 404:
                 self.send_response(404)
                 self.send_header("Content-Type", "text/html")
                 self.end_headers()
                 with open("404.html", "rb") as f:
                     self.wfile.write(f.read())
                 return
             return super().send_error(code, message, explain)

     if __name__ == "__main__":
         http.server.test(HandlerClass=Handler, port=8080)
     ```
     Save as `serve.py` at repo root, and update the README's local-dev command from `python3 -m http.server 8080` to `python3 serve.py`.
4. Run `pytest tests/ -v` — no existing test touches server behavior, so this is a documentation/tooling change with zero risk to the suite.

---

### H2. Resolve the LICENSE vs. content-copyright conflict

**Description:** The repo's unqualified MIT `LICENSE` grants blanket reuse/redistribution rights over the entire repository, while `core/policies.html` simultaneously states course materials are all-rights-reserved with no redistribution allowed. These two statements directly contradict each other.

**Justification:** report §2.2. A single `LICENSE` file at repo root is understood by convention (and by how GitHub surfaces it) to cover everything in the repository, including the HTML files containing the syllabus, assignments, and policies text.

**Files affected:** `LICENSE`, `README.md`.

**Steps:**
1. Open `LICENSE`. After the existing MIT text, append a scope clarification, e.g.:
   ```
   ---

   Note on scope: This MIT license applies to the site's code and templates
   only — HTML structure, CSS, and the pytest test suite. Course content
   (syllabus text, schedule, assignments, and policies, primarily under
   core/) is © Jon Chun / Kenyon College. All rights reserved; see
   core/policies.html, "Copyright of Course Materials," for redistribution
   terms.
   ```
2. Open `README.md`, find (or add) a `## License` heading, and add a matching one-sentence pointer: "Code is MIT-licensed (see [`LICENSE`](LICENSE)); course content is separately copyrighted — see [Policies](core/policies.html#copyright-of-course-materials)." (Add an `id="copyright-of-course-materials"` to that `<h3>` in `core/policies.html` if it doesn't already have an anchorable id — check first; add one if missing so the link works.)
3. No further code change needed — this is a documentation-only fix that removes a real ambiguity.

---

### H3. Add missing contact links

**Description:** `core/syllabus.html` and `core/about.html` both state "Email is the best way to reach the instructor," but no email address appears anywhere on the site. `sass@kenyon.edu` is given as plain text in `core/policies.html` but is not a clickable link. Sitewide search confirms zero `mailto:` links exist anywhere in the 22 pages.

**Justification:** report §2.3. A student reading only the website currently has no way to actually email the instructor, despite the site telling them to.

**Files affected:** `core/syllabus.html`, `core/about.html`, `core/policies.html`.

**Steps:**
1. **Content-owner input needed:** obtain the instructor's actual public contact email address (this is a content decision that can't be inferred from the codebase).
2. In `core/syllabus.html`, in the "Course Details" table, change the `Instructor` row to include the address:
   ```html
   <tr><th>Instructor</th><td>Jon Chun (<a href="mailto:ADDRESS_HERE">ADDRESS_HERE</a>)</td></tr>
   ```
3. Make the identical change to the "Instructor" table in `core/about.html`.
4. In `core/policies.html`, find the "Accessibility Accommodations" paragraph and change:
   ```html
   ... by emailing sass@kenyon.edu, then ...
   ```
   to:
   ```html
   ... by emailing <a href="mailto:sass@kenyon.edu">sass@kenyon.edu</a>, then ...
   ```
5. Run `pytest tests/ -v` — `mailto:` links are already excluded from the internal-link resolver in `tests/test_integration_links.py::_resolve_href`, so this change cannot break the existing link-integrity tests.

---

### H4. Hyperlink every external resource named on the site

**Description:** A sitewide search for `href="http`/`https` returns zero matches across all 22 pages. Every external resource the content names by text — the course's own GitHub repo, Moodle, `digital.kenyon.edu/dh`, required-account signup sites, named CLI tools — is inert plain text.

**Justification:** report §2.4. This is the single highest-leverage, lowest-risk fix identified: no sentence needs rewriting, only `<a href="...">` wrapping around text that already names its own destination.

**Files affected:** `core/about.html`, `core/syllabus.html`, `core/assignments.html`, `core/policies.html`.

**Steps:**
1. Compile the exact list of occurrences and their target URLs before editing (some need instructor confirmation — marked below):
   | Text | File(s) | Target URL |
   |---|---|---|
   | `https://github.com/jon-chun/theailab-net` | `core/about.html`, `core/syllabus.html` | same, as literal link |
   | "Moodle" / "Moodle.kenyon.edu" | `core/about.html`, `core/syllabus.html` | *needs confirmation* — likely `https://moodle.kenyon.edu` |
   | `digital.kenyon.edu/dh` | `core/about.html`, `core/syllabus.html`, `core/assignments.html`, `core/policies.html` | `https://digital.kenyon.edu/dh` |
   | "Personal Google (gmail.com) account" | `core/syllabus.html` | `https://accounts.google.com/signup` |
   | "GitHub account" | `core/syllabus.html` | `https://github.com/join` |
   | "Anthropic.com (Claude) subscription" | `core/syllabus.html` | `https://claude.com` |
   | "OpenRouter.com account" | `core/syllabus.html` | `https://openrouter.ai` |
   | "the course poster template (link on the course repository)" | `core/assignments.html` | *needs the actual template path from the instructor* — link directly to it once known, rather than leaving it as a promise-with-no-link |
2. For the GitHub repo URL specifically (currently wrapped in `<code>`), preserve the monospace look by nesting: `<a href="https://github.com/jon-chun/theailab-net"><code>https://github.com/jon-chun/theailab-net</code></a>`.
3. For everything else, wrap the existing text in `<a href="...">...</a>` in place — no rewording.
4. Do not add `target="_blank"`: keep external links opening in the same tab, consistent with the rest of the site's simple navigation model, unless the instructor specifically prefers new tabs.
5. Optional, lower-priority within this task: also link the named CLI tools in `core/syllabus.html` (`ripgrep`, `fzf`, `bat`, `eza`, `tmux`) and the named frameworks in `core/schedule.html`/`weeks/week-10.html` (GitHub Spec-Kit, OpenSpec) to their respective GitHub repos/homepages.
6. Run `pytest tests/ -v` after all edits. The existing suite's `_resolve_href` skips `http(s)://` links by design, so no existing test will validate these new URLs are live — see Task L8 for optionally adding that coverage.

---

### H5. Fix inconsistent list styling on `core/policies.html` and `core/about.html`

**Description:** The site's custom `.item-list` class (removes default bullets, adds a divider line between items) is applied to every content list on `index.html`, `core/schedule.html`, and `core/syllabus.html` — but to **zero** of the six content `<ul>` elements on `core/policies.html`, and to neither content list on `core/about.html`. These render with plain default browser bullets instead.

**Justification:** report §8.5. This is the single most visible, rendered layout-consistency defect on the site — a viewer navigating Syllabus → Policies (an explicitly suggested reading path) sees the site's visual language for lists change abruptly, on the page with the *most* lists (six) of any page on the site.

**Files affected:** `core/policies.html`, `core/about.html`.

**Steps:**
1. Open `core/policies.html`. Change `<ul>` to `<ul class="item-list">` for each of these six lists (identifiable by the `<h3>`/`<h2>` immediately preceding them):
   - "Permitted and Expected AI Use"
   - "Restricted AI Use"
   - "Late/Missing Work Policy"
   - "Attendance Policy"
   - "Student Work and External Sharing"
   - "Secrets Hygiene and Agent Safety"
2. Open `core/about.html`. Change the "Course Site" list's `<ul>` to `<ul class="item-list">`.
3. Visually confirm via `python3 -m http.server` (or `serve.py` from Task H1) that bullets disappear and divider lines appear between items on both pages, matching `core/syllabus.html`'s rendering.
4. Run `pytest tests/ -v` — this is a pure class-attribute addition with no existing test coverage either way; consider adding a regression test in Task L8 that asserts every content `<ul>` outside `<nav>` carries `item-list`.

---

### H6. Give the homepage hero real content

**Description:** Every page's hero `<h1>` mirrors its own nav label (`Syllabus`, `Schedule`, etc.) — a sensible pattern for interior pages, but applied identically to `index.html`, whose hero therefore reads only "Home." At 49.5px, this is the single largest, most visually prominent text on the entire site, and it conveys no information about the course.

**Justification:** report §8.5. The course title/description already appears smaller, twice, immediately above and below this hero — the page's hierarchy currently emphasizes its least informative word over its most informative sentence.

**Files affected:** `index.html`.

**Steps:**
1. Open `index.html` and locate:
   ```html
   <section class="hero"><h1>Home</h1></section>
   ```
2. Replace with the course name:
   ```html
   <section class="hero"><h1>IPHS 400: Frontiers in AI</h1></section>
   ```
3. Immediately below the hero, the existing intro paragraph starts "Welcome to **IPHS 400: Frontiers in AI** at Kenyon College...". With the hero now also stating the course name, review this paragraph and trim the redundancy if it now reads as three consecutive repetitions of the course title (header branding strip → hero → intro paragraph) — e.g. shorten to "Welcome! This upper-division course is a hands-on study..." This is a content-editing judgment call; make it lightly, don't rewrite the paragraph's substance.
4. Leave `<title>Home – IPHS 400: Frontiers in AI</title>` unchanged — it already contains the full course name and the "Home" prefix there is harmless (browser tab text, not a hierarchy concern).
5. Run `pytest tests/ -v` — `TestHeaderFooterHero::test_all_pages_have_hero_with_h1` only checks that a hero and an h1 exist, not their text content, so this passes unchanged.

---

## Medium Priority

### M1. De-duplicate `about.html`/`syllabus.html` content

**Description:** The "Course Description" and "Course Goals and Learning Outcomes" sections in `core/about.html` are verbatim duplicates of the same sections in `core/syllabus.html` — identical paragraphs, identical 9-item outcomes list.

**Justification:** report §2.5. Any future edit made to one copy risks silently desyncing from the other, and nothing currently checks for this.

**Files affected:** `core/about.html`, `core/syllabus.html`.

**Steps:**
1. Designate `core/syllabus.html` as the canonical location (it's the fuller, more official document).
2. In `core/syllabus.html`, add anchor ids to the two relevant headings:
   ```html
   <h2 id="course-description">Course Description</h2>
   ...
   <h2 id="learning-outcomes">Course Goals and Learning Outcomes</h2>
   ```
3. In `core/about.html`, replace the duplicated paragraphs and list (the "Course Description" and "Course Goals and Learning Outcomes" sections) with a short pointer:
   ```html
   <h2>Course Description</h2>
   <p>See the <a href="syllabus.html#course-description">Syllabus</a> for the full course description and learning outcomes.</p>
   ```
4. Leave the "Instructor" and "Course Site" sections of `core/about.html` as-is — those are not duplicated elsewhere.
5. Run `pytest tests/ -v`, specifically confirming `TestContentNotEmpty::test_page_content_has_minimum_text` still passes for the now-shorter `about.html` (it will — the page still easily exceeds the 20-character minimum).

---

### M2. Accessibility: table `scope`/`caption`, `aria-current`, skip-link

**Description:** Three related, cheap accessibility gaps: data tables have no `scope`/`caption` attributes; the active nav item is marked only by a CSS class with no ARIA signal; there is no skip-to-content link, so keyboard/screen-reader users must traverse the full 6-item nav on every one of the 22 pages before reaching content.

**Justification:** report §3. None of these require design changes, and all are standard practice.

**Files affected:** all 22 `.html` files, `css/style.css`.

**Steps — table `scope`/`caption`:**
1. In each `<table>` in `index.html`, `core/about.html`, `core/assignments.html`, `core/syllabus.html`: add `scope="col"` to header `<th>` cells in the top row, and `scope="row"` to any `<th>` that labels a row (the two-column "Course Details"-style tables use this pattern: `<tr><th>Instructor</th><td>Jon Chun</td></tr>`).
2. Add a `<caption>` as the first child of each `<table>`, describing its contents (e.g. `<caption>Summary of assignments and their grade weights</caption>`).
3. If a visible caption changes the design more than desired, add this utility class to `css/style.css` and apply it to the `<caption>` elements:
   ```css
   .visually-hidden {
     position: absolute;
     width: 1px; height: 1px;
     padding: 0; margin: -1px;
     overflow: hidden;
     clip: rect(0, 0, 0, 0);
     white-space: nowrap;
     border: 0;
   }
   ```

**Steps — `aria-current`:**
4. On every page, the nav link carrying `class="active"` should also carry `aria-current="page"`, e.g.:
   ```html
   <li><a href="../core/syllabus.html" class="active" aria-current="page">Syllabus</a></li>
   ```
5. This is a mechanical, repeated edit across all 22 files. A scripted find/replace on the fixed pattern `class="active"` → `class="active" aria-current="page"` is safe here since `class="active"` only ever appears on nav links in this codebase (verify with `grep -rn 'class="active"' *.html core/*.html weeks/*.html` before running the replace, to confirm no other usage exists).

**Steps — skip link:**
6. As the first element inside `<body>` on all 22 pages, add:
   ```html
   <a class="skip-link" href="#main-content">Skip to content</a>
   ```
7. Add `id="main-content"` to each page's `<main class="content-wrapper">` tag.
8. Add to `css/style.css`:
   ```css
   .skip-link {
     position: absolute;
     left: -9999px;
     top: 0;
     background: var(--bg);
     color: var(--text);
     padding: 0.75rem 1.25rem;
     z-index: 10;
   }
   .skip-link:focus {
     left: 1rem;
     top: 1rem;
   }
   ```
9. Given the volume of mechanical edits (22 files × 2 changes), write a one-off Python script using the same file-glob pattern as `tests/conftest.py` (`Path('.').rglob('*.html')`, excluding `mi-sitio/`) to apply steps 4–7 consistently, rather than hand-editing each file.
10. Run `pytest tests/ -v` — none of these changes touch doctype, title, footer, or hero assertions, so the suite should stay green.

---

### M3. SEO/meta basics

**Description:** No page has a `<meta name="description">`, favicon, Open Graph tags, or a `robots.txt`/`sitemap.xml`.

**Justification:** report §3. All are one-file or one-line additions with an outsized payoff for how the site appears in search results and link previews.

**Files affected:** all 22 `.html` files' `<head>`, plus new `favicon.svg`, `robots.txt`, `sitemap.xml` at repo root.

**Steps:**
1. Add a distinct `<meta name="description" content="...">` to each page's `<head>`, right after the viewport meta tag. Write a unique 1–2 sentence description per page family (index, each core page, each week — week pages can reuse a template like "Week N of IPHS 400: Frontiers in AI — {topic}." pulled from the existing hero text).
2. Create a simple favicon (`favicon.svg` or `favicon.ico`) at repo root. Add `<link rel="icon" href="/favicon.svg">` to every page's `<head>` (an absolute `/favicon.svg` path works from any directory depth, unlike the relative `css/style.css` pattern — confirm this resolves correctly under the eventual host and under local serving; if absolute paths are undesirable, use the same `../` relative pattern already used for CSS).
3. Add Open Graph tags to at least `index.html`, ideally all pages:
   ```html
   <meta property="og:title" content="IPHS 400: Frontiers in AI"/>
   <meta property="og:description" content="..."/>
   <meta property="og:type" content="website"/>
   ```
4. Add `robots.txt` at repo root:
   ```
   User-agent: *
   Allow: /
   ```
5. Add `sitemap.xml` at repo root. Generate it with a short one-off Python script that walks `Path('.').rglob('*.html')` (excluding `mi-sitio/` and `.venv/`, matching `tests/conftest.py`'s existing exclusion pattern) and emits a `<url><loc>...</loc></url>` entry per page.
6. Run `pytest tests/ -v` — no existing test checks meta tags or favicons, so no impact; see Task L8 for optionally adding coverage.

---

### M4. Remove or justify dead CSS (~30% of `css/style.css`)

**Description:** `css/style.css` (620 lines) still contains a large amount of WordPress-theme machinery — a featured-image hero variant, blog post-preview cards, badges, a placeholder-notice callout, multi-column layout, social-nav — with zero matching usage anywhere in the site's 22 HTML pages.

**Justification:** report §4.2. Confirmed via `grep -rl` that each listed class below has 0 matches outside `style.css` itself. Dead CSS actively confuses future maintainers who can't tell "unused today" from "load-bearing for something invisible."

**Files affected:** `css/style.css`.

**Steps:**
1. Confirm the current unused-selector list is still accurate before deleting anything:
   ```bash
   for cls in has-featured-image featured-media post-preview entry-meta entry-footer post-nav share-links badge placeholder-notice columns wp-block-image wp-block-separator social-nav other-blog-pages; do
     echo -n "$cls: "; grep -rl "$cls" index.html 404.html core/*.html weeks/*.html 2>/dev/null | wc -l
   done
   ```
2. Delete the corresponding rule blocks in `css/style.css`: `.site-header.has-featured-image` and `.featured-media`/`.featured-media::after`; `.social-nav`; `.entry-meta`; `.entry-footer`; `.post-nav`; `.share-links` (and its nested rules); `.post-preview` and `.other-blog-pages`; `.badge` and its `-draft`/`-private`/`-placeholder` variants; `.placeholder-notice`; `.columns`; `.wp-block-image`/`.wp-block-separator`; and the featured-image override inside the `@media (max-width: 768px)` block.
3. Remove the now-orphaned `--primary`, `--draft`, and `--priv` custom properties from `:root` once their only consumers (deleted in step 2) are gone.
4. If any block is intentionally being kept for a planned future feature rather than deleted, replace it with a one-line comment explaining why (`/* kept for planned blog feature, see issue #NN */`) instead of leaving it silently unused.
5. After deleting, re-run `pytest tests/ -v` (unaffected by CSS content) and do a full visual pass — open every page family (`index.html`, one `core/` page, one `weeks/` page, `404.html`) via `python3 -m http.server` and confirm nothing looks broken, cross-checking against the confirmed-unused list from step 1 before removing anything not on it.

---

### M5. "Add a page" checklist, or lightweight templating

**Description:** All 22 HTML pages hand-duplicate an identical header/nav/footer skeleton, differing only in `class="active"` placement and relative-path depth. There is currently no documentation of what must be kept in sync when adding a page.

**Justification:** report §4.1. This is the architecture's biggest structural risk; the existing `TestNavConsistency` test class exists specifically because this duplication is fragile.

**Files affected:** `README.md`; optionally new `templates/` and `build.py`.

**Steps — Option A (recommended first step, minimal effort):**
1. Add a `## Adding a New Page` section to `README.md` listing every place that must be touched: the site-branding header block, the 6-item nav (correct `../` depth, correct `class="active"`/`aria-current="page"` on the new active item, and removing it from whichever item was previously marked active on sibling pages if applicable), the `.breadcrumbs` div, the hero `<h1>`, the footer, and — for `weeks/` pages specifically — the prev/next pagination line and updating `core/schedule.html`'s week list.
2. Include a copy-paste HTML skeleton for a new `core/`-level page and a new `weeks/`-level page in that README section, so a future editor starts from a known-correct template rather than copying an arbitrary existing page and hand-editing every line.

**Steps — Option B (larger, optional investment):**
3. Create `templates/_header.html` and `templates/_footer.html` partials containing the shared chrome, parameterized by page title, active-nav key, and relative path depth.
4. Write a small `build.py` (plain Python string templating, or Jinja2 if a dependency is acceptable) that reads each page's unique content plus its active-nav key and generates the 22 static HTML files, still committed to the repo as plain static files (this preserves the "ships as static HTML with no runtime dependencies" property the README currently advertises).
5. Update `README.md`'s "Repository Structure" section to document `templates/` and the `build.py` workflow (e.g. "edit `templates/` or a page's content source, then run `python3 build.py`").
6. Treat Option B as a future nice-to-have — do Option A now regardless of whether Option B is pursued later.

---

### M6. Semantic color-coding for naturally binary/graded content

**Description:** The live site uses exactly one accent color (blue) for everything — no content is ever color-coded, even where the content structure implies an obvious binary (Permitted vs. Restricted AI use in `core/policies.html`).

**Justification:** report §8.3. The palette's restraint is a real strength for a text-heavy site, but this specific case (two adjacent lists a student needs to visually distinguish while scanning) is a clear, low-risk opportunity being left on the table.

**Files affected:** `css/style.css`, `core/policies.html`.

**Steps:**
1. Add two new semantic tokens to `:root` in `css/style.css`, verifying each clears 4.5:1 contrast against `--bg` (`#fff`) using the same luminance-ratio method as report §8.3 before finalizing:
   ```css
   --ok: #2e7d32;   /* permitted / pass */
   --warn: #b45309; /* restricted / caution */
   ```
2. In `core/policies.html`, add a second class to the two relevant lists (in addition to `item-list` from Task H5):
   ```html
   <ul class="item-list list-ok"> <!-- Permitted and Expected AI Use --> ...
   <ul class="item-list list-warn"> <!-- Restricted AI Use --> ...
   ```
3. Add matching CSS — a simple left-border accent, no icons required:
   ```css
   .list-ok { border-left: 3px solid var(--ok); padding-left: 1rem; }
   .list-warn { border-left: 3px solid var(--warn); padding-left: 1rem; }
   ```
4. Treat the grading-scale table (`core/syllabus.html`) as optional/lower-value follow-on: a subtle per-row tint by letter grade is a well-understood convention but riskier to get right visually than the list treatment above — defer unless there's appetite for it.
5. Run `pytest tests/ -v` and do a visual check that the new colors don't clash with the existing blue accent or make the page feel busier than intended — this should read as a quiet, functional cue, not decoration.

---

### M7. Fix wide-viewport layout waste and add sticky navigation

**Description:** The content column is pinned to a fluid left offset (`--col-left: calc(8.33vw + 28px)`) with a fixed ~704px max-width and no upper bound — on a 1920px-wide monitor, roughly half the viewport sits permanently empty on the right with nothing placed there. Separately, `.site-header` has no `position: sticky`, so on long pages (Syllabus, Policies) the nav scrolls away immediately.

**Justification:** report §8.4, §8.7. This is a dated, unbalanced layout pattern on modern wide displays, and the lack of sticky nav is a friction point specifically on the two longest, most information-dense pages.

**Files affected:** `css/style.css`.

**Steps — wide-viewport fix:**
1. Cap `--col-left`'s growth with `clamp()` so it stops drifting further right on very wide screens, while preserving the existing hard-left aesthetic at normal desktop widths:
   ```css
   :root {
     --col-left: clamp(28px, 8.33vw + 28px, 220px);
   }
   ```
2. Test at 1920px and 2560px widths (browser devtools responsive mode) to confirm the column no longer keeps drifting away from a reasonable position as viewport width grows.

**Steps — sticky nav:**
3. Change `.site-header` to:
   ```css
   .site-header {
     position: sticky;
     top: 0;
     z-index: 5;
     /* background: var(--bg) already set above — confirms header stays opaque when pinned */
   }
   ```
4. Verify the existing `.site-header { background: var(--bg); ... }` rule (already present) keeps the sticky header opaque over scrolled content — no change needed there, just confirm during testing.
5. Test by scrolling `core/syllabus.html` and `core/policies.html` (the two longest pages) to confirm the header stays pinned, remains legible, and doesn't clip awkwardly against the hero at the moment it becomes sticky.
6. Optional follow-on (not required for this task): add a subtle `box-shadow` that appears only once the page has scrolled, via a few lines of vanilla JS toggling a class — flag as a future nice-to-have, not blocking.

---

### M8. Rebalance table typography against body text

**Description:** `.page-content table` is set to `font-size: 0.8em` (~17.6px desktop, ~14.4px mobile) against 22px/18px body copy — meaning the tables carrying the highest-stakes information on the site (grading weights, deadlines, costs, the MP3/MP4 rubric) render smaller than the surrounding prose.

**Justification:** report §8.2. This is backwards for this content — the mobile size in particular (14.4px) is below common minimum-legible-text guidance.

**Files affected:** `css/style.css`.

**Steps:**
1. Change `.page-content table { font-size: 0.8em; ... }` to `font-size: 0.9em;` (desktop ≈19.8px, mobile ≈16.2px — both comfortably above minimum-legible thresholds while still reading as slightly more "data-dense" than body prose).
2. Check the widest table on the site — the 3-column "Required Accounts and Subscriptions" table in `core/syllabus.html` — at the new size, at both desktop and the 768px breakpoint, to confirm it doesn't wrap awkwardly.
3. If any table becomes cramped at the new size on narrow viewports, wrap it in a horizontally scrollable container rather than shrinking the text back down:
   ```html
   <div class="table-wrap"><table>...</table></div>
   ```
   ```css
   .table-wrap { overflow-x: auto; }
   ```
4. Visually confirm across desktop and mobile breakpoints before finalizing.

---

## Low Priority

### L1. Add `:focus-visible` styles and hover/focus transitions

**Description:** `css/style.css` has zero `focus`/`outline`/`transition` rules. Hover states change color instantly with no easing, and keyboard-focused links get only the browser's unstyled default outline while mouse-hovered links get a deliberately styled color change.

**Justification:** report §8.2, §3. Cheap, zero-risk polish; also closes a minor a11y consistency gap between mouse and keyboard interaction.

**Files affected:** `css/style.css`.

**Steps:**
1. Add a transition to the base `a` rule:
   ```css
   a {
     color: var(--accent);
     text-decoration: underline;
     text-decoration-thickness: 2px;
     text-underline-offset: 2px;
     transition: color 0.15s ease;
   }
   ```
2. Add explicit focus-visible styling near the existing hover rules:
   ```css
   a:focus-visible,
   .main-nav li a:focus-visible {
     outline: 2px solid var(--accent-dk);
     outline-offset: 2px;
   }
   ```
3. Tab through a couple of pages by keyboard to confirm the focus ring is clearly visible and doesn't visually clash with the skip-link from Task M2 (if implemented).

---

### L2. Add cache-busting query string to the stylesheet

**Description:** `css/style.css` is linked identically on all 22 pages with no version marker, risking stale-CSS caching for returning visitors after future edits.

**Justification:** report §4.4.

**Files affected:** all 22 `.html` files, `tests/test_unit_html_structure.py`.

**Steps:**
1. Pick a version convention, e.g. `css/style.css?v=2`.
2. Update every `<link href="css/style.css" ...>` / `<link href="../css/style.css" ...>` across all 22 pages to append `?v=2`.
3. Check `tests/test_unit_html_structure.py::TestCSSLink::test_all_pages_link_to_resolvable_style_css` — it resolves `href` directly as a file path via `(path.parent / href).resolve()`, which will **break** with a query string appended (the resulting path `css/style.css?v=2` won't exist on disk). Update the test to strip the query string before resolving:
   ```python
   href = links[0]["href"].split("?")[0]
   ```
4. Document the versioning convention in the README (bump `v=` on future CSS-only edits) — or defer full automation to Task M5 Option B if a build step is ever introduced, at which point the version could be a content hash instead of a hand-bumped number.
5. Run `pytest tests/ -v` after both the HTML and test changes to confirm the suite passes.

---

### L3. Tokenize the spacing scale

**Description:** Colors, fonts, and widths are all centralized as CSS custom properties in `:root`, but spacing is not — a survey of every `margin`/`padding` declaration in `css/style.css` finds 16+ distinct hardcoded values (`0.15rem` through `4rem`, plus several raw pixel values) with no consistent multiplier relationship between them.

**Justification:** report §8.4. This is a refactor for consistency and future maintainability, not a visible bug — the current rendered spacing rhythm already looks fine.

**Files affected:** `css/style.css`.

**Steps:**
1. Add a spacing scale to `:root`:
   ```css
   --sp-1: 0.25rem;
   --sp-2: 0.5rem;
   --sp-3: 0.75rem;
   --sp-4: 1rem;
   --sp-5: 1.5rem;
   --sp-6: 2rem;
   --sp-7: 2.5rem;
   --sp-8: 3rem;
   --sp-9: 4rem;
   ```
2. Go through `css/style.css` rule by rule, replacing each hardcoded `margin`/`padding` value with the nearest token (e.g. `margin: 1.5rem 0;` → `margin: var(--sp-5) 0;`), rounding pragmatically — the goal is zero visible difference, purely centralizing the values.
3. Do this as an isolated commit, after all other CSS-content tasks in this spec (M4, M6–M8, L1) are finished, to avoid repeated merge conflicts on the same file.
4. Run `pytest tests/ -v` plus a full visual pass on a representative page from each family (index, a `core/` page, a `weeks/` page) to confirm the refactor introduced no visible change.

---

### L4. Add `prefers-color-scheme: dark` support

**Description:** Colors are hardcoded (`--bg: #fff`, `--text: #111`) with no dark-mode branch; a visitor with system dark mode enabled gets a plain bright-white page with no adaptation.

**Justification:** report §8.6.

**Files affected:** `css/style.css`.

**Steps:**
1. Add a dark-mode override block, choosing values that independently clear 4.5:1 contrast against the new dark background (verify with the same method as report §8.3 before finalizing):
   ```css
   @media (prefers-color-scheme: dark) {
     :root {
       --bg: #16181c;
       --text: #e8e8e8;
       --text-lt: #9a9a9a;
       --accent: #4fb3e8;
       --accent-dk: #7fcdf5;
       --border: #33363b;
       --code-bg: #23262b;
     }
   }
   ```
2. Confirm the `.hero h1::before` decorative rule (uses `background: currentColor`) and `.page-content code`/`.page-content pre` (already driven by `--code-bg`) adapt automatically with no further edits, since they reference tokens rather than hardcoded values.
3. Test via browser devtools' "Emulate CSS media feature prefers-color-scheme: dark."
4. This is purely additive (one new `@media` block) — no existing rule changes, so regression risk is minimal.

---

### L5. Refine heading letter-spacing at smaller sizes

**Description:** Every heading level uses the same `-0.02em` letter-spacing, which reads as confident at the 49.5px hero size but slightly cramped at smaller sizes like the 22px `h4`.

**Justification:** report §8.2.

**Files affected:** `css/style.css`.

**Steps:**
1. Add a lighter tracking value for the smallest heading level:
   ```css
   .page-content h4 { letter-spacing: -0.01em; }
   ```
2. Leave `h1`, `h2`, `h3`, and the hero `h1` at the existing `-0.02em` — tightening reads fine at those larger sizes.
3. Cosmetic and low-risk; verify visually rather than via any automated test.

---

### L6. Document removed security headers for future deployment

**Description:** The now-deleted `netlify.toml` previously set `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`. No equivalent exists anywhere in the repo now, which is expected given the intentional move to a plain static-file model — but nothing currently reminds a future deployer that these were once configured for a reason.

**Justification:** report §4.3.

**Files affected:** `README.md`.

**Steps:**
1. Add a short note wherever deployment guidance eventually lives in `README.md` (see Task H1): "Previously, `netlify.toml` set `X-Frame-Options: DENY` and `X-Content-Type-Options: nosniff`. Whichever host is chosen for future deployment should reconfigure equivalent headers if supported (GitHub Pages does not support custom headers at all; Cloudflare Pages and nginx do)."
2. Documentation only — no code change.

---

### L7. (Optional) Add one real code-sample or terminal-output visual element

**Description:** The site has fully-built CSS support for `<pre>`/`<code>` blocks (background, padding, horizontal scroll) that is never invoked anywhere in the actual page content — despite the course being entirely about terminal tools, config files, and CLI agents.

**Justification:** report §8.5, §8.1. A missed opportunity to establish visual/technical identity appropriate to the subject matter; explicitly optional and content-dependent, not a structural fix.

**Files affected:** one `weeks/*.html` page (e.g. `weeks/week-02.html` or `weeks/week-04.html`).

**Steps:**
1. **Content-owner input needed:** pick a short, pedagogically appropriate snippet — e.g. a sample `.zshrc` alias block for Week 2 (Shell Fundamentals and Dotfiles), or a `CLAUDE.md` excerpt for Week 4 (CLAUDE.md and Slash Commands).
2. Add it using the already-styled, currently-unused pattern:
   ```html
   <pre><code>alias ll='eza -la'
   alias gs='git status'</code></pre>
   ```
3. This is the lowest-priority, most optional task in this spec — treat as polish, best scheduled after all other tasks, and only if the instructor wants to invest in this.

---

### L8. Extend the pytest suite

**Description:** The existing 25-test suite covers structural/link integrity well but has no coverage for accessibility attributes, meta tags, cross-page textual consistency, or dead CSS.

**Justification:** report §5. Locks in the fixes from this spec as regression tests so they can't silently regress again.

**Files affected:** `tests/` (new files or additions to existing ones).

**Steps:**
1. Add `tests/test_accessibility.py` with checks for: every `<th>` has a `scope` attribute (post Task M2); every `<table>` has a `<caption>` (post Task M2); the active nav link carries `aria-current="page"` (post Task M2); every page has exactly one `<h1>` (formalizes what's already true today, guards against future regression).
2. Add checks (new file or appended to `test_unit_html_structure.py`) for `<meta name="description">` presence with non-empty content, and a `<link rel="icon">` on every page (post Task M3).
3. Add a cross-page consistency test comparing the "Course Description" text between `core/about.html` and `core/syllabus.html` — either asserting they're identical (if Task M1's de-duplication is *not* done and both are meant to mirror each other) or, if M1 *is* done, asserting `about.html` correctly links to `syllabus.html#course-description` instead.
4. Add a CSS "used-selector" check: a small Python script/test that extracts every class selector from `css/style.css` and asserts each has at least one match somewhere across the `*.html` tree (excluding `mi-sitio/`), to catch future dead CSS before it accumulates again (per Task M4).
5. Keep all additions in Python/pytest, consistent with the existing suite — avoid introducing a Node-based tool (e.g. `stylelint`) purely for the used-selector check in step 4, to keep the test toolchain single-language.
6. Update `tests/requirements.txt` only if a new Python dependency is actually needed (likely none — `BeautifulSoup`/`lxml`, already a dependency, is sufficient for all of the above).
7. Run `pytest tests/ -v` to confirm all new tests pass against the current (post-fix) codebase, and that the total test count in any CI/documentation references is updated if it's stated as a fixed number anywhere (e.g. this spec's own "25-test suite" references will need bumping once these are added).

---

## Suggested Implementation Order

1. **High-priority content/link fixes (H1–H6)** are independent of each other and of the CSS-touching tasks below — do these first, in any order, ideally each as its own small commit for easy review.
2. **CSS-touching Medium/Low tasks (M4, M6, M7, M8, L1, L3, L4, L5)** all modify `css/style.css`. To minimize merge conflicts, batch these into one coordinated pass: do M4 (dead CSS removal) **first** since it removes whole blocks other tasks might otherwise edit unnecessarily, then M6–M8 and L1/L4/L5 (all additive or small edits), and do **L3 (spacing tokenization) last**, since it touches nearly every line in the file and should refactor the already-finalized rules rather than being redone after each subsequent CSS edit.
3. **M2 (accessibility) and M3 (SEO/meta) and L2 (cache-busting)** each touch all 22 HTML files mechanically — good candidates for small one-off scripts rather than hand-editing, and can be done in parallel with the CSS batch since they don't touch `css/style.css` content (M2 adds one small CSS utility class, which can be appended without conflicting with the M4/L3 refactor if done slightly before or after).
4. **M5 (templating/checklist) and L8 (test suite extension)** are best done *last*, once the HTML structure has stabilized from the tasks above — a templating build step or new tests written against a still-changing page structure would need immediate rework otherwise.
5. **L6 and L7** are documentation-only / optional-content tasks with no dependencies — schedule whenever convenient.

Run `pytest tests/ -v` after each individual task, not just at the end of a batch, to keep regressions attributable to a single change.
