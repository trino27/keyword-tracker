import { CWV_THRESHOLDS } from '../../../page-speed/cwv-thresholds.constant.js';
import { ISSUE_SOURCES as SOURCE } from '../crawl/crawl-catalogue.constant.js';
import type { IPageSpeedIssueDefinition } from '../issue-definition.interface.js';

/**
 * The Core Web Vitals findings the PageSpeed worker writes: one code per device, metric and
 * band outside good, each bounded by the threshold its band begins above. A desktop code
 * has its mobile twin's severity, bound and sources; its copy speaks of computers. They
 * count among a page's issues and never in its score.
 */
export const PAGE_SPEED_CATALOGUE = {
  CWV_LCP_NEEDS_IMPROVEMENT: {
    strategy: 'mobile',
    severity: 'notice',
    label: 'Largest Contentful Paint needs improvement on mobile',
    plain: {
      what: 'The main content is a bit slow to appear on phones',
      why: "On phones the page's main content takes over 2.5 seconds to appear, by Google's measurement. Speed is a small ranking signal; the bigger cost is visitors who leave before the page appears.",
      fix: 'Ask your developer to make the largest image or text block at the top the first thing the page loads, for example by compressing the image and loading it early.',
    },
    hint: 'The main image or text block takes longer than 2.5 s to appear; make it the first thing the page loads.',
    explanation:
      'Largest Contentful Paint (LCP) is how long the largest image or text block in the viewport takes to appear — the moment a visitor sees that the page has loaded. Google calls 2.5 s or less good and more than 4 s poor, judged at the 75th percentile of mobile visits. The value comes from PageSpeed Insights: real Chrome visitors to this page over the last 28 days where Google has enough of them, otherwise visitors to the whole site, otherwise one lab test. Google says it shows the most relevant content even when page experience is sub-par, so this is a small ranking signal; the larger cost is visitors who leave before the page appears.',
    sources: [SOURCE.lcp, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.lcp.good,
  },
  CWV_LCP_POOR: {
    strategy: 'mobile',
    severity: 'warning',
    label: 'Largest Contentful Paint is poor on mobile',
    plain: {
      what: 'The main content takes too long to appear on phones',
      why: "On phones the main content takes over 4 seconds to appear, by Google's measurement, and many visitors leave before it does. Google counts it as a small ranking signal; the bigger loss is visitors.",
      fix: 'Ask your developer to shrink and preload the largest image or text block at the top, and to remove scripts that hold back the first paint.',
    },
    hint: 'The main image or text block takes longer than 4 s to appear; shrink it, serve it sooner, and drop what blocks it.',
    explanation:
      "Largest Contentful Paint (LCP) is how long the largest image or text block in the viewport takes to appear. More than 4 s at the 75th percentile of mobile visits is Google's poor band: a quarter of visitors wait at least that long to see the page. The value comes from PageSpeed Insights — real visitors to this page, to the whole site when the page has too few, or one lab test. The usual causes are an oversized hero image, a slow server response, and scripts or stylesheets that hold back the first paint. Google shows the most relevant content even when page experience is sub-par, so the cost is mostly in visitors who give up.",
    sources: [SOURCE.lcp, SOURCE.optimizeLcp, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.lcp.poor,
  },
  CWV_INP_NEEDS_IMPROVEMENT: {
    strategy: 'mobile',
    severity: 'notice',
    label: 'Interaction to Next Paint needs improvement on mobile',
    plain: {
      what: 'The page is a little slow to respond to taps and clicks',
      why: 'Data from real Chrome visitors shows at least a quarter of mobile visits wait over 0.2 seconds for the page to react to a tap or click. It is a small ranking signal; to visitors, a lagging page feels less reliable.',
      fix: 'Ask your developer to find and break up the long-running scripts that run while visitors use the page, including third-party ones.',
    },
    hint: 'Taps and clicks take longer than 200 ms to show a response; break up long scripts that run while the page is in use.',
    explanation:
      "Interaction to Next Paint (INP) is how long the page takes to respond visibly to a tap, click or key press, taken across the visit. Google calls 200 ms or less good and more than 500 ms poor, at the 75th percentile of mobile visits. Only real visitors measure it — a lab test loads the page but never uses it — so this value is Chrome's field data for this page, or for the whole site when the page has too few visits. It is a small ranking signal; to a visitor, a page that lags after a tap feels broken.",
    sources: [SOURCE.inp, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.inp.good,
  },
  CWV_INP_POOR: {
    strategy: 'mobile',
    severity: 'warning',
    label: 'Interaction to Next Paint is poor on mobile',
    plain: {
      what: 'The page responds sluggishly to taps and clicks',
      why: 'Data from real Chrome visitors shows at least a quarter of mobile visits wait over half a second for a response. Page experience is a small ranking signal; the bigger loss is visitors who tap, see nothing happen, and leave.',
      fix: 'Ask your developer to find the scripts that block the page after it loads, often heavy third-party tools, and remove, delay or split them.',
    },
    hint: 'Taps and clicks take longer than 500 ms to show a response; find the scripts that block the page after it loads.',
    explanation:
      "Interaction to Next Paint (INP) is how long the page takes to respond visibly to a tap, click or key press. More than 500 ms at the 75th percentile of mobile visits is Google's poor band. The value is Chrome's field data for this page, or for the whole site when the page has too few visits — a lab test cannot measure it, because it never interacts with the page. Heavy third-party scripts, large pages and long tasks on the main thread are the usual causes. Page experience is a small ranking signal next to relevance; the bigger cost is visitors who tap, see nothing happen, and leave.",
    sources: [SOURCE.inp, SOURCE.domSize, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.inp.poor,
  },
  CWV_CLS_NEEDS_IMPROVEMENT: {
    strategy: 'mobile',
    severity: 'notice',
    label: 'Cumulative Layout Shift needs improvement on mobile',
    plain: {
      what: 'Content shifts around somewhat while the page loads',
      why: 'Text that moves as images or ads load above it makes some readers lose their place or tap the wrong thing. Google treats it as a small ranking signal; it is mainly a reading-experience problem.',
      fix: 'Ask your developer to reserve space in the theme for images, embeds and ads, so the content stays put while they load.',
    },
    hint: 'Content moves while the page loads; reserve space for images, embeds and ads before they arrive.',
    explanation:
      'Cumulative Layout Shift (CLS) scores how much visible content jumps around while the page is open — the text you were reading sliding down as an image or an ad loads above it. It is a unitless score: Google calls 0.1 or less good and more than 0.25 poor, at the 75th percentile of mobile visits. The value comes from PageSpeed Insights — real visitors to this page, to the whole site when the page has too few, or one lab test, which only sees shifts during loading. It is a small ranking signal; to a reader, it is mis-taps and a lost place.',
    sources: [SOURCE.cls, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.cls.good,
  },
  CWV_CLS_POOR: {
    strategy: 'mobile',
    severity: 'warning',
    label: 'Cumulative Layout Shift is poor on mobile',
    plain: {
      what: 'The layout jumps a lot while visitors are reading',
      why: "By Google's measurement, content on phones jumps enough that people tap the wrong thing or lose their place. Google weighs page experience after relevance, so the main cost is frustrated readers, not rankings.",
      fix: 'Ask your developer to give images and embeds fixed sizes, stop banners and ads from pushing content down, and check web fonts that reflow the text.',
    },
    hint: 'Content jumps a lot while the page loads; give images and embeds fixed dimensions and stop inserting content above what is being read.',
    explanation:
      "Cumulative Layout Shift (CLS) scores how much visible content jumps around while the page is open. More than 0.25 at the 75th percentile of mobile visits is Google's poor band. The usual causes are images and embeds without width and height, ads and banners injected above the content, and web fonts that reflow the text. The value comes from PageSpeed Insights — real visitors to this page, to the whole site, or one lab test. Google weighs page experience after relevance, so the main cost is readers who tap the wrong thing or lose their place.",
    sources: [SOURCE.cls, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.cls.poor,
  },
  CWV_LCP_NEEDS_IMPROVEMENT_DESKTOP: {
    strategy: 'desktop',
    severity: 'notice',
    label: 'Largest Contentful Paint needs improvement on desktop',
    plain: {
      what: 'The main content is a bit slow to appear on computers',
      why: "On computers the page's main content takes over 2.5 seconds to appear, by Google's measurement. Speed is a small ranking signal; the bigger cost is visitors who leave before the page appears.",
      fix: 'Ask your developer to make the largest image or text block at the top the first thing the page loads, for example by compressing the image and loading it early.',
    },
    hint: 'On desktop the main image or text block takes longer than 2.5 s to appear; make it the first thing the page loads.',
    explanation:
      'Largest Contentful Paint (LCP) is how long the largest image or text block in the viewport takes to appear — the moment a visitor sees that the page has loaded. Google calls 2.5 s or less good and more than 4 s poor, judged at the 75th percentile of visits; this finding is about desktop visits, measured apart from phones because a computer loads and lays out the page differently. The value comes from PageSpeed Insights: real Chrome visitors to this page over the last 28 days where Google has enough of them, otherwise visitors to the whole site, otherwise one lab test. Google says it shows the most relevant content even when page experience is sub-par, so this is a small ranking signal; the larger cost is visitors who leave before the page appears.',
    sources: [SOURCE.lcp, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.lcp.good,
  },
  CWV_LCP_POOR_DESKTOP: {
    strategy: 'desktop',
    severity: 'warning',
    label: 'Largest Contentful Paint is poor on desktop',
    plain: {
      what: 'The main content takes too long to appear on computers',
      why: "On computers the main content takes over 4 seconds to appear, by Google's measurement, and many visitors leave before it does. Google counts it as a small ranking signal; the bigger loss is visitors.",
      fix: 'Ask your developer to shrink and preload the largest image or text block at the top, and to remove scripts that hold back the first paint.',
    },
    hint: 'On desktop the main image or text block takes longer than 4 s to appear; shrink it, serve it sooner, and drop what blocks it.',
    explanation:
      "Largest Contentful Paint (LCP) is how long the largest image or text block in the viewport takes to appear. More than 4 s at the 75th percentile of desktop visits is Google's poor band: a quarter of visitors on computers wait at least that long to see the page. The value comes from PageSpeed Insights — real visitors to this page, to the whole site when the page has too few, or one lab test. On desktop the usual causes are a slow server response, an oversized hero image, and scripts or stylesheets that hold back the first paint. Google shows the most relevant content even when page experience is sub-par, so the cost is mostly in visitors who give up.",
    sources: [SOURCE.lcp, SOURCE.optimizeLcp, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.lcp.poor,
  },
  CWV_INP_NEEDS_IMPROVEMENT_DESKTOP: {
    strategy: 'desktop',
    severity: 'notice',
    label: 'Interaction to Next Paint needs improvement on desktop',
    plain: {
      what: 'The page is a little slow to respond to clicks on computers',
      why: 'Data from real Chrome visitors shows at least a quarter of desktop visits wait over 0.2 seconds for the page to react to a click or key press. It is a small ranking signal; to visitors, a lagging page feels less reliable.',
      fix: 'Ask your developer to find and break up the long-running scripts that run while visitors use the page, including third-party ones.',
    },
    hint: 'On desktop clicks and key presses take longer than 200 ms to show a response; break up long scripts that run while the page is in use.',
    explanation:
      "Interaction to Next Paint (INP) is how long the page takes to respond visibly to a click, tap or key press, taken across the visit. Google calls 200 ms or less good and more than 500 ms poor, at the 75th percentile of visits; this finding is about desktop visits. Only real visitors measure it — a lab test loads the page but never uses it — so this value is Chrome's field data for this page, or for the whole site when the page has too few visits. It is a small ranking signal; to a visitor, a page that lags after a click feels broken.",
    sources: [SOURCE.inp, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.inp.good,
  },
  CWV_INP_POOR_DESKTOP: {
    strategy: 'desktop',
    severity: 'warning',
    label: 'Interaction to Next Paint is poor on desktop',
    plain: {
      what: 'The page responds sluggishly to clicks on computers',
      why: 'Data from real Chrome visitors shows at least a quarter of desktop visits wait over half a second for a response. Page experience is a small ranking signal; the bigger loss is visitors who click, see nothing happen, and leave.',
      fix: 'Ask your developer to find the scripts that block the page after it loads, often heavy third-party tools, and remove, delay or split them.',
    },
    hint: 'On desktop clicks and key presses take longer than 500 ms to show a response; find the scripts that block the page after it loads.',
    explanation:
      "Interaction to Next Paint (INP) is how long the page takes to respond visibly to a click, tap or key press. More than 500 ms at the 75th percentile of desktop visits is Google's poor band. The value is Chrome's field data for this page, or for the whole site when the page has too few visits — a lab test cannot measure it, because it never interacts with the page. Heavy third-party scripts, large pages and long tasks on the main thread are the usual causes. Page experience is a small ranking signal next to relevance; the bigger cost is visitors who click, see nothing happen, and leave.",
    sources: [SOURCE.inp, SOURCE.domSize, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.inp.poor,
  },
  CWV_CLS_NEEDS_IMPROVEMENT_DESKTOP: {
    strategy: 'desktop',
    severity: 'notice',
    label: 'Cumulative Layout Shift needs improvement on desktop',
    plain: {
      what: 'Content shifts around somewhat on computers while the page loads',
      why: 'Text that moves as images or ads load above it makes some readers on computers lose their place or click the wrong thing. Google treats it as a small ranking signal; it is mainly a reading-experience problem.',
      fix: 'Ask your developer to reserve space in the theme for images, embeds and ads, so the content stays put while they load.',
    },
    hint: 'On desktop content moves while the page loads; reserve space for images, embeds and ads before they arrive.',
    explanation:
      "Cumulative Layout Shift (CLS) scores how much visible content jumps around while the page is open — the text you were reading sliding down as an image or an ad loads above it. It is a unitless score: Google calls 0.1 or less good and more than 0.25 poor, at the 75th percentile of visits; this finding is about desktop visits, whose wider layout shifts differently from a phone's. The value comes from PageSpeed Insights — real visitors to this page, to the whole site when the page has too few, or one lab test, which only sees shifts during loading. It is a small ranking signal; to a reader, it is mis-clicks and a lost place.",
    sources: [SOURCE.cls, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.cls.good,
  },
  CWV_CLS_POOR_DESKTOP: {
    strategy: 'desktop',
    severity: 'warning',
    label: 'Cumulative Layout Shift is poor on desktop',
    plain: {
      what: 'The layout jumps a lot on computers while visitors are reading',
      why: "By Google's measurement, content on computers jumps enough that people click the wrong thing or lose their place. Google weighs page experience after relevance, so the main cost is frustrated readers, not rankings.",
      fix: 'Ask your developer to give images and embeds fixed sizes, stop banners and ads from pushing content down, and check web fonts that reflow the text.',
    },
    hint: 'On desktop content jumps a lot while the page loads; give images and embeds fixed dimensions and stop inserting content above what is being read.',
    explanation:
      "Cumulative Layout Shift (CLS) scores how much visible content jumps around while the page is open. More than 0.25 at the 75th percentile of desktop visits is Google's poor band. The usual causes are images and embeds without width and height, ads and banners injected above the content, and web fonts that reflow the text. The value comes from PageSpeed Insights — real visitors to this page, to the whole site, or one lab test. Google weighs page experience after relevance, so the main cost is readers who click the wrong thing or lose their place.",
    sources: [SOURCE.cls, SOURCE.pageSpeedInsights, SOURCE.pageExperience],
    max: CWV_THRESHOLDS.cls.poor,
  },
} as const satisfies Record<string, IPageSpeedIssueDefinition>;
