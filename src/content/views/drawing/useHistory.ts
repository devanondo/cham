import { useState } from 'react'

export const useHistory = <T,>(
  initialState: T
): [T, (action: T | ((prev: T) => T), overwrite?: boolean) => void, () => void, () => void] => {
  const [index, setIndex] = useState(0)
  const [history, setHistory] = useState<T[]>([initialState])

  const setState = (action: T | ((prev: T) => T), overwrite = false) => {
    const newState = typeof action === 'function' ? (action as (prev: T) => T)(history[index]) : action
    if (overwrite) {
      const historyCopy = [...history]
      historyCopy[index] = newState
      setHistory(historyCopy)
    } else {
      const updatedState = [...history].slice(0, index + 1)
      setHistory([...updatedState, newState])
      setIndex((prevState) => prevState + 1)
    }
  }

  const undo = () => index > 0 && setIndex((prevState) => prevState - 1)
  const redo = () => index < history.length - 1 && setIndex((prevState) => prevState + 1)

  return [history[index], setState, undo, redo]
}
