import { createContext, useContext, useEffect, useReducer } from 'react'
import { suscribirRecetas } from '../firebase/recetasService'

const RecetasContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case 'SET_RECETAS':
      return { ...state, recetas: action.payload, loading: false }
    default:
      return state
  }
}

export function RecetasProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { recetas: [], loading: true })

  useEffect(() => {
    const unsub = suscribirRecetas(data =>
      dispatch({ type: 'SET_RECETAS', payload: data })
    )
    return unsub
  }, [])

  return (
    <RecetasContext.Provider value={{ ...state }}>
      {children}
    </RecetasContext.Provider>
  )
}

export const useRecetas = () => useContext(RecetasContext)