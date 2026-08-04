// Repo file header
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { apiRequest } from '../../utils/api'
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      resolve(true)
      return
    }
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

export default function UpgradeModal({ isOpen, onClose, message }) {
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('overflow-hidden')
    } else {
      document.body.classList.remove('overflow-hidden')
    }
    return () => {
      document.body.classList.remove('overflow-hidden')
    }
  }, [isOpen])

  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' or 'yearly'
  const [loadingPlan, setLoadingPlan] = useState(null)
  
  // Checkout overlay states
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutData, setCheckoutData] = useState(null) // { planId, price }
  const [checkoutStep, setCheckoutStep] = useState('select') // 'select', 'card', 'processing', 'success'
  
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  
  const [formError, setFormError] = useState('')
  const [mockPaymentId, setMockPaymentId] = useState('')
  const [processingStatus, setProcessingStatus] = useState('')

  if (!isOpen) return null

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      description: 'Ideal for students, individuals, and households tracking small personal scopes.',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        '1 Organization Workspace',
        'Up to 3 Members tracked',
        'Max 500 Transactions / month',
        'Basic Dashboard Analytics',
        'PDF reports only (No CSV/Excel)',
        '1 Bill attachment per transaction'
      ],
      buttonText: 'Current Plan',
      popular: false
    },
    {
      id: 'pro',
      name: 'Professional Pro',
      description: 'For growing freelancers, independent consultants, and active small group entities.',
      priceMonthly: 299,
      priceYearly: 2999,
      features: [
        'Unlimited Organizations',
        'Unlimited Members tracking',
        'Unlimited Transactions logs',
        'Advanced CSS Analytics charts',
        'Excel & CSV reports download',
        'Unlimited bill attachments',
        'Real-time Budget alerts'
      ],
      buttonText: 'Upgrade to Pro',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Team',
      description: 'For corporate divisions requiring dedicated support and advanced admin controls.',
      priceMonthly: null,
      priceYearly: 6999,
      features: [
        'Unlimited Organizations',
        'Dedicated Administrative Control Room',
        'Custom Roles & Privileges Control',
        'Bulk Transaction API Integration',
        'Priority 24/7 Account Support',
        '100% Dedicated Storage Backup'
      ],
      buttonText: 'Go Enterprise',
      popular: false
    }
  ]

  const handlePurchase = (planId, price) => {
    if (planId === 'free') return

    const currentUserStr = localStorage.getItem('currentUser')
    if (!currentUserStr) {
      alert('Please log in or register to purchase a subscription plan.')
      return
    }

    setCheckoutData({ planId, price })
    setCheckoutStep('select')
    setCardName('')
    setCardNumber('')
    setCardExpiry('')
    setCardCvv('')
    setFormError('')
    setMockPaymentId('')
    setProcessingStatus('')
    setShowCheckoutModal(true)
  }

  const handleRazorpayPayment = async () => {
    if (!checkoutData) return
    const { planId, price } = checkoutData
    setShowCheckoutModal(false)
    setLoadingPlan(planId)

    const isLoaded = await loadRazorpayScript()
    if (!isLoaded) {
      alert('Failed to load Razorpay SDK. Please check your internet connection.')
      setLoadingPlan(null)
      return
    }

    const currentUserStr = localStorage.getItem('currentUser')
    const currentUser = JSON.parse(currentUserStr || '{}')
    const razorpayKey = import.meta.env.VITE_RAZORPAY_KEY || 'rzp_test_9d4jnd83nd92kd'

    const options = {
      key: razorpayKey,
      amount: price * 100,
      currency: 'INR',
      name: 'PocketFlow',
      description: `${planId.toUpperCase()} Plan (${billingCycle})`,
      image: '/assets/logo.png',
      handler: async function (response) {
        await completeUpgrade(planId, response.razorpay_payment_id)
      },
      prefill: {
        name: currentUser.name || '',
        email: currentUser.email || '',
        contact: currentUser.mobile || ''
      },
      theme: {
        color: '#7c3aed'
      }
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.open()
    } catch (e) {
      console.error(e)
      alert('Failed to open Razorpay widget.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleStartSimulation = () => {
    setCheckoutStep('card')
  }

  const handleCardNumberChange = (e) => {
    const value = e.target.value.replace(/\D/g, '')
    const matches = value.match(/\d{4,16}/g)
    const match = (matches && matches[0]) || ''
    const parts = []

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4))
    }

    if (parts.length > 0) {
      setCardNumber(parts.join(' '))
    } else {
      setCardNumber(value)
    }
  }

  const handleCardExpiryChange = (e) => {
    let clean = e.target.value.replace(/\D/g, '')
    if (clean.length > 4) {
      clean = clean.substring(0, 4)
    }
    if (clean.length >= 2) {
      setCardExpiry(`${clean.substring(0, 2)}/${clean.substring(2)}`)
    } else {
      setCardExpiry(clean)
    }
  }

  const handleCardCvvChange = (e) => {
    const clean = e.target.value.replace(/\D/g, '')
    setCardCvv(clean.substring(0, 3))
  }

  const handleSimulatePaymentSubmit = (e) => {
    e.preventDefault()
    setFormError('')

    const name = cardName.trim()
    const number = cardNumber.replace(/\s/g, '')
    const expiry = cardExpiry.trim()
    const cvv = cardCvv.trim()

    if (!name) {
      setFormError('Cardholder Name is required')
      return
    }
    if (number.length !== 16) {
      setFormError('Please enter a valid 16-digit card number')
      return
    }
    if (!/^\d{2}\/\d{2}$/.test(expiry)) {
      setFormError('Please enter card expiry date in MM/YY format')
      return
    }
    if (cvv.length !== 3) {
      setFormError('Please enter a 3-digit CVV number')
      return
    }

    setCheckoutStep('processing')
    const paymentId = 'pay_sim_' + Math.random().toString(36).substring(2, 12)
    setMockPaymentId(paymentId)

    setTimeout(() => {
      setProcessingStatus('Verifying sandbox card credentials...')
      setTimeout(() => {
        setProcessingStatus('Authorizing payment with simulated banking gateway...')
        setTimeout(async () => {
          try {
            await completeUpgrade(checkoutData.planId, paymentId)
            setCheckoutStep('success')
          } catch (err) {
            setCheckoutStep('select')
            setFormError(err?.message || 'Payment simulation failed')
          }
        }, 1500)
      }, 1200)
    }, 1000)
  }

  const completeUpgrade = async (planId, paymentId) => {
    const response = await apiRequest('/auth/upgrade-plan', {
      method: 'POST',
      body: JSON.stringify({
        plan_id: planId,
        payment_id: paymentId,
        billing_cycle: billingCycle
      })
    })

    if (response?.data?.user) {
      const updatedUser = response.data.user
      localStorage.setItem('currentUser', JSON.stringify(updatedUser))
    } else {
      throw new Error('Upgrade verification failed')
    }
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-sm p-3 sm:p-4 md:p-6 flex justify-center items-center">
      <div className="relative w-full max-w-5xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl text-slate-900 dark:text-white my-2 sm:my-4">
        
        {/* Close button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full p-1.5 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-400 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-white transition"
          aria-label="Close upgrade popup"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
 
        {/* Warning notification header */}
        <div className="mb-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 p-3 text-left">
          <p className="text-[10px] uppercase tracking-widest text-amber-600 dark:text-amber-400 font-bold mb-0.5">Plan Limit Exceeded</p>
          <p className="text-xs font-light text-slate-600 dark:text-zinc-300">{message || 'You have reached the limits of your current subscription tier. Upgrade your workspace plan below to continue.'}</p>
        </div>
 
        {/* Pricing selector segment */}
        <div className="max-w-3xl mb-5 text-left">
          <h4 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            Select a Workspace scale
          </h4>

 
          {/* Toggle Switch */}
          <div className="mt-4 inline-flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-full">
            <button
              type="button"
              onClick={() => setBillingCycle('monthly')}
              className={`px-4 py-1 rounded-full text-xs transition duration-200 ${
                billingCycle === 'monthly' ? 'bg-purple-600 text-white font-semibold shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Monthly
            </button>
            <button
              type="button"
              onClick={() => setBillingCycle('yearly')}
              className={`relative px-4 py-1 rounded-full text-xs transition duration-200 ${
                billingCycle === 'yearly' ? 'bg-purple-600 text-white font-semibold shadow-md' : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-white'
              }`}
            >
              Yearly
              <span className="absolute -top-3.5 -right-3 px-1.5 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-[8px] font-semibold tracking-wider uppercase">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Grid cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
          {plans.map((plan) => {
            const isYearly = billingCycle === 'yearly'
            const isEnterprise = plan.id === 'enterprise'
            const isFree = plan.id === 'free'
            
            let displayPrice = plan.priceMonthly
            let displayCycle = '/month'

            if (isEnterprise) {
              displayPrice = plan.priceYearly
              displayCycle = '/year'
            } else if (isYearly) {
              displayPrice = plan.priceYearly
              displayCycle = '/year'
            }

            const currentUserStr = localStorage.getItem('currentUser')
            const currentUser = JSON.parse(currentUserStr || '{}')
            const isCurrentPlan = currentUser.plan_id === plan.id || (!currentUser.plan_id && isFree)

            return (
              <div
                key={plan.id}
                className={`flex flex-col relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                  plan.popular
                    ? 'bg-slate-50 dark:bg-slate-950/60 border-purple-500 dark:border-purple-500/40 shadow-xl dark:shadow-[0_10px_30px_rgba(139,92,246,0.1)]'
                    : 'bg-slate-50/50 dark:bg-white/5 border-slate-200/80 dark:border-white/5'
                } pt-3 pb-3.5 px-4 text-left`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-semibold uppercase tracking-wider px-3 py-0.5 rounded-bl-xl">
                    Popular
                  </div>
                )}

                <div className="mb-2">
                  <h5 className="text-base font-extrabold text-slate-900 dark:text-white leading-tight">{plan.name}</h5>
                  <p className="text-slate-500 dark:text-zinc-400 text-xs mt-0.5 leading-normal min-h-[32px]">
                    {plan.description}
                  </p>
                  <div className="mt-1 flex items-baseline gap-1">
                    {isEnterprise && !isYearly ? (
                      <span className="text-sm font-bold text-slate-900 dark:text-white tracking-tight">₹6,999/yr Only</span>
                    ) : (
                      <>
                        <span className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight text-[22px] leading-none">
                          ₹{displayPrice?.toLocaleString('en-IN')}
                        </span>
                        <span className="text-xs text-slate-400 dark:text-zinc-500">{displayCycle}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex-1 space-y-1 mb-3">
                  {plan.features.map((feature, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs text-slate-600 dark:text-zinc-300">
                      <CheckIcon className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  disabled={isCurrentPlan || loadingPlan !== null}
                  onClick={() => handlePurchase(plan.id, isYearly ? plan.priceYearly : (plan.priceMonthly || plan.priceYearly))}
                  className={`w-full py-1.5 rounded-xl text-xs font-bold transition ${
                    isCurrentPlan
                      ? 'bg-slate-100 dark:bg-zinc-800 text-slate-400 dark:text-zinc-500 cursor-default border border-slate-200 dark:border-zinc-700/50'
                      : plan.popular
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-purple-900/10'
                      : 'bg-slate-100 hover:bg-slate-200 dark:bg-white/10 text-slate-800 dark:text-white dark:hover:bg-white/15 border border-slate-200 dark:border-white/10'
                  } disabled:opacity-50`}
                >
                  {isCurrentPlan ? 'Current Plan' : loadingPlan === plan.id ? 'Loading...' : plan.buttonText}
                </button>
              </div>
            )
          })}
        </div>
      </div>

      {/* Payment simulation modal */}
      {showCheckoutModal && checkoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-none">
          <div className="absolute inset-0" onClick={() => setShowCheckoutModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl text-slate-800 dark:text-white space-y-4 z-10 text-left"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
              <h3 className="text-xs font-semibold text-slate-900 dark:text-white">Checkout Workspace</h3>
              <button 
                type="button" 
                onClick={() => setShowCheckoutModal(false)}
                className="text-xs text-slate-500 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-white transition"
              >
                Cancel
              </button>
            </div>

            {/* STEP 1: Method selection */}
            {checkoutStep === 'select' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-purple-600 dark:text-purple-400 font-semibold">Workspace Selection</p>
                  <h4 className="text-sm font-semibold text-slate-900 dark:text-white uppercase">{checkoutData.planId} Package</h4>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    Cycle: <span className="font-semibold text-slate-700 dark:text-zinc-300 capitalize">{billingCycle}</span>
                  </p>
                  <p className="text-lg font-light text-slate-900 dark:text-white pt-1">
                    Amount: <span className="font-semibold">₹{checkoutData.price.toLocaleString('en-IN')}</span>
                  </p>
                </div>

                <div className="bg-purple-50 dark:bg-purple-950/20 border border-purple-100 dark:border-purple-500/10 rounded-2xl p-3 text-[10px] text-purple-800 dark:text-zinc-400 leading-relaxed">
                  Choose <strong>Razorpay Widget</strong> to pay, or click <strong>Simulate Sandbox</strong> to test the checkout locally.
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition duration-200"
                  >
                    Pay with Razorpay Widget
                  </button>
                  <button
                    type="button"
                    onClick={handleStartSimulation}
                    className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs font-semibold text-slate-800 dark:text-white border border-slate-200 dark:border-slate-700 transition duration-200"
                  >
                    Simulate Sandbox Checkout
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Simulated Credit Card Form */}
            {checkoutStep === 'card' && (
              <form onSubmit={handleSimulatePaymentSubmit} className="space-y-3.5">
                <div className="space-y-1 pb-1">
                  <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-600 dark:text-emerald-500 font-semibold">Sandbox Payment Gateway</p>
                  <h4 className="text-xs text-slate-600 dark:text-zinc-300">Enter mock card details to process payment of <strong>₹{checkoutData.price.toLocaleString('en-IN')}</strong></h4>
                </div>

                {formError && (
                  <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-500/10 p-2 rounded-xl">{formError}</p>
                )}

                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="sim-holder" className="block text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Cardholder Name</label>
                    <input
                      id="sim-holder"
                      type="text"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/65 focus:ring-1 focus:ring-emerald-500/20 transition duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="sim-number" className="block text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Card Number</label>
                    <input
                      id="sim-number"
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/65 focus:ring-1 focus:ring-emerald-500/20 transition duration-200 text-left font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="sim-expiry" className="block text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">Expiry Date</label>
                      <input
                        id="sim-expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/65 focus:ring-1 focus:ring-emerald-500/20 transition duration-200 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="sim-cvv" className="block text-[9px] uppercase tracking-wider text-slate-400 dark:text-zinc-500 mb-1">CVV</label>
                      <input
                        id="sim-cvv"
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={handleCardCvvChange}
                        className="w-full px-3.5 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 dark:placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/65 focus:ring-1 focus:ring-emerald-500/20 transition duration-200 text-center font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('select')}
                    className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-xs text-slate-700 dark:text-zinc-300 transition duration-200"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-xs font-semibold text-white shadow-lg shadow-emerald-950/20 transition duration-200"
                  >
                    Pay Securely
                  </button>
                </div>
              </form>
            )}

            {/* STEP 3: Simulated Processing Gateway */}
            {checkoutStep === 'processing' && (
              <div className="py-8 flex flex-col items-center justify-center space-y-4">
                <div className="relative h-12 w-12">
                  <div className="absolute inset-0 rounded-full border-[3px] border-emerald-500/20" />
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-emerald-500 animate-spin" />
                </div>
                <div className="text-center space-y-1">
                  <h5 className="text-xs font-semibold text-white">Processing payment...</h5>
                  <p className="text-[10px] text-zinc-400 font-light max-w-[220px] mx-auto min-h-[30px]">{processingStatus}</p>
                </div>
              </div>
            )}

            {/* STEP 4: Checkout Success View */}
            {checkoutStep === 'success' && (
              <div className="py-4 text-center space-y-5">
                <div className="mx-auto h-14 w-14 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center">
                  <svg className="h-6 w-6 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>

                <div className="space-y-1.5">
                  <h4 className="text-sm font-semibold text-white">Payment Authorized Successfully!</h4>
                  <p className="text-[10px] text-zinc-400 max-w-[240px] mx-auto">Your PocketFlow workspace has been successfully upgraded to the {checkoutData.planId.toUpperCase()} package tier.</p>
                </div>

                <div className="bg-slate-950/40 border border-slate-800 rounded-2xl p-2.5 text-left space-y-1 font-mono text-[9px]">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">PAYMENT ID</span>
                    <span className="text-zinc-300 font-semibold">{mockPaymentId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">STATUS</span>
                    <span className="text-emerald-400 font-semibold">PAID / CAPTURED</span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setShowCheckoutModal(false)
                    window.location.reload()
                  }}
                  className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-95 text-xs font-semibold text-white shadow-lg shadow-emerald-950/20 transition duration-200"
                >
                  Access Upgraded Workspace
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </div>
  )
}
