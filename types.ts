
export enum RiskLevel {
  I = 'I',
  II = 'II',
  III = 'III',
  IV = 'IV',
  V = 'V'
}

export interface CalculationResults {
  contractValue: number;
  ibc: number;
  health: number;
  pension: number;
  arl: number;
  vacationProvision: number;
  severanceProvision: number;
  contractualRiskProvision: number;
  totalSocialSecurity: number;
  totalProvisions: number;
  totalCosts: number;
  netIncome: number;
  nonDisposablePercent: number;
}
