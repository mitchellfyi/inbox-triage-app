/**
 * Mock for xlsx library in tests
 */

const mockWorksheet = {
  '!ref': 'A1:C3',
  'A1': { v: 'Name' },
  'B1': { v: 'Age' },
  'C1': { v: 'Score' },
  'A2': { v: 'John' },
  'B2': { v: 25 },
  'C2': { v: 95 },
  'A3': { v: 'Jane' },
  'B3': { v: 30 },
  'C3': { v: 87 },
};

const mockWorkbook = {
  SheetNames: ['Sheet1'],
  Sheets: {
    Sheet1: mockWorksheet,
  },
};

export const read = jest.fn(() => mockWorkbook);

export const utils = {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  decode_range: jest.fn((_ref: string) => ({
    s: { r: 0, c: 0 },
    e: { r: 2, c: 2 },
  })),
  encode_cell: jest.fn(({ r, c }: { r: number; c: number }) => `${String.fromCharCode(65 + c)}${r + 1}`),
};

// Reset mocks function for tests
export const resetMocks = () => {
  jest.clearAllMocks();
};