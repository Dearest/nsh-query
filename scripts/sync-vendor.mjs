#!/usr/bin/env node
// Downloads @tanstack/query-core and the two persistence packages from the npm
// registry and writes their `build/modern` output into `vendor/`.
//
//   node scripts/sync-vendor.mjs <version> [--out <dir>]
//
// The only change made to the published files is in the persistence packages:
// their bare `@tanstack/*` imports are rewritten to relative paths into
// `vendor/`, so that one copy of query-core serves the whole library.

import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, posix, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { downloadPackage } from "./npm.mjs";

const PACKAGES = [
  "query-core",
  "query-persist-client-core",
  "query-async-storage-persister",
];

const REWRITES = {
  "@tanstack/query-core": "query-core/index.js",
  "@tanstack/query-persist-client-core": "query-persist-client-core/index.js",
};

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

function usage(message) {
  if (message) console.error(`error: ${message}`);
  console.error("usage: node scripts/sync-vendor.mjs <version> [--out <dir>]");
  process.exit(2);
}

function parseArgs(argv) {
  let version;
  let out = join(root, "vendor");
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--out") {
      const value = argv[++i];
      if (!value) usage("--out needs a directory");
      out = resolve(value);
    } else if (arg.startsWith("-")) {
      usage(`unknown option ${arg}`);
    } else if (version === undefined) {
      version = arg;
    } else {
      usage(`unexpected argument ${arg}`);
    }
  }
  if (!version) usage("missing version");
  return { version, out };
}

function isVendored(path) {
  if (path === "LICENSE") return true;
  if (!path.startsWith("build/modern/")) return false;
  return path.endsWith(".js") || path.endsWith(".d.ts");
}

function rewriteImports(source, file) {
  let result = source;
  for (const [specifier, target] of Object.entries(REWRITES)) {
    const relative = posix.relative(posix.dirname(posix.join("/vendor/package", file)), posix.join("/vendor", target));
    const pattern = new RegExp(`(["'])${specifier.replace(/[/@-]/g, "\\$&")}\\1`, "g");
    result = result.replace(pattern, (_, quote) => `${quote}${relative}${quote}`);
  }
  return result;
}

async function loadPackage(name, version) {
  const { meta, integrity, files: published } = await downloadPackage(`@tanstack/${name}`, version);
  for (const dependency of Object.keys(meta.dependencies ?? {})) {
    if (dependency in REWRITES && meta.dependencies[dependency] !== version) {
      throw new Error(`@tanstack/${name}@${version} depends on ${dependency}@${meta.dependencies[dependency]}, not ${version}`);
    }
  }
  const files = new Map();
  for (const [path, data] of published) {
    if (!isVendored(path)) continue;
    const file = path.replace(/^build\/modern\//, "");
    const text = data.toString("utf8");
    files.set(file, name === "query-core" ? text : rewriteImports(text, file));
  }
  if (!files.has("index.js") || !files.has("index.d.ts") || !files.has("LICENSE")) {
    throw new Error(`@tanstack/${name}@${version}: build/modern/index.js, index.d.ts or LICENSE missing from the tarball`);
  }
  return { name, version, integrity, tarball: meta.dist.tarball, files };
}

async function main() {
  const { version, out } = parseArgs(process.argv.slice(2));
  const packages = await Promise.all(PACKAGES.map((name) => loadPackage(name, version)));
  await mkdir(out, { recursive: true });
  const versions = {};
  for (const pkg of packages) {
    const dir = join(out, pkg.name);
    await rm(dir, { recursive: true, force: true });
    for (const [file, text] of [...pkg.files].sort(([a], [b]) => a.localeCompare(b))) {
      const target = join(dir, file);
      await mkdir(dirname(target), { recursive: true });
      await writeFile(target, text);
    }
    versions[`@tanstack/${pkg.name}`] = {
      version: pkg.version,
      tarball: pkg.tarball,
      integrity: pkg.integrity,
    };
  }
  await writeFile(join(out, "VERSIONS.json"), `${JSON.stringify(versions, null, 2)}\n`);
  console.log(`vendored @tanstack/{${PACKAGES.join(",")}}@${version} into ${out}`);
}

main().catch((error) => {
  console.error(`error: ${error.message}`);
  process.exit(1);
});
