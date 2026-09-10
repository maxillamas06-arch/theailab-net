# IPHS 400 Course Site — Web Code Review

**Date:** 2026-09-07
**Scope:** All static HTML/CSS in the repository root, `core/`, `weeks/`, and `css/`; the pytest suite in `tests/`; `README.md` and `.gitignore`. Content accuracy (dates, arithmetic) was spot-checked where it intersects with code correctness. `mi-sitio/` (an unrelated Next.js scaffold sitting in this repo) is out of scope.
**Method:** manual read of every page template family (index, 404, all 5 `core/` pages, a representative sample plus boundary cases of the 15 `weeks/` pages), automated grep/Python sweeps across all 22 HTML files for structural patterns (headings, `<img>`, ARIA, `scope`/`caption`, external links, `mailto:`), a WCAG contrast-ratio calculation for the palette in `css/style.css`, weekday verification for every hardcoded date, and a run of the existing pytest suite (25 tests, all passing).

---

## 1. Executive Summary

The site is a small, dependency-free static HTML/CSS course site with a genuinely good foundation: a single shared stylesheet, no inline styles, no JavaScript, a consistent header/nav/hero/footer skeleton repeated correctly across all 22 pages, and an existing pytest suite that already catches the most common regressions (broken links, missing footer, inconsistent nav, empty pages). Every hardcoded date in the syllabus/schedule/week pages was independently verified against the actual 2026 calendar and is correct, and the color palette clears WCAG AA contrast on every foreground/background pair checked.

The issues found cluster into five areas, in rough priority order:

1. **A live functional regression**: `404.html` is now unreachable through any actual "page not found" event (see §2.1) — a direct side effect of this session's earlier removal of `netlify.toml`.
2. **A licensing conflict**: the repo's MIT `LICENSE` grants blanket reuse rights over content that `core/policies.html` simultaneously declares "protected by copyright law" with no redistribution allowed (§2.2).
3. **Zero hyperlinks to any of the ~15 external resources the site names by text** (GitHub repo, Moodle, Anthropic, OpenRouter, `digital.kenyon.edu/dh`, the SASS office email, the poster template, etc.), including the instructor's own contact email, which is referenced twice but never actually given (§2.3–2.4).
4. **No templating layer**: 22 files hand-duplicate ~25 lines of identical header/nav/footer chrome each; the nav has already had to be kept in sync by hand 22 times over, and nothing but the test suite would catch a slip (§4.1).
5. **Missing accessibility and SEO fundamentals** that are cheap to add and normally expected on any modern site: table `scope`/`caption`, `aria-current` on the active nav item, a skip-to-content link, meta description, favicon, Open Graph tags (§3).

None of these require restructuring the site's actual page content, and all are addressable without introducing a build step or framework if the team wants to keep the "no build step" property that `README.md` currently advertises as a feature.

---

## 2. High-Priority Findings

### 2.1 `404.html` has no mechanism to actually serve on a 404 — regression from the Netlify removal

`404.html` exists, is well-formed, and is linked from nowhere (correctly — it's meant to be an automatic fallback, not a nav destination). Its *only* wiring to real 404 behavior was this block in the now-deleted `netlify.toml`:

```toml
[[redirects]]
  from = "/*"
  to = "/404.html"
  status = 404
```

That redirect is what made Netlify actually render `404.html` when a visitor hit a broken/missing URL. Now that `netlify.toml` is gone (per this session's earlier "strip Netlify/CI" request) and the README's recommended local workflow is `python3 -m http.server`, there is **no server-side or config-level mechanism left anywhere in the repo that serves `404.html` on an actual missing page**. Python's built-in `http.server` has no custom-404 hook at all — a truly missing URL will show Python's own generic plaintext error, never the site's branded 404 page. The file is now dead weight that *looks* wired up (it's in `TestRequiredFiles`, it has a full header/nav/footer) but functionally isn't.

This isn't a hypothetical: it's a direct, verifiable consequence of a change already made in this repo's working tree.

**Recommendation:** pick one:
- If the site will be redeployed to any static host later (GitHub Pages, Cloudflare Pages, a plain nginx box), each has its own 404 mechanism (GitHub Pages serves `404.html` automatically at the repo root **for real** with no config needed; nginx needs `error_page 404 /404.html;`). Document whichever target is chosen in the README instead of leaving it implicit.
- For the *local* dev workflow specifically, note in the README that `python3 -m http.server` does not honor `404.html`, or swap the documented command for something that does (e.g. `npx serve -s` doesn't either, but a five-line custom `http.server` subclass or `python3 -m http.server` plus a note is enough — this is a documentation fix, not a code fix, if GitHub Pages is the eventual target).

### 2.2 `LICENSE` (MIT) conflicts with the copyright terms declared inside the site itself

The repo ships a plain MIT `LICENSE` at the root, which grants "permission... to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software" with no carve-outs. `core/policies.html` simultaneously states, in the "Copyright of Course Materials" section:

> "You may not reproduce, distribute, or display course materials for anyone outside of the class without the faculty member's explicit, written consent."

A single unqualified `LICENSE` file at repo root applies, by convention and by how GitHub surfaces it, to *everything in the repository* — including the HTML files containing the syllabus text, assignment descriptions, and grading rubrics that the site's own policies page says are all-rights-reserved. This is an internal contradiction a licensing-aware visitor (or a student trying to figure out if they can fork the repo) would immediately hit.

**Recommendation:** split the license scope explicitly, e.g. add a line to `README.md` and/or `LICENSE` itself: "This MIT license covers the site's code and templates (HTML structure, CSS, tests). Course content — syllabus text, schedule, assignments, and policies — is © Jon Chun / Kenyon College, all rights reserved, per `core/policies.html`." This is a one-paragraph fix that removes a real ambiguity.

### 2.3 The instructor's email is referenced twice but never actually provided, and the site has zero `mailto:` links

Both `core/syllabus.html` and `core/about.html` state "Email is the best way to reach the instructor outside office hours" — but no email address appears anywhere on the site. A prospective or enrolled student reading only the website has no way to actually email the instructor. `sass@kenyon.edu` (the accessibility office) *is* given as literal text in `core/policies.html`, but even that is not a clickable `mailto:` link — a `grep -rn "mailto:"` across every HTML file in the site returns zero matches.

**Recommendation:** add the instructor's contact email (wherever it's meant to live — presumably Moodle currently substitutes for it, but the site claims email is "the best way to reach" them) as a real `mailto:` link, and convert `sass@kenyon.edu` to `<a href="mailto:sass@kenyon.edu">`.

### 2.4 Zero external hyperlinks anywhere in the site, despite naming ~15 external resources

A sitewide search (`grep -rn 'href="https\?://'`) across all 22 pages returns **no results at all**. Every external resource the content names is inert plain text, including:

- `https://github.com/jon-chun/theailab-net` — shown as `<code>` text in both `core/about.html` and `core/syllabus.html`, never an `<a href>`
- Moodle / `Moodle.kenyon.edu`
- `digital.kenyon.edu/dh` (mentioned four times across `about.html`, `syllabus.html`, `assignments.html`, `policies.html`)
- Anthropic.com, OpenRouter.com (required-account signups in `syllabus.html`)
- "the course poster template (link on the course repository)" in `assignments.html` — text explicitly promises a link that isn't there
- Named tools referenced as bare text: `ripgrep`, `fzf`, `bat`, `eza`, `tmux`, GitHub Spec-Kit, OpenSpec

For a site whose whole purpose is to route students to external accounts, tools, and platforms, this means every single pointer requires a student to manually copy text into a browser or search for it. This is the single highest-leverage, lowest-risk fix in this report — it changes zero visible content and only adds `<a href>` wrappers around text that already names its own destination.

**Recommendation:** wrap the above (and anything else in the same category) in real anchors. This does not require rewriting any sentence — only adding `<a href="...">...</a>` around existing text.

### 2.5 Significant content duplication between `about.html` and `syllabus.html`

The "Course Description" and "Course Goals and Learning Outcomes" sections in `core/about.html` (lines 29–48) are **verbatim duplicates** of the corresponding sections in `core/syllabus.html` (lines 42–61) — same paragraphs, same 9-item learning-outcomes list, same closing sentence about outcome mapping. This is a maintenance hazard: any future edit to course goals, if made on one page, will silently desync from the other, and nothing in the test suite checks for this (the tests check structural presence, not cross-page textual consistency).

**Recommendation:** either de-duplicate (make `about.html` a short page that links to `syllabus.html#course-description` for the full text) or, if both must exist standalone, keep the duplication but add a one-line HTML comment (`<!-- keep in sync with core/syllabus.html -->`) as a stopgap, and consider a pytest check that the two blocks stay textually identical if they're intentionally meant to mirror each other.

---

## 3. Accessibility and SEO Gaps

None of these are functionality-breaking, but all are standard practice the site currently has none of:

| Gap | Detail |
|---|---|
| **No `scope` on table headers** | All 6 `<table>` elements across `index.html`, `core/about.html`, `core/assignments.html`, `core/syllabus.html` (13 separate `<th>` cells there alone) omit `scope="col"`/`scope="row"`. Screen readers can't reliably associate data cells with their header without it. |
| **No `<caption>` on any table** | Zero of the site's data tables (grading scale, assignment weights, rubric, required accounts) have a `<caption>` describing what the table contains. |
| **No `aria-current="page"`** | The active nav item is marked only with `class="active"` (a purely visual/CSS hook). Assistive tech has no semantic signal for which nav item represents the current page. |
| **No skip-to-content link** | Every page repeats the same ~6-item nav before reaching `<main>`. A "Skip to content" link (visually hidden until focused) is a near-zero-cost, very high-value addition for keyboard and screen-reader users on a repeated-chrome multi-page site like this. |
| **No explicit `:focus`/`:focus-visible` styling** | `css/style.css` (620 lines) has zero `focus` or `outline` rules. Browser default focus rings are not being suppressed (that's good — it's not a "broken" state), but the site otherwise carefully styles `:hover` states for links and nav (`a:hover`, `.main-nav li a:hover`) with no matching `:focus-visible` treatment, so keyboard users get a visibly different, unstyled experience from mouse users. |
| **No meta description** | Zero pages have `<meta name="description">`. Search engines and link-preview cards will fall back to arbitrary page text. |
| **No favicon** | No `<link rel="icon">` on any page; browsers will show a blank/default tab icon. |
| **No Open Graph / Twitter Card tags** | Links to this site shared in Slack, email, or social media will render as bare text/URL with no title or preview. |
| **No `robots.txt` or `sitemap.xml`** | Minor for a small course site, but both are one-file additions that help search indexing of a small multi-page site. |
| **No `<link rel="canonical">`** | Not critical at this scale, but standard practice once the site has a live URL. |

None of these are caught by the existing pytest suite (see §5).

---

## 4. Maintainability and Architecture

### 4.1 No templating — 22 files hand-duplicate the same chrome

Every one of the 22 HTML pages repeats an identical ~13-line header block (site branding + 6-item nav) and identical 1-line footer, differing only in the `class="active"` placement and the relative path depth (`../` vs none). This is by far the biggest structural risk in the codebase:

- A single nav-label change (e.g., renaming "Policies" to something else) requires 22 coordinated edits.
- This is *exactly* the failure mode `tests/test_integration_links.py::TestNavConsistency` exists to catch — which is good (the tests do their job) but also confirms the underlying architecture is fragile enough to need a dedicated test class just to keep 22 copies of the same 6 links in sync.
- The `README.md` explicitly frames "no build step or JS framework" as a feature of the site, so a full framework migration is probably not desired — but a lightweight, zero-runtime-dependency templating approach (a small Python/Jinja2 script that generates the 22 HTML files from one `_header.html`/`_footer.html` partial plus per-page content, run as a pre-commit or `make build` step, output still committed as static HTML) would preserve "ships as static HTML with no server-side code" while eliminating the duplication risk entirely.

**Recommendation:** at minimum, document a "how to add a new page" checklist (README currently has none) listing every place nav/footer/breadcrumbs must be touched. Better: introduce a minimal templating build step, since the test suite is already effectively emulating one by hand.

### 4.2 ~30% of `css/style.css` is dead code inherited from the WordPress-derived template

The README states the page layout and stylesheet were "adapted from a prior Kenyon course site... for visual consistency," and it shows: `css/style.css` (620 lines) still carries a large amount of blog/WordPress-theme machinery that has zero usage anywhere in this site's actual 22 pages. Verified via `grep -rl` across all HTML files — each of the following classes has **0** matches outside `style.css` itself:

`has-featured-image`, `featured-media` (and its `::after` duotone overlay), `post-preview`, `entry-meta`, `entry-footer`, `post-nav`, `share-links`, `badge`/`badge-draft`/`badge-private`/`badge-placeholder`, `placeholder-notice`, `.columns`, `.wp-block-image`, `.wp-block-separator`, `social-nav`.

That's roughly 180–190 of the file's 620 lines (~30%) — full rule blocks for a featured-image hero variant, blog post previews with author/date meta, category/share-link footers, draft/private/placeholder badges, and multi-column layout, none of which this plain-text course site uses or is likely to need given its current scope.

**Recommendation:** either delete the unused blocks (they're one `git revert` away if ever needed again) or, if they're intentionally kept as "future-proofing" for a blog-style feature that's actually planned, say so in a comment — as-is, a future maintainer has no way to tell "unused today" from "load-bearing for something I can't see."

### 4.3 Loss of HTTP security headers with no replacement noted

The removed `netlify.toml` also set:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
```

These headers are gone now with no equivalent anywhere else in the repo. This is a reasonable and expected consequence of intentionally moving to a plain static-file model with no deploy pipeline (there's no host left to attach headers to), but it's worth a one-line note in the README's "eventual deployment" guidance (if any is ever added back) so the next person to actually deploy this doesn't forget these were once configured for a reason.

### 4.4 No cache-busting on the single shared stylesheet

`css/style.css` is linked identically (`href="css/style.css"` / `href="../css/style.css"`) on every page with no version query string or hash. Since every page shares this one file, a future CSS edit risks being masked by browser/CDN caching for returning visitors until a hard refresh. Low priority at this traffic scale, but a one-line fix (`style.css?v=2`, bumped by hand or a build step) removes an entire class of "why isn't my CSS change showing up" support question.

---

## 5. Test Suite Coverage Gaps

The existing suite (`tests/test_unit_html_structure.py`, `test_integration_links.py`, `test_e2e_site.py`, 25 tests total, currently all passing) is a genuinely solid foundation — it catches missing doctypes, broken internal links, inconsistent nav, unreachable pages, leftover template branding, and stub content. What it does **not** cover, all of which the findings above would benefit from being locked in as regression tests going forward:

- **Accessibility**: no `axe-core`/`pa11y` pass, no check for `scope`/`caption` on tables, no check for `aria-current`, no check for exactly one `<h1>` per page (currently true for all 22, but unenforced)
- **HTML validity**: `lxml`'s permissive parser will silently "fix" malformed markup; there's no strict W3C-validator-style check that would catch actual invalid HTML
- **External link liveness**: `_resolve_href()` in `test_integration_links.py` explicitly skips `http(s)://` links (reasonable, to avoid network flakiness in CI) — but since §2.4 found *zero* external links exist at all right now, this gap is currently moot; it becomes relevant the moment external links are added per that recommendation
- **Cross-page textual consistency**: nothing catches the `about.html`/`syllabus.html` duplication drifting apart (§2.5)
- **CSS**: no linter (`stylelint`) and no "used-selector" check that would have caught the dead CSS in §4.2
- **Meta tags**: no check for `<meta name="description">`, favicon, or viewport correctness beyond what's already asserted

None of this is a criticism of the existing suite's quality — it's well-organized, well-named, and does exactly what it claims. It simply has a narrower scope (structural/link integrity) than "web best practices" as a whole.

---

## 6. What's Already Working Well

For balance, worth stating explicitly what a rewrite should *not* disturb:

- **Consistent semantic HTML5** — every page correctly uses `<header>`, `<nav>`, `<main>`, `<footer>`, with exactly one `<h1>` per page and no heading-level skips inside `.page-content` anywhere in the site (verified programmatically across all 22 pages).
- **Zero broken internal links, zero unreachable pages** — confirmed both by the existing test suite and independently.
- **Correct relative-path depth handling** — root pages use `css/style.css` / `index.html`, one-level-deep pages (`core/`, `weeks/`) correctly use `../`, with no mismatches found.
- **All hardcoded dates are calendar-accurate** — every date named in `core/syllabus.html`, `core/schedule.html`, `core/assignments.html`, and all 15 week pages (e.g., "Thursday, August 27," "Tuesday, October 6," "Friday, December 18, 2026") was independently checked against the actual 2026 calendar and is correct, including the two single-session weeks caused by October Break.
- **Assignment-weight arithmetic checks out** — the 7-line grading table (20+30+5+5+10+10+20) and the MP3/MP4 rubric (15+20+15+25+25) both sum to exactly 100%.
- **WCAG AA color contrast** — every text/background pair in the palette (`--text` on white: 18.9:1, `--text-lt` on white: 4.54:1, `--accent` on white: 5.21:1, `--accent-dk` on white: 8.59:1) clears the 4.5:1 AA threshold for normal text.
- **No inline styles, no JavaScript, single stylesheet** — genuinely simple, auditable, dependency-free front-end, consistent with the README's stated design goal.
- **Correct prev/next week pagination** — all 15 week pages chain correctly with proper boundary handling (week 1 has no "previous," week 15 has no "next").

---

## 7. Prioritized Recommendations

| # | Finding | Priority | Est. effort |
|---|---|---|---|
| 1 | Wire up or document `404.html`'s actual serving mechanism for whatever host/local workflow is used (§2.1) | High | Small (doc fix or host-specific config) |
| 2 | Resolve the MIT-license-vs.-all-rights-reserved-content conflict (§2.2) | High | Trivial (one paragraph) |
| 3 | Add the instructor's real `mailto:` email; link `sass@kenyon.edu` (§2.3) | High | Trivial |
| 4 | Hyperlink every named external resource site-wide (§2.4) | High | Small (no content rewrite, just `<a>` wrapping) |
| 5 | De-duplicate or sync-guard the `about.html`/`syllabus.html` overlap (§2.5) | Medium | Small–Medium |
| 6 | Add `scope`/`caption` to all data tables; `aria-current="page"` on active nav; a skip-link (§3) | Medium | Small |
| 7 | Add meta description, favicon, OG tags, `robots.txt` (§3) | Medium | Small |
| 8 | Delete or comment-justify the ~30% dead CSS (§4.2) | Medium | Small |
| 9 | Document a "how to add a page" checklist, or introduce a minimal build/templating step (§4.1) | Medium | Medium (checklist) / Larger (templating) |
| 10 | Add `:focus-visible` styles matching the existing `:hover` treatment (§3) | Low | Trivial |
| 11 | Add cache-busting query string to `css/style.css` (§4.4) | Low | Trivial |
| 12 | Extend the pytest suite to cover accessibility/meta/CSS-lint gaps (§5) | Low | Medium |

---

## 8. Visual Design Critique

**Method:** the browser-automation tool needed to render and screenshot the live pages was unavailable this session, so this critique is derived from a systematic read of `css/style.css` (every rule, computed against its actual usage in the 22 HTML pages) plus a `grep`-verified audit of which CSS classes are actually invoked where. For a static, JavaScript-free site this is a reliable basis — there is no runtime behavior CSS analysis can miss — but it is a code-level rather than a pixel-level review; a follow-up pass with real screenshots at a few breakpoints would still be worth doing before calling the visual design final.

### 8.1 Overall look and feel

The design is a faithful, intentional port of the WordPress "Twenty Nineteen" theme (the stylesheet's own header comment says as much: "Design tokens measured from programminghumanity.wordpress.com"). That heritage shows in both its strengths and its mismatch with the subject matter:

- It reads as an **editorial/blog aesthetic** — large serif body copy (22px Hoefler Text/Garamond), a hard-left content column, generous line-height (1.8), thin rules, understated blue links. This is a considered, literate look, appropriate for the "Programming Humanity"-style humanities course it was borrowed from.
- But this course is **AI-SWE: coordinating coding agents through a professional SDLC** — a hands-on, tool-heavy, terminal-and-config curriculum (hooks, `CLAUDE.md`, JSON, CLI tools, GitHub Actions). Nowhere on the site does the visual design signal "this is a software engineering course": there is not one code block, terminal screenshot, diagram, or monospace-set example anywhere in the rendered output (see §8.5). A visitor arriving at the homepage would have no visual cue that this is a technical course rather than a literature or history seminar. The typography and the subject matter are pulling in different directions.

This is a legitimate, defensible aesthetic choice if it's deliberate (and the README's note about matching "a prior Kenyon course site... for visual consistency across Jon Chun's Kenyon course sites" suggests it is) — but it's worth naming explicitly as a trade-off, not an accident: the site optimizes for cross-course brand consistency at some cost to signaling its own subject matter.

### 8.2 Typography

- **Base size (22px) is large by current web norms** (16–19px is typical body-text range in 2026). Combined with the deliberately narrow `--mw: 640px` measure, this actually produces a good, comfortable line length (roughly 55–65 characters per line in the serif face) — so the choice is internally consistent and readability-conscious, not just oversized for its own sake. Worth keeping.
- **Two-typeface pairing (serif body / bold sans headings) is a real typographic decision**, not a default, and it's executed consistently — every `h1`–`h6` across all 22 pages uses the sans stack, every paragraph uses the serif stack, with no exceptions found.
- **Table text runs noticeably smaller than body text** — `.page-content table` is set to `font-size: 0.8em`, i.e. ~17.6px against 22px body copy (or ~14.4px against the 18px mobile body size). This is backwards for this site's content: the tables carry the highest-stakes information on the site — grading weights, deadlines, account costs, the rubric — and current sizing makes the most important data smaller and harder to read than the surrounding prose. This is worth reconsidering; at minimum the mobile table size (14.4px) is below common minimum-legible-text guidance.
- **No `transition` on any interactive state.** `a:hover`, `.main-nav li a:hover` and `.main-nark li a.active` all change `color` (and add underline) with zero transition — the change is an instant snap rather than the ~150–200ms ease that's near-universal on modern sites for perceived polish. One-line, zero-risk fix: add `transition: color 0.15s ease;` to the base `a` rule.
- **Letter-spacing is applied uniformly negative (`-0.02em`) on every heading level**, including the 12px badge text were it ever used. This is fine at large sizes (hero h1 at 49.5px) but is a slightly aggressive tightening to apply uniformly all the way down to smaller heading sizes (h4 at 22px) without adjusting per size — most type systems reduce or reverse the tracking adjustment as size decreases, since tight tracking that reads as "confident" at 50px can read as "cramped" at 22px.

### 8.3 Color palette

The `:root` block defines eight color tokens, but only six are ever actually rendered anywhere on the site:

| Token | Value | Actually used? |
|---|---|---|
| `--bg` | `#fff` | Yes — page background |
| `--text` | `#111` | Yes — body text |
| `--text-lt` | `#767676` | Yes — secondary text, tagline, breadcrumbs |
| `--accent` | `#0073aa` | Yes — links, active nav |
| `--accent-dk` | `#005177` | Yes — link hover |
| `--border` | `#e0e0e0` | Yes — table borders, dividers |
| `--code-bg` | `#f5f5f5` | Yes — inline `<code>` background |
| `--primary` | `#0073a8` | **No** — only referenced by the unused `.featured-media::after` duotone overlay (§4.2 of this report) |
| `--draft` | `#ff9800` | **No** — only referenced by the unused `.badge-draft`/`.placeholder-notice` rules |
| `--priv` | `#e91e63` | **No** — only referenced by the unused `.badge-private` rule |

The *live* palette is therefore effectively: one background, two grayscale text tones, one blue (plus its hover-darkened variant), and one light-gray structural gray — a genuinely restrained, "quiet" palette that keeps the text-heavy content from feeling busy. That restraint is a legitimate strength for a document-like site.

Its cost: **there is no second color anywhere in the live design**, so nothing on the site is ever color-coded. This is most conspicuous on `core/policies.html`, which contains a naturally binary "Permitted AI Use" / "Restricted AI Use" pair of lists (§3, §4.1 discuss this page's list-styling separately) that would be an obvious, low-risk candidate for a subtle green/amber accent to help a student scanning quickly tell which bucket an activity falls into — the content structure already implies the color coding; the design just doesn't supply it. The same applies to deadline tables (nothing distinguishes an approaching/urgent date from a distant one) and to the grading-scale table (letter grades A–F have no color ramp at all, despite that being one of the most common, well-understood color conventions in any grading UI).

Also worth noting: `--accent` (`#0073aa`) and `--primary` (`#0073a8`) are two colors one hex digit apart, functionally indistinguishable to the eye, defined as separate tokens for what appear to be historical reasons (one came from the link-color measurement, the other from the hero-tint measurement of the original WordPress theme). Since `--primary` is dead code site-wide anyway (see table above), this is low-stakes, but it's a sign the token set was copied wholesale from the source theme rather than re-derived for this site's actual needs.

### 8.4 Spacing, whitespace, and layout

**Horizontal layout is asymmetric and doesn't scale to wide viewports.** The content column is positioned with `margin: 0 0 0 var(--col-left)` where `--col-left: calc(8.33vw + 28px)` on desktop, and capped at `max-width: calc(640px + 4rem)` (≈704px). The practical effect: on a common 1920px-wide desktop monitor, the content column starts ~188px from the left edge and ends ~892px in — meaning **more than half the viewport (roughly 1000px of a 1920px screen) sits permanently empty on the right**, with nothing placed there (no sidebar, no secondary content, no illustration). This was presumably a deliberate "hard-left editorial column" choice in the original WordPress theme (likely designed for a design with a right-side sidebar widget area that this port never carried over), but ported as-is to a plain single-column site, it reads as an unbalanced, dated layout on any modern wide display — most current course/documentation sites either center the content column or fill the extra width with a persistent side element (table of contents, section nav, sidebar). At minimum, the layout should be reconsidered for very wide viewports (e.g., cap `--col-left` growth past ~1400–1600px, or center the column instead of pinning it to a fluid-viewport-relative left offset).

**No sticky navigation.** `.site-header` has no `position: sticky` / `position: fixed`; on any page longer than one screen (the syllabus and policies pages are both very long — 130+ and 118+ lines of dense content respectively), the 6-item nav scrolls away immediately and the only way back to another section is scrolling all the way to the top or using the browser back button. A sticky (or at least sticky-on-scroll-up) header is close to a default expectation on content-heavy sites in 2026.

**Spacing values are not tokenized, unlike color and typography.** `:root` defines custom properties for colors (`--bg`, `--text`, etc.), fonts (`--fh`, `--fb`), and widths (`--mw`, `--mww`, `--col-left`) — but spacing is hardcoded ad hoc throughout the rest of the file with no `--space-*` scale. A survey of every `margin`/`padding` declaration in `css/style.css` turns up: `0.15rem, 0.2rem, 0.25rem, 0.35rem, 0.5rem, 0.6rem, 0.75rem, 0.8rem, 1rem, 1.25rem, 1.4rem, 1.5rem, 2rem, 2.5rem, 3rem, 4rem`, plus several raw pixel values (`32px, 44px, 56px, 66px, 88px`) mixed in for the header specifically. That's sixteen-plus distinct spacing values with no evident scale relationship between them (not a consistent 4px/8px multiplier system) — the site partially adopted a design-token approach and then reverted to ad hoc values for the one property (spacing) that benefits from it the most, since spacing is what a viewer's eye uses to judge whether a layout is "considered" or "accumulated."

**Content-block spacing is reasonably consistent within a page** — headings get `margin-top: 2rem`, paragraphs `margin: 1.5rem 0`, and this rhythm holds steady down every page checked. The inconsistency is between the token system's ambition (colors/fonts/widths are all centralized) and its incomplete execution (spacing isn't), not in the rendered rhythm itself, which mostly looks fine.

### 8.5 Visual hierarchy

- **The homepage hero is the weakest hierarchy moment on the site.** Every page's `<h1>` in `.hero` mirrors its own nav label — `Syllabus`, `Schedule`, `Policies`, and so on — which is a sensible, low-effort pattern for interior pages. But it's applied identically to `index.html`, whose hero `<h1>` is therefore the single word **"Home."** The homepage's biggest, boldest, most visually prominent piece of text on the entire site — set at 49.5px, the largest type anywhere in the design — conveys zero information about the course. The actual course title and description already appear in the header branding strip above it (smaller, at 24.75px) and again in a paragraph below it — meaning the page's visual hierarchy currently emphasizes the least informative word on the site above its most informative sentence. This is worth fixing specifically: give the homepage a distinct hero treatment (the course title/tagline, or a one-line pitch) rather than reusing the generic per-page pattern.
- **No visual variety in content presentation.** Every page in the site is built from exactly three content primitives: paragraphs, `<table>`, and `<ul>`/`<ol>` lists. There is not a single `<blockquote>`, `<pre>` code block, image, figure, or callout box rendered anywhere on the site — despite `css/style.css` containing fully built-out styles for blockquotes (accent-colored left border), code blocks (background, padding, horizontal scroll), and a placeholder/notice callout box (dashed border, tinted background) that are simply never invoked by any page's HTML (cross-referenced with the dead-CSS finding in §4.2 of this report). For a course that will have students working in terminals and editing config files from week one, the total absence of even one styled code sample or terminal screenshot on the site itself is a missed opportunity to establish visual identity and to model the aesthetic students will be working in.
- **Inconsistent list styling directly undermines hierarchy on the page where it matters most.** The custom `.item-list` treatment (removes the default bullet marker, adds a subtle divider line between items) is applied to list content on `index.html`, `core/schedule.html` (5 of 5 content lists), and `core/syllabus.html` (3 of 3 lists that aren't already `<table>`s) — but is **applied to zero of the six content `<ul>` elements on `core/policies.html`**, and to neither of the two content lists on `core/about.html`. A visitor navigating Syllabus → Policies — arguably the two pages most likely to be read back-to-back, since the syllabus explicitly tells students to see Policies for details — will see the site's visual language for "list of related items" change from a clean, divider-separated custom style to plain browser-default bullets, on the page that has the *most* lists (six) of any page on the site. This reads as an oversight rather than an intentional design difference (there's no content reason policy lists should look different from syllabus lists), and it's the single most visible layout-consistency defect in the site — visible in the rendered page, not just in the code.
- **`.section` wrapper div is applied inconsistently with no visible effect most places it's missing.** `class="section"` (which only adds `margin-bottom: 2.5rem`) wraps content on `index.html` and `core/schedule.html`, but not on `core/syllabus.html`, `core/policies.html`, `core/about.html`, or `core/assignments.html`, even though all of those pages are equally structured as a sequence of `<h2>`-delimited blocks. Low visual impact today (the default heading `margin-top: 2rem` already does most of the spacing work), but it's another sign of an authoring convention applied to 2 of 6 core pages rather than systematically.

### 8.6 Responsive behavior

The two breakpoints (1024px, 768px) are sensibly chosen and the mobile adjustments (font-size 22px→18px, hero 49.5px→34px, nav/tagline 24.75px→20px, `--col-left` collapsing to a flat `1rem`) are proportionate and coherent — nothing breaks or looks obviously unfinished at the widths checked in the CSS. Two gaps:

- **Nothing was verified past 320px or on real devices this session** (no live rendering available) — the CSS reads as sound, but a physical-device pass (especially checking the `.main-nav` 6-item flex-wrap behavior on very narrow phones, and whether wrapped nav items still look intentional rather than accidental) would be worth doing before considering mobile "done."
- **No `prefers-color-scheme: dark` support at all.** The background and text colors are hardcoded (`--bg: #fff`, `--text: #111`) with no dark-mode branch. This is increasingly a baseline expectation rather than a nice-to-have; a system-dark-mode user gets a plain, unstyled-feeling bright-white page with no adaptation.

### 8.7 Comparison to modern course-website conventions

Set against what a 2026 course site commonly does — a landing hero that states the course value proposition, a sticky or otherwise persistent way to jump between sections, at least one piece of visual identity beyond plain text (a diagram, a code sample, a colored status/deadline indicator), a centered or width-aware layout that doesn't waste half of a wide monitor, and color used semantically rather than decoratively — this site is closer to a **2019-era WordPress editorial blog** than to a modern course site, which is unsurprising given it's a direct, unmodified visual port of one. It is clean, readable, internally consistent in its typography, and free of the visual clutter and cookie-banner/tracker bloat that afflicts a lot of "modern" sites — that restraint is a real asset worth preserving. But it currently signals "blog" rather than "hands-on software engineering course," under-uses the one accent color it has, wastes significant horizontal space on wide displays, and has one clear, fixable rendered inconsistency (policies-page list styling) that a first-time visitor would notice within seconds of navigating the site.

---

## 9. Visual Design & Interactivity Critique

**Relationship to §8:** §8 ("Visual Design Critique") already covers typography, color, spacing/layout, and hierarchy in depth from a static-code read of `css/style.css`. This section does not re-derive that analysis — §9.1 gives a condensed recap plus two points not previously raised, and §9.2 (the bulk of this section) covers new ground: **interactivity**. The site currently ships **zero `<script>` tags anywhere** (confirmed by a sitewide grep) — every page is 100% static markup and CSS. That's a legitimate, deliberate baseline worth keeping largely intact, but it also means every interactive affordance a visitor might expect (smooth in-page jumps, a nav that knows where it is, a mobile menu, feedback on focus/hover beyond a color swap) is either missing or hand-authored per page rather than behavior-driven. §9.2 identifies where a small amount of vanilla JS — no framework, no build step, no dependency — would remove real friction without compromising the site's "ships as plain static files" design goal.

### 9.1 Visual design — condensed recap, plus two new findings

Quick-reference summary of §8's findings (see §8 for full detail and evidence): the design is an unmodified port of WordPress's "Twenty Nineteen" editorial theme (large serif body text, hard-left column, understated blue accent), which reads as a humanities blog rather than a technical AI-SWE course; the homepage hero says only "Home"; `core/policies.html`'s bulleted lists render with plain default bullets while every other page's lists use the site's custom divider style; the content column wastes roughly half of any wide desktop monitor; the one accent color is never used semantically (e.g., no color distinction between "Permitted" and "Restricted" AI use); and there is no sticky nav, no dark-mode support, and no hover/focus transition anywhere in the stylesheet.

Two points not previously raised in §8:

- **No print stylesheet.** `core/syllabus.html` and `core/policies.html` are both long, dense, reference documents a student plausibly wants to print or save as a clean PDF — but there is no `@media print` block anywhere in `css/style.css`. Printing either page today prints the full nav, the hero decorative rule, and the breadcrumb trail on every page, and link text prints with no indication of its target URL (a normal browser default that a print stylesheet can improve on by appending `attr(href)` after external links).
- **No visual indicator that a link leaves the site.** Once Task H4/M-level "hyperlink everything" recommendations from the companion tech-spec are implemented, the site will for the first time have external links (to GitHub, Moodle, account signup pages, etc.) sitting inline with internal navigation links, both styled identically. A small distinguishing treatment (e.g., a subtle `↗` suffix via CSS `content` on `a[href^="http"]:not([href*="theailab-net"])::after`) is a common, cheap convention that tells a visitor before they click whether they're about to leave the site.

### 9.2 Interactivity — where the site is static and what a no-framework fix looks like

Every item below is achievable in vanilla CSS and/or a small `<script>` block or one small `.js` file linked with a plain `<script src="...">` tag — no npm, no bundler, no framework, consistent with the project's existing "no build step" design goal and this task's explicit constraint.

#### a) Active nav highlighting is static and duplicated 22 times — a JS-driven version would eliminate the fragility entirely

**Current state:** each page hardcodes which nav `<a>` gets `class="active"` by hand. This is exactly the duplication risk already flagged in the companion tech-spec (Tasks M2/M5) — a nav-label rename or a misplaced `class="active"` on the wrong page is a silent, easy-to-miss authoring error, and it's precisely the failure mode `tests/test_integration_links.py::TestNavConsistency` exists to catch.

**Why this is an interactivity opportunity, not just a maintainability one:** rather than hand-marking the active link per page (or generating it via a build step per the tech-spec's Option B), a ~10-line vanilla script included identically on every page can compute the active link at runtime by comparing the current URL to each nav link's `href` — removing the per-page authoring step entirely while working identically on every page with zero templating.

**Implementation sketch** (add as `assets/nav.js`, one `<script defer src="../assets/nav.js"></script>` before `</head>` or `</body>` on every page, adjusting `../` depth like the existing CSS link):
```js
document.querySelectorAll('.main-nav a').forEach(link => {
  if (link.pathname === window.location.pathname) {
    link.classList.add('active');
    link.setAttribute('aria-current', 'page');
  }
});
```
This also directly satisfies the `aria-current` accessibility recommendation from the code-review report (§3) as a side effect, from one shared file instead of 22 hand-edited pages. Because `<noscript>` visitors would simply see no active-state highlight (a cosmetic-only degradation, not a broken nav — all `href`s remain plain working links regardless), this is safe to adopt without a fallback.

#### b) No smooth scroll, and no in-page anchors to scroll to yet

**Current state:** zero `scroll-behavior` declarations anywhere in `css/style.css`, and zero heading `id` attributes anywhere in any of the 22 pages — there are currently no in-page anchor links on the site at all (every link is a full page navigation). This will become directly relevant the moment the companion tech-spec's `id="course-description"`-style anchors (Task M1) are added.

**Recommendation:** add sitewide, once anchors exist:
```css
html {
  scroll-behavior: smooth;
}
h2, h3 { scroll-margin-top: 5.5rem; } /* keeps a heading clear of the sticky header, if adopted per Task M7 */
```
Zero JS required for the smooth-scroll effect itself (native CSS handles it); `scroll-margin-top` matters specifically if the sticky-header recommendation elsewhere is adopted, so an anchor jump doesn't land a heading directly underneath the pinned nav.

#### c) The two longest pages have no in-page navigation, and are strong candidates for a lightweight "On this page" jump list — not for hiding content behind collapsed sections

**Current state:** `core/syllabus.html` (13 `<h2>` sections) and `core/policies.html` (7 major sections, several with their own `<h3>` subsections covering Title IX, accessibility, academic honesty, etc.) are both long single-scroll documents with no way to jump directly to a subsection. Neither page has a single heading `id`, so there's nothing to link to yet.

**A specific, previously-unflagged duplication that reinforces this:** the "Summary of Assignments and Weights" table is **byte-for-byte identical** between `core/syllabus.html` and `core/assignments.html` (verified via direct text diff) — the same nine-row table, copy-pasted in full on two pages, in addition to the `about.html`/`syllabus.html` duplication already flagged in §2.5 of this report. This is exactly the kind of redundancy an in-page/cross-page linking pattern (rather than a second copy-pasted table) would resolve.

**Recommendation — a jump list, not an accordion:** for policy and syllabus content specifically, **avoid `<details>`/`<summary>` collapsed-by-default sections** — this is required-reading, compliance-relevant content (Title IX, academic honesty, late-work policy), and hiding it behind a closed disclosure risks a student never expanding it. Instead, add a short anchor list at the top of each long page:
```html
<nav class="page-toc" aria-label="On this page">
  <p>On this page:</p>
  <ul>
    <li><a href="#generative-ai-use-policy">Generative AI Use Policy</a></li>
    <li><a href="#late-missing-work-policy">Late/Missing Work Policy</a></li>
    <!-- ...one entry per h2, ids added per Task M2/M1 of the tech-spec -->
  </ul>
</nav>
```
This requires no JS at all — just the heading `id`s (already recommended in the tech-spec for other reasons) plus this one small block per long page, styled with the existing `.item-list`/`.breadcrumbs` visual language so it doesn't need new CSS patterns.

**Where `<details>`/`<summary>` genuinely is a good fit:** the duplicated assignments table identified above. Rather than showing the full 9-row grading table twice, `core/assignments.html` could show a one-line summary with a native, no-JS disclosure for the full breakdown:
```html
<details>
  <summary>Full weighting breakdown (also on the Syllabus page)</summary>
  <table>...</table>
</details>
```
`<details>`/`<summary>` needs no JavaScript and no styling to function — it's a native HTML5 disclosure widget — so this is a zero-script, zero-framework way to reduce the duplication while keeping both pages self-contained.

#### d) No mobile navigation disclosure — six items rely on flexbox wrap alone

**Current state:** `.main-nav ul` is a `flex-wrap: wrap` row of 6 links with no collapse/hamburger behavior at any breakpoint (per §8.6, this was flagged as untested on real narrow devices but structurally present). On very narrow phones, 6 bold 20px nav labels wrapping onto two or three lines under the site title is functional but visually heavier than a typical collapsed mobile menu.

**Recommendation — a `<details>`-based menu needs no JS at all:**
```html
<details class="mobile-nav-toggle">
  <summary>Menu</summary>
  <nav class="main-nav"><!-- existing nav markup, unchanged --></nav>
</details>
```
```css
@media (min-width: 769px) {
  .mobile-nav-toggle summary { display: none; }
  .mobile-nav-toggle[open] > nav,
  .mobile-nav-toggle > nav { display: block; } /* always visible on desktop */
}
@media (max-width: 768px) {
  .mobile-nav-toggle > nav { display: none; }
  .mobile-nav-toggle[open] > nav { display: block; }
}
```
This is the same native-disclosure trick as §9.2(c) — a functioning collapsible mobile menu with no JavaScript whatsoever. (A JS-based version with a `<button>` and a toggled class is the more conventional pattern if finer control over animation is wanted later, but isn't necessary to solve this specific gap.)

#### e) Hover/focus feedback exists only on links — dense tables and lists give no scanning assistance

**Current state:** `a:hover` and `.main-nav li a:hover` are the only interactive-state rules in the entire stylesheet (per §8.2). Nothing highlights on hover in the site's tables (grading scale, schedule, required-accounts) or in `.item-list` items, even though several of these — the grading-weight table, the multi-row schedule week-lists — are exactly the kind of dense, scannable content that benefits from a row/item highlight as the eye or cursor moves down the page.

**Recommendation:**
```css
.page-content table tr:hover td { background: var(--code-bg); }
.item-list li:hover { background: var(--code-bg); }
```
Pure CSS, no JS, and reuses an existing token (`--code-bg`) rather than introducing a new color.

#### f) No subtle motion anywhere — instant, un-eased state changes throughout

**Current state:** covered from a typography angle in §8.2 (link-hover color snaps instantly); restating here specifically as an interactivity gap: this is the **only** kind of state change on the entire site (no other component changes state at all today), and it has zero easing.

**Recommendation** (same fix proposed in §8.2/the tech-spec, restated here for completeness since this section's brief specifically asked about "subtle transitions"):
```css
a { transition: color 0.15s ease; }
.main-nav li a { transition: color 0.15s ease; }
```
If the sticky-header recommendation from §8.4 is adopted, a companion motion touch is a shadow that fades in only once the page has scrolled, which does require a few lines of vanilla JS (this is the one recommendation in this section that can't be done in pure CSS, since CSS alone can't detect scroll position for this purpose without `@scroll-timeline`/`animation-timeline: scroll()`, which isn't yet universally supported):
```js
addEventListener('scroll', () => {
  document.querySelector('.site-header')
    .classList.toggle('is-scrolled', window.scrollY > 8);
}, { passive: true });
```
```css
.site-header { transition: box-shadow 0.2s ease; }
.site-header.is-scrolled { box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
```

#### g) No "back to top" affordance on long pages

**Current state:** `core/syllabus.html` and `core/policies.html` have no way to return to the top except scrolling manually or using the browser's own "scroll to top" gesture. The week-page prev/next pattern (`&larr; Back to Schedule`) shows the site already has a convention for lightweight in-content navigation aids — this is a natural extension of that same convention to the site's two longest pages.

**Recommendation:** a plain anchor, no JS needed if `html { scroll-behavior: smooth }` (§9.2b) is adopted:
```html
<p class="back-to-top"><a href="#top">&uarr; Back to top</a></p>
```
(requires adding `id="top"` to the `<body>` or outermost header element on the two long pages — a one-line addition).

### 9.3 Interactivity budget

Every recommendation above totals roughly **20–30 lines of vanilla JavaScript across one small shared file** (`assets/nav.js`, plus the optional scroll-shadow listener) and a modest, additive set of CSS rules — no `package.json`, no bundler, no build step, and no change to the site's fundamental delivery model as 22 plain static HTML files. Three of the seven recommendations above (§9.2b smooth scroll, §9.2c/d `<details>`-based disclosures, §9.2e hover states) require **no JavaScript at all**, only native HTML5 elements and CSS already in the same style as the rest of the stylesheet — worth prioritizing those first if the goal is maximum interactivity gain for minimum added surface area.

---

*This report covers code and structure only; it does not evaluate the pedagogical content of the syllabus, schedule, or assignments beyond verifying internal consistency (dates, arithmetic, cross-page duplication).*
