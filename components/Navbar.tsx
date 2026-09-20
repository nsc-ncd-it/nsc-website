'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

const NavLinks = [
  { name: 'Home', href: '/' },
  { name: 'About Us', href: '/about' },
  { name: 'Departments', href: '/departments' },
  { name: 'Events', href: '/events' },
  { name: 'EXAM', href: '/exam' },
  { name: 'Committee', href: '/committee' },
  { name: 'Achievements', href: '/achievements' },
  { name: 'VERIFY', href: '/verify' },
];

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? 'glass h-16' : 'bg-transparent h-20'
      } border-b border-slate-800/50`}
    >
      <div className="max-w-[1400px] mx-auto px-6 h-full flex xl:grid xl:grid-cols-[auto_1fr_auto] items-center justify-between gap-4">
        
        {/* Left: Logo */}
        <Link href="/" className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full relative overflow-hidden bg-[#0A0D14] border border-yellow-500/20 shrink-0">
            <Image
              src="/logo.png"
              alt="NSC Logo"
              fill
              className="object-contain p-1.5"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-200 whitespace-nowrap">
              Navians&apos; Science Club
            </span>
            <span className="text-[10px] uppercase font-semibold text-slate-500 whitespace-nowrap">
              Noubahini College Dhaka
            </span>
          </div>
        </Link>

        {/* Center: Nav Links */}
        <div className="hidden xl:flex items-center justify-center gap-6 xl:gap-8">
          {NavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              className="text-[10px] font-bold uppercase tracking-[0.18em] text-slate-300 hover:text-sky-400 transition-colors whitespace-nowrap"
            >
              {link.name}
            </Link>
          ))}
        </div>

        {/* Right: Buttons */}
        <div className="hidden xl:flex items-center gap-2.5 justify-end shrink-0">
          <Link
            href="/events"
            className="px-4 py-2 rounded-lg bg-sky-500 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/20 whitespace-nowrap"
          >
            Register
          </Link>
          <a
            href="https://nscods.infy.click/"
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 rounded-lg bg-cyan-400 text-slate-950 text-[10px] font-bold uppercase tracking-widest hover:bg-cyan-300 transition-all shadow-lg shadow-cyan-400/20 whitespace-nowrap"
          >
            JOIN NOW
          </a>
        </div>

        {/* Mobile Toggle */}
        <button
          className="xl:hidden text-white p-2"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X /> : <Menu />}
        </button>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-full left-0 right-0 glass border-t border-white/10 p-4 xl:hidden flex flex-col gap-3 max-h-[85vh] overflow-y-auto"
        >
          {NavLinks.map((link) => (
            <Link
              key={link.name}
              href={link.href}
              onClick={() => setIsOpen(false)}
              className="text-base font-medium py-2 border-b border-white/5 text-slate-200"
            >
              {link.name}
            </Link>
          ))}
          <div className="flex flex-col gap-2 pt-2">
            <Link
              href="/events"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-xl bg-sky-500 text-slate-950 text-center font-bold uppercase tracking-widest text-xs"
            >
              Register
            </Link>
            <a
              href="https://nscods.infy.click/"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full py-3 rounded-xl bg-cyan-400 text-slate-950 text-center font-bold uppercase tracking-widest text-xs"
            >
              JOIN NOW
            </a>
          </div>
        </motion.div>
      )}
    </nav>
  );
}