export const metadata = {
  title: "Finance Brain",
  description: "Finance Brain — Olá, mundo",
};

export default function RootLayout({ children }) {
  return (
    <html lang="pt">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, padding: "2rem" }}>
        {children}
      </body>
    </html>
  );
}
