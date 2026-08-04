import { useState } from 'react'
import { motion } from 'framer-motion'
import { UserIcon, MapPinIcon, PhoneIcon, PhotoIcon } from '@heroicons/react/24/outline'
import { apiRequest } from '../../utils/api'

export default function CompleteProfileModal({ currentUser, onUpdateUser, onSkip }) {
  const [name, setName] = useState(currentUser?.name || '')
  const [address, setAddress] = useState(currentUser?.address || '')
  const [mobile, setMobile] = useState(currentUser?.mobile || '')
  const [profilePic, setProfilePic] = useState(currentUser?.profile_pic || '')
  const [isSaving, setIsSaving] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onloadend = () => {
      setProfilePic(reader.result)
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return setErrorMsg('Name is required')
    if (!address.trim()) return setErrorMsg('Address is required')
    if (!mobile.trim()) return setErrorMsg('Mobile number is required')

    setIsSaving(true)
    setErrorMsg('')
    try {
      const payload = await apiRequest('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          mobile: mobile.trim(),
          profile_pic: profilePic
        })
      })
      const updatedUser = payload?.data?.user
      if (updatedUser) {
        onUpdateUser(updatedUser)
      } else {
        setErrorMsg('Failed to update profile details')
      }
    } catch (err) {
      console.error('Profile complete error:', err)
      setErrorMsg(err.message || 'Error updating profile')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="w-full max-w-md bg-white dark:bg-slate-900 border border-slate-100 dark:border-white/5 rounded-3xl p-6 shadow-2xl shadow-slate-200/50 dark:shadow-none text-slate-800 dark:text-slate-200"
      >
        <div className="text-center space-y-2 mb-6">
          <h3 className="text-lg font-bold tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-indigo-400">
            Complete Your Profile
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-light max-w-xs mx-auto">
            Please fill in your details to customize your financial workspace experience.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 rounded-2xl text-[11px] font-medium mb-4 text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Avatar Upload */}
          <div className="flex flex-col items-center gap-2 mb-2">
            <div className="relative group h-20 w-20 rounded-full border-2 border-dashed border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden bg-slate-50 dark:bg-slate-950">
              {profilePic ? (
                <img src={profilePic} alt="Profile" className="h-full w-full object-cover" />
              ) : (
                <PhotoIcon className="h-7 w-7 text-slate-400" />
              )}
              <label className="absolute inset-0 flex items-center justify-center bg-black/45 text-white opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-light">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            </div>
            <span className="text-[10px] font-medium text-slate-400">Profile Image (Optional)</span>
          </div>

          {/* Name Field */}
          <div>
            <label htmlFor="comp-name" className="block text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Full Name</label>
            <div className="relative">
              <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="comp-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="John Doe"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Mobile Field */}
          <div>
            <label htmlFor="comp-mobile" className="block text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Mobile Number</label>
            <div className="relative">
              <PhoneIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                id="comp-mobile"
                type="tel"
                required
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                placeholder="+91 98765 43210"
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Address Field */}
          <div>
            <label htmlFor="comp-address" className="block text-[10px] font-medium text-slate-400 mb-1.5 uppercase tracking-wider">Home Address</label>
            <div className="relative">
              <MapPinIcon className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <textarea
                id="comp-address"
                required
                rows={2}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Apartment, Street, City, State"
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-white/5 rounded-2xl text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 pt-3">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl text-xs font-semibold shadow-lg shadow-blue-500/10 transition disabled:opacity-50"
            >
              {isSaving ? 'Saving Changes...' : 'Save and Continue'}
            </button>
            <button
              type="button"
              onClick={onSkip}
              className="w-full py-1 text-center text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition text-xs font-light"
            >
              Skip for now
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  )
}
