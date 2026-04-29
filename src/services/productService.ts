import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  where, 
  onSnapshot,
  serverTimestamp,
  orderBy,
  writeBatch
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Product } from '../types';

const COLLECTION_NAME = 'products';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export const productService = {
  subscribeToProducts: (userId: string, callback: (products: Product[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('ownerId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const products = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      callback(products);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, COLLECTION_NAME);
    });
  },

  addProduct: async (product: Omit<Product, 'id' | 'createdAt' | 'ownerId'>, userId: string) => {
    try {
      await addDoc(collection(db, COLLECTION_NAME), {
        ...product,
        ownerId: userId,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, COLLECTION_NAME);
    }
  },

  updateStock: async (productId: string, newQuantity: number) => {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);
      await updateDoc(productRef, {
        stockQuantity: newQuantity
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${productId}`);
    }
  },

  updateProduct: async (productId: string, updates: Partial<Omit<Product, 'id' | 'createdAt' | 'ownerId'>>) => {
    try {
      const productRef = doc(db, COLLECTION_NAME, productId);
      await updateDoc(productRef, updates);
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `${COLLECTION_NAME}/${productId}`);
    }
  },

  deleteProduct: async (productId: string) => {
    try {
      await deleteDoc(doc(db, COLLECTION_NAME, productId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `${COLLECTION_NAME}/${productId}`);
    }
  },

  bulkAddProducts: async (products: Omit<Product, 'id' | 'createdAt' | 'ownerId'>[], userId: string) => {
    try {
      const batch = writeBatch(db);
      products.forEach(p => {
        const productRef = doc(collection(db, COLLECTION_NAME));
        batch.set(productRef, {
          ...p,
          ownerId: userId,
          createdAt: serverTimestamp(),
        });
      });
      await batch.commit();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, COLLECTION_NAME);
    }
  }
};
