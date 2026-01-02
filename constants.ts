
import { RiskLevel } from './types';

export const IBC_PERCENTAGE = 0.40;
export const HEALTH_RATE = 0.125;
export const PENSION_RATE = 0.16;

export const ARL_RATES: Record<RiskLevel, number> = {
  [RiskLevel.I]: 0.00522,
  [RiskLevel.II]: 0.01044,
  [RiskLevel.III]: 0.02436,
  [RiskLevel.IV]: 0.04350,
  [RiskLevel.V]: 0.06960,
};

export const VACATION_PROVISION_RATE = 0.0417;
export const SEVERANCE_PROVISION_RATE = 0.0933; // Combined Cesantías + Intereses
