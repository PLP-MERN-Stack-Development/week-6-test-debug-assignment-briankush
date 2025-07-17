const errorHandler = require('../../../src/middleware/errorHandler');

// Mock logger
jest.mock('../../../src/utils/logger', () => ({
  error: jest.fn()
}));

describe('Error Handler Middleware', () => {
  let mockRequest;
  let mockResponse;
  let mockNext;

  beforeEach(() => {
    mockRequest = {
      method: 'GET',
      url: '/api/test',
      body: {}
    };
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    mockNext = jest.fn();
  });

  test('should handle Mongoose validation errors', () => {
    const validationError = new Error('Validation failed');
    validationError.name = 'ValidationError';
    validationError.errors = {
      field1: { message: 'Field1 is required' },
      field2: { message: 'Field2 is invalid' }
    };

    errorHandler(validationError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: ['Field1 is required', 'Field2 is invalid']
    });
  });

  test('should handle duplicate key errors', () => {
    const duplicateError = new Error('Duplicate key');
    duplicateError.code = 11000;

    errorHandler(duplicateError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(400);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Duplicate field value entered'
    });
  });

  test('should handle JWT errors', () => {
    const jwtError = new Error('Invalid token');
    jwtError.name = 'JsonWebTokenError';

    errorHandler(jwtError, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Invalid token. Please log in again.'
    });
  });

  test('should handle generic errors with default 500 status code', () => {
    const error = new Error('Server error');

    errorHandler(error, mockRequest, mockResponse, mockNext);

    expect(mockResponse.status).toHaveBeenCalledWith(500);
    expect(mockResponse.json).toHaveBeenCalledWith({
      success: false,
      error: 'Server error'
    });
  });
});
