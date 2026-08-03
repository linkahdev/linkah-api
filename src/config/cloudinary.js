import cloudinaryPkg from 'cloudinary';

const cloudinary = cloudinaryPkg.v2;

cloudinary.config({
  secure: true,
});

export default cloudinary;