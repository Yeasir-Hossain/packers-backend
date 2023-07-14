import Products from './product.schema';

/**
 * these are the set to validate the request query.
 */
const allowedQuery = new Set(['page', 'limit', 'id', 'paginate', 'sort', 'category', 'subcategory', 'tags']);

/**
 * @param registerProduct function is used to register a product from the products collection
 * @param {Object} req This is the req object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 * @returns
 */
export const registerProduct = ({ db, imageUp }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null) || Object.keys(req.body.data).every((k) => req.body.data[k] !== '' && req.body.data[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images) {
      for (const image of req.files.images) {
        const img = await imageUp(image.path);
        req.body.images = [...(req.body.images || []), img];
      }
    }
    const product = await db.create({ table: Products, key: req.body });
    if (!product) return res.status(400).send('Bad request');
    return res.status(200).send(product);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getAllProducts function is used to get all the products from the products collection
 * there is page query for this function which page of the data it need to show
 * @returns all the products
 */
export const getAllProducts = ({ db }) => async (req, res) => {
  try {
    const products = await db.find({ table: Products, key: { query: req.query, allowedQuery: allowedQuery, paginate: true } });
    res.status(200).send(products);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getSingleProduct function is used to get a signle product from the products collection
 * @param req.params.id This is the id of the product.
 * @returns the product
 */
export const getSingleProduct = ({ db }) => async (req, res) => {
  try {
    const product = await db.findOne({ table: Products, key: { id: req.params.id } });
    res.status(200).send(product);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param updateProduct function updates the single product by id
 * @param req.params.id is the id of the product sent in the params
 * @returns the product after update
 */
export const updateProduct = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const { body } = req;
    const product = await db.update({ table: Products, key: { id: id, body: body } });
    res.status(200).send(product);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeProduct function removes the single product by id
 * @param req.params.id is the id of the product sent in the params
 * @returns success or failed
 */
export const removeProduct = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const product = await db.remove({ table: Products, key: { id } });
    if (!product) return res.status(404).send({ message: 'Product not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};