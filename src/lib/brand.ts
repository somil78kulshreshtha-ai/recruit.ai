// @polsia:user-owned — brand identity. Edit freely. `site.ts` re-exports
// siteName/siteDescription; `manifest.ts` + `opengraph-image.tsx` read `brandVisual`.

export const siteName = 'RecruitAI';
export const siteDescription =
  'Smarter hiring, from first search to successful hire. RecruitAI connects job seekers and hiring teams across India.';

// PWA + social-share colors. HEX only (CSS variables aren't readable here) — set
// them to match the theme you define in src/app/brand-theme.css. The starter
// values are achromatic placeholders, not a palette.
export const brandVisual = {
  /** PWA browser-UI / status-bar color — usually your background or primary. */
  themeColor: '#f6f8fc',
  /** PWA splash + install background. */
  backgroundColor: '#f6f8fc',
  /** Social-share (OG/Twitter) image. */
  og: {
    background: '#121d37',
    foreground: '#ffffff',
    /** Second line under the site name; '' hides it. */
    tagline: 'Smarter hiring, from first search to successful hire.',
    /** Optional https PNG/JPEG background photo; '' keeps the plain-color card. */
    image: '',
  },
} as const;
