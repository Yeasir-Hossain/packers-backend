import Blog from './blog.schema';


/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['page', 'limit', 'id', 'paginate', 'sort']);

/**
 * @param registerBlog function is used register blog
 * @param {Object} req This is the req object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 * @returns
 */
export const registerBlog = ({ db, imageUp }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null) || Object.keys(req.body.data).every((k) => req.body.data[k] !== '' && req.body.data[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images) {
      const img = await imageUp(req.files?.images.path);
      req.body.banner = img;
    }
    req.body.user = req.user.id;
    const blog = await db.create({ table: Blog, key: req.body });
    if (!blog) return res.status(400).send('Bad request');
    return res.status(200).send(blog);
  }

  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getAllBlogs function is used to get all the blogs
 * there is page query and other queries for this function which page of the data it need to show
 * @returns all the blogs
 */
export const getAllBlogs = ({ db }) => async (req, res) => {
  try {
    const blog = await db.find({ table: Blog, key: { query: req.query, allowedQuery: allowedQuery, populate: { path: 'user', select: 'fullname email' } } });
    if (!blog) return res.status(400).send('Bad request');
    return res.status(200).send(blog);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
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
    if (!blog) return res.status(400).send('Bad request');
    return res.status(200).send(blog);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
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
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null) || Object.keys(req.body.data).every((k) => req.body.data[k] !== '' && req.body.data[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images) {
      const img = await imageUp(req.files?.images.path);
      req.body.banner = img;
    }
    const blog = await db.update({ table: Blog, key: { id: id, body: req.body } });
    if (!blog) return res.status(400).send('Bad request');
    return res.status(200).send(blog);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeBlog function removes the single product by id
 * @param req.params.id is the id of the blog sent in the params
 * @returns success or failed
 */
export const removeBlog = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await db.remove({ table: Blog, key: { id } });
    if (!blog) return res.status(404).send({ message: 'Product not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};