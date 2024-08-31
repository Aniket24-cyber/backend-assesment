import Product from '../models/Product.js'; 
import { v4 as uuidv4 } from 'uuid';
import logger from '../helpers/logger.js';
import ImageProcessingService from './imageProcessingService.js';
import fs from 'fs';
import path from 'path';
import csvWriter from 'csv-writer';
import axios from 'axios';
import FormData from 'form-data';
import { CustomError } from '../helpers/customError.js'; 
import {ErrorTypes , RequestStatus} from '../constants/constants.js';

class ProductManagementService {

  async createRequest(fileData, webhookUrl) {
    try {
      const requestId = uuidv4();
      logger.info(`Creating request with ID: ${requestId}`);
      
      const productData = fileData.map(row => ({
        productName: row['Product Name'],
        inputUrls: row['Input Image Urls'].split(',').map(url => url.trim()), 
        outputUrls: [],
      }));

      const newRequest = new Product({
        requestId,
        status: RequestStatus.PROCESSING,
        productData,
      });
      
      await newRequest.save();
      logger.info(`Request ${requestId} created successfully.`);
      this.processImagesAsync(newRequest, webhookUrl);
      return requestId;
    } catch (error) {
      this.handleError(error, 'Failed to create request');
    }
  }

  async processImagesAsync(request, webhookUrl ) {
    try {
      logger.info(`Processing images for request ID: ${request.requestId}`);
      const imageProcessor = new ImageProcessingService(request.requestId, request.productData);
      const processedProducts = await imageProcessor.process();
  
      request.productData = processedProducts;
      request.status = RequestStatus.COMPLETED; 
      await request.save();
  
      logger.info(`Request ${request.requestId} processed and updated to Completed.`);
      const csvFilePath = await this.createOutputCSV(request.requestId, request.productData);
  
      if (webhookUrl) {
        await this.triggerWebhook(webhookUrl, csvFilePath);
      }
    } catch (error) {
      request.status = RequestStatus.FAILED; 
      await request.save(); 
  
      this.handleError(error, 'Failed to process images'); 
    }
  }
  

  async triggerWebhook(webhookUrl, filePath) {
    try {
      logger.info(`Triggering webhook with CSV file: ${filePath}`);
      
      const form = new FormData();
      form.append('file', fs.createReadStream(filePath));
  
      const response = await axios.post(webhookUrl, form, {
        headers: {
          ...form.getHeaders(),
          'Content-Type': 'multipart/form-data',
        }
      });
  
      logger.info(`Webhook response: ${response.status} ${response.statusText}`);
  
    } catch (error) {
      logger.error(`Failed to trigger webhook: ${error.message}`);
    }
  }
  
  async createOutputCSV(requestId, productData) {
    try {
      const csvData = productData.map((product, index) => ({
        'S.No.': index + 1,
        'Product Name': product.productName,
        'Input Image Urls': product.inputUrls.join(', '),
        'Output Image Urls': product.outputUrls.join(', ')
      }));
  
      const outputDir = path.resolve('./output-csvs');
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir);
      }
  
      const filePath = path.join(outputDir, `output-${requestId}.csv`);
  
      const writer = csvWriter.createObjectCsvWriter({
        path: filePath,
        header: [
          { id: 'S.No.', title: 'S.No.' },
          { id: 'Product Name', title: 'Product Name' },
          { id: 'Input Image Urls', title: 'Input Image Urls' },
          { id: 'Output Image Urls', title: 'Output Image Urls' }
        ]
      });
  
      await writer.writeRecords(csvData);
  
      logger.info(`CSV file created at ${filePath}`);
  
      return filePath;
    } catch (error) {
      this.handleError(error, 'Failed to create output CSV');
    }
  }
  

  async getRequestStatus(requestId) {
    try {
      logger.info(`Fetching status for request ID: ${requestId}`);
      const status = await Product.findOne({ requestId }, { status: 1 });
      if (!status) {
        logger.warn(`Request ID ${requestId} not found.`);
        throw new CustomError(ErrorTypes.NOT_FOUND, 'Request not found 1');
      }
      return status;
    } catch (error) {
      this.handleError(error, 'Failed to get request status');
    }
  }

  handleError(error, defaultMessage) {
    if (!(error instanceof CustomError)) {
      logger.error(`Unhandled error: ${error.message}`);
      throw new CustomError(ErrorTypes.INTERNAL_SERVER_ERROR, defaultMessage);
    } else {
      throw error; 
    }
  }
}


export default new ProductManagementService();
