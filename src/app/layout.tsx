
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { FirebaseClientProvider } from "@/firebase";
import { FirebaseErrorListener } from "@/components/FirebaseErrorListener";
import { ProfessorSky } from "@/components/ProfessorSky";

export const metadata: Metadata = {
  title: 'skyX bound Academy',
  description: 'Elite academic journeys in the clouds!',
  icons: {
    icon: 'data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2230%22 fill=%22%23D64CE0%22/><path d=%22M25 25 L75 75 M75 25 L25 75%22 stroke=%22white%22 stroke-width=%2216%22 stroke-linecap=%22round%22/></svg>',
  }
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect width=%22100%22 height=%22100%22 rx=%2230%22 fill=%22%23D64CE0%22/><path d=%22M25 25 L75 75 M75 25 L25 75%22 stroke=%22white%22 stroke-width=%2216%22 stroke-linecap=%22round%22/></svg>" />
      </head>
      <body className="font-body antialiased selection:bg-secondary/30">
        <FirebaseClientProvider>
          <FirebaseErrorListener />
          <ProfessorSky />
          {children}
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
