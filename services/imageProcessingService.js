import axios from 'axios';
import Jimp from 'jimp';
import { createWriteStream, existsSync, mkdirSync, statSync } from 'fs';
import { join, resolve } from 'path';
import tmp from 'tmp';
import logger from '../helpers/logger.js';
import { CustomError } from '../helpers/customError.js';
import {ErrorTypes} from '../constants/constants.js';

class ImageProcessingService {

  constructor(requestId, productData) {
    this.requestId = requestId;
    this.productData = productData;
    this.baseOutputDir = resolve('./output_images');
    this.tempDir = tmp.dirSync({ unsafeCleanup: true });
    this.globalIndex = 0;
  }

  ensureDirectories() {
    if (!existsSync(this.baseOutputDir)) {
      mkdirSync(this.baseOutputDir);
    }
    this.requestOutputDir = join(this.baseOutputDir, this.requestId);
    if (!existsSync(this.requestOutputDir)) {
      mkdirSync(this.requestOutputDir);
    }
  }

  async downloadImage(url, filePath) {
    try {
      logger.info(`Downloading image from ${url} to ${filePath}`);
      
      const response = await axios({
        url,
        responseType: 'stream',
        headers: {
          'Accept-Encoding': 'identity'
        }
      });

      if (response.status !== 200) {
        throw new CustomError(ErrorTypes.INTERNAL_SERVER_ERROR, `Failed to download image. Status code: ${response.status}`);
      }

      return new Promise((resolve, reject) => {
        const writer = createWriteStream(filePath);

        response.data.pipe(writer);

        writer.on('finish', () => {
          const stats = statSync(filePath);
          const fileSizeMB = stats.size / (1024 * 1024); // Convert bytes to MB
          logger.info(`Image downloaded successfully. Size: ${fileSizeMB.toFixed(2)} MB`);
          resolve();
        });

        writer.on('error', (err) => {
          logger.error(`Error writing image to ${filePath}: ${err.message}`);
          reject(new CustomError(ErrorTypes.INTERNAL_SERVER_ERROR, `Error writing image to ${filePath}: ${err.message}`));
        });

        response.data.on('error', (err) => {
          logger.error(`Error streaming image from ${url}: ${err.message}`);
          reject(new CustomError(ErrorTypes.INTERNAL_SERVER_ERROR, `Error streaming image from ${url}: ${err.message}`));
        });
      });
    } catch (error) {
      this.handleError(error, 'Failed to download image');
    }
  }

  getFileSizeInMB(filePath) {
    try {
      const { size } = statSync(filePath); 
      return (size / (1024 * 1024)).toFixed(4); 
    } catch (error) {
      this.handleError(error, 'Failed to get file size');
    }
  }

  async compressImage(inputPath, outputPath) {
    try {
      const originalSizeMB = this.getFileSizeInMB(inputPath);
      logger.info(`Original image size for ${inputPath}: ${originalSizeMB} MB`);

      const image = await Jimp.read(inputPath);
      await image.quality(50).writeAsync(outputPath);

      const compressedSizeMB = this.getFileSizeInMB(outputPath);
      logger.info(`Compressed image size for ${outputPath}: ${compressedSizeMB} MB`);

      const sizeReductionPercentage = ((originalSizeMB - compressedSizeMB) / originalSizeMB * 100).toFixed(2);
      logger.info(`Size reduction: ${sizeReductionPercentage}%`);

      if (sizeReductionPercentage > 10) { 
        logger.warn(`Size reduction is greater than expected: ${sizeReductionPercentage}%`);
      }

    } catch (error) {
      this.handleError(error, 'Failed to compress image');
    }
  }

  async process() {
    this.ensureDirectories();
    const processedProducts = [];
 
    try {
      for (const product of this.productData) {
        const inputUrls = [];
        const outputUrls = [];
        
        for (const url of product.inputUrls) {
          const inputFilePath = join(this.tempDir.name, `input-${this.globalIndex}.jpeg`);
          const outputFilePath = join(this.requestOutputDir, `output-${this.globalIndex}.jpeg`);

          inputUrls.push(url);

          await this.downloadImage(url, inputFilePath);
          await this.compressImage(inputFilePath, outputFilePath);

          outputUrls.push(outputFilePath);
          this.globalIndex++;
        }

        product.inputUrls = inputUrls;
        product.outputUrls = outputUrls;
        processedProducts.push(product);
      }
      return processedProducts;
    } catch (error) {
      this.handleError(error, 'Error processing images');
    } finally {
      this.tempDir.removeCallback();
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

export default ImageProcessingService;
