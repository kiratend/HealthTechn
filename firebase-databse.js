// firebase-database.js - All database related functions
import { database } from './firebase-core.js';
import { ref, set, push, onValue, get } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-database.js";

// ==================== DATABASE FUNCTIONS ====================

async function writeData(path, data) {
  try {
    await set(ref(database, path), data);
    return { success: true };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function pushData(path, data) {
  try {
    const newRef = push(ref(database, path));
    await set(newRef, data);
    return { 
      success: true,
      key: newRef.key 
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

async function readDataOnce(path) {
  return new Promise((resolve) => {
    const dataRef = ref(database, path);
    onValue(dataRef, (snapshot) => {
      const data = snapshot.val();
      resolve(data);
    }, {
      onlyOnce: true
    });
  });
}

function listenToData(path, callback) {
  const dataRef = ref(database, path);
  onValue(dataRef, (snapshot) => {
    const data = snapshot.val();
    callback(data);
  });
  
  // Return unsubscribe function
  return () => onValue(dataRef, () => {});
}

// Export database functions
export {
  database,
  ref, 
  set, 
  push, 
  onValue,
  get,
  writeData,
  pushData,
  readDataOnce,
  listenToData
};