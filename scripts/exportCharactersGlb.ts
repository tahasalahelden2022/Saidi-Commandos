import fs from 'node:fs';
import path from 'node:path';
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js';
import { buildCharacterModelGroup } from '../src/characters/characterBuilder';
import { buildCharacterAnimationClips } from '../src/characters/characterClips';
import type { CharacterRole } from '../src/characters/characterTextures';

// Minimal FileReader polyfill for Three.js GLTFExporter binary output in Node.js
if (typeof globalThis.FileReader === 'undefined') {
  (globalThis as Record<string, unknown>).FileReader = class NodeFileReader {
    public result: ArrayBuffer | null = null;
    public onloadend: (() => void) | null = null;
    public readAsArrayBuffer(blob: Blob): void {
      blob.arrayBuffer().then((buf) => {
        this.result = buf;
        this.onloadend?.();
      });
    }
  };
}

async function main(): Promise<void> {
  const outDir = path.resolve(process.cwd(), 'public/assets/characters');
  fs.mkdirSync(outDir, { recursive: true });

  const exporter = new GLTFExporter();
  const clips = buildCharacterAnimationClips();
  const roles: CharacterRole[] = ['hamdan', 'salem', 'bakri', 'guard', 'vip'];

  for (const role of roles) {
    const group = buildCharacterModelGroup(role);
    const glbBuffer = (await exporter.parseAsync(group, {
      binary: true,
      animations: clips,
    })) as ArrayBuffer;

    const outPath = path.join(outDir, `${role}.glb`);
    fs.writeFileSync(outPath, Buffer.from(glbBuffer));
    console.log(`Exported ${role}.glb (${(glbBuffer.byteLength / 1024).toFixed(1)} KB)`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
