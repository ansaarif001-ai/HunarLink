import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  ArrowLeft,
  CheckCircle2,
  ClipboardList,
  Clock,
  Flag,
  HelpCircle,
  Mail,
  Send,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import { Input, Select, Textarea } from '../components/ui/FormControls';
import { useToast } from '../components/ui/Toast';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { ContentReport, UserRole } from '../types';
import { formatRelativeTime } from '../utils/id';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

type ReportTargetType = ContentReport['targetType'];

export const HelpPage: React.FC = () => {
  const { state, dispatch } = useAppStore();
  const { t, lang } = useTranslation();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const homePath =
    state.activeRole === UserRole.Worker
      ? '/worker'
      : state.activeRole === UserRole.Customer
        ? '/customer'
        : '/';

  // Report a Problem state
  const [reportType, setReportType] = useState<ReportTargetType>('worker');
  const [jobLink, setJobLink] = useState('');
  const [reportNote, setReportNote] = useState('');
  const [reportError, setReportError] = useState('');
  const [reportSaved, setReportSaved] = useState(false);

  // Contact Us state
  const [contactName, setContactName] = useState('');
  const [contactMessage, setContactMessage] = useState('');
  const [contactError, setContactError] = useState('');
  const [contactSaved, setContactSaved] = useState(false);

  const reportTypeOptions: { value: ReportTargetType; label: string }[] = [
    { value: 'worker', label: t('help.typeWorker') },
    { value: 'customer', label: t('help.typeCustomer') },
    { value: 'job', label: t('help.typeJob') },
    { value: 'chat', label: t('help.typeChat') },
    { value: 'other', label: t('help.typeOther') },
  ];

  const reportTypeLabelMap: Record<ReportTargetType, string> = {
    worker: t('help.typeWorker'),
    customer: t('help.typeCustomer'),
    job: t('help.typeJob'),
    chat: t('help.typeChat'),
    other: t('help.typeOther'),
    review: t('help.typeOther'),
    work_update: t('help.typeWorker'),
  };

  const faqs = [
    { q: t('help.faq1Q'), a: t('help.faq1A') },
    { q: t('help.faq2Q'), a: t('help.faq2A') },
    { q: t('help.faq3Q'), a: t('help.faq3A') },
    { q: t('help.faq4Q'), a: t('help.faq4A') },
    { q: t('help.faq5Q'), a: t('help.faq5A') },
    { q: t('help.faq6Q'), a: t('help.faq6A') },
    { q: t('help.faq7Q'), a: t('help.faq7A') },
    { q: t('help.faq8Q'), a: t('help.faq8A') },
  ];

  const handleReportSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNote = sanitizeText(reportNote, INPUT_LIMITS.REPORT_NOTE_MAX);
    const cleanJobLink = sanitizeText(jobLink, INPUT_LIMITS.JOB_LINK_MAX);
    if (!cleanNote) {
      setReportError(t('help.errNote'));
      setReportSaved(false);
      return;
    }

    dispatch({
      type: 'ADD_CONTENT_REPORT',
      targetType: reportType,
      targetId: cleanJobLink || 'app_help',
      workerId: state.activeWorkerId || 'wrk_ali_raza',
      reason: reportType,
      note: cleanNote,
      jobLink: cleanJobLink || undefined,
    });
    setReportNote('');
    setJobLink('');
    setReportError('');
    setReportSaved(true);
    showToast(t('help.savedToast'), 'success');
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = sanitizeText(contactName, INPUT_LIMITS.NAME_MAX);
    const cleanMsg = sanitizeText(contactMessage, INPUT_LIMITS.CONTACT_MESSAGE_MAX);
    if (!cleanName) {
      setContactError(t('help.contactErrName'));
      setContactSaved(false);
      return;
    }
    if (!cleanMsg) {
      setContactError(t('help.contactErrMsg'));
      setContactSaved(false);
      return;
    }

    dispatch({
      type: 'ADD_CONTACT_MESSAGE',
      name: cleanName,
      message: cleanMsg,
    });
    setContactName('');
    setContactMessage('');
    setContactError('');
    setContactSaved(true);
    showToast(t('help.contactSavedToast'), 'success');
  };

  return (
    <div className="mx-auto max-w-[780px] space-y-6">
      <div>
        <Button variant="outline" size="md" onClick={() => navigate(homePath)}>
          <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
          <span>{t('app.backHome')}</span>
        </Button>
      </div>

      <section className="space-y-1">
        <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
          {t('help.title')}
        </h1>
        <p className="text-base text-[#62748A]">{t('help.subtitle')}</p>
      </section>

      {/* 8 Common Questions */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
            <HelpCircle className="h-5 w-5" aria-hidden="true" />
          </div>
          <h2 className="text-xl font-bold text-[#102A43]">{t('help.faqTitle')}</h2>
        </div>

        <div className="divide-y divide-[#E3EAF3]">
          {faqs.map((item, idx) => (
            <div key={idx} className="py-3.5 first:pt-1 last:pb-1">
              <h3 className="text-base font-bold text-[#102A43]">{item.q}</h3>
              <p className="mt-1 text-base leading-relaxed text-[#62748A]">{item.a}</p>
            </div>
          ))}
        </div>
      </Card>

      {/* Report a Problem Form */}
      <Card id="report-form" className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
            <Flag className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">{t('help.reportTitle')}</h2>
            <p className="text-sm text-[#62748A]">{t('help.reportDesc')}</p>
          </div>
        </div>

        {reportSaved && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-base font-bold text-[#16865B]"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t('help.savedToast')}</span>
          </div>
        )}

        <form onSubmit={handleReportSubmit} className="space-y-4" noValidate>
          <Select
            id="help-report-type"
            label={t('help.problemTypeLabel')}
            value={reportType}
            options={reportTypeOptions}
            onChange={(e) => setReportType(e.target.value as ReportTargetType)}
          />

          <Input
            id="help-job-link"
            label={t('help.jobLinkLabel')}
            placeholder={t('help.jobLinkPlaceholder')}
            value={jobLink}
            maxLength={INPUT_LIMITS.JOB_LINK_MAX}
            onChange={(e) => setJobLink(e.target.value)}
          />

          <Textarea
            id="help-note"
            label={t('help.problemNoteLabel')}
            placeholder={t('help.problemNotePlaceholder')}
            value={reportNote}
            maxLength={INPUT_LIMITS.REPORT_NOTE_MAX}
            required
            error={reportError}
            onChange={(e) => {
              setReportNote(e.target.value);
              if (reportError) setReportError('');
              if (reportSaved) setReportSaved(false);
            }}
          />

          <Button type="submit" variant="primary" size="lg">
            <Send className="h-5 w-5" aria-hidden="true" />
            <span>{t('help.submitBtn')}</span>
          </Button>
        </form>
      </Card>

      {/* My Reports List */}
      <section className="space-y-3">
        <div className="flex items-center gap-2.5 px-1">
          <ClipboardList className="h-5 w-5 text-[#1769E0]" aria-hidden="true" />
          <h2 className="text-xl font-bold text-[#102A43]">
            {t('help.myReportsTitle', { n: state.reports.length })}
          </h2>
        </div>

        {state.reports.length === 0 ? (
          <EmptyState
            icon={Flag}
            title={t('help.myReportsTitle', { n: 0 })}
            description={t('help.myReportsEmpty')}
            action={
              <Button
                variant="outline"
                size="md"
                onClick={() => document.getElementById('help-note')?.focus()}
              >
                <Flag className="h-4 w-4 text-[#1769E0]" aria-hidden="true" />
                <span>{t('help.reportTitle')}</span>
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
            {state.reports.map((rep) => (
              <Card key={rep.id} className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-lg border border-[#D2E3FC] bg-[#EFF6FF] px-2.5 py-0.5 text-sm font-bold text-[#1769E0]">
                      {reportTypeLabelMap[rep.targetType] || t('help.typeOther')}
                    </span>
                    <span className="rounded-lg border border-[#BBF7D0] bg-[#F0FDF4] px-2.5 py-0.5 text-sm font-bold text-[#16865B]">
                      {t('help.statusSentDemo')}
                    </span>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-[#62748A]">
                    <Clock className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>{formatRelativeTime(rep.createdAt, lang)}</span>
                  </span>
                </div>
                {rep.jobLink && (
                  <p className="text-sm font-semibold text-[#62748A]">{rep.jobLink}</p>
                )}
                <p className="text-base leading-relaxed text-[#172B4D]">{rep.note}</p>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Contact Us Form */}
      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#EFF6FF] text-[#1769E0]">
            <Mail className="h-5 w-5" aria-hidden="true" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-[#102A43]">{t('help.contactTitle')}</h2>
            <p className="text-sm text-[#62748A]">{t('help.contactDesc')}</p>
          </div>
        </div>

        {contactSaved && (
          <div
            role="status"
            className="flex items-center gap-2.5 rounded-xl border border-[#BBF7D0] bg-[#F0FDF4] p-4 text-base font-bold text-[#16865B]"
          >
            <CheckCircle2 className="h-5 w-5 shrink-0" aria-hidden="true" />
            <span>{t('help.contactSavedToast')}</span>
          </div>
        )}

        <form onSubmit={handleContactSubmit} className="space-y-4" noValidate>
          <Input
            id="contact-name"
            label={t('help.contactNameLabel')}
            placeholder={t('help.contactNamePlaceholder')}
            value={contactName}
            maxLength={INPUT_LIMITS.NAME_MAX}
            required
            onChange={(e) => {
              setContactName(e.target.value);
              if (contactError) setContactError('');
              if (contactSaved) setContactSaved(false);
            }}
          />

          <Textarea
            id="contact-message"
            label={t('help.contactMsgLabel')}
            placeholder={t('help.contactMsgPlaceholder')}
            value={contactMessage}
            maxLength={INPUT_LIMITS.CONTACT_MESSAGE_MAX}
            required
            onChange={(e) => {
              setContactMessage(e.target.value);
              if (contactError) setContactError('');
              if (contactSaved) setContactSaved(false);
            }}
          />

          {contactError && (
            <div
              role="alert"
              className="rounded-xl border border-[#FECACA] bg-[#FEF2F2] px-4 py-3 text-sm font-semibold text-[#D64545]"
            >
              {contactError}
            </div>
          )}

          <Button type="submit" variant="secondary" size="lg">
            <Send className="h-5 w-5" aria-hidden="true" />
            <span>{t('help.contactSendBtn')}</span>
          </Button>
        </form>

        {state.contactMessages.length > 0 && (
          <div className="space-y-2.5 border-t border-[#E3EAF3] pt-4">
            <h3 className="text-base font-bold text-[#102A43]">
              {t('help.contactHistoryTitle', { n: state.contactMessages.length })}
            </h3>
            <div className="space-y-2.5">
              {state.contactMessages.map((msg) => (
                <div
                  key={msg.id}
                  className="rounded-xl border border-[#E3EAF3] bg-[#F8FAFC] p-3.5 space-y-1"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-sm font-bold text-[#102A43]">{msg.name}</span>
                    <span className="text-xs font-semibold text-[#16865B]">
                      {t('help.statusSentDemo')} · {formatRelativeTime(msg.createdAt, lang)}
                    </span>
                  </div>
                  <p className="text-base text-[#172B4D]">{msg.message}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};
