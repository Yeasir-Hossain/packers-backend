import { auth } from '../middlewares';
import { getAllBlogs, getSingleBlog, registerBlog, removeBlog, updateBlog } from './blog.entity';


export default function blog() {

  /**
   * POST /blog
   * @description this route is insert a blog.
   * @response the blog.
   */
  this.route.post('/blog', auth, registerBlog(this));

  /**
   * GET /blog
   * @description this route is used to get all blog.
   * @response all the blog.
   */
  this.route.get('/blog', auth, getAllBlogs(this));

  /**
   * GET /blog/:id
   * @description this route is used to get a single blog.
   * @response the blog that the user is looking for.
   */
  this.route.get('/blog/:id', auth, getSingleBlog(this));

  /**
 * PATCH /blog/:id
 * @description this route is used to update a single blog.
 * @response the blog that has been updated.
 */
  this.route.patch('/blog/:id', auth, updateBlog(this));

  /**
   * GET /deleteblog/:id
   * @description this route is used to delete a single blog.
   * @response success or failed
   */
  this.route.delete('/deleteblog/:id', auth, removeBlog(this));
}