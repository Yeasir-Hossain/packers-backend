import { promises as fs } from 'fs';

export default async function deleteImages(imagePaths) {
  for (const imagePath of imagePaths) {
    fs.unlink(imagePath)
      .then(() => console.log(`=> Deleted image: ${imagePath}`))
      .catch(err => console.error(`Error deleting images: ${imagePath}\n${err.message}`));
  }
}
