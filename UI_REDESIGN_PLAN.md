CAREER LEVER AI - COMPLETE CSS + 20 REDESIGN IMPROVEMENTS + PERPLEXITY INTEGRATION
Date: November 1, 2025
Status: Production-Ready UI/UX Overhaul
Scope: Full CSS system + Enhanced design plan based on live site audit

PART 1: YOUR EXACT CURRENT CSS
All CSS EXCEPT resume preview and email outputs.

css
/* ============================================
   GLOBAL STYLES & VARIABLES
   ============================================ */

:root {
  /* Typography */
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  --font-mono: 'JetBrains Mono', 'Fira Code', monospace;
  
  /* Light Mode Colors */
  --bg-primary: #ffffff;
  --bg-secondary: #f8f9fa;
  --bg-tertiary: #f1f3f5;
  --text-primary: #1a1d1f;
  --text-secondary: #626569;
  --text-tertiary: #8a8d91;
  --border-light: #d9dce1;
  --border-normal: #ccd0d5;
  --accent-blue: #0066cc;
  --accent-blue-hover: #0052a3;
  --accent-success: #22c55e;
  --accent-warning: #f59e0b;
  --accent-error: #ef4444;
  
  /* Dark Mode Colors */
  --dark-bg-primary: #1a1d1f;
  --dark-bg-secondary: #242628;
  --dark-bg-tertiary: #2d3032;
  --dark-text-primary: #f5f6f7;
  --dark-text-secondary: #c9cace;
  --dark-text-tertiary: #9ca3a8;
  --dark-border: #3d4245;
  
  /* Spacing */
  --space-xs: 0.25rem;   /* 4px */
  --space-sm: 0.5rem;    /* 8px */
  --space-md: 1rem;      /* 16px */
  --space-lg: 1.5rem;    /* 24px */
  --space-xl: 2rem;      /* 32px */
  --space-2xl: 3rem;     /* 48px */
  --space-3xl: 4rem;     /* 64px */
  
  /* Border Radius */
  --radius-sm: 0.375rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
  --radius-full: 9999px;
  
  /* Shadows */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* Transitions */
  --transition-fast: 150ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-base: 250ms cubic-bezier(0.4, 0, 0.2, 1);
  --transition-slow: 400ms cubic-bezier(0.4, 0, 0.2, 1);
}

.dark {
  --bg-primary: var(--dark-bg-primary);
  --bg-secondary: var(--dark-bg-secondary);
  --bg-tertiary: var(--dark-bg-tertiary);
  --text-primary: var(--dark-text-primary);
  --text-secondary: var(--dark-text-secondary);
  --text-tertiary: var(--dark-text-tertiary);
  --border-light: var(--dark-border);
  --border-normal: var(--dark-border);
}

/* ============================================
   BASE ELEMENT STYLES
   ============================================ */

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html {
  scroll-behavior: smooth;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

body {
  font-family: var(--font-sans);
  font-size: 1rem;
  line-height: 1.5;
  color: var(--text-primary);
  background-color: var(--bg-secondary);
  transition: background-color var(--transition-base), color var(--transition-base);
}

h1, h2, h3, h4, h5, h6 {
  font-weight: 600;
  line-height: 1.25;
  margin: 0;
}

h1 {
  font-size: 2.5rem;
}

h2 {
  font-size: 2rem;
}

h3 {
  font-size: 1.5rem;
}

h4 {
  font-size: 1.25rem;
}

h5 {
  font-size: 1.125rem;
}

h6 {
  font-size: 1rem;
}

p {
  margin: 0;
}

a {
  color: var(--accent-blue);
  text-decoration: none;
  transition: color var(--transition-fast);
}

a:hover {
  color: var(--accent-blue-hover);
  text-decoration: underline;
}

/* ============================================
   LAYOUT COMPONENTS
   ============================================ */

/* Sidebar Navigation */
nav {
  display: flex;
  flex-direction: column;
  width: 250px;
  background-color: var(--bg-primary);
  border-right: 1px solid var(--border-light);
  box-shadow: var(--shadow-sm);
  position: sticky;
  top: 0;
  height: 100vh;
  overflow-y: auto;
}

@media (max-width: 768px) {
  nav {
    display: none;
    position: absolute;
    width: 100%;
    height: auto;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
    z-index: 50;
  }

  nav.active {
    display: flex;
  }
}

nav ul {
  list-style: none;
  flex: 1;
}

nav li {
  border-bottom: 1px solid var(--border-light);
}

nav a {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md);
  color: var(--text-secondary);
  font-weight: 500;
  transition: background-color var(--transition-fast), color var(--transition-fast);
}

nav a:hover {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  text-decoration: none;
}

nav a.active {
  background-color: var(--accent-blue);
  color: #ffffff;
  border-left: 4px solid var(--accent-blue);
  padding-left: calc(var(--space-md) - 4px);
}

/* Main Container */
main {
  display: flex;
  flex: 1;
  margin-left: 250px;
  background-color: var(--bg-secondary);
}

@media (max-width: 768px) {
  main {
    margin-left: 0;
    flex-direction: column;
  }
}

/* ============================================
   PAGE HEADER STYLES
   ============================================ */

.page-header {
  padding: var(--space-xl);
  background-color: var(--bg-primary);
  border-bottom: 1px solid var(--border-light);
  margin-bottom: var(--space-xl);
}

.page-header h1 {
  margin-bottom: var(--space-sm);
}

.page-header p {
  color: var(--text-secondary);
  font-size: 0.95rem;
}

@media (max-width: 768px) {
  .page-header {
    padding: var(--space-lg);
    margin-bottom: var(--space-lg);
  }
}

/* ============================================
   FORM STYLES
   ============================================ */

form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  padding: var(--space-xl);
  background-color: var(--bg-primary);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-sm);
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
}

.form-group label {
  font-weight: 500;
  color: var(--text-primary);
  font-size: 0.95rem;
}

input[type="text"],
input[type="email"],
input[type="password"],
input[type="number"],
textarea,
select {
  padding: var(--space-md);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 1rem;
  color: var(--text-primary);
  background-color: var(--bg-primary);
  transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
  outline: none;
}

input[type="text"]:focus,
input[type="email"]:focus,
input[type="password"]:focus,
input[type="number"]:focus,
textarea:focus,
select:focus {
  border-color: var(--accent-blue);
  box-shadow: 0 0 0 3px rgba(0, 102, 204, 0.1);
}

textarea {
  resize: vertical;
  min-height: 120px;
  padding: var(--space-md);
}

@media (max-width: 768px) {
  input[type="text"],
  input[type="email"],
  input[type="password"],
  input[type="number"],
  textarea,
  select {
    font-size: 16px;
    padding: var(--space-lg);
  }
}

/* ============================================
   BUTTON STYLES
   ============================================ */

button,
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  padding: var(--space-md) var(--space-lg);
  border: none;
  border-radius: var(--radius-md);
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  cursor: pointer;
  transition: all var(--transition-fast);
  outline: none;
}

.btn-primary {
  background-color: var(--accent-blue);
  color: #ffffff;
}

.btn-primary:hover {
  background-color: var(--accent-blue-hover);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-primary:active {
  transform: translateY(0);
  box-shadow: var(--shadow-sm);
}

.btn-secondary {
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  border: 1px solid var(--border-light);
}

.btn-secondary:hover {
  background-color: var(--border-light);
  transform: translateY(-2px);
}

.btn-success {
  background-color: var(--accent-success);
  color: #ffffff;
}

.btn-success:hover {
  background-color: #16a34a;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn-danger {
  background-color: var(--accent-error);
  color: #ffffff;
}

.btn-danger:hover {
  background-color: #dc2626;
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

/* ============================================
   CARD STYLES
   ============================================ */

.card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-sm);
  transition: box-shadow var(--transition-fast), transform var(--transition-fast);
}

.card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-lg);
  border-bottom: 1px solid var(--border-light);
  padding-bottom: var(--space-lg);
}

.card-body {
  margin-bottom: var(--space-lg);
}

.card-footer {
  display: flex;
  gap: var(--space-md);
  padding-top: var(--space-lg);
  border-top: 1px solid var(--border-light);
}

/* ============================================
   GRID LAYOUT
   ============================================ */

.grid {
  display: grid;
  gap: var(--space-lg);
}

.grid-cols-1 {
  grid-template-columns: 1fr;
}

.grid-cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.grid-cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.grid-cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 1200px) {
  .grid-cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}

/* ============================================
   JOB CARD COMPONENT
   ============================================ */

.job-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
  transition: all var(--transition-fast);
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.job-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-4px);
  border-color: var(--accent-blue);
}

.job-card__header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: var(--space-md);
}

.job-card__logo {
  width: 48px;
  height: 48px;
  border-radius: var(--radius-md);
  object-fit: cover;
  background-color: var(--bg-tertiary);
}

.job-card__title {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: var(--space-xs);
}

.job-card__company {
  display: flex;
  gap: var(--space-md);
  flex: 1;
}

.job-card__meta {
  display: flex;
  gap: var(--space-lg);
  font-size: 0.9rem;
  color: var(--text-secondary);
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.meta-item--highlight {
  color: var(--accent-success);
  font-weight: 600;
}

.job-card__tags {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}

.tag {
  display: inline-block;
  background-color: var(--bg-tertiary);
  color: var(--text-primary);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-full);
  font-size: 0.85rem;
  font-weight: 500;
}

.job-card__actions {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-md);
}

@media (max-width: 768px) {
  .job-card {
    padding: var(--space-md);
  }

  .job-card__actions {
    flex-direction: column;
  }

  .job-card__actions button {
    width: 100%;
  }
}

/* ============================================
   BADGE STYLES
   ============================================ */

.badge {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-full);
  font-size: 0.8rem;
  font-weight: 600;
  white-space: nowrap;
}

.badge--success {
  background-color: rgba(34, 197, 94, 0.1);
  color: var(--accent-success);
}

.badge--warning {
  background-color: rgba(245, 158, 11, 0.1);
  color: var(--accent-warning);
}

.badge--error {
  background-color: rgba(239, 68, 68, 0.1);
  color: var(--accent-error);
}

.badge--info {
  background-color: rgba(0, 102, 204, 0.1);
  color: var(--accent-blue);
}

/* ============================================
   STAT CARD STYLES
   ============================================ */

.stat-card {
  background-color: var(--bg-primary);
  border: 1px solid var(--border-light);
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  box-shadow: var(--shadow-sm);
}

.stat-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
}

.stat-card__label {
  font-size: 0.9rem;
  color: var(--text-secondary);
  font-weight: 500;
}

.stat-card__icon {
  width: 24px;
  height: 24px;
  color: var(--accent-blue);
}

.stat-card__value {
  font-size: 2rem;
  font-weight: 700;
  color: var(--text-primary);
  margin-bottom: var(--space-sm);
}

.stat-card__change {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  font-size: 0.9rem;
  font-weight: 500;
}

.stat-card__change--positive {
  color: var(--accent-success);
}

.stat-card__change--negative {
  color: var(--accent-error);
}

/* ============================================
   SEARCH BAR STYLES (Glassmorphism)
   ============================================ */

.search-container {
  padding: var(--space-xl);
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
}

.search-bar {
  display: flex;
  align-items: center;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(0, 0, 0, 0.05);
  border-radius: var(--radius-lg);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.08);
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
}

.dark .search-bar {
  background: rgba(26, 29, 31, 0.95);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.search-bar input {
  flex: 1;
  border: none;
  background: transparent;
  color: var(--text-primary);
  font-size: 1rem;
}

.search-bar input::placeholder {
  color: var(--text-tertiary);
}

.search-bar button {
  padding: var(--space-md) var(--space-lg);
  background-color: var(--accent-blue);
  color: #ffffff;
  border: none;
  border-radius: var(--radius-md);
  font-weight: 600;
  cursor: pointer;
  transition: all var(--transition-fast);
}

.search-bar button:hover {
  background-color: var(--accent-blue-hover);
  transform: translateY(-2px);
}

@media (max-width: 768px) {
  .search-bar {
    flex-direction: column;
  }

  .search-bar button {
    width: 100%;
  }
}

/* ============================================
   LOADING & SKELETON STYLES
   ============================================ */

@keyframes shimmer {
  0% {
    background-position: -1000px 0;
  }
  100% {
    background-position: 1000px 0;
  }
}

.skeleton {
  background: linear-gradient(
    90deg,
    var(--bg-tertiary) 0%,
    var(--border-light) 50%,
    var(--bg-tertiary) 100%
  );
  background-size: 1000px 100%;
  animation: shimmer 2s infinite linear;
  border-radius: var(--radius-md);
}

.skeleton-card {
  height: 200px;
  border-radius: var(--radius-lg);
}

.skeleton-text {
  height: 16px;
  margin-bottom: var(--space-sm);
}

.skeleton-text--large {
  height: 24px;
}

/* ============================================
   ANIMATIONS
   ============================================ */

@keyframes slide-in {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.animate-slide-in {
  animation: slide-in var(--transition-base);
}

.animate-fade-in {
  animation: fade-in var(--transition-base);
}

.animate-pulse {
  animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

/* ============================================
   TABLE STYLES
   ============================================ */

table {
  width: 100%;
  border-collapse: collapse;
  background-color: var(--bg-primary);
}

thead {
  background-color: var(--bg-tertiary);
  border-bottom: 2px solid var(--border-light);
}

th, td {
  padding: var(--space-md) var(--space-lg);
  text-align: left;
  border-bottom: 1px solid var(--border-light);
}

th {
  font-weight: 600;
  color: var(--text-primary);
}

tbody tr:hover {
  background-color: var(--bg-secondary);
}

@media (max-width: 768px) {
  table {
    font-size: 0.9rem;
  }

  th, td {
    padding: var(--space-sm);
  }
}

/* ============================================
   RESPONSIVE UTILITIES
   ============================================ */

@media (max-width: 1024px) {
  main {
    margin-left: 0;
  }

  nav {
    width: 200px;
  }
}

@media (max-width: 768px) {
  nav {
    position: fixed;
    left: 0;
    top: 0;
    width: 100%;
    height: auto;
    flex-direction: row;
    border-right: none;
    border-bottom: 1px solid var(--border-light);
    overflow-x: auto;
  }

  nav ul {
    display: flex;
    flex-direction: row;
  }

  nav li {
    border-bottom: none;
    border-right: 1px solid var(--border-light);
  }

  main {
    padding-top: 60px;
  }

  .grid-cols-2,
  .grid-cols-3,
  .grid-cols-4 {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 480px) {
  :root {
    font-size: 14px;
  }

  h1 {
    font-size: 1.75rem;
  }

  h2 {
    font-size: 1.5rem;
  }

  h3 {
    font-size: 1.25rem;
  }

  button,
  .btn {
    width: 100%;
  }

  .page-header {
    padding: var(--space-lg);
  }

  form {
    padding: var(--space-lg);
  }
}

/* ============================================
   ACCESSIBILITY
   ============================================ */

@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

@media (prefers-color-scheme: dark) {
  body {
    background-color: var(--dark-bg-secondary);
  }
}

/* ============================================
   PRINT STYLES (Resume/Email Fix)
   ============================================ */

@media print {
  * {
    background: white !important;
    color: black !important;
  }

  body {
    background: white;
  }

  .resume-container,
  .email-preview {
    background: white !important;
    box-shadow: none !important;
    border: none !important;
  }

  nav,
  .page-header,
  .btn,
  button {
    display: none;
  }
}

/* ============================================
   DARK MODE EMAIL PREVIEW
   ============================================ */

.email-preview {
  background: white !important;
  color: #000000 !important;
  font-family: Arial, sans-serif;
  padding: 20px;
  line-height: 1.6;
}

.email-preview * {
  color: inherit !important;
  background: transparent !important;
}

.email-preview a {
  color: #0066cc !important;
  text-decoration: underline;
}
PART 2: 20 IMPROVEMENTS TO YOUR REDESIGN PLAN
Based on Perplexity's audit + your live site analysis:

1. Hide Debug/Log Output (CRITICAL)
Remove all system logs from user-facing pages instantly. Add environment check:

typescript
// src/app/layout.tsx
if (process.env.NODE_ENV === 'production') {
  console.log = () => {}
  console.debug = () => {}
}
Priority: BEFORE LAUNCH

2. Unified Icon System (Replace Emoji)
Replace all emoji logos (Netflix, Amazon) with flat SVG icons. Add consistency layer:

css
/* Icon System */
.icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

.icon--sm { width: 16px; height: 16px; }
.icon--md { width: 24px; height: 24px; }
.icon--lg { width: 32px; height: 32px; }

.icon--colored {
  color: var(--accent-blue);
}
Usage: <Icon name="netflix" className="icon--lg" />

3. Mobile Download Links (App Store/Play)
Add prominent app download section to landing/dashboard:

tsx
<section className="app-downloads">
  <h3>Get the Mobile App</h3>
  <div className="download-buttons">
    <a href="https://apps.apple.com/app/..." className="btn btn--primary">
      <Icon name="apple" /> Download on App Store
    </a>
    <a href="https://play.google.com/store/..." className="btn btn--primary">
      <Icon name="google" /> Get on Google Play
    </a>
    <a href="javascript:alert('QR Code')" className="btn btn--secondary">
      <Icon name="qr" /> Scan QR Code
    </a>
  </div>
</section>
4. Sidebar Responsive Collapse (Mobile)
Already in CSS, but needs mobile hamburger menu:

tsx
// src/components/Navigation.tsx
const [sidebarOpen, setSidebarOpen] = useState(false)

return (
  <>
    <button 
      className="mobile-menu-toggle"
      onClick={() => setSidebarOpen(!sidebarOpen)}
    >
      <Icon name="menu" />
    </button>
    <nav className={sidebarOpen ? 'active' : ''}>
      {/* Navigation items */}
    </nav>
  </>
)
5. Visual Feedback on Form Inputs
Add real-time validation + error states:

css
/* Form validation states */
input:invalid:not(:placeholder-shown) {
  border-color: var(--accent-error);
  background-color: rgba(239, 68, 68, 0.05);
}

input:valid:not(:placeholder-shown) {
  border-color: var(--accent-success);
  background-color: rgba(34, 197, 94, 0.05);
}

.form-error {
  color: var(--accent-error);
  font-size: 0.85rem;
  margin-top: var(--space-xs);
  display: flex;
  align-items: center;
  gap: var(--space-xs);
}

.form-success {
  color: var(--accent-success);
  font-size: 0.85rem;
}
6. Consistent Form Alignment
Ensure all inputs/selects share same left margin + width:

css
/* Form consistency */
.form-group {
  display: grid;
  grid-template-columns: 1fr;
}

input,
textarea,
select {
  width: 100%;
  margin: 0;
  padding: var(--space-md);
}

@media (min-width: 768px) {
  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: var(--space-lg);
  }
}
7. Resume Text Padding/Readability
Fix "wall of text" issue in resume textarea:

css
textarea[name="resume"] {
  padding: var(--space-lg);
  line-height: 1.8;
  word-spacing: 0.1em;
  letter-spacing: 0.3px;
  white-space: pre-wrap;
}
8. Preview Box Separation
Make preview area visually distinct from form:

css
.preview-container {
  background-color: var(--bg-primary);
  border: 2px solid var(--accent-blue);
  border-radius: var(--radius-lg);
  padding: var(--space-xl);
  box-shadow: var(--shadow-lg);
  margin-top: var(--space-xl);
}

.preview-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 300px;
  color: var(--text-tertiary);
  text-align: center;
}

.preview-empty__icon {
  font-size: 3rem;
  margin-bottom: var(--space-lg);
  opacity: 0.5;
}
9. Button Primary Action Contrast
Ensure CTAs "pop" on all backgrounds:

css
.btn-primary {
  background: linear-gradient(135deg, #0066cc, #0052a3);
  box-shadow: 0 4px 12px rgba(0, 102, 204, 0.3);
  font-weight: 700;
  letter-spacing: 0.5px;
}

.btn-primary:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0, 102, 204, 0.4);
}

.btn-primary:active {
  transform: translateY(-1px);
}
10. Loading State Feedback
Add spinner + message to async actions:

tsx
<button onClick={handleGenerate} disabled={isLoading}>
  {isLoading ? (
    <>
      <Spinner className="animate-spin" />
      Generating...
    </>
  ) : (
    'Generate Cover Letter'
  )}
</button>
11. Dashboard Widget Customization
Allow users to pin/rearrange dashboard widgets:

tsx
// DraggableWidget component
<div 
  draggable 
  onDragStart={handleDragStart}
  className="dashboard-widget"
>
  <button onClick={() => pinWidget(id)} className="btn--icon">
    <Icon name={isPinned ? 'pin-filled' : 'pin'} />
  </button>
  {/* Widget content */}
</div>
12. Responsive Typography Scaling
Ensure text readability at all screen sizes:

css
@media (max-width: 1024px) {
  h1 { font-size: 2rem; }
  h2 { font-size: 1.5rem; }
  h3 { font-size: 1.25rem; }
}

@media (max-width: 768px) {
  h1 { font-size: 1.75rem; }
  h2 { font-size: 1.25rem; }
  h3 { font-size: 1.125rem; }
  body { font-size: 0.95rem; }
}

@media (max-width: 480px) {
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.125rem; }
  h3 { font-size: 1rem; }
  body { font-size: 0.9rem; }
}
13. Color Contrast Audit (WCAG AA)
Implement automated contrast checking:

typescript
// src/lib/accessibility/contrast-check.ts
export function checkContrast(foreground: string, background: string): boolean {
  const ratio = getContrastRatio(foreground, background)
  return ratio >= 4.5 // WCAG AA minimum
}

// Test all text colors
const checks = [
  checkContrast('--text-primary', '--bg-primary'),
  checkContrast('--text-secondary', '--bg-primary'),
  checkContrast('--accent-blue', '--bg-primary'),
]
14. Keyboard Navigation & Focus States
Add visible focus indicators to all interactive elements:

css
*:focus-visible {
  outline: 2px solid var(--accent-blue);
  outline-offset: 2px;
}

button:focus-visible,
a:focus-visible,
input:focus-visible {
  outline: 3px solid var(--accent-blue);
  outline-offset: 2px;
}

@media (prefers-reduced-motion: reduce) {
  *:focus-visible {
    outline-width: 3px;
  }
}
15. ARIA Labels for All Interactive Elements
Improve screen reader support:

tsx
<button 
  aria-label="Save job to favorites"
  className="btn btn--icon"
>
  <Icon name="bookmark" aria-hidden="true" />
</button>

<nav aria-label="Main navigation">
  {/* Navigation items */}
</nav>

<div role="status" aria-live="polite" aria-label="Application status">
  {/* Status updates */}
</div>
16. "Why This Job Matches You" Explanation
Add contextual matching explanation to job cards:

tsx
<div className="job-match-explanation">
  <h4>Why we matched you:</h4>
  <ul>
    <li>✓ 92% of your top skills match</li>
    <li>✓ Your experience level aligns perfectly</li>
    <li>✓ You have {matchedSkills.length} required skills</li>
  </ul>
  <progress value={matchScore} max="100" />
  <span className="match-score">{matchScore}% Match</span>
</div>
17. Company Research Cards (Visual Redesign)
Replace basic text with cards + icons:

tsx
<div className="company-research">
  <div className="company-card company-card--pros">
    <Icon name="thumbs-up" className="icon--lg" />
    <h4>Pros</h4>
    <ul>
      {pros.map(pro => (
        <li key={pro}>
          <Icon name="check" /> {pro}
        </li>
      ))}
    </ul>
  </div>
  
  <div className="company-card company-card--cons">
    <Icon name="thumbs-down" className="icon--lg" />
    <h4>Cons</h4>
    <ul>
      {cons.map(con => (
        <li key={con}>
          <Icon name="alert-circle" /> {con}
        </li>
      ))}
    </ul>
  </div>
</div>
CSS:

css
.company-card {
  background: linear-gradient(135deg, var(--bg-primary), var(--bg-secondary));
  border-radius: var(--radius-lg);
  padding: var(--space-lg);
  border-left: 4px solid;
}

.company-card--pros {
  border-left-color: var(--accent-success);
}

.company-card--cons {
  border-left-color: var(--accent-warning);
}
18. Resume Builder Live Preview
Show formatted resume as you edit:

tsx
<div className="resume-editor-container">
  <div className="editor">
    {/* Edit form */}
  </div>
  <div className="preview">
    <ResumePreview data={formData} />
  </div>
</div>
CSS:

css
.resume-editor-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-xl);
}

@media (max-width: 1024px) {
  .resume-editor-container {
    grid-template-columns: 1fr;
  }

  .preview {
    position: sticky;
    top: 60px;
  }
}
19. Application Tracking Status Swipe (Mobile)
Enable swipe actions for mobile status updates:

tsx
<Swipeable
  onSwipeLeft={() => updateStatus('rejected')}
  onSwipeRight={() => updateStatus('interview')}
>
  <div className="application-row">
    <span className={`status status--${app.status}`}>
      {app.status}
    </span>
  </div>
</Swipeable>
20. Sticky Notifications for Mobile
Add persistent toast notifications for action feedback:

tsx
<Toast
  type="success"
  message="Cover letter generated!"
  icon="check-circle"
  autoDismiss={3000}
  sticky={true}
/>
CSS:

css
.toast {
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: var(--accent-success);
  color: white;
  padding: var(--space-lg) var(--space-xl);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  z-index: 1000;
  animation: slide-in var(--transition-base);
}

@media (max-width: 768px) {
  .toast {
    bottom: 80px;
    left: 20px;
    right: 20px;
  }
}
PART 3: IMPLEMENTATION CHECKLIST
Critical (Fix Before Launch)
 Hide debug/log output

 Replace emoji with flat icons

 Add app download links

 Fix form input alignment

 Resume textarea padding fix

 Email preview black background fix

 Print styles for resume

High Priority (Week 1)
 Mobile hamburger menu

 Form validation feedback

 Button contrast improvement

 WCAG AA compliance audit

 ARIA labels on all interactive elements

Medium Priority (Week 2)
 Dashboard widget customization

 "Why this job matches" explanation

 Company research card redesign

 Resume live preview

 Loading states with spinners



 Sticky notifications

 Keyboard navigation improvements

