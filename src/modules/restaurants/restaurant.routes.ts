import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import { createRestaurant, addTable, getRestaurant, listRestaurants, getRestaurantTables } from './restaurant.controller';
import { validate } from '../../middlewares/validator';
import { createRestaurantSchema, addTableSchema, getRestaurantSchema } from './restaurant.schema';

const router: ExpressRouter = Router();

router.post('/', validate(createRestaurantSchema.shape.body), createRestaurant);
router.get('/', listRestaurants);
router.get('/:restaurant', validate(getRestaurantSchema.shape.params, 'params') as any, getRestaurant);
router.post('/:restaurant/tables', validate(addTableSchema.shape.params, 'params') as any, validate(addTableSchema.shape.body), addTable);
router.get('/:restaurant/tables', validate(getRestaurantSchema.shape.params, 'params') as any, getRestaurantTables);

export default router;
