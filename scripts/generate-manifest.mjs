#!/usr/bin/env node
/**
 * Generate artifact-manifest.json for a versioned publish.
 *
 * Usage:
 *   node scripts/generate-manifest.mjs \
 *     --bucket  <gcs-bucket-name> \
 *     --sha     <commit-sha>      \
 *     --version <semver+build>     \
 *     --out     <output-path>       (default: artifacts/publish/manifest.json)
 *
 * Reads checksums from artifacts/publish/checksums.txt.
 * Validates output against docs/artifact-manifest.schema.json.
 */
import fs from "node:fs";
import path from "node:path";
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    bucket:  { type: "string" },
    sha:     { type: "string" },
    version: { type: "string" },
    out:     { type: "string", default: "artifacts/publish/manifest.json" },
  },
  strict: true,
});

const required = ["bucket", "sha", "version"];
for (const key of required) {
  if (!values[key]) {
    console.error(`ERROR: --${key} is required`);
    process.exit(1);
  }
}

const checksumPath = path.resolve("artifacts/publish/checksums.txt");
if (!fs.existsSync(checksumPath)) {
  console.error("ERROR: checksums.txt not found — run package-artifacts.sh first.");
  process.exit(1);
}

const checksumLines = fs.readFileSync(checksumPath, "utf8").trim().split("\n");
const checksums = {};
for (const line of checksumLines) {
  const [hash, file] = line.split(/\s+/);
  checksums[file] = hash;
}

const runtimeChecksum = checksums["runtime.tar.gz"];
const docsChecksum = checksums["docs.tar.gz"];
if (!runtimeChecksum || !docsChecksum) {
  console.error("ERROR: Could not find expected checksums in checksums.txt");
  process.exit(1);
}

const prefix = `gs://${values.bucket}/card/versions/${values.sha}`;

const manifest = {
  app_id: "card",
  version: values.version,
  commit_sha: values.sha,
  published_at: new Date().toISOString(),
  artifact: {
    runtime_uri: `${prefix}/runtime.tar.gz`,
    docs_uri: `${prefix}/docs.tar.gz`,
    checksum_sha256: runtimeChecksum,
  },
  compatibility: {
    platform_contract_version: "v1",
  },
};

const schemaPath = path.resolve("docs/artifact-manifest.schema.json");
if (fs.existsSync(schemaPath)) {
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf8"));
  const requiredFields = schema.required || [];
  const missing = requiredFields.filter((f) => !(f in manifest));
  if (missing.length > 0) {
    console.error(`ERROR: Manifest missing required fields: ${missing.join(", ")}`);
    process.exit(1);
  }
  console.log("Schema field presence check passed.");
}

const outPath = path.resolve(values.out);
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + "\n");
console.log(`Manifest written to ${outPath}`);
console.log(JSON.stringify(manifest, null, 2));
