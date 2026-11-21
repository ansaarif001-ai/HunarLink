import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowLeft,
  Ban,
  Briefcase,
  Flag,
  MessageSquare,
  Send,
  ShieldAlert,
} from 'lucide-react';
import { ReportUpdateModal } from '../components/ReportUpdateModal';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { EmptyState } from '../components/ui/EmptyState';
import { SAMPLE_AREAS } from '../data/locations';
import { useAppStore } from '../hooks/useAppStore';
import { useTranslation } from '../hooks/useTranslation';
import { getLocalizedLocationLabel } from '../i18n';
import { UserRole } from '../types';
import {
  formatChatTime,
  getUnreadCountForConversation,
  inspectChatMessageSafety,
} from '../utils/chatSafety';
import { INPUT_LIMITS, sanitizeText } from '../utils/validation';

export const ChatPage: React.FC = () => {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const { state, dispatch } = useAppStore();
  const { t, lang, isUrdu } = useTranslation();

  const isGuest = state.activeRole === UserRole.Guest;
  const isCustomer = state.activeRole === UserRole.Customer;
  const actorId = isCustomer ? state.activeCustomerId : state.activeWorkerId;

  const [draft, setDraft] = useState('');
  const [safetyError, setSafetyError] = useState('');
  const [phoneNotice, setPhoneNotice] = useState(false);
  const [confirmBlockOpen, setConfirmBlockOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);

  const userConversations = useMemo(() => {
    if (isGuest) return [];
    return state.conversations
      .filter((c) => c.participantIds.includes(actorId))
      .sort((a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt));
  }, [state.conversations, actorId, isGuest]);

  const activeConv = useMemo(() => {
    if (conversationId) {
      return userConversations.find((c) => c.id === conversationId);
    }
    return undefined;
  }, [conversationId, userConversations]);

  // Mark open conversation messages read cleanly
  useEffect(() => {
    if (!activeConv || !actorId) return;
    const unread = getUnreadCountForConversation(state.messages, activeConv.id, actorId);
    if (unread > 0) {
      dispatch({ type: 'MARK_CONVERSATION_READ', conversationId: activeConv.id });
    }
  }, [activeConv, actorId, state.messages, dispatch]);

  if (isGuest) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <Card className="space-y-4 py-10 text-center">
          <h1 className="text-2xl font-bold text-[#102A43]">{t('chat.guestTitle')}</h1>
          <p className="text-base text-[#62748A]">{t('chat.guestDesc')}</p>
          <div className="flex justify-center">
            <Button variant="primary" size="lg" onClick={() => navigate('/')}>
              <span>{t('error.goHome')}</span>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const activeMessages = activeConv
    ? state.messages
        .filter((m) => m.conversationId === activeConv.id)
        .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt))
    : [];

  const getPartnerInfo = (conv: typeof userConversations[number]) => {
    if (isCustomer) {
      const w = state.workers.find((x) => x.id === conv.workerId);
      return {
        id: conv.workerId,
        name: (isUrdu ? w?.nameUr : w?.name) || t('common.worker'),
        subtitle: (isUrdu ? w?.headlineUr : w?.headline) || t('common.worker'),
        photoUrl: w?.profilePhotoUrl,
        role: 'worker' as const,
      };
    }
    const c = state.customers.find((x) => x.id === conv.customerId);
    return {
      id: conv.customerId,
      name: c?.name || t('common.customer'),
      subtitle: c
        ? getLocalizedLocationLabel(c.area, c.city, SAMPLE_AREAS, lang)
        : t('common.customer'),
      photoUrl: undefined,
      role: 'customer' as const,
    };
  };

  const getConvJobTitle = (conv: typeof userConversations[number]): string => {
    if (!conv.jobTitle) return '';
    const relatedJob = conv.jobId
      ? state.jobs.find((j) => j.id === conv.jobId)
      : undefined;
    if (relatedJob) {
      return isUrdu && relatedJob.titleUr ? relatedJob.titleUr : relatedJob.title;
    }
    return conv.jobTitle;
  };

  const activePartner = activeConv ? getPartnerInfo(activeConv) : undefined;
  const activeJobTitle = activeConv ? getConvJobTitle(activeConv) : '';

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConv || !activePartner) return;
    setSafetyError('');
    setPhoneNotice(false);

    if (activeConv.blockedBy) {
      setSafetyError(t('chat.blockedNotice'));
      return;
    }

    const clean = sanitizeText(draft, INPUT_LIMITS.MESSAGE_MAX);
    const safety = inspectChatMessageSafety(clean, lang);
    if (safety.blocked) {
      setSafetyError(safety.reason || t('chat.safetyEmpty'));
      return;
    }

    if (safety.hasPhoneWarning) {
      setPhoneNotice(true);
    }

    dispatch({
      type: 'SEND_CHAT_MESSAGE',
      conversationId: activeConv.id,
      text: clean,
    });
    setDraft('');
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-[#102A43] sm:text-3xl">
            {t('chat.title')}
          </h1>
          <p className="text-base text-[#62748A]">
            {isCustomer ? t('chat.subtitleCustomer') : t('chat.subtitleWorker')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        {/* Left List of Conversations (full page on mobile when no activeConv) */}
        <section
          aria-label={t('chat.conversationsAria')}
          className={`space-y-2 lg:col-span-4 ${activeConv ? 'hidden lg:block' : 'block'}`}
        >
          <Card padding="sm" className="space-y-2">
            <h2 className="px-2 pt-1 text-base font-extrabold text-[#102A43]">
              {t('chat.chatsCount', { n: userConversations.length })}
            </h2>

            {userConversations.length === 0 ? (
              <EmptyState
                icon={MessageSquare}
                title={t('chat.emptyListTitle')}
                description={isCustomer ? t('chat.emptyCustomerHint') : t('chat.emptyWorkerHint')}
                action={
                  <Button
                    variant="primary"
                    size="md"
                    onClick={() => navigate(isCustomer ? '/workers' : '/worker/jobs')}
                  >
                    <span>{isCustomer ? t('nav.findWorkers') : t('nav.jobsNearMe')}</span>
                  </Button>
                }
              />
            ) : (
              <div className="space-y-1.5">
                {userConversations.map((conv) => {
                  const partner = getPartnerInfo(conv);
                  const convJobTitle = getConvJobTitle(conv);
                  const convMsgs = state.messages
                    .filter((m) => m.conversationId === conv.id)
                    .sort((a, b) => Date.parse(a.createdAt) - Date.parse(b.createdAt));
                  const lastMsg = convMsgs[convMsgs.length - 1];
                  const unread = getUnreadCountForConversation(state.messages, conv.id, actorId);
                  const isSelected = activeConv?.id === conv.id;
                  const initials = partner.name
                    .split(/\s+/)
                    .slice(0, 2)
                    .map((p: string) => p[0])
                    .join('')
                    .toUpperCase();

                  return (
                    <button
                      key={conv.id}
                      type="button"
                      onClick={() => navigate(`/chat/${conv.id}`)}
                      className={`flex w-full items-start gap-3 rounded-xl border p-3 text-start transition-colors cursor-pointer ${
                        isSelected
                          ? 'border-[#1769E0] bg-[#EFF6FF]'
                          : 'border-[#E3EAF3] bg-white hover:bg-[#F8FAFC]'
                      }`}
                    >
                      {partner.photoUrl ? (
                        <img
                          src={partner.photoUrl}
                          alt={partner.name}
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          className="h-12 w-12 shrink-0 rounded-full border border-[#D2E3FC] object-cover"
                        />
                      ) : (
                        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-[#D2E3FC] bg-[#EFF6FF] font-bold text-[#1769E0]">
                          {initials}
                        </div>
                      )}

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-base font-bold text-[#102A43]">
                            {partner.name}
                          </span>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className="text-xs text-[#62748A]">
                              {formatChatTime(lastMsg?.createdAt || conv.updatedAt, lang)}
                            </span>
                            {unread > 0 && (
                              <span
                                aria-label={t('chat.unreadMessagesAria', { n: unread })}
                                className="inline-block h-2.5 w-2.5 rounded-full bg-[#1769E0]"
                              />
                            )}
                          </div>
                        </div>

                        {convJobTitle && (
                          <p className="mt-0.5 truncate text-xs font-semibold text-[#1769E0]">
                            {t('chat.jobPrefix', { title: convJobTitle })}
                          </p>
                        )}

                        <p className="mt-0.5 truncate text-sm text-[#62748A]">
                          {conv.blockedBy
                            ? t('chat.chatBlockedShort')
                            : lastMsg
                              ? lastMsg.text
                              : t('chat.startChatting')}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </Card>
        </section>

        {/* Right Thread Panel */}
        <section
          aria-label={t('chat.messagesAria')}
          className={`lg:col-span-8 ${activeConv ? 'block' : 'hidden lg:block'}`}
        >
          {!activeConv || !activePartner ? (
            <Card className="flex min-h-[420px] flex-col items-center justify-center p-8 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#1769E0]">
                <MessageSquare className="h-7 w-7" aria-hidden="true" />
              </div>
              <h2 className="mt-4 text-xl font-bold text-[#102A43]">
                {t('chat.selectPrompt')}
              </h2>
              <p className="mt-2 max-w-md text-base text-[#62748A]">
                {t('chat.selectDesc')}
              </p>
            </Card>
          ) : (
            <Card padding="none" className="flex min-h-[520px] flex-col overflow-hidden">
              {/* Thread Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E3EAF3] bg-white p-4">
                <div className="flex min-w-0 items-center gap-3">
                  <button
                    type="button"
                    onClick={() => navigate('/chat')}
                    aria-label={t('chat.backToListAria')}
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#E3EAF3] text-[#102A43] lg:hidden cursor-pointer"
                  >
                    <ArrowLeft className="h-5 w-5 rtl:rotate-180" aria-hidden="true" />
                  </button>
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-extrabold text-[#102A43]">
                      {activePartner.name}
                    </h2>
                    {activeJobTitle ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (!activeConv.jobId) return;
                          navigate(
                            isCustomer
                              ? `/my-requests/${activeConv.jobId}`
                              : `/worker/bookings`
                          );
                        }}
                        className="mt-0.5 inline-flex items-center gap-1.5 text-sm font-semibold text-[#1769E0] hover:underline cursor-pointer"
                      >
                        <Briefcase className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                        <span className="truncate">{activeJobTitle}</span>
                      </button>
                    ) : (
                      <p className="text-sm text-[#62748A]">{activePartner.subtitle}</p>
                    )}
                  </div>
                </div>

                {/* Block & Report actions */}
                <div className="flex items-center gap-2">
                  {!activeConv.blockedBy && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setConfirmBlockOpen(true)}
                      className="text-[#D64545]"
                    >
                      <Ban className="h-4 w-4" aria-hidden="true" />
                      <span>{t('chat.blockBtn')}</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setReportOpen(true)}
                  >
                    <Flag className="h-4 w-4 text-[#D64545]" aria-hidden="true" />
                    <span>{t('chat.reportBtn')}</span>
                  </Button>
                </div>
              </div>

              {/* Safety Notice Bar */}
              <div className="flex items-center gap-2 border-b border-[#FDE68A] bg-[#FFFBEB] px-4 py-2.5 text-sm font-semibold text-[#92400E]">
                <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
                <span>{t('chat.safetyBanner')}</span>
              </div>

              {/* Messages List */}
              <div className="max-h-[420px] flex-1 space-y-3 overflow-y-auto bg-[#F8FAFC] p-4">
                {activeMessages.length === 0 ? (
                  <p className="py-10 text-center text-base text-[#62748A]">
                    {t('chat.noMessagesYet')}
                  </p>
                ) : (
                  activeMessages.map((msg) => {
                    const isMine = msg.senderId === actorId;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-base sm:max-w-[75%] ${
                            isMine
                              ? 'bg-[#1769E0] text-white'
                              : 'border border-[#E3EAF3] bg-white text-[#102A43]'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.text}</p>
                        </div>
                        <span className="mt-1 px-1 text-xs text-[#62748A]">
                          {msg.senderName} · {formatChatTime(msg.createdAt, lang)}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Blocked Banner or Message Input Box */}
              {activeConv.blockedBy ? (
                <div className="border-t border-[#FECACA] bg-[#FEF2F2] p-4 text-center text-base font-bold text-[#D64545]">
                  {t('chat.blockedNotice')}
                </div>
              ) : (
                <form
                  onSubmit={handleSend}
                  className="space-y-2 border-t border-[#E3EAF3] bg-white p-4"
                >
                  {phoneNotice && (
                    <p
                      role="status"
                      className="flex items-center gap-2 rounded-xl bg-[#FFFBEB] px-3 py-2 text-sm font-semibold text-[#92400E]"
                    >
                      <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
                      <span>{t('chat.phoneNoticeBanner')}</span>
                    </p>
                  )}

                  {safetyError && (
                    <p
                      role="alert"
                      className="rounded-xl bg-[#FEF2F2] px-3.5 py-2.5 text-sm font-bold text-[#D64545]"
                    >
                      {safetyError}
                    </p>
                  )}

                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={draft}
                      maxLength={INPUT_LIMITS.MESSAGE_MAX}
                      onChange={(e) => {
                        setDraft(e.target.value);
                        if (safetyError) setSafetyError('');
                      }}
                      placeholder={t('chat.inputPlaceholder')}
                      aria-label={t('chat.inputAria')}
                      className="min-h-[48px] flex-1 rounded-xl border-2 border-[#CBD5E1] bg-white px-4 text-base text-[#172B4D] focus:border-[#1769E0] focus:outline-none"
                    />
                    <Button type="submit" variant="primary" size="lg" className="min-h-[48px]">
                      <Send className="h-5 w-5" aria-hidden="true" />
                      <span>{t('chat.sendBtn')}</span>
                    </Button>
                  </div>
                  <p className="text-end text-xs text-[#62748A] tabular-nums">
                    {t('post.charCount', {
                      n: draft.length,
                      max: INPUT_LIMITS.MESSAGE_MAX,
                    })}
                  </p>
                </form>
              )}
            </Card>
          )}
        </section>
      </div>

      <ConfirmDialog
        isOpen={confirmBlockOpen}
        onClose={() => setConfirmBlockOpen(false)}
        onConfirm={() => {
          if (activeConv) {
            dispatch({ type: 'BLOCK_CONVERSATION', conversationId: activeConv.id });
          }
        }}
        title={t('chat.blockUserTitle', { name: activePartner?.name || '' })}
        message={t('chat.blockConfirmMsg')}
        confirmLabel={t('chat.blockConfirmYes')}
        cancelLabel={t('app.cancel')}
        tone="danger"
      />

      {activeConv && activePartner && (
        <ReportUpdateModal
          isOpen={reportOpen}
          onClose={() => setReportOpen(false)}
          updateId={activeConv.id}
          targetType="chat"
          workerId={activeConv.workerId}
          workerName={activePartner.name}
        />
      )}
    </div>
  );
};
