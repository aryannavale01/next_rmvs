'use client';

import { useState, useMemo, FormEvent } from 'react';
import { 
  Heart, ShieldCheck, Lock,
  CheckCircle, Info, X, DollarSign, CreditCard
} from 'lucide-react';

export default function DonatePage() {
  const [amount, setAmount] = useState<number>(100);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [frequency, setFrequency] = useState<'one-time' | 'monthly'>('one-time');
  const [form, setForm] = useState({ name: '', email: '', cardNumber: '', cardExpiry: '', cardCvc: '', agree: false });
  const [donationSuccess, setDonationSuccess] = useState(false);
  const [receiptId, setReceiptId] = useState('');

  const tiers = [25, 50, 100, 250];

  // Calculate dynamic impact statement
  const impactStatement = useMemo(() => {
    const activeAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
    if (activeAmount <= 0) return 'Please select or enter a donation amount to calculate local community impact.';
    
    if (activeAmount < 25) {
      return `A donation of $${activeAmount} provides school meals and vital training textbooks for 2 rural students in East Africa.`;
    } else if (activeAmount < 50) {
      return `A donation of $${activeAmount} delivers 1 comprehensive, solar-powered school kit and digital curriculum materials.`;
    } else if (activeAmount < 100) {
      return `A donation of $${activeAmount} plants ${Math.round(activeAmount * 0.3)} native acacia saplings inside the Great Green Wall corridor, preventing desertification.`;
    } else if (activeAmount < 250) {
      return `A donation of $${activeAmount} delivers sterile public-health nursing support kits and vaccines to remote mobile medical clinics.`;
    } else {
      return `A donation of $${activeAmount} fully finances 1 local woman's cooperative micro-loan, including bookkeeping training and market logistics.`;
    }
  }, [amount, customAmount]);

  const handleCheckoutSubmit = (e: FormEvent) => {
    e.preventDefault();
    const finalAmount = customAmount ? parseFloat(customAmount) || 0 : amount;
    if (finalAmount > 0 && form.name && form.email && form.cardNumber && form.agree) {
      // Simulate receipt id
      const randId = 'CG-TX-' + Math.floor(Math.random() * 900000 + 10000);
      setReceiptId(randId);
      setDonationSuccess(true);
    }
  };

  const handleCloseSuccess = () => {
    setDonationSuccess(false);
    setAmount(100);
    setCustomAmount('');
    setForm({ name: '', email: '', cardNumber: '', cardExpiry: '', cardCvc: '', agree: false });
  };

  return (
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
            Your generous gift funds verified, transparent programs—delivering clinical nursing care, local micro-financing, and climate-resilient reforestation.
          </p>
        </div>
      </section>

      {/* Main Donation/Checkout Form Column Split */}
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

                {/* Frequency selector toggle */}
                <div className="flex justify-center" id="frequency-toggle-box">
                  <div className="inline-flex p-1 bg-gray-100 rounded-xl border border-gray-200/50">
                    <button
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
                      onClick={() => setFrequency('monthly')}
                      className={`px-4 py-2 rounded-lg font-semibold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer ${
                        frequency === 'monthly' 
                          ? 'bg-brand-primary text-white shadow-sm' 
                          : 'text-gray-500 hover:text-gray-800'
                      }`}
                    >
                      Give Monthly
                      <span className="bg-brand-mint text-gray-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full animate-pulse shrink-0">
                        Save 10%
                      </span>
                    </button>
                  </div>
                </div>

                {/* Tiers list row */}
                <div className="grid grid-cols-4 gap-3" id="donation-tiers-grid">
                  {tiers.map((t) => {
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
                        <span className="text-xs font-semibold opacity-70 mb-0.5">$</span>
                        {t}
                      </button>
                    );
                  })}
                </div>

                {/* Custom amount field */}
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Or Enter Custom Amount</label>
                  <div className="relative rounded-2xl shadow-sm">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                      <DollarSign className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="number"
                      min="5"
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

              {/* Impact Display Card */}
              <div className="bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-100/50 p-6 rounded-2xl space-y-3 shadow-inner" id="impact-calculator-box">
                <div className="flex items-center gap-2 text-brand-primary font-bold text-xs uppercase tracking-wider font-mono">
                  <Info className="h-4 w-4 shrink-0 text-brand-primary" /> Dynamic Impact Statement
                </div>
                <p className="text-sm text-gray-600 leading-relaxed font-semibold italic">
                  &quot;{impactStatement}&quot;
                </p>
                <div className="text-[10px] text-gray-400 font-medium">
                  *92% of your gift goes directly to regional logistics corridors. Certified by third-party auditors.
                </div>
              </div>

            </div>

            {/* Right side: Secure Checkout Form */}
            <div className="lg:col-span-6">
              <div className="bg-gray-50 p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
                
                <h2 className="font-display font-bold text-xl text-gray-900 flex items-center gap-2 border-b border-gray-200 pb-3">
                  <span className="flex items-center justify-center w-7 h-7 bg-emerald-100 text-brand-primary rounded-lg text-xs">2</span>
                  Billing &amp; Card details
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
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Email Address (for tax receipt)</label>
                    <input
                      type="email"
                      required
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      placeholder="jane@example.com"
                      className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Card Number</label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                        <CreditCard className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        required
                        pattern="[0-9]{16}"
                        maxLength={16}
                        value={form.cardNumber}
                        onChange={(e) => setForm({ ...form, cardNumber: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="1234567812345678"
                        className="w-full pl-11 pr-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">Expiry (MM/YY)</label>
                      <input
                        type="text"
                        required
                        maxLength={5}
                        value={form.cardExpiry}
                        onChange={(e) => setForm({ ...form, cardExpiry: e.target.value })}
                        placeholder="12/28"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono text-center"
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-gray-700 uppercase tracking-wider block">CVV</label>
                      <input
                        type="text"
                        required
                        maxLength={3}
                        pattern="[0-9]{3}"
                        value={form.cardCvc}
                        onChange={(e) => setForm({ ...form, cardCvc: e.target.value.replace(/[^0-9]/g, '') })}
                        placeholder="123"
                        className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary font-mono text-center"
                      />
                    </div>
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
                    className="w-full py-4 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer mt-4"
                    id="btn-checkout-submit"
                  >
                    <Lock className="h-4 w-4 shrink-0 text-brand-mint" />
                    Complete Secure Gift of ${customAmount ? parseFloat(customAmount) || 0 : amount}
                  </button>
                </form>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* MODAL: DONATION SUCCESS RECEIPT */}
      {donationSuccess && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200" id="receipt-modal">
          <div className="bg-white rounded-3xl overflow-hidden max-w-md w-full shadow-2xl border border-gray-100 animate-in zoom-in-95 duration-200 relative text-gray-900 p-8 space-y-6">
            
            <div className="text-center space-y-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center text-brand-primary mx-auto">
                <CheckCircle className="h-6 w-6" />
              </div>
              <h3 className="font-display font-bold text-xl text-gray-900">Thank You, {form.name}!</h3>
              <p className="text-xs text-brand-primary font-mono uppercase tracking-wider font-semibold">Transaction Approved</p>
            </div>

            <div className="bg-gray-50 p-6 rounded-2xl border border-gray-100 space-y-4" id="receipt-details">
              <div className="text-center">
                <span className="text-xs text-gray-400 block font-medium">Your Gift Amount</span>
                <span className="text-3xl font-display font-bold text-gray-950">${customAmount ? parseFloat(customAmount) || 0 : amount}</span>
                <span className="text-[10px] text-gray-400 block mt-1 uppercase font-semibold font-mono tracking-wider">{frequency} Frequency</span>
              </div>

              <div className="border-t border-dashed border-gray-200 pt-4 space-y-2.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Receipt ID:</span>
                  <span className="font-mono font-bold text-gray-800">{receiptId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Tax Deductible:</span>
                  <span className="font-bold text-emerald-600">Yes (501c3 compliant)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Billed To:</span>
                  <span className="font-bold text-gray-800">{form.email}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400 font-medium">Logged Date:</span>
                  <span className="font-bold text-gray-800">June 2026</span>
                </div>
              </div>
            </div>

            <p className="text-xs text-gray-400 text-center leading-relaxed">
              A PDF tax-receipt containing our administrative registration credentials and final audit reports has been emailed successfully. Thank you for empowering global communities.
            </p>

            <button 
              onClick={handleCloseSuccess}
              className="w-full py-3 bg-brand-primary hover:bg-brand-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
              id="close-receipt-btn"
            >
              Print &amp; Return
            </button>

          </div>
        </div>
      )}

    </div>
  );
}
