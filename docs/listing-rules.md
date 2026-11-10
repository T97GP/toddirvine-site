# Listing display rules (must-follow checklist)

Todd's standing instruction (Nov 10, 2026): when the Pillar 9 IDX listings are
connected, the build must follow the Pillar 9 Internet Rules (01/2025) and the
terms and conditions that come with the data licence. Check every item below
before any listing page goes live. If a rule and a design idea conflict, the
rule wins. The source PDFs are Todd's; ask him for them, do not commit them.

## Before anything goes live
- [ ] Pillar 9 has inspected the site and confirmed in writing that the licence is in effect.
- [ ] Pillar 9 has been given a way to reach every listing page to check it, at any time.
- [ ] Feed login is stored only as an encrypted environment variable. Never in code, chat or this repo.

## What may be shown
- [ ] Active listings only. Nothing in any off-market status. No archive of old listings.
- [ ] No sold data on public (no-login) pages.
- [ ] Never show: seller or occupant names, phone numbers or emails; remarks meant for brokers only (showing or security instructions).
- [ ] Never show the address of a listing whose seller asked for it to be withheld from the internet.
- [ ] Listings may be left out only on objective criteria (property type, price, location).

## How each listing must look
- [ ] Listing brokerage shown on every listing, including thumbnails and cards.
- [ ] Listing brokerage in the same font and size as the other listing details, and not visually separated from them.
- [ ] Field values are shown exactly as supplied. No editing, rewording, "improving" or obscuring of data, disclaimers or notices.
- [ ] Any added data that is not from the feed is clearly labelled with its source.
- [ ] If listings from any other source are ever shown, each one names its source.

## Notices on every page that shows listing data
- [ ] "Data is deemed reliable but is not guaranteed accurate by Pillar 9."
- [ ] Date of the last data update.
- [ ] Pillar 9 copyright line and the MLS® / REALTOR® trademark notices.
- [ ] Brokerage and licensee disclosure (Real Broker, Todd Richard Irvine).
- [ ] Link to the privacy policy, which says how visitor information is collected, used and disclosed.

## Freshness and limits
- [ ] Data refreshed at least every 24 hours. If a sync fails and data would be older than 24 hours, listings come down until it is fixed.
- [ ] A search returns at most 500 active listings, 50 per page.
- [ ] Feed requests stay at or under 1,500 records and 1,500 images per query, and are kept as light as possible on Pillar 9's systems.

## Protecting the data
- [ ] Reasonable anti-scraping measures (rate limiting, bot checks, monitoring).
- [ ] No RSS feeds or syndication of listing data.
- [ ] Listing data is not passed to, sold to, or made reachable by any third party.
- [ ] Listing data is stored only as far as needed to run the site, and deleted when Pillar 9's retention limits say so.
- [ ] No derivative products built from the data. That includes area price statistics and market reports made from the feed, unless Pillar 9 agrees in writing first.

## Wording on the site
- [ ] The site may say it shows Pillar 9 listing data with Pillar 9's permission. It must not suggest Pillar 9 endorses, supports or approves Todd or the site.
- [ ] Any sign-up or terms of use must not create a fee or a representation agreement by a click.
- [ ] Visitor details are handled under Alberta's PIPA.

## Ongoing
- [ ] If Pillar 9 reports a problem, fix it right away. A complaint about a public site must be fixed within 7 business days or MLS® services can be cut off; issues from an inspection or audit within 30 days.
- [ ] Re-check this list whenever Pillar 9 updates its rules.
