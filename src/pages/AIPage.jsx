import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send } from 'lucide-react';
import { sendAiMessage } from '../api/ai.api';
import { PageHeader } from '../components/PageHeader';
import { PricingCard } from '../components/PricingCard';
import { PLAN_PRICES, PLAN_FEATURES } from '../data/plans';
import { useAuth } from '../auth/AuthContext';

const SUGGESTIONS = [
  "Bugungi savdo qanday?",
  "Eng ko'p sotilgan 5 mahsulot qaysilar?",
  'Qoldig`i kam mahsulotlarni ko`rsat',
  "30 kundan beri sotilmagan mahsulotlar bor-yo'q?",
];

function UpgradeToPro() {
  return (
    <div>
      <PageHeader title="AI yordamchi" subtitle="Bu funksiya Pro rejada mavjud" />
      <div className="mx-auto max-w-sm">
        <PricingCard
          title="Pro"
          price={PLAN_PRICES.pro}
          features={PLAN_FEATURES.pro}
          highlight
          actionLabel="Pro rejaga o'tish uchun administratorga murojaat qiling"
          disabled
        />
      </div>
    </div>
  );
}

export function AIPage() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  if (user?.market?.plan !== 'pro') {
    return <UpgradeToPro />;
  }

  async function handleSend(text) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    setError('');
    setInput('');
    const nextMessages = [...messages, { role: 'user', content }];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const { reply } = await sendAiMessage(nextMessages);
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();
    handleSend();
  }

  return (
    <div className="flex h-full flex-col">
      <PageHeader
        title="AI yordamchi"
        subtitle="Do'koningizning savdo va ombor ma'lumotlari haqida so'rang"
      />

      <div className="flex flex-1 flex-col overflow-y-auto rounded-box border border-base-300 bg-base-100 p-4">
        {messages.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <div
              className="flex h-12 w-12 items-center justify-center rounded-field text-primary-content"
              style={{ backgroundImage: 'var(--gradient-brand)' }}
            >
              <Sparkles size={22} />
            </div>
            <p className="max-w-sm text-sm text-base-content/50">
              Savdolar, mahsulotlar va ombor haqida savol bering — AI yordamchi haqiqiy
              ma'lumotlarga asoslanib javob beradi.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  className="rounded-field border border-base-300 px-3 py-1.5 text-xs text-base-content/70 transition-colors hover:bg-base-200"
                  onClick={() => handleSend(s)}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex animate-fade-up ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[85%] whitespace-pre-wrap rounded-field px-4 py-2.5 text-sm sm:max-w-[70%] ${
                    m.role === 'user'
                      ? 'text-primary-content'
                      : 'border border-base-300 bg-base-200 text-base-content'
                  }`}
                  style={m.role === 'user' ? { backgroundImage: 'var(--gradient-brand)' } : undefined}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-field border border-base-300 bg-base-200 px-4 py-2.5 text-sm text-base-content/50">
                  Yozmoqda...
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {error && <p className="mt-2 text-sm text-error">{error}</p>}

      <form onSubmit={handleSubmit} className="mt-4 flex gap-2">
        <input
          className="input input-bordered flex-1"
          placeholder="Savolingizni yozing..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading}
          autoFocus
        />
        <button type="submit" className="btn btn-primary" disabled={loading || !input.trim()}>
          <Send size={16} />
        </button>
      </form>
    </div>
  );
}
