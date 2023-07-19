import { auth, checkAccess, checkRole } from '../middlewares';
import { getAllOrders, getSingleOrder, registerOrder, removeOrder, updateOrder } from './order.entity';

export default function order() {

  /**
   * POST /order
   * @description this route is insert a order
   * @response the order.
   */
  this.route.post('/order', auth, registerOrder(this));

  /**
   * GET /order
   * @description this route is used to get all orders.
   * @response all the orders.
   */
  this.route.get('/order', auth, getAllOrders(this));

  /**
   * GET /order/:id
   * @description this route is used to get a single order.
   * @response the order that the user is looking for.
   */
  this.route.get('/order/:id', auth, getSingleOrder(this));

  /**
   * PATCH /order/:id
   * @response the order that has been updated.
   * @description this route is used to update a single order.
   */
  this.route.patch('/order/:id', auth, checkAccess('staff', 'order'), updateOrder(this));

  /**
   * GET /deleteorder/:id
   * @description this route is used to delete a single product.
   * @response success or failed
   */
  this.route.get('/deleteorder/:id', auth, checkRole('admin', 'super-admin'), removeOrder(this));
}