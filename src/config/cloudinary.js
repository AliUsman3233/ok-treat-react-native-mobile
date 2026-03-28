/**
 * Cloudinary Configuration
 * 
 * Note: In React Native/Expo, environment variables need to be accessed differently
 * For now, we'll use direct values. In production, use a secure config management system.
 */

// Cloudinary configuration - Update these with your actual values
export const CLOUDINARY_CONFIG = {
  cloudName: 'dnctinx0s',
  uploadPreset: 'pet_preset',
  apiKey: '723431637562311', // Optional for unsigned uploads
};

// Cloudinary upload URL
export const CLOUDINARY_UPLOAD_URL = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`;

// Folder structure for different image types
export const CLOUDINARY_FOLDERS = {
  PETS: 'oktreat/pets',
  USERS: 'oktreat/users',
  SITTERS: 'oktreat/sitters',
  DOCUMENTS: 'oktreat/documents',
  CHAT: 'oktreat/chat',
};

// Image transformation presets
export const IMAGE_TRANSFORMATIONS = {
  THUMBNAIL: 'c_thumb,w_200,h_200,g_face',
  PROFILE: 'c_fill,w_400,h_400,g_face',
  COVER: 'c_fill,w_1200,h_400',
  FULL: 'c_limit,w_1920,h_1920,q_auto',
};

export default CLOUDINARY_CONFIG;
