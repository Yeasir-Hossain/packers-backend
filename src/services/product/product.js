import { getAllProducts, getSingleProduct, registerProduct, removeProduct, updateProduct } from './product.entity';

export default function product() {

  /**
   * POST /products
   * @description this route is insert a product.
   * @response the product.
   */
  this.route.post('/products', registerProduct(this));

  /**
   * GET /products
   * @description this route is used to get all products.
   * @response all the products.
   */
  this.route.get('/products', getAllProducts(this));

  /**
   * GET /products/:id
   * @description this route is used to get a single product.
   * @response the product that the user is looking for.
   */
  this.route.get('/products/:id', getSingleProduct(this));

  /**
 * POST /products/:id
 * @description this route is used to update a single product.
 * @response the product that has been updated.
 */
  this.route.post('/products/:id', updateProduct(this));

  /**
   * GET /deleteproduct/:id
   * @description this route is used to delete a single product.
   * @response success or failed
   */
  this.route.get('/deleteproduct/:id', removeProduct(this));
}