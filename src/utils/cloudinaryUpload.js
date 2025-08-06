export const uploadToCloudinary = async (file) => {
  const cloudinaryUrl =
    "https://api.cloudinary.com/v1_1/dspnmgzwh/image/upload";
  const formData = new FormData();

  formData.append("file", file);
  formData.append("upload_preset", "project1"); // Replace with your actual upload preset

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
