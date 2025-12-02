import { useState, useEffect } from 'react';
import { Upload, Sparkles, Loader2, CheckCircle, AlertCircle, Clock, Image as ImageIcon, Trash2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase, Submission } from '../lib/supabase';
import { CompletionModal } from '../components/CompletionModal';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';
import { ProgressBar } from '../components/ProgressBar';
import { SubscriptionManager } from '../components/SubscriptionManager';

interface DashboardProps {
  onNavigate: (page: string) => void;
}

export const Dashboard = ({ onNavigate }: DashboardProps) => {
  const { user, profile } = useAuth();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState<'form' | 'submissions'>('submissions');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [error, setError] = useState('');
  const [completedSubmission, setCompletedSubmission] = useState<Submission | null>(null);
  const [showCompletionModal, setShowCompletionModal] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ show: boolean; submissionId: string; productTitle: string }>({
    show: false,
    submissionId: '',
    productTitle: '',
  });
  const [deleting, setDeleting] = useState(false);

  const [formData, setFormData] = useState({
    productTitle: '',
    userPrompt: '',
    templateStyle: 'modern',
  });

  useEffect(() => {
    if (!user) {
      onNavigate('auth');
      return;
    }
    fetchSubmissions();
    const interval = setInterval(fetchSubmissions, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const fetchSubmissions = async () => {
    if (!user) return;

    const { data, error: fetchError } = await supabase
      .from('submissions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('Error fetching submissions:', fetchError);
    } else {
      const newData = data || [];

      newData.forEach((submission) => {
        const oldSubmission = submissions.find(s => s.id === submission.id);

        if (oldSubmission && oldSubmission.status !== 'completed' && submission.status === 'completed') {
          setCompletedSubmission(submission);
          setShowCompletionModal(true);
        }
      });

      setSubmissions(newData);
    }
    setLoading(false);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please upload a valid image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be less than 5MB');
      return;
    }

    setError('');
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setImageBase64(base64String);
      setImagePreview(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setError('');
    setGenerating(true);

    try {
      if (!formData.productTitle.trim()) {
        setError('Product title is required');
        setGenerating(false);
        return;
      }
      if (!formData.userPrompt.trim()) {
        setError('Description/prompt is required');
        setGenerating(false);
        return;
      }

      const submissionData = {
        user_id: user.id,
        product_title: formData.productTitle,
        user_prompt: formData.userPrompt,
        user_email: user.email || '',
        template_style: formData.templateStyle,
        image_base64: imageBase64,
        status: 'pending' as const,
      };

      const { data: submissionRecord, error: insertError } = await supabase
        .from('submissions')
        .insert(submissionData)
        .select()
        .single();

      if (insertError) throw insertError;

      const webhookPayload = {
        submission_id: submissionRecord.id,
        product_title: formData.productTitle,
        user_prompt: formData.userPrompt,
        user_email: user.email || '',
        template_style: formData.templateStyle,
        image_base64: imageBase64,
      };

      const webhookUrl = 'https://vidioai1.app.n8n.cloud/webhook/e22c9ad2-6395-4e39-9cdc-bd3dc1b9e725';

      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!webhookResponse.ok) {
        console.warn('Webhook response:', webhookResponse.status);
      }

      setFormData({
        productTitle: '',
        userPrompt: '',
        templateStyle: 'modern',
      });
      setImagePreview('');
      setImageBase64('');
      setShowGenerator(false);
      setActiveTab('submissions');
      await fetchSubmissions();
    } catch (err) {
      console.error('Error submitting:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to submit. Please try again.');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteSubmission = async () => {
    if (!deleteConfirmation.submissionId) return;

    setDeleting(true);
    try {
      const { error } = await supabase
        .from('submissions')
        .delete()
        .eq('id', deleteConfirmation.submissionId);

      if (error) throw error;

      setDeleteConfirmation({ show: false, submissionId: '', productTitle: '' });
      await fetchSubmissions();
    } catch (err) {
      console.error('Error deleting submission:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to delete submission. Please try again.');
      }
    } finally {
      setDeleting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'processing':
        return <Loader2 className="w-5 h-5 text-cyan-400 animate-spin" />;
      case 'failed':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Clock className="w-5 h-5 text-yellow-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-400 bg-green-500/20';
      case 'processing':
        return 'text-cyan-400 bg-cyan-500/20';
      case 'failed':
        return 'text-red-400 bg-red-500/20';
      default:
        return 'text-yellow-400 bg-yellow-500/20';
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900 pt-24 pb-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            Welcome back, {profile?.full_name || 'Creator'}!
          </h1>
          <p className="text-gray-400">
            Your subscription: <span className="text-cyan-400 font-semibold capitalize">{profile?.subscription_tier}</span>
          </p>
        </div>

        <div className="mb-8">
          <SubscriptionManager />
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <button
            onClick={() => {
              setActiveTab('form');
              setShowGenerator(!showGenerator);
            }}
            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${
              activeTab === 'form' && showGenerator
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            <Sparkles className="w-5 h-5" />
            Create New Submission
          </button>
          <button
            onClick={() => {
              setActiveTab('submissions');
              setShowGenerator(false);
            }}
            className={`px-6 py-3 rounded-xl font-bold transition-all ${
              activeTab === 'submissions'
                ? 'bg-gradient-to-r from-cyan-500 to-purple-600 text-white shadow-lg shadow-cyan-500/50'
                : 'bg-slate-800 text-white hover:bg-slate-700'
            }`}
          >
            View Submissions
          </button>
        </div>

        {activeTab === 'form' && showGenerator && (
          <div className="mb-12 bg-slate-800/50 backdrop-blur-sm border border-cyan-500/20 rounded-2xl p-8">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <Upload className="w-6 h-6 text-cyan-400" />
              Create New Submission
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Product Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.productTitle}
                  onChange={(e) => setFormData({ ...formData, productTitle: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors"
                  placeholder="Your product name"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Description / Prompt <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={formData.userPrompt}
                  onChange={(e) => setFormData({ ...formData, userPrompt: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500 transition-colors h-32 resize-none"
                  placeholder="Describe what you want in the video..."
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Upload Image
                  </label>
                  <div className="relative">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      id="image-upload"
                    />
                    <label
                      htmlFor="image-upload"
                      className="flex items-center justify-center gap-2 w-full px-4 py-8 bg-slate-900 border-2 border-dashed border-slate-600 rounded-xl cursor-pointer hover:border-cyan-500/50 transition-colors"
                    >
                      <ImageIcon className="w-6 h-6 text-gray-400" />
                      <span className="text-gray-400">Click to upload image</span>
                    </label>
                  </div>
                  {imagePreview && (
                    <div className="mt-3 relative">
                      <img src={imagePreview} alt="Preview" className="w-full h-32 object-cover rounded-xl" />
                      <button
                        type="button"
                        onClick={() => {
                          setImagePreview('');
                          setImageBase64('');
                          const input = document.getElementById('image-upload') as HTMLInputElement;
                          if (input) input.value = '';
                        }}
                        className="mt-2 w-full py-2 bg-red-500/20 text-red-400 rounded-lg hover:bg-red-500/30 transition-colors text-sm"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Template Style <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.templateStyle}
                    onChange={(e) => setFormData({ ...formData, templateStyle: e.target.value })}
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white focus:outline-none focus:border-cyan-500 transition-colors"
                    required
                  >
                    <option value="Product Ad">Product Ad</option>
                    <option value="Social Media Reel">Social Media Reel</option>
                    <option value="Lifestyle">Lifestyle</option>
                    <option value="Corporate">Corporate</option>
                    <option value="Spokesperson">Spokesperson</option>
                    <option value="Cinematic">Cinematic</option>
                  </select>
                </div>
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-3">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              <button
                type="submit"
                disabled={generating}
                className="w-full py-4 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {generating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Upload className="w-5 h-5" />
                    Submit for Processing
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'submissions' && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-6">Your Submissions</h2>

            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-center py-12 bg-slate-800/50 rounded-2xl border border-slate-700">
                <Upload className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400 text-lg mb-4">No submissions yet</p>
                <button
                  onClick={() => {
                    setActiveTab('form');
                    setShowGenerator(true);
                  }}
                  className="inline-block px-6 py-3 bg-gradient-to-r from-cyan-500 to-purple-600 text-white font-bold rounded-xl hover:shadow-lg hover:shadow-cyan-500/50 transition-all"
                >
                  Create Your First Submission
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {submissions.map((submission) => (
                  <div
                    key={submission.id}
                    className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-cyan-500/30 transition-all"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2 justify-between">
                          <div className="flex items-center gap-3">
                            <h3 className="text-xl font-bold text-white">{submission.product_title}</h3>
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700">
                              {getStatusIcon(submission.status)}
                              <span className={`text-xs font-medium ${getStatusColor(submission.status).split(' ')[0]}`}>
                                {submission.status}
                              </span>
                            </div>
                          </div>
                          {submission.status === 'pending' && (
                            <button
                              onClick={() =>
                                setDeleteConfirmation({
                                  show: true,
                                  submissionId: submission.id,
                                  productTitle: submission.product_title,
                                })
                              }
                              className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors flex-shrink-0"
                              title="Delete submission"
                            >
                              <Trash2 className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                        <p className="text-gray-400 text-sm mb-3 line-clamp-2">{submission.user_prompt}</p>
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                          <div>
                            <span className="text-gray-400">Template:</span> {submission.template_style}
                          </div>
                          <div>
                            <span className="text-gray-400">Submitted:</span> {new Date(submission.created_at).toLocaleDateString()} at {new Date(submission.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                        {submission.status === 'pending' && <ProgressBar duration={180000} />}
                        {submission.error_message && (
                          <div className="mt-3 p-3 bg-red-500/10 border border-red-500/30 rounded-lg">
                            <p className="text-red-400 text-sm">{submission.error_message}</p>
                          </div>
                        )}
                      </div>
                      {submission.image_base64 && (
                        <div className="flex-shrink-0">
                          <img
                            src={submission.image_base64}
                            alt={submission.product_title}
                            className="w-24 h-24 object-cover rounded-lg border border-slate-600"
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <CompletionModal
        isOpen={showCompletionModal}
        onClose={() => setShowCompletionModal(false)}
        productTitle={completedSubmission?.product_title || ''}
      />

      <ConfirmDeleteModal
        isOpen={deleteConfirmation.show}
        onConfirm={handleDeleteSubmission}
        onCancel={() => setDeleteConfirmation({ show: false, submissionId: '', productTitle: '' })}
        isLoading={deleting}
        productTitle={deleteConfirmation.productTitle}
      />
    </div>
  );
};
