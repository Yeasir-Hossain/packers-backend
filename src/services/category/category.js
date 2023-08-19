import { auth, checkAccess } from '../middlewares';
import { getAllCategory, registerCategory, removeCategory, updateCategory } from './category.entity';

export default function category() {
  /**
 * POST /category
 * @description this route is insert a category.
 * @response the category.
 */
  this.route.post('/category', auth, checkAccess('staff', 'product'), registerCategory(this));

  /**
   * GET /category
   * @description this route is used to get all category.
   * @response all the categories.
   */
  this.route.get('/category', auth, getAllCategory(this));

  /**
   * PATCH /category
   * @description this route is used to get all category.
   * @response all the categories.
   */
  this.route.patch('/category/:id', auth, updateCategory(this));

  /**
 * GET /deletecategory
 * @description this route is used to delete a single category.
 * @response success or failed
 */
  this.route.delete('/deletecategory', auth, checkAccess('staff', 'product'), removeCategory(this));
}