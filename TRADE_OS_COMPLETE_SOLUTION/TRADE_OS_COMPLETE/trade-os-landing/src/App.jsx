import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  CheckCircle, 
  Star, 
  Users, 
  Calendar, 
  FileText, 
  DollarSign, 
  Zap, 
  Shield, 
  Download,
  Play,
  ArrowRight,
  Menu,
  X,
  Wrench,
  Calculator,
  Clock,
  BarChart3,
  Smartphone,
  Laptop,
  Tablet
} from 'lucide-react'
import './App.css'

// Import images
import contractorHero from './assets/contractor-hero.jpg'
import contractorWorking from './assets/contractor-working.jpg'
import contractorTools from './assets/contractor-tools.jpg'

function App() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [activeTestimonial, setActiveTestimonial] = useState(0)

  const features = [
    {
      icon: <Zap className="h-8 w-8" />,
      title: "AI-Powered Quotes",
      description: "Generate accurate quotes in minutes with AI that learns from your historical data and industry standards."
    },
    {
      icon: <Calendar className="h-8 w-8" />,
      title: "Smart Scheduling",
      description: "Visual calendar with drag-and-drop scheduling, crew management, and automatic conflict detection."
    },
    {
      icon: <Users className="h-8 w-8" />,
      title: "Client Management",
      description: "Complete CRM with contact history, project tracking, and automated follow-ups."
    },
    {
      icon: <FileText className="h-8 w-8" />,
      title: "Job Tracking",
      description: "Track every project from quote to completion with real-time updates and progress monitoring."
    },
    {
      icon: <DollarSign className="h-8 w-8" />,
      title: "Invoice & Payments",
      description: "Professional invoicing with payment tracking, automated reminders, and financial reporting."
    },
    {
      icon: <BarChart3 className="h-8 w-8" />,
      title: "Business Analytics",
      description: "Comprehensive reports on profitability, efficiency, and growth opportunities."
    }
  ]

  const testimonials = [
    {
      name: "Mike Rodriguez",
      trade: "Plumbing Contractor",
      company: "Rodriguez Plumbing Services",
      quote: "TRADE OS transformed my business. I'm generating quotes 5x faster and my profit margins have increased by 30%. The AI suggestions are incredibly accurate.",
      rating: 5
    },
    {
      name: "Sarah Chen",
      trade: "Electrical Contractor",
      company: "Chen Electric Solutions",
      quote: "The scheduling feature alone saved me 10 hours per week. My crew always knows where they need to be, and clients love the professional communication.",
      rating: 5
    },
    {
      name: "David Thompson",
      trade: "Drywall Specialist",
      company: "Thompson Drywall Co.",
      quote: "I was skeptical about contractor software, but TRADE OS is different. It's actually built for people like us. My invoicing is now automated and I get paid faster.",
      rating: 5
    }
  ]

  const pricingPlans = [
    {
      name: "Starter",
      price: "$49",
      period: "/month",
      description: "Perfect for solo contractors and small teams",
      features: [
        "Up to 50 quotes per month",
        "Basic job tracking",
        "Client management",
        "Mobile app access",
        "Email support"
      ],
      popular: false
    },
    {
      name: "Professional",
      price: "$99",
      period: "/month",
      description: "Ideal for growing contracting businesses",
      features: [
        "Unlimited quotes",
        "Advanced scheduling",
        "Team collaboration",
        "Financial reporting",
        "Priority support",
        "Custom branding"
      ],
      popular: true
    },
    {
      name: "Enterprise",
      price: "$199",
      period: "/month",
      description: "For large contracting companies",
      features: [
        "Everything in Professional",
        "Multi-location support",
        "Advanced analytics",
        "API access",
        "Dedicated account manager",
        "Custom integrations"
      ],
      popular: false
    }
  ]

  useEffect(() => {
    const interval = setInterval(() => {
      setActiveTestimonial((prev) => (prev + 1) % testimonials.length)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Navigation */}
      <nav className="bg-white/95 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Wrench className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold text-slate-900">TRADE OS</span>
            </div>
            
            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">Features</a>
              <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors">Reviews</a>
              <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
              <Button variant="outline" className="mr-2">Sign In</Button>
              <Button>Start Free Trial</Button>
            </div>

            {/* Mobile menu button */}
            <div className="md:hidden">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsMenuOpen(!isMenuOpen)}
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </Button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-slate-200">
              <div className="flex flex-col space-y-4">
                <a href="#features" className="text-slate-600 hover:text-blue-600 transition-colors">Features</a>
                <a href="#testimonials" className="text-slate-600 hover:text-blue-600 transition-colors">Reviews</a>
                <a href="#pricing" className="text-slate-600 hover:text-blue-600 transition-colors">Pricing</a>
                <div className="flex flex-col space-y-2 pt-4">
                  <Button variant="outline">Sign In</Button>
                  <Button>Start Free Trial</Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                  🚀 Now with AI-Powered Quote Generation
                </Badge>
                <h1 className="text-4xl lg:text-6xl font-bold text-slate-900 leading-tight">
                  The Essential
                  <span className="text-blue-600"> Operating System</span>
                  <br />for Contractors
                </h1>
                <p className="text-xl text-slate-600 leading-relaxed">
                  Stop juggling spreadsheets and sticky notes. TRADE OS is the all-in-one platform that helps plumbers, electricians, drywallers, and specialty contractors run their business like a Fortune 500 company.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Button size="lg" className="text-lg px-8 py-4">
                  <Download className="mr-2 h-5 w-5" />
                  Download Free Trial
                </Button>
                <Button variant="outline" size="lg" className="text-lg px-8 py-4">
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>

              <div className="flex items-center space-x-6 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-1">
                  <CheckCircle className="h-4 w-4 text-green-500" />
                  <span>Cancel anytime</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <div className="relative z-10">
                <img 
                  src={contractorHero} 
                  alt="Professional contractor working" 
                  className="rounded-2xl shadow-2xl"
                />
              </div>
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 to-purple-600/20 rounded-2xl transform rotate-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">10,000+</div>
              <div className="text-slate-600 mt-2">Active Contractors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">$50M+</div>
              <div className="text-slate-600 mt-2">Jobs Managed</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">98%</div>
              <div className="text-slate-600 mt-2">Customer Satisfaction</div>
            </div>
            <div className="text-center">
              <div className="text-3xl lg:text-4xl font-bold text-blue-600">30%</div>
              <div className="text-slate-600 mt-2">Average Profit Increase</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900">
              Everything You Need to Run Your Trade Business
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              From AI-powered quotes to automated invoicing, TRADE OS handles the business side so you can focus on what you do best.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="group hover:shadow-lg transition-all duration-300 border-0 bg-white">
                <CardHeader>
                  <div className="text-blue-600 group-hover:scale-110 transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Platform Section */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <h2 className="text-3xl lg:text-4xl font-bold text-slate-900">
                Works on Every Device You Use
              </h2>
              <p className="text-lg text-slate-600 leading-relaxed">
                Whether you're in the office, on the job site, or at home, TRADE OS keeps your business running smoothly across all your devices.
              </p>
              
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <Laptop className="h-6 w-6 text-blue-600" />
                  <span className="text-slate-700">Desktop Application (Windows, Mac, Linux)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Tablet className="h-6 w-6 text-blue-600" />
                  <span className="text-slate-700">Tablet Optimized Interface</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Smartphone className="h-6 w-6 text-blue-600" />
                  <span className="text-slate-700">Mobile App (iOS & Android)</span>
                </div>
                <div className="flex items-center space-x-3">
                  <Shield className="h-6 w-6 text-blue-600" />
                  <span className="text-slate-700">Offline-First Design</span>
                </div>
              </div>

              <Button size="lg" className="mt-6">
                Download for Your Platform
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="relative">
              <img 
                src={contractorWorking} 
                alt="Contractor using TRADE OS on tablet" 
                className="rounded-2xl shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold">
              Trusted by Contractors Nationwide
            </h2>
            <p className="text-xl text-slate-300 max-w-3xl mx-auto">
              See how TRADE OS is helping contractors like you grow their business and increase profits.
            </p>
          </div>

          <div className="relative">
            <Card className="bg-slate-800 border-slate-700 max-w-4xl mx-auto">
              <CardContent className="p-8 lg:p-12">
                <div className="text-center space-y-6">
                  <div className="flex justify-center space-x-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  
                  <blockquote className="text-xl lg:text-2xl leading-relaxed text-slate-100">
                    "{testimonials[activeTestimonial].quote}"
                  </blockquote>
                  
                  <div className="space-y-2">
                    <div className="font-semibold text-lg text-white">
                      {testimonials[activeTestimonial].name}
                    </div>
                    <div className="text-slate-300">
                      {testimonials[activeTestimonial].trade} • {testimonials[activeTestimonial].company}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Testimonial indicators */}
            <div className="flex justify-center space-x-2 mt-8">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setActiveTestimonial(index)}
                  className={`w-3 h-3 rounded-full transition-colors ${
                    index === activeTestimonial ? 'bg-blue-500' : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-16">
            <h2 className="text-3xl lg:text-5xl font-bold text-slate-900">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {pricingPlans.map((plan, index) => (
              <Card key={index} className={`relative ${plan.popular ? 'ring-2 ring-blue-500 scale-105' : ''}`}>
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-blue-500 text-white">
                    Most Popular
                  </Badge>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">{plan.name}</CardTitle>
                  <div className="space-y-2">
                    <div className="text-4xl font-bold text-slate-900">
                      {plan.price}
                      <span className="text-lg font-normal text-slate-600">{plan.period}</span>
                    </div>
                    <CardDescription className="text-base">{plan.description}</CardDescription>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  <ul className="space-y-3">
                    {plan.features.map((feature, featureIndex) => (
                      <li key={featureIndex} className="flex items-center space-x-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-slate-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                  
                  <Button 
                    className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`}
                    variant={plan.popular ? 'default' : 'outline'}
                    size="lg"
                  >
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="text-center mt-12">
            <p className="text-slate-600 mb-4">
              Need a custom solution for your large contracting business?
            </p>
            <Button variant="outline" size="lg">
              Contact Sales
            </Button>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          <h2 className="text-3xl lg:text-5xl font-bold">
            Ready to Transform Your Business?
          </h2>
          <p className="text-xl text-blue-100 leading-relaxed">
            Join thousands of contractors who have already streamlined their operations and increased their profits with TRADE OS.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" className="text-lg px-8 py-4">
              <Download className="mr-2 h-5 w-5" />
              Download Free Trial
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-4 border-white text-white hover:bg-white hover:text-blue-600">
              Schedule Demo
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-6 text-sm text-blue-100">
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>No setup fees</span>
            </div>
            <div className="flex items-center space-x-1">
              <CheckCircle className="h-4 w-4" />
              <span>Cancel anytime</span>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Wrench className="h-8 w-8 text-blue-400" />
                <span className="text-2xl font-bold">TRADE OS</span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                The essential operating system for specialty trade contractors. Built by contractors, for contractors.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Product</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Features</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Integrations</a></li>
                <li><a href="#" className="hover:text-white transition-colors">API</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Training</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Status</a></li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li><a href="#" className="hover:text-white transition-colors">About</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Careers</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Privacy</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-slate-800 mt-12 pt-8 text-center text-slate-400">
            <p>&copy; 2025 TRADE OS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default App

