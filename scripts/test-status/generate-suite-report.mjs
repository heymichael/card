import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const suite = process.argv[2];

if (!suite) {
  throw new Error("Usage: node scripts/test-status/generate-suite-report.mjs <suite-slug>");
}

const artifactsDir = path.join(repoRoot, "artifacts");
const checksDir = path.join(artifactsDir, "checks");
const playwrightDir = path.join(artifactsDir, "playwright");

const suiteFiles = {
  "pr-checks": {
    title: "PR Checks",
    trigger: "on pull_request",
    environment: "ci",
  },
  "main-publish-checks": {
    title: "Main Publish Checks",
    trigger: "on push to main",
    environment: "ci",
  },
  "scheduled-regression": {
    title: "Scheduled Regression",
    trigger: "on schedule + workflow_dispatch",
    environment: "test",
  },
  "prod-monitor": {
    title: "Prod Monitor",
    trigger: "on schedule + workflow_dispatch",
    environment: "production",
  },
};

if (!suiteFiles[suite]) {
  throw new Error(`Unsupported suite '${suite}'`);
}

function readJsonOrNull(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function safe(value, fallback = "n/a") {
  return value == null || value === "" ? fallback : String(value);
}

const contractResult = readJsonOrNull(path.join(checksDir, `${suite}-contract.json`));
const artifactResult = readJsonOrNull(path.join(checksDir, `${suite}-artifact.json`));
const appPlaywright = readJsonOrNull(path.join(playwrightDir, "app-results.json"));
const docsPlaywright = readJsonOrNull(path.join(playwrightDir, "docs-results.json"));

const playwrightErrors = []
  .concat(appPlaywright?.errors || [])
  .concat(docsPlaywright?.errors || []);
const playwrightFailed = playwrightErrors.length;
const contractFailed = contractResult?.totals?.failed || 0;
const artifactFailed = artifactResult?.totals?.failed || 0;

const overallStatus =
  playwrightFailed === 0 && contractFailed === 0 && artifactFailed === 0 ? "pass" : "fail";

const nowUtc = new Date().toISOString();
const runUrl = process.env.GITHUB_RUN_ID
  ? `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
  : "";

const summaryPayload = {
  suite,
  status: overallStatus,
  lastRunUtc: nowUtc,
  runUrl,
  commitSha: process.env.GITHUB_SHA || "",
  counts: {
    playwrightFailed,
    contractFailed,
    artifactFailed,
  },
  notes: overallStatus === "pass" ? [] : ["One or more checks failed. See linked details."],
};

const summaryPath = path.join(repoRoot, "docs", "test-status", "summaries", `${suite}-summary.json`);
const contractHtmlPath = path.join(
  repoRoot,
  "docs",
  "test-status",
  "checks",
  `${suite}-contract-checks.html`,
);
const artifactHtmlPath = path.join(
  repoRoot,
  "docs",
  "test-status",
  "checks",
  `${suite}-artifact-checks.html`,
);
// Must match baseDocsPath in docs/index.html (e.g. /card/docs when integrated in platform)
const baseDocsPath = process.env.DOCS_BASE_PATH || "/card/docs";

const reportPath = path.join(repoRoot, "docs", "test-status", "reports", `${suite}.html`);
const playwrightDocsIndex = `${baseDocsPath}/test-status/playwright/${suite}/docs/index.html`;
const playwrightAppIndex = `${baseDocsPath}/test-status/playwright/${suite}/app/index.html`;
const playwrightDocsLocalPath = path.join(
  repoRoot,
  "docs",
  "test-status",
  "playwright",
  suite,
  "docs",
  "index.html",
);
const playwrightAppLocalPath = path.join(
  repoRoot,
  "docs",
  "test-status",
  "playwright",
  suite,
  "app",
  "index.html",
);

fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
fs.mkdirSync(path.dirname(contractHtmlPath), { recursive: true });
fs.mkdirSync(path.dirname(artifactHtmlPath), { recursive: true });
fs.mkdirSync(path.dirname(reportPath), { recursive: true });

fs.writeFileSync(summaryPath, `${JSON.stringify(summaryPayload, null, 2)}\n`);

function renderCheckHtml(title, result) {
  const rows = (result?.checks || [])
    .map(
      (item) =>
        `<tr><td>${item.ok ? "pass" : "fail"}</td><td>${item.label}</td><td>${safe(item.detail)}</td></tr>`,
    )
    .join("\n");
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${title}</h1>
    <p>Status: ${safe(result?.status, "not-run")}</p>
    <table border="1" cellpadding="6" cellspacing="0">
      <thead><tr><th>Result</th><th>Check</th><th>Detail</th></tr></thead>
      <tbody>${rows}</tbody>
    </table>
  </body>
</html>
`;
}

fs.writeFileSync(
  contractHtmlPath,
  renderCheckHtml(`${suiteFiles[suite].title} Contract Checks`, contractResult),
);
fs.writeFileSync(
  artifactHtmlPath,
  renderCheckHtml(`${suiteFiles[suite].title} Artifact Checks`, artifactResult),
);

const docsReportAvailable = fs.existsSync(playwrightDocsLocalPath);
const appReportAvailable = fs.existsSync(playwrightAppLocalPath);

const reportHtml = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="robots" content="noindex, nofollow, noarchive" />
    <title>${suiteFiles[suite].title} Report</title>
    <style>
      .playwright-frame {
        width: 100%;
        min-height: 820px;
        border: 1px solid #d1d5db;
        border-radius: 8px;
      }
      .playwright-note {
        color: #374151;
      }
    </style>
  </head>
  <body>
    <h1>${suiteFiles[suite].title} Report</h1>
    <h2>Additional Checks</h2>
    <ul>
      <li><a href="${baseDocsPath}/test-status/summaries/${suite}-summary.json">Run summary JSON</a></li>
      <li><a href="${baseDocsPath}/test-status/checks/${suite}-contract-checks.html">Contract checks output</a></li>
      <li><a href="${baseDocsPath}/test-status/checks/${suite}-artifact-checks.html">Artifact checks output</a></li>
      <li>Run URL: ${runUrl ? `<a href="${runUrl}">${runUrl}</a>` : "local"}</li>
    </ul>
    <h2>Playwright Output</h2>
    ${
      docsReportAvailable
        ? `<h3>Docs Shell Suite</h3><iframe class="playwright-frame" src="${playwrightDocsIndex}" title="${suite} docs playwright report"></iframe>`
        : `<p class="playwright-note">Docs Shell Playwright report is not available for this run.</p>`
    }
    ${
      appReportAvailable
        ? `<h3>Card App Suite</h3><iframe class="playwright-frame" src="${playwrightAppIndex}" title="${suite} app playwright report"></iframe>`
        : `<p class="playwright-note">Card App Playwright report is not available for this run.</p>`
    }
  </body>
</html>
`;
fs.writeFileSync(reportPath, reportHtml);

const catalogPath = path.join(repoRoot, "docs", "test-status", "catalog.json");
const catalog = JSON.parse(fs.readFileSync(catalogPath, "utf8"));
catalog.reports = (catalog.reports || []).map((entry) => {
  if (entry.slug !== suite) return entry;
  return {
    ...entry,
    status: overallStatus,
    lastRunUtc: nowUtc,
    summaryUrl: `${baseDocsPath}/test-status/summaries/${suite}-summary.json`,
    reportUrl: `${baseDocsPath}/test-status/reports/${suite}.html`,
    contractChecksUrl: `${baseDocsPath}/test-status/checks/${suite}-contract-checks.html`,
    artifactChecksUrl: `${baseDocsPath}/test-status/checks/${suite}-artifact-checks.html`,
  };
});
fs.writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`);

console.log(`Generated test-status snapshot for suite '${suite}'`);
