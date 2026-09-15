# MP1 Web Redesign Report

**Student:** Maximo Llamas Castellanos
**Date:** September 10, 2026
**Course:** IPHS 400, Frontiers in AI

For this project I redesigned the website for my IPHS 400 class. I used Claude Code because it could actually make the changes for me while I told it what I wanted and gave feedback on what I liked or didn't like.

## Part A: What Improvements I Made

The website looked outdated and pretty generic before, so most of my work went into modernizing the whole visual style. I gave it a new color scheme, better fonts, and a redesigned header that actually feels intentional instead of like a default template. The homepage used to just say "Home" at the top and gave zero information about the class, so I fixed that too, it now actually introduces the course.

Beyond just looks, I made the site more interactive. Things respond when you scroll or hover instead of just sitting there as a static page, the navigation menu adjusts itself as you move through the site, and there's a progress bar and a back to top button for longer pages.

The improvement I'm most proud of is that the site now pulls in real, live information instead of everything being hardcoded. The Schedule page automatically highlights whatever week of the semester it currently is, and the Assignments page automatically shows whatever deadline is coming up next, both based on the actual dates for the class. That means the site stays accurate on its own as the semester moves forward, I don't have to go update it by hand.

I also cleaned up how the site is hosted and published, removing some automatic publishing setup it didn't need anymore, and I went through several rounds of catching and fixing bugs and visual glitches until everything actually looked and worked right.

## Part B: What Resources I Used, and What I'd Add Next

I used Claude Code as my main tool for actually building this, since it could edit the real files directly and run tests to check its own work instead of me having to translate suggestions into changes myself. A lot of my prompts were pretty direct, things like "critique the site's visual design and tell me what's wrong with it," or later "make it more interactive and less generic looking." At one point I specifically told it to look at apple.com as a reference for what a clean, well designed, interactive site feels like, since I liked how their navigation bar behaves when you scroll, and I wanted something similar here.

For fonts I pulled from Google Fonts and picked one called Fraunces for headings, since the site's default font felt flat and I wanted something with more character. I used GitHub to host the project and share it, and I relied on the pytest checks that were already built into the repo to make sure I wasn't breaking anything every time I made a change.

If I kept working on this, here's what I'd want to add next:

- Make the site easier to use for people with disabilities
- Add a dark mode option
- Fix the mobile menu so it looks better on phones
- Add more automatic features, like a countdown to the next quiz
