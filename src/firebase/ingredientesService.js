import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  onSnapshot,
  query,
  orderBy
} from 'firebase/firestore'
import { db } from './config'

const COL = 'ingredientes'

export function suscribirIngredientes(callback) {
  const q = query(collection(db, COL), orderBy('nombre'))
  return onSnapshot(q, (snap) => {
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
    callback(data)
  })
}

export async function agregarIngrediente(datos) {
  await addDoc(collection(db, COL), datos)
}

export async function editarIngrediente(id, datos) {
  await updateDoc(doc(db, COL, id), datos)
}

export async function eliminarIngrediente(id) {
  await deleteDoc(doc(db, COL, id))
}