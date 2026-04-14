import { useAuth } from '../contexts/AuthContext'
import styles from './Login.module.css'

export default function Login() {
  const { login } = useAuth()

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>🧁 La Muffinería</h1>
        <p className={styles.subtitle}>Sistema de gestión interna</p>
        <button className={styles.btn} onClick={login}>
          Ingresar con Google
        </button>
      </div>
    </div>
  )
}