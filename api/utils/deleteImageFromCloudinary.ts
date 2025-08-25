import cloudinary from "../lib/cloudinary";

export const deleteImageFromCloudinary = async (url: string) => {
  try {
    const afterUpload = url.split("/upload/")[1];
    if (!afterUpload) {
      console.warn("Invalid Cloudinary URL structure.");
      return;
    }

    // Remove version (e.g., v1234567890/) and decode URI
    const parts = afterUpload.split("/");
    const filteredParts = parts.filter((p) => !p.startsWith("v"));
    const publicIdWithExtension = filteredParts.join("/");
    const publicIdDecoded = decodeURIComponent(
      publicIdWithExtension.replace(/\.[^/.]+$/, "")
    );

    const result = await cloudinary.uploader.destroy(publicIdDecoded, {
      resource_type: "image", // Use "image" not "video" unless you're deleting videos
      invalidate: true,
    });

    console.log("Cloudinary deletion result:", result);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
  }
};

export const deleteImageFromCloudinaryById = async (publicId: string) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    console.log("Cloudinary deletion result:", result);
  } catch (error) {
    console.error("Error deleting image from Cloudinary:", error);
  }
};
