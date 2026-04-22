import { createContext, useContext, useEffect, useReducer } from 'react'
import { suscribirPedidos } from '../firebase/pedidosService'

const PedidosContext = createContext()

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PEDIDOS':
      return { ...state, pedidos: action.payload, loading: false }
    default:
      return state
  }
}

export function PedidosProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, { pedidos: [], loading: true })


useEffect(() => {
  const unsub = suscribirPedidos(
    data => dispatch({ type: 'SET_PEDIDOS', payload: data }),
    error => {
      console.error('Error en suscribirPedidos:', error)
      dispatch({ type: 'SET_PEDIDOS', payload: [] })
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