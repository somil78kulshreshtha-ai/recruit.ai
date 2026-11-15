// @polsia:user-owned — interactive public site and clearly labelled workspace preview.
'use client';

import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  Bookmark,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronDown,
  CircleHelp,
  FileText,
  Filter,
  LockKeyhole,
  Menu,
  Search,
  Sparkles,
  UsersRound,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { AuthNav } from '@/components/custom/auth-nav';
import { LanguageSwitcher } from '@/components/custom/language-switcher';

const contact = 'recruitai@polsia.app';

type PreviewRole = 'candidate' | 'company' | 'admin';

const previewTabs: { id: PreviewRole; label: string }[] = [
  { id: 'candidate', label: 'Job seeker' },
  { id: 'company', label: 'Company' },
  { id: 'admin', label: 'Admin' },
];

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function WorkspacePreview({ activeRole }: { activeRole: PreviewRole }) {
  const [saved, setSaved] = useState(false);
  const [stage, setStage] = useState<'Applied' | 'Shortlisted'>('Applied');
  const headings: Record<PreviewRole, { greeting: string; title: string }> = {
    candidate: { greeting: 'Good morning, Alex', title: 'Your next move, in view.' },
    company: { greeting: 'Northstar workspace', title: 'Your hiring, in one place.' },
    admin: { greeting: 'Platform overview', title: 'A clear view across RecruitAI.' },
  };
  const content = headings[activeRole];

  return (
    <section
      className="workspace-window"
      aria-label={`${previewTabs.find((tab) => tab.id === activeRole)?.label} product preview`}
    >
      <div className="workspace-topbar">
        <div className="window-controls" aria-hidden="true">
          <i />
          <i />
          <i />
        </div>
        <span className="workspace-name">
          <BrandMark /> RecruitAI <span className="workspace-divider">/</span>{' '}
          {activeRole === 'candidate'
            ? 'My space'
            : activeRole === 'company'
              ? 'Northstar'
              : 'Admin'}
        </span>
        <span className="preview-user">A</span>
      </div>
      <div className="workspace-body">
        <aside className="workspace-sidebar" aria-label="Preview navigation">
          <div className="workspace-switch">
            <span className="workspace-avatar">R</span>
            <span>
              {activeRole === 'candidate'
                ? 'My profile'
                : activeRole === 'company'
                  ? 'Northstar Labs'
                  : 'RecruitAI'}
            </span>
            <ChevronDown size={13} />
          </div>
          <div className="sidebar-label">WORKSPACE</div>
          <div className="workspace-link active">
            <BarChart3 size={14} /> Overview
          </div>
          <div className="workspace-link">
            <Search size={14} />{' '}
            {activeRole === 'candidate'
              ? 'Find jobs'
              : activeRole === 'company'
                ? 'Open roles'
                : 'Job listings'}
          </div>
          <div className="workspace-link">
            <FileText size={14} />{' '}
            {activeRole === 'candidate'
              ? 'Applications'
              : activeRole === 'company'
                ? 'Applicants'
                : 'Applications'}
          </div>
          <div className="workspace-link">
            <UsersRound size={14} />{' '}
            {activeRole === 'candidate'
              ? 'Saved roles'
              : activeRole === 'company'
                ? 'Team'
                : 'Companies'}
          </div>
          <div className="sidebar-bottom">
            <span className="sidebar-help">
              <CircleHelp size={14} /> Help & support
            </span>
          </div>
        </aside>
        <div className="workspace-main">
          <div className="workspace-pagehead">
            <div>
              <p className="workspace-greeting">{content.greeting}</p>
              <h3>{content.title}</h3>
            </div>
            <button className="preview-filter" type="button" aria-label="Illustrative filters">
              <Filter size={14} /> Filters
            </button>
          </div>
          {activeRole === 'candidate' && (
            <div className="candidate-preview">
              <div className="candidate-summary">
                <div>
                  <span className="mini-label">PROFILE COMPLETION</span>
                  <strong>72%</strong>
                </div>
                <div className="completion-track">
                  <span />
                </div>
                <span className="tiny-copy">
                  A more complete profile helps teams understand your experience.
                </span>
              </div>
              <div className="preview-section-head">
                <span>Open roles</span>
                <span className="text-link">
                  View roles <ArrowRight size={12} />
                </span>
              </div>
              <div className="suggested-role">
                <div className="company-stamp blue-stamp">N</div>
                <div className="role-copy">
                  <strong>Product designer</strong>
                  <span>Northstar Labs · Remote, India</span>
                  <small>
                    Product design <b>·</b> Research <b>·</b> Figma
                  </small>
                </div>
                <button
                  className={`save-button ${saved ? 'is-saved' : ''}`}
                  onClick={() => setSaved(!saved)}
                  type="button"
                  aria-label={saved ? 'Remove demo role from saved jobs' : 'Save demo role'}
                >
                  <Bookmark size={15} fill={saved ? 'currentColor' : 'none'} />
                </button>
              </div>
              <div className="candidate-status-row">
                <span>
                  <i className="status-dot" /> Application activity
                </span>
                <span>
                  2 in progress <ArrowUpRight size={12} />
                </span>
              </div>
              <div className="mini-application">
                <span className="company-stamp tiny-stamp purple-stamp">M</span>
                <span>
                  <strong>UX designer</strong>
                  <small>Maple Works</small>
                </span>
                <span className="status-chip">In review</span>
              </div>
            </div>
          )}
          {activeRole === 'company' && (
            <div className="company-preview">
              <div className="metric-row">
                <div className="metric-cell">
                  <span>Open roles</span>
                  <strong>04</strong>
                  <small>Illustrative</small>
                </div>
                <div className="metric-cell">
                  <span>Applicants</span>
                  <strong>28</strong>
                  <small>Illustrative</small>
                </div>
                <div className="metric-cell">
                  <span>Interviews</span>
                  <strong>06</strong>
                  <small>Illustrative</small>
                </div>
              </div>
              <div className="preview-section-head">
                <span>
                  Product designer <small>· sample applicant</small>
                </span>
                <button
                  className="stage-button"
                  type="button"
                  onClick={() => setStage(stage === 'Applied' ? 'Shortlisted' : 'Applied')}
                >
                  {stage} <ChevronDown size={11} />
                </button>
              </div>
              <div className="applicant-row">
                <span className="person-avatar avatar-lilac">MK</span>
                <span className="applicant-info">
                  <strong>Maya K.</strong>
                  <small>Product design · sample profile</small>
                </span>
                <span className="match-tag">Review</span>
              </div>
              <div className="match-explainer">
                <FileText size={13} />
                <span>
                  The hiring team reviews the submitted profile and decides on the next stage.
                </span>
                <small>HUMAN REVIEW</small>
              </div>
              <div className="preview-footer-note">
                Decision support for your team. Every hiring decision stays with you.
              </div>
            </div>
          )}
          {activeRole === 'admin' && (
            <div className="admin-preview">
              <div className="metric-row admin-metrics">
                <div className="metric-cell">
                  <span>Users</span>
                  <strong>1,284</strong>
                  <small>Illustrative</small>
                </div>
                <div className="metric-cell">
                  <span>Companies</span>
                  <strong>86</strong>
                  <small>Illustrative</small>
                </div>
                <div className="metric-cell">
                  <span>Listings to review</span>
                  <strong>12</strong>
                  <small>Illustrative</small>
                </div>
              </div>
              <div className="admin-chart-card">
                <div className="chart-heading">
                  <span>Platform activity</span>
                  <small>DEMO DATA</small>
                </div>
                <div
                  className="chart-bars"
                  role="img"
                  aria-label="Illustrative platform activity chart"
                >
                  {[34, 49, 42, 62, 54, 74, 64, 89, 71, 96, 83, 100].map((height) => (
                    <i key={height} style={{ height: `${height}%` }} />
                  ))}
                </div>
                <div className="chart-labels">
                  <span>Jan</span>
                  <span>Mar</span>
                  <span>May</span>
                  <span>Jul</span>
                  <span>Sep</span>
                  <span>Nov</span>
                </div>
              </div>
              <div className="admin-footer">
                <span>
                  <i className="health-dot" /> Platform systems
                </span>
                <span>
                  Overview <ArrowUpRight size={12} />
                </span>
              </div>
            </div>
          )}
          <div className="preview-disclaimer">
            <span>DEMO WORKSPACE</span>
            <span>Illustrative names, activity and figures</span>
          </div>
        </div>
      </div>
    </section>
  );
}

const faqs = [
  {
    question: 'What is RecruitAI?',
    answer:
      'RecruitAI brings job discovery and applications together with employer tools for publishing roles, reviewing applicants and coordinating hiring. Platform administration has its own workspace.',
  },
  {
    question: 'Does AI make hiring decisions?',
    answer:
      'In Phase 1, AI can help company teams draft job descriptions and review inclusive language. Candidate matching and resume parsing are planned for a later phase. People make every hiring decision.',
  },
  {
    question: 'Are the roles in the preview real openings?',
    answer:
      'No. The workspace preview uses clearly labelled illustrative data. An employer must publish a role before it can appear as an open opportunity.',
  },
  {
    question: 'Can candidates include a resume?',
    answer:
      'Job seekers can save a profile, privately upload a PDF resume and apply to open roles. RecruitAI does not parse the resume or prefill profile fields in Phase 1.',
  },
  {
    question: 'Where can I find plans and pricing?',
    answer:
      'Pricing details have not been published. Email us and we can share the current information directly.',
  },
];

export default function RecruitAILanding() {
  const [activeRole, setActiveRole] = useState<PreviewRole>('company');
  const [menuOpen, setMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <main className="recruitai-site">
      <header className="marketing-header">
        <div className="marketing-nav wrap">
          <Link href="#top" className="brand-lockup" aria-label="RecruitAI home">
            <BrandMark />
            <span>RecruitAI</span>
          </Link>
          <nav className="desktop-nav" aria-label="Main navigation">
            <Link href="#platform">Platform</Link>
            <Link href="#how-it-works">How it works</Link>
            <Link href="#for-teams">For teams</Link>
            <Link href="#pricing">Pricing</Link>
          </nav>
          <div className="nav-actions">
            <LanguageSwitcher />
            <Link className="nav-contact" href="/contact">
              Contact
            </Link>
            <AuthNav />
          </div>
          <button
            className="mobile-menu-button"
            type="button"
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            {menuOpen ? <X size={21} /> : <Menu size={21} />}
          </button>
        </div>
        {menuOpen && (
          <nav className="mobile-nav" aria-label="Mobile navigation">
            <Link onClick={() => setMenuOpen(false)} href="#platform">
              Platform
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="#how-it-works">
              How it works
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="#for-teams">
              For teams
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="#pricing">
              Pricing
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="/jobs">
              Find jobs
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="/signup?type=company">
              Hire talent
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="/login">
              Sign in
            </Link>
            <Link onClick={() => setMenuOpen(false)} href="/contact">
              Contact RecruitAI
            </Link>
          </nav>
        )}
      </header>

      <section className="hero-section" id="top">
        <div className="hero-layout wrap">
          <div className="hero-copy">
            <p className="eyebrow">
              <span className="eyebrow-rule" /> A more connected way to hire
            </p>
            <h1>The Future of Hiring Starts Here.</h1>
            <p className="hero-lede">
              One intelligent platform connecting exceptional talent with extraordinary
              opportunities.
            </p>
            <p className="hero-tagline">Smarter hiring, from first search to successful hire.</p>
            <div className="hero-actions">
              <Link className="button button-primary" href="/jobs">
                Find Jobs <ArrowRight size={16} />
              </Link>
              <Link className="button button-secondary" href="/signup?type=company">
                Hire Talent <ArrowRight size={16} />
              </Link>
            </div>
            <div className="hero-footnote">
              <span className="tiny-dot" /> For job seekers and hiring teams across India
            </div>
          </div>
          <div className="hero-visual" id="platform">
            <div className="preview-kicker">
              <span>RECRUITAI WORKSPACE</span>
              <span>PRODUCT PREVIEW</span>
            </div>
            <div className="preview-tabs" role="tablist" aria-label="Preview a RecruitAI workspace">
              {previewTabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={activeRole === tab.id}
                  className={activeRole === tab.id ? 'selected' : ''}
                  onClick={() => setActiveRole(tab.id)}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <WorkspacePreview activeRole={activeRole} />
            <div className="preview-caption">
              <span>
                <Sparkles size={14} /> One connected view, shaped around your role
              </span>
              <ArrowDownRight size={16} />
            </div>
          </div>
        </div>
      </section>

      <section className="capability-strip wrap" aria-label="RecruitAI capabilities">
        <span>One shared platform</span>
        <div className="capability-divider" />
        <span>
          <Search size={15} /> Discover relevant roles
        </span>
        <div className="capability-divider" />
        <span>
          <UsersRound size={15} /> Review and progress applicants
        </span>
        <div className="capability-divider" />
        <span>
          <BarChart3 size={15} /> Understand hiring activity
        </span>
      </section>

      <section className="section how-section" id="how-it-works">
        <div className="wrap">
          <div className="section-intro section-intro-row">
            <div>
              <p className="eyebrow">
                <span className="eyebrow-rule" /> HOW RECRUITAI WORKS
              </p>
              <h2>
                Every hiring step.
                <br />
                <span>In the same conversation.</span>
              </h2>
            </div>
            <p className="intro-copy">
              Candidate discovery, applications and employer workflows come together in one place,
              with AI-assisted insights to help teams move with clarity.
            </p>
          </div>
          <div className="steps-grid">
            <article className="step-card step-card-one">
              <div className="step-number">01</div>
              <div className="step-icon icon-search">
                <Search size={20} />
              </div>
              <h3>Find the right fit</h3>
              <p>
                Job seekers explore open roles and build a profile. Hiring teams create clear
                listings with the requirements that matter.
              </p>
              <div className="step-visual search-visual">
                <span>
                  <Search size={13} /> Product design
                </span>
                <i>
                  Remote <ChevronDown size={11} />
                </i>
              </div>
            </article>
            <article className="step-card step-card-two">
              <div className="step-number">02</div>
              <div className="step-icon icon-match">
                <Sparkles size={19} />
              </div>
              <h3>Write clearer job descriptions</h3>
              <p>
                AI helps hiring teams draft job descriptions and review inclusive language. People
                stay in control of every hiring decision.
              </p>
              <div className="match-visual">
                <span className="match-avatar">AI</span>
                <span className="match-bar">
                  <i />
                </span>
                <span className="match-label">Editable draft · human review</span>
                <Check size={15} />
              </div>
            </article>
            <article className="step-card step-card-three">
              <div className="step-number">03</div>
              <div className="step-icon icon-hire">
                <BriefcaseBusiness size={19} />
              </div>
              <h3>Move the process forward</h3>
              <p>
                Review applications and move candidates through the hiring stages from a shared
                workspace.
              </p>
              <div className="stage-visual">
                <span className="stage-pill active-stage">Applied</span>
                <i />
                <span className="stage-pill">Shortlisted</span>
                <i />
                <span className="stage-pill">Hired</span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section role-section" id="for-teams">
        <div className="wrap">
          <div className="section-intro role-intro">
            <p className="eyebrow eyebrow-light">
              <span className="eyebrow-rule" /> BUILT FOR BOTH SIDES
            </p>
            <h2>
              One hiring platform.
              <br />
              <span>Three focused workspaces.</span>
            </h2>
            <p>Each portal is designed around the work its people need to do.</p>
          </div>
          <div className="role-grid">
            <article className="role-card" id="candidate">
              <div className="role-heading">
                <span className="role-symbol seeker-symbol">
                  <Search size={18} />
                </span>
                <span className="role-index">01 / TALENT</span>
              </div>
              <h3>For job seekers</h3>
              <p>
                Find roles that fit your experience, keep your applications organised and make your
                profile easier for employers to understand.
              </p>
              <ul>
                <li>
                  <Check size={14} /> Discover and save opportunities
                </li>
                <li>
                  <Check size={14} /> Follow application stages
                </li>
                <li>
                  <Check size={14} /> Build a profile and add a private PDF resume
                </li>
              </ul>
              <Link className="role-link" href="/jobs">
                Explore open roles <ArrowUpRight size={15} />
              </Link>
              <div className="role-card-art seeker-art">
                <div className="art-profile">
                  <span className="art-avatar">AK</span>
                  <span>
                    <b>Professional profile</b>
                    <i>Skills · Experience · Resume</i>
                  </span>
                  <span className="art-complete">72%</span>
                </div>
                <div className="art-listing">
                  <span className="art-company-mark">N</span>
                  <span>
                    <b>Product designer</b>
                    <i>Illustrative role preview</i>
                  </span>
                  <Bookmark size={15} />
                </div>
              </div>
            </article>
            <article className="role-card" id="employers">
              <div className="role-heading">
                <span className="role-symbol company-symbol">
                  <Building2 size={18} />
                </span>
                <span className="role-index">02 / EMPLOYERS</span>
              </div>
              <h3>For hiring teams</h3>
              <p>
                Publish roles, review submitted applicants and keep the next step visible to your
                team as a search moves forward.
              </p>
              <ul>
                <li>
                  <Check size={14} /> Manage company listings
                </li>
                <li>
                  <Check size={14} /> Review and track applicants
                </li>
                <li>
                  <Check size={14} /> Coordinate hiring conversations
                </li>
              </ul>
              <Link className="role-link" href="/signup?type=company">
                Create a company workspace <ArrowUpRight size={15} />
              </Link>
              <div className="role-card-art company-art">
                <div className="art-role-head">
                  <span>Product designer</span>
                  <small>APPLICANTS</small>
                </div>
                <div className="art-candidate">
                  <span className="tiny-person">MK</span>
                  <span>
                    <b>Candidate profile</b>
                    <i>Submitted application</i>
                  </span>
                  <span className="art-review">Applied</span>
                </div>
                <div className="art-candidate">
                  <span className="tiny-person blue-person">JR</span>
                  <span>
                    <b>Candidate profile</b>
                    <i>Profile for review</i>
                  </span>
                  <span className="art-review">Review</span>
                </div>
              </div>
            </article>
            <article className="role-card role-card-admin">
              <div className="role-heading">
                <span className="role-symbol admin-symbol">
                  <LockKeyhole size={17} />
                </span>
                <span className="role-index">03 / PLATFORM</span>
              </div>
              <h3>For administrators</h3>
              <p>
                Review platform activity and manage user, company and job information from a
                dedicated administration workspace.
              </p>
              <ul>
                <li>
                  <Check size={14} /> Manage users and companies
                </li>
                <li>
                  <Check size={14} /> Review job listings
                </li>
                <li>
                  <Check size={14} /> Monitor application progress
                </li>
              </ul>
              <Link className="role-link" href="/login?next=/admin">
                Administrator sign in <ArrowUpRight size={15} />
              </Link>
              <div className="role-card-art admin-art">
                <div className="admin-art-header">
                  <span>Platform overview</span>
                  <span>
                    <i className="admin-health" /> SYSTEMS
                  </span>
                </div>
                <div className="admin-art-grid">
                  <span>
                    <i>USERS</i>
                    <b>—</b>
                  </span>
                  <span>
                    <i>COMPANIES</i>
                    <b>—</b>
                  </span>
                  <span>
                    <i>JOBS TO REVIEW</i>
                    <b>—</b>
                  </span>
                </div>
                <div className="admin-art-note">
                  <BarChart3 size={14} /> Activity and moderation in one view
                </div>
              </div>
            </article>
          </div>
          <p className="roles-note">
            Workspace cards and names above are illustrative product previews. Contact RecruitAI to
            ask about access.
          </p>
        </div>
      </section>

      <section className="section intelligence-section">
        <div className="wrap intelligence-layout">
          <div className="intelligence-copy">
            <p className="eyebrow">
              <span className="eyebrow-rule" /> AI, WITH PEOPLE IN CONTROL
            </p>
            <h2>
              Useful assistance.
              <br />
              <span>Human decisions.</span>
            </h2>
            <p>
              RecruitAI can help teams draft job descriptions and review inclusive language.
              Recruiters review the suggestions, and people make every hiring decision. Candidate
              matching and resume parsing are planned for a later phase.
            </p>
            <Link className="text-cta" href="#faq">
              How RecruitAI works <ArrowRight size={16} />
            </Link>
          </div>
          <div className="intelligence-visual">
            <div className="match-panel">
              <div className="match-panel-heading">
                <span>
                  <Sparkles size={15} /> AI ASSIST
                </span>
                <span>HUMAN REVIEW</span>
              </div>
              <div className="insight-job">
                <span className="insight-logo">R</span>
                <span>
                  <b>Job description draft</b>
                  <small>Company workspace · editable</small>
                </span>
              </div>
              <div className="insight-separator" />
              <p className="insight-overline">REVIEW BEFORE PUBLISHING</p>
              <div className="insight-skill">
                <span>Clear role requirements</span>
                <b>Editable draft</b>
              </div>
              <div className="insight-skill">
                <span>Inclusive wording</span>
                <b>Review suggestion</b>
              </div>
              <div className="insight-skill">
                <span>Final decision</span>
                <b>Human-led</b>
              </div>
              <div className="insight-disclaimer">
                <Sparkles size={14} />
                <span>
                  Suggestions are editable.
                  <br />
                  <b>Hiring decisions stay human.</b>
                </span>
              </div>
            </div>
            <div className="insight-orbit orbit-one" />
            <div className="insight-orbit orbit-two" />
            <div className="insight-accent-dot" />
          </div>
        </div>
      </section>

      <section className="section clarity-section">
        <div className="wrap clarity-layout">
          <div className="clarity-number">
            3<span>workspaces</span>
          </div>
          <div className="clarity-copy">
            <p className="eyebrow">
              <span className="eyebrow-rule" /> A SHARED VIEW OF HIRING
            </p>
            <h2>
              Less context switching.
              <br />
              <span>More clarity at every step.</span>
            </h2>
            <p>
              Job seekers, company teams and platform administrators each have a focused place to
              manage their part of recruitment, connected through the same hiring journey.
            </p>
          </div>
          <div className="clarity-steps">
            <div>
              <span className="clarity-step-icon">
                <Search size={16} />
              </span>
              <span>
                <b>Discover</b>
                <small>Roles and candidates</small>
              </span>
              <ArrowUpRight size={14} />
            </div>
            <div>
              <span className="clarity-step-icon">
                <FileText size={16} />
              </span>
              <span>
                <b>Review</b>
                <small>Profiles and applications</small>
              </span>
              <ArrowUpRight size={14} />
            </div>
            <div>
              <span className="clarity-step-icon">
                <BriefcaseBusiness size={16} />
              </span>
              <span>
                <b>Progress</b>
                <small>Hiring stages and team review</small>
              </span>
              <ArrowUpRight size={14} />
            </div>
          </div>
        </div>
      </section>

      <section className="section proof-section">
        <div className="wrap proof-layout">
          <div className="proof-intro">
            <p className="eyebrow">
              <span className="eyebrow-rule" /> EXAMPLE CONTENT
            </p>
            <h2>
              Imagine a smoother
              <br />
              <span>hiring conversation.</span>
            </h2>
            <p>
              These sample statements illustrate the product experience. They are not customer
              testimonials or measured outcomes.
            </p>
            <Link className="text-cta" href="/contact">
              Talk with RecruitAI <ArrowRight size={16} />
            </Link>
          </div>
          <div className="quote-stack">
            <article className="quote-card">
              <span className="demo-label">DEMO TESTIMONIAL · ILLUSTRATIVE</span>
              <blockquote>
                “I can see what is moving and what needs attention without chasing updates across
                tools.”
              </blockquote>
              <div className="quote-byline">
                <span className="quote-avatar quote-avatar-blue">JT</span>
                <span>
                  <b>Hiring manager</b>
                  <small>Illustrative persona · not a customer quote</small>
                </span>
              </div>
            </article>
            <article className="quote-card quote-card-secondary">
              <span className="demo-label">DEMO TESTIMONIAL · ILLUSTRATIVE</span>
              <blockquote>
                “My profile and applications have one clear home, so I know where things stand.”
              </blockquote>
              <div className="quote-byline">
                <span className="quote-avatar quote-avatar-violet">AK</span>
                <span>
                  <b>Job seeker</b>
                  <small>Illustrative persona · not a customer quote</small>
                </span>
              </div>
            </article>
          </div>
        </div>
      </section>

      <section className="section pricing-section" id="pricing">
        <div className="wrap pricing-layout">
          <div>
            <p className="eyebrow eyebrow-light">
              <span className="eyebrow-rule" /> PRICING
            </p>
            <h2>
              Let’s talk about
              <br />
              <span>what your team needs.</span>
            </h2>
          </div>
          <div className="pricing-card">
            <div className="pricing-card-top">
              <span className="pricing-mark">
                <BriefcaseBusiness size={18} />
              </span>
              <span className="pricing-kicker">RECRUITAI</span>
            </div>
            <h3>Plans and pricing by enquiry</h3>
            <p>
              Pricing details are available by request. Tell us whether you’re exploring RecruitAI
              as a candidate, a hiring team or a platform administrator.
            </p>
            <Link className="button button-white" href="/contact">
              Ask about pricing <ArrowRight size={16} />
            </Link>
            <span className="pricing-note">
              No prices or plan limits are shown until confirmed.
            </span>
          </div>
        </div>
      </section>

      <section className="section faq-section" id="faq">
        <div className="wrap faq-layout">
          <div className="faq-intro">
            <p className="eyebrow">
              <span className="eyebrow-rule" /> GOOD TO KNOW
            </p>
            <h2>
              Questions,
              <br />
              <span>answered plainly.</span>
            </h2>
            <p>Want to ask about a role, your team or access? We’re one email away.</p>
            <Link className="text-cta" href="/contact">
              Contact RecruitAI <ArrowUpRight size={15} />
            </Link>
          </div>
          <div className="faq-list">
            {faqs.map((faq, index) => (
              <div className={`faq-item ${openFaq === index ? 'faq-open' : ''}`} key={faq.question}>
                <button
                  type="button"
                  aria-expanded={openFaq === index}
                  onClick={() => setOpenFaq(openFaq === index ? null : index)}
                >
                  <span>{faq.question}</span>
                  <span className="faq-toggle">
                    {openFaq === index ? <X size={16} /> : <ArrowRight size={16} />}
                  </span>
                </button>
                {openFaq === index && <p>{faq.answer}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="closing-section">
        <div className="wrap closing-layout">
          <div>
            <p className="eyebrow eyebrow-light">
              <span className="eyebrow-rule" /> READY TO TAKE THE NEXT STEP?
            </p>
            <h2>
              Make your next hire
              <br />a little clearer.
            </h2>
          </div>
          <Link className="button button-white closing-button" href="/contact">
            Start a conversation <ArrowUpRight size={16} />
          </Link>
        </div>
      </section>

      <footer className="marketing-footer">
        <div className="wrap footer-main">
          <div className="footer-brand-col">
            <Link href="#top" className="brand-lockup footer-brand">
              <BrandMark />
              <span>RecruitAI</span>
            </Link>
            <p>Smarter hiring, from first search to successful hire.</p>
            <p className="footer-market">Connecting talent and hiring teams across India.</p>
          </div>
          <div className="footer-column">
            <span className="footer-title">Explore</span>
            <Link href="#how-it-works">About RecruitAI</Link>
            <Link href="#platform">Platform</Link>
            <Link href="#for-teams">For teams</Link>
            <Link href="#pricing">Pricing</Link>
          </div>
          <div className="footer-column">
            <span className="footer-title">Portals</span>
            <Link href="/jobs">Job seeker access</Link>
            <Link href="/signup?type=company">Company access</Link>
            <Link href="/login?next=/admin">Admin access</Link>
          </div>
          <div className="footer-column">
            <span className="footer-title">Get in touch</span>
            <Link href="/contact">Contact RecruitAI</Link>
            <Link href="/contact">Privacy enquiries</Link>
            <Link href="/contact">Terms enquiries</Link>
            <Link href="/contact">Help center</Link>
            <span>{contact}</span>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <span>© {new Date().getFullYear()} RecruitAI</span>
          <span>Product preview content is clearly identified as illustrative.</span>
          <Link href="#top">
            Back to top <ArrowUpRight size={12} />
          </Link>
        </div>
      </footer>
    </main>
  );
}
