
'use client';

import { motion } from 'motion/react';
import {
  Trophy,
  Code,
  Clapperboard,
  Camera,
  Bot,
  Lightbulb,
} from 'lucide-react';

const departments = [
  {
    name: 'Olympiad',
    description:
      'Preparing for science and mathematics olympiads through problem-solving, practice, and teamwork.',
    icon: Trophy,
    color: 'from-sky-500/20 to-indigo-500/20',
  },
  {
    name: 'IT',
    description:
      'Exploring programming, web development, and technology through hands-on learning.',
    icon: Code,
    color: 'from-sky-400/20 to-blue-500/20',
  },
  {
    name: 'Media',
    description:
      'Creating engaging content, covering club activities, and sharing our scientific stories.',
    icon: Clapperboard,
    color: 'from-sky-300/20 to-cyan-500/20',
  },
  {
    name: 'Photography',
    description:
      'Capturing memorable moments, documenting events, and developing photography skills.',
    icon: Camera,
    color: 'from-sky-200/20 to-emerald-500/20',
  },
  {
    name: 'Robotics',
    description:
      'Designing robots, exploring electronics, and building practical engineering projects.',
    icon: Bot,
    color: 'from-sky-100/20 to-indigo-500/20',
  },
  {
    name: 'Project',
    description:
      'Turning scientific ideas into practical projects, prototypes, and innovative solutions.',
    icon: Lightbulb,
    color: 'from-white/5 to-sky-500/20',
  },
];

export default function DepartmentsGrid() {
  return (
    <section className="py-24" id="departments">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="font-mono text-sm tracking-tighter text-sky-500 font-bold mb-2 uppercase">
            Our Specializations
          </h2>
          <h3 className="font-display text-4xl md:text-5xl font-black text-white">
            6 Core Departments
          </h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {departments.map((dept, i) => (
            <motion.div
              key={dept.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              whileHover={{ y: -5 }}
              className="p-10 rounded-[2.5rem] glass relative overflow-hidden group cursor-default"
            >
              <div
                className={`absolute inset-0 bg-gradient-to-br ${dept.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
              />

              <div className="relative z-10">
                <dept.icon className="w-10 h-10 text-sky-400 mb-8 group-hover:text-white transition-colors" />

                <h4 className="font-display font-bold text-2xl mb-4 tracking-tight text-white">
                  {dept.name}
                </h4>

                <p className="text-slate-400 group-hover:text-slate-200 transition-colors leading-relaxed">
                  {dept.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
