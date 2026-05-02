import { initializeApp, getApps, applicationDefault, App } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import config from '../../firebase-applet-config.json';

const app = (!getApps().length ? initializeApp({
  credential: applicationDefault(),
  projectId: config.projectId
}) : getApps()[0]) as App;

export const auth = getAuth(app);
export const db = getFirestore(app, config.firestoreDatabaseId);
