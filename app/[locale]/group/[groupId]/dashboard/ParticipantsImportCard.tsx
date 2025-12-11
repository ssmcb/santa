'use client';

import { useCallback, useMemo, useState } from 'react';
import { Upload } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useCSRF } from '@/lib/hooks/useCSRF';
import { Group } from '@/types/shared';

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type ParsedParticipant = {
  name: string;
  email: string;
};

type ParseResult = {
  participants: ParsedParticipant[];
  errors: string[];
};

type ParticipantsImportCardProps = {
  group: Group;
};

export function ParticipantsImportCard({ group }: ParticipantsImportCardProps) {
  const t = useTranslations('participants');
  const tCommon = useTranslations('common');
  const [selectedFileName, setSelectedFileName] = useState<string>('');
  const [parsedParticipants, setParsedParticipants] = useState<ParsedParticipant[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const router = useRouter();
  const { token: csrfToken } = useCSRF();

  const formatExample = useMemo(() => 'Name,Email\nJohn Doe,john@example.com', []);

  const parseCsvContent = useCallback((content: string): ParseResult => {
    const cleaned = content.replace(/\uFEFF/g, '').trim();
    if (!cleaned) return { participants: [], errors: [t('csvEmptyError')] };

    const rows = cleaned.split(/\r?\n/).filter((row) => row.trim().length > 0);
    if (rows.length === 0) return { participants: [], errors: [t('csvEmptyError')] };

    const [firstRow, ...rest] = rows;
    const hasHeader = /name/i.test(firstRow.split(/[,;]/)[0] || '') && /email/i.test(firstRow.split(/[,;]/)[1] || '');
    const dataRows = hasHeader ? rest : rows;

    const participants: ParsedParticipant[] = [];
    const errors: string[] = [];
    const seenEmails = new Set<string>();

    dataRows.forEach((row, index) => {
      const delimiter = row.includes(';') ? ';' : ',';
      const [rawName, rawEmail] = row.split(delimiter).map((value) => value.replace(/^\"|\"$/g, '').trim());

      if (!rawName || !rawEmail) {
        errors.push(t('csvMissingFields', { row: index + 1 }));
        return;
      }

      if (!emailRegex.test(rawEmail)) {
        errors.push(t('csvInvalidEmail', { email: rawEmail }));
        return;
      }

      const email = rawEmail.toLowerCase();
      if (seenEmails.has(email)) {
        return;
      }

      seenEmails.add(email);
      participants.push({ name: rawName, email });
    });

    return { participants, errors };
  }, [t]);

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      setFeedback(null);
      setParseErrors([]);

      if (!file) {
        setSelectedFileName('');
        setParsedParticipants([]);
        return;
      }

      setSelectedFileName(file.name);

      try {
        const text = await file.text();
        const result = parseCsvContent(text);
        setParsedParticipants(result.participants);
        setParseErrors(result.errors);
      } catch (error) {
        console.error('Failed to read CSV file', error);
        setParseErrors([t('csvReadError')]);
        setParsedParticipants([]);
      }
    },
    [parseCsvContent, t]
  );

  const handleImport = useCallback(async () => {
    if (!csrfToken) {
      setFeedback(t('csrfMissing'));
      return;
    }

    if (parsedParticipants.length === 0) {
      setFeedback(t('csvEmptyError'));
      return;
    }

    if (group.isDrawn) {
      setFeedback(t('importDisabledDrawn'));
      return;
    }

    setIsImporting(true);
    setFeedback(null);

    try {
      const response = await fetch('/api/group/import-participants', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': csrfToken,
        },
        body: JSON.stringify({
          groupId: group.id,
          participants: parsedParticipants,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || tCommon('error'));
      }

      const addedMessage = t('importSuccess', {
        added: result.addedCount ?? parsedParticipants.length,
        skipped: result.skippedExisting ?? 0,
      });

      setFeedback(addedMessage);
      router.refresh();
    } catch (error) {
      console.error('Import participants failed', error);
      setFeedback(error instanceof Error ? error.message : tCommon('error'));
    } finally {
      setIsImporting(false);
    }
  }, [csrfToken, group.id, group.isDrawn, parsedParticipants, router, t, tCommon]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="w-5 h-5" />
          {t('importTitle')}
        </CardTitle>
        <CardDescription>{t('importDescription')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Input type="file" accept=".csv" onChange={handleFileChange} />
          {selectedFileName && (
            <p className="text-sm text-muted-foreground">{t('selectedFile', { file: selectedFileName })}</p>
          )}
          <p className="text-xs text-muted-foreground whitespace-pre-wrap">{t('importFormat', { example: formatExample })}</p>
        </div>

        {parseErrors.length > 0 && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive space-y-1">
            {parseErrors.map((error, index) => (
              <p key={index}>{error}</p>
            ))}
          </div>
        )}

        {parsedParticipants.length > 0 && (
          <p className="text-sm text-muted-foreground">
            {t('importPreview', { count: parsedParticipants.length })}
          </p>
        )}

        <Button
          onClick={handleImport}
          disabled={isImporting || parsedParticipants.length === 0 || group.isDrawn}
          className="w-full md:w-auto"
        >
          {isImporting ? tCommon('loading') : t('importButton')}
        </Button>

        {group.isDrawn && (
          <p className="text-sm text-muted-foreground">{t('importDisabledDrawn')}</p>
        )}

        {feedback && (
          <div className="rounded-md border border-primary/20 bg-primary/10 p-3 text-sm text-primary-foreground dark:text-primary">
            {feedback}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
