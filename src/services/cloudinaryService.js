import { CLOUDINARY_CONFIG, CLOUDINARY_UPLOAD_URL, CLOUDINARY_FOLDERS } from '../config/cloudinary';

/**
 * Upload image to Cloudinary
 * @param {string} imageUri - Local image URI from ImagePicker
 * @param {string} folder - Cloudinary folder (use CLOUDINARY_FOLDERS constants)
 * @param {Object} options - Additional upload options
 * @returns {Promise<Object>} Upload result with secure_url, public_id, etc.
 */
export const uploadToCloudinary = async (imageUri, folder = CLOUDINARY_FOLDERS.PETS, options = {}) => {
  try {
    console.log('📤 Starting Cloudinary upload...');
    console.log('Image URI:', imageUri);
    console.log('Upload URL:', CLOUDINARY_UPLOAD_URL);
    console.log('Folder:', folder);
    
    // Create form data
    const formData = new FormData();
    
    // Get file extension from URI
    const fileExtension = imageUri.split('.').pop();
    const fileName = `image_${Date.now()}.${fileExtension}`;
    
    console.log('File name:', fileName);
    
    // Append image file
    formData.append('file', {
      uri: imageUri,
      type: `image/${fileExtension}`,
      name: fileName,
    });
    
    // Append upload preset (required for unsigned uploads)
    formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    
    // Append folder
    formData.append('folder', folder);
    
    // Append additional options
    if (options.tags) {
      formData.append('tags', options.tags.join(','));
    }
    
    if (options.context) {
      formData.append('context', options.context);
    }

    console.log('📡 Sending request to Cloudinary...');

    // Upload to Cloudinary
    const response = await fetch(CLOUDINARY_UPLOAD_URL, {
      method: 'POST',
      body: formData,
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    console.log('📊 Response status:', response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ Cloudinary API error:', errorData);
      throw new Error(errorData.error?.message || `Upload failed with status ${response.status}`);
    }

    const data = await response.json();
    
    console.log('✅ Cloudinary upload success:', {
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      size: data.bytes,
    });

    return {
      success: true,
      url: data.secure_url,
      publicId: data.public_id,
      format: data.format,
      width: data.width,
      height: data.height,
      bytes: data.bytes,
      createdAt: data.created_at,
    };

  } catch (error) {
    console.error('❌ Cloudinary upload error:', error);
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    
    // Provide more helpful error messages
    if (error.message === 'Network request failed') {
      throw new Error('Network error: Unable to reach Cloudinary. Check your internet connection.');
    }
    
    throw error;
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array<string>} imageUris - Array of local image URIs
 * @param {string} folder - Cloudinary folder
 * @returns {Promise<Array>} Array of upload results
 */
export const uploadMultipleToCloudinary = async (imageUris, folder = CLOUDINARY_FOLDERS.PETS) => {
  try {
    const uploadPromises = imageUris.map(uri => uploadToCloudinary(uri, folder));
    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    console.error('❌ Multiple upload error:', error);
    throw error;
  }
};

/**
 * Delete image from Cloudinary (requires backend API)
 * Note: Deletion requires authentication, should be done from backend
 * @param {string} publicId - Cloudinary public_id
 */
export const deleteFromCloudinary = async (publicId) => {
  console.warn('Delete operation should be handled by backend API');
  // This would need to call your backend API which has the API secret
  // Backend endpoint: POST /api/cloudinary/delete
  // Body: { publicId }
};

/**
 * Get optimized image URL with transformations
 * @param {string} publicId - Cloudinary public_id
 * @param {Object} transformations - Transformation options
 * @returns {string} Transformed image URL
 */
export const getOptimizedImageUrl = (publicId, transformations = {}) => {
  const {
    width = 'auto',
    height = 'auto',
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = transformations;

  const baseUrl = `https://res.cloudinary.com/${CLOUDINARY_CONFIG.cloudName}/image/upload`;
  const transformation = `w_${width},h_${height},c_${crop},q_${quality},f_${format}`;
  
  return `${baseUrl}/${transformation}/${publicId}`;
};

export default {
  uploadToCloudinary,
  uploadMultipleToCloudinary,
  deleteFromCloudinary,
  getOptimizedImageUrl,
};
