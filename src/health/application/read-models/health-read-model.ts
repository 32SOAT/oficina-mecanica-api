export type HealthReadModel = {
  status: 'ok';
  timestamp: string;
};

/** @deprecated Prefer HealthReadModel */
export type HealthOutput = HealthReadModel;
