import { createContext, useContext, useEffect, useReducer } from 'react'
import { suscribirPedidos } from '../firebase/pedidosService'

const PedidosContext = createContext()

const initialState = {
  pedidos: [],
  loading: true,
  error: null,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PEDIDOS':
      return { ...state, pedidos: action.payload, loading: false, error: null }
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false }
    default:
      return state
  }
}

export function PedidosProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const unsub = suscribirPedidos(
      data => dispatch({ type: 'SET_PEDIDOS', payload: data }),
      error => {
        console.error('Error en suscribirPedidos:', error)
        dispatch({ type: 'SET_ERROR', payload: error })
      }
    )
    return unsub
  }, [])

  return (
    <PedidosContext.Provider value={{ ...state }}>
      {children}
    </PedidosContext.Provider>
  )
}

export const usePedidos = () => useContext(PedidosContext)