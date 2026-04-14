import { useAuth } from '../contexts/AuthContext'
import styles from './Login.module.css' 

export default function Login() {
  const { login, errorAcceso } = useAuth()

  return (
    <div className={styles.container}>
      <div className={styles.card}>
        <h1 className={styles.logo}>🧁 La Muffinería</h1>
        <p className={styles.subtitle}>Sistema de gestión interna</p>

        {errorAcceso && (
          <p className={styles.error}>
            Tu cuenta no tiene acceso a este sistema.
          </p>
        )}

        <button className={styles.btn} onClick={login}>
          Ingresar con Google
        </button>
      </div>
    </div>
  )
}