import {
  collection, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from './config'

const COL = 'recetas'

export function suscribirRecetas(callback) {
  const q = query(collection(db, COL), orderBy('nombre'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function agregarReceta(datos) {
  await addDoc(collection(db, COL), datos)
}

export async function editarReceta(id, datos) {
  await updateDoc(doc(db, COL, id), datos)
}

export async function eliminarReceta(id) {
  await deleteDoc(doc(db, COL, id))
}