import React, { useState } from 'react';
import { Section } from '../types/pdf-viewer-types';

interface DocumentAccordionProps {
  sections: Section[];
  title?: string;
}

const DocumentAccordion: React.FC<DocumentAccordionProps> = ({
  sections,
  title = 'Document Sections'
}) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleSection = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="document-accordion">
      <h3 className="mb-2 px-4 pt-3 text-sm font-medium">{title}</h3>
      <div className="accordion-sections">
        {sections.map((section, index) => (
          <div key={index} className="border-t border-gray-200">
            <button
              className={`flex w-full items-center justify-between px-4 py-2 text-left text-sm font-medium transition-colors ${
                openIndex === index
                  ? 'bg-blue-50 text-blue-700'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => toggleSection(index)}
            >
              <span>{section.clause}</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className={`h-4 w-4 transition-transform ${
                  openIndex === index ? 'rotate-180 transform' : ''
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all ${
                openIndex === index ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="bg-gray-50 p-4 text-sm text-gray-700">
                {section.text}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DocumentAccordion;
