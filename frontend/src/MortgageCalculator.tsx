import { useMemo, useState } from 'react';
import './mortgage-calculator.css';

export type MortgageCalculation = {
  propertyPrice: number;
  downPayment: number;
  loanAmount: number;
  termYears: number;
  rate: number;
  monthlyPayment: number;
  totalPayment: number;
  overpayment: number;
  recommendedIncome: number;
};

type MortgageCalculatorProps = {
  compact?: boolean;
  defaultPropertyPrice?: number;
  defaultDownPayment?: number;
  defaultTermYears?: number;
  defaultRate?: number;
  onRequest?: (calculation: MortgageCalculation) => void;
};

const formatMoney = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function calculateMortgage(propertyPrice: number, downPayment: number, termYears: number, rate: number): MortgageCalculation {
  const safePrice = Math.max(100_000, propertyPrice);
  const safeDownPayment = clamp(downPayment, 0, safePrice);
  const loanAmount = Math.max(0, safePrice - safeDownPayment);
  const months = Math.max(1, Math.round(termYears * 12));
  const monthlyRate = Math.max(0, rate) / 100 / 12;
  const monthlyPayment = loanAmount === 0
    ? 0
    : monthlyRate === 0
      ? loanAmount / months
      : loanAmount * monthlyRate * ((1 + monthlyRate) ** months) / (((1 + monthlyRate) ** months) - 1);
  const totalPayment = monthlyPayment * months;
  return {
    propertyPrice: safePrice,
    downPayment: safeDownPayment,
    loanAmount,
    termYears,
    rate,
    monthlyPayment,
    totalPayment,
    overpayment: Math.max(0, totalPayment - loanAmount),
    recommendedIncome: monthlyPayment / 0.45
  };
}

export function MortgageCalculator({
  compact = false,
  defaultPropertyPrice = 4_300_000,
  defaultDownPayment = 1_900_000,
  defaultTermYears = 15,
  defaultRate = 6,
  onRequest
}: MortgageCalculatorProps) {
  const [propertyPrice, setPropertyPrice] = useState(defaultPropertyPrice);
  const [downPayment, setDownPayment] = useState(defaultDownPayment);
  const [termYears, setTermYears] = useState(defaultTermYears);
  const [rate, setRate] = useState(defaultRate);
  const calculation = useMemo(
    () => calculateMortgage(propertyPrice, downPayment, termYears, rate),
    [propertyPrice, downPayment, termYears, rate]
  );

  const updatePrice = (next: number) => {
    const value = clamp(next, 500_000, 30_000_000);
    setPropertyPrice(value);
    setDownPayment((current) => Math.min(current, value));
  };

  return (
    <div className={`mortgage-calc ${compact ? 'mortgage-calc--compact' : ''}`}>
      <div className="mortgage-calc__controls">
        <label>
          <span>Стоимость дома и участка</span>
          <input type="number" min="500000" max="30000000" step="50000" value={propertyPrice} onChange={(event) => updatePrice(Number(event.target.value))} />
          <input aria-label="Стоимость дома и участка, ползунок" type="range" min="500000" max="30000000" step="50000" value={propertyPrice} onChange={(event) => updatePrice(Number(event.target.value))} />
        </label>
        <label>
          <span>Первоначальный взнос</span>
          <input type="number" min="0" max={propertyPrice} step="50000" value={downPayment} onChange={(event) => setDownPayment(clamp(Number(event.target.value), 0, propertyPrice))} />
          <input aria-label="Первоначальный взнос, ползунок" type="range" min="0" max={propertyPrice} step="50000" value={downPayment} onChange={(event) => setDownPayment(Number(event.target.value))} />
          <small>{propertyPrice ? Math.round((downPayment / propertyPrice) * 100) : 0}% стоимости</small>
        </label>
        <div className="mortgage-calc__row">
          <label>
            <span>Срок</span>
            <select value={termYears} onChange={(event) => setTermYears(Number(event.target.value))}>
              {[5, 10, 15, 20, 25, 30].map((year) => <option value={year} key={year}>{year} лет</option>)}
            </select>
          </label>
          <label>
            <span>Ставка, %</span>
            <input type="number" min="0.1" max="35" step="0.1" value={rate} onChange={(event) => setRate(clamp(Number(event.target.value), 0.1, 35))} />
          </label>
        </div>
      </div>

      <aside className="mortgage-calc__result" aria-live="polite">
        <p>Ориентировочный платёж</p>
        <strong>{formatMoney(calculation.monthlyPayment)}<small>в месяц</small></strong>
        <dl>
          <dt>Сумма кредита</dt><dd>{formatMoney(calculation.loanAmount)}</dd>
          <dt>Переплата</dt><dd>{formatMoney(calculation.overpayment)}</dd>
          {!compact ? <><dt>Рекомендуемый доход</dt><dd>от {formatMoney(calculation.recommendedIncome)}</dd></> : null}
        </dl>
        {onRequest ? <button type="button" onClick={() => onRequest(calculation)}>Получить точный расчёт</button> : null}
        <small className="mortgage-calc__notice">Расчёт предварительный и не является предложением банка. Ставка и условия зависят от программы и заёмщика.</small>
      </aside>
    </div>
  );
}

