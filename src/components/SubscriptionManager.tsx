import { useState, useEffect } from 'react';
import { Zap, Flame, Crown, AlertCircle, Loader } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { Subscription, getRemainingSubmissions, cancelSubscription } from '../lib/subscriptions';

const tierIcons = {
  starter: Zap,
  creator: Flame,
  pro: Crown,
};

const tierColors = {
  starter: 'text-green-500',
  creator: 'text-cyan-500',
  pro: 'text-orange-500',
};

const tierBgColors = {
  starter: 'bg-green-500/10 border-green-500/30',
  creator: 'bg-cyan-500/10 border-cyan-500/30',
  pro: 'bg-orange-500/10 border-orange-500/30',
};

interface SubscriptionData {
  subscription: Subscription | null;
  remaining: number;
  loading: boolean;
}

export const SubscriptionManager = () => {
  const { user, userTier } = useAuth();
  const [data, setData] = useState<SubscriptionData>({
    subscription: null,
    remaining: 0,
    loading: true,
  });
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user || !userTier) {
      setData({ subscription: null, remaining: 0, loading: false });
      return;
    }

    loadSubscriptionData();
  }, [user, userTier]);

  const loadSubscriptionData = async () => {
    try {
      if (!user) return;

      const { data: subData } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (userTier === 'starter') {
        const remaining = await getRemainingSubmissions(user.id, 'starter');
        setData({
          subscription: null,
          remaining,
          loading: false,
        });
      } else if (subData) {
        const remaining = userTier === 'pro'
          ? -1
          : await getRemainingSubmissions(user.id, userTier as 'creator' | 'pro');

        setData({
          subscription: subData,
          remaining,
          loading: false,
        });
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  const handleCancel = async () => {
    if (!user || !window.confirm('Are you sure you want to cancel your subscription? You will lose access to premium features at the end of your billing period.')) {
      return;
    }

    setCancelling(true);
    try {
      await cancelSubscription(user.id);
      await loadSubscriptionData();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
    } finally {
      setCancelling(false);
    }
  };

  if (data.loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader className="w-6 h-6 animate-spin text-cyan-500" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const Icon = tierIcons[userTier as keyof typeof tierIcons];
  const colorClass = tierColors[userTier as keyof typeof tierColors];
  const bgColorClass = tierBgColors[userTier as keyof typeof tierBgColors];

  return (
    <div className={`border rounded-lg p-6 ${bgColorClass}`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-lg ${bgColorClass}`}>
            <Icon className={`w-6 h-6 ${colorClass}`} />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-white capitalize">
              {userTier} Plan
            </h3>
            <p className="text-gray-400 text-sm mt-1">
              {userTier === 'starter'
                ? 'Free plan with limits'
                : data.subscription?.current_period_end
                  ? `Renews on ${new Date(data.subscription.current_period_end).toLocaleDateString()}`
                  : 'Active subscription'
              }
            </p>
          </div>
        </div>

        {userTier !== 'starter' && data.subscription && (
          <button
            onClick={handleCancel}
            disabled={cancelling || data.subscription.status === 'cancelled'}
            className="px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 border border-red-500/50 hover:border-red-500/80 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {cancelling ? 'Cancelling...' : 'Cancel'}
          </button>
        )}
      </div>

      {data.remaining > 0 || data.remaining === -1 ? (
        <div className="mt-4 p-4 bg-slate-700/50 rounded-lg border border-slate-600/50">
          <div className="flex items-center gap-2 mb-2">
            <Zap className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-medium text-white">
              Videos This Month
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex-1 bg-slate-600/50 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-300"
                style={{
                  width: data.remaining === -1
                    ? '100%'
                    : userTier === 'starter'
                      ? `${((5 - data.remaining) / 5) * 100}%`
                      : `${((50 - data.remaining) / 50) * 100}%`
                }}
              />
            </div>
            <span className="text-sm font-semibold text-white whitespace-nowrap">
              {data.remaining === -1
                ? 'Unlimited'
                : `${data.remaining} remaining`
              }
            </span>
          </div>
        </div>
      ) : (
        <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-medium text-yellow-200">
              Video limit reached
            </p>
            <p className="text-xs text-yellow-200/70 mt-1">
              You've used all your videos for this month. Upgrade or wait for your limit to reset.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
