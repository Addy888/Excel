import { Router } from 'express';
import {
  getSettings,
  updateSettings,
  uploadLogo,
  getWhiteLabelSettings,
} from '../controllers/settingsController';
import { authenticate, requireAdmin } from '../middleware/auth';
import multer from 'multer';
import path from 'path';

const router = Router();

// Configure multer for logo upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'logo-' + uniqueSuffix + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|svg/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Public route for white label settings
router.get('/white-label', getWhiteLabelSettings);

// Protected routes
router.get('/', authenticate, getSettings);
router.put('/', authenticate, requireAdmin, updateSettings);
router.post('/logo', authenticate, requireAdmin, upload.single('logo'), uploadLogo);

export default router;
