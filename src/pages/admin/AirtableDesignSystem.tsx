
import React from "react";
import { AirtableCard, AirtableCardHeader, AirtableCardTitle, AirtableCardContent } from "@/components/ui/airtable-card";

const AirtableDesignSystem = () => {
  // Color palette from design tokens
  const colorTokens = {
    primary: {
      black: "#0f0f0f",
      "dark gray 1": "#292929", 
      "dark gray 2": "#424242",
      "dark gray 3": "#5c5c5c",
      light: "#757575",
      white: "#ffffff",
      dark: "#333333"
    },
    grays: {
      "light gray 1": "#fafafa",
      "light gray 2": "#f2f2f2", 
      "light gray 3": "#e8e8e8",
      "light gray 4": "#e0e0e0",
      "light gray 5": "#d1d1d1",
      gray: "#666666",
      "gray dark 1": "#444444",
      "gray light 1": "#cccccc", 
      "gray light 2": "#eeeeee"
    },
    yellow: {
      "yellow bright": "#fcb400",
      yellow: "#e08d00",
      "yellow dark 1": "#b87503",
      "yellow light 1": "#ffd66e",
      "yellow light 2": "#ffeab6"
    },
    orange: {
      "orange bright": "#ff6f2c",
      orange: "#f7653b", 
      "orange dark 1": "#d74d26",
      "orange light 1": "#ffa981",
      "orange light 2": "#fee2d5"
    },
    red: {
      "red bright": "#f82b60",
      red: "#ef3061",
      "red dark 1": "#ba1e45",
      "red light 1": "#ff9eb7",
      "red light 2": "#ffdce5"
    },
    pink: {
      "pink bright": "#ff08c2",
      pink: "#e929ba",
      "pink dark 1": "#b2158b", 
      "pink light 1": "#f99de2",
      "pink light 2": "#ffdaf6"
    },
    purple: {
      "purple bright": "#8b46ff",
      purple: "#7c39ed",
      "purple dark 1": "#6b1cb0",
      "purple light 1": "#cdb0ff",
      "purple light 2": "#ede3fe"
    },
    blue: {
      "blue bright": "#2d7ff9",
      blue: "#1283da",
      "blue dark 1": "#2750ae", 
      "blue light 1": "#9cc7ff",
      "blue light 2": "#cfdff"
    },
    cyan: {
      "cyan bright": "#18bfff",
      cyan: "#01a9db",
      "cyan dark 1": "#0b76b7",
      "cyan light 1": "#77d1f3",
      "cyan light 2": "#d0f0fd"
    },
    teal: {
      "teal bright": "#20d9d2", 
      teal: "#02aaa4",
      "teal dark 1": "#06a09b",
      "teal light 1": "#72ddc3",
      "teal light 2": "#c2f5e9"
    },
    green: {
      "green bright": "#20c933",
      green: "#11af22",
      "green dark 1": "#338a17",
      "green light 1": "#93e088",
      "green light 2": "#d1f7c4"
    }
  };

  // Available SVG icons from the design-system folder
  const svgIcons = [
    { name: "Bold (default)", path: "/design-system/Glyph=bold, Size=default.svg", size: "w-4 h-4" },
    { name: "Bold (micro)", path: "/design-system/Glyph=bold, Size=micro.svg", size: "w-3 h-3" },
    { name: "Italic (default)", path: "/design-system/Glyph=italic, Size=default.svg", size: "w-4 h-4" },
    { name: "Italic (micro)", path: "/design-system/Glyph=italic, Size=micro.svg", size: "w-3 h-3" },
    { name: "Underline (default)", path: "/design-system/Glyph=underline, Size=default.svg", size: "w-4 h-4" },
    { name: "Underline (micro)", path: "/design-system/Glyph=underline, Size=micro.svg", size: "w-3 h-3" },
    { name: "Strikethrough (default)", path: "/design-system/Glyph=strikethrough, Size=default.svg", size: "w-4 h-4" },
    { name: "Strikethrough (micro)", path: "/design-system/Glyph=strikethrough, Size=micro.svg", size: "w-3 h-3" },
    { name: "Indent (default)", path: "/design-system/Glyph=indent, Size=default.svg", size: "w-4 h-4" },
    { name: "Indent (micro)", path: "/design-system/Glyph=indent, Size=micro.svg", size: "w-3 h-3" },
    { name: "Dedent (default)", path: "/design-system/Glyph=dedent, Size=default.svg", size: "w-4 h-4" },
    { name: "Dedent (micro)", path: "/design-system/Glyph=dedent, Size=micro.svg", size: "w-3 h-3" },
    { name: "Radio (default)", path: "/design-system/Glyph=radio, Size=default.svg", size: "w-4 h-4" },
    { name: "Radio (micro)", path: "/design-system/Glyph=radio, Size=micro.svg", size: "w-3 h-3" },
    { name: "Radio Selected (default)", path: "/design-system/Glyph=radioSelected, Size=default.svg", size: "w-4 h-4" },
    { name: "Radio Selected (micro)", path: "/design-system/Glyph=radioSelected, Size=micro.svg", size: "w-3 h-3" },
    { name: "Checkbox Checked (micro)", path: "/design-system/Glyph=checkboxChecked, Size=micro.svg", size: "w-3 h-3" },
    { name: "Tabs (default)", path: "/design-system/Glyph=tabs, Size=default.svg", size: "w-4 h-4" },
    { name: "Hyperlink Cancel (default)", path: "/design-system/Glyph=hyperlinkCancel, Size=default.svg", size: "w-4 h-4" },
    { name: "Hyperlink Cancel (micro)", path: "/design-system/Glyph=hyperlinkCancel, Size=micro.svg", size: "w-3 h-3" }
  ];

  // Typography scales from design tokens
  const typography = {
    text: {
      small: { fontSize: "11px", lineHeight: "14px", fontWeight: 400 },
      default: { fontSize: "13px", lineHeight: "16px", fontWeight: 400 },
      large: { fontSize: "15px", lineHeight: "20px", fontWeight: 400 },
      xlarge: { fontSize: "17px", lineHeight: "24px", fontWeight: 400 }
    },
    heading: {
      xsmall: { fontSize: "15px", lineHeight: "22px", fontWeight: 700 },
      small: { fontSize: "17px", lineHeight: "24px", fontWeight: 600 },
      default: { fontSize: "21px", lineHeight: "26px", fontWeight: 500, fontFamily: "SF Pro Display" },
      large: { fontSize: "23px", lineHeight: "29px", fontWeight: 500, fontFamily: "SF Pro Display" },
      xlarge: { fontSize: "27px", lineHeight: "34px", fontWeight: 500, fontFamily: "SF Pro Display" },
      xxlarge: { fontSize: "35px", lineHeight: "44px", fontWeight: 500, fontFamily: "SF Pro Display" }
    },
    label: {
      default: { fontSize: "13px", lineHeight: "16px", fontWeight: 500 }
    }
  };

  const ColorSwatch = ({ name, color }: { name: string; color: string }) => (
    <div className="text-center">
      <div 
        className="w-16 h-16 rounded-lg mb-2 mx-auto border border-gray-200" 
        style={{ backgroundColor: color }}
      ></div>
      <p className="text-xs text-gray-600 font-medium">{name}</p>
      <p className="text-xs text-gray-500 font-mono">{color}</p>
    </div>
  );

  const TypographyExample = ({ name, style }: { name: string; style: any }) => (
    <div className="mb-4">
      <div style={style} className="mb-1">
        {name} - The quick brown fox jumps
      </div>
      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
        {style.fontSize} / {style.lineHeight} / {style.fontWeight}
        {style.fontFamily && ` / ${style.fontFamily}`}
      </code>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Airtable Design System</h1>
          <p className="text-gray-600">
            Complete showcase of Airtable design system elements including colors, typography, icons, and components
          </p>
        </div>

        <div className="grid gap-8">
          {/* Primary Colors */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Primary Colors</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
                {Object.entries(colorTokens.primary).map(([name, color]) => (
                  <ColorSwatch key={name} name={name} color={color} />
                ))}
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Gray Scale */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Gray Scale</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {Object.entries(colorTokens.grays).map(([name, color]) => (
                  <ColorSwatch key={name} name={name} color={color} />
                ))}
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Brand Colors */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Brand Color Palette</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="space-y-6">
                {Object.entries(colorTokens).filter(([key]) => !['primary', 'grays'].includes(key)).map(([colorFamily, colors]) => (
                  <div key={colorFamily}>
                    <h4 className="font-semibold text-gray-900 mb-3 capitalize">{colorFamily}</h4>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(colors as Record<string, string>).map(([name, color]) => (
                        <ColorSwatch key={name} name={name} color={color} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Typography System */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Typography System</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="space-y-8">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Headings</h4>
                  <div className="space-y-3">
                    {Object.entries(typography.heading).map(([name, style]) => (
                      <TypographyExample key={name} name={`Heading ${name}`} style={style} />
                    ))}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Body Text</h4>
                  <div className="space-y-3">
                    {Object.entries(typography.text).map(([name, style]) => (
                      <TypographyExample key={name} name={`Text ${name}`} style={style} />
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Labels</h4>
                  <div className="space-y-3">
                    {Object.entries(typography.label).map(([name, style]) => (
                      <TypographyExample key={name} name={`Label ${name}`} style={style} />
                    ))}
                  </div>
                </div>
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Icons & Glyphs */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Icons & Glyphs</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                {svgIcons.map((icon, index) => (
                  <div key={index} className="text-center">
                    <div className="flex items-center justify-center h-12 mb-2">
                      <img 
                        src={icon.path} 
                        alt={icon.name} 
                        className={icon.size}
                      />
                    </div>
                    <p className="text-xs text-gray-600 font-medium">{icon.name}</p>
                    <code className="text-xs text-gray-500 break-all">{icon.path}</code>
                  </div>
                ))}
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Airtable Card Component */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Airtable Card Component</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="space-y-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Example Airtable Card:</h4>
                  <AirtableCard className="max-w-md">
                    <AirtableCardHeader>
                      <AirtableCardTitle>Sample Card Title</AirtableCardTitle>
                    </AirtableCardHeader>
                    <AirtableCardContent>
                      <p className="text-sm text-gray-600">
                        This is an example of the Airtable card component with the characteristic
                        rounded borders, subtle shadow, and clean typography.
                      </p>
                    </AirtableCardContent>
                  </AirtableCard>
                </div>
                <div className="bg-gray-100 p-4 rounded text-sm font-mono">
                  <div>import &#123; AirtableCard, AirtableCardHeader, AirtableCardTitle, AirtableCardContent &#125; from "@/components/ui/airtable-card";</div>
                  <br />
                  <div>&lt;AirtableCard&gt;</div>
                  <div>&nbsp;&nbsp;&lt;AirtableCardHeader&gt;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;&lt;AirtableCardTitle&gt;Title&lt;/AirtableCardTitle&gt;</div>
                  <div>&nbsp;&nbsp;&lt;/AirtableCardHeader&gt;</div>
                  <div>&nbsp;&nbsp;&lt;AirtableCardContent&gt;</div>
                  <div>&nbsp;&nbsp;&nbsp;&nbsp;Content goes here</div>
                  <div>&nbsp;&nbsp;&lt;/AirtableCardContent&gt;</div>
                  <div>&lt;/AirtableCard&gt;</div>
                </div>
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Design Principles */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Design Principles</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Clean & Minimal</h4>
                  <p className="text-sm text-gray-600">
                    Airtable's design emphasizes clarity and simplicity with generous whitespace,
                    subtle borders, and a restrained color palette.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Consistent Spacing</h4>
                  <p className="text-sm text-gray-600">
                    Uses systematic spacing with 4px increments (p-1, p-2, p-4, p-6) for 
                    consistent rhythm throughout the interface.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Subtle Interactions</h4>
                  <p className="text-sm text-gray-600">
                    Hover states and transitions are gentle, using shadow changes and 
                    subtle color shifts rather than dramatic effects.
                  </p>
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">Functional Typography</h4>
                  <p className="text-sm text-gray-600">
                    Clear hierarchy with semibold headings, regular body text, and 
                    muted secondary text for optimal readability.
                  </p>
                </div>
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Design Tokens Reference */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Design Tokens Reference</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="space-y-4">
                <p className="text-sm text-gray-600">
                  All design tokens are available in <code className="bg-gray-100 px-1 rounded">/public/design-system/design-tokens.tokens.json</code>
                </p>
                <div className="grid md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium mb-2">Available Token Categories:</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Color tokens (all brand colors + semantic colors)</li>
                      <li>• Typography tokens (font sizes, weights, line heights)</li>
                      <li>• Font family definitions</li>
                      <li>• Custom font styles</li>
                    </ul>
                  </div>
                  <div>
                    <h5 className="font-medium mb-2">Available Icons:</h5>
                    <ul className="space-y-1 text-gray-600">
                      <li>• Text formatting icons (bold, italic, underline, strikethrough)</li>
                      <li>• Indentation controls (indent, dedent)</li>
                      <li>• Form controls (radio, checkbox, tabs)</li>
                      <li>• Action icons (hyperlink cancel)</li>
                      <li>• Available in default and micro sizes</li>
                    </ul>
                  </div>
                </div>
              </div>
            </AirtableCardContent>
          </AirtableCard>
        </div>
      </div>
    </div>
  );
};

export default AirtableDesignSystem;
