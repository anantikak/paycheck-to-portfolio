# Paycheck to Portfolio: rules for Claude Code

A free financial-literacy site for U.S. high school students, built by a Georgetown MBA team for an ethics project. It is a static site with plain HTML, CSS, and JavaScript, so there is no build step.

## Files
- `index.html`: all lesson text, the quiz markup, and the numbered source list (`<li id="sN">`)
- `styles.css`: design tokens at the top (`:root`) with light and dark themes
- `app.js`: the four calculators (budget, emergency fund, credit card payoff, growth) and the quiz

## Non-negotiable content rules
1. Every factual claim needs a citation like `<sup class="cite"><a href="#sN">N</a></sup>` that points to a source in the list.
2. Use primary sources only: SEC/Investor.gov, CFPB, FDIC, NCUA, IRS, SSA, DOL, Federal Reserve, FTC, Federal Register, and FINRA/SIPC/myFICO where they are the authority. No blogs, news, or product sites.
3. Before adding or changing a fact, fetch the source page and quote the sentence that supports it. If you can't find support, don't add the fact. Tell me instead.
4. Keep the source's qualifiers ("potential", "about", "on average", "may"). Never round up certainty.
5. Mark year-specific numbers with their year (for example, 2026 IRA limit $7,500), and update the "Fact-checked" date when facts change.
6. This is education, not advice. Don't name or recommend companies or products, don't add affiliate links, and don't tell readers what they should do with their money.
7. No tracking, cookies, sign-ups, or collection of personal data.
8. Calculators must show their assumptions in the fine print. After changing calculator math, test it with a known example (for example, $100 at 5% for 2 years = $110.25).

## After any content change
Run an independent review pass. A separate subagent re-fetches every cited URL and reports claims that are unsupported, overstated, or out of date. Fix everything it finds before deploying.
