import { createContext, useContext, useEffect, useReducer } from 'react'
import { suscribirPartidas } from '../firebase/partidasService'

const PartidasContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PARTIDAS':
      return { ...state, partidas: action.payload, loading: false }
    default:
      return state
  }
}

export function PartidasProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { partidas: [], loading: true })

  useEffect(() => {
    const unsub = suscribirPartidas(data =>
      dispatch({ type: 'SET_PARTIDAS', payload: data })
    )
    return unsub
  }, [])

  return (
    <PartidasContext.Provider value={{ ...state }}>
      {children}
    </PartidasContext.Provider>
  )
}

export const usePartidas = () => useContext(PartidasContext)