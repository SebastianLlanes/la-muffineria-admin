import {
  collection, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from './config'

const COL = 'partidas'

export function suscribirPartidas(callback) {
  const q = query(collection(db, COL), orderBy('fecha', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function agregarPartida(datos) {
  await addDoc(collection(db, COL), datos)
}

export async function editarPartida(id, datos) {
  await updateDoc(doc(db, COL, id), datos)
}

export async function eliminarPartida(id) {
  await deleteDoc(doc(db, COL, id))
}