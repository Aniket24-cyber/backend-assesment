export const ErrorTypes = {
    NOT_FOUND: {
      type: 'not_found',
      statusCode: 404,
    },
    INTERNAL_SERVER_ERROR: {
      type: 'internal_server_error',
      statusCode: 500,
    },
    BAD_REQUEST: {
      type: 'bad_request',
      statusCode: 400,
    },
    UNAUTHORIZED: {
      type: 'unauthorized',
      statusCode: 401,
    },
    FORBIDDEN: {
      type: 'forbidden',
      statusCode: 403,
    },
  };

  export const RequestStatus = {
    COMPLETED: 'completed',
    PROCESSING: 'processing',
    FAILED: 'failed',
  };

export default {ErrorTypes , RequestStatus};
  