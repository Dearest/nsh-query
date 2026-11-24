// Reading published packages from the npm registry, with no dependencies:
// shared by sync-vendor.mjs and upstream-report.mjs.

import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";

export const registry = (process.env.NPM_REGISTRY ?? "https://registry.npmjs.org").replace(/\/$/, "");

export async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url}: ${response.status} ${response.statusText}`);
  return response.json();
}

async function fetchBytes(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`GET ${url}: ${response.status} ${response.statusText}`);
  return Buffer.from(await response.arrayBuffer());
}

function* untar(buffer) {
  let offset = 0;
  let longName = null;
  while (offset + 512 <= buffer.length) {
    const header = buffer.subarray(offset, offset + 512);
    if (header.every((byte) => byte === 0)) break;
    const field = (start, length) => {
      const bytes = header.subarray(start, start + length);
      const end = bytes.indexOf(0);
      return bytes.subarray(0, end === -1 ? length : end).toString("utf8");
    };
    let name = field(0, 100);
    const size = Number.parseInt(field(124, 12).trim() || "0", 8);
    const type = field(156, 1) || "0";
    if (field(257, 6).startsWith("ustar")) {
      const prefix = field(345, 155);
      if (prefix) name = `${prefix}/${name}`;
    }
    const data = buffer.subarray(offset + 512, offset + 512 + size);
    offset += 512 + Math.ceil(size / 512) * 512;
    if (type === "x") {
      const text = data.toString("utf8");
      const match = /(?:^|\n)\d+ path=([^\n]*)\n/.exec(text);
      longName = match ? match[1] : null;
      continue;
    }
    if (type === "g") continue;
    if (type === "0") yield { name: longName ?? name, data };
    longName = null;
  }
}

/** The registry's metadata of every version of `name` (`@tanstack/query-core`). */
export function packument(name) {
  return fetchJson(`${registry}/${name}`);
}

/**
 * Downloads `name@version`, checks the tarball against the registry's sha512,
 * and returns its metadata and files (paths relative to the package root).
 */
export async function downloadPackage(name, version) {
  const meta = await fetchJson(`${registry}/${name}/${version}`);
  const tarball = await fetchBytes(meta.dist.tarball);
  const integrity = `sha512-${createHash("sha512").update(tarball).digest("base64")}`;
  if (integrity !== meta.dist.integrity) {
    throw new Error(`${name}@${version}: tarball integrity ${integrity} does not match the registry's ${meta.dist.integrity}`);
  }
  const files = new Map();
  for (const entry of untar(gunzipSync(tarball))) {
    files.set(entry.name.replace(/^package\//, ""), entry.data);
  }
  return { meta, integrity, files };
}

/** Compares two versions as SemVer does (prerelease tags sort before the release). */
export function compareVersions(a, b) {
  const parse = (v) => {
    const [core, pre = ""] = v.split("-", 2);
    return { nums: core.split(".").map(Number), pre };
  };
  const x = parse(a);
  const y = parse(b);
  for (let i = 0; i < 3; i++) if (x.nums[i] !== y.nums[i]) return x.nums[i] - y.nums[i];
  if (x.pre === y.pre) return 0;
  if (!x.pre) return 1;
  if (!y.pre) return -1;
  return x.pre < y.pre ? -1 : 1;
}
