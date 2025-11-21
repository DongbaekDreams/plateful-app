import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  Timestamp,
  addDoc,
} from 'firebase/firestore';
import { db } from '../config/firebase';
import type { GroceryItem, GroceryList } from '../../../packages/shared/src/types/grocery';

const GROCERY_LISTS_COLLECTION = 'groceryLists';
const GROCERY_ITEMS_COLLECTION = 'groceryItems';

// Grocery List operations
export async function createGroceryList(
  name: string,
  ownerId: string
): Promise<string> {
  const listRef = await addDoc(collection(db, GROCERY_LISTS_COLLECTION), {
    name,
    ownerId,
    items: [],
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return listRef.id;
}

export async function getGroceryLists(ownerId: string): Promise<GroceryList[]> {
  const q = query(
    collection(db, GROCERY_LISTS_COLLECTION),
    where('ownerId', '==', ownerId)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      items: [], // Items are stored separately, use getGroceryListWithItems() for populated list
      ownerId: data.ownerId,
      sharedWith: data.sharedWith,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as GroceryList;
  });
}

/**
 * Gets a single grocery list with all its items populated.
 */
export async function getGroceryListWithItems(
  listId: string,
  ownerId: string
): Promise<GroceryList | null> {
  const listRef = doc(db, GROCERY_LISTS_COLLECTION, listId);
  const listSnap = await getDoc(listRef);
  
  if (!listSnap.exists()) {
    return null;
  }
  
  const data = listSnap.data();
  if (data.ownerId !== ownerId) {
    return null; // Not owner
  }
  
  // Fetch all items for this list
  const items = await getGroceryItems(listId);
  
  return {
    id: listSnap.id,
    name: data.name,
    items,
    ownerId: data.ownerId,
    sharedWith: data.sharedWith,
    createdAt: data.createdAt.toDate(),
    updatedAt: data.updatedAt.toDate(),
  } as GroceryList;
}

export async function updateGroceryList(
  listId: string,
  updates: Partial<Omit<GroceryList, 'id' | 'createdAt'>>
): Promise<void> {
  const listRef = doc(db, GROCERY_LISTS_COLLECTION, listId);
  await updateDoc(listRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteGroceryList(listId: string): Promise<void> {
  // First, delete all items in the list
  const items = await getGroceryItems(listId);
  await Promise.all(items.map(item => deleteGroceryItem(item.id)));
  
  // Then delete the list
  await deleteDoc(doc(db, GROCERY_LISTS_COLLECTION, listId));
}

// Grocery Item operations
export async function addGroceryItem(
  listId: string,
  item: Omit<GroceryItem, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const itemRef = await addDoc(collection(db, GROCERY_ITEMS_COLLECTION), {
    ...item,
    listId,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return itemRef.id;
}

export async function updateGroceryItem(
  itemId: string,
  updates: Partial<Omit<GroceryItem, 'id' | 'createdAt'>>
): Promise<void> {
  const itemRef = doc(db, GROCERY_ITEMS_COLLECTION, itemId);
  await updateDoc(itemRef, {
    ...updates,
    updatedAt: Timestamp.now(),
  });
}

export async function deleteGroceryItem(itemId: string): Promise<void> {
  await deleteDoc(doc(db, GROCERY_ITEMS_COLLECTION, itemId));
}

export async function getGroceryItems(listId: string): Promise<GroceryItem[]> {
  const q = query(
    collection(db, GROCERY_ITEMS_COLLECTION),
    where('listId', '==', listId)
  );
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      name: data.name,
      quantity: data.quantity,
      unit: data.unit,
      category: data.category,
      notes: data.notes,
      completed: data.completed,
      ownerId: data.ownerId,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate(),
    } as GroceryItem;
  });
}
