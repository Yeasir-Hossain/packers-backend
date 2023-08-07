import { auth, checkAccess, checkRole } from '../middlewares';
import { acceptSupport, entry, getAllSupport, getSingleSupport, registerSupport, removeSupport, updateSupport } from './support.entity';

export default function support() {

  /**
   * POST /support
   * @description this route is insert a Support.
   * @response the Support.
   */
  this.route.post('/support', auth, registerSupport(this));

  /**
   * GET /support
   * @description this route is used to get all support.
   * @response all the support.
   */
  this.route.get('/support', auth, checkAccess('staff', 'support'), getAllSupport(this));

  /**
   * GET /support/:id
   * @description this route is used to get a single Support.
   * @response the Support that the user is looking for.
   */
  this.route.get('/support/:id', auth, getSingleSupport(this));

  /**
 * PATCH /support/:id
 * @description this route is used to update a single Support.
 * @response the Support that has been updated.
 */
  this.route.patch('/support/:id', auth, checkAccess('staff', 'support'), updateSupport(this));

  /**
 * PATCH /support/:id
 * @description this route is used to update a single Support.
 * @response the Support that has been updated.
 */
  this.route.patch('/acceptsupport/:id', auth, checkAccess('staff', 'support'), acceptSupport(this));

  /**
   * GET /deletesupport/:id
   * @description this route is used to delete a single Support.
   * @response success or failed
   */
  this.route.delete('/deletesupport', auth, checkRole('admin', 'super-admin'), removeSupport(this));
}

export const entryEvent = (app) => {
  app.register('entry', entry);
};