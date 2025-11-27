'use client';

import { memo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Gift } from 'lucide-react';
import { Participant } from '@/types/shared';

type MyAssignmentCardProps = {
  recipient: Participant;
  title: string;
};

export const MyAssignmentCard = memo(function MyAssignmentCard({
  recipient,
  title,
}: MyAssignmentCardProps) {
  return (
    <Card className="border-2 border-green-500">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold flex items-center gap-2">
          <Gift className="w-8 h-8" />
          {recipient.name}
        </p>
      </CardContent>
    </Card>
  );
});

MyAssignmentCard.displayName = 'MyAssignmentCard';
