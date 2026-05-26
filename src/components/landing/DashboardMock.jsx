// Repo file header
import { motion } from 'framer-motion'

export default function DashboardMock(){
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:0.15}} className="p-4 bg-white rounded-2xl shadow-soft-lg">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[var(--muted)]">Balance</p>
          <p className="text-xl font-light">$0</p>
        </div>
        <div className="text-sm text-[var(--muted)]">No data yet</div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <div className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-[var(--muted)]">Revenue</p>
          <p className="font-light">$0</p>
        </div>
        <div className="p-3 rounded-lg bg-gray-50">
          <p className="text-xs text-[var(--muted)]">Expenses</p>
          <p className="font-light">$0</p>
        </div>
      </div>

      <div className="mt-4 bg-white border border-gray-100 rounded-lg p-3">
        <p className="text-sm text-[var(--muted)]">Recent</p>
        <div className="mt-2 rounded-lg border border-dashed border-gray-200 px-3 py-4 text-sm text-[var(--muted)]">No transactions yet.</div>
      </div>
    </motion.div>
  )
}
