import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, where, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Supplier } from '../types';

export const supplierService = {
  subscribeToSuppliers: (userId: string, callback: (suppliers: Supplier[]) => void) => {
    const q = query(collection(db, 'suppliers'), where('ownerId', '==', userId));
    return onSnapshot(q, (snapshot) => {
      const suppliers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Supplier[];
      callback(suppliers.sort((a, b) => b.createdAt?.seconds - a.createdAt?.seconds));
    });
  },

  addSupplier: async (supplier: Omit<Supplier, 'id' | 'createdAt'>) => {
    return addDoc(collection(db, 'suppliers'), {
      ...supplier,
      createdAt: serverTimestamp()
    });
  },

  updateSupplier: async (id: string, supplier: Partial<Supplier>) => {
    const docRef = doc(db, 'suppliers', id);
    return updateDoc(docRef, supplier);
  },

  deleteSupplier: async (id: string) => {
    const docRef = doc(db, 'suppliers', id);
    return deleteDoc(docRef);
  }
};
