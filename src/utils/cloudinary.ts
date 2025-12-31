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
                quality: "auto:best", 
                fetch_format: "auto",
                // Optional: Standard transformations for all uploads
                transformation: [
                    { width: 500, height: 500, crop: 'limit' } 
                ],
                tags: isLogo ? ['logo', 'setting'] : ['staff', 'photo']
            };
        },
    });
};

// Export the Cloudinary client for use in deletion/management functions later
export { cloudinary };