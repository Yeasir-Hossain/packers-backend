import { auth, checkAccess } from '../middlewares';
import { getAllCategory, registerCategory, removeCategory } from './category.entity';

export default function category() {
  /**
 * POST /category
 * @description this route is insert a category.
 * @response the product.
 */
  this.route.post('/category', auth, checkAccess('staff', 'product'), registerCategory(this));

  /**
   * GET /category
   * @description this route is used to get all category.
   * @response all the categories.
   */
  this.route.get('/category', auth, checkAccess('staff', 'product'), getAllCategory(this));

  /**
 * GET /deletecategory/:id
 * @description this route is used to delete a single category.
 * @response success or failed
 */
  this.route.get('/deletecategory/:id', auth, checkAccess('staff', 'product'), removeCategory(this));
}