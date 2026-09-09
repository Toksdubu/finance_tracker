import { redirect } from 'next/navigation';

export default function HomePage() {
  // In our closed-loop architecture, unauthenticated traffic is immediately gated to /login
  redirect('/login');
}
