/* =============================================================
   EDIT EVERYTHING HERE
   -------------------------------------------------------------
   Use this file for routine homepage content changes. Keep the static
   fallback in index.html in sync when public copy or links change.
   ============================================================= */

const SITE = {
  // ---- Hero / Introduction ---------------------------------
  name: "Hanumant",
  fullName: "Hanumant Kulkarni",
  role: "Interaction Designer",

  // Each string is one paragraph in the intro.
  intro: [
    "I design interactions that make digital experiences feel intuitive, clear, and engaging.",
    "I currently study Interaction Design at IIT&nbsp;Bombay.",
  ],

  // ---- Hero links (shown under the intro) ------------------
  // Rendered in two columns: `col: 1` on the left, `col: 2` on the right.
  // `icon` picks a built-in glyph: linkedin | behance | resume | arrow.
  // `accent: true` uses the cobalt accent + underline; otherwise plain text.
  heroLinks: [
    { label: "LinkedIn", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/", icon: "linkedin", col: 1, accent: true },
    { label: "Behance",  href: "https://www.behance.net/hanumankulkarn1",                   icon: "behance",  col: 1, accent: true },
    { label: "Resume",   href: "resume.html",                                                icon: "resume",   col: 2, accent: true },
    { label: "About me", href: "#about",                                                     icon: "arrow",    col: 2, accent: false },
  ],

  // ---- Homepage section labels -----------------------------
  indexLabel: "Index",
  category: "Projects",
  workCategory: "Work Experience",

  // ---- About me --------------------------------------------
  // `lead` sits in the left grid column, `paragraphs` in the right.
  about: {
    label: "About me",
    lead: [
      "I am Hanumant Kulkarni.",
      "I am from Chhatrapati Sambhajinagar.",
    ],
    paragraphs: [
      "I have always been curious about how things are made. As a kid I would take my toys apart to see what was inside, and cars fascinated me the most, so after school I did a diploma in automobile engineering. Somewhere in those years, that curiosity moved towards how people interact with these products, and whether they make sense to the person using them. That led me to design, and to the Industrial Design Centre at IIT&nbsp;Bombay.",
      "At IDC I have worked as a designer with DevCom, the institute’s developer community, on products students use every day, like Reach and the Insti app. Alongside, I have designed an app for a healthcare startup and interned in graphic design at Recoup Health. Before joining college, I also worked as an analyst at Mphasis. That was my first time in a corporate setup, and I learned a lot there about how things actually get done.",
      "Outside of all this, I am really into watches and Hotwheels, and I like to play chess.",
    ],
  },

  // ---- Footer ----------------------------------------------
  footer: {
    // Centered social links. Leave the array empty ([]) to hide them,
    // or edit the href/label to your real profiles.
    links: [
      { label: "LinkedIn", href: "https://www.linkedin.com/in/hanumant-kulkarni-b0b96631a/" },
      { label: "Behance", href: "https://www.behance.net/hanumankulkarn1" },
    ],
    // The giant faint wordmark at the very bottom. Keep it short (one word
    // reads best); it renders as a soft watermark behind the links.
    mark: "Hanumant",
  },
};

/* =============================================================
   PROJECTS
   -------------------------------------------------------------
   title     – project name
   category  – short descriptor / discipline / tool
   link      – URL, or "#" for now
   image     – optional path to a thumbnail (e.g. "images/one.jpg").
               Leave it out to use a generated placeholder.
   number    – optional display index; falls back to its array position
   ============================================================= */

const PROJECTS = [
  {
    number: "01",
    title: "AI Clinical Scribe",
    category: "Interaction Design",
    link: "onetheracure.html",
    image: "assets/images/case-studies/ai-clinical-documentation/cover.jpg",
  },
  {
    number: "02",
    title: "Insti App Redesign",
    category: "Interaction Design",
    link: "insti-app.html",
    image: "assets/images/case-studies/insti-app/cover.jpg",
  },
];

/* =============================================================
   WORK EXPERIENCE
   -------------------------------------------------------------
   Uses the same card system as projects while keeping its own
   numbering and homepage section.
   ============================================================= */

const WORK_EXPERIENCE = [
  {
    number: "01",
    title: "Recoup Health",
    category: "Graphic Design",
    link: "recoup-health.html",
    image: "assets/images/case-studies/recoup-health/cover.jpg",
    imageAlt: "Recoup Health graphic design work cover",
  },
];
