import { doc, onSnapshot, updateDoc } from 'firebase/firestore'
import { db } from './config'

const REF = () => doc(db, 'config', 'precios')

export function suscribirPrecios(callback) {
  return onSnapshot(REF(), snap => {
    if (snap.exists()) callback(snap.data())
  })
}

export async function actualizarPrecios(datos) {
  await updateDoc(REF(), datos)
}