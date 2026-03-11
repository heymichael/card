import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const suite = process.argv[2] || "pr-checks";
const outputPath =
  process.argv[3] ||
  path.join(repoRoot, "artifacts", "checks", `${suite}-contract.json`);

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function check(label, ok, detail) {
  return { label, ok, detail };
}

const checks = [];

try {
  const catalogRaw = fs.readFileSync(
    path.join(repoRoot, "docs/test-status/catalog.json"),
    "utf8",
  );
  const catalog = JSON.parse(catalogRaw);
  const reports = Array.isArray(catalog.reports) ? catalog.reports : [];
  checks.push(
    check(
      "test-status catalog parses",
      reports.length > 0,
      `reports count=${reports.length}`,
    ),
  );

  reports.forEach((report) => {
    const urls = [
      report.reportUrl,
      report.summaryUrl,
      report.contractChecksUrl,
      report.artifactChecksUrl,
    ].filter(Boolean);
    urls.forEach((urlValue) => {
      const normalized = String(urlValue)
        .replace(/^\/card\/docs\//, "docs/")
        .replace(/^\/docs\//, "docs/");
      checks.push(
        check(
          `linked file exists (${report.slug})`,
          exists(normalized),
          normalized,
        ),
      );
    });
  });
} catch (error) {
  checks.push(
    check(
      "test-status catalog parses",
      false,
      `parse failure: ${error instanceof Error ? error.message : String(error)}`,
    ),
  );
}

const docsIndex = fs.readFileSync(path.join(repoRoot, "docs/index.html"), "utf8");
["test-status", "priorities", "learnings", "requirements", "testing", "architecture"].forEach(
  (tab) => {
    checks.push(
      check(
        `docs tab present: ${tab}`,
        docsIndex.includes(`data-tab-key="${tab}"`),
        "docs/index.html",
      ),
    );
  },
);

["docs/requirements/catalog.json", "docs/testing/catalog.json"].forEach((requiredPath) => {
  checks.push(check(`required catalog exists: ${requiredPath}`, exists(requiredPath), requiredPath));
});

const failed = checks.filter((item) => !item.ok);
const result = {
  suite,
  type: "contract",
  status: failed.length === 0 ? "pass" : "fail",
  generatedAtUtc: new Date().toISOString(),
  totals: { passed: checks.length - failed.length, failed: failed.length },
  checks,
};

fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`);

if (failed.length > 0) {
  process.exitCode = 1;
}
