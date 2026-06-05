'use client';

import React, { useState } from 'react';
import { formatDistanceToNow, format } from 'date-fns';
import {
  Clock,
  Paperclip,
  Download,
  Eye,
  Users,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Megaphone,
  Edit,
  Trash2,
  Send,
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

// ── Types ──
interface AnnouncementCardProps {
  announcement: {
    id: string;
    title: string;
    content: string;
    type: string;
    priority: string;
    target: string;
    coverImage?: string | null;
    attachments?: string | null;
    status?: string;
    publishedAt?: string | null;
    createdAt: string;
    readCount: number;
    totalRecipients: number;
    isRead: boolean;
    creator?: { id: string; name: string; avatar: string | null } | null;
  };
  onEdit?: () => void;
  onDelete?: () => void;
  onPublish?: () => void;
  onClick?: () => void;
  showActions?: boolean;
}

// ── Badge Configs ──
const TYPE_CONFIG: Record<string, { label: string; bg: string; color: string }> = {
  GENERAL: { label: 'General', bg: 'bg-gray-100', color: 'text-gray-700' },
  EVENT: { label: 'Event', bg: 'bg-amber-100', color: 'text-amber-700' },
  HOLIDAY: { label: 'Holiday', bg: 'bg-purple-100', color: 'text-purple-700' },
  FEE_REMINDER: { label: 'Fee', bg: 'bg-yellow-100', color: 'text-yellow-700' },
  EMERGENCY: { label: 'Emergency', bg: 'bg-red-100', color: 'text-red-700' },
  ACHIEVEMENT: { label: 'Achievement', bg: 'bg-emerald-100', color: 'text-emerald-700' },
  CONCERN: { label: 'Concern', bg: 'bg-orange-100', color: 'text-orange-700' },
};

const TARGET_CONFIG: Record<string, string> = {
  ALL: 'Everyone',
  BRANCH: 'Branch',
  CLASS: 'Class',
  TEACHERS: 'Teachers',
  PARENTS: 'Parents',
  SPECIFIC: 'Specific',
};

// ── Component ──
export function AnnouncementCard({
  announcement,
  onEdit,
  onDelete,
  onPublish,
  onClick,
  showActions = false,
}: AnnouncementCardProps) {
  const [expanded, setExpanded] = useState(false);

  const {
    id,
    title,
    content,
    type,
    priority,
    target,
    coverImage,
    attachments,
    status,
    publishedAt,
    createdAt,
    readCount,
    totalRecipients,
    isRead,
    creator,
  } = announcement;

  // ── Priority indicator color ──
  const priorityColor =
    priority === 'HIGH' || priority === 'CONCERN'
      ? 'border-l-red-500'
      : priority === 'NORMAL'
        ? 'border-l-amber-400'
        : 'border-l-green-400';

  // ── Type badge ──
  const typeConfig = TYPE_CONFIG[type] || TYPE_CONFIG.GENERAL;

  // ── Read progress ──
  const readPercent =
    totalRecipients > 0 ? Math.round((readCount / totalRecipients) * 100) : 0;

  // ── Parsed attachments ──
  let parsedAttachments: string[] = [];
  if (attachments) {
    try {
      parsedAttachments = JSON.parse(attachments);
    } catch {
      parsedAttachments = attachments.split(',').filter(Boolean);
    }
  }

  // ── Content truncation ──
  const isLongContent = content.length > 200;
  const displayContent = expanded ? content : content.slice(0, 200);

  const isUrgent = priority === 'HIGH' || priority === 'CONCERN' || type === 'EMERGENCY';

  return (
    <Card
      className={cn(
        'rounded-2xl border-l-4 transition-all hover:shadow-md cursor-pointer',
        priorityColor,
        !isRead && 'ring-2 ring-portal-200',
        isUrgent && !isRead && 'ring-red-200'
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        {/* Header */}
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div
            className={cn(
              'w-10 h-10 rounded-xl flex items-center justify-center shrink-0',
              typeConfig.bg
            )}
          >
            {isUrgent ? (
              <AlertTriangle className={cn('h-5 w-5', typeConfig.color)} />
            ) : (
              <Megaphone className={cn('h-5 w-5', typeConfig.color)} />
            )}
          </div>

          {/* Title + badges */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <h3
                  className={cn(
                    'text-sm font-semibold leading-snug',
                    !isRead ? 'text-gray-900' : 'text-gray-700'
                  )}
                >
                  {title}
                </h3>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  <Badge
                    className={cn(
                      'text-[10px] border-0 font-medium',
                      typeConfig.bg,
                      typeConfig.color
                    )}
                  >
                    {typeConfig.label}
                  </Badge>
                  <Badge
                    variant="outline"
                    className="text-[10px] font-medium"
                  >
                    {TARGET_CONFIG[target] || target}
                  </Badge>
                  {status && status !== 'PUBLISHED' && (
                    <Badge
                      variant="outline"
                      className={cn(
                        'text-[10px] font-medium',
                        status === 'DRAFT'
                          ? 'border-gray-300 text-gray-500'
                          : 'border-amber-300 text-amber-600'
                      )}
                    >
                      {status}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Actions */}
              {showActions && (
                <div className="flex items-center gap-1 shrink-0">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-portal-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEdit();
                      }}
                    >
                      <Edit className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-red-500"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDelete();
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {onPublish && status === 'DRAFT' && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 text-gray-400 hover:text-green-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        onPublish();
                      }}
                    >
                      <Send className="h-3.5 w-3.5" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Cover Image */}
        {coverImage && (
          <div className="mt-3 rounded-xl overflow-hidden">
            <img
              src={coverImage}
              alt={title}
              className="w-full h-40 object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="mt-3 text-sm text-gray-600 leading-relaxed">
          <p className="whitespace-pre-line">{displayContent}</p>
          {isLongContent && (
            <Button
              variant="link"
              size="sm"
              className="text-xs text-portal-600 p-0 h-auto mt-1"
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? (
                <>
                  Show less <ChevronUp className="h-3 w-3 ml-0.5" />
                </>
              ) : (
                <>
                  Read more <ChevronDown className="h-3 w-3 ml-0.5" />
                </>
              )}
            </Button>
          )}
        </div>

        {/* Attachments */}
        {parsedAttachments.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-2">
            {parsedAttachments.map((att, idx) => (
              <a
                key={idx}
                href={att}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-portal-600 hover:text-portal-700 bg-portal-50 px-2 py-1 rounded-lg"
                onClick={(e) => e.stopPropagation()}
              >
                <Paperclip className="h-3 w-3" />
                <Download className="h-3 w-3" />
                Attachment {idx + 1}
              </a>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] text-gray-500">
            <Clock className="h-3 w-3" />
            <span>
              {publishedAt
                ? formatDistanceToNow(new Date(publishedAt), { addSuffix: true })
                : formatDistanceToNow(new Date(createdAt), { addSuffix: true })}
            </span>
            {creator && (
              <span className="text-gray-400">by {creator.name}</span>
            )}
          </div>
          {totalRecipients > 0 && (
            <div className="flex items-center gap-1.5">
              <Eye className="h-3 w-3 text-gray-400" />
              <span className="text-[11px] text-gray-500">
                {readCount}/{totalRecipients}
              </span>
            </div>
          )}
        </div>

        {/* Read Progress Bar */}
        {totalRecipients > 0 && (
          <div className="mt-2">
            <Progress value={readPercent} className="h-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
