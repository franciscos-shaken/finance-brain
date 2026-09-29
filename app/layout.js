import "./globals.css";

export const metadata = {
  title: "Finance Brain",
  description: "Finance Brain — Grupo Shaken",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
