'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Zap, Github, Twitter, Linkedin, Heart } from 'lucide-react';

const FOOTER_LINKS = {
  Product: [
    { label: 'Optimizer',  href: '/optimizer' },
    { label: 'Examples',   href: '/examples'  },
    { label: 'History',    href: '/history'   },
    { label: 'Changelog',  href: '#'          },
  ],
  Company: [
    { label: 'About',    href: '/about'   },
    { label: 'Contact',  href: '/contact' },
    { label: 'Blog',     href: '#'        },
    { label: 'Careers',  href: '#'        },
  ],
  Resources: [
    { label: 'Documentation', href: '#' },
    { label: 'API Reference', href: '#' },
    { label: 'Status',        href: '#' },
    { label: 'Privacy',       href: '#' },
  ],
};

const SOCIALS = [
  { icon: Github,   href: '#', label: 'GitHub'   },
  { icon: Twitter,  href: '#', label: 'Twitter'  },
  { icon: Linkedin, href: '#', label: 'LinkedIn' },
];

export default function Footer() {
  return (
    <footer className="relative border-t border-[rgba(0,212,255,0.08)] bg-[#050508] overflow-hidden">
      {/* Background glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-96 h-32 bg-[rgba(0,212,255,0.04)] blur-3xl pointer-events-none" />

      <div className="container-max py-16 relative z-10">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4 group w-fit">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#00d4ff] to-[#0080ff] flex items-center justify-center">
                <Zap size={16} className="text-black" fill="black" />
              </div>
              <span className="font-display font-bold text-base tracking-wider">
                <span className="text-gradient-cyber">Smart</span><span className="text-white"> Query</span><span className="text-gradient-cyber"> Optimizer</span>
              </span>
            </Link>
            <p className="text-[#8899bb] text-sm leading-relaxed mb-5">
              Craft, Optimize, Deploy — Your SQL, Supercharged by AI.
            </p>
            <div className="flex items-center gap-3">
              {SOCIALS.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="w-9 h-9 flex items-center justify-center rounded-lg border border-[rgba(0,212,255,0.15)] text-[#8899bb] hover:text-[#00d4ff] hover:border-[rgba(0,212,255,0.4)] hover:bg-[rgba(0,212,255,0.05)] transition-all duration-200"
                >
                  <Icon size={16} />
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(FOOTER_LINKS).map(([heading, links]) => (
            <div key={heading}>
              <h4 className="text-white font-semibold text-sm mb-4 tracking-wide">{heading}</h4>
              <ul className="space-y-2.5">
                {links.map(link => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-[#8899bb] text-sm hover:text-[#00d4ff] transition-colors duration-200"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-[rgba(255,255,255,0.05)] flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-[#445566] text-sm">
            © {new Date().getFullYear()} Smart Query Optimizer. All rights reserved.
          </p>
          <p className="text-[#445566] text-sm flex items-center gap-1.5">
            Built with <Heart size={12} className="text-[#ff0080]" fill="#ff0080" /> by developers, for developers
          </p>
        </div>
      </div>
    </footer>
  );
}
