import 'dotenv/config';
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env';
import { errorHandler } from './middlewares/errorHandler';
import { httpLogger, logger } from './utils/logger';
import { swaggerDefinition } from './docs/swagger';
import restaurantRoutes from './modules/restaurants/restaurant.routes';
import reservationRoutes from './modules/reservations/reservation.routes';
import status from 'http-status';
import moment from 'moment';
import { API_SERVICE_NAME } from './constants';

const app: Application = express();

app.use(helmet({ contentSecurityPolicy: false }));
app.use(httpLogger);
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true }));

app.get('/health', (_req, res) => {
  res.status(status.OK).json({
    status: 'success',
    message: 'Server is running',
    timestamp: moment.utc().format('YYYY-MM-DD HH:mm:ss'),
  });
});

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDefinition));

app.use(`/${API_SERVICE_NAME}/restaurants`, restaurantRoutes);
app.use(`/${API_SERVICE_NAME}/reservations`, reservationRoutes);

app.use((req, res) => {
  res.status(status.NOT_FOUND).json({
    status: 'error',
    message: `Route ${req.originalUrl} not found`,
  });
});

app.use(errorHandler);

const PORT = env.PORT || 3000;

if (env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    logger.info(`API Docs: http://localhost:${PORT}/api-docs`);
  });
}

export default app;
