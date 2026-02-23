import { v2 as cloudinary } from 'cloudinary';
const CloudinaryStorage = require('multer-storage-cloudinary');
import dotenv from 'dotenv';
dotenv.config(); // Ensure env variables are loaded

// 1. Configure Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true, // Always use HTTPS
});

/**
 * Creates a configured Multer Storage for Cloudinary.
 * @param folder The folder name within the Cloudinary talent-management root.
 * @returns The CloudinaryStorage instance.
 */
export const createCloudinaryStorage = (folder: string): any => {
    return new CloudinaryStorage({
        cloudinary: cloudinary,
        params: async (req: any, file: any) => {
            const isLogo = folder.includes('logos');
            
            // Public ID can be specified for assets that should be easily replaceable
            // and have a consistent URL, like a company logo.
            const publicId = isLogo 
                ? 'company-logo' 
                : undefined; // Let Cloudinary generate a unique ID for staff photos

            return {
                folder: `talent-management/${folder}`, // e.g., 'talent-management/logos'
                format: file.mimetype.split('/')[1],
                public_id: publicId,
                // Optional: apply automatic optimizations
                quality: "auto:good", // Changed from auto:best to auto:good for faster processing
                fetch_format: "auto",
                // Optional: Smaller transformation for faster processing
                transformation: [
                    { width: 400, height: 400, crop: 'limit' } // Reduced from 500x500 to 400x400
                ],
                tags: isLogo ? ['logo', 'setting'] : ['staff', 'photo'],
                // Enable eager transformation for immediate optimization
                eager: [
                    { width: 150, height: 150, crop: 'thumb', gravity: 'face' }, // Thumbnail
                    { width: 400, height: 400, crop: 'limit' } // Standard size
                ]
            };
        },
    });
};

// Export the Cloudinary client for use in deletion/management functions later
export { cloudinary };