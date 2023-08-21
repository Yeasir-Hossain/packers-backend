import { auth, checkRole } from '../middlewares';
import { getAll, login, logout, me, register, registerStaff, remove, resetpassword, sendOTP, socialSuccess, updateOwn, updateUser, userProfile, verifyOTP } from './user.entity';
import passportAuth from './user.passportauth';

export default function user() {
  passportAuth(this);

  /**
  * POST /user
  * @description This route is used to create a user.
  * @response {Object} 200 - the new user.
  */
  this.route.post('/user', register(this));

  /**
  * POST /staff
  * @description This route is used to create a staff.
  * @response {Object} 200 - the new staff.
  */
  this.route.post('/user/staff', registerStaff(this));

  /**
  * POST /user/login
  * @description this route is used to login a user.
  * @response {Object} 200 - the user.
  */
  this.route.post('/user/login', login(this));

  /**
  * GET /user/me
  * @description this route is used to get user profile.
  * @response {Object} 200 - the user.
  */
  this.route.get('/user/me', auth, me(this));

  /**
  * POST /user/logout
  * @description this route is used to logout a user.
  * @response {Object} 200 - the user.
  */
  this.route.post('/user/logout', auth, logout(this));

  /**
  * GET /user
  * @description this route is used to used get all user.
  * @response {Object} 200 - the users.
  */
  this.route.get('/user', auth, checkRole(['admin', 'super-admin']) ,getAll(this));

  /**
  * GET user/profile/:id
  * @description this route is used to get a user profile by id.
  * @response {Object} 200 - the user.
  */
  this.route.get('/user/profile/:id', auth, checkRole(['admin', 'super-admin']), userProfile(this));

  /**
  * PATCH ‘/user/me’
  * @description this route is used to update own profile.
  * @response {Object} 200 - the user.
  */
  this.route.patch('/user/me', auth, updateOwn(this));

  /**
  * PATCH ‘/user/:id’
  * @description this route is used to update user profile.
  * @response {Object} 200 - the user.
  */
  this.route.patch('/user/:id', auth, checkRole(['admin']), updateUser(this));

  /**
   * DELETE ‘/user/:id’
   * @description this route is used to delte user profile.
   * @response {Object} 200 - the user.
   */
  this.route.delete('/user/:id', auth, checkRole(['admin', 'super-admin']), remove(this));

  /**
   * POST ‘/user/sendotp'
   * @description this route is used to send OTP.
   * @response {Object} 200 - the user.
   */
  this.route.post('/user/sendotp', sendOTP(this));

  /**
   * POST ‘/user/verifyotp'
   * @description this route is used to verify OTP.
   * @response {Object} 200 - the user.
   */
  this.route.post('/user/verifyotp', verifyOTP());

  /**
   * PATCH ‘/user/resetpassword'
   * @description this route is used to reset password.
   * @response {Object} 200 - the user.
   */
  this.route.post('/user/resetpassword', resetpassword(this));

  /**
   * GET ‘/login/google'
   * @description this route is used to login with google.
   * @response {Object} 200 - the user.
   */
  this.route.get('/login/google', this.passport.authenticate('google'));

  /**
   * GET ‘/login/facebook'
   * @description this route is used to login with facebook.
   * @response {Object} 200 - the user.
   */
  this.route.get('/login/facebook', this.passport.authenticate('facebook'));

  /**
   * The below routes are callbacks for social authentication, successful login and failed login
   */
  this.route.get('/google/callback', this.passport.authenticate('google', {
    successReturnToOrRedirect: 'http://localhost:5173/',
    failureRedirect: '/api/social/failure'
  }));

  this.route.get('/facebook/callback', this.passport.authenticate('facebook', {
    successReturnToOrRedirect: 'http://localhost:5173/',
    failureRedirect: '/api/social/failure'
  }));

  /**
   * GET '/social/success'
   * @description this route is send the user data after social login
   * @response {Object} 200 - the user.
   */
  this.route.get('/social/success', socialSuccess(this));

  this.route.get('/social/failure', (req, res) => {
    res.status(400).send({ message: 'Something went wrong', status: false });
  });

}