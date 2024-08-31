import { Router } from 'express';
import multer from 'multer';
import productController from '../controllers/productController.js';

const router = Router();
const upload = multer({ dest: 'input_csvs/' });

router.get('/status/:requestId', productController.checkStatus);

router.post('/upload', upload.single('file'), productController.uploadCSV);


export default router;
