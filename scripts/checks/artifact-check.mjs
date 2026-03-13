import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const suite = process.argv[2] || "pr-checks";
const outputPath =
  process.argv[3] ||
  path.join(repoRoot, "artifacts", "checks", `${suite}-artifact.json`);

function readJson(relPath) {
  return JSON.parse(fs.readFileSync(path.join(repoRoot, relPath), "utf8"));
}

function exists(relPath) {
  return fs.existsSync(path.join(repoRoot, relPath));
}

function check(label, ok, detail) {
  return { label, ok, detail };
}

const checks = [];

try {
  const manifest = readJson("docs/artifact-manifest.example.json");
  checks.push(check("artifact manifest parses", true, "docs/artifact-manifest.example.json"));
  checks.push(check("manifest has app_id", typeof manifest.app_id === "string", "app_id"));
  checks.push(check("manifest has version", typeof manifest.version === "string", "version"));
  checks.push(
    check(
      "manifest has compatibility.platform_contract_version",
      Boolean(manifest.compatibility?.platform_contract_version),
      "compatibility.platform_contract_version",
    ),
  );
} catch (error) {
  checks.push(
    check(
      "artifact manifest parses",
      false,
      `parse failure: ${error instanceof Error ? error.message : String(error)}`,
    ),
  );
}

try {
  const schema = readJson("docs/artifact-manifest.schema.json");
  checks.push(
    check(
      "artifact schema parses",
      schema.type === "object",
      "docs/artifact-manifest.schema.json",
    ),
  );
} catch (error) {
  checks.push(
    check(
      "artifact schema parses",
      false,
      `parse failure: ${error instanceof Error ? error.message : String(error)}`,
    ),
  );
}

[
  "docs/architecture.html",
  "hosting/public/docs/index.html",
  "hosting/public/docs/architecture.html",
].forEach((requiredPath) => {
  checks.push(check(`generated/synced artifact exists: ${requiredPath}`, exists(requiredPath), requiredPath));
});

const failed = checks.filter((item) => !item.ok);
const result = {
  suite,
  type: "artifact",
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
