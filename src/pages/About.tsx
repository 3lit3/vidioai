import { Lightbulb, Zap, Target, CheckCircle } from 'lucide-react';

export const About = () => {
  const steps = [
    {
      number: '01',
      title: 'Input Your Details',
      description: 'Provide your product information, brand assets, and creative vision. Upload your images and describe what you want.',
      icon: Lightbulb,
    },
    {
      number: '02',
      title: 'AI Processing',
      description: 'Our advanced AI analyzes your inputs and generates a professional marketing video using smart templates and automation.',
      icon: Zap,
    },
    {
      number: '03',
      title: 'Customize & Export',
      description: 'Review your video, make any adjustments, and export in your preferred format and resolution. Ready to share!',
      icon: Target,
    },
  ];

  const features = [
    'AI-powered video generation',
    'Multiple aspect ratios',
    'Custom branding options',
    'Professional templates',
    'Fast rendering',
    'High-quality exports',
    'No editing skills required',
    'Unlimited revisions',
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-block mb-6 px-4 py-2 bg-gradient-to-r from-cyan-500/20 to-purple-600/20 rounded-full border border-cyan-500/30">
            <span className="text-cyan-400 font-semibold">How It Works</span>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
            Create Videos in
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-purple-500 bg-clip-text text-transparent">
              Three Simple Steps
            </span>
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Our AI-powered platform makes professional video creation accessible to everyone
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-20">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="relative bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8 hover:border-cyan-500/50 transition-all"
              >
                <div className="absolute -top-4 -left-4 w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">
                  {step.number}
                </div>
                <div className="mb-4">
                  <Icon className="w-12 h-12 text-cyan-400" />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                <p className="text-gray-400">{step.description}</p>
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-pink-500/10 rounded-3xl p-8 md:p-12 mb-20">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold text-white mb-6">
                Why VidioAI?
              </h2>
              <p className="text-gray-300 text-lg mb-6">
                We built VidioAI to democratize video creation. Whether you're a solo creator, marketer, or enterprise team, our platform empowers you to create stunning marketing videos without the traditional barriers of time, cost, and complexity.
              </p>
              <p className="text-gray-300 text-lg">
                Powered by cutting-edge AI technology and seamlessly integrated with n8n workflows, VidioAI transforms your ideas into professional videos in seconds.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="flex items-start gap-2 bg-slate-800/50 p-4 rounded-xl border border-slate-700"
                >
                  <CheckCircle className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-300 text-sm">{feature}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="text-center bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-12">
          <h2 className="text-3xl font-bold text-white mb-4">
            Trusted by Creators Worldwide
          </h2>
          <p className="text-gray-400 text-lg mb-6">
            Join thousands of content creators, marketers, and businesses using VidioAI
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-3xl mx-auto">
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">10K+</div>
              <div className="text-gray-400">Videos Created</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-purple-400 mb-2">5K+</div>
              <div className="text-gray-400">Active Users</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-pink-400 mb-2">98%</div>
              <div className="text-gray-400">Satisfaction</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-cyan-400 mb-2">24/7</div>
              <div className="text-gray-400">Support</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
