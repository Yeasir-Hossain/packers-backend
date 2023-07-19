import { auth, checkAccess, checkRole } from '../middlewares';
import { getAllRequests, getSingleRequest, registerRequest, removeRequest, updateRequest } from './request.entity';


export default function request() {

  /**
   * POST /request
   * @description this route is insert a request.
   * @response the request.
   */
  this.route.post('/request', auth, registerRequest(this));

  /**
   * GET /request
   * @description this route is used to get all requests.
   * @response all the requests.
   */
  this.route.get('/request', auth, getAllRequests(this));

  /**
   * GET /request/:id
   * @description this route is used to get a single request.
   * @response the request that the user is looking for.
   */
  this.route.get('/request/:id', auth, getSingleRequest(this));

  /**
 * PATCH /request/:id
 * @description this route is used to update a single request.
 * @response the product that has been updated.
 */
  this.route.patch('/request/:id', auth, checkAccess('staff', 'request'), updateRequest(this));

  /**
   * GET /deleterequest/:id
   * @description this route is used to delete a single request.
   * @response success or failed
   */
  this.route.get('/deleterequest/:id', auth, checkRole('admin', 'super-admin'), removeRequest(this));
}