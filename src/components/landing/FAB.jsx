import { useState } from 'react'

export default function FAB(){
  const [open,setOpen] = useState(false)
  return (
    <>
      <div className="fixed right-6 bottom-6 z-50">
        <button onClick={()=>setOpen(true)} className="h-14 w-14 rounded-full bg-gradient-to-br from-primary-500 to-primary-600 text-white text-2xl shadow-lg shadow-primary-500/30 transition hover:-translate-y-1 hover:shadow-primary-500/40">
          ＋
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-[rgba(16,24,40,0.28)] backdrop-blur-sm" onClick={()=>setOpen(false)} />
          <div className="relative w-full max-w-md rounded-[1.75rem] border border-white bg-white p-6 shadow-[0_25px_60px_rgba(16,24,40,0.16)]">
            <div className="flex items-center justify-between">
              <h4 className="text-lg font-light text-[var(--text)]">Add Transaction</h4>
              <span className="rounded-full bg-primary-50 px-3 py-1 text-xs font-light text-primary-700">Quick entry</span>
            </div>
            <p className="mt-2 text-sm text-[var(--muted)]">Fast mock entry with a soft premium form surface.</p>
            <form className="mt-5 space-y-3">
              <input className="w-full rounded-2xl border border-gray-200 bg-[#F8FAFC] p-3.5 outline-none transition focus:border-primary-300" placeholder="Description" />
              <input className="w-full rounded-2xl border border-gray-200 bg-[#F8FAFC] p-3.5 outline-none transition focus:border-primary-300" placeholder="Amount" />
              <div className="grid grid-cols-2 gap-3 rounded-2xl border border-dashed border-primary-200 bg-primary-50/50 p-4 text-sm text-[var(--muted)]">
                <div>Attachment upload area</div>
                <div className="text-right">Amount history</div>
              </div>
              <div className="flex gap-3">
                <button type="button" className="flex-1 rounded-full bg-gradient-to-r from-primary-500 to-primary-600 py-2.5 font-light text-white shadow-lg shadow-primary-500/20">Add</button>
                <button type="button" onClick={()=>setOpen(false)} className="flex-1 rounded-full border border-gray-200 py-2.5 font-light text-[var(--text)]">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
