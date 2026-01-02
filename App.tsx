import React, { useState, useMemo } from 'react';
import { RiskLevel, CalculationResults } from './types';
import {
  IBC_PERCENTAGE,
  HEALTH_RATE,
  PENSION_RATE,
  ARL_RATES,
  VACATION_PROVISION_RATE,
  SEVERANCE_PROVISION_RATE
} from './constants';

const App: React.FC = () => {
  const [contractValue, setContractValue] = useState<number>(5000000);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.I);
  // Dynamic contractual risk percentage (0 to 20)
  const [contractualRiskPercent, setContractualRiskPercent] = useState<number>(10.0);

  const results = useMemo((): CalculationResults => {
    const ibc = contractValue * IBC_PERCENTAGE;
    const health = ibc * HEALTH_RATE;
    const pension = ibc * PENSION_RATE;
    const arl = ibc * ARL_RATES[riskLevel];

    const vacationProvision = contractValue * VACATION_PROVISION_RATE;
    const severanceProvision = contractValue * SEVERANCE_PROVISION_RATE;
    
    const contractualRiskRate = contractualRiskPercent / 100;
    const contractualRiskProvision = contractValue * contractualRiskRate;

    const totalSocialSecurity = health + pension + arl;
    const totalProvisions = vacationProvision + severanceProvision + contractualRiskProvision;
    const totalCosts = totalSocialSecurity + totalProvisions;
    const netIncome = contractValue - totalCosts;

    const nonDisposablePercent = contractValue > 0 ? (totalCosts / contractValue) * 100 : 0;

    return {
      contractValue,
      ibc,
      health,
      pension,
      arl,
      vacationProvision,
      severanceProvision,
      contractualRiskProvision,
      totalSocialSecurity,
      totalProvisions,
      totalCosts,
      netIncome,
      nonDisposablePercent
    };
  }, [contractValue, riskLevel, contractualRiskPercent]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const handleRiskChange = (valStr: string) => {
    let val = parseFloat(valStr);
    if (isNaN(val)) val = 0;
    if (val > 20) val = 20;
    if (val < 0) val = 0;
    setContractualRiskPercent(val);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:py-16 xl:text-[18px]">
      <div className="max-w-4xl mx-auto xl:max-w-7xl">
        {/* Header */}
        <header className="mb-12 lg:mb-16 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight sm:text-4xl lg:text-5xl mb-4">
            Calculadora de Ingreso Real
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto lg:text-xl">
            Calcula cuánto dinero te queda realmente después de aportes legales y provisiones financieras como contratista independiente en Colombia.
          </p>
        </header>

        {/* Main Grid: Responsive 1, 2, or 3 columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start">
          
          {/* COLUMN 1: Inputs & Efficiency Visualization */}
          <div className="flex flex-col gap-8">
            <section className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-slate-800">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                Datos del Contrato
              </h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Valor Mensual del Contrato (COP)
                  </label>
                  <input
                    type="number"
                    value={contractValue || ''}
                    onChange={(e) => setContractValue(Number(e.target.value))}
                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none text-lg font-medium"
                    placeholder="Ej. 5,000,000"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nivel de Riesgo ARL
                  </label>
                  <select
                    value={riskLevel}
                    onChange={(e) => setRiskLevel(e.target.value as RiskLevel)}
                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all cursor-pointer text-lg font-medium"
                  >
                    <option value={RiskLevel.I}>Clase I (0.522%) - Administrativos</option>
                    <option value={RiskLevel.II}>Clase II (1.044%) - Manufactura</option>
                    <option value={RiskLevel.III}>Clase III (2.436%) - Construcción/Agro</option>
                    <option value={RiskLevel.IV}>Clase IV (4.350%) - Transporte</option>
                    <option value={RiskLevel.V}>Clase V (6.960%) - Minería/Alto Riesgo</option>
                  </select>
                </div>
              </div>

              <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100">
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong>Nota:</strong> El Ingreso Base de Cotización (IBC) se calcula automáticamente sobre el 40% del valor de tu contrato, según la ley vigente para prestadores de servicios.
                </p>
              </div>
            </section>

            <section className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-6">Eficiencia del Contrato</h2>
              <div className="relative pt-1">
                <div className="flex mb-3 items-center justify-between">
                  <span className="text-xs font-bold py-1.5 px-3 uppercase rounded-full text-blue-600 bg-blue-100">
                    Gastos y Deducciones
                  </span>
                  <span className="text-lg font-bold text-blue-600">
                    {results.nonDisposablePercent.toFixed(1)}%
                  </span>
                </div>
                <div className="overflow-hidden h-4 mb-6 flex rounded-full bg-slate-100">
                  <div
                    style={{ width: `${results.nonDisposablePercent}%` }}
                    className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-500 transition-all duration-700 ease-out"
                  ></div>
                </div>
                <p className="text-sm text-slate-500 italic leading-relaxed">
                  Esto significa que de cada $1.000 que cobras, {(100 - results.nonDisposablePercent).toFixed(1)}% es realmente tuyo para gastos personales.
                </p>
              </div>
            </section>
          </div>

          {/* COLUMN 2: Details of Social Security and Provisions */}
          <div className="flex flex-col gap-8">
            <section className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Seguridad Social</h3>
                <span className="text-red-600 bg-red-50 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter border border-red-100">Obligatorio</span>
              </div>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm lg:text-base">
                  <span className="text-slate-500">Salud (12.5% IBC)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.health)}</span>
                </li>
                <li className="flex justify-between items-center text-sm lg:text-base">
                  <span className="text-slate-500">Pensión (16% IBC)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.pension)}</span>
                </li>
                <li className="flex justify-between items-center text-sm lg:text-base">
                  <span className="text-slate-500">ARL (Riesgo {riskLevel})</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.arl)}</span>
                </li>
                <li className="pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-xl text-slate-900">
                  <span>Total Aportes</span>
                  <span>{formatCurrency(results.totalSocialSecurity)}</span>
                </li>
              </ul>
              
              <div className="mt-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start shadow-sm">
                  <svg className="w-5 h-5 text-slate-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-[12px] lg:text-[13px] text-slate-500 leading-relaxed italic">
                    Estos aportes son obligatorios por ley para contratistas con IBC sobre el 40% del valor bruto. No son valores ajustables por el usuario.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Provisiones Financieras</h3>
                <span className="text-amber-600 bg-amber-50 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter border border-amber-100">Sugerido</span>
              </div>
              <ul className="space-y-6">
                <li className="flex justify-between items-center text-sm lg:text-base">
                  <span className="text-slate-500">Vacaciones (4.17%)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.vacationProvision)}</span>
                </li>
                <li className="flex justify-between items-center text-sm lg:text-base">
                  <span className="text-slate-500">Cesantías + Int. (9.33%)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.severanceProvision)}</span>
                </li>
                
                <li className="pt-2">
                  <label htmlFor="risk-input" className="block text-sm font-semibold text-slate-700 mb-3">Riesgo Contractual (%)</label>
                  <div className="flex flex-col gap-4">
                    <div className="relative">
                      <input
                        id="risk-input"
                        type="number"
                        min="0"
                        max="20"
                        step="0.1"
                        value={contractualRiskPercent}
                        onChange={(e) => handleRiskChange(e.target.value)}
                        className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all font-medium text-lg"
                        placeholder="10.0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl">%</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Bajo', val: 5 },
                        { label: 'Medio', val: 10 },
                        { label: 'Alto', val: 15 }
                      ].map((preset) => (
                        <button
                          key={preset.label}
                          type="button"
                          onClick={() => setContractualRiskPercent(preset.val)}
                          className={`flex-1 px-3 py-2.5 text-[11px] font-bold rounded-lg border transition-all uppercase tracking-widest ${
                            contractualRiskPercent === preset.val
                              ? 'bg-blue-600 text-white border-blue-600 shadow-md shadow-blue-200'
                              : 'bg-white text-slate-600 border-slate-200 hover:border-blue-300 hover:bg-blue-50'
                          }`}
                        >
                          {preset.label} ({preset.val}%)
                        </button>
                      ))}
                    </div>

                    <p className="text-[12px] text-slate-500 leading-relaxed italic">
                      Ajusta este valor según retrasos en pagos, estabilidad del contrato o riesgo de terminación.
                    </p>
                  </div>
                </li>

                <li className="flex justify-between items-center font-semibold text-slate-700 text-sm lg:text-base pt-2">
                  <span>Valor del Riesgo</span>
                  <span className="text-blue-600">{formatCurrency(results.contractualRiskProvision)}</span>
                </li>

                <li className="pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-xl text-slate-900">
                  <span>Total Reservas</span>
                  <span>{formatCurrency(results.totalProvisions)}</span>
                </li>
              </ul>
            </section>
          </div>

          {/* COLUMN 3: Final Results & Summary */}
          <div className="flex flex-col gap-8 md:col-span-2 xl:col-span-1">
            <section className="bg-emerald-600 p-8 lg:p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-200 text-white relative overflow-hidden flex flex-col items-center text-center">
              <div className="relative z-10 w-full flex flex-col items-center">
                <h3 className="text-emerald-100 font-bold text-xs lg:text-sm uppercase tracking-[0.2em] mb-6">Ingreso Neto Real Estimado</h3>
                
                {/* Fixed monetary value container to prevent line breaks on desktop */}
                <div className="w-full overflow-visible flex justify-center mb-8">
                  <div className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-black tracking-tighter leading-none whitespace-nowrap tabular-nums">
                    {formatCurrency(results.netIncome)}
                  </div>
                </div>

                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/30 rounded-full border border-emerald-400/30 text-emerald-50 text-sm font-bold mb-8 shadow-sm">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Disponible Real Mensual
                </div>
                <p className="text-emerald-50/90 text-sm lg:text-base leading-relaxed max-w-xs mx-auto">
                  Este es el dinero disponible mensual tras descontar seguridad social y separar ahorros para prestaciones sociales.
                </p>
              </div>
              {/* Decorative elements */}
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500 rounded-full opacity-30 blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-400 rounded-full opacity-20 blur-3xl"></div>
            </section>

            <section className="bg-slate-900 text-slate-100 p-8 lg:p-10 rounded-[2rem] shadow-xl">
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10 border-b border-slate-800 pb-6">Resumen de Operación</h3>
              
              <div className="space-y-10">
                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold mb-3">Costo Total de Operación</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl lg:text-3xl font-bold text-red-400">{formatCurrency(results.totalCosts)}</span>
                    <span className="text-red-400/60 text-sm font-bold">-{results.nonDisposablePercent.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="h-px bg-slate-800"></div>

                <div>
                  <p className="text-slate-500 text-xs uppercase font-bold mb-3">Valor Bruto Facturado</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white">{formatCurrency(results.contractValue)}</p>
                </div>
              </div>
            </section>
          </div>

        </div>

        {/* Informative Footer */}
        <footer className="mt-20 py-12 border-t border-slate-200 text-slate-400 text-sm lg:text-base text-center">
          <p className="font-medium">© 2026 - Herramienta de Planificación Financiera para Contratistas en Colombia</p>
          <p className="mt-4 px-6 italic max-w-4xl mx-auto opacity-80 leading-relaxed whitespace-pre-wrap">
            Esta calculadora es una herramienta de referencia. Los valores pueden variar según normativas locales o cambios en la ley tributaria. Consulta siempre con un contador profesional.
          </p>
        </footer>
      </div>
    </div>
  );
};

export default App;
