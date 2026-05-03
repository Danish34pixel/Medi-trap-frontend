export const uploadToCloudinary = async (file) => {
  const cloudinaryUrl =
    import.meta.env.VITE_CLOUDINARY_URL ||
    "https://api.cloudinary.com/v1_1/dspnmgzwh/image/upload";
  const uploadPreset =
    import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || "project1";
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);

  try {
    const response = await fetch(cloudinaryUrl, {
      method: "POST",
      body: formData,
    });

    const data = await response.json();

    if (data.error) {
      throw new Error("Image upload failed");
    }

    return data.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    throw new Error("Error uploading image to Cloudinary: " + error.message);
  }
};
