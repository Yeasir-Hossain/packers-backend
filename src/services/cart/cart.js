import { auth } from '../middlewares';
import { getUserCart, userCart } from './cart.entity';

export default function cart() {

  /**
   * POST /cart
   * @description this route is insert items into.
   * @response the product.
   */
  this.route.post('/cart', auth, userCart(this));

  /**
   * GET /cart
   * @description this route is used to get the logged in user cart.
   * @response all the categories.
   */
  this.route.get('/cart', auth, getUserCart(this));

}