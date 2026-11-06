import { type ComponentType, type FormEvent, useEffect, useId, useRef, useState } from 'react';

const QUESTIONS = [
  { title: 'Какой дом вы планируете?', hint: 'Подберём направление, с которого удобно начать.', label: 'Тип дома', options: ['Модульный', 'Каркасный', 'Из газобетона', 'Пока выбираю'] },
  { title: 'Какая площадь вам подойдёт?', hint: 'Достаточно примерного ориентира — проект можно уточнить позже.', label: 'Площадь', options: ['До 80 м²', '80–120 м²', 'Больше 120 м²', 'Нужна консультация'] },
  { title: 'Когда хотите начать строительство?', hint: 'Это поможет обсудить подходящий график и доступные участки.', label: 'Начало строительства', options: ['В ближайшие 3 месяца', 'Через 3–6 месяцев', 'Позже, в течение года', 'Пока изучаю варианты'] }
];

export function GiftQuiz({ open, onClose, apiBase, formatPhone, Consent }: { open: boolean; onClose: () => void; apiBase: string; formatPhone: (value: string) => string; Consent: ComponentType }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const titleId = useId();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<string[]>(['', '', '']);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'error' | 'success'>('idle');
  const sending = useRef(false);
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) { if (element.open) element.close(); return; }
    element.showModal();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { if (element.open) element.close(); document.body.style.overflow = overflow; };
  }, [open]);
  useEffect(() => { if (open) heading.current?.focus({ preventScroll: true }); }, [open, step, status === 'success']);
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (sending.current || status === 'success') return;
    if (answers.some((answer) => !answer)) { setStep(answers.findIndex((answer) => !answer)); return; }
    if (!/^[78]\d{10}$/.test(phone.replace(/\D/g, ''))) { event.currentTarget.querySelector<HTMLInputElement>('input[type="tel"]')?.reportValidity(); return; }
    sending.current = true;
    setStatus('sending');
    try {
      const message = ['Заявка по акции: 10 соток в подарок при строительстве дома.', ...QUESTIONS.map((question, index) => `${question.label}: ${answers[index]}`), 'Просьба уточнить доступные участки и условия акции.'].join('\n');
      const response = await fetch(`${apiBase}/api/leads`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: name.trim(), phone, message, sourceTitle: 'Квиз: 10 соток в подарок' }) });
      if (!response.ok) throw new Error('request failed');
      setStatus('success');
    } catch { setStatus('error'); } finally { sending.current = false; }
  };
  const question = QUESTIONS[step];
  return <dialog ref={dialog} className="gift-quiz" aria-labelledby={titleId} onCancel={(event) => { event.preventDefault(); if (!sending.current) onClose(); }} onClick={(event) => { if (event.target === event.currentTarget && !sending.current) onClose(); }}>
    <div className="gift-quiz-layout">
      <aside className="gift-quiz-aside"><span className="gift-quiz-brand">EVTENIA · СТРОИМ ДОМА</span><div><span className="gift-quiz-badge">Подарок к вашему дому</span><strong>10 соток<br /><em>в подарок</em></strong><p>Ответьте на 3 коротких вопроса — обсудим дом и участок под вашу задачу.</p></div><small>При заказе строительства дома. Доступные участки и условия участия уточним на консультации и зафиксируем в договоре.</small></aside>
      <div className="gift-quiz-main">
        <button type="button" className="gift-quiz-close" aria-label="Закрыть квиз" disabled={status === 'sending'} onClick={onClose}>×</button>
        {status === 'success' ? <div className="gift-quiz-success"><span>✓</span><h2 ref={heading} tabIndex={-1} id={titleId}>Спасибо! Заявка отправлена</h2><p>{name.trim()}, мы получили ваши пожелания. Свяжемся с вами по указанному телефону, чтобы обсудить дом, доступные участки и условия акции.</p><button type="button" onClick={onClose}>Отлично, спасибо</button></div> : <>
          <div className="gift-quiz-progress"><span>{step < 3 ? `Вопрос ${step + 1} из 3` : 'Последний шаг · ваши контакты'}</span><span>{step < 3 ? 'Около минуты' : 'Пожелания сохранены'}</span></div>
          <div className="gift-quiz-progress-track"><span style={{ width: `${(step + 1) * 25}%` }} /></div>
          <h2 ref={heading} tabIndex={-1} id={titleId}>{question?.title || 'Куда отправить предложение?'}</h2>
          <p className="gift-quiz-hint">{question?.hint || 'Оставьте контакты — специалист свяжется с вами и уточнит детали.'}</p>
          {step < 3 ? <>
            <div className="gift-quiz-options" role="group" aria-label={question.title}>{question.options.map((option, index) => <button key={option} type="button" aria-pressed={answers[step] === option} onClick={() => setAnswers((current) => current.map((answer, number) => number === step ? option : answer))}><span>{String(index + 1).padStart(2, '0')}</span>{option}<i aria-hidden="true">{answers[step] === option ? '✓' : '+'}</i></button>)}</div>
            <div className="gift-quiz-actions"><button type="button" className="gift-quiz-back" disabled={step === 0} onClick={() => setStep((current) => current - 1)}>← Назад</button><button type="button" className="gift-quiz-next" disabled={!answers[step]} onClick={() => setStep((current) => current + 1)}>{step === 2 ? 'Перейти к контактам' : 'Далее'} →</button></div>
            <p className="gift-quiz-footnote">Без обязательств. Поможем разобраться с проектом и условиями.</p>
          </> : <form onSubmit={submit} className="gift-quiz-form">
            <div className="gift-quiz-summary">{answers.map((answer, index) => <span key={index}>{answer}</span>)}</div>
            <label>Как к вам обращаться<input autoComplete="name" placeholder="Ваше имя" required maxLength={80} value={name} onChange={(event) => setName(event.target.value)} /></label>
            <label>Номер телефона<input autoComplete="tel" type="tel" inputMode="tel" placeholder="+7 (___) ___-__-__" required pattern="\+7 \([0-9]{3}\) [0-9]{3}-[0-9]{2}-[0-9]{2}" title="Укажите полный номер: +7 (999) 123-45-67" value={phone} onChange={(event) => setPhone(formatPhone(event.target.value))} /></label>
            <Consent />
            <div className="gift-quiz-actions"><button type="button" className="gift-quiz-back" disabled={status === 'sending'} onClick={() => { setStep(2); setStatus('idle'); }}>← Назад</button><button type="submit" className="gift-quiz-next" disabled={status === 'sending'}>{status === 'sending' ? 'Отправляем…' : 'Обсудить дом и подарок →'}</button></div>
            {status === 'error' ? <p className="gift-quiz-error" role="alert">Не удалось отправить заявку. Ваши ответы сохранены — попробуйте ещё раз.</p> : null}
            <p className="gift-quiz-footnote">Заявка на консультацию не обязывает заключать договор.</p>
          </form>}
        </>}
      </div>
    </div>
  </dialog>;
}
