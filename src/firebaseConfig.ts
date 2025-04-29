import { initializeApp } from "firebase/app"
import { getFirestore, setLogLevel } from "firebase/firestore"
// Optional: import { getAnalytics } from "firebase/analytics" (nur für Web ohne SSR relevant)

const firebaseConfig = {
  apiKey: "AIzaSyAvOoTdkkK1BeMGIMCPIX7oi8qk9i1QfvQ",
  authDomain: "ludonect.firebaseapp.com",
  projectId: "ludonect",
  storageBucket: "ludonect.appspot.app",
  messagingSenderId: "910436127243",
  appId: "1:910436127243:web:fea48d188f797b3a9aad0e",
  measurementId: "G-EJHP2XTRCN"
}

// Init Firebase
const app = initializeApp(firebaseConfig)
export const firebaseApp = app

// Export Firestore DB
export const db = getFirestore(app)
setLogLevel('silent')