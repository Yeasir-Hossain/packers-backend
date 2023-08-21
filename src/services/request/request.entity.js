import deleteImages from '../../utils/deleteImages';
import generateMailTemplate from '../../utils/generateMailTemplate';
import Cart from '../cart/cart.schema';
import Request from './request.schema';
import fs from 'fs';
import path from 'path';
import { sendNotification } from '../notification/notification.function';

// these are the set to validate the request body or query.
const createAllowed = new Set(['name', 'link', 'note', 'quantity', 'images']);
const allowedQuery = new Set(['page', 'limit', 'id', '_id', 'paginate', 'status', 'date', 'requestNumber']);

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
    if (!valid) return res.status(400).send({ message: 'Bad Request', status: false });
    if (req.files?.images?.length > 1) {
      for (const image of req.files.images) {
        const img = await imageUp(image.path);
        req.body.images = [...(req.body.images || []), img];
      }
    }
    else if (req.files?.images) {
      req.body.images = [await imageUp(req.files.images.path)];
    }
    req.body.user = req.user.id;
    const request = await db.create({ table: Request, key: req.body });
    request ? res.status(200).send(request) : res.status(400).send({ message: 'Bad Request', status: false });

  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getAllRequests function is used to get all the requests
 * @param {Object} req - The request object have the information about page and any other filter.
 * @returns all the requests
 */
export const getAllRequests = ({ db }) => async (req, res) => {
  try {
    const request = await db.find({
      table: Request, key: { query: req.query, allowedQuery: allowedQuery, paginate: true, populate: { path: 'user', select: 'fullName email phone address' } }
    });
    request ? res.status(200).send(request) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param getSingleRequest function is used to get a signle request from the requests collection
 * @param req.params.id This is the id of the request.
 * @returns the request request
 */
export const getSingleRequest = ({ db }) => async (req, res) => {
  try {
    const request = await db.findOne({ table: Request, key: { id: req.params.id, populate: { path: 'user', select: 'fullName email address phone' } } });
    request ? res.status(200).send(request) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
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
      req.body.images = [await imageUp(req.files.images.path)];
    }
    const request = await db.update({ table: Request, key: { id: id, body: req.body } });
    request ? res.status(200).send(request) : res.status(400).send({ message: 'Bad Request', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param invoiceRequest function updates the single request by id
 * @param req.params.id is the id of the request sent in the params
 * @returns the request
 */
export const invoiceRequest = ({ db, mail, settings, ws, imageUp }) => async (req, res) => {
  try {
    if (req.body.data) req.body = JSON.parse(req.body.data || '{}');
    if (req.files?.images?.length > 1) {
      for (const image of req.files.images) {
        const img = await imageUp(image.path);
        req.body.images = [...(req.body.images || []), img];
      }
    }
    else if (req.files?.images) {
      req.body.images = [await imageUp(req.files.images.path)];
    }
    const request = await db.update({ table: Request, key: { id: req.params.id, body: req.body, populate: { path: 'user', select: 'email' } } });
    request.status = 'sent';
    await request.save();
    const emailTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'request.ejs'), 'utf-8');
    const options = {
      request,
      serverLink: `${settings.domain}`,
      acceptLink: `${settings.domain}acceptrequest/${request.id}`,
      declineLink: `${settings.domain}declinerequest/${request.id}`,
      toplogo: `${settings.domain}images/toplogo.png`,
      whitelogo: `${settings.domain}images/logowhitetext.png`,
    };
    const html = generateMailTemplate(emailTemplate, options);
    const maillog = await mail({ receiver: request.user.email, subject: 'Request mail', body: html, type: 'html' });
    if (!maillog) {
      const currentDate = new Date();
      const logMessage = `${currentDate.getDate()}/${currentDate.getMonth() + 1}/${currentDate.getFullYear()} ${currentDate.getHours()}:${currentDate.getMinutes()}: Email sending failed for order ID ${request.id}: ${maillog?.rejected?.join(',')}\n`;
      const logStream = fs.createWriteStream(path.join(path.resolve(), 'logs', 'request_email_log.txt'), { flags: 'a' });
      logStream.write(logMessage);
      logStream.end();
      sendNotification(db, ws, [{ '_id': request.user }], 'Your have a new request in your mail. Please check', 'cart');
    }
    return res.status(200).send(request);
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};

/**
 * @param removeRequest function removes the request by id
 * @param req.params.id is the id of the request sent in the params
 * @returns success or failed
 */
export const removeRequest = ({ db }) => async (req, res) => {
  try {
    if (!req.body.id.length) return res.status(400).send({ message: 'Bad Request', status: false });
    const requestToDelete = await db.find({ table: Request, key: { query: { '_id': { '$in': req.body.id } }, allowedQuery: allowedQuery, paginate: false } });
    if (requestToDelete.length < 1) return res.status(400).send({ message: 'Request not found' });
    const imagePathsToDelete = requestToDelete.reduce((acc, product) => {
      acc.push(...product.images);
      return acc;
    }, []);
    await deleteImages(imagePathsToDelete);
    const deleteResult = await db.removeAll({ table: Request, key: { id: { '$in': req.body.id } } });
    deleteResult.deletedCount < 1 ? res.status(400).send({ message: 'Request not found' }) : res.status(200).send({ message: 'Deleted Successfully', status: true });
  } catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
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
    // redirect to front end
    request ? res.status(200).send({ message: 'Deleted Successfully', status: true }) : res.status(400).send({ message: 'Request not found', status: false });
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
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
    // if (!request)  redirect to front end
    const tempbody = {
      request: request.id,
      requestQuantity: request.quantity
    };
    const cart = await db.findOne({ table: Cart, key: { user: request.user, paginate: false, populate: { path: 'requests.request' } } });
    if (cart) {
      cart.requests = [...(cart.requests || []), tempbody];
      await cart.save();
      sendNotification(db, ws, [{ '_id': request.user }], 'Your request status has been updated check your cart', 'cart');
      // redirect to front end
      return res.status(200).send(cart);
    }
    const createcart = {
      user: request.user,
      requests: [tempbody]
    };
    const newcart = await db.create({ table: Cart, key: createcart });
    if (!newcart) return res.status(400).send({ message: { message: 'Bad Request', status: false } });
    sendNotification(db, ws, [{ '_id': request.user }], 'Your request status has been updated check your cart', 'cart');
    // redirect to front end
    res.status(200).send(request);
  }
  catch (err) {
    console.log(err);
    res.status(500).send({ message: 'Something went wrong', status: false });
  }
};