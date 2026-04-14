import {
  collection, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, query, orderBy
} from 'firebase/firestore'
import { db } from './config'

const COL = 'pedidos'

export function suscribirPedidos(callback) {
  const q = query(collection(db, COL), orderBy('fecha', 'desc'))
  return onSnapshot(q, snap => {
    callback(snap.docs.map(d => ({ id: d.id, ...d.data() })))
  })
}

export async function agregarPedido(datos) {
  await addDoc(collection(db, COL), datos)
}

export async function editarPedido(id, datos) {
  await updateDoc(doc(db, COL, id), datos)
}

export async function actualizarEstado(id, estado) {
  await updateDoc(doc(db, COL, id), { estado })
}

export async function eliminarPedido(id) {
  await deleteDoc(doc(db, COL, id))
}