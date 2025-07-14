import type { Metadata } from "next";
import { Inter, Poppins } from "next/font/google";
import "./globals.css";

const inter = Inter({ 
  subsets: ["latin"],
  variable: "--font-inter",
});

const poppins = Poppins({ 
  weight: ["300", "400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "Aragon Kitchen Flow - Sistema de Gestão Inteligente",
  description: "Sistema moderno para gerenciar solicitações de mercadorias e insumos com eficiência e elegância",
  keywords: "gestão, restaurante, solicitações, mercadorias, insumos, aragon",
  authors: [{ name: "Aragon Kitchen Flow" }],
  viewport: "width=device-width, initial-scale=1",
  themeColor: "#8B5FBF",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} ${poppins.variable} font-sans antialiased`}>
        <div className="relative min-h-screen">
          {/* Background decoration */}
          <div className="fixed inset-0 -z-10">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50/30 via-blue-50/20 to-indigo-50/30" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-400/10 rounded-full blur-3xl animate-pulse-slow" />
            <div className="absolute bottom-0 left-0 w-96 h-96 bg-gradient-to-tr from-blue-400/10 to-cyan-400/10 rounded-full blur-3xl animate-pulse-slow" style={{animationDelay: "2s"}} />
          </div>
          
          <main className="relative">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}