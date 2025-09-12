const Minio = require('minio');

let minioClient;

// Storage configuration
const storageConfig = {
  endPoint: process.env.MINIO_ENDPOINT ? process.env.MINIO_ENDPOINT.split(':')[0] : 'minio',
  port: process.env.MINIO_ENDPOINT ? parseInt(process.env.MINIO_ENDPOINT.split(':')[1]) : 9000,
  useSSL: process.env.MINIO_USE_SSL === 'true',
  accessKey: process.env.MINIO_ACCESS_KEY || 'minioaccess',
  secretKey: process.env.MINIO_SECRET_KEY || 'miniosecret'
};

// Initialize Minio client
async function initializeStorage() {
  try {
    minioClient = new Minio.Client(storageConfig);
    
    // Test connection
    await minioClient.listBuckets();
    console.log('Storage (Minio) connected successfully');
    
    // Create default buckets
    await createDefaultBuckets();
    
  } catch (error) {
    console.error('Storage connection failed:', error);
    console.warn('⚠️  Storage features will be disabled');
    minioClient = null;
    // Don't throw error - allow server to start without storage
  }
}

// Create default buckets
async function createDefaultBuckets() {
  const defaultBuckets = [
    { name: 'gallery-images', public: true },
    { name: 'slideshow-images', public: true },
    { name: 'logos', public: true },
    { name: 'custom-fonts', public: true },
    { name: 'fotos', public: true },
    { name: 'custom-sections', public: true }
  ];
  
  for (const bucket of defaultBuckets) {
    try {
      const exists = await minioClient.bucketExists(bucket.name);
      if (!exists) {
        await minioClient.makeBucket(bucket.name, 'us-east-1');
        console.log(`Created bucket: ${bucket.name}`);
        
        // Set public policy if needed
        if (bucket.public) {
          const policy = {
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: { AWS: ['*'] },
                Action: ['s3:GetObject'],
                Resource: [`arn:aws:s3:::${bucket.name}/*`]
              }
            ]
          };
          
          await minioClient.setBucketPolicy(bucket.name, JSON.stringify(policy));
          console.log(`Set public policy for bucket: ${bucket.name}`);
        }
      }
    } catch (error) {
      console.warn(`Failed to create bucket ${bucket.name}:`, error.message);
    }
  }
}

// Get Minio client
function getMinioClient() {
  if (!minioClient) {
    throw new Error('Storage not initialized');
  }
  return minioClient;
}

// Upload file to bucket
async function uploadFile(bucketName, objectName, fileStream, size, metaData = {}) {
  try {
    const client = getMinioClient();
    const result = await client.putObject(bucketName, objectName, fileStream, size, metaData);
    
    return {
      path: objectName,
      id: result.etag,
      fullPath: `${bucketName}/${objectName}`
    };
  } catch (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }
}

// Download file from bucket
async function downloadFile(bucketName, objectName) {
  try {
    const client = getMinioClient();
    return await client.getObject(bucketName, objectName);
  } catch (error) {
    throw new Error(`Download failed: ${error.message}`);
  }
}

// Remove files from bucket
async function removeFiles(bucketName, objectNames) {
  try {
    const client = getMinioClient();
    return await client.removeObjects(bucketName, objectNames);
  } catch (error) {
    throw new Error(`Remove failed: ${error.message}`);
  }
}

// List objects in bucket
async function listObjects(bucketName, prefix = '', recursive = true) {
  try {
    const client = getMinioClient();
    const objects = [];
    
    return new Promise((resolve, reject) => {
      const stream = client.listObjects(bucketName, prefix, recursive);
      
      stream.on('data', (obj) => {
        objects.push(obj);
      });
      
      stream.on('end', () => {
        resolve(objects);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
  } catch (error) {
    throw new Error(`List failed: ${error.message}`);
  }
}

// Get public URL for object
function getPublicUrl(bucketName, objectName) {
  // For local deployments, route through API server instead of direct MinIO access
  const apiPort = process.env.API_PORT || 3000;
  const apiHost = process.env.API_HOST || 'localhost';
  const protocol = process.env.API_SSL === 'true' ? 'https' : 'http';
  
  return `${protocol}://${apiHost}:${apiPort}/storage/${bucketName}/public/${objectName}`;
}

// Create presigned URL for temporary access
async function createPresignedUrl(bucketName, objectName, expiry = 3600) {
  try {
    const client = getMinioClient();
    return await client.presignedUrl('GET', bucketName, objectName, expiry);
  } catch (error) {
    throw new Error(`Presigned URL creation failed: ${error.message}`);
  }
}

// Create bucket
async function createBucket(bucketName, region = 'us-east-1') {
  try {
    const client = getMinioClient();
    const exists = await client.bucketExists(bucketName);
    
    if (exists) {
      throw new Error('Bucket already exists');
    }
    
    await client.makeBucket(bucketName, region);
    return { name: bucketName, region };
  } catch (error) {
    throw new Error(`Bucket creation failed: ${error.message}`);
  }
}

// Get bucket info
async function getBucket(bucketName) {
  try {
    const client = getMinioClient();
    const exists = await client.bucketExists(bucketName);
    
    if (!exists) {
      throw new Error('Bucket not found');
    }
    
    return { name: bucketName, exists: true };
  } catch (error) {
    throw new Error(`Get bucket failed: ${error.message}`);
  }
}

// List all buckets
async function listBuckets() {
  try {
    const client = getMinioClient();
    return await client.listBuckets();
  } catch (error) {
    throw new Error(`List buckets failed: ${error.message}`);
  }
}

// Delete bucket
async function deleteBucket(bucketName) {
  try {
    const client = getMinioClient();
    const exists = await client.bucketExists(bucketName);
    
    if (!exists) {
      throw new Error('Bucket not found');
    }
    
    // Check if bucket is empty
    const objects = await listObjects(bucketName);
    if (objects.length > 0) {
      throw new Error('Bucket is not empty');
    }
    
    await client.removeBucket(bucketName);
    return { name: bucketName };
  } catch (error) {
    throw new Error(`Delete bucket failed: ${error.message}`);
  }
}

module.exports = {
  initializeStorage,
  getMinioClient,
  uploadFile,
  downloadFile,
  removeFiles,
  listObjects,
  getPublicUrl,
  createPresignedUrl,
  createBucket,
  getBucket,
  listBuckets,
  deleteBucket
};