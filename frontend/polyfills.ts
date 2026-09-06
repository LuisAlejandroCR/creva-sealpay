// polyfills.ts: globals @hashgraph/sdk needs under Hermes/RN — crypto.getRandomValues for key
// material and Buffer for the base64/byte encoding hedera-signer-style code does. Must be
// imported before anything that touches @hashgraph/sdk (see index.ts).
import 'react-native-get-random-values'
import { Buffer } from 'buffer'

if (typeof global.Buffer === 'undefined') {
  global.Buffer = Buffer
}
