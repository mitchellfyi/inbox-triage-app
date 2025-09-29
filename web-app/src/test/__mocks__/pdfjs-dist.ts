/**
 * Mock for pdfjs-dist library in tests
 */

export const GlobalWorkerOptions = {
  workerSrc: '/pdf.worker.min.js',
};

const mockPdf = {
  numPages: 3,
  getPage: jest.fn(() =>
    Promise.resolve({
      getTextContent: jest.fn(() =>
        Promise.resolve({
          items: [
            { str: 'This is a test PDF content.' },
            { str: ' Multiple text items.' },
            { str: ' All combined together.' },
          ],
        })
      ),
    })
  ),
};

export const getDocument = jest.fn(() => ({
  promise: Promise.resolve(mockPdf),
}));

// Reset mocks function for tests
export const resetMocks = () => {
  jest.clearAllMocks();
};