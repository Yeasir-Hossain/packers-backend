import { promises as fs } from 'fs';

export default async function deleteImages(imagePaths) {
  try {
    for (const imagePath of imagePaths) {
      await fs.unlink(imagePath);
    }
  } catch (err) {
    console.error('Error deleting images:', err);
  }
}
