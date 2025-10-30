interface TextCounterProps {
  text: string;
  maxChars?: number;
  minWords?: number;
  showWords?: boolean;
  showChars?: boolean;
}

export const TextCounter = ({
  text,
  maxChars,
  minWords,
  showWords = false,
  showChars = true,
}: TextCounterProps) => {
  const charCount = text.length;
  const wordCount = text.trim().split(/\s+/).filter(Boolean).length;

  const isWordCountValid = !minWords || wordCount >= minWords;
  const isCharCountValid = !maxChars || charCount <= maxChars;

  return (
    <div className="flex gap-3 text-xs text-right">
      {showWords && (
        <span className={isWordCountValid ? "text-gray-500" : "text-red-500"}>
          {wordCount} {minWords && `/ ${minWords}`} words
        </span>
      )}
      {showChars && maxChars && (
        <span className={isCharCountValid ? "text-gray-500" : "text-red-500"}>
          {charCount} / {maxChars} characters
        </span>
      )}
    </div>
  );
};
