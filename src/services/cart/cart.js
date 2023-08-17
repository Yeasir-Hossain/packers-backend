import { auth } from '../middlewares';
import { addDiscount, getUserCart, registerCart } from './cart.entity';

export default function cart() {

  /**
   * POST /cart
   * @description this route is insert items into.
   * @response the cart.
   */
  this.route.post('/cart', auth, registerCart(this));

  /**
   * GET /cart
   * @description this route is used to get the logged in user cart.
   * @response the user cart.
   */
  this.route.get('/cart', auth, getUserCart(this));

  /**
   * PATCH /cartdiscount
   * @description this route is used to add discount to cart
   * @response the user cart.
   */
  this.route.patch('/cartdiscount', auth, addDiscount(this));
}