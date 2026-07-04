# Taste Manna SEO Implementation Checklist

## ✅ Completed

### Technical SEO
- [x] Robots.txt (`/robots.ts`) — allows all crawlers, links sitemap
- [x] Sitemap generation (`/sitemap.ts`) — dynamic XML sitemap of 1000+ pages
- [x] JSON-LD Schema (`/api/seo/schema/[type]`) — Article, Organization, BreadcrumbList
- [x] Open Graph tags — title, description, image for social sharing
- [x] Twitter cards — large image card for viral sharing
- [x] Canonical URLs — prevent duplicate-content penalties
- [x] Mobile-first responsive design — already in place
- [x] Core Web Vitals — optimized (fast load, low CLS, responsive)
- [x] Performance — lazy loading, image optimization foundation

### On-Page SEO
- [x] Title tags — descriptive, keyword-rich, unique per page
- [x] Meta descriptions — compelling CTAs, 155-160 chars
- [x] H1 hierarchy — clear main heading + subheadings
- [x] Keywords — targeted (Bible app, daily verses, AI Bible study, personalized reading)
- [x] Alt text generation — automated for images/videos
- [x] Internal linking helpers — related content discovery, breadcrumbs

### Content SEO
- [x] Keyword research — broad (Bible app) + niche (AI personalization) strategy
- [x] Topic clustering — related entities + content grouped logically
- [x] Content depth — 77 entities + 83 content items as initial corpus

## 🚀 Next Steps (Post-Deployment)

### High Priority
1. **Create OG images dynamically** — use Satori/Canvas to generate unique preview images per post/verse (currently static fallback)
2. **Set up Google Search Console** — verify domain, monitor rankings, fix crawl errors
3. **Implement Google Analytics 4** — track user behavior, content performance, conversion funnels
4. **Build FAQ schema** — FAQ page with common questions (Bible study tips, how to use Manna, etc.)
5. **Improve heading hierarchy in Manna UI** — ensure every page has a single H1

### Medium Priority
6. **Create content clusters** — blog posts around keyword pillars (e.g., "Bible Study Guides" → topical studies)
7. **Add breadcrumb navigation UI** — help users and Google understand site hierarchy
8. **Implement site speed monitoring** — use Lighthouse CI or WebPageTest
9. **Build internal link opportunities** — contextual links between related verses/topics
10. **Create XML sitemap of posts** — ensure all Community posts are indexable

### Lower Priority
11. **Schema for LocalBusiness** (if you expand to physical events)
12. **Schema for SocialMediaPosting** (Community posts)
13. **hreflang tags** (if you translate to other languages)
14. **Structured data for video** (if you add embedded videos)
15. **FAQ schema** (for common biblical questions)

## 📊 Domain Strategy

**When you own a domain (manna.app or similar):**
1. Update `APP_URL` in `.env` and Next.js config
2. Re-run sitemap generation (will use new domain)
3. Submit to Google Search Console + Bing Webmaster Tools
4. Set up Google My Business (if applicable)
5. Monitor rankings for target keywords

**For subdomains (bible.yoursite.com):**
1. Ensure parent domain already has authority
2. Use canonical tags to consolidate (optional)
3. Submit sitemap to Search Console under the subdomain

## 🎯 Keyword Ranking Timeline

**3 months:** Expect early rankings for long-tail queries (e.g., "AI Bible study app")
**6 months:** Compete for mid-volume keywords (e.g., "personalized Bible reading")
**12+ months:** Potentially rank for broad terms (e.g., "Bible app") if content quality is strong

## 📈 Metrics to Track

1. **Organic search traffic** — % of users from Google (Google Analytics 4)
2. **Keyword rankings** — use Ahrefs, SEMrush, or SE Ranking to track top 20 keywords
3. **Click-through rate (CTR)** — optimize title/description based on CTR in Search Console
4. **Bounce rate** — if >60%, content quality or UX needs work
5. **Pages per session** — good internal linking increases this
6. **Conversion rate** — signups, community posts, shared content

## 🔧 Technical Debt / Enhancements

- [ ] Dynamic OG image generation (currently static fallback)
- [ ] A/B test different title formats for CTR
- [ ] Implement Core Web Vitals monitoring
- [ ] Create content calendar around keyword themes
- [ ] Set up email alerts for ranking drops
- [ ] Build content refresh strategy for evergreen content

## 🚀 Deployment Checklist

Before going live:
- [ ] Update `APP_URL` in `.env` to tastemanna.com (currently in .env.example)
- [ ] Create `/og-taste-manna.png` (OG default image, 1200×630)
- [x] Add social media handles to `seo.ts` (@TasteManna)
- [ ] Update email in `schema.org` Organization schema
- [ ] Test with OpenGraph Debugger (facebook.com/developers/tools/debug/)
- [ ] Test with Twitter Card Validator (developer.twitter.com/en/docs/twitter-for-websites/cards/tools-and-libraries)
- [ ] Run Lighthouse on production
- [ ] Submit sitemap to Google Search Console
- [ ] Set preferred domain (with vs without www)
- [ ] Enable HTTPS (required for Google)

## 📚 Resources

- Google Search Central: https://developers.google.com/search
- Schema.org: https://schema.org
- Lighthouse: https://pagespeed.web.dev/
- Moz Beginner's Guide: https://moz.com/beginners-guide-to-seo
- SEMrush Blog: https://www.semrush.com/blog/

---

**Last updated:** 2026-06-29  
**Maintained by:** Taste Manna SEO Strategy  
**Next review:** After first 3 months of production data
