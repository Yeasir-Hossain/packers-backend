import Cart from './cart.schema';

/**
 * @param registerCategoty function is used to register a category to the catrgory collection
 * @param {Object} req This is the req object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 * @returns
 */
export const userCart = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    const previousCart = await db.findOne({ table: Cart, key: { user: req.user.id, paginate: false } });
    if (previousCart) {
      if (req.body.products) {
        for (const product of req.body.products) {
          const itemIndex = previousCart.products.findIndex((item) => item.product == product.product);
          //update the existing product
          if (itemIndex > -1) {
            product.productQuantity < 1 ? previousCart.products.splice(itemIndex, 1) : previousCart.products[itemIndex].productQuantity = product.productQuantity;
          }
          //insert the new product in the cart
          else {
            previousCart.products = [...(previousCart.products || []), product];
          }
        }
      }
      //this will be accessed only from admin panel
      if (req.body.requests) {
        for (const request of req.body.requests) {
          const itemIndex = previousCart.requests.findIndex((item) => item.request == request.request);
          //update the existing request
          if (itemIndex > -1) {
            request.requestQuantity < 1 ? previousCart.requests.splice(itemIndex, 1) : previousCart.requests[itemIndex].requestQuantity = request.requestQuantity;
          }
          //insert the new request in the cart
          else {
            previousCart.requests = [...(previousCart.requests || []), request];
          }
        }
      }
      previousCart.save();
      return res.status(200).send(previousCart);
    }
    req.body.user = req.user.id;
    const cart = await db.create({ table: Cart, key: req.body });
    if (!cart) return res.status(400).send('Bad request');
    return res.status(200).send(cart);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

export const getUserCart = ({ db }) => async (req, res) => {
  try {
    const cart = await db.findOne({ table: Cart, key: { user: req.user.id, paginate: false, populate: { path: 'products.product requests.request' } } });
    if (!cart) return res.status(400).send('Bad request');
    return res.status(200).send(cart);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};
