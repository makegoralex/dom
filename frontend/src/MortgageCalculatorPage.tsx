import { ComponentType, FormEvent, useEffect, useState } from 'react';
import { MortgageCalculation, MortgageCalculator } from './MortgageCalculator';

type MortgageCalculatorPageProps = {
  Header: ComponentType;
  Footer: ComponentType;
  PrivacyConsent: ComponentType;
  apiBase: string;
  formatPhone: (value: string) => string;
};

const money = (value: number) => `${Math.round(value).toLocaleString('ru-RU')} ₽`;

export function MortgageCalculatorPage({ Header, Footer, PrivacyConsent, apiBase, formatPhone }: MortgageCalculatorPageProps) {
  const [calculation, setCalculation] = useState<MortgageCalculation | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    const previousTitle = document.title;
    document.title = 'Ипотечный калькулятор на дом и участок — Evtenia';
    return () => { document.title = previousTitle; };
  }, []);

  const requestCalculation = (next: MortgageCalculation) => {
    setCalculation(next);
    requestAnimationFrame(() => document.querySelector('#mortgage-request')?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (!calculation) return;
    setStatus('Отправка...');
    try {
      const response = await fetch(`${apiBase}/api/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          email: '',
          sourceTitle: 'Ипотечный калькулятор',
          message: [
            'Запрос точного расчёта ипотеки.',
            `Стоимость: ${money(calculation.propertyPrice)}.`,
            `Первоначальный взнос: ${money(calculation.downPayment)}.`,
            `Срок: ${calculation.termYears} лет. Ставка в расчёте: ${calculation.rate}%.`,
            `Ориентировочный платёж: ${money(calculation.monthlyPayment)} в месяц.`
          ].join('\n')
        })
      });
      if (!response.ok) throw new Error('lead failed');
      setStatus('Заявка отправлена. Специалист свяжется с вами и проверит доступные программы.');
      setName('');
      setPhone('');
    } catch {
      setStatus('Не удалось отправить заявку. Попробуйте ещё раз или позвоните нам.');
    }
  };

  return (
    <div className="mortgage-page">
      <Header />
      <main>
        <section className="mortgage-page__hero">
          <div className="container">
            <p>Evtenia · финансирование строительства</p>
            <h1>Ипотечный калькулятор</h1>
            <span>Рассчитайте ориентировочный платёж за дом с участком и оставьте заявку на проверку доступных программ.</span>
          </div>
        </section>
        <section className="mortgage-page__body">
          <div className="container">
            <MortgageCalculator onRequest={requestCalculation} />
            <div className="mortgage-page__features">
              <article><strong>01</strong><h2>Выберите комплекс</h2><p>Дом, участок и дополнительные работы можно заложить в общий бюджет.</p></article>
              <article><strong>02</strong><h2>Настройте расчёт</h2><p>Измените взнос, срок и предполагаемую ставку под свою ситуацию.</p></article>
              <article><strong>03</strong><h2>Проверьте условия</h2><p>Специалист уточнит программу, документы и итоговые условия банка.</p></article>
            </div>
            {calculation ? (
              <section className="mortgage-page__request" id="mortgage-request">
                <div><p>Ваш предварительный расчёт</p><h2>{money(calculation.monthlyPayment)} <small>в месяц</small></h2><span>Кредит {money(calculation.loanAmount)} на {calculation.termYears} лет</span></div>
                <form onSubmit={submit}>
                  <label>Имя<input value={name} onChange={(event) => setName(event.target.value)} required /></label>
                  <label>Телефон<input type="tel" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} placeholder="+7 (___) ___-__-__" required /></label>
                  <PrivacyConsent />
                  <button type="submit">Получить точный расчёт</button>
                  {status ? <p role="status">{status}</p> : null}
                </form>
              </section>
            ) : null}
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
