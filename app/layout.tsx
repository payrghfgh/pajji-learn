// app/layout.tsx

export const metadata = {
  title: "Pajji Learn", // This changes the text on the tab
  description: "Pajji's Learning Empire", // This is for Google search results
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}