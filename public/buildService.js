// public/buildService.js
import { db } from './firebase-config.js';
import {
  addDoc,
  getDoc,
  doc,
  collection,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js';

/**
 * Save a build object, return the new document’s ID.
 */
export async function saveBuildToFirestore(build) {
  const payload = {
    ...build,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  };
  const ref = await addDoc(collection(db, 'builds'), payload);
  return ref.id;
}

/**
 * Load a build by its Firestore ID.
 */
export async function loadBuildFromFirestore(id) {
  const snap = await getDoc(doc(db, 'builds', id));
  return snap.exists() ? snap.data() : null;
}