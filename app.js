import express from 'express';
import mongoose from 'mongoose';
import productRoutes from './routes/productRoutes.js';

const app = express();

mongoose.connect('mongodb://localhost:27017/imageProcessing', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;

db.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

db.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});
app.use('/api/product', productRoutes);

app.get('/', (req, res) => {
  res.send('Welcome to the Image Processing API');
});


app.listen(3000, () => {
  console.log('Server started on http://localhost:3000');
});
