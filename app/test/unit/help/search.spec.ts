// search.spec.ts: exercises the Ayuda search bar end to end through HelpScreen — a known keyword
// filters to the matching article, gibberish shows the empty state, and clearing the query
// restores the browse view. Complements help-content.spec.ts (which only tests searchHelp() in
// isolation) by proving the component actually wires the input to that function.
import { createElement } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react-native'
import { articleHref } from '../../../lib/help-content'

// HelpScreen renders inside SafeAreaView, which never measures a frame under the test renderer.
// Same fix as test/unit/auth/auth-gate.spec.ts: swap in the library's own jest mock.
jest.mock('react-native-safe-area-context', () => {
  const mock = jest.requireActual('react-native-safe-area-context/jest/mock').default
  return { ...mock }
})

import { HelpScreen } from '../../../features/help/HelpScreen'

describe('La búsqueda de Ayuda filtra lo que se ve', () => {
  it('escribir una palabra conocida muestra solo los artículos que la contienen', async () => {
    await render(createElement(HelpScreen))

    fireEvent.changeText(screen.getByTestId('help-search-input'), 'contraseña')

    const href = articleHref('entrar', 'cambiar-contrasena')
    await waitFor(() => expect(screen.getByTestId(`help-hit-${href}`)).toBeTruthy())
    expect(screen.queryByTestId('help-category-tarjeta')).toBeNull()
  })

  it('escribir algo que no aparece en ningún artículo muestra el estado vacío', async () => {
    await render(createElement(HelpScreen))

    fireEvent.changeText(screen.getByTestId('help-search-input'), 'xyzxyznoexiste')

    await waitFor(() =>
      expect(screen.getByText('No encontramos nada con esas palabras.')).toBeTruthy(),
    )
  })

  it('borrar la búsqueda regresa la lista completa de temas', async () => {
    await render(createElement(HelpScreen))

    const input = screen.getByTestId('help-search-input')
    fireEvent.changeText(input, 'contraseña')
    await waitFor(() => expect(screen.queryByTestId('help-category-tarjeta')).toBeNull())

    fireEvent.press(screen.getByTestId('help-search-clear'))

    await waitFor(() => expect(screen.getByTestId('help-category-tarjeta')).toBeTruthy())
    expect(input.props.value).toBe('')
  })

  it('tocar un resultado navega a su artículo vía onOpenArticle', async () => {
    const onOpenArticle = jest.fn()
    await render(createElement(HelpScreen, { onOpenArticle }))

    fireEvent.changeText(screen.getByTestId('help-search-input'), 'contraseña')
    const href = articleHref('entrar', 'cambiar-contrasena')
    await waitFor(() => expect(screen.getByTestId(`help-hit-${href}`)).toBeTruthy())
    fireEvent.press(screen.getByTestId(`help-hit-${href}`))

    expect(onOpenArticle).toHaveBeenCalledWith(href)
  })
})
