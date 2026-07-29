const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (relativePath) =>
  fs.readFileSync(path.join(root, relativePath), "utf8");

test("homepage promotes the Cloud Drive paper and article", () => {
  const html = read("index.html");
  assert.match(
    html,
    /Can the Cloud Drive\? Infrastructure Feasibility of Offloading Autonomous Driving Across 5G and 6G/
  );
  assert.equal((html.match(/href="cloud-drive\/"/g) || []).length, 3);
  assert.match(html, /href="https:\/\/arxiv\.org\/pdf\/2607\.09045"/);
  assert.match(html, /arXiv:2607\.09045/);
});
