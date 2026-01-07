import { store } from '../../store/index'

describe('Redux Store', () => {
  test('should initialize with expected reducer keys', () => {
    const state = store.getState()

    expect(state).toHaveProperty('auth')
    expect(state).toHaveProperty('theme')
    expect(state).toHaveProperty('abstracts')
  })

  test('should allow dispatching actions', () => {
    expect(() => {
      store.dispatch({ type: 'UNKNOWN_ACTION' })
    }).not.toThrow()
  })
})
