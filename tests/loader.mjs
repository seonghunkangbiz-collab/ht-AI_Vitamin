import { pathToFileURL, fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const projectRoot = path.resolve('.');

function resolvePathWithExt(target) {
  if (fs.existsSync(target) && fs.statSync(target).isFile()) {
    return target;
  }
  const extensions = ['.ts', '.tsx', '.js', '.mjs', '/index.ts', '/index.tsx', '/index.js'];
  for (const ext of extensions) {
    const candidate = target + ext;
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) {
      return candidate;
    }
  }
  return target;
}

export async function resolve(specifier, context, nextResolve) {
  if (specifier === 'next/server') {
    const nextServerPath = path.resolve(projectRoot, 'node_modules/next/server.js');
    return {
      url: pathToFileURL(nextServerPath).href,
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('@/')) {
    const relativePath = specifier.slice(2);
    const target = path.resolve(projectRoot, relativePath);
    const resolved = resolvePathWithExt(target);
    return {
      url: pathToFileURL(resolved).href,
      shortCircuit: true,
    };
  }

  if (specifier.startsWith('./') || specifier.startsWith('../')) {
    const parentDir = context.parentURL ? path.dirname(fileURLToPath(context.parentURL)) : projectRoot;
    const target = path.resolve(parentDir, specifier);
    const resolved = resolvePathWithExt(target);
    return {
      url: pathToFileURL(resolved).href,
      shortCircuit: true,
    };
  }

  return nextResolve(specifier, context);
}
