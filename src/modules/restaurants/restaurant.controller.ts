import { Request, Response } from 'express';
import { RestaurantService } from './restaurant.service';
import { asyncHandler } from '../../middlewares/errorHandler';
import status from 'http-status';
import { addTableSchema, createRestaurantSchema, getRestaurantSchema } from './restaurant.schema';
import z from 'zod';

const restaurantService = new RestaurantService();

export const createRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const payload = req.body as unknown as z.infer<typeof createRestaurantSchema>['body'];
  const restaurant = await restaurantService.createRestaurant(payload);

  res.status(status.OK).json({
    status: 'success',
    data: { restaurant },
  });
});

export const addTable = asyncHandler(async (req: Request, res: Response) => {
  const { restaurant: restaurantId } = req.params as unknown as z.infer<typeof addTableSchema>['params'];
  const payload = req.body as unknown as z.infer<typeof addTableSchema>['body'];

  const table = await restaurantService.addTable(restaurantId, payload);

  res.status(status.OK).json({
    status: 'success',
    data: { table },
  });
});

export const getRestaurant = asyncHandler(async (req: Request, res: Response) => {
  const { restaurant: restaurantId } = req.params as unknown as z.infer<typeof getRestaurantSchema>['params'];

  const restaurant = await restaurantService.getRestaurantDetails(restaurantId);

  res.status(status.OK).json({
    status: 'success',
    data: { restaurant },
  });
});

export const listRestaurants = asyncHandler(async (_req: Request, res: Response) => {
  const restaurants = await restaurantService.listRestaurants();

  res.status(status.OK).json({
    status: 'success',
    data: { restaurants },
  });
});

export const getRestaurantTables = asyncHandler(async (req: Request, res: Response) => {
  const { restaurant } = req.params as unknown as z.infer<typeof getRestaurantSchema>['params'];
  const tables = await restaurantService.getRestaurantTables(restaurant);

  res.status(status.OK).json({
    status: 'success',
    data: { tables },
  });
});
