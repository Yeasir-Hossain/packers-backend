import deleteImages from '../../utils/deleteImages';
import Cart from '../cart/cart.schema';
import { sendNotification } from '../notification/notification.entity';
import Request from './request.schema';

/**
 * these are the set to validate the request body or query.
 */
const createAllowed = new Set(['name', 'link', 'note', 'quantity']);
const allowedQuery = new Set(['page', 'limit', 'id', '_id', 'paginate', 'requestNumber']);

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
 * @param {Object} req - The request object have the information about page and any other filter.
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
 * @param getSingleRequest function is used to get a signle request from the requests collection
 * @param req.params.id This is the id of the request.
 * @returns the request request
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
 * @param updateRequest function updates the single request by id
 * @param req.params.id is the id of the request sent in the params
 * @returns the request after update
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
    if (req.query.sendInvoice) {
      req.body.status = 'sent';
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
 * @param removeRequest function removes the request by id
 * @param req.params.id is the id of the request sent in the params
 * @returns success or failed
 */
export const removeRequest = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.status(400).send('Bad Request');
    const requestToDelete = await db.find({ table: Request, key: { query: { '_id': { '$in': req.body.id } }, allowedQuery: allowedQuery, paginate: false } });
    if (requestToDelete.length < 1) return res.status(404).send({ message: 'Product not found' });
    const imagePathsToDelete = requestToDelete.reduce((acc, product) => {
      acc.push(...product.images);
      return acc;
    }, []);
    await deleteImages(imagePathsToDelete);
    const deleteResult = await db.removeAll({ table: Request, key: { id: { $in: req.body.id } } });
    if (deleteResult.deletedCount < 1) return res.status(404).send({ message: 'Product not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param declineRequest function set the status of the request to abondon after the user abondon from the mail
 * @param req.params.id is the id of the request sent in the params
 * @returns success or failed
 */
export const declineRequest = ({ db }) => async (req, res) => {
  try {
    const request = await db.update({ table: Request, key: { id: req.params, body: { status: 'abandoned' } } });
    if (!request) return res.status(404).send({ message: 'Request not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param acceptRequest function send the request to the user cart
 * @param req.params.id is the id of the request sent in the params
 * @returns the cart
 */
export const acceptRequest = ({ db, ws }) => async (req, res) => {
  try {
    const request = await db.update({ table: Request, key: { id: req.params.id, body: { status: 'accepted' } } });
    const tempbody = {
      request: request.id,
      requestQuantity: request.quantity
    };
    const cart = await db.findOne({ table: Cart, key: { user: request.user, paginate: false, populate: { path: 'requests.request' } } });
    if (cart) {
      cart.requests = [...(cart.requests || []), tempbody];
      await cart.save();
      res.status(200).send(cart);
    }
    const createcart = {
      user: request.user,
      requests: [tempbody]
    };
    const newcart = await db.create({ table: Cart, key: createcart });
    if (!newcart) return res.status(404).send({ message: 'Bad Request' });
    sendNotification(db, ws, [{ '_id': request.user }], 'Your request status has been updated check your cart', 'cart');
    res.status(200).send(newcart);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};