import {
  collection, addDoc, updateDoc,
  deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp 
} from 'firebase/firestore'
import { db } from './config'

const COL = 'pedidos'


export function suscribirPedidos(callback, onError) {
  return onSnapshot(
    collection(db, COL),
    snap => {
const docs = snap.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .sort((a, b) => {
          // Usa creadoEn si existe, sino fecha, sino 0
          const ta = a.creadoEn?.toMillis?.()
                  || a.fecha?.toMillis?.()
                  || 0
          const tb = b.creadoEn?.toMillis?.()
                  || b.fecha?.toMillis?.()
                  || 0
          return tb - ta
        })
      callback(docs)
    },
    onError
  )
}

export async function agregarPedido(datos) {
  await addDoc(collection(db, COL), {
    ...datos,
    origen:   'admin',
    creadoEn: serverTimestamp(),
  })
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