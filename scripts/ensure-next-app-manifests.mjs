import { access, mkdir, writeFile } from "node:fs/promises";
import { dirname } from "node:path";

const manifests = [
  [".next/server/pages-manifest.json", "{}\n"],
  [".next/server/prefetch-hints.json", "{}\n"],
];

for (const [path, contents] of manifests) {
  try {
    await access(path);
  } catch {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, contents, "utf8");
  }
}
