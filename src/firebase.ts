import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBqODUbiGT-UfzsTtHZlcHPI7kEjhH3Gl4",
  authDomain: "ridewise-8e795.firebaseapp.com",
  projectId: "ridewise-8e795",
  storageBucket: "ridewise-8e795.firebasestorage.app",
  messagingSenderId: "594086509759",
  appId: "1:594086509759:web:62b812ef93e6ea4debda0a",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Export auth instance
export const auth = getAuth(app);

