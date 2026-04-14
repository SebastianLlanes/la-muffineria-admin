import { createContext, useContext, useEffect, useReducer } from 'react'
import { suscribirIngredientes } from '../firebase/ingredientesService'

const IngredientesContext = createContext()

const initialState = {
  ingredientes: [],
  loading: true,
}

function reducer(state, action) {
  switch (action.type) {
    case 'SET_INGREDIENTES':
      return { ...state, ingredientes: action.payload, loading: false }
    default:
      return state
  }
}

export function IngredientesProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    const unsub = suscribirIngredientes((data) => {
      dispatch({ type: 'SET_INGREDIENTES', payload: data })
    })
    return unsub
  }, [])

  return (
    <IngredientesContext.Provider value={{ ...state }}>
      {children}
    </IngredientesContext.Provider>
  )
}

export const useIngredientes = () => useContext(IngredientesContext)