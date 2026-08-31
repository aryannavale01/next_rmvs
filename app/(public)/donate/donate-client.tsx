'use client';

import { useState, useMemo, FormEvent } from 'react';
import Script from 'next/script';
import {
  Heart, ShieldCheck, Lock,
  CheckCircle, Info, DollarSign, Mail
} from 'lucide-react';
import { useToast } from '@/components/ui/toast';

const TIERS = [500, 1000, 2500, 5000];

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: RazorpayResponse) => void;
  prefill: { name: string; email: string; contact?: string };
  theme: { color: string };
  modal?: { ondismiss?: () => void };
}

interface RazorpayInstance {
  open: () => void;
  on: (event: string, handler: (response: { error: { description: string } }) => void) => void;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

interface CreateOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  donorName: string;
  donorEmail: string;
  receiptId: string;
}

export default function DonateClient({ taxNote }: { taxNote?: string }) {
  const { toast } = useToast();
  const [amount, setAmount] = useState<number>(1000);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '', agree: false });
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;

  const impactStatement = useMemo(() => {
    if (finalAmount <= 0) return 'Please select or enter a donation amount.';
    return `Your donation of ₹${finalAmount.toLocaleString()} will go directly towards supporting our field programs.`;
  }, [finalAmount]);

  const handleCheckoutSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (finalAmount <= 0 || !form.name || !form.email || !form.agree) return;

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: finalAmount,
          donorName: form.name,
          donorEmail: form.email,
          donorPhone: form.phone || undefined,
          frequency,
          message: form.message || undefined,
        }),
      });

      if (!res.ok) throw new Error('Failed to create order');

      const data: CreateOrderResponse = await res.json();

      const options: RazorpayOptions = {
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        name: 'CompassionGlobal',
        description: `Donation - ${frequency === 'monthly' ? 'Monthly' : 'One-Time'}`,
        order_id: data.orderId,
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/donations/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify(response),
            });

            if (verifyRes.ok) {
              setReceiptId(data.receiptId);
              setDonationSuccess(true);
            } else {
              toast({ title: 'Verification Pending', description: 'Your payment was received. We will verify and confirm shortly.', variant: 'info' });
            }
          } catch {
            toast({ title: 'Verification Pending', description: 'Your payment was received. We will verify and confirm shortly.', variant: 'info' });
          }
        },
        prefill: {
          name: form.name,
          email: form.email,
          contact: form.phone || undefined,
        },
        theme: { color: '#2563EB' },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', (response: { error: { description: string } }) => {
        toast({ title: 'Payment Failed', description: response.error.description || 'Payment could not be completed. Please try again.', variant: 'error' });
        setSubmitting(false);
      });
      rzp.open();
    } catch {
      toast({ title: 'Error', description: 'Failed to initiate payment. Please try again.', variant: 'error' });
      setSubmitting(false);
    }
  };

  const handleCloseSuccess = () => {
    setDonationSuccess(false);
    setAmount(1000);
    setCustomAmount('');
    setForm({ name: '', email: '', phone: '', message: '', agree: false });
  };

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      <div className="space-y-0 animate-in fade-in duration-300" id="donate-page-root">

        {/* Header text */}
        <section className="bg-white pt-16 pb-8 text-center space-y-4">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-brand-primary border border-emerald-100">
              <Heart className="h-4 w-4 fill-brand-primary text-brand-primary" />
              <span className="text-xs font-semibold uppercase tracking-wider">Support Strategic Change</span>
            </div>
            <h1 className="font-display font-bold text-4xl sm:text-5xl text-gray-900 tracking-tight leading-tight">
              Fuel Sustainable Impact
            </h1>
            <p className="text-gray-500 text-sm sm:text-base leading-relaxed max-w-2xl mx-auto">
              Your generous gift funds verified, transparent programs — delivering clinical nursing care, local micro-financing, and climate-resilient reforestation.
            </p>
          </div>
        </section>

        {/* Main Donation Form */}
        <section className="bg-white pb-24">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">

              {/* Left side: Tier selection & Impact Statement */}
              <div className="lg:col-span-6 space-y-8 flex flex-col justify-between">
                <div className="space-y-6">
                  <h2 className="font-display font-bold text-xl text-gray-900 flex items-center gap-2 border-b border-gray-100 pb-3">
                    <span className="flex items-center justify-center w-7 h-7 bg-emerald-100 text-brand-primary rounded-lg text-xs">1</span>
                    Choose Gift Amount
                  </h2>

                  <div className="flex justify-center" id="frequency-toggle-box">
                    <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200/50">
                      <button
                        type="button"
                        onClick={() => setFrequency('one-time')}
                        className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                          frequency === 'one-time'
                            ? 'bg-white text-gray-900 shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Give One-Time
                      </button>
                      <button
                        type="button"
                        onClick={() => setFrequency('monthly')}
                        className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all cursor-pointer ${
                          frequency === 'monthly'
                            ? 'bg-brand-primary text-white shadow-sm'
                            : 'text-gray-500 hover:text-gray-800'
                        }`}
                      >
                        Give Monthly
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-4 gap-3" id="donation-tiers-grid">
                    {TIERS.map((t) => {
                      const isSelected = amount === t && !customAmount;
                      return (
                        <button
                          key={t}
                          type="button"
                          onClick={() => { setAmount(t); setCustomAmount(''); }}
                          className={`py-4 rounded-2xl font-display font-bold text-lg sm:text-xl transition-all cursor-pointer flex flex-col items-center justify-center border ${
                            isSelected
                              ? 'bg-black border-black text-white shadow-lg scale-105'
                              : 'bg-[#FCFDFC] hover:bg-gray-50 border-gray-200 text-gray-700'
                          }`}
                          id={`tier-btn-${t}`}
                        >
                          <span className="text-xs font-semibold opacity-70 mb-0.5">₹</span>
                          {t.toLocaleString()}
                        </button>
                      );
                    })}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Or Enter Custom Amount</label>
                    <div className="relative rounded-2xl shadow-sm">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <DollarSign className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="number"
                        min="10"
                        value={customAmount}
                        onChange={(e) => {
                          setCustomAmount(e.target.value);
                          setAmount(0);
                        }}
                        placeholder="Other amount"
                        className="w-full pl-10 pr-4 py-3.5 bg-[#FAFBF9] border border-gray-200 rounded-2xl text-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-semibold text-gray-900"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-100/50 p-6 rounded-2xl space-y-3 shadow-inner" id="impact-calculator-box">
                  <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider font-mono">
                    <Info className="h-4 w-4 shrink-0 text-brand-primary" /> Dynamic Impact Statement
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed font-semibold italic">
                    &quot;{impactStatement}&quot;
                  </p>
                </div>
              </div>

              {/* Right side: Donation Form */}
              <div className="lg:col-span-6">
                <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                  <h2 className="font-display font-bold text-xl text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                    <span className="flex items-center justify-center w-7 h-7 bg-emerald-100 text-brand-primary rounded-lg text-xs">2</span>
                    Your Details
                  </h2>

                  <form onSubmit={handleCheckoutSubmit} className="space-y-4" id="form-donate-checkout">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({ ...form, name: e.target.value })}
                        placeholder="Jane Doe"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Email Address</label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                          <Mail className="h-5 w-5 text-gray-400" />
                        </div>
                        <input
                          type="email"
                          required
                          value={form.email}
                          onChange={(e) => setForm({ ...form, email: e.target.value })}
                          placeholder="jane@example.com"
                          className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Phone (optional)</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                        placeholder="+91 98765 43210"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Message (optional)</label>
                      <textarea
                        value={form.message}
                        onChange={(e) => setForm({ ...form, message: e.target.value })}
                        placeholder="Share a message with us..."
                        rows={3}
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary resize-none"
                      />
                    </div>

                    <div className="flex items-start gap-2.5 pt-2">
                      <input
                        type="checkbox"
                        id="billing-agree"
                        required
                        checked={form.agree}
                        onChange={(e) => setForm({ ...form, agree: e.target.checked })}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-brand-primary focus:ring-brand-primary/20 cursor-pointer"
                      />
                      <label htmlFor="billing-agree" className="text-xs text-gray-500 leading-normal cursor-pointer select-none">
                        I authorize this tax-deductible gift and agree to the <span className="font-semibold text-gray-700 hover:underline">Donor Privacy Policy</span>.
                      </label>
                    </div>

                    <button
                      type="submit"
                      disabled={submitting || finalAmount <= 0}
                      className="w-full py-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4 disabled:opacity-50"
                      id="btn-checkout-submit"
                    >
                      <Lock className="h-4 w-4 shrink-0" />
                      {submitting ? 'Processing...' : `Pay ₹${finalAmount.toLocaleString()}`}
                    </button>

                    <div className="flex items-center justify-center gap-2 text-[10px] text-gray-400 mt-2">
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>Secured by Razorpay. UPI, Cards, Netbanking accepted.</span>
                    </div>
                  </form>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* MODAL: DONATION SUCCESS */}
        {donationSuccess && (
          <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="receipt-modal">
            <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-gray-900 p-8 space-y-6">

              <div className="text-center space-y-2">
                <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-brand-primary mx-auto">
                  <CheckCircle className="h-6 w-6" />
                </div>
                <h3 className="font-display font-bold text-xl text-gray-900">Thank You, {form.name}!</h3>
                <p className="text-xs text-brand-primary font-mono uppercase tracking-wider font-semibold">Payment Confirmed</p>
              </div>

              <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4" id="receipt-details">
                <div className="text-center">
                  <span className="text-xs text-gray-400 block font-medium">Your Gift Amount</span>
                  <span className="text-3xl font-display font-bold text-gray-950">₹{finalAmount.toLocaleString()}</span>
                  <span className="text-[10px] text-gray-400 block mt-1 uppercase font-semibold font-mono tracking-wider">{frequency} Frequency</span>
                </div>

                <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Receipt ID:</span>
                    <span className="font-mono font-bold text-gray-800">{receiptId}</span>
                  </div>
                  {taxNote && (
                    <div className="flex justify-between">
                      <span className="text-gray-400 font-medium">Tax Deductible:</span>
                      <span className="font-bold text-emerald-600">{taxNote}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Email:</span>
                    <span className="font-bold text-gray-800">{form.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400 font-medium">Date:</span>
                    <span className="font-bold text-gray-800">{new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                  </div>
                </div>
              </div>

              <p className="text-xs text-gray-400 text-center leading-relaxed">
                A confirmation email has been sent to your address. Thank you for empowering global communities.
              </p>

              <button
                onClick={handleCloseSuccess}
                className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
                id="close-receipt-btn"
              >
                Close
              </button>

            </div>
          </div>
        )}

      </div>
    </>
  );
}
