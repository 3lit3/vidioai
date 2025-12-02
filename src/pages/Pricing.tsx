import { useState, useEffect } from 'react';
import { Check, Zap, Flame, Crown, Loader } from 'lucide-react';
import { createCheckoutSession } from '../lib/subscriptions';
import { useAuth } from '../contexts/AuthContext';

interface PricingProps {
  onNavigate: (page: string) => void;
}

export const Pricing = ({ onNavigate }: PricingProps) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const plans = [
    {
      tier: 'starter',
      name: 'Starter',
      icon: Zap,
      price: '0',
      period: 'forever',
      description: 'Perfect for trying out our platform',
      color: 'from-green-500 to-emerald-600',
      borderColor: 'border-green-500/30',
      hoverBorder: 'hover:border-green-500/60',
      features: [
        '5 videos per month',
        'Basic templates',
        'Standard rendering speed',
        '720p export quality',
        'Watermark included',
        'Community support',
      ],
    },
    {
      tier: 'creator',
      name: 'Creator',
      icon: Flame,
      price: '29',
      period: 'per month',
      description: 'For serious content creators',
      color: 'from-cyan-500 to-blue-600',
      borderColor: 'border-cyan-500/50',
      hoverBorder: 'hover:border-cyan-500/80',
      popular: true,
      features: [
        '50 videos per month',
        'Premium templates',
        'Fast rendering',
        '1080p export quality',
        'No watermark',
        'Priority support',
        'Custom branding',
        'AI voice options',
      ],
    },
    {
      tier: 'pro',
      name: 'Pro',
      icon: Crown,
      price: '99',
      period: 'per month',
      description: 'For agencies and businesses',
      color: 'from-orange-500 to-red-600',
      borderColor: 'border-orange-500/30',
      hoverBorder: 'hover:border-orange-500/60',
      features: [
        'Unlimited videos',
        'All premium templates',
        'Lightning fast rendering',
        '4K export quality',
        'No watermark',
        '24/7 priority support',
        'Custom branding',
        'Advanced AI features',
        'API access',
        'Team collaboration',
      ],
    },
  ];

  useEffect(() => {
    setError(null);
  }, []);

  const handleCheckout = async (tier: 'creator' | 'pro') => {
    if (!user) {
      onNavigate('auth');
      return;
    }

    setLoading(tier);
    setError(null);

    try {
      const session = await createCheckoutSession(tier, user.email || '', user.id);
      if (session.url) {
        window.location.href = session.url;
      }
    } catch (err) {
      setError('Failed to start checkout. Please try again.');
      console.error('Checkout error:', err);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {error && (
          <div className="mb-8 p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200">
            {error}
          </div>
        )}

        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-orange-600/20 rounded-full border border-cyan-500/30">
            <span className="text-cyan-400 font-semibold">Simple, Transparent Pricing</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Choose Your Plan
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Start free and upgrade as you grow. All plans include our core AI video generation features.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {plans.map((plan) => {
            const Icon = plan.icon;
            return (
              <div
                key={plan.name}
                className={`relative bg-slate-800/50 backdrop-blur-sm border ${plan.borderColor} ${plan.hoverBorder} rounded-2xl p-8 transition-all hover:transform hover:scale-105 ${
                  plan.popular ? 'ring-2 ring-cyan-500 shadow-2xl shadow-cyan-500/20' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <span className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold">
                      MOST POPULAR
                    </span>
                  </div>
                )}

                <div className={`w-14 h-14 bg-gradient-to-r ${plan.color} rounded-xl flex items-center justify-center mb-4`}>
                  <Icon className="w-7 h-7 text-white" />
                </div>

                <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                <p className="text-gray-400 mb-6">{plan.description}</p>

                <div className="mb-6">
                  <div className="flex items-baseline">
                    <span className="text-5xl font-bold text-white">${plan.price}</span>
                    <span className="text-gray-400 ml-2">/{plan.period}</span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    if (plan.tier === 'starter') {
                      if (!user) onNavigate('auth');
                      else onNavigate('dashboard');
                    } else {
                      handleCheckout(plan.tier as 'creator' | 'pro');
                    }
                  }}
                  disabled={loading === plan.tier}
                  className={`w-full py-3 rounded-xl font-bold text-white bg-gradient-to-r ${plan.color} hover:shadow-lg transition-all mb-8 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2`}
                >
                  {loading === plan.tier ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    'Get Started'
                  )}
                </button>

                <div className="space-y-4">
                  {plan.features.map((feature) => (
                    <div key={feature} className="flex items-start gap-3">
                      <div className={`mt-1 w-5 h-5 bg-gradient-to-r ${plan.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                        <Check className="w-3 h-3 text-white" />
                      </div>
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Need a Custom Plan?</h2>
          <p className="text-gray-400 mb-6">
            Contact us for enterprise solutions and volume discounts
          </p>
          <button
            onClick={() => onNavigate('contact')}
            className="px-8 py-3 bg-slate-700 text-white font-bold rounded-xl border-2 border-cyan-500/50 hover:bg-slate-600 transition-all"
          >
            Contact Sales
          </button>
        </div>
      </div>
    </div>
  );
};
