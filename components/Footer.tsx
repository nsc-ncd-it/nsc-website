'use client';

import { motion } from 'motion/react';
import { Phone, Mail, Facebook, Github, Heart } from 'lucide-react';
import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="grid md:grid-cols-3 border-t border-slate-800/50 bg-[#080B14] z-10 px-10 py-10 items-center gap-10" id="contact">
      <div className="space-y-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Contact Channel</div>
        <div className="text-xs text-slate-300 font-mono">01972543781 | nscit2627@gmail.com</div>
      </div>
      
      <div className="flex flex-col items-center md:items-center space-y-1 text-center">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">
          Web Design Credits
        </div>
        <div className="text-xs text-sky-400 font-medium whitespace-nowrap">
          Ashikul Haque Borno (Sr. IT Vice President)
        </div>
        <div className="text-xs text-sky-400 font-medium whitespace-nowrap">
          Jahidul Islam Akon (IT Vice President)
        </div>
        <div className="text-xs text-sky-400 font-medium whitespace-nowrap">
          T.I. Sunny
        </div>
      </div>
      
      <div className="flex flex-col items-center md:items-end space-y-1">
        <div className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-bold">Connect Social</div>
        <a href="https://www.facebook.com/nsc.ncd" target="_blank" className="text-xs text-slate-300 hover:text-sky-400 transition-colors font-mono">facebook.com/nsc.ncd</a>
      </div>
    </footer>
  );
}