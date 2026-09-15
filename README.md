# IPHS 400: Frontiers in AI

**Kenyon College — Integrated Program for Humane Studies (IPHS) — Fall 2026**

Course website for IPHS 400, a hands-on study of AI software engineering (AI-SWE):
configuring, extending, and orchestrating AI coding agents through a professional
software development lifecycle. This repository contains the site's source and
its test suite; course submissions, quizzes, and grades are handled separately
on Moodle.

- **Instructor:** Jon Chun
- **Schedule:** Tu/Th, 2:40–4:00 PM · Timberlake #5 (Evans Conference Room)
- **Live site:** https://maxillamas06-arch.github.io/theailab-net/

## Repository Structure

```
.
├── index.html              # Home page
├── 404.html                 # Not-found page
├── core/                    # Syllabus, schedule, assignments, policies, about
│   ├── syllabus.html
│   ├── schedule.html
│   ├── assignments.html
│   ├── policies.html
│   └── about.html
├── weeks/                   # One page per week, week-01.html … week-15.html
├── css/
│   └── style.css            # Single shared stylesheet, no build step
├── assets/
│   └── site.js              # Shared vanilla-JS interactivity (no framework, no build step)
├── docs/                    # Design/code review, tech spec, and MP1 project report
├── tests/                   # pytest suite validating the site
│   ├── conftest.py
│   ├── test_unit_html_structure.py
│   ├── test_integration_links.py
│   ├── test_e2e_site.py
│   └── requirements.txt
```

The site is static HTML/CSS with no build step or JS framework. Every page
shares one stylesheet and a common header/nav/hero/footer skeleton.

## Local Development

Serve the site locally with Python's built-in HTTP server:

```bash
python3 -m http.server 8080
# then open http://localhost:8080/
```

No install step is required to view the site — only the test suite has
dependencies.

## Running the Tests

The test suite (pytest + BeautifulSoup/lxml) validates structural and content
integrity of every page:

- `test_unit_html_structure.py` — every page has a DOCTYPE, title, stylesheet
  link, header, footer, and hero `<h1>`; no leftover template branding; no
  placeholder or stub content
- `test_integration_links.py` — every internal link resolves; navigation is
  identical across all pages; the schedule links to all 15 week pages
- `test_e2e_site.py` — required files/directories exist; exact page count;
  every page is reachable from `index.html` (no orphaned pages)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r tests/requirements.txt
pytest tests/ -v
```

Run a single test file or test:

```bash
pytest tests/test_unit_html_structure.py -v
pytest tests/test_integration_links.py::TestNavConsistency::test_nav_links_resolve -v
```

## Content Source and Provenance

All course content (syllabus text, schedule, assignments, policies) is
sourced from the official Fall 2026 syllabus. The page layout, navigation
pattern, and stylesheet are adapted from a prior Kenyon course site
([`programminghumanity-org`](https://github.com/jon-chun)) for visual
consistency across Jon Chun's Kenyon course sites; no course content from
that site is reused here.

## Generative AI Use Statement

This mini-project (MP1) was completed with substantial use of Claude Code
(Anthropic), an AI coding agent, per the course's Generative AI Use Policy
(see `core/policies.html`).

- **What AI was used for:** reviewing the original site for bugs, accessibility
  gaps, and design issues; implementing the visual redesign (typography, color
  palette, layout) and the vanilla-JS interactivity in `assets/site.js`;
  debugging several rounds of visual glitches; and drafting the review/spec
  documents in `docs/`.
- **What I directed and decided:** the overall design direction (a modern,
  less template-looking aesthetic, using apple.com as a reference for the
  scroll-reactive navigation specifically), which features to add (including
  the current-week and next-deadline widgets driven by the site's real dates),
  and every round of feedback and bug reports that shaped the final result.
- **Full project report:** see `docs/iphs400_mp1-web-redesign_report_maximo-llamas-castellanos_20260910.md`
  for a complete account of the improvements made, the resources used, and
  future work.

## License

See [LICENSE](LICENSE).
