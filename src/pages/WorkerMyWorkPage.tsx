import React, { useMemo, useRef, useState } from 'react';
import {
  AlertCircle,
  Camera,
  CheckCircle2,
  Clock,
  Edit3,
  ImagePlus,
  PlusCircle,
  Send,
  ShieldAlert,
  Trash2,
  X,
} from 'lucide-react';
import { PhotoTile } from '../components/PhotoTile';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { Modal } from '../components/ui/Modal';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedCategoryName } from '../i18n';
import { PhotoMedia, PortfolioItem, WorkProgress } from '../types';
import { formatTimelineDate } from '../utils/id';
import { MAX_PHOTOS_PER_POST, processSafeImageFiles } from '../utils/photoSafety';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

const PROGRESS_OPTIONS: Array<{
  value: WorkProgress;
  toneClass: string;
}> = [
  {
    value: 'Started',
    toneClass: 'bg-[#EFF6FF] text-[#1769E0] border-[#BFDBFE]',
  },
  {
    value: 'Half done',
    toneClass: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A]',
  },
  {
    value: 'Almost done',
    toneClass: 'bg-[#ECFEFF] text-[#0E7490] border-[#A5F3FC]',
  },
  {
    value: 'Finished',
    toneClass: 'bg-[#F0FDF4] text-[#16865B] border-[#BBF7D0]',
  },
];

export const WorkerMyWorkPage: React.FC = () => {
  const { state, dispatch, activeWorker, storageError } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();
  const worker = activeWorker || state.workers[0];

  const [activeTab, setActiveTab] = useState<'updates' | 'gallery'>('updates');

  // Daily Work Update form state
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [updatePhotos, setUpdatePhotos] = useState<PhotoMedia[]>([]);
  const [updateNote, setUpdateNote] = useState('');
  const [selectedJobId, setSelectedJobId] = useState<string>('general');
  const [progress, setProgress] = useState<WorkProgress>('Started');
  const [updateErrors, setUpdateErrors] = useState<string[]>([]);
  const [updateSuccess, setUpdateSuccess] = useState('');
  const [processingUpdatePhotos, setProcessingUpdatePhotos] = useState(false);
  const updateFileInputRef = useRef<HTMLInputElement>(null);

  // Portfolio ("Add to My Work") form state
  const [showPortfolioForm, setShowPortfolioForm] = useState(false);
  const [portfolioPhotos, setPortfolioPhotos] = useState<PhotoMedia[]>([]);
  const [portfolioCaption, setPortfolioCaption] = useState('');
  const [portfolioCategoryId, setPortfolioCategoryId] = useState(worker.categoryId);
  const [portfolioErrors, setPortfolioErrors] = useState<string[]>([]);
  const [portfolioSuccess, setPortfolioSuccess] = useState('');
  const [processingPortfolioPhotos, setProcessingPortfolioPhotos] = useState(false);
  const portfolioFileInputRef = useRef<HTMLInputElement>(null);

  // Edit caption state
  const [editingItem, setEditingItem] = useState<PortfolioItem | null>(null);
  const [editingCaption, setEditingCaption] = useState('');
  const [editingCaptionError, setEditingCaptionError] = useState('');

  // Delete confirmation state
  const [deleteUpdateId, setDeleteUpdateId] = useState<string | null>(null);
  const [deletePortfolioId, setDeletePortfolioId] = useState<string | null>(null);

  // Lightbox state
  const [lightboxPhoto, setLightboxPhoto] = useState<{
    photo: PhotoMedia;
    caption?: string;
  } | null>(null);

  const workerConfirmedBookings = useMemo(() => {
    return state.bookings.filter((b) => b.workerId === worker.id);
  }, [state.bookings, worker.id]);

  const workerUpdates = useMemo(() => {
    return state.workUpdates
      .filter((u) => u.workerId === worker.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [state.workUpdates, worker.id]);

  const workerPortfolio = useMemo(() => {
    return state.portfolioItems
      .filter((p) => p.workerId === worker.id)
      .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt));
  }, [state.portfolioItems, worker.id]);

  const handleUpdateFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setProcessingUpdatePhotos(true);
    setUpdateErrors([]);
    const result = await processSafeImageFiles(files, {
      maxWidth: 1000,
      maxCount: MAX_PHOTOS_PER_POST,
      existingCount: updatePhotos.length,
      lang,
    });
    setUpdatePhotos((prev) => [...prev, ...result.photos].slice(0, MAX_PHOTOS_PER_POST));
    if (result.errors.length > 0) {
      setUpdateErrors(result.errors);
    }
    setProcessingUpdatePhotos(false);
    e.target.value = '';
  };

  const handlePostUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    const cleanNote = sanitizeText(updateNote, INPUT_LIMITS.UPDATE_NOTE_MAX);
    if (updatePhotos.length === 0) {
      errs.push(t('myWork.errPhotos'));
    }
    if (!cleanNote) {
      errs.push(t('myWork.errNote'));
    }
    if (errs.length > 0) {
      setUpdateErrors(errs);
      return;
    }

    dispatch({
      type: 'ADD_WORK_UPDATE',
      workerId: worker.id,
      jobId: selectedJobId === 'general' ? undefined : selectedJobId,
      photos: updatePhotos,
      note: cleanNote,
      progress,
    });

    setUpdatePhotos([]);
    setUpdateNote('');
    setSelectedJobId('general');
    setProgress('Started');
    setUpdateErrors([]);
    setShowUpdateForm(false);
    setUpdateSuccess(t('myWork.updatePosted'));
  };

  const handlePortfolioFilePick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setProcessingPortfolioPhotos(true);
    setPortfolioErrors([]);
    const result = await processSafeImageFiles(files, {
      maxWidth: 1000,
      maxCount: MAX_PHOTOS_PER_POST,
      existingCount: portfolioPhotos.length,
      lang,
    });
    setPortfolioPhotos((prev) => [...prev, ...result.photos].slice(0, MAX_PHOTOS_PER_POST));
    if (result.errors.length > 0) {
      setPortfolioErrors(result.errors);
    }
    setProcessingPortfolioPhotos(false);
    e.target.value = '';
  };

  const handleSavePortfolio = (e: React.FormEvent) => {
    e.preventDefault();
    const errs: string[] = [];
    const cleanCaption = sanitizeText(portfolioCaption, INPUT_LIMITS.CAPTION_MAX);
    if (portfolioPhotos.length === 0) {
      errs.push(t('myWork.errGalleryPhotos'));
    }
    if (!cleanCaption) {
      errs.push(t('myWork.errGalleryCaption'));
    }
    if (errs.length > 0) {
      setPortfolioErrors(errs);
      return;
    }

    dispatch({
      type: 'ADD_PORTFOLIO_ITEM',
      workerId: worker.id,
      categoryId: portfolioCategoryId,
      caption: cleanCaption,
      photos: portfolioPhotos,
    });

    setPortfolioPhotos([]);
    setPortfolioCaption('');
    setPortfolioCategoryId(worker.categoryId);
    setPortfolioErrors([]);
    setShowPortfolioForm(false);
    setPortfolioSuccess(t('myWork.galleryAdded'));
  };

  const handleSaveCaptionEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    const clean = sanitizeText(editingCaption, INPUT_LIMITS.CAPTION_MAX);
    if (!clean) {
      setEditingCaptionError(t('myWork.errCaptionEmpty'));
      return;
    }
    dispatch({
      type: 'UPDATE_PORTFOLIO_CAPTION',
      itemId: editingItem.id,
      workerId: worker.id,
      caption: clean,
    });
    setEditingItem(null);
    setEditingCaption('');
    setEditingCaptionError('');
  };

  const getJobLabel = (jobId?: string) => {
    if (!jobId) return t('myWork.generalWork');
    const booking = state.bookings.find((b) => b.id === jobId);
    const job = state.jobs.find((j) => j.id === (booking?.jobId || jobId));
    if (!job) return t('status.Confirmed Job');
    return isUrdu && job.titleUr ? job.titleUr : job.title;
  };

  return (
    <div className="space-y-6">
      {/* Header + Big Primary Actions */}
      <section className="rounded-2xl border border-[#E3EAF3] bg-white p-5 shadow-[0_2px_8px_rgba(16,42,67,0.04)] sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
              {t('myWork.title')}
            </h1>
            <p className="mt-1 text-base text-[#62748A]">{t('myWork.subtitle')}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={() => {
                setActiveTab('updates');
                setShowUpdateForm((prev) => !prev);
                setUpdateSuccess('');
              }}
              className="min-h-[52px]"
            >
              <Camera className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('myWork.addUpdateBtn')}</span>
            </Button>

            <Button
              variant="secondary"
              size="lg"
              onClick={() => {
                setActiveTab('gallery');
                setShowPortfolioForm((prev) => !prev);
                setPortfolioSuccess('');
              }}
              className="min-h-[52px]"
            >
              <PlusCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{t('myWork.addToGalleryBtn')}</span>
            </Button>
          </div>
        </div>

        {/* Storage Full Warning if triggered */}
        {storageError && (
          <div
            role="alert"
            className="mt-4 flex items-center gap-3 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-base font-semibold text-[#D64545]"
          >
            <AlertCircle className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{storageError}</span>
          </div>
        )}

        {/* Section Switcher Tabs */}
        <div
          role="tablist"
          aria-label={t('myWork.sectionsAria')}
          className="mt-6 grid grid-cols-2 gap-2 rounded-xl bg-[#F1F5F9] p-1.5 sm:inline-grid sm:w-auto"
        >
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'updates'}
            onClick={() => setActiveTab('updates')}
            className={`min-h-[48px] whitespace-nowrap rounded-lg px-4 text-base font-bold transition-colors cursor-pointer ${
              activeTab === 'updates'
                ? 'bg-white text-[#1769E0] shadow-xs'
                : 'text-[#62748A] hover:text-[#102A43]'
            }`}
          >
            {t('myWork.tabUpdates', { n: workerUpdates.length })}
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'gallery'}
            onClick={() => setActiveTab('gallery')}
            className={`min-h-[48px] whitespace-nowrap rounded-lg px-4 text-base font-bold transition-colors cursor-pointer ${
              activeTab === 'gallery'
                ? 'bg-white text-[#1769E0] shadow-xs'
                : 'text-[#62748A] hover:text-[#102A43]'
            }`}
          >
            {t('myWork.tabPortfolio', { n: workerPortfolio.length })}
          </button>
        </div>
      </section>

      {/* TAB 1: DAILY WORK UPDATES */}
      {activeTab === 'updates' && (
        <div className="space-y-6">
          {updateSuccess && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-base font-semibold text-[#16865B]"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{updateSuccess}</span>
            </div>
          )}

          {/* Add Today's Work Form (One Simple Screen) */}
          {showUpdateForm && (
            <Card className="border-2 border-[#BFDBFE]">
              <form onSubmit={handlePostUpdate} className="space-y-6">
                <div className="flex items-center justify-between gap-3 border-b border-[#E3EAF3] pb-4">
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    {t('myWork.addUpdateBtn')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowUpdateForm(false)}
                    className="inline-flex min-h-[48px] items-center gap-1 rounded-xl border border-[#E3EAF3] px-3 text-sm font-semibold text-[#62748A] hover:text-[#102A43] cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>{t('app.close')}</span>
                  </button>
                </div>

                {/* Step A: 1 to 5 Photos */}
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <label className="text-base font-bold text-[#102A43]">
                      {t('myWork.stepPhotosLabel', { n: updatePhotos.length })}
                    </label>
                    <span className="text-sm text-[#62748A]">
                      {t('myWork.photoFormatHint')}
                    </span>
                  </div>

                  <div className="flex items-start gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm font-medium text-[#92400E]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('post.photoSafetyNote')}</span>
                  </div>

                  <input
                    ref={updateFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handleUpdateFilePick}
                    className="sr-only"
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={processingUpdatePhotos || updatePhotos.length >= MAX_PHOTOS_PER_POST}
                    onClick={() => updateFileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    <span>
                      {processingUpdatePhotos
                        ? t('post.preparingPhotos')
                        : t('myWork.takeOrChoosePhoto')}
                    </span>
                  </Button>

                  {updatePhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {updatePhotos.map((ph) => (
                        <div key={ph.id} className="relative">
                          <PhotoTile photo={ph} className="h-28" />
                          <button
                            type="button"
                            onClick={() =>
                              setUpdatePhotos((prev) => prev.filter((p) => p.id !== ph.id))
                            }
                            aria-label={t('post.removePhoto')}
                            className="absolute end-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#102A43]/80 text-white hover:bg-[#D64545] cursor-pointer"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Step B: Short Note (max 200 chars) */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <label htmlFor="daily-update-note" className="text-base font-bold text-[#102A43]">
                      {t('myWork.stepNoteLabel')}
                    </label>
                    <span className="text-sm text-[#62748A] tabular-nums">
                      {t('post.charCount', {
                        n: updateNote.length,
                        max: INPUT_LIMITS.UPDATE_NOTE_MAX,
                      })}
                    </span>
                  </div>
                  <textarea
                    id="daily-update-note"
                    rows={3}
                    value={updateNote}
                    maxLength={INPUT_LIMITS.UPDATE_NOTE_MAX}
                    onChange={(e) => setUpdateNote(e.target.value)}
                    placeholder={t('myWork.notePlaceholder')}
                    className="w-full rounded-xl border-2 border-[#CBD5E1] bg-white p-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                  />
                </div>

                {/* Step C: Pick which job it belongs to */}
                <div className="space-y-1.5">
                  <label htmlFor="daily-update-job" className="block text-base font-bold text-[#102A43]">
                    {t('myWork.stepJobLabel')}
                  </label>
                  <select
                    id="daily-update-job"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                  >
                    <option value="general">{t('myWork.generalWork')}</option>
                    {workerConfirmedBookings.map((bk) => {
                      const job = state.jobs.find((j) => j.id === bk.jobId);
                      const jobName =
                        (isUrdu && job?.titleUr ? job.titleUr : job?.title) || bk.jobId;
                      return (
                        <option key={bk.id} value={bk.id}>
                          {t('myWork.confirmedJobPrefix', { title: jobName })}
                        </option>
                      );
                    })}
                  </select>
                </div>

                {/* Step D: Work done so far */}
                <div className="space-y-2">
                  <p className="text-base font-bold text-[#102A43]">
                    {t('myWork.stepProgressLabel')}
                  </p>
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                    {PROGRESS_OPTIONS.map((opt) => {
                      const active = progress === opt.value;
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          aria-pressed={active}
                          onClick={() => setProgress(opt.value)}
                          className={`min-h-[54px] rounded-xl border-2 px-3 py-2 text-center transition-colors cursor-pointer ${
                            active
                              ? 'border-[#1769E0] bg-[#EFF6FF] text-[#1769E0]'
                              : 'border-[#E3EAF3] bg-white text-[#172B4D] hover:border-[#1769E0]'
                          }`}
                        >
                          <span className="block text-base font-bold">
                            {t(`progress.${opt.value}` as never)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {updateErrors.length > 0 && (
                  <div
                    role="alert"
                    className="space-y-1 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-base font-semibold text-[#D64545]"
                  >
                    {updateErrors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                {/* Step E: Post Update */}
                <div className="flex flex-wrap gap-3 pt-2">
                  <Button type="submit" variant="primary" size="lg" className="min-h-[52px]">
                    <Send className="h-5 w-5" aria-hidden="true" />
                    <span>{t('myWork.postUpdateBtn')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowUpdateForm(false)}
                  >
                    <span>{t('app.cancel')}</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {/* Updates Timeline (Newest First) */}
          {workerUpdates.length === 0 ? (
            <Card className="py-12 text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
                <Camera className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#102A43]">
                {t('myWork.emptyUpdates')}
              </h2>
              <div className="mt-6 flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowUpdateForm(true)}
                >
                  <Camera className="h-5 w-5" aria-hidden="true" />
                  <span>{t('myWork.addUpdateBtn')}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-4">
              {workerUpdates.map((upd) => {
                const progressStyle =
                  PROGRESS_OPTIONS.find((o) => o.value === upd.progress)?.toneClass ||
                  'bg-[#EFF6FF] text-[#1769E0] border-[#BFDBFE]';
                return (
                  <Card key={upd.id} className="space-y-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="inline-flex items-center gap-1.5 text-base font-bold text-[#102A43]">
                          <Clock className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                          <span>{formatTimelineDate(upd.createdAt, lang)}</span>
                        </span>
                        <span
                          className={`rounded-lg border px-3 py-1 text-sm font-bold ${progressStyle}`}
                        >
                          {t(`progress.${upd.progress}` as never)}
                        </span>
                        <span className="text-sm font-medium text-[#62748A]">
                          · {getJobLabel(upd.jobId)}
                        </span>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeleteUpdateId(upd.id)}
                        className="text-[#D64545] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>{t('app.delete')}</span>
                      </Button>
                    </div>

                    <p className="text-base leading-relaxed text-[#172B4D]">{upd.note}</p>

                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
                      {upd.photos.map((ph) => (
                        <PhotoTile
                          key={ph.id}
                          photo={ph}
                          alt={upd.note}
                          className="h-32"
                          onClick={() => setLightboxPhoto({ photo: ph, caption: upd.note })}
                        />
                      ))}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: MY WORK GALLERY (PORTFOLIO) */}
      {activeTab === 'gallery' && (
        <div className="space-y-6">
          {portfolioSuccess && (
            <div
              role="status"
              className="flex items-center gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-base font-semibold text-[#16865B]"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
              <span>{portfolioSuccess}</span>
            </div>
          )}

          {showPortfolioForm && (
            <Card className="border-2 border-[#BFDBFE]">
              <form onSubmit={handleSavePortfolio} className="space-y-5">
                <div className="flex items-center justify-between gap-3 border-b border-[#E3EAF3] pb-4">
                  <h2 className="text-xl font-extrabold text-[#102A43]">
                    {t('myWork.addToGalleryBtn')}
                  </h2>
                  <button
                    type="button"
                    onClick={() => setShowPortfolioForm(false)}
                    className="inline-flex min-h-[48px] items-center gap-1 rounded-xl border border-[#E3EAF3] px-3 text-sm font-semibold text-[#62748A] cursor-pointer"
                  >
                    <X className="h-4 w-4" aria-hidden="true" />
                    <span>{t('app.close')}</span>
                  </button>
                </div>

                <div className="space-y-3">
                  <label className="block text-base font-bold text-[#102A43]">
                    {t('myWork.stepPhotosLabel', { n: portfolioPhotos.length })}
                  </label>
                  <div className="flex items-start gap-2.5 rounded-xl border border-[#FDE68A] bg-[#FFFBEB] p-3 text-sm font-medium text-[#92400E]">
                    <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t('post.photoSafetyNote')}</span>
                  </div>

                  <input
                    ref={portfolioFileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    onChange={handlePortfolioFilePick}
                    className="sr-only"
                  />

                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    disabled={
                      processingPortfolioPhotos || portfolioPhotos.length >= MAX_PHOTOS_PER_POST
                    }
                    onClick={() => portfolioFileInputRef.current?.click()}
                  >
                    <ImagePlus className="h-5 w-5" aria-hidden="true" />
                    <span>
                      {processingPortfolioPhotos
                        ? t('post.preparingPhotos')
                        : t('myWork.choose1To5')}
                    </span>
                  </Button>

                  {portfolioPhotos.length > 0 && (
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                      {portfolioPhotos.map((ph) => (
                        <div key={ph.id} className="relative">
                          <PhotoTile photo={ph} className="h-28" />
                          <button
                            type="button"
                            onClick={() =>
                              setPortfolioPhotos((prev) => prev.filter((p) => p.id !== ph.id))
                            }
                            aria-label={t('post.removePhoto')}
                            className="absolute end-1.5 top-1.5 flex h-8 w-8 items-center justify-center rounded-lg bg-[#102A43]/80 text-white hover:bg-[#D64545] cursor-pointer"
                          >
                            <X className="h-4 w-4" aria-hidden="true" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label
                      htmlFor="portfolio-caption"
                      className="text-base font-bold text-[#102A43]"
                    >
                      {t('myWork.galleryCaptionStep')}
                    </label>
                    <span className="text-sm text-[#62748A] tabular-nums">
                      {t('post.charCount', {
                        n: portfolioCaption.length,
                        max: INPUT_LIMITS.CAPTION_MAX,
                      })}
                    </span>
                  </div>
                  <input
                    id="portfolio-caption"
                    type="text"
                    value={portfolioCaption}
                    maxLength={INPUT_LIMITS.CAPTION_MAX}
                    onChange={(e) => setPortfolioCaption(e.target.value)}
                    placeholder={t('myWork.portfolioCaptionPlaceholder')}
                    className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label
                    htmlFor="portfolio-category"
                    className="block text-base font-bold text-[#102A43]"
                  >
                    {t('myWork.galleryCategoryStep')}
                  </label>
                  <select
                    id="portfolio-category"
                    value={portfolioCategoryId}
                    onChange={(e) => setPortfolioCategoryId(e.target.value)}
                    className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-3.5 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                  >
                    {state.categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {getLocalizedCategoryName(cat, lang)}
                      </option>
                    ))}
                  </select>
                </div>

                {portfolioErrors.length > 0 && (
                  <div
                    role="alert"
                    className="space-y-1 rounded-xl border border-[#FECACA] bg-[#FEF2F2] p-4 text-base font-semibold text-[#D64545]"
                  >
                    {portfolioErrors.map((err, idx) => (
                      <p key={idx}>{err}</p>
                    ))}
                  </div>
                )}

                <div className="flex flex-wrap gap-3">
                  <Button type="submit" variant="primary" size="lg">
                    <PlusCircle className="h-5 w-5" aria-hidden="true" />
                    <span>{t('myWork.savePortfolioBtn')}</span>
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    onClick={() => setShowPortfolioForm(false)}
                  >
                    <span>{t('app.cancel')}</span>
                  </Button>
                </div>
              </form>
            </Card>
          )}

          {workerPortfolio.length === 0 ? (
            <Card className="py-12 text-center">
              <h2 className="text-xl font-bold text-[#102A43]">
                {t('myWork.emptyPortfolio')}
              </h2>
              <p className="mt-2 text-base text-[#62748A]">
                {t('myWork.emptyPortfolioDesc')}
              </p>
              <div className="mt-5 flex justify-center">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={() => setShowPortfolioForm(true)}
                >
                  <PlusCircle className="h-5 w-5" aria-hidden="true" />
                  <span>{t('myWork.addToGalleryBtn')}</span>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {workerPortfolio.map((item) => {
                const cat = state.categories.find((c) => c.id === item.categoryId);
                return (
                  <Card key={item.id} className="flex flex-col justify-between space-y-4">
                    <div className="space-y-3">
                      <div
                        className={`grid gap-2 ${
                          item.photos.length > 1 ? 'grid-cols-2' : 'grid-cols-1'
                        }`}
                      >
                        {item.photos.map((ph) => (
                          <PhotoTile
                            key={ph.id}
                            photo={ph}
                            alt={item.caption}
                            className="h-36"
                            onClick={() =>
                              setLightboxPhoto({ photo: ph, caption: item.caption })
                            }
                          />
                        ))}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#1769E0]">
                          {cat ? getLocalizedCategoryName(cat, lang) : t('nav.myWork')}
                        </p>
                        <p className="mt-1 text-base font-bold text-[#102A43]">{item.caption}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2 border-t border-[#E3EAF3] pt-3">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setEditingItem(item);
                          setEditingCaption(item.caption);
                          setEditingCaptionError('');
                        }}
                      >
                        <Edit3 className="h-4 w-4" aria-hidden="true" />
                        <span>{t('myWork.editCaptionBtn')}</span>
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDeletePortfolioId(item.id)}
                        className="text-[#D64545] hover:bg-[#FEF2F2]"
                      >
                        <Trash2 className="h-4 w-4" aria-hidden="true" />
                        <span>{t('app.delete')}</span>
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Delete Daily Update Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deleteUpdateId)}
        onClose={() => setDeleteUpdateId(null)}
        onConfirm={() => {
          if (deleteUpdateId) {
            dispatch({
              type: 'DELETE_WORK_UPDATE',
              updateId: deleteUpdateId,
              workerId: worker.id,
            });
          }
        }}
        title={t('myWork.deleteUpdateTitle')}
        message={t('myWork.deleteUpdateMsg')}
        confirmLabel={t('myWork.yesDelete')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />

      {/* Delete Portfolio Photo Confirm */}
      <ConfirmDialog
        isOpen={Boolean(deletePortfolioId)}
        onClose={() => setDeletePortfolioId(null)}
        onConfirm={() => {
          if (deletePortfolioId) {
            dispatch({
              type: 'DELETE_PORTFOLIO_ITEM',
              itemId: deletePortfolioId,
              workerId: worker.id,
            });
          }
        }}
        title={t('myWork.deletePortfolioTitle')}
        message={t('myWork.deletePortfolioMsg')}
        confirmLabel={t('myWork.yesDelete')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />

      {/* Edit Portfolio Caption Modal */}
      <Modal
        isOpen={Boolean(editingItem)}
        onClose={() => setEditingItem(null)}
        title={t('myWork.editCaptionTitle')}
        maxWidthClass="max-w-md"
      >
        <form onSubmit={handleSaveCaptionEdit} className="space-y-4">
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="edit-caption-input" className="text-base font-bold text-[#102A43]">
                {t('myWork.captionLabel')}
              </label>
              <span className="text-xs text-[#62748A] tabular-nums">
                {t('post.charCount', {
                  n: editingCaption.length,
                  max: INPUT_LIMITS.CAPTION_MAX,
                })}
              </span>
            </div>
            <input
              id="edit-caption-input"
              type="text"
              value={editingCaption}
              maxLength={INPUT_LIMITS.CAPTION_MAX}
              onChange={(e) => {
                setEditingCaption(e.target.value);
                setEditingCaptionError('');
              }}
              className="min-h-[48px] w-full rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
            />
            {editingCaptionError && (
              <p className="text-sm font-semibold text-[#D64545]">{editingCaptionError}</p>
            )}
          </div>

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => setEditingItem(null)}>
              {t('app.cancel')}
            </Button>
            <Button type="submit" variant="primary">
              {t('myWork.saveCaptionBtn')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Lightbox Modal */}
      <Modal
        isOpen={Boolean(lightboxPhoto)}
        onClose={() => setLightboxPhoto(null)}
        title={lightboxPhoto?.photo.title || t('workerPublic.workPhotoTitle')}
        maxWidthClass="max-w-2xl"
      >
        {lightboxPhoto && (
          <div className="space-y-4">
            <PhotoTile photo={lightboxPhoto.photo} className="h-72 sm:h-96" />
            {lightboxPhoto.caption && (
              <p className="text-base font-medium text-[#172B4D]">{lightboxPhoto.caption}</p>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};
