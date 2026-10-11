import { SEO_ISSUE_CATALOGUE } from "@app/contracts";
import { type TGuideCode } from "@Core/Constants/checkTopics";
import { type ICheckCriteria } from "../criteriaShape";

/** The bar, from the catalogue: 102 400 bytes. */
const KIB = SEO_ISSUE_CATALOGUE.IMAGE_DELIVERY_INEFFICIENT.min / 1024;

/** Lighthouse's image-delivery estimate: a speed finding from the mobile measurement. */
export const IMAGE_DELIVERY_CRITERIA = {
	IMAGE_DELIVERY_INEFFICIENT: {
		passes: `Lighthouse's "Improve image delivery" audit passes, or estimates less than ${KIB} KiB to save across the page's images.`,
		fails: `The audit fails and estimates at least ${KIB} KiB that the page's images could lose.`,
		ifPasses:
			"Images arrive at the size they are shown and in a compact format, so the page — and above all its largest image, which often sets its LCP — loads sooner on mobile data.",
		example: {
			good: '<img src="/img/hero-800.avif" width="800" height="450"\n     srcset="/img/hero-800.avif 800w, /img/hero-1600.avif 1600w"\n     sizes="(max-width: 800px) 100vw, 800px" alt="…">',
			bad: '<img src="/img/hero-4000.jpg" width="800" height="450" alt="…">\n<!-- a 4000-pixel JPEG drawn 800 pixels wide -->',
			lang: "html",
		},
		howChecked: `After each crawl the page is measured with Google PageSpeed Insights on mobile, and the tracker reads Lighthouse's image-delivery-insight audit from that same answer. The finding is raised when the audit scores below 1 and its estimated savings (the audit's own total) reach ${KIB} KiB; up to ten images are listed, the largest saving first. It is a lab estimate from one simulated phone, never measured on desktop, and like every speed finding it never changes the SEO score.`,
		manualCheck: [
			"Open PageSpeed Insights (https://pagespeed.web.dev), enter the page URL and choose Mobile.",
			'Under Diagnose, open "Improve image delivery": it names each image, its size and the bytes it could lose.',
			"Compare an image's file size with the space it fills on screen: a photo several times wider than its box is the usual cause.",
		],
	},
} satisfies Partial<Record<TGuideCode, ICheckCriteria>>;
