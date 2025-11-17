// Shared email styles matching Opener Studio design system
// Colors converted from HSL to hex for email client compatibility
// Edit this manually when updating CSS variables in src/index.css

export const sharedStyles = {
  // Main container
  main: {
    backgroundColor: "#f5f5f5", // --background: 0 0% 96%
    fontFamily: "Inter, system-ui, sans-serif",
  },
  
  // Content container
  container: {
    margin: "0 auto",
    padding: "20px 0 48px",
    maxWidth: "580px",
    backgroundColor: "#ffffff", // --card: 0 0% 100%
  },
  
  // Heading (uses SF Pro Display equivalent styling)
  heading: {
    fontSize: "32px",
    fontWeight: "bold",
    color: "#0f0f0f", // --foreground: 0 0% 9%
    fontFamily: "system-ui, -apple-system, sans-serif", // SF Pro Display fallback
    marginBottom: "8px",
  },
  
  // Paragraph text
  paragraph: {
    fontSize: "16px",
    lineHeight: "26px",
    color: "#0f0f0f", // --foreground: 0 0% 9%
    fontFamily: "Inter, system-ui, sans-serif",
    marginBottom: "16px",
  },
  
  // Primary button (matches --primary: 266 49% 33% = #542C7C)
  button: {
    backgroundColor: "#542C7C", // Primary purple
    borderRadius: "8px", // --radius: 0.5rem
    color: "#ffffff", // --primary-foreground: 0 0% 100%
    padding: "12px 24px",
    fontWeight: "600",
    textDecoration: "none",
    display: "inline-block",
    fontFamily: "Inter, system-ui, sans-serif",
    fontSize: "16px",
    marginTop: "8px",
    marginBottom: "8px",
  },
  
  // Horizontal rule
  hr: {
    borderColor: "#e6e6e6", // --border: 0 0% 90.2%
    margin: "20px 0",
    borderWidth: "1px",
    borderStyle: "solid",
  },
  
  // Footer text
  footer: {
    color: "#737373", // --muted-foreground: 0 0% 45.1%
    fontSize: "14px",
    lineHeight: "20px",
    marginTop: "24px",
    fontFamily: "Inter, system-ui, sans-serif",
  },
  
  // Link styling
  link: {
    color: "#542C7C", // Primary purple
    textDecoration: "underline",
  },
};

