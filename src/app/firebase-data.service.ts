import { Injectable } from '@angular/core';
import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  serverTimestamp, 
  DocumentData,
  QueryConstraint
} from 'firebase/firestore';
import { db, auth } from './firebase.config';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

@Injectable({ providedIn: 'root' })
export class FirebaseDataService {
  
  /**
   * Fetch all documents from a collection that belong to the current user.
   */
  async getDocuments(path: string, additionalConstraints: QueryConstraint[] = []) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User must be authenticated to fetch data.');

    try {
      const q = query(
        collection(db, path), 
        where('ownerId', '==', uid),
        ...additionalConstraints
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, path);
    }
  }

  /**
   * Fetch a single document by its ID.
   */
  async getDocumentById(path: string, id: string) {
    const docPath = `${path}/${id}`;
    try {
      const docRef = doc(db, path, id);
      const snapshot = await getDoc(docRef);
      if (!snapshot.exists()) return null;
      return { id: snapshot.id, ...snapshot.data() };
    } catch (error) {
      handleFirestoreError(error, OperationType.GET, docPath);
    }
  }

  /**
   * Create a new document in a collection.
   * Automatically adds ownerId and createdAt timestamps.
   */
  async createDocument(path: string, data: any) {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error('User must be authenticated to create data.');

    try {
      const payload = {
        ...data,
        ownerId: uid,
        createdAt: serverTimestamp(),
      };
      
      // If the collection requires updatedAt (like content_queue), add it
      if (path === 'content_queue') {
        payload.updatedAt = serverTimestamp();
      }

      const docRef = await addDoc(collection(db, path), payload);
      return docRef.id;
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, path);
    }
  }

  /**
   * Update an existing document.
   * Automatically updates the updatedAt timestamp if applicable.
   */
  async updateDocument(path: string, id: string, data: any) {
    const docPath = `${path}/${id}`;
    try {
      const payload = { ...data };
      if (path === 'content_queue') {
        payload.updatedAt = serverTimestamp();
      }

      const docRef = doc(db, path, id);
      await updateDoc(docRef, payload);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, docPath);
    }
  }

  /**
   * Delete a document by its ID.
   */
  async deleteDocument(path: string, id: string) {
    const docPath = `${path}/${id}`;
    try {
      const docRef = doc(db, path, id);
      await deleteDoc(docRef);
      return true;
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, docPath);
    }
  }
}
