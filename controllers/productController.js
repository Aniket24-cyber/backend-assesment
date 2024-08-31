import { successResponse, errorResponse } from '../helpers/responseHelpers.js';
import productCSVValidator from '../validators/productCsvValidator.js'
import productManagementService from '../services/projectManagementService.js.js';

class ProductController {

    async uploadCSV(req, res) {
      try {
        const filePath = req.file.path;
        const {webhookUrl} = req.body;
        const validData = await productCSVValidator.parseAndValidateCSV(filePath);
        const requestId = await productManagementService.createRequest(validData,webhookUrl);
        successResponse(req,res, 200, { requestId });
      } catch (error) {
        errorResponse(req,res, error.statusCode || 500, error.message);
      }
    }

  async checkStatus(req, res) {
    try {
      const requestId = req.params.requestId;
      const requestStatus = await productManagementService.getRequestStatus(requestId);
      successResponse(req,res, 200, { status: requestStatus.status});
    } catch (error) {
      errorResponse(req, res, error.statusCode || 404, error.message);
    }
  }
}

export default new ProductController();
