import { getImage } from './image.entity';

export default function image() {

  /**
   * GET /images/:imageId
   * @description this route is used to get an image.
   * @response the image.
   */
  this.route.get('/images/:imageId', getImage(this));
}

