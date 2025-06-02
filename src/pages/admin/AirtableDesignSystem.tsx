import React from "react";
import { AirtableCard, AirtableCardHeader, AirtableCardTitle, AirtableCardContent } from "@/components/ui/airtable-card";

const AirtableDesignSystem = () => {
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
          {/* Colors Section */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Colors</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-lg mb-2 mx-auto"></div>
                  <p className="text-sm text-gray-600">Gray 100</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg mb-2 mx-auto"></div>
                  <p className="text-sm text-gray-600">Gray 200</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-300 rounded-lg mb-2 mx-auto"></div>
                  <p className="text-sm text-gray-600">Gray 300</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-600 rounded-lg mb-2 mx-auto"></div>
                  <p className="text-sm text-gray-600">Gray 600</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-gray-900 rounded-lg mb-2 mx-auto"></div>
                  <p className="text-sm text-gray-600">Gray 900</p>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-lg mb-2 mx-auto"></div>
                  <p className="text-sm text-gray-600">Purple 600</p>
                </div>
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Typography Section */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Typography</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="space-y-6">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Page Title (3xl, bold)</h1>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-3xl font-bold text-gray-900</code>
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">Section Title (xl, semibold)</h2>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-xl font-semibold text-gray-900</code>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Description text (sm, gray-600)</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-sm text-gray-600</code>
                </div>
                <div>
                  <p className="text-base text-gray-900 mb-2">Body text (base, gray-900)</p>
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">text-base text-gray-900</code>
                </div>
              </div>
            </AirtableCardContent>
          </AirtableCard>

          {/* Icons Section */}
          <AirtableCard>
            <AirtableCardHeader>
              <AirtableCardTitle>Icons & Glyphs</AirtableCardTitle>
            </AirtableCardHeader>
            <AirtableCardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {/* Text Formatting Icons */}
                <div className="text-center">
                  <img src="/design-system/Glyph=bold, Size=default.svg" alt="Bold" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Bold (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=bold, Size=micro.svg" alt="Bold Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Bold (micro)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=italic, Size=default.svg" alt="Italic" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Italic (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=italic, Size=micro.svg" alt="Italic Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Italic (micro)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=underline, Size=default.svg" alt="Underline" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Underline (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=underline, Size=micro.svg" alt="Underline Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Underline (micro)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=strikethrough, Size=default.svg" alt="Strikethrough" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Strikethrough (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=strikethrough, Size=micro.svg" alt="Strikethrough Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Strikethrough (micro)</p>
                </div>

                {/* Indentation Icons */}
                <div className="text-center">
                  <img src="/design-system/Glyph=indent, Size=default.svg" alt="Indent" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Indent (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=indent, Size=micro.svg" alt="Indent Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Indent (micro)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=dedent, Size=default.svg" alt="Dedent" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Dedent (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=dedent, Size=micro.svg" alt="Dedent Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Dedent (micro)</p>
                </div>

                {/* Form Controls */}
                <div className="text-center">
                  <img src="/design-system/Glyph=radio, Size=default.svg" alt="Radio" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Radio (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=radio, Size=micro.svg" alt="Radio Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Radio (micro)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=radioSelected, Size=default.svg" alt="Radio Selected" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Radio Selected (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=radioSelected, Size=micro.svg" alt="Radio Selected Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Radio Selected (micro)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=checkboxChecked, Size=micro.svg" alt="Checkbox Checked" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Checkbox Checked (micro)</p>
                </div>

                {/* Other Icons */}
                <div className="text-center">
                  <img src="/design-system/Glyph=tabs, Size=default.svg" alt="Tabs" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Tabs (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=hyperlinkCancel, Size=default.svg" alt="Hyperlink Cancel" className="w-4 h-4 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Hyperlink Cancel (default)</p>
                </div>
                <div className="text-center">
                  <img src="/design-system/Glyph=hyperlinkCancel, Size=micro.svg" alt="Hyperlink Cancel Micro" className="w-3 h-3 mx-auto mb-2" />
                  <p className="text-xs text-gray-600">Hyperlink Cancel (micro)</p>
                </div>
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
        </div>
      </div>
    </div>
  );
};

export default AirtableDesignSystem;
