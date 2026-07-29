# Cloud Drive VLA and Roofline Content Design

**Date:** 2026-07-29
**Status:** Approved for implementation planning
**Paper:** [Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G](https://arxiv.org/abs/2607.09045)

## Goal

Make the Cloud Drive article easier to understand while giving substantially
more attention to the paper's Roofline GPU service model, VLA inference time,
and HBM-bandwidth bottleneck.

The page will keep its three-gate narrative:

1. communication,
2. compute and latency,
3. cost.

Gate 2 will receive a dedicated plain-language explainer. Communication and
cost will remain necessary parts of the deployment sequence, but they will
support a clearer central lesson: near-term autoregressive VLA inference waits
on repeated GPU memory reads, so faster radio access alone cannot make it meet
a reactive driving deadline.

## Audience

The primary audience is broad but technical: researchers, engineers,
recruiters, students, and readers familiar with machine learning but not
necessarily GPU architecture or vehicular edge computing.

The article must define specialized terms when they first appear and must not
assume that readers already understand Roofline analysis, HBM, autoregressive
decoding, or a closed-loop latency budget.

## Editorial Principles

- State the conclusion before the mechanism.
- Use one main idea per sentence.
- Prefer concrete verbs such as "upload," "read," "wait," "return," and
  "cost."
- Define an acronym or technical term on first use.
- Keep exact numbers in compact callouts rather than dense paragraphs.
- Replace abstract phrases with plain equivalents:
  - "binding gate" becomes "first failing test" in explanatory prose;
  - "admissible branch" becomes "scenario that passes";
  - "reactive corridor" becomes "100 ms deadline";
  - "memory-bandwidth-bound" is immediately explained as waiting for model
    weights to move through GPU memory.
- Retain technical terms where they aid discovery, citation, or precision.
- Preserve the distinction between the deterministic floor and the full
  latency result, which also includes network and queueing tails.
- Preserve the onboard 100 ms reactive-fallback caveat for every 300 ms
  deliberative result.

## Page Structure

The page order and existing academic visual system remain intact. The only new
top-level content block is a dedicated compute explainer placed immediately
after the three gate cards and before the simulator.

### Direct headline system

The official paper title remains unchanged. Supporting headlines become
shorter and more literal:

| Current headline | Revised headline |
| --- | --- |
| Can autonomous-driving inference move to the cloud? | Can the cloud run an autonomous-driving model? |
| Three constraints bind—one after another. | Cloud driving must pass three tests. |
| Dense cells run out of uplink first. | Can the network upload the data? |
| More bandwidth cannot outrun a memory wall. | Can the GPU respond in time? |
| Only feasible branches earn a cost comparison. | Is the cloud cheaper? |
| Which gate binds your scenario? | Test a cloud-driving scenario. |
| Three offloading strategies trade bandwidth for onboard compute. | Choose where the model splits. |
| Explore all ten paper figures. | See the evidence from the paper. |
| Five findings to carry forward. | Five takeaways. |
| What this analysis does not claim. | What this study does not prove. |
| Quick answers about cloud driving. | Questions about cloud driving. |

Existing supporting kickers remain when they add orientation. Any kicker that
repeats its revised headline will be rewritten as a short section label.

## Expanded Gate 2 Content

### Placement and identity

Add a semantic section with `id="compute-roofline"` immediately after the
three gate cards. The section belongs to the compute story, not to a fourth
gate.

- Kicker: "Why VLA compute is slow"
- Headline: "VLA waits on memory, not just math."

### Plain-language explanation

The main explanation will establish:

1. A vision-language-action (VLA) model connects visual perception, language
   reasoning, and driving actions in one large model.
2. The paper's Roofline model separates time spent on GPU arithmetic from time
   spent moving model weights through high-bandwidth memory (HBM).
3. The encoder and prefill stages mainly consume arithmetic throughput.
4. The autoregressive decoder produces reasoning and trajectory outputs one
   step at a time. Each step reads large model weights again.
5. Those repeated reads dominate the measured time, so adding more arithmetic
   throughput or radio bandwidth does not remove the bottleneck.

The explanation will include the following plain-language sentences:

> The VLA decoder generates an action one step at a time. At every step, the
> GPU must read the model weights from high-bandwidth memory again.

### Technical callout

Use a compact three-part callout for the paper's 2025 B300 raw-sensor
offloading example:

- **39 ms — Do the math:** the compute-only estimate for encoder and prefill.
- **+114 ms — Read the weights:** autoregressive reasoning and trajectory
  decoding, limited by HBM bandwidth.
- **153 ms — Cloud inference:** the memory-aware total before the rest of the
  closed driving loop.

The callout must label its scope: the FP16, dense, single-request
autoregressive VLA stack calibrated in the paper. It must not present these
values as universal VLA performance.

The surrounding copy will also retain the broader result:

- the 2025 deterministic VLA floor is 132–164 ms across S1–S3;
- the deterministic floor first falls below 100 ms around 2027;
- the floor is a lower bound because network and queueing tails still have to
  fit;
- at the dense NYC reference point, 6G admits VLA-S2 around 2028, while
  5G-Advanced does not clear the same reactive case.

### Visual evidence

Reuse `images/cloud-drive/figure-08.svg` in the new compute explainer. The
visual will link to the stable `#figure-8` anchor for the full official caption.
The existing Figure 8 card remains in the ten-figure gallery.

The new supporting label will explain the two panels directly:

- left: when each model fits the 100 ms or 300 ms deadline;
- right: why VLA decoding shrinks with memory bandwidth rather than arithmetic
  throughput.

No new chart or scientific calculation is introduced.

## Supporting Copy Revisions

### Three gate cards

Each gate card will lead with a direct question and a one-sentence answer.
Gate 2 will point to `#compute-roofline`. The cards remain balanced summaries;
the detailed Roofline explanation will not be forced into the middle card.

### Simulator

Keep all inputs, presets, calculations, caveats, and results unchanged.
Simplify explanatory labels where possible, but retain explicit pass/fail
states and the scientific terminology needed to interpret the output.

### Figures and findings

Keep all ten official figures, stable anchors, full captions, alt text,
categories, and enlargement controls. Simplify the adjacent "Why it matters"
sentences and the findings list so each states one conclusion.

### FAQ

Rewrite answers into short, direct paragraphs and add:

**What does the Roofline model show for VLA inference?**

The answer will define compute time versus memory-read time, state that the
approximately 114 ms decode term dominates the paper's 2025 example, and
explain that this is why faster 5G or 6G cannot solve the compute gate.

The visible FAQ and FAQPage structured data must remain synchronized.

### Homepage

Rewrite the portfolio publication summary so it leads with the VLA result:
the paper shows that cloud VLA inference can be limited by GPU memory bandwidth
even after the network can carry the workload. Keep both the interactive
article and paper links.

## SEO and GEO

Preserve the official title, authors, arXiv identifier, canonical URL,
Open Graph image, citation metadata, sitemap entry, and robots rules.

Update the article description, Open Graph description, X description, and
ScholarlyArticle description to naturally include:

- VLA inference,
- Roofline GPU model,
- HBM or GPU memory bandwidth,
- autoregressive decoding,
- compute latency,
- autonomous driving,
- 5G and 6G.

Do not keyword-stuff. The visible introduction, compute section, FAQ, figure
explanation, and metadata must describe the same central claim in consistent
language so search and answer engines can extract it reliably.

## Visual Treatment

The existing light academic design remains unchanged. Add only the styles
needed for the compute explainer:

- a two-column desktop layout with explanation and Figure 8;
- a restrained three-number callout;
- a single-column mobile layout;
- the existing cobalt accent and neutral card system;
- visible focus, 44 px interactive targets, reduced-motion behavior, and
  print compatibility.

The new section must feel like part of the paper page, not a dashboard or a
standalone interactive demo.

## Data and Interaction Boundaries

- `scripts/cloud-drive-model.js` remains the source of simulator formulas and
  thresholds.
- `scripts/cloud-drive.js` remains unchanged unless a verification failure
  proves a controller change is necessary.
- The new section is static, semantic HTML and does not duplicate calculations
  in JavaScript.
- The figure gallery, dialog, filters, presets, URL sharing, and sticky
  navigation must continue to work.

## Verification

Automated content tests will verify:

- the `#compute-roofline` section and direct headline contracts;
- the 39 ms, 114 ms, 153 ms, and 132–164 ms statements with their scope;
- the Roofline/HBM/VLA terms in visible content and discovery metadata;
- synchronization of the visible and structured-data FAQ;
- preservation of all ten figure cards and stable `#figure-N` anchors;
- preservation of no-JavaScript narrative, figures, citation, and simulator
  fallback;
- no scientific constants added to the interaction controller.

The complete Node test suite and syntax checks must pass. Browser verification
will cover desktop and 390 px mobile rendering, section balance, Figure 8
linking, sticky navigation, horizontal overflow, console errors, and local
asset loading.

## Non-Goals

- Reordering or replacing the three-gate framework.
- Changing the simulator's model or numerical outputs.
- Adding a Roofline calculator, animation, or new interactive visualization.
- Rewriting the official paper title or citation.
- Removing communication, cost, limitations, or safety context.
- Claiming the calibrated VLA timing applies to every architecture, precision,
  decoder, GPU, or deployment.
