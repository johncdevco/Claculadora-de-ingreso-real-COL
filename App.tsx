import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
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
  const [contractValue, setContractValue] = useState<number>(3200000);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>(RiskLevel.I);
  const [contractualRiskPercent, setContractualRiskPercent] = useState<number>(10.0);
  const [isIBCModalOpen, setIsIBCModalOpen] = useState(false);
  
  // New state for Negotiation Simulator
  const [desiredNetIncome, setDesiredNetIncome] = useState<number>(2800000);

  // Helper functions for monetary input formatting
  const formatInputDisplay = (val: number | undefined): string => {
    if (val === undefined || isNaN(val)) return '';
    return new Intl.NumberFormat('es-CO').format(val);
  };

  const parseInputValue = (displayVal: string): number => {
    const numericStr = displayVal.replace(/\D/g, '');
    return numericStr ? parseInt(numericStr, 10) : 0;
  };

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

  const simulatorResults = useMemo(() => {
    const costFactor = results.contractValue > 0 ? results.totalCosts / results.contractValue : 0;
    const factorRemainder = 1 - costFactor;
    
    const requiredGross = factorRemainder > 0 ? desiredNetIncome / factorRemainder : 0;
    const difference = requiredGross - results.contractValue;

    return {
      requiredGross,
      difference
    };
  }, [desiredNetIncome, results]);

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(val);
  };

  const generateReport = () => {
    const doc = new jsPDF();
    const margin = 20;
    let currentY = 20;

    // Header
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text('Reporte de Planeación Financiera - Contratistas', margin, currentY);
    currentY += 10;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`, margin, currentY);
    doc.text(`Versión: 2026.1.0`, 150, currentY);
    currentY += 15;

    // 1. Executive Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Resumen Ejecutivo', margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      head: [['Concepto', 'Valor']],
      body: [
        ['Valor Bruto Facturado', formatCurrency(results.contractValue)],
        ['Ingreso Neto Real Estimado', formatCurrency(results.netIncome)],
        ['Porcentaje de Gastos y Deducciones', `${results.nonDisposablePercent.toFixed(1)}%`],
        ['Eficiencia del Contrato', `${(100 - results.nonDisposablePercent).toFixed(1)}%`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [16, 185, 129] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 2. Legal Contributions
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Seguridad Social (Obligatorio)', margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      head: [['Concepto', 'Base (IBC 40%)', 'Valor']],
      body: [
        ['Salud (12.5%)', formatCurrency(results.ibc), formatCurrency(results.health)],
        ['Pensión (16%)', formatCurrency(results.ibc), formatCurrency(results.pension)],
        [`ARL (Riesgo ${riskLevel})`, formatCurrency(results.ibc), formatCurrency(results.arl)],
        ['Total Aportes', '', formatCurrency(results.totalSocialSecurity)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 3. Financial Provisions
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Provisiones Financieras (Sugerido)', margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      head: [['Concepto', 'Tasa', 'Valor']],
      body: [
        ['Vacaciones', '4.17%', formatCurrency(results.vacationProvision)],
        ['Cesantías + Intereses', '9.33%', formatCurrency(results.severanceProvision)],
        [`Riesgo Contractual`, `${contractualRiskPercent.toFixed(1)}%`, formatCurrency(results.contractualRiskProvision)],
        ['Total Reservas', '', formatCurrency(results.totalProvisions)]
      ],
      theme: 'grid',
      headStyles: { fillColor: [217, 119, 6] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 4. Negotiation Simulator
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Simulador de Negociación', margin, currentY);
    currentY += 5;

    autoTable(doc, {
      startY: currentY,
      margin: { left: margin },
      head: [['Concepto', 'Valor']],
      body: [
        ['Ingreso Neto Mensual Deseado', formatCurrency(desiredNetIncome)],
        ['Valor Sugerido de Contrato', formatCurrency(simulatorResults.requiredGross)],
        ['Diferencia vs Actual', `${simulatorResults.difference > 0 ? '+' : ''}${formatCurrency(simulatorResults.difference)}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [79, 70, 229] }
    });
    currentY = (doc as any).lastAutoTable.finalY + 15;

    // 5. Legal Notes - FIXED WRAPPING
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Notas Legales', margin, currentY);
    currentY += 8;

    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    
    const notesMaxWidth = 170;
    const notesLineHeight = 5;
    const notesParagraphSpacing = 2;

    const note1 = 'IBC: El Ingreso Base de Cotización (IBC) se calcula sobre el 40% del valor bruto del contrato.';
    const note2 = 'ARL: Para contratos de prestación de servicios, el contratista es el responsable del pago de la ARL, salvo riesgos IV o V.';
    const note3 = 'Las provisiones financieras son estimaciones sugeridas para cubrir prestaciones sociales no incluidas en contratos de servicios.';
    
    const wrappedNote1 = doc.splitTextToSize(note1, notesMaxWidth);
    doc.text(wrappedNote1, margin, currentY);
    currentY += (wrappedNote1.length * notesLineHeight) + notesParagraphSpacing;

    const wrappedNote2 = doc.splitTextToSize(note2, notesMaxWidth);
    doc.text(wrappedNote2, margin, currentY);
    currentY += (wrappedNote2.length * notesLineHeight) + notesParagraphSpacing;

    const wrappedNote3 = doc.splitTextToSize(note3, notesMaxWidth);
    doc.text(wrappedNote3, margin, currentY);
    currentY += (wrappedNote3.length * notesLineHeight) + 10;

    // 6. Footer
    doc.setFontSize(8);
    doc.setTextColor(150);
    const disclaimer = 'Esta calculadora es una herramienta de referencia. Los valores pueden variar según normativas locales o cambios en la ley tributaria';
    const splitDisclaimer = doc.splitTextToSize(disclaimer, notesMaxWidth);
    doc.text(splitDisclaimer, margin, currentY);
    
    doc.text('© 2026 - Herramienta de Planificación Financiera para Contratistas en Colombia', margin, currentY + 15);

    doc.save('Reporte_Financiero_Contratista.pdf');
  };

  const handleRiskChange = (valStr: string) => {
    let val = parseFloat(valStr);
    if (isNaN(val)) val = 0;
    if (val > 20) val = 20;
    if (val < 0) val = 0;
    setContractualRiskPercent(val);
  };

  const riskInfo = [
    { level: 'I', rate: '0.522%', color: 'bg-emerald-500', label: 'Riesgo Mínimo', desc: 'Actividades administrativas, centros de educación, finanzas.' },
    { level: 'II', rate: '1.044%', color: 'bg-green-500', label: 'Riesgo Bajo', desc: 'Procesos manufactureros como tapetes, tejidos, confecciones.' },
    { level: 'III', rate: '2.436%', color: 'bg-yellow-500', label: 'Riesgo Medio', desc: 'Fabricación de alimentos, alcoholes, agujas, automotriz.' },
    { level: 'IV', rate: '4.350%', color: 'bg-orange-500', label: 'Riesgo Alto', desc: 'Transporte aéreo, terrestre, fabricación de aceites.' },
    { level: 'V', rate: '6.960%', color: 'bg-red-600', label: 'Riesgo Máximo', desc: 'Minería, construcción, trabajos eléctricos, explosivos.' },
  ];

  const cardBaseClasses = "bg-white p-6 lg:p-8 rounded-2xl shadow-sm border border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1";

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-8 px-4 sm:px-6 lg:py-16 xl:text-[18px]">
      <div className="max-w-4xl mx-auto xl:max-w-7xl">
        <header className="mb-12 lg:mb-16 text-center">
          <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight sm:text-4xl lg:text-5xl mb-4">
            Calculadora de Ingreso Real
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto lg:text-xl">
            Calcula cuánto dinero te queda realmente después de aportes legales y provisiones financieras como contratista independiente en Colombia.
          </p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 items-start mb-16">
          <div className="flex flex-col gap-8">
            <section className={cardBaseClasses}>
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
                    type="text"
                    inputMode="numeric"
                    value={formatInputDisplay(contractValue)}
                    onChange={(e) => setContractValue(parseInputValue(e.target.value))}
                    className="w-full px-4 py-3 bg-white text-slate-900 border border-slate-300 rounded-xl shadow-sm focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition-all appearance-none text-lg font-medium"
                    placeholder="Ej. 5.000.000"
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

              <div className="mt-8 p-5 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col gap-3 transition-colors hover:bg-blue-100/50">
                <p className="text-sm text-blue-700 leading-relaxed">
                  <strong>Nota:</strong> El Ingreso Base de Cotización (IBC) se calcula automáticamente sobre el 40% del valor de tu contrato.
                </p>
                <button 
                  onClick={() => setIsIBCModalOpen(true)}
                  className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors uppercase tracking-wider"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  ¿Cómo funciona esta regla?
                </button>
              </div>
            </section>

            <section className={cardBaseClasses}>
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

          <div className="flex flex-col gap-8">
            <section className={cardBaseClasses + " flex flex-col h-full"}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Seguridad Social</h3>
                <span className="text-red-600 bg-red-50 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter border border-red-100">Obligatorio</span>
              </div>
              <ul className="space-y-4">
                <li className="flex justify-between items-center text-sm lg:text-base group">
                  <span className="text-slate-500 group-hover:text-slate-800 transition-colors">Salud (12.5% IBC)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.health)}</span>
                </li>
                <li className="flex justify-between items-center text-sm lg:text-base group">
                  <span className="text-slate-500 group-hover:text-slate-800 transition-colors">Pensión (16% IBC)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.pension)}</span>
                </li>
                <li className="flex justify-between items-center text-sm lg:text-base group">
                  <span className="text-slate-500 group-hover:text-slate-800 transition-colors">ARL (Riesgo {riskLevel})</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.arl)}</span>
                </li>
                <li className="pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-xl text-slate-900 transition-all group-hover:scale-[1.02]">
                  <span>Total Aportes</span>
                  <span className="text-red-600">{formatCurrency(results.totalSocialSecurity)}</span>
                </li>
              </ul>
              <div className="mt-8">
                <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex gap-3 items-start shadow-sm transition-colors hover:bg-slate-100">
                  <svg className="w-5 h-5 text-slate-400 mt-1 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  <p className="text-[12px] lg:text-[13px] text-slate-500 leading-relaxed italic">
                    Estos aportes son obligatorios por ley para contratistas con IBC sobre el 40% del valor bruto. No son valores ajustables por el usuario.
                  </p>
                </div>
              </div>
            </section>

            <section className={cardBaseClasses}>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-slate-800">Provisiones Financieras</h3>
                <span className="text-amber-600 bg-amber-50 text-[11px] font-bold px-3 py-1.5 rounded-full uppercase tracking-tighter border border-amber-100">Sugerido</span>
              </div>
              <ul className="space-y-6">
                <li className="flex justify-between items-center text-sm lg:text-base group">
                  <span className="text-slate-500 group-hover:text-slate-800 transition-colors">Vacaciones (4.17%)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.vacationProvision)}</span>
                </li>
                <li className="flex justify-between items-center text-sm lg:text-base group">
                  <span className="text-slate-500 group-hover:text-slate-800 transition-colors">Cesantías + Int. (9.33%)</span>
                  <span className="font-semibold text-slate-800">{formatCurrency(results.severanceProvision)}</span>
                </li>
                
                <li className="pt-2">
                  <label htmlFor="risk-input" className="block text-sm font-semibold text-slate-700 mb-3">Riesgo Contractual (%)</label>
                  <div className="flex flex-col gap-4">
                    <div className="relative group">
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
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xl group-focus-within:text-blue-500 transition-colors">%</span>
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
                  </div>
                </li>
                <li className="flex justify-between items-center font-semibold text-slate-700 text-sm lg:text-base pt-2 group">
                  <span className="group-hover:text-slate-900 transition-colors">Valor del Riesgo</span>
                  <span className="text-blue-600 font-bold">{formatCurrency(results.contractualRiskProvision)}</span>
                </li>
                <li className="pt-4 border-t border-slate-100 flex justify-between items-center font-bold text-xl text-slate-900 group">
                  <span>Total Reservas</span>
                  <span className="text-amber-600 transition-all group-hover:scale-110">{formatCurrency(results.totalProvisions)}</span>
                </li>
              </ul>
            </section>
          </div>

          <div className="flex flex-col gap-8 md:col-span-2 xl:col-span-1">
            <section className="bg-emerald-600 p-8 lg:p-10 rounded-[2.5rem] shadow-2xl shadow-emerald-200 text-white relative overflow-hidden flex flex-col items-center text-center transition-all duration-300 hover:shadow-emerald-300/40 hover:-translate-y-1.5">
              <div className="relative z-10 w-full flex flex-col items-center">
                <h3 className="text-emerald-100 font-bold text-xs lg:text-sm uppercase tracking-[0.2em] mb-6">Ingreso Neto Real Estimado</h3>
                <div className="w-full overflow-visible flex justify-center mb-8">
                  <div className="text-4xl sm:text-5xl lg:text-4xl xl:text-5xl font-black tracking-tighter leading-none whitespace-nowrap tabular-nums drop-shadow-lg">
                    {formatCurrency(results.netIncome)}
                  </div>
                </div>
                <div className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500/30 rounded-full border border-emerald-400/30 text-emerald-50 text-sm font-bold mb-4 shadow-sm transition-all hover:bg-emerald-500/50">
                  <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  Disponible Real Mensual
                </div>

                <button
                  onClick={generateReport}
                  className="w-full py-3.5 px-4 bg-transparent border border-emerald-300/50 rounded-2xl text-emerald-50 text-sm font-bold transition-all hover:bg-emerald-500/20 flex items-center justify-center gap-3 active:scale-95 shadow-sm mb-6"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Download Report (PDF)
                </button>

                <p className="text-emerald-50/90 text-sm lg:text-base leading-relaxed max-w-xs mx-auto">
                  Este es el dinero disponible mensual tras descontar seguridad social y separar ahorros para prestaciones sociales.
                </p>
              </div>
              <div className="absolute -top-10 -right-10 w-48 h-48 bg-emerald-500 rounded-full opacity-30 blur-3xl"></div>
              <div className="absolute -bottom-10 -left-10 w-48 h-48 bg-emerald-400 rounded-full opacity-20 blur-3xl"></div>
            </section>

            <section className="bg-white p-8 rounded-[2rem] shadow-lg border border-slate-200 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-lg font-bold text-slate-800 tracking-tight">Simulador de Negociación</h3>
              </div>
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Ingreso Neto Mensual Deseado (COP)</label>
                  <div className="relative group">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={formatInputDisplay(desiredNetIncome)}
                      onChange={(e) => setDesiredNetIncome(parseInputValue(e.target.value))}
                      className="w-full px-4 py-3 bg-slate-50 text-slate-900 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-semibold text-lg"
                      placeholder="Ej. 4.000.000"
                    />
                  </div>
                </div>
                <div className="p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                  <p className="text-xs font-bold text-indigo-400 uppercase tracking-widest mb-3 text-center">Valor Sugerido de Contrato</p>
                  <p className="text-3xl font-black text-indigo-900 text-center tracking-tighter mb-4">
                    {formatCurrency(simulatorResults.requiredGross)}
                  </p>
                  <div className="flex flex-col gap-2 pt-4 border-t border-indigo-200/50">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-indigo-600/70">Diferencia vs Actual</span>
                      <span className={`font-bold ${simulatorResults.difference > 0 ? 'text-emerald-600' : simulatorResults.difference < 0 ? 'text-red-600' : 'text-slate-600'}`}>
                        {simulatorResults.difference > 0 ? '+' : ''}{formatCurrency(simulatorResults.difference)}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 items-start opacity-70">
                  <svg className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-[12px] text-slate-600 leading-relaxed italic">
                    Este valor bruto garantiza que, tras cubrir seguridad social y tus ahorros prestacionales ({(results.nonDisposablePercent).toFixed(1)}% de costos), logres tu ingreso neto objetivo.
                  </p>
                </div>
              </div>
            </section>

            <section className="bg-slate-900 text-slate-100 p-8 lg:p-10 rounded-[2rem] shadow-xl transition-all duration-300 hover:shadow-2xl hover:shadow-slate-300/10 hover:-translate-y-1.5">
              <h3 className="text-slate-400 font-bold text-xs uppercase tracking-widest mb-10 border-b border-slate-800 pb-6">Resumen de Operación</h3>
              <div className="space-y-10">
                <div className="group">
                  <p className="text-slate-500 text-xs uppercase font-bold mb-3 transition-colors group-hover:text-red-400">Costo Total de Operación</p>
                  <div className="flex justify-between items-end">
                    <span className="text-2xl lg:text-3xl font-bold text-red-400 transition-all group-hover:scale-105 origin-left">{formatCurrency(results.totalCosts)}</span>
                    <span className="text-red-400/60 text-sm font-bold">-{results.nonDisposablePercent.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="h-px bg-slate-800"></div>
                <div className="group">
                  <p className="text-slate-500 text-xs uppercase font-bold mb-3 transition-colors group-hover:text-white">Valor Bruto Facturado</p>
                  <p className="text-2xl lg:text-3xl font-bold text-white transition-all group-hover:scale-105 origin-left">{formatCurrency(results.contractValue)}</p>
                </div>
              </div>
            </section>
          </div>
        </div>

        <section className="bg-white p-8 lg:p-10 rounded-3xl shadow-sm border border-slate-200 mb-16 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="mb-10">
            <h2 className="text-2xl font-bold text-slate-800 mb-2">Guía de Niveles de Riesgo ARL</h2>
            <p className="text-slate-500">
              Cada actividad económica está clasificada por la ley colombiana según su nivel de peligro. 
              Selecciona el nivel que corresponda a las funciones principales de tu contrato.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
            {riskInfo.map((info) => (
              <div 
                key={info.level}
                className={`flex flex-col p-6 rounded-2xl border transition-all duration-300 hover:shadow-xl hover:-translate-y-2 cursor-default ${riskLevel === info.level ? 'border-blue-500 bg-blue-50/30' : 'border-slate-100 bg-slate-50/50'}`}
              >
                <div className="flex justify-between items-start mb-4">
                  <span className={`w-10 h-10 rounded-xl ${info.color} text-white flex items-center justify-center font-black text-xl shadow-md transition-transform hover:scale-110`}>
                    {info.level}
                  </span>
                  <span className="text-slate-900 font-bold text-sm bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
                    {info.rate}
                  </span>
                </div>
                <h4 className="font-bold text-slate-800 mb-1">{info.label}</h4>
                <p className="text-[12px] text-slate-500 leading-relaxed mb-4 flex-grow">
                  {info.desc}
                </p>
                <button
                  onClick={() => setRiskLevel(info.level as RiskLevel)}
                  className={`mt-auto w-full py-2 px-4 rounded-xl text-[11px] font-bold uppercase tracking-widest transition-all ${
                    riskLevel === info.level
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {riskLevel === info.level ? 'Seleccionado' : 'Seleccionar'}
                </button>
              </div>
            ))}
          </div>
          <div className="mt-8 p-4 bg-slate-900 rounded-xl text-slate-300 text-[12px] flex items-center gap-4 transition-all hover:bg-slate-800">
            <svg className="w-5 h-5 text-amber-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>
              <strong>Dato clave:</strong> Para contratos de prestación de servicios, el contratista es el responsable de realizar el pago de la ARL, a menos que el riesgo sea IV o V, en cuyo caso la empresa contratante debe realizar el aporte directamente.
            </span>
          </div>
        </section>

        <footer className="mt-20 py-12 border-t border-slate-200 text-slate-400 text-sm lg:text-base text-center">
          <p className="font-medium">© 2026 - Herramienta de Planificación Financiera para Contratistas en Colombia</p>
          <p className="mt-4 px-6 italic max-w-4xl mx-auto opacity-80 leading-relaxed whitespace-pre-wrap">
            Esta calculadora es una herramienta de referencia. Los valores pueden variar según normativas locales or cambios en la ley tributaria. Consulta siempre con un contador profesional.
          </p>
        </footer>
      </div>

      {isIBCModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" onClick={() => setIsIBCModalOpen(false)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transform transition-all p-8 lg:p-12 animate-in fade-in zoom-in duration-300">
            <button onClick={() => setIsIBCModalOpen(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors p-2 rounded-full hover:bg-slate-100">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l18 18" />
              </svg>
            </button>
            <div className="flex flex-col items-center text-center mb-10">
              <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center text-blue-600 mb-6 shadow-inner">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-4">¿Qué es el IBC?</h2>
              <div className="h-1.5 w-12 bg-blue-600 rounded-full"></div>
            </div>
            <div className="space-y-8 text-slate-600 leading-relaxed">
              <section>
                <h3 className="font-bold text-slate-800 text-lg mb-3 flex items-center gap-2"><span className="w-2 h-2 bg-blue-600 rounded-full"></span>Concepto Básico</h3>
                <p>El <strong>Ingreso Base de Cotización (IBC)</strong> es el monto de tus ingresos sobre el cual se calculan los porcentajes de aportes a Salud (12.5%), Pentión (16%) y ARL (según riesgo).</p>
              </section>
              <section className="bg-blue-50 p-6 rounded-2xl border border-blue-100 shadow-sm transition-transform hover:scale-[1.01]">
                <h3 className="font-bold text-blue-800 text-lg mb-3">La Regla del 40%</h3>
                <p className="text-blue-700">Para los trabajadores independientes (prestadores de servicios), la ley permite calcular sus aportes sobre el <strong>40% del valor bruto facturado mensualmente</strong> (antes de IVA si aplica).</p>
                <div className="mt-4 pt-4 border-t border-blue-200">
                  <p className="text-xs font-bold uppercase tracking-widest text-blue-500 mb-2">Ejemplo:</p>
                  <p className="text-lg font-black text-blue-900">$5,000,000 x 40% = $2,000,000 (Tu IBC)</p>
                </div>
              </section>
              <section className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 transition-colors hover:bg-white hover:border-blue-200 group">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-400">Mínimo Legal</p>
                  <p className="font-bold text-slate-800">1 SMMLV</p>
                  <p className="text-[12px] text-slate-500 mt-1">Si el 40% es menor a 1 salario mínimo, debes cotizar sobre el mínimo ($1,750,905).</p>
                </div>
                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 transition-colors hover:bg-white hover:border-blue-200 group">
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 group-hover:text-blue-400">Máximo Legal</p>
                  <p className="font-bold text-slate-800">25 SMMLV</p>
                  <p className="text-[12px] text-slate-500 mt-1">Incluso si ganas mucho más, el tope de base de cotización está limitado por ley.</p>
                </div>
              </section>
              <p className="text-sm italic text-slate-400 text-center pt-4 border-t border-slate-100">Base Legal: Artículo 18 de la Ley 100 de 1993, modificado por la Ley 797 de 2003 y Ley 1122 de 2007.</p>
            </div>
            <button onClick={() => setIsIBCModalOpen(false)} className="mt-10 w-full py-4 bg-slate-900 text-white rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-xl shadow-slate-200 hover:shadow-slate-300 active:scale-95">Entendido</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;