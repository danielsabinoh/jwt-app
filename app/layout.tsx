import type { ReactNode } from 'react';
import './globals.css';

export const metadata = {
    title: 'Biblioteca',
    description: 'Gestão de acervo e empréstimos'
};

export default function RootLayout({ children }: { children: ReactNode }) {
    return <html lang="pt-BR"><body>{children}</body></html>;
}
