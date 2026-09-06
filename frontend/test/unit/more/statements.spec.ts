// statements.spec.ts: StatementsScreen ports the reference app/statements/page.tsx — upload,
// classification summary, history, entry reclassification. Source-string checks, same convention
// as profile/structure.spec.ts.
import { readFileSync } from 'fs'
import { join } from 'path'

const source = readFileSync(join(__dirname, '../../../features/more/StatementsScreen.tsx'), 'utf-8')

describe('StatementsScreen structure', () => {
  it('picks files via expo-document-picker, not a web <input>', () => {
    expect(source).toMatch(/from\s*"expo-document-picker"/)
    expect(source).toMatch(/DocumentPicker\.getDocumentAsync\(/)
  })

  it('persists the terms-accepted flag via AsyncStorage, not localStorage', () => {
    expect(source).toMatch(/from\s*"@react-native-async-storage\/async-storage"/)
    expect(source).not.toMatch(/localStorage/)
  })

  it('uploads through the native-file API variant, not the web File[] one', () => {
    expect(source).toMatch(/statements\.uploadNative\(/)
  })

  it('loads history and summary from the real statements API', () => {
    expect(source).toMatch(/statements\s*\.\s*list\(\)/)
    expect(source).toMatch(/statements\s*\.\s*summary\(\)/)
  })

  it('exposes the upload flow and history with stable testIDs', () => {
    for (const id of [
      'statement-terms-continue',
      'statements-pick-cta',
      'statements-upload-cta',
      'statements-history-loading',
    ]) {
      expect(source).toContain(id)
    }
  })
})
