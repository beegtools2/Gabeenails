import type { FirebaseOptions } from 'firebase/app';

// Vite supplies the existing browser configuration, with build environment
// overrides, instead of importing an untracked file outside the repository.
declare const __FIREBASE_CONFIG__: FirebaseOptions & { firestoreDatabaseId: string };

const firebaseConfig = __FIREBASE_CONFIG__;

export default firebaseConfig;
