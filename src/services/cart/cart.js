import { auth } from '../middlewares';
import { getUserCart, userCart } from './cart.entity';

export default function cart() {

  /**
   * POST /cart
   * @description this route is insert items into.
   * @response the cart.
   */
  this.route.post('/cart', auth, userCart(this));

  /**
   * GET /cart
   * @description this route is used to get the logged in user cart.
   * @response the user cart.
   */
  this.route.get('/cart', auth, getUserCart(this));

}