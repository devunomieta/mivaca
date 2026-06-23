'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { toast } from 'sonner';
import { Loader2, Upload, X, ArrowLeft, ArrowRight, CheckCircle2, Zap, Droplets, Armchair, Wifi, Monitor, Building2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { createClient } from '@/lib/supabase/client';
import { validateFile } from '@/lib/validations/request.schema';
import type { Metadata } from 'next';

const STEPS = ['Category', 'Details', 'Evidence', 'Review'];

const CATEGORIES = [
  { id: 1, name: 'Electrical', icon: Zap, description: 'Power, wiring, sockets' },
  { id: 2, name: 'Plumbing', icon: Droplets, description: 'Pipes, drains, water supply' },
  { id: 3, name: 'Furniture', icon: Armchair, description: 'Chairs, tables, equipment' },
  { id: 4, name: 'Internet / IT', icon: Wifi, description: 'Network, Wi-Fi, routers' },
  { id: 5, name: 'Classroom Equipment', icon: Monitor, description: 'Projectors, ACs, fans' },
  { id: 6, name: 'Hostel Maintenance', icon: Building2, description: 'Room repairs, sanitation' },
];

const PRIORITIES = [
  { value: 'low', label: 'Low', desc: 'Non-urgent, can wait', color: 'border-emerald-300 bg-emerald-50 text-emerald-700' },
  { value: 'medium', label: 'Medium', desc: 'Needs attention soon', color: 'border-amber-300 bg-amber-50 text-amber-700' },
  { value: 'high', label: 'High', desc: 'Affects learning activities', color: 'border-orange-300 bg-orange-50 text-orange-700' },
  { value: 'critical', label: 'Critical', desc: 'Immediate safety risk', color: 'border-red-300 bg-red-50 text-red-700' },
];

export default function NewRequestPage() {
  const router = useRouter();
  const supabase = createClient();
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);

  const [form, setForm] = useState({
    category_id: 0,
    title: '',
    description: '',
    location: '',
    priority: '' as string,
    evidence_urls: [] as string[],
  });
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length + uploadedFiles.length > 5) {
      toast.error(`You can only attach up to 5 files total. You have ${uploadedFiles.length} attached.`);
      return; // Stop the upload entirely
    }
    for (const file of acceptedFiles) {
      const err = validateFile(file);
      if (err) { toast.error(err); return; }
    }

    setUploadingFiles(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast.error('Please sign in again.'); setUploadingFiles(false); return; }

    const uploaded: { name: string; url: string }[] = [];
    for (const file of acceptedFiles) {
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-z0-9.]/gi, '_')}`;
      const { error } = await supabase.storage.from('request-evidence').upload(path, file);
      if (error) { toast.error(`Failed to upload ${file.name}`); continue; }
      const { data: { publicUrl } } = supabase.storage.from('request-evidence').getPublicUrl(path);
      uploaded.push({ name: file.name, url: publicUrl });
    }

    setUploadedFiles((prev) => [...prev, ...uploaded]);
    setForm((prev) => ({
      ...prev,
      evidence_urls: [...prev.evidence_urls, ...uploaded.map((f) => f.url)],
    }));
    setUploadingFiles(false);
    if (uploaded.length > 0) toast.success(`${uploaded.length} file(s) uploaded`);
  }, [uploadedFiles, supabase]);

  const onDropRejected = useCallback((fileRejections: any[]) => {
    if (fileRejections.length > 5) {
       toast.error('You cannot select more than 5 files at a time.');
    } else {
       toast.error('Some files were rejected. Ensure they are images or PDFs under 5MB.');
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 5,
    disabled: uploadedFiles.length >= 5,
  });

  function validate() {
    const errs: Record<string, string> = {};
    if (step === 0 && !form.category_id) errs.category_id = 'Please select a category';
    if (step === 1) {
      if (form.title.length < 5) errs.title = 'Title must be at least 5 characters';
      if (form.description.length < 20) errs.description = 'Description must be at least 20 characters';
      if (form.location.length < 3) errs.location = 'Location is required';
      if (!form.priority) errs.priority = 'Please select a priority level';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validate()) setStep((s) => Math.min(s + 1, 3));
  }
  function back() { setStep((s) => Math.max(s - 1, 0)); }

  async function handleSubmit() {
    setSubmitting(true);
    try {
      const res = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          category_id: Number(form.category_id),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      toast.success('Request submitted successfully! You will receive a confirmation email shortly.');
      router.push('/student');
    } catch (err: any) {
      toast.error(err.message ?? 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }

  const selectedCategory = CATEGORIES.find((c) => c.id === form.category_id);

  return (
    <div className="max-w-2xl mx-auto animate-fade-in">
      <div className="page-header">
        <div>
          <h1 className="page-title">New Maintenance Request</h1>
          <p className="text-brand-gray text-sm">Step {step + 1} of {STEPS.length} — {STEPS[step]}</p>
        </div>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= step ? 'bg-brand-coral' : 'bg-border'}`} />
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card p-8">
        {/* Step 0 — Category */}
        {step === 0 && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-semibold text-brand-navy mb-1">Select a Category</h2>
            <p className="text-brand-gray text-sm mb-6">What type of maintenance issue are you reporting?</p>
            {errors.category_id && <p className="text-red-600 text-sm mb-4">{errors.category_id}</p>}
            <div className="grid grid-cols-2 gap-3">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const selected = form.category_id === cat.id;
                return (
                  <button
                    key={cat.id}
                    id={`cat-${cat.id}`}
                    type="button"
                    onClick={() => setForm((p) => ({ ...p, category_id: cat.id }))}
                    className={`flex items-start gap-3 p-4 rounded-xl border-2 text-left transition-all duration-200 hover:border-brand-coral/50 ${
                      selected ? 'border-brand-coral bg-brand-coral/5' : 'border-border bg-brand-canvas/50'
                    }`}
                  >
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${selected ? 'bg-brand-coral' : 'bg-border'}`}>
                      <Icon className={`w-5 h-5 ${selected ? 'text-white' : 'text-brand-gray'}`} strokeWidth={1.5} />
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${selected ? 'text-brand-coral' : 'text-brand-navy'}`}>{cat.name}</p>
                      <p className="text-xs text-brand-gray mt-0.5">{cat.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 1 — Details */}
        {step === 1 && (
          <div className="animate-slide-up space-y-5">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy mb-1">Request Details</h2>
              <p className="text-brand-gray text-sm">Describe the issue clearly so our team can address it effectively.</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="title">Title <span className="text-red-500">*</span></Label>
              <Input id="title" value={form.title} onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                placeholder="e.g. Faulty Power Socket in Computer Lab 3" className="h-11" />
              {errors.title && <p className="text-red-500 text-xs">{errors.title}</p>}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="description">Description <span className="text-red-500">*</span></Label>
              <Textarea id="description" value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                placeholder="Describe the problem in detail. Include when it started, how it affects you, and any other relevant information."
                className="min-h-[120px] resize-none" />
              <div className="flex justify-between">
                {errors.description ? <p className="text-red-500 text-xs">{errors.description}</p> : <span />}
                <p className="text-xs text-brand-gray">{form.description.length}/2000</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="location">Location <span className="text-red-500">*</span></Label>
              <Input id="location" value={form.location} onChange={(e) => setForm((p) => ({ ...p, location: e.target.value }))}
                placeholder="e.g. Computer Lab 3, Block A, Ground Floor" className="h-11" />
              {errors.location && <p className="text-red-500 text-xs">{errors.location}</p>}
            </div>

            <div className="space-y-2">
              <Label>Priority Level <span className="text-red-500">*</span></Label>
              {errors.priority && <p className="text-red-500 text-xs">{errors.priority}</p>}
              <div className="grid grid-cols-2 gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p.value} id={`priority-${p.value}`} type="button"
                    onClick={() => setForm((prev) => ({ ...prev, priority: p.value }))}
                    className={`flex flex-col p-3 rounded-lg border-2 text-left transition-all duration-200 ${
                      form.priority === p.value ? `${p.color} border-current` : 'border-border hover:border-brand-coral/40'
                    }`}>
                    <span className="text-sm font-semibold">{p.label}</span>
                    <span className="text-xs mt-0.5 opacity-80">{p.desc}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2 — Evidence Upload */}
        {step === 2 && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-semibold text-brand-navy mb-1">Upload Evidence</h2>
            <p className="text-brand-gray text-sm mb-6">Upload photos or documents showing the issue. Max 5 files, 5MB each. This step is optional.</p>

            <div {...getRootProps()} id="file-dropzone"
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
                isDragActive ? 'border-brand-coral bg-brand-coral/5' : 'border-border hover:border-brand-coral/50 hover:bg-brand-canvas'
              } ${uploadedFiles.length >= 5 ? 'opacity-50 cursor-not-allowed' : ''}`}>
              <input {...getInputProps()} id="file-input" />
              {uploadingFiles ? (
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-8 h-8 text-brand-coral animate-spin" />
                  <p className="text-sm text-brand-gray">Uploading...</p>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-2">
                  <Upload className="w-8 h-8 text-brand-gray/50" />
                  <p className="text-sm font-medium text-brand-navy">
                    {isDragActive ? 'Drop files here' : 'Drag & drop files, or click to select'}
                  </p>
                  <p className="text-xs text-brand-gray">Images (JPG, PNG, WebP) or PDF — up to 5MB each</p>
                </div>
              )}
            </div>

            {uploadedFiles.length > 0 && (
              <ul className="mt-4 space-y-2">
                {uploadedFiles.map((f, i) => (
                  <li key={i} className="flex items-center justify-between bg-brand-canvas rounded-lg px-4 py-2.5 border border-border">
                    <span className="text-sm text-brand-navy truncate flex-1">{f.name}</span>
                    <div className="flex items-center gap-1 ml-3 flex-shrink-0">
                      <button type="button" onClick={() => setPreviewImage(f.url)} className="p-1.5 text-brand-gray hover:text-brand-navy transition-colors rounded-md hover:bg-black/5">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button type="button"
                        onClick={() => {
                          setUploadedFiles((prev) => prev.filter((_, idx) => idx !== i));
                          setForm((prev) => ({ ...prev, evidence_urls: prev.evidence_urls.filter((_, idx) => idx !== i) }));
                        }}
                        className="p-1.5 text-brand-gray hover:text-red-500 transition-colors rounded-md hover:bg-red-50">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Step 3 — Review */}
        {step === 3 && (
          <div className="animate-slide-up">
            <h2 className="text-lg font-semibold text-brand-navy mb-1">Review & Submit</h2>
            <p className="text-brand-gray text-sm mb-6">Please review your request before submitting.</p>

            <div className="bg-brand-canvas rounded-xl border border-border divide-y divide-border overflow-hidden">
              {[
                { label: 'Category', value: selectedCategory?.name ?? '' },
                { label: 'Title', value: form.title },
                { label: 'Location', value: form.location },
                { label: 'Priority', value: form.priority.charAt(0).toUpperCase() + form.priority.slice(1) },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-start px-4 py-3">
                  <span className="text-xs font-semibold text-brand-gray w-24 pt-0.5 flex-shrink-0">{label}</span>
                  <span className="text-sm text-brand-navy flex-1">{value}</span>
                </div>
              ))}
              <div className="flex items-start px-4 py-3">
                <span className="text-xs font-semibold text-brand-gray w-24 pt-0.5 flex-shrink-0">Description</span>
                <span className="text-sm text-brand-navy flex-1 leading-relaxed">{form.description}</span>
              </div>
              <div className="flex items-start px-4 py-3">
                <span className="text-xs font-semibold text-brand-gray w-24 pt-0.5 flex-shrink-0">Evidence</span>
                <span className="text-sm text-brand-navy">{uploadedFiles.length} file(s) attached</span>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border">
          <Button type="button" variant="outline" onClick={back} disabled={step === 0} className="gap-2">
            <ArrowLeft className="w-4 h-4" /> Back
          </Button>

          {step < 3 ? (
            <Button id="btn-next-step" type="button" onClick={next}
              className="bg-brand-coral hover:bg-brand-coral-hover text-white gap-2">
              Next <ArrowRight className="w-4 h-4" />
            </Button>
          ) : (
            <Button id="btn-submit-request" type="button" onClick={handleSubmit} disabled={submitting}
              className="bg-brand-coral hover:bg-brand-coral-hover text-white gap-2">
              {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Submitting...</> : <><CheckCircle2 className="w-4 h-4" />Submit Request</>}
            </Button>
          )}
        </div>
      </div>

      {/* Image Preview Modal */}
      <Dialog open={!!previewImage} onOpenChange={() => setPreviewImage(null)}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/5 border-none shadow-none">
          {previewImage?.endsWith('.pdf') ? (
            <iframe src={previewImage} className="w-full h-[80vh] rounded-xl" />
          ) : (
            <img src={previewImage || ''} alt="Preview" className="w-full h-auto max-h-[85vh] object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
