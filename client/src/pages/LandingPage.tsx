import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  ArrowRight,
  CheckCircle2,
  Kanban,
  Calendar,
  Clock,
  BarChart3,
  Shield,
  Zap,
  Users2,
  Lock,
  ChevronRight,
  Sparkles,
  FileSpreadsheet
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Kanban,
      title: 'Dynamic Kanban Boards',
      description:
        'Visualize your workflow with fluid drag-and-drop columns, customizable status lanes, priority tags, and checklist tracking.'
    },
    {
      icon: Calendar,
      title: 'Synchronized Calendar',
      description:
        'Track milestones, sprint dates, and deadlines at a glance with full month navigation and instant task drawers.'
    },
    {
      icon: Clock,
      title: 'Interactive Timeline Views',
      description:
        'Gantt-style timeline visualization mapping durations, overdue warnings, and project lifecycles effortlessly.'
    },
    {
      icon: BarChart3,
      title: 'Real-time Reports & CSV Export',
      description:
        'Live velocity metrics, status distributions, team workload analytics, and one-click compliance CSV downloads.'
    },
    {
      icon: Users2,
      title: 'Workspace Role Permissions',
      description:
        'Granular role-based access: Owners, Admins, Project Managers, Contributors, and Viewers with backend tenant isolation.'
    },
    {
      icon: Lock,
      title: 'Enterprise-grade Security',
      description:
        'Bcrypt-hashed passwords, SameSite session cookies, rate-limiting, Helmet headers, and zero client token leakage.'
    }
  ];

  const pricingPlans = [
    {
      name: 'Starter',
      price: '$0',
      period: 'forever free',
      desc: 'Ideal for freelance developers, students, and small solo initiatives.',
      features: [
        'Up to 3 active projects',
        'Interactive Kanban boards',
        'Personal calendar view',
        'Basic CSV export',
        'Community support'
      ],
      cta: 'Start Free',
      popular: false
    },
    {
      name: 'Professional',
      price: '$12',
      period: 'per member / month',
      desc: 'Engineered for growing startup squads and rapid product delivery teams.',
      features: [
        'Unlimited active projects',
        'Real-time Socket.IO updates',
        'Full timeline & Gantt views',
        'Detailed workload reports',
        '10MB file attachments',
        'Priority email assistance'
      ],
      cta: 'Try Pro Free',
      popular: true
    },
    {
      name: 'Team & Enterprise',
      price: '$29',
      period: 'per member / month',
      desc: 'Dedicated controls, governance, and audit trails for scaled organizations.',
      features: [
        'Multi-workspace governance',
        'System audit activity logs',
        'Custom member permissions',
        'Automated executive summaries',
        'Dedicated SLA & Admin console',
        'Unlimited attachment storage'
      ],
      cta: 'Contact Sales',
      popular: false
    }
  ];

  const faqs = [
    {
      q: 'How does TaskFlow Pro enforce project privacy and security?',
      a: 'All project data is strictly verified on the backend before executing any query. Users cannot view, modify, or manipulate tasks in workspaces or private projects they have not been authorized to access.'
    },
    {
      q: 'Are the Kanban boards updated in real-time?',
      a: 'Yes! TaskFlow Pro uses Socket.IO to broadcast task moves, status changes, and newly posted discussion comments across active team members in the same workspace or project.'
    },
    {
      q: 'Can I export our team analytics and sprint data?',
      a: 'Absolutely. The Reports center calculates real project completion rates and offers one-click RFC-compliant CSV downloads with full assignee and priority metadata.'
    },
    {
      q: 'What technologies power TaskFlow Pro?',
      a: 'Built on a production MERN stack: React 18, TypeScript, Tailwind CSS, Lucide icons, Express.js, MongoDB with Mongoose, and Socket.IO.'
    }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      {/* Navigation Bar */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Layers className="w-5 h-5" />
            </div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">
              TaskFlow <span className="text-brand-600">Pro</span>
            </span>
          </div>

          <div className="hidden md:flex items-center space-x-8 text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-brand-600 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-brand-600 transition-colors">How It Works</a>
            <a href="#pricing" className="hover:text-brand-600 transition-colors">Pricing</a>
            <a href="#faq" className="hover:text-brand-600 transition-colors">FAQ</a>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => navigate('/login')}
              className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="px-4 py-2 text-sm font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-sm transition-all focus:ring-2 focus:ring-brand-500 focus:ring-offset-2"
            >
              Get Started Free
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-16 pb-20 lg:pt-24 lg:pb-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 px-3 py-1.5 rounded-full bg-brand-50 border border-brand-200/80 text-brand-700 text-xs font-semibold mb-6 shadow-xs">
            <Sparkles className="w-3.5 h-3.5" />
            <span>TaskFlow Pro 2.0 • CodeAlpha Full Stack Project</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-slate-950 tracking-tight max-w-4xl mx-auto leading-[1.1]">
            Turn Teamwork <br className="hidden sm:inline" />
            Into <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 via-indigo-600 to-cyan-500">Results</span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Plan smarter, collaborate better, and deliver faster. A commercial-grade project management SaaS platform designed for high-velocity teams, developers, and modern organizations.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              onClick={() => navigate('/register')}
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-white bg-brand-600 hover:bg-brand-700 rounded-xl shadow-lg shadow-brand-500/25 transition-all flex items-center justify-center space-x-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-5 h-5" />
            </button>
            <a
              href="#features"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-semibold text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-xs transition-colors"
            >
              Explore Features
            </a>
          </div>

          {/* Product Dashboard Preview Mockup using real UI constructs */}
          <div className="mt-16 relative max-w-5xl mx-auto rounded-2xl border border-slate-200/90 shadow-2xl bg-white overflow-hidden text-left">
            {/* Window bar */}
            <div className="bg-slate-900 px-4 py-3 flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center space-x-2">
                <div className="w-3 h-3 rounded-full bg-red-500"></div>
                <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                <span className="text-xs text-slate-400 font-mono ml-2">app.taskflowpro.com/dashboard</span>
              </div>
              <span className="text-[11px] text-brand-400 font-medium">Acme Technologies Workspace</span>
            </div>

            {/* Dashboard UI Mockup inside window */}
            <div className="p-6 bg-slate-50">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">Active Projects</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">4</p>
                  <span className="text-[11px] text-emerald-600 font-medium">100% on schedule</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">Total Tasks</span>
                  <p className="text-2xl font-bold text-slate-900 mt-1">28</p>
                  <span className="text-[11px] text-brand-600 font-medium">Across 4 boards</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">In Progress</span>
                  <p className="text-2xl font-bold text-blue-600 mt-1">11</p>
                  <span className="text-[11px] text-slate-500 font-medium">5 due this week</span>
                </div>
                <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
                  <span className="text-xs text-slate-500">Completed</span>
                  <p className="text-2xl font-bold text-emerald-600 mt-1">17</p>
                  <span className="text-[11px] text-emerald-600 font-medium">61% completion rate</span>
                </div>
              </div>

              {/* Sample Kanban Columns */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase">To Do (3)</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2">
                    <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200 uppercase">HIGH</span>
                    <p className="text-xs font-semibold text-slate-800">Biometric Authentication Setup</p>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Due in 3 days</span>
                      <span className="font-semibold text-brand-600">MAR-4</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase">In Progress (2)</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2 ring-1 ring-brand-500/30">
                    <span className="text-[10px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-200 uppercase">URGENT</span>
                    <p className="text-xs font-semibold text-slate-800">Interactive Kanban Drag & Drop</p>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Checklist 2/3</span>
                      <span className="font-semibold text-brand-600">MAR-2</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-100/70 p-3 rounded-xl border border-slate-200/60">
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold text-slate-700 uppercase">Completed (5)</span>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-200 shadow-xs space-y-2 opacity-80">
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase">DONE</span>
                    <p className="text-xs font-semibold text-slate-800 line-through">Figma Design Token Hierarchy</p>
                    <div className="flex justify-between text-[10px] text-slate-400 pt-1">
                      <span>Completed</span>
                      <span className="font-semibold text-slate-400">MAR-1</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Everything You Need
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Powerful tools built for modern teams
            </p>
            <p className="mt-4 text-slate-600 text-base leading-relaxed">
              TaskFlow Pro integrates project tracking, real-time communication, task delegation, and analytical reporting in one synchronized platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={i}
                  className="p-8 rounded-2xl bg-slate-50/70 border border-slate-200 hover:border-brand-300 hover:shadow-lg transition-all space-y-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition-colors shadow-xs">
                    <Icon className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Simple 3-Step Flow
            </h2>
            <p className="text-3xl font-extrabold text-slate-900 tracking-tight">
              From Concept to Shipped Product
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center mx-auto text-base">
                1
              </div>
              <h4 className="text-base font-bold text-slate-800">Create Workspaces & Projects</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Organize projects with custom prefixes, priorities, deadlines, and visibility controls for your team.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center mx-auto text-base">
                2
              </div>
              <h4 className="text-base font-bold text-slate-800">Collaborate & Move Tasks</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Drag tasks across Kanban columns, assign members, upload spec files, and chat in task threads.
              </p>
            </div>

            <div className="p-6 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 font-extrabold flex items-center justify-center mx-auto text-base">
                3
              </div>
              <h4 className="text-base font-bold text-slate-800">Track Progress & Export Reports</h4>
              <p className="text-sm text-slate-600 leading-relaxed">
                Review automated workload distribution charts, delivery rates, and export clean CSV reports.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white border-y border-slate-200/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">
              Transparent Plans
            </h2>
            <p className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              Choose the plan that fits your pace
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, i) => (
              <div
                key={i}
                className={`p-8 rounded-2xl border flex flex-col justify-between transition-all relative ${
                  plan.popular
                    ? 'border-brand-500 shadow-xl ring-2 ring-brand-500/20 bg-white'
                    : 'border-slate-200 bg-slate-50/50'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-brand-600 text-white text-[11px] font-bold px-3 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-slate-900">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-1 min-h-[32px]">{plan.desc}</p>

                  <div className="mt-5 mb-6">
                    <span className="text-4xl font-extrabold text-slate-950">{plan.price}</span>
                    <span className="text-xs text-slate-500 ml-1.5">/ {plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, fi) => (
                      <li key={fi} className="flex items-center space-x-2.5 text-xs text-slate-600">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  onClick={() => navigate('/register')}
                  className={`w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-colors ${
                    plan.popular
                      ? 'bg-brand-600 hover:bg-brand-700 text-white shadow-sm'
                      : 'bg-white hover:bg-slate-100 text-slate-800 border border-slate-200'
                  }`}
                >
                  {plan.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 bg-slate-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600 mb-2">FAQ</h2>
            <p className="text-3xl font-extrabold text-slate-900">Frequently Asked Questions</p>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
                <h4 className="text-base font-bold text-slate-900 mb-2">{faq.q}</h4>
                <p className="text-sm text-slate-600 leading-relaxed">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-navy-950 text-slate-400 border-t border-slate-800 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-white font-bold text-lg">
                <Layers className="w-5 h-5 text-brand-500" />
                <span>TaskFlow Pro</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                CodeAlpha Full Stack Development Project. Commercial-grade collaborative project management platform.
              </p>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Product</h5>
              <ul className="space-y-2 text-xs">
                <li><a href="#features" className="hover:text-white">Features</a></li>
                <li><a href="#pricing" className="hover:text-white">Pricing</a></li>
                <li><a href="#faq" className="hover:text-white">FAQ</a></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Resources</h5>
              <ul className="space-y-2 text-xs">
                <li><span className="hover:text-white cursor-pointer" onClick={() => navigate('/app/help')}>Documentation</span></li>
                <li><span className="hover:text-white cursor-pointer" onClick={() => navigate('/login')}>API Status</span></li>
                <li><span className="hover:text-white cursor-pointer" onClick={() => navigate('/register')}>Community</span></li>
              </ul>
            </div>

            <div>
              <h5 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Security & Compliance</h5>
              <p className="text-xs text-slate-400 leading-relaxed">
                JWT encrypted SameSite cookies, strict MongoDB tenant separation, bcrypt password encryption.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center">
            <p>© 2026 TaskFlow Pro. All rights reserved. CodeAlpha Internship Project.</p>
            <div className="flex space-x-4 mt-2 sm:mt-0">
              <span className="hover:text-slate-400 cursor-pointer">Privacy Policy</span>
              <span className="hover:text-slate-400 cursor-pointer">Terms of Service</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
