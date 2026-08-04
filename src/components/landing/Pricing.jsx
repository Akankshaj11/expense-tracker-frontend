// Repo file header
import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { apiRequest } from '../../utils/api'
import { CheckIcon } from '@heroicons/react/24/outline'

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

export default function Pricing() {
  const navigate = useNavigate()
  const [billingCycle, setBillingCycle] = useState('monthly') // 'monthly' or 'yearly'
  const [loadingPlan, setLoadingPlan] = useState(null) // 'pro' or 'enterprise'
  
  // Checkout Modal State Flow
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)
  const [checkoutData, setCheckoutData] = useState(null) // { planId, price }
  const [checkoutStep, setCheckoutStep] = useState('select') // 'select', 'card', 'processing', 'success'
  
  // Simulated Card Inputs State
  const [cardName, setCardName] = useState('')
  const [cardNumber, setCardNumber] = useState('')
  const [cardExpiry, setCardExpiry] = useState('')
  const [cardCvv, setCardCvv] = useState('')
  
  const [formError, setFormError] = useState('')
  const [mockPaymentId, setMockPaymentId] = useState('')
  const [processingStatus, setProcessingStatus] = useState('')

  const handlePurchase = (planId, price) => {
    if (planId === 'free') {
      navigate('/register')
      return
    }

    const currentUserStr = localStorage.getItem('currentUser')
    if (!currentUserStr) {
      alert('Please log in or register to purchase a subscription plan.')
      navigate('/login')
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
      amount: price * 100, // Amount in paise
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
      notes: {
        user_id: currentUser._id || '',
        plan_id: planId,
        billing_cycle: billingCycle
      },
      theme: {
        color: '#8B5CF6'
      }
    }

    try {
      const rzp = new window.Razorpay(options)
      rzp.on('payment.failed', function (resp) {
        console.error('Payment failed', resp.error)
        alert(`Payment failed: ${resp.error.description}. Try sandbox simulation if your key is unauthorized.`)
      })
      rzp.open()
    } catch (e) {
      console.error(e)
      alert('Error opening Razorpay payment window. Try sandbox simulation.')
    } finally {
      setLoadingPlan(null)
    }
  }

  const handleStartSimulation = () => {
    setCheckoutStep('card')
  }

  const handleCardNumberChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 16)
    const formatted = val.replace(/(\d{4})(?=\d)/g, '$1 ')
    setCardNumber(formatted)
  }

  const handleCardExpiryChange = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4)
    if (val.length >= 2) {
      val = val.substring(0, 2) + '/' + val.substring(2)
    }
    setCardExpiry(val)
  }

  const handleCardCvvChange = (e) => {
    const val = e.target.value.replace(/\D/g, '').substring(0, 3)
    setCardCvv(val)
  }

  const handleSimulatePaymentSubmit = async (e) => {
    e.preventDefault()
    setFormError('')

    if (!cardName.trim()) return setFormError('Cardholder name is required')
    if (cardNumber.replace(/\s/g, '').length < 16) return setFormError('Please enter a valid 16-digit card number')
    if (cardExpiry.length < 5) return setFormError('Please enter card expiry date (MM/YY)')
    if (cardCvv.length < 3) return setFormError('Please enter CVV')

    setCheckoutStep('processing')
    
    // Status text steps
    setProcessingStatus('Connecting to secure banking gateway...')
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    setProcessingStatus('Authorizing checkout amount...')
    await new Promise((resolve) => setTimeout(resolve, 800))
    
    setProcessingStatus('Verifying ledger subscription payload...')
    
    const mockId = `pay_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`
    setMockPaymentId(mockId)

    try {
      const payload = await apiRequest('/auth/upgrade-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: checkoutData.planId,
          billing_cycle: billingCycle,
          payment_id: mockId
        })
      })

      if (payload?.data?.user) {
        localStorage.setItem('currentUser', JSON.stringify(payload.data.user))
      }

      setCheckoutStep('success')
    } catch (err) {
      console.error(err)
      setFormError('Failed to record subscription upgrade on backend: ' + err.message)
      setCheckoutStep('card')
    }
  }

  const completeUpgrade = async (planId, paymentId) => {
    try {
      const payload = await apiRequest('/auth/upgrade-plan', {
        method: 'POST',
        body: JSON.stringify({
          plan_id: planId,
          billing_cycle: billingCycle,
          payment_id: paymentId
        })
      })

      if (payload?.data?.user) {
        localStorage.setItem('currentUser', JSON.stringify(payload.data.user))
      }

      alert(`Subscription upgraded to ${planId.toUpperCase()} successfully! (Payment ID: ${paymentId})`)
      window.location.reload()
    } catch (err) {
      console.error(err)
      alert('Failed to update subscription on our servers: ' + err.message)
    }
  }

  const plans = [
    {
      id: 'free',
      name: 'Free Starter',
      description: 'Ideal for individuals starting out with single-account ledger tracking.',
      priceMonthly: 0,
      priceYearly: 0,
      features: [
        '1 Active Ledger Book',
        'Up to 50 Transactions',
        '1 Organization Workspace',
        'Basic Cash-flow Dashboards',
        'Single-Currency Records'
      ],
      buttonText: 'Start Free Forever',
      popular: false,
      glow: 'hover:border-slate-800'
    },
    {
      id: 'pro',
      name: 'Professional Pro',
      description: 'Unlock robust accounting automation, receipt attachments, and multi-org collaboration.',
      priceMonthly: 299,
      priceYearly: 2999,
      features: [
        'Unlimited Ledger Books',
        'Unlimited Monthly Transactions',
        'Up to 5 Organizations',
        'Smart Receipt & PDF Attachments',
        'Print-Ready PDF Reports & CSV Exports',
        'Multi-Currency Exchange Conversions'
      ],
      buttonText: 'Upgrade to Pro',
      popular: true,
      glow: 'hover:border-purple-500/30'
    },
    {
      id: 'enterprise',
      name: 'Enterprise Team',
      description: 'For corporate divisions requiring dedicated support and advanced admin controls.',
      priceMonthly: null, // Yearly only
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
      popular: false,
      glow: 'hover:border-indigo-500/30'
    }
  ]

  return (
    <section id="pricing" className="mt-24 scroll-mt-28 w-full">
      <div className="max-w-3xl mb-12 text-left">
        <p className="text-xs font-light uppercase tracking-[0.22em] text-primary-600">Pricing & Plans</p>
        <h4 className="mt-2 text-xl font-light text-white sm:text-2xl">
          Simple, transparent plans for your growth
        </h4>
        <p className="mt-3 text-xs sm:text-sm text-zinc-400">
          Select a workspace scale designed to align perfectly with your transaction and organization complexity.
        </p>

        {/* Toggle Switch */}
        <div className="mt-8 inline-flex items-center gap-1.5 p-1 bg-white/4 border border-white/5 rounded-full">
          <button
            type="button"
            onClick={() => setBillingCycle('monthly')}
            className={`px-4 py-1.5 rounded-full text-xs transition duration-200 ${
              billingCycle === 'monthly' ? 'bg-primary-600 text-white font-normal' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Monthly
          </button>
          <button
            type="button"
            onClick={() => setBillingCycle('yearly')}
            className={`relative px-4 py-1.5 rounded-full text-xs transition duration-200 ${
              billingCycle === 'yearly' ? 'bg-primary-600 text-white font-normal' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Yearly
            <span className="absolute -top-3.5 -right-3 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-semibold tracking-wider uppercase">
              Save 20%
            </span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto items-stretch">
        {plans.map((plan) => {
          const isYearly = billingCycle === 'yearly'
          let displayPrice = plan.priceMonthly
          let displayCycle = '/month'

          if (plan.id === 'enterprise') {
            displayPrice = plan.priceYearly
            displayCycle = '/year'
          } else if (isYearly) {
            displayPrice = plan.priceYearly
            displayCycle = '/year'
          }

          // If monthly cycle is selected but enterprise has no monthly option
          const isEnterpriseMonthlyPlaceholder = plan.id === 'enterprise' && !isYearly

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
              className={`flex flex-col relative overflow-hidden rounded-2xl border transition-all duration-300 ${
                plan.popular
                  ? 'bg-slate-900/60 border-purple-500/40 shadow-[0_10px_30px_rgba(139,92,246,0.1)]'
                  : 'bg-white/4 border-white/5'
              } ${plan.glow} p-6 sm:p-8`}
            >
              {plan.popular && (
                <div className="absolute top-0 right-0 bg-gradient-to-r from-purple-500 to-indigo-500 text-white text-[9px] font-semibold uppercase tracking-wider px-3.5 py-1 rounded-bl-xl">
                  Most Popular
                </div>
              )}

              <div className="mb-6">
                <h5 className="text-md font-semibold text-white">{plan.name}</h5>
                <p className="text-zinc-400 text-[10px] mt-1 leading-normal min-h-[30px]">
                  {plan.description}
                </p>
                <div className="mt-4 flex items-baseline gap-1">
                  {isEnterpriseMonthlyPlaceholder ? (
                    <span className="text-lg font-light text-white tracking-tight">₹6,999/yr Only</span>
                  ) : (
                    <>
                      <span className="text-2xl font-light text-white tracking-tight">
                        ₹{displayPrice?.toLocaleString('en-IN')}
                      </span>
                      <span className="text-[10px] text-zinc-500">{displayCycle}</span>
                    </>
                  )}
                </div>
              </div>

              <div className="flex-1 space-y-3.5 mb-8">
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-zinc-300">
                    <CheckIcon className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                    <span>{feature}</span>
                  </div>
                ))}
              </div>

              <button
                type="button"
                disabled={loadingPlan !== null}
                onClick={() => handlePurchase(plan.id, isYearly ? plan.priceYearly : (plan.priceMonthly || plan.priceYearly))}
                className={`w-full py-2.5 rounded-xl text-xs font-semibold transition ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:opacity-90 shadow-lg shadow-purple-900/10'
                    : 'bg-white/6 text-white hover:bg-white/10 border border-white/5'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {loadingPlan === plan.id ? 'Loading Checkout...' : plan.buttonText}
              </button>
            </motion.div>
          )
        })}
      </div>

      {/* Premium Checkout Options Overlay */}
      {showCheckoutModal && checkoutData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm select-none">
          <div className="absolute inset-0" onClick={() => setShowCheckoutModal(false)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-2xl text-white space-y-4 z-10"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-semibold text-white">Checkout Workspace</h3>
              <button 
                type="button" 
                onClick={() => setShowCheckoutModal(false)}
                className="text-xs text-zinc-400 hover:text-white transition duration-200"
              >
                Cancel
              </button>
            </div>

            {/* STEP 1: Method selection */}
            {checkoutStep === 'select' && (
              <div className="space-y-4">
                <div className="space-y-1">
                  <p className="text-[10px] uppercase tracking-[0.2em] text-primary-500 font-semibold">Workspace Selection</p>
                  <h4 className="text-md font-semibold text-white uppercase">{checkoutData.planId} Package</h4>
                  <p className="text-xs text-zinc-400">
                    Cycle: <span className="font-semibold text-zinc-300 capitalize">{billingCycle}</span>
                  </p>
                  <p className="text-xl font-light text-white pt-1">
                    Amount: <span className="font-semibold">₹{checkoutData.price.toLocaleString('en-IN')}</span>
                  </p>
                </div>

                <div className="bg-purple-950/20 border border-purple-500/10 rounded-2xl p-3 text-[10px] text-zinc-400 leading-relaxed">
                  Choose <strong>Razorpay Widget</strong> if you have configured merchant credentials, or click <strong>Simulate Sandbox</strong> to test the checkout interface locally.
                </div>

                <div className="space-y-2 pt-2">
                  <button
                    type="button"
                    onClick={handleRazorpayPayment}
                    className="w-full py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-xs font-semibold text-white shadow-lg shadow-purple-950/20 transition duration-200"
                  >
                    Pay with Razorpay Widget
                  </button>
                  
                  <button
                    type="button"
                    onClick={handleStartSimulation}
                    className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs font-semibold text-white border border-slate-700 transition duration-200"
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
                  <p className="text-[10px] uppercase tracking-[0.25em] text-emerald-500 font-semibold">Sandbox Payment Gateway</p>
                  <h4 className="text-sm text-zinc-300">Enter mock card details to process payment of <strong>₹{checkoutData.price.toLocaleString('en-IN')}</strong></h4>
                </div>

                {formError && (
                  <p className="text-[10px] text-rose-400 font-medium bg-rose-950/20 border border-rose-500/10 p-2 rounded-xl">{formError}</p>
                )}

                <div className="space-y-2.5">
                  <div>
                    <label htmlFor="sim-holder" className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Cardholder Name</label>
                    <input
                      id="sim-holder"
                      type="text"
                      placeholder="Jane Doe"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/60 transition duration-200"
                    />
                  </div>

                  <div>
                    <label htmlFor="sim-number" className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Card Number</label>
                    <input
                      id="sim-number"
                      type="text"
                      placeholder="4111 2222 3333 4444"
                      value={cardNumber}
                      onChange={handleCardNumberChange}
                      className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/60 transition duration-200 text-left font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="sim-expiry" className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">Expiry Date</label>
                      <input
                        id="sim-expiry"
                        type="text"
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={handleCardExpiryChange}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/60 transition duration-200 text-center font-mono"
                      />
                    </div>
                    <div>
                      <label htmlFor="sim-cvv" className="block text-[9px] uppercase tracking-wider text-zinc-500 mb-1">CVV</label>
                      <input
                        id="sim-cvv"
                        type="password"
                        placeholder="•••"
                        value={cardCvv}
                        onChange={handleCardCvvChange}
                        className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder:text-zinc-700 focus:outline-none focus:border-emerald-500/60 transition duration-200 text-center font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="flex gap-2.5 pt-3">
                  <button
                    type="button"
                    onClick={() => setCheckoutStep('select')}
                    className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-750 text-xs text-zinc-300 transition duration-200"
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
                {/* Premium Spinner */}
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
                {/* Success Checkmark Circle */}
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
    </section>
  )
}
