const EMAILS_AUTORIZADOS = [
  'ssebastianllanessaavedra@gmail.com',
  'marcelabnutricionista@gmail.com',
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [errorAcceso, setErrorAcceso] = useState(false)

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (u) => {
      if (u) {
        if (EMAILS_AUTORIZADOS.includes(u.email)) {
          setUser(u)
          setErrorAcceso(false)
        } else {
          await signOut(auth)
          setUser(null)
          setErrorAcceso(true)
        }
      } else {
        setUser(null)
      }
      setLoading(false)
    })
    return unsub
  }, [])

  const login = () => {
    setErrorAcceso(false)
    return signInWithPopup(auth, provider)
  }

  const logout = () => signOut(auth)

  return (
    <AuthContext.Provider value={{ user, login, logout, loading, errorAcceso }}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)