import Category from './category.schema';

/**
 * @param registerCategoty function is used to register a category to the catrgory collection
 * @param {Object} req This is the req object.
 * @throws {Error} If the request body includes properties other than those allowed or if there is an error during the database operation.
 * @returns
 */
export const registerCategory = ({ db }) => async (req, res) => {
  try {
    const validobj = Object.keys(req.body).every((k) => req.body[k] !== '' && req.body[k] !== null);
    if (!validobj) res.status(400).send('Bad request');
    const category = await db.create({ table: Category, key: req.body });
    if (!category) return res.status(400).send('Bad request');
    return res.status(200).send(category);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param getAllCategory function is used to get all the categories from the category collection
 * there is page query and other queries for this function which page of the data it need to show
 * @returns all the categories
 */
export const getAllCategory = ({ db }) => async (req, res) => {
  try {
    const categories = await db.find({ table: Category, key: { paginate: false } });
    if (!categories) return res.status(400).send('Bad request');
    return res.status(200).send(categories);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};

/**
 * @param removeCategory function removes the single category by id
 * @param req.params.id is the id of the category sent in the params
 * @returns success or failed
 */
export const removeCategory = ({ db }) => async (req, res) => {
  try {
    const { id } = req.params;
    const category = await db.remove({ table: Category, key: { id } });
    if (!category) return res.status(404).send({ message: 'Category not found' });
    res.status(200).send({ message: 'Deleted Successfully' });
  } catch (err) {
    console.log(err);
    res.status(500).send('Something went wrong');
  }
};