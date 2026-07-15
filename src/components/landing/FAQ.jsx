// Repo file header
import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDownIcon } from '@heroicons/react/24/outline'

const faqs = [
  {
    question: "What is PocketFlow?",
    answer: "PocketFlow is a premium finance workspace designed for teams and professionals. It provides a lightweight, highly-structured layout for organizing multiple organizations, custom transaction modules, receipts, and reporting in real-time."
  },
  {
    question: "How does the multi-organization system work?",
    answer: "You can create separate workspaces for different companies, projects, or branches. Each organization has its own clean, isolated list of modules, members, and transactions, allowing you to switch contexts instantly in a single click."
  },
  {
    question: "Can I download or export my transaction data?",
    answer: "Yes! You can filter transactions by date range, organization, or specific module, and instantly generate printable PDF reports to share with your accounting team, partners, or investors."
  },
  {
    question: "Is my financial data secure?",
    answer: "Absolutely. PocketFlow is built with security as a priority. All database communication is encrypted, passwords are hashed using bcrypt, and user authentication is managed via secure, short-lived JSON Web Tokens (JWT)."
  },
  {
    question: "Does PocketFlow support multiple currencies?",
    answer: "Yes, PocketFlow has robust support for multi-currency organizations. You can set the default base currency for your organization and record transactions in the currency of your region."
  },
  {
    question: "Is there a mobile app available?",
    answer: "Yes! PocketFlow is a fully functional Progressive Web App (PWA). You can install it directly onto your desktop or mobile home screen from the browser, giving you a full app experience with fast load times."
  }
]

function FAQItem({ faq, index }) {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
      className="glass-card rounded-2xl border border-white/5 overflow-hidden transition-colors hover:border-white/10"
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-5 py-4 flex items-center justify-between text-left focus:outline-none"
      >
        <span className="text-xs sm:text-sm font-semibold text-white">{faq.question}</span>
        <ChevronDownIcon 
          className={`h-4 w-4 text-primary-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
          >
            <div className="px-5 pb-5 text-xs sm:text-sm text-[var(--muted)] leading-5 sm:leading-6 border-t border-white/5 pt-3">
              {faq.answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function FAQ() {
  const leftFaqs = faqs.slice(0, 3)
  const rightFaqs = faqs.slice(3, 6)

  return (
    <section id="faq" className="mt-16 scroll-mt-28 w-full">
      <div className="max-w-3xl">
        <p className="text-sm font-light uppercase tracking-[0.22em] text-primary-600">FAQ</p>
        <h4 className="mt-2 text-2xl font-light text-white sm:text-3xl">
          Frequently Asked Questions
        </h4>
        <p className="mt-3 text-sm sm:text-base text-[var(--muted)]">
          Find answers to common questions about PocketFlow features, security, organization setups, and platform access.
        </p>
      </div>

      <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-6 w-full items-start">
        {/* Left Column */}
        <div className="space-y-4">
          {leftFaqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} index={idx} />
          ))}
        </div>
        
        {/* Right Column */}
        <div className="space-y-4">
          {rightFaqs.map((faq, idx) => (
            <FAQItem key={idx} faq={faq} index={idx + 3} />
          ))}
        </div>
      </div>
    </section>
  )
}
