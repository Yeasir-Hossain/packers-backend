import Request from './request.schema';

/**
 * these are the set to validate the request body or query.
 */
const createAllowed = new Set(['name', 'link', 'note', 'quantity']);
const allowedQuery = new Set(['page', 'limit', 'id', 'paginate', 'requestNumber']);

/**
 * @param registerRequest function is used to register a request to the request collection
 * @param {Object} req This is the req object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 * @returns the request
 */
export const registerRequest = ({ db, imageUp }) => async (req, res) => {
  try {
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    const valid = Object.keys(req.body).every(k => createAllowed.has(k));
    if (!valid) return res.status(400).send('Bad request');
    if (req.files?.images.length > 1) {
      for (const image of req.files.images) {
        const img = await imageUp(image.path);
        req.body.images = [...(req.body.images || []), img];
      }
    }
    else if (req.files?.images) {
      const img = await imageUp(req.files?.images.path);
      req.body.images = [img];
    }
    req.body.user = req.user.id;
    const request = await db.create({ table: Request, key: req.body });
    if (!request) return res.status(400).send('Bad request');
    return res.status(200).send(request);

  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getAllRequests function is used to get all the requests
 * there is page query and other queries for this function which page of the data it need to show
 * @returns all the requests
 */
export const getAllRequests = ({ db }) => async (req, res) => {
  try {
    const requests = await db.find({
      table: Request, key: { query: req.query, allowedQuery: allowedQuery, paginate: true, populate: { path: 'user', select: 'fullName email phone address' } }
    });
    if (!requests) return res.status(400).send('Bad request');
    return res.status(200).send(requests);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getSingleRequest function is used to get a signle product from the products collection
 * @param req.params.id This is the id of the product.
 * @returns the request product
 */
export const getSingleRequest = ({ db }) => async (req, res) => {
  try {
    const request = await db.findOne({ table: Request, key: { id: req.params.id } });
    if (!request) return res.status(400).send('Bad request');
    return res.status(200).send(request);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param updateRequest function updates the single product by id
 * @param req.params.id is the id of the product sent in the params
 * @returns the product after update
 */
export const updateRequest = ({ db, imageUp }) => async (req, res) => {
  try {
    const { id } = req.params;
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images?.length > 1) {
      for (const image of req.files.images) {
        const img = await imageUp(image.path);
        req.body.images = [...(req.body.images || []), img];
      }
    }
    else if (req.files?.images) {
      const img = await imageUp(req.files?.images.path);
      req.body.images = [img];
    }
    const request = await db.update({ table: Request, key: { id: id, body: req.body } });
    if (!request) return res.status(400).send('Bad request');
    return res.status(200).send(request);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeRequest function removes the single product by id
 * @param req.params.id is the id of the product sent in the params
 * @returns success or failed
 */
export const removeRequest = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const request = await db.remove({ table: Request, key: { id } });
    if (!request) return res.status(404).send({ message: 'Request product not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};