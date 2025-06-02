import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Lightbulb } from "lucide-react";
import { ProblemDetail } from "@/types";
import { useState } from "react";

interface ProblemDescriptionProps {
  problem: ProblemDetail;
  onHintUsed: () => void;
}

export function ProblemDescription({ problem, onHintUsed }: ProblemDescriptionProps) {
  const [hintsRevealed, setHintsRevealed] = useState(0);

  const handleShowHint = () => {
    if (hintsRevealed < problem.hints.length) {
      setHintsRevealed(hintsRevealed + 1);
      onHintUsed();
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return 'bg-emerald-100 text-emerald-800';
      case 'medium':
        return 'bg-amber-100 text-amber-800';
      case 'hard':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="w-96 bg-white border-r border-gray-200 flex flex-col">
      <div className="p-6 border-b border-gray-100">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">{problem.title}</h2>
        <div className="flex items-center space-x-4 text-sm">
          <Badge className={getDifficultyColor(problem.difficulty)}>
            {problem.difficulty.charAt(0).toUpperCase() + problem.difficulty.slice(1)}
          </Badge>
          <span className="text-gray-500">Problem {problem.order_index}</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        <div className="prose prose-sm max-w-none">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">Problem Statement</h3>
          <div className="text-sm text-gray-700 mb-4">
            {(() => {
              const lines = problem.description.split('\n');
              const elements = [];
              let inCodeBlock = false;
              let codeBlockLines = [];
              
              for (let i = 0; i < lines.length; i++) {
                const line = lines[i];
                
                // Handle code block start/end
                if (line.startsWith('```')) {
                  if (inCodeBlock) {
                    // End of code block - render accumulated code
                    elements.push(
                      <div key={`code-${i}`} className="bg-gray-50 border border-gray-200 rounded-lg p-3 font-mono text-sm mb-3 overflow-x-auto">
                        {codeBlockLines.map((codeLine, lineIndex) => (
                          <div key={lineIndex} className="text-gray-800">
                            {codeLine || '\u00A0'} {/* Non-breaking space for empty lines */}
                          </div>
                        ))}
                      </div>
                    );
                    codeBlockLines = [];
                    inCodeBlock = false;
                  } else {
                    // Start of code block
                    inCodeBlock = true;
                  }
                  continue;
                }
                
                // If we're in a code block, accumulate lines
                if (inCodeBlock) {
                  codeBlockLines.push(line);
                  continue;
                }
                
                // Handle bold text (difficulty levels and titles)
                if (line.startsWith('**') && line.endsWith('**') && line.length > 4) {
                  const text = line.slice(2, -2);
                  
                  // Check if it's a difficulty level
                  if (text === 'Easy' || text === 'Medium' || text === 'Hard') {
                    const difficultyColors = {
                      'Easy': 'bg-emerald-100 text-emerald-700 border-emerald-200',
                      'Medium': 'bg-amber-100 text-amber-700 border-amber-200', 
                      'Hard': 'bg-rose-100 text-rose-700 border-rose-200'
                    };
                    elements.push(
                      <span key={i} className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${difficultyColors[text as keyof typeof difficultyColors]} mb-3`}>
                        {text}
                      </span>
                    );
                  } else {
                    // Regular bold text (like problem titles)
                    elements.push(
                      <h2 key={i} className="font-semibold text-slate-900 mb-3 text-lg">
                        {text}
                      </h2>
                    );
                  }
                  continue;
                }
                
                // Handle bullet points
                if (line.startsWith('- ')) {
                  elements.push(
                    <div key={i} className="ml-4 mb-1 flex items-start">
                      <span className="text-gray-500 mr-2">•</span>
                      <span>{line.slice(2)}</span>
                    </div>
                  );
                  continue;
                }
                
                // Handle section headers (Description:, Example:, etc.)
                if (line.includes(':')) {
                  const cleanLine = line.replace(/^\*\*/, '').replace(/\*\*$/, '').replace(/\*\*/g, '');
                  if (cleanLine.includes('Description') || cleanLine.includes('Example') || cleanLine.includes('Skills') || cleanLine.includes('Objective')) {
                    elements.push(
                      <h3 key={i} className="font-medium text-slate-800 text-sm uppercase tracking-wide mb-2 mt-4 border-b border-slate-200 pb-1">
                        {cleanLine}
                      </h3>
                    );
                    continue;
                  }
                }
                
                // Handle empty lines
                if (line.trim() === '') {
                  elements.push(<div key={i} className="mb-2" />);
                  continue;
                }
                
                // Regular text
                elements.push(
                  <p key={i} className="text-slate-700 leading-relaxed mb-2">
                    {line}
                  </p>
                );
              }
              
              return elements;
            })()}
          </div>

          {/* Example section if present in description */}
          {problem.description.includes('Example:') && (
            <div className="bg-gray-100 rounded-lg p-3 font-mono text-sm">
              <div className="text-gray-600"># Example usage will be shown here</div>
            </div>
          )}
        </div>
      </div>

      {/* Hint System */}
      <div className="border-t border-gray-100 p-4">
        {hintsRevealed < problem.hints.length ? (
          <Button
            onClick={handleShowHint}
            variant="outline"
            className="w-full bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-800"
          >
            <Lightbulb className="w-4 h-4 mr-2" />
            Need a hint? ({problem.hints.length - hintsRevealed} remaining)
          </Button>
        ) : (
          <div className="text-center text-sm text-gray-500">
            All hints revealed
          </div>
        )}
        
        {/* Revealed Hints */}
        {hintsRevealed > 0 && (
          <div className="mt-3 space-y-2">
            {problem.hints.slice(0, hintsRevealed).map((hint, index) => (
              <Card key={index} className="bg-amber-50 border-amber-200">
                <CardContent className="p-3">
                  <div className="text-xs font-medium text-amber-800 mb-1">
                    Hint {index + 1}:
                  </div>
                  <p className="text-sm text-amber-700">{hint}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
