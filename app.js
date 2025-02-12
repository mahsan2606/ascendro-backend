import express, { response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import logger from 'morgan';
import path from 'path';
import cookieParser from 'cookie-parser';
import http from 'http';
import { fileURLToPath } from 'url';
import { dbConnection } from './config/db_connection.js';
import errorHandlerMiddleware from './middleware/errorHandler.js';
import corsMiddleware from './middleware/corsMiddleware.js';
import authenticationRoutes from './routes/authentication/authenticationRoutes.js';
import userRoutes from './routes/user/userRoutes.js';
import { router } from './routes/index.js';
import settingRoutes from './routes/settings/settingRoutes.js';
import { promises as fs } from 'fs';



dotenv.config();
const app = express();
dbConnection()

// Configure CORS middleware
app.use(cors())
app.use(corsMiddleware);

// view engine setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'ejs');

// Middleware to parse JSON and URL-encoded request bodies
app.use(cookieParser());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, './public')));
// Serve static files from the 'uploads/images/movies' directory
app.use('/uploads', express.static(path.join(__dirname, './uploads')));

// Error handler middleware
app.use(errorHandlerMiddleware);


// location tracking via ip address
app.get('/getipaddress', async (req, res) => {
  try {
    http.get('http://api.ipify.org/?format=json', (resp) => {
      let data = '';
      // Accumulate data chunks as they come in
      resp.on('data', (chunk) => {
        data += chunk;
      });

      // Process the complete response
      resp.on('end', () => {
        try {
          const ipAddress = JSON.parse(data).ip;
          res.json({ ip: ipAddress }); // Send IP address as JSON response
        } catch (error) {
          console.error('Error parsing response:', error);
          res.status(500).json({ error: 'Failed to fetch IP address' });
        }
      });
    }).on('error', (error) => {
      console.error('Error making request:', error);
      res.status(500).json({ error: 'Failed to fetch IP address' });
    });

  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch IP address' });
  }
});

app.use('/', router);

// authentication routes
app.use('/authentication', authenticationRoutes);



// user routes
app.use('/users', userRoutes);

app.use('/settings', settingRoutes);



export default app;



