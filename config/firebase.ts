import fs from 'node:fs';
import path from 'node:path';
import { loadEnv } from 'vite';

const fields = {
  apiKey: 'VITE_FIREBASE_API_KEY',
  authDomain: 'VITE_FIREBASE_AUTH_DOMAIN',
  projectId: 'VITE_FIREBASE_PROJECT_ID',
  storageBucket: 'VITE_FIREBASE_STORAGE_BUCKET',
  messagingSenderId: 'VITE_FIREBASE_MESSAGING_SENDER_ID',
  appId: 'VITE_FIREBASE_APP_ID',
  measurementId: 'VITE_FIREBASE_MEASUREMENT_ID',
  firestoreDatabaseId: 'VITE_FIREBASE_DATABASE_ID',
} as const;

export function loadFirebaseConfig(mode: string, root = process.cwd()) {
  const env = loadEnv(mode, root, 'VITE_FIREBASE_');
  const config: Record<string, string> = {};
  let bundles: string[] | undefined;

  for (const [field, variable] of Object.entries(fields)) {
    if (env[variable]) {
      config[field] = env[variable];
      continue;
    }

    // The original export omitted its Firebase JSON file, but committed the
    // browser configuration in dist. Read it before Vite clears dist, preserving
    // the existing project and named database without copying keys into source.
    if (!bundles) {
      const assets = path.join(root, 'dist/assets');
      bundles = fs.existsSync(assets)
        ? fs.readdirSync(assets)
            .filter((file) => /^index-.*\.js$/.test(file))
            .map((file) => fs.readFileSync(path.join(assets, file), 'utf8'))
        : [];
    }

    const pattern = new RegExp('\\b' + field + '\\s*:\\s*([`"\x27])([^`"\x27]*)\\1', 'g');
    const values = new Set(bundles.flatMap((source) =>
      Array.from(source.matchAll(pattern), (match) => match[2]).filter(Boolean)
    ));
    if (values.size === 1) config[field] = values.values().next().value!;
  }

  for (const field of ['apiKey', 'authDomain', 'projectId', 'appId', 'firestoreDatabaseId']) {
    if (!config[field]) {
      const variable = fields[field as keyof typeof fields];
      throw new Error(`Missing Firebase browser configuration: set ${variable} in the build environment.`);
    }
  }

  return config;
}
