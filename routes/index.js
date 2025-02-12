import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';


const router = express.Router();

/* GET home page. */
router.get('/', (req, res, next) => {
  res.render('index', { title: 'Express' });
});

// Set up image storage using multer
const Storage = multer.diskStorage({
  destination: (req, file, cb) => {

    console.log('req.query', req.query.fieldName)
    if(req.query.fieldName == 'image'){
      const dir = 'uploads/images';
      cb(null, dir);
    }else{
      const dir = 'uploads/documents';
      cb(null, dir);
    }

  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + Math.round(Math.random() * 1E9);
    cb(null, req.query.fieldName + '-' + uniqueSuffix + path.extname(file.originalname));

  }
});


// Middleware function for file upload
const uploadMiddleware = (req, res, next) => {

  const upload = multer({
    storage: Storage, // Use the storage engine set by fileFilter
  }).single('file'); // Adjust field name if needed

  upload(req, res, (err) => {
    if (err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next(); // Continue to the next middleware or route handler
  });
};

router.post('/uploadfile', uploadMiddleware, (req, res) => {
  console.log('req.query.fieldName', req.query.fieldName)
  const file = req.file;

  if (!file) {
    return res.status(400).json({ success: false, message: 'No file uploaded' });
  }

  const normalizedPath = req.file.path.replace(/\\/g, '/');
  console.log('File uploaded:', {
    ...req.file,
    path: normalizedPath
  });

  return res.status(200).json({ status: 200, success: true, filePath: normalizedPath });

});

router.delete('/deletefile', (req, res) => {
  const fileUrl = req.body.filePath; // Expecting the URL to be in the request body
  if (!fileUrl) {
    return res.status(400).send({ message: 'No file URL provided.' });
  }


  // Ensure fileUrl starts with a leading '/'
  const relativePath = fileUrl.startsWith('/') ? fileUrl.substring(1) : fileUrl;

  console.log('relativepath', relativePath)

  // Delete the file
  fs.unlink(relativePath, (err) => {
    if (err) {
      return res.status(200).json({ status: 200, message: 'Failed to delete file.', error: err });
    }
    return res.status(200).json({ status: 200, message: 'File deleted successfully.' });
  });
});

// Set up video storage using multer
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/videos');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}${path.extname(file.originalname)}`);
  }
});

const uploadVideo = multer({ videoStorage });

router.post('/uploadvideo', uploadVideo.single('video'), (req, res) => {
  if (req.file) {
    const normalizedPath = req.file.path.replace(/\\/g, '/');
    console.log('video uploaded:', {
      ...req.file,
      path: normalizedPath
    });
    res.json({ success: true, filePath: normalizedPath });
  } else {
    res.status(400).json({ success: false, message: 'No file uploaded' });
  }
});



export { router, uploadVideo };
