// src/components/ui/Footer.tsx

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer">
      <p>
        © {currentYear} Football Hub. Все права защищены.
      </p>
      <p style={{ marginTop: "0.5rem" }}>
        <a 
          href="https://github.com/Cyber-bober/Fullstack-website" 
          target="_blank" 
          rel="noopener noreferrer"
          style={{ color: "#0070f3" }}
        >
          Исходный код на GitHub
        </a>
      </p>
    </footer>
  );
}