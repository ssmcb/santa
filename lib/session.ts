import { getIronSession, IronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export type SessionData = {
  participantId?: string;
  isLoggedIn: boolean;
};

if (!process.env.SESSION_SECRET) {
  throw new Error('SESSION_SECRET must be set in environment variables');
}

const sessionOptions: SessionOptions = {
  password: process.env.SESSION_SECRET,
  cookieName: 'secret-santa-session',
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
  },
};

export async function getSession(): Promise<IronSession<SessionData>> {
  const cookieStore = await cookies();
  return getIronSession<SessionData>(cookieStore, sessionOptions);
}

export async function destroySession(): Promise<void> {
  const session = await getSession();
  session.destroy();
}
