import { initializeApp, getApps } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBjaGAxi7c16F1270lBTvb8aDuWHLIGM84",
  authDomain: "designers-timeline.firebaseapp.com",
  projectId: "designers-timeline",
  storageBucket: "designers-timeline.firebasestorage.app",
  messagingSenderId: "908200768085",
  appId: "1:908200768085:web:b7a23d74b94da3c4575adc",
};

// Guard: Next.js hot-reload calls initializeApp multiple times
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const db = getFirestore(app);
