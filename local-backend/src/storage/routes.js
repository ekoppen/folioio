const express = require('express');
const multer = require('multer');
const { authenticateToken } = require('../auth/middleware');
const { uploadFile, downloadFile, removeFiles, listObjects, getPublicUrl, createPresignedUrl, createBucket, getBucket, listBuckets, deleteBucket, getMinioClient } = require('./client');

const router = express.Router();

// Middleware to check if storage is available
function checkStorageAvailable(req, res, next) {
  const client = getMinioClient();
  if (!client) {
    return res.status(503).json({
      error: { message: 'Storage service is not available' }
    });
  }
  next();
}

// Configure multer for file uploads
const upload = multer({ 
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

// Public routes (no authentication required)
// Handle CORS preflight for public files
router.options('/:bucket/public/:path(*)', (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  res.setHeader('Access-Control-Max-Age', '86400'); // 24 hours
  res.status(200).end();
});

router.get('/:bucket/public/:path(*)', async (req, res) => {
  try {
    console.log(`Public file request: ${req.params.bucket}/${req.params.path}`);
    const { bucket, path } = req.params;
    
    // Set CORS headers for public files
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    res.setHeader('Cache-Control', 'public, max-age=31536000');
    
    const stream = await downloadFile(bucket, path);
    stream.pipe(res);
  } catch (error) {
    console.error('Public file error:', error);
    res.status(404).json({ error: error.message });
  }
});

// Public file access route for portfolio images (without /public/ prefix)
router.get('/:bucket/:path(*)', checkStorageAvailable, async (req, res, next) => {
  try {
    const { bucket, path } = req.params;
    
    // Allow public access to common portfolio buckets without authentication
    const PUBLIC_BUCKETS = ['gallery-images', 'slideshow-images', 'logos', 'fotos'];
    
    if (PUBLIC_BUCKETS.includes(bucket)) {
      console.log(`Public bucket access: ${bucket}/${path}`);
      
      // Set CORS headers for public files
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
      res.setHeader('Cache-Control', 'public, max-age=31536000');
      
      const stream = await downloadFile(bucket, path);
      stream.pipe(res);
      return;
    }
    
    // For non-public buckets, continue to authentication
    next();
    
  } catch (error) {
    // If file not found in public bucket, continue to authentication
    next();
  }
});

// Apply authentication middleware to protected storage routes
router.use(authenticateToken);

// Upload file to bucket
router.post('/:bucket/upload', upload.single('file'), async (req, res) => {
  try {
    const { bucket } = req.params;
    const { path } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const result = await uploadFile(
      bucket,
      path,
      req.file.buffer,
      req.file.size,
      { 'Content-Type': req.file.mimetype }
    );
    
    res.json({ data: result });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Download file from bucket (with authentication)
router.get('/:bucket/download/:path(*)', checkStorageAvailable, async (req, res) => {
  try {
    const { bucket, path } = req.params;
    
    const stream = await downloadFile(bucket, path);
    stream.pipe(res);
  } catch (error) {
    console.error('Download error:', error);
    res.status(404).json({ error: error.message });
  }
});


// Remove files from bucket
router.delete('/:bucket/remove', async (req, res) => {
  try {
    const { bucket } = req.params;
    const { paths } = req.body;
    
    if (!paths || !Array.isArray(paths)) {
      return res.status(400).json({ error: 'Paths array is required' });
    }
    
    await removeFiles(bucket, paths);
    res.json({ data: { message: 'Files removed successfully' } });
  } catch (error) {
    console.error('Remove error:', error);
    res.status(500).json({ error: error.message });
  }
});

// List objects in bucket
router.get('/:bucket/list', async (req, res) => {
  try {
    const { bucket } = req.params;
    const { path = '' } = req.query;
    
    const objects = await listObjects(bucket, path);
    res.json({ data: objects });
  } catch (error) {
    console.error('List error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create signed URL
router.post('/:bucket/signed-url', async (req, res) => {
  try {
    const { bucket } = req.params;
    const { path, expiresIn = 3600 } = req.body;
    
    if (!path) {
      return res.status(400).json({ error: 'Path is required' });
    }
    
    const signedUrl = await createPresignedUrl(bucket, path, expiresIn);
    res.json({ data: { signedUrl } });
  } catch (error) {
    console.error('Signed URL error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Bucket management routes

// Create bucket
router.post('/buckets', async (req, res) => {
  try {
    const { id, public: isPublic } = req.body;
    
    if (!id) {
      return res.status(400).json({ error: 'Bucket ID is required' });
    }
    
    const result = await createBucket(id);
    res.json({ data: result });
  } catch (error) {
    console.error('Create bucket error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get bucket info
router.get('/buckets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await getBucket(id);
    res.json({ data: result });
  } catch (error) {
    console.error('Get bucket error:', error);
    res.status(404).json({ error: error.message });
  }
});

// List all buckets
router.get('/buckets', async (req, res) => {
  try {
    const buckets = await listBuckets();
    res.json({ data: buckets });
  } catch (error) {
    console.error('List buckets error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete bucket
router.delete('/buckets/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const result = await deleteBucket(id);
    res.json({ data: result });
  } catch (error) {
    console.error('Delete bucket error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;