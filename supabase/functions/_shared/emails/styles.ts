// Shared email styles matching Opener Studio design system
// Colors converted from HSL to hex for email client compatibility
// Edit this manually when updating CSS variables in src/index.css

export const sharedStyles = {
  // Main body background
  main: {
    backgroundColor: "#f4f4f7", // Matching email template background
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol'",
    margin: "0",
    padding: "0",
  },

  // Main email container (table wrapper)
  container: {
    maxWidth: "600px",
    margin: "20px auto",
    backgroundColor: "#ffffff", // --card: 0 0% 100%
    borderRadius: "8px",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
  },

  // Logo section
  logoSection: {
    padding: "40px 0 30px 0",
    textAlign: "center" as const,
  },

  // Logo image
  logo: {
    display: "block",
    width: "150px",
    height: "auto",
    margin: "0 auto",
  },

  // Main content section
  contentSection: {
    padding: "0 30px 40px 30px",
  },

  // Heading (uses SF Pro Display equivalent styling)
  heading: {
    fontSize: "24px",
    fontWeight: "bold",
    color: "#333333", // Slightly lighter than pure black for readability
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    marginBottom: "20px",
    marginTop: "0",
  },

  // Paragraph text
  paragraph: {
    fontSize: "16px",
    lineHeight: "1.6",
    color: "#555555", // Softer than pure black
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    marginBottom: "16px",
    marginTop: "0",
  },

  // Small paragraph text (for footer-like content)
  paragraphSmall: {
    fontSize: "14px",
    lineHeight: "1.6",
    color: "#555555",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    marginBottom: "16px",
    marginTop: "0",
  },

  // Button container (for centering)
  buttonContainer: {
    padding: "20px 0",
    textAlign: "center" as const,
  },

  // Primary button (matches --primary: 266 49% 33% = #542C7C)
  button: {
    backgroundColor: "#542C7C", // Primary purple
    borderRadius: "5px", // Matching template
    color: "#ffffff", // --primary-foreground: 0 0% 100%
    padding: "12px 25px",
    fontWeight: "bold",
    textDecoration: "none",
    display: "inline-block",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    fontSize: "16px",
  },

  // Footer horizontal rule
  footerHr: {
    borderColor: "#e6e6e6",
    margin: "30px 0 20px 0",
    borderWidth: "1px",
    borderStyle: "solid",
  },

  // Footer section
  footerSection: {
    padding: "0 30px 20px 30px",
    textAlign: "center" as const,
  },

  // Footer text
  footer: {
    color: "#888888",
    fontSize: "12px",
    lineHeight: "1.6",
    fontFamily:
      "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif",
    margin: "8px 0",
  },

  // Footer link styling
  footerLink: {
    color: "#888888",
    textDecoration: "underline",
  },

  // Link styling
  link: {
    color: "#542C7C", // Primary purple
    textDecoration: "underline",
  },
};

