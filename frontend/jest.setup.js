// jest.setup.js: test-only mocks for native modules with no JS-side stub — Jest runs on Node,
// not a device, so AsyncStorage's native binding is null unless replaced with its own mock.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
)
