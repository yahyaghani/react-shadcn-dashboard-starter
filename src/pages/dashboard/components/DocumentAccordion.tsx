import React, { useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Section {
  clause: string;
  text: string;
}

interface DocumentAccordionProps {
  sections: Section[];
  title?: string;
}

const DocumentAccordion: React.FC<DocumentAccordionProps> = ({
  sections,
  title = 'Document Sections'
}) => {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);

  // Handle expanding/collapsing all sections
  const handleExpandAll = () => {
    if (expandedItems.length === sections.length) {
      setExpandedItems([]);
    } else {
      setExpandedItems(sections.map((_, index) => `item-${index}`));
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{title}</CardTitle>
        <button
          onClick={handleExpandAll}
          className="text-sm text-blue-600 hover:text-blue-800"
        >
          {expandedItems.length === sections.length
            ? 'Collapse All'
            : 'Expand All'}
        </button>
      </CardHeader>
      <CardContent>
        {sections.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            No sections available for this document.
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="w-full"
          >
            {sections.map((section, index) => (
              <AccordionItem key={index} value={`item-${index}`}>
                <AccordionTrigger className="font-medium">
                  {section.clause}
                </AccordionTrigger>
                <AccordionContent>
                  <div className="whitespace-pre-wrap p-2 text-gray-700">
                    {section.text}
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
};

export default DocumentAccordion;
