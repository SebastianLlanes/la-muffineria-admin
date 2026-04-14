import { initializeApp } from 'firebase/app'
import { getAuth, GoogleAuthProvider } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyAJCvg3lG4h2jZQuPoYW1KC8y9a9KDxEK0",
  authDomain: "muffineria-admin.firebaseapp.com",
  projectId: "muffineria-admin",
  storageBucket: "muffineria-admin.firebasestorage.app",
  messagingSenderId: "570083283970",
  appId: "1:570083283970:web:fa0634abc47dd0a4ec431b",
  measurementId: "G-J4Q99LR0PW"
};

const app = initializeApp(firebaseConfig)

export const auth = getAuth(app)
export const provider = new GoogleAuthProvider()
export const db = getFirestore(app)