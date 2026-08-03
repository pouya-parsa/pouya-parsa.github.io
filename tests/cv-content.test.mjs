import test from "node:test";
import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "PouyaParsa_CV.tex");
const pdfPath = path.join(root, "PouyaParsa_CV.pdf");
const publicationTitles = [
  "Visual Distribution Anchoring for Efficient Prompt Tuning",
  "Can the Cloud Drive? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G",
  "Video-based Vehicle Surveillance in the Wild: License Plate, Make, and Model Recognition with Self Reflective Vision-Language Models",
  "Where2Start: Leveraging Initial States for Robust and Sample-Efficient Reinforcement Learning",
];
const pdfPublicationMarkers = [
  "Visual Distribution Anchoring for Efficient Prompt Tuning",
  "Can the Cloud Drive? Infrastructure Feasibility",
  "Video-based Vehicle Surveillance in the Wild",
  "Where2Start: Leveraging Initial States",
];

const normalize = (value) => value.replace(/\s+/g, " ").trim();

test("CV source contains only the approved contact and research-interest details", () => {
  assert.equal(fs.existsSync(sourcePath), true, "PouyaParsa_CV.tex is missing");
  const source = fs.readFileSync(sourcePath, "utf8");

  assert.match(source, /mailto:parsa025@umn\.edu/);
  assert.match(source, /https:\/\/pouya-parsa\.github\.io/);
  assert.match(source, /https:\/\/github\.com\/pouya-parsa/);
  assert.match(
    normalize(source),
    /Research Interests:.*Vision-Language Models.*Memory-Augmented Large Language Models/
  );
  assert.doesNotMatch(source, /Long-context AI systems/i);
  assert.doesNotMatch(source, /\+?989046444142/);
  assert.doesNotMatch(source, /pouya\.parsa@aut\.ac\.ir/i);

  for (const title of publicationTitles) {
    assert.ok(normalize(source).includes(title), `source is missing: ${title}`);
  }
  assert.match(source, /5\.72\\%/);
  assert.doesNotMatch(source, /20\\% over CNN-based baselines/);
});

test("published CV mirrors the approved source content and links", () => {
  assert.equal(fs.existsSync(pdfPath), true, "PouyaParsa_CV.pdf is missing");
  const text = execFileSync("pdftotext", ["-layout", pdfPath, "-"], {
    encoding: "utf8",
  });
  const normalizedText = normalize(text);
  const digitStream = text.replace(/\D/g, "");
  const info = execFileSync("pdfinfo", [pdfPath], { encoding: "utf8" });
  const urls = execFileSync("pdfinfo", ["-url", pdfPath], {
    encoding: "utf8",
  });

  assert.match(normalizedText, /parsa025@umn\.edu/);
  assert.match(
    normalizedText,
    /Research Interests: Vision-Language Models.*Memory-Augmented Large Language Models/
  );
  assert.doesNotMatch(normalizedText, /Long-context AI systems/i);
  assert.ok(!digitStream.includes("989046444142"), "old phone number remains");
  assert.doesNotMatch(normalizedText, /pouya\.parsa@aut\.ac\.ir/i);

  for (const marker of pdfPublicationMarkers) {
    assert.ok(normalizedText.includes(marker), `PDF is missing: ${marker}`);
  }

  const pages = Number(info.match(/^Pages:\s+(\d+)$/m)?.[1]);
  assert.ok(pages >= 2 && pages <= 3, `expected 2-3 pages, received ${pages}`);

  for (const url of [
    "mailto:parsa025@umn.edu",
    "https://pouya-parsa.github.io",
    "https://github.com/pouya-parsa",
    "https://arxiv.org/abs/2607.28967",
    "https://arxiv.org/abs/2607.09045",
    "https://arxiv.org/abs/2508.01387",
    "https://arxiv.org/abs/2311.15089",
  ]) {
    assert.ok(urls.includes(url), `PDF annotation is missing: ${url}`);
  }
  assert.doesNotMatch(urls, /tel:/i);
});
