'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Calendar, MapPin, Building2, Clock, User, AlertCircle, MessageSquare, Lock, Send, CheckCircle, XCircle, PlayCircle, Paperclip, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { StatusBadge, PriorityBadge } from '@/components/dashboard/StatusBadge';
import { format, formatDistanceToNow } from 'date-fns';
import { parseRequestIdFromSlug } from '@/lib/utils/slug';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { useDropzone } from 'react-dropzone';
import { createClient } from '@/lib/supabase/client';
import { validateFile } from '@/lib/validations/request.schema';

export function RequestDetailsView({ slug, role }: { slug: string; role: 'student' | 'maintenance_officer' | 'admin' }) {
  const router = useRouter();
  const supabase = createClient();
  const [request, setRequest] = useState<any | null>(null);
  const [comments, setComments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Commenting State
  const [newComment, setNewComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [isPosting, setIsPosting] = useState(false);
  
  // Upload State
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; url: string }[]>([]);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  // Reject Modal State
  const [isRejectModalOpen, setIsRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const id = parseRequestIdFromSlug(slug);

  useEffect(() => {
    fetchData();
  }, [slug]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch request details
      const res = await fetch(`/api/requests/${id}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to fetch');
      setRequest(json.data);

      // Fetch comments
      const commentsRes = await fetch(`/api/requests/${id}/comments`);
      const commentsJson = await commentsRes.json();
      if (commentsRes.ok) {
        setComments(commentsJson.data);
      }
    } catch (err: any) {
      toast.error(err.message || 'Request not found');
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (status: string, remarks?: string) => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status, remarks }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);

      toast.success(`Task marked as ${status.replace('_', ' ')}`);
      if (status === 'rejected') setIsRejectModalOpen(false);
      fetchData(); // Refresh to get new timeline and status
    } catch (err: any) {
      toast.error(err.message || 'Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

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

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    onDropRejected,
    accept: { 'image/*': [], 'application/pdf': [] },
    maxFiles: 5,
    disabled: uploadedFiles.length >= 5 || uploadingFiles,
  });

  const handlePostComment = async () => {
    if (!newComment.trim() && uploadedFiles.length === 0) return;
    setIsPosting(true);
    try {
      const res = await fetch(`/api/requests/${id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          content: newComment, 
          is_internal: isInternal,
          evidence_urls: uploadedFiles.map(f => f.url)
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      
      setNewComment('');
      setIsInternal(false);
      setUploadedFiles([]);
      setComments((prev) => [...prev, json.data]);
      toast.success('Message posted');
    } catch (err: any) {
      toast.error(err.message || 'Failed to post message');
    } finally {
      setIsPosting(false);
    }
  };



  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-4 border-brand-coral border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!request) {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <h2 className="text-xl font-bold text-brand-navy">Request Not Found</h2>
        <p className="text-brand-gray mt-2">The request you are looking for does not exist or you don't have access to it.</p>
        <Button className="mt-6" onClick={() => router.push(`/${role === 'admin' ? 'admin/requests' : `${role}/requests`}`)}>
          Back to Requests
        </Button>
      </div>
    );
  }

  const requester = request.profiles;
  const assignment = Array.isArray(request.assignments) ? request.assignments[0] : request.assignments;
  const isAssignedToMe = role === 'maintenance_officer' && assignment?.officer_id; // RLS already protects access

  return (
    <div className="animate-fade-in max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-y-4">
        <Button variant="ghost" className="-ml-2 text-brand-gray hover:text-brand-navy shrink-0" onClick={() => router.back()}>
          <ChevronLeft className="w-4 h-4 mr-1" />
          Back
        </Button>

        {/* Officer Action Controls */}
        {role === 'maintenance_officer' && request.status === 'assigned' && (
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto mt-2 sm:mt-0">
            <Button 
              variant="outline" 
              className="flex-1 sm:flex-none border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
              onClick={() => setIsRejectModalOpen(true)}
            >
              <XCircle className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Reject Task</span>
              <span className="sm:hidden ml-1">Reject</span>
            </Button>
            <Button 
              className="flex-1 sm:flex-none bg-brand-coral hover:bg-brand-coral-hover text-white"
              onClick={() => updateStatus('in_progress', 'Officer accepted the task and is working on it.')}
              disabled={isProcessing}
            >
              <PlayCircle className="w-4 h-4 sm:mr-2 shrink-0" />
              <span className="hidden sm:inline">Accept & Start</span>
              <span className="sm:hidden ml-1">Accept</span>
            </Button>
          </div>
        )}
        
        {role === 'maintenance_officer' && request.status === 'in_progress' && (
          <div className="w-full sm:w-auto mt-2 sm:mt-0">
            <Button 
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              onClick={() => updateStatus('completed', 'Task has been completed by the officer.')}
              disabled={isProcessing}
            >
              <CheckCircle className="w-4 h-4 mr-2 shrink-0" />
              Mark as Completed
            </Button>
          </div>
        )}
      </div>

      <div className="bg-white rounded-xl border border-border shadow-card overflow-hidden">
        {/* Title & Badges */}
        <div className="p-6 sm:p-8 border-b border-border">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 mb-4">
            <h1 className="text-2xl font-bold text-brand-navy">{request.title}</h1>
            <div className="flex items-center gap-2 shrink-0">
              <PriorityBadge priority={request.priority} />
              <StatusBadge status={request.status} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-sm text-brand-gray">
            <div className="flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              <span>{format(new Date(request.created_at), 'MMM d, yyyy h:mm a')}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="w-4 h-4" />
              <span>{request.location}</span>
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2 space-y-8">
            <section>
              <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider mb-3">Description</h3>
              <p className="text-brand-gray whitespace-pre-wrap leading-relaxed mb-4">
                {request.description}
              </p>
              
              {/* Request Initial Evidence */}
              {request.evidence_urls && request.evidence_urls.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {request.evidence_urls.map((url: string, i: number) => (
                    <button key={i} onClick={() => setPreviewImage(url)} type="button" className="block w-24 h-24 rounded-lg border border-border overflow-hidden hover:opacity-80 transition-opacity">
                      <img src={url} alt={`Evidence ${i + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </section>

            {/* Communication Hub */}
            <section className="pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-4">
                <MessageSquare className="w-5 h-5 text-brand-navy" />
                <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider">Communication Hub</h3>
              </div>
              
              <div className="space-y-4 mb-6">
                {comments.length === 0 ? (
                  <p className="text-sm text-brand-gray italic">No messages yet. Start the conversation!</p>
                ) : (
                  comments.map(comment => (
                    <div key={comment.id} className={`p-4 rounded-xl border ${comment.is_internal ? 'bg-amber-50 border-amber-200' : 'bg-brand-canvas/50 border-border'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-brand-navy">{comment.profiles?.full_name}</span>
                          <span className="text-xs text-brand-gray capitalize px-2 py-0.5 bg-white rounded-full border border-border">
                            {comment.profiles?.role_id === 1 ? 'Student' : comment.profiles?.role_id === 2 ? 'Officer' : 'Admin'}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {comment.is_internal && <Lock className="w-3 h-3 text-amber-600" />}
                          <span className="text-xs text-brand-gray">{formatDistanceToNow(new Date(comment.created_at), { addSuffix: true })}</span>
                        </div>
                      </div>
                      <p className="text-sm text-brand-navy whitespace-pre-wrap mb-2">{comment.content}</p>
                      {comment.evidence_urls && comment.evidence_urls.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-2">
                          {comment.evidence_urls.map((url: string, i: number) => (
                            <button key={i} onClick={() => setPreviewImage(url)} type="button" className="block w-16 h-16 rounded border border-border overflow-hidden hover:opacity-80 transition-opacity">
                              <img src={url} alt={`Attachment ${i + 1}`} className="w-full h-full object-cover" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Comment Input */}
              <div className="space-y-3 bg-brand-canvas/50 p-4 rounded-xl border border-border">
                <Textarea 
                  placeholder="Type a message..." 
                  className="resize-none min-h-[100px] bg-white"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                
                {/* Uploaded Files Preview */}
                {uploadedFiles.length > 0 && (
                  <div className="flex flex-wrap gap-2 pt-2">
                    {uploadedFiles.map((f, i) => (
                      <div key={i} className="relative group shrink-0">
                        <button type="button" onClick={() => setPreviewImage(f.url)}>
                          <img src={f.url} alt="upload" className="w-16 h-16 rounded-lg object-cover border border-border shadow-sm hover:opacity-80 transition-opacity" />
                        </button>
                        <button onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))} className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
                  <div className="flex flex-wrap items-center gap-4">
                    <div {...getRootProps()}>
                      <input {...getInputProps()} />
                      <Button type="button" variant="outline" size="sm" className="h-9 gap-2 text-brand-gray" disabled={uploadedFiles.length >= 5 || uploadingFiles}>
                        {uploadingFiles ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Paperclip className="w-4 h-4 shrink-0" />}
                        <span>Attach ({uploadedFiles.length}/5)</span>
                      </Button>
                    </div>

                    {(role === 'maintenance_officer' || role === 'admin') && (
                      <label className="flex items-center gap-2 text-sm text-brand-gray cursor-pointer whitespace-nowrap">
                        <input 
                          type="checkbox" 
                          checked={isInternal} 
                          onChange={(e) => setIsInternal(e.target.checked)}
                          className="rounded border-border text-brand-coral focus:ring-brand-coral"
                        />
                        <Lock className="w-3.5 h-3.5 shrink-0" />
                        Internal Note
                      </label>
                    )}
                  </div>

                  <Button 
                    onClick={handlePostComment} 
                    disabled={isPosting || (!newComment.trim() && uploadedFiles.length === 0)}
                    className={`w-full sm:w-auto ${isInternal ? 'bg-amber-500 hover:bg-amber-600' : 'bg-brand-coral hover:bg-brand-coral-hover'}`}
                  >
                    <Send className="w-4 h-4 mr-2 shrink-0" />
                    {isInternal ? 'Post Note' : 'Send'}
                  </Button>
                </div>
              </div>
            </section>

            {/* Timeline */}
            <section className="pt-6 border-t border-border">
              <h3 className="text-sm font-semibold text-brand-navy uppercase tracking-wider mb-4">Timeline</h3>
              <div className="space-y-4">
                {request.status_logs?.map((log: { id: string | number; new_status: string; created_at: string; profiles?: { full_name: string }; remarks?: string }, idx: number) => (
                  <div key={log.id} className="flex gap-4">
                    <div className="flex flex-col items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-brand-coral shrink-0 mt-1.5" />
                      {idx !== request.status_logs.length - 1 && (
                        <div className="w-px h-full bg-border mt-2" />
                      )}
                    </div>
                    <div className="pb-4">
                      <p className="text-sm font-medium text-brand-navy">
                        {log.new_status === 'pending' ? 'Request Created' : `Status changed to ${log.new_status.replace('_', ' ')}`}
                      </p>
                      <p className="text-xs text-brand-gray mt-1">
                        {formatDistanceToNow(new Date(log.created_at), { addSuffix: true })}
                        {log.profiles?.full_name && ` by ${log.profiles.full_name}`}
                      </p>
                      {log.remarks && (
                        <p className="text-sm text-brand-gray mt-2 bg-brand-canvas p-3 rounded-lg border border-border">
                          {log.remarks}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <div className="space-y-6">
            {/* Requester Info */}
            <div className="bg-brand-canvas/50 rounded-xl p-5 border border-border">
              <h3 className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-4">Requester Details</h3>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-brand-navy text-white flex items-center justify-center text-xs font-bold shrink-0">
                    {requester?.full_name?.substring(0, 2).toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-brand-navy truncate">{requester?.full_name}</p>
                    <p className="text-xs text-brand-gray truncate">{requester?.email}</p>
                  </div>
                </div>
                {requester?.department && (
                  <div className="flex items-center gap-2 text-sm text-brand-gray mt-2">
                    <Building2 className="w-4 h-4" />
                    <span className="truncate">{requester.department}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Assignment Info */}
            <div className="bg-brand-canvas/50 rounded-xl p-5 border border-border">
              <h3 className="text-xs font-semibold text-brand-gray uppercase tracking-wider mb-4">Assigned Officer</h3>
              {assignment ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-brand-coral text-white flex items-center justify-center text-xs font-bold shrink-0">
                      {assignment.profiles?.full_name?.substring(0, 2).toUpperCase() || 'O'}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-brand-navy truncate">{assignment.profiles?.full_name}</p>
                      <p className="text-xs text-brand-gray truncate">{assignment.profiles?.email}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-brand-gray mt-2">
                    <Calendar className="w-4 h-4" />
                    <span>Assigned {formatDistanceToNow(new Date(assignment.assigned_at), { addSuffix: true })}</span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-brand-gray text-center py-2">
                  No officer assigned yet
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Task Modal */}
      <Dialog open={isRejectModalOpen} onOpenChange={setIsRejectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Task Assignment</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <p className="text-sm text-brand-gray">
              Please provide a reason for rejecting this task. The admin will be notified and can reassign it.
            </p>
            <Textarea 
              placeholder="e.g. I do not have the required tools for this job..."
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              className="resize-none min-h-[100px]"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setIsRejectModalOpen(false)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={() => updateStatus('rejected', rejectReason)}
              disabled={!rejectReason.trim() || isProcessing}
            >
              {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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
