import { auth, checkAccess } from '../middlewares';
import { abandonDiscount, getAllDiscount, registerDiscount, removeDiscount, useDiscount } from './discount.entity';


export default function discount() {
  /**
   * POST /discount
   * @description this route is insert a discount.
   * @response the product.
   */
  this.route.post('/discount', auth, checkAccess('staff', 'product'), registerDiscount(this));

  /**
   * GET /discount
   * @description this route is used to get all discount.
   * @response all the discount.
   */
  this.route.get('/discount', auth, checkAccess('staff', 'product'), getAllDiscount(this));

  /**
   * GET /deletediscount/:id
   * @description this route is used to delete a single discount.
   * @response success or failed
   */
  this.route.delete('/deletediscount/:id', auth, checkAccess('staff', 'product'), removeDiscount(this));

  /**
   * GET /usediscount
   * @description this route is use a discount.
   * @response success or failed
   */
  this.route.get('/usediscount', auth, useDiscount(this));

  /**
   * GET /usediscount
   * @description this route is use a discount.
   * @response success or failed
   */
  this.route.get('/abandoniscount', auth, abandonDiscount(this));

}