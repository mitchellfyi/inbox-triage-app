/**
 * Mock for mammoth library in tests
 */

const mockMammoth = {
  convertToHtml: jest.fn(() =>
    Promise.resolve({
      value: '<p>This is a test DOCX content with <strong>formatting</strong>.</p>',
      messages: [],
    })
  ),
  images: {
    ignoreAllImages: 'ignore-all-images',
  },
};

export default mockMammoth;

// Reset mocks function for tests
export const resetMocks = () => {
  jest.clearAllMocks();
};