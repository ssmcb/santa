import { redirect } from 'next/navigation';
import { getSession } from './session';
import { connectDB } from './db/mongodb';
import { Participant } from './db/models/Participant';

export async function requireAuth(locale: string) {
  const session = await getSession();

  if (!session.isLoggedIn || !session.participantId) {
    redirect(`/${locale}/get-started`);
  }

  return session;
}

export async function getAuthenticatedParticipant(locale: string) {
  const session = await requireAuth(locale);

  await connectDB();
  const participant = await Participant.findById(session.participantId);

  if (!participant) {
    redirect(`/${locale}/get-started`);
  }

  return participant;
}

export async function checkGroupOwnership(
  participantEmail: string,
  groupOwnerEmail: string
): Promise<boolean> {
  return participantEmail.toLowerCase() === groupOwnerEmail.toLowerCase();
}
