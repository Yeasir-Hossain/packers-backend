import path from 'path';

/**
 * @param getImage function is used to serve an image
 * @param req.params contains the image id.
 * @returns the image
 */
export const getImage = () => async (req, res) => {
  try {
    const imageId = req.params.imageId;
    if (!imageId) return res.status(400).send('Bad request');
    const imagePath = path.join(path.resolve(), 'images', imageId);
    res.status(200).sendFile(imagePath);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};