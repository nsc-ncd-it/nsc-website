'use client';

import { motion } from 'motion/react';
import { Atom, Users, Calendar, Award } from 'lucide-react';
import Image from 'next/image';

const stats = [
  { label: 'Total Departments', value: '6', icon: Atom },
  { label: 'Total Sessions Held', value: '20+', icon: Calendar },
  { label: 'Members', value: '500+', icon: Users },
  { label: 'Achievements', value: '25+', icon: Award },
];

export default function Hero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center pt-24 overflow-hidden">

      {/* Background Decor */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-600/20 rounded-full blur-[120px] -z-10 animate-pulse" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-600/20 rounded-full blur-[120px] -z-10 animate-pulse delay-1000" />

      <div className="max-w-7xl mx-auto px-4 text-center">

        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="mb-8 relative inline-block"
        >
          <div className="w-32 h-32 md:w-48 md:h-48 rounded-full relative p-1 shadow-2xl shadow-sky-500/20 overflow-hidden bg-[#0A0D14] border-2 border-yellow-500/30">
            <div className="absolute inset-0 bg-gradient-to-tr from-yellow-500/10 to-transparent pointer-events-none" />

            <Image
              src="/logo.png"
              alt="Navians' Science Club Logo"
              fill
              className="object-contain p-4"
              referrerPolicy="no-referrer"
            />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.8 }}
          className="font-display text-6xl md:text-8xl font-black mb-4 tracking-tighter leading-[0.9] text-white"
        >
          NAVIANS&apos;<br />
          <span className="text-gradient">SCIENCE CLUB</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="text-lg md:text-xl text-slate-400 max-w-lg mx-auto mb-16 leading-relaxed"
        >
          Fostering scientific temper and innovation at Noubahini College Dhaka.
          A platform for the next generation of researchers, engineers, and
          visionaries.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.8 }}
          className="flex flex-wrap justify-center gap-12 max-w-4xl mx-auto"
        >
          {stats.slice(0, 2).map((stat, i) => (
            <div key={stat.label} className="flex gap-12 items-center">

              <div className="space-y-1 text-left">
                <div className="text-5xl md:text-7xl font-light text-white font-mono tracking-tighter">
  {stat.value.length === 1 ? `0${stat.value}` : stat.value}
</div>

                <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
                  {stat.label}
                </div>
              </div>

              {i === 0 && (
                <div className="h-12 w-[1px] bg-slate-800 hidden md:block"></div>
              )}

            </div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}