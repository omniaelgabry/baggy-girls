import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL, deleteObject } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-storage.js";

const firebaseConfig = {
  apiKey: "AIzaSyCweI3DVCaVZWc1opVyvIwzDNY_WQRGFiI",
  authDomain: "baggy-girls.firebaseapp.com",
  projectId: "baggy-girls",
  storageBucket: "baggy-girls.firebasestorage.app",
  messagingSenderId: "965737588660",
  appId: "1:965737588660:web:c115b977b705f87843f4e1",
  measurementId: "G-RJLXWQQFLK"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage, collection, addDoc, getDocs, deleteDoc, doc, setDoc, ref, uploadBytesResumable, getDownloadURL, deleteObject };
