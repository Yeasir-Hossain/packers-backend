import { auth, checkAccess, checkRole } from '../middlewares';
import { getAllProducts, getSingleProduct, registerProduct, removeProduct, updateProduct } from './product.entity';

export default function product() {

  /**
   * POST /products
   * @description this route is insert a product.
   * @response the product.
   */
  this.route.post('/products', auth, checkAccess('staff', 'product'), registerProduct(this));

  /**
   * GET /products
   * @description this route is used to get all products.
   * @response all the products.
   */
  this.route.get('/products', auth, checkAccess('staff', 'product'), getAllProducts(this));

  /**
   * GET /products/:id
   * @description this route is used to get a single product.
   * @response the product that the user is looking for.
   */
  this.route.get('/products/:id', auth, getSingleProduct(this));

  /**
 * PATCH /products/:id
 * @description this route is used to update a single product.
 * @response the product that has been updated.
 */
  this.route.patch('/products/:id', auth, checkAccess('staff', 'product'), updateProduct(this));

  /**
   * GET /deleteproduct/:id
   * @description this route is used to delete a single product.
   * @response success or failed
   */
  this.route.get('/deleteproduct/:id', auth, checkRole('admin', 'super-admin'), removeProduct(this));
}