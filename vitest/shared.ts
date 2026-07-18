import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import type { AliasOptions, Plugin } from "vite";

const vitestDir = path.dirname(fileURLToPath(import.meta.url));
export const repoRoot = path.resolve(vitestDir, "..");
export const packagesDir = path.join(repoRoot, "packages");
export const appsDir = path.join(repoRoot, "apps");
export const assetsRoot = path.join(appsDir, "addins/assets");
export const assetsSrcEntry = path.join(assetsRoot, "src/main.tsx");

function listPackageNames(): string[] {
  return fs
    .readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name);
}

/** Resolve bare npm imports from workspace package graphs when tests run at repo root. */
export function resolveFromWorkspaceNodeModules(resolverEntries: string[]): Plugin {
  return {
    name: "resolve-from-workspace-node-modules",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer?.includes(`${path.sep}tests${path.sep}`)) {
        return null;
      }

      if (
        source.startsWith(".") ||
        source.startsWith("\0") ||
        source.startsWith("/") ||
        source.startsWith("@/") ||
        source.startsWith("@fixtures") ||
        source.startsWith("@deck-pack/")
      ) {
        return null;
      }

      for (const entry of resolverEntries) {
        const resolved = await this.resolve(source, entry, {
          ...options,
          skipSelf: true,
        });
        if (resolved) {
          return resolved;
        }
      }

      return null;
    },
  };
}

/** Resolve bare npm imports for add-in tests via the assets package dependency graph. */
export function resolveFromAssetsNodeModules(): Plugin {
  return {
    name: "resolve-from-assets-node-modules",
    enforce: "pre",
    async resolveId(source, importer, options) {
      if (!importer?.includes(`${path.sep}tests${path.sep}addins${path.sep}assets${path.sep}`)) {
        return null;
      }

      if (source.startsWith(".") || source.startsWith("\0") || source.startsWith("/")) {
        return null;
      }

      if (source.startsWith("@/") || source.startsWith("@fixtures")) {
        return null;
      }

      return this.resolve(source, assetsSrcEntry, {
        ...options,
        skipSelf: true,
      });
    },
  };
}

/** Resolve @deck-pack/* imports when tests run from the repo root. */
export function createDeckPackAliases(): AliasOptions {
  const aliases: AliasOptions = [
    { find: "@fixtures", replacement: path.join(repoRoot, "fixtures") },
    {
      find: /^@deck-pack\/api\/(.*)/,
      replacement: path.join(appsDir, "api/src/$1"),
    },
    {
      find: /^@deck-pack\/ops\/(.*)/,
      replacement: path.join(appsDir, "ops/src/$1"),
    },
  ];

  for (const pkg of listPackageNames()) {
    aliases.push({
      find: new RegExp(`^@deck-pack/${pkg}$`),
      replacement: path.join(packagesDir, pkg, "src/index.ts"),
    });
    aliases.push({
      find: new RegExp(`^@deck-pack/${pkg}/(.*)`),
      replacement: path.join(packagesDir, pkg, "src/$1"),
    });
  }

  return aliases;
}

const workspaceResolverEntries = [
  path.join(appsDir, "api/src/index.ts"),
  path.join(packagesDir, "auth/src/client.ts"),
  path.join(packagesDir, "trpc-client/src/index.ts"),
  path.join(packagesDir, "observability/src/index.ts"),
];

export function createWorkspaceResolvePlugins(): Plugin[] {
  return [resolveFromWorkspaceNodeModules(workspaceResolverEntries)];
}

export function createAddinAliases(): AliasOptions {
  return [
    { find: "@fixtures", replacement: path.join(repoRoot, "fixtures") },
    { find: /^@\/(.*)/, replacement: `${path.join(assetsRoot, "src")}/$1` },
  ];
}
