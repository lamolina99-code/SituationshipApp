import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyABGnxDgGH379Mc22QnijhW6XM-oWvh9Sg",
  authDomain: "therotation-de7b2.firebaseapp.com",
  projectId: "therotation-de7b2",
  storageBucket: "therotation-de7b2.firebasestorage.app",
  messagingSenderId: "597168815080",
  appId: "1:597168815080:web:2590f0b4b8e2f92a4a425d"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export default app;
