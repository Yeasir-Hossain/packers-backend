import Blog from './blog.schema';

//   these are the set to validate the request query.
const allowedQuery = new Set(['page', 'limit', 'id', 'paginate', 'sort']);

/**
 * @param registerBlog function is used register blog
 * @param {Object} req This is the req object.
 * @returns
 */
export const registerBlog = ({ db, imageUp }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined) || Object.keys(req.body.data).every((k) => req.body.data[k] !== '' || req.body.data[k] !== undefined);
    if (!validobj) res.status(400).send({ message: 'Bad Request', status: false });
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images?.path) req.body.banner = await imageUp(req.files.images.path);
    req.body.user = req.user.id;
    const blog = await db.create({ table: Blog, key: req.body });
    blog ? res.status(200).send(blog) : res.status(400).send({ message: 'Bad Request', status: false });
  }

  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getAllBlogs function is used to get all the blogs
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns all the blogs
 */
export const getAllBlogs = ({ db }) => async (req, res) => {
  try {
    const blog = await db.find({ table: Blog, key: { query: req.query, allowedQuery: allowedQuery, populate: { path: 'user', select: 'fullname email' } } });
    blog ? res.status(200).send(blog) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getSingleBlog function is used to get a signle blog
 * @param req.params.id This is the id of the blog.
 * @returns the blog
 */
export const getSingleBlog = ({ db }) => async (req, res) => {
  try {
    const blog = await db.findOne({ table: Blog, key: { id: req.params.id, populate: { path: 'user', select: 'fullname email' } } });
    blog ? res.status(200).send(blog) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param updateBlog function updates the single blog by id
 * @param req.params.id is the id of the blog sent in the params
 * @returns the blog after update
 */
export const updateBlog = ({ db, imageUp }) => async (req, res) => {
  try {
    const { id } = req.params;
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' || req.body[k] !== undefined) || Object.keys(req.body.data).every((k) => req.body.data[k] !== '' || req.body.data[k] !== undefined);
    if (!validobj) res.status(400).send({ message: 'Bad Request', status: false });
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images?.path) req.body.banner = await imageUp(req.files.images.path);
    const blog = await db.update({ table: Blog, key: { id: id, body: req.body } });
    blog ? res.status(200).send(blog) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeBlog function removes the product by id
 * @param req.params.id is the id of the blog sent in the params
 * @returns success or failed
 */
export const removeBlog = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await db.remove({ table: Blog, key: { id } });
    blog ? res.status(200).send({ message: 'Deleted Successfully', status: true }) : res.status(400).send({ message: 'Blog not found', status: false });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};