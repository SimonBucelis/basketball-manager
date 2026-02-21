import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAFr8u9pp_aLhKxIvXfP9_rMgJUf5h_-vc",
  authDomain: "basketball-manager-6c466.firebaseapp.com",
  databaseURL: "https://basketball-manager-6c466-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "basketball-manager-6c466",
  storageBucket: "basketball-manager-6c466.firebasestorage.app",
  messagingSenderId: "299621848640",
  appId: "1:299621848640:web:a1d50705d62298e534f1a5",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
