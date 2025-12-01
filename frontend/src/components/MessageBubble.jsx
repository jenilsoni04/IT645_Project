import React from "react";

function MessageBubble({ message, isOwnMessage }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFile = message.type === "file" && message.fileUrl;
  const isPDF = message.fileName?.toLowerCase().endsWith('.pdf');
  const fileExtension = message.fileName?.split('.').pop()?.toLowerCase() || '';

  const handleFileDownload = (e) => {
    e.preventDefault();
    if (message.fileUrl) {
      // Create a temporary anchor element to trigger download
      const link = document.createElement('a');
      link.href = message.fileUrl;
      link.download = message.fileName || 'download';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const getFileIcon = () => {
    if (isPDF) return '📄';
    if (['doc', 'docx'].includes(fileExtension)) return '📝';
    if (['jpg', 'jpeg', 'png', 'gif'].includes(fileExtension)) return '🖼️';
    return '📎';
  };

  return (
    <div
      className={`flex ${isOwnMessage ? "justify-end" : "justify-start"} my-1`}
    >
      <div
        className={`max-w-[70%] px-3 py-2 rounded-lg shadow-sm ${
          isOwnMessage
            ? "bg-blue-700 text-white"
            : "bg-white text-gray-900"
        } break-words`}
      >
        {isFile ? (
          <div className="flex flex-col gap-1">
            <a
              href={message.fileUrl}
              onClick={handleFileDownload}
              target="_blank"
              rel="noopener noreferrer"
              className={`font-medium flex items-center gap-2 ${
                isOwnMessage ? "text-white hover:text-blue-200" : "text-blue-700 hover:text-blue-800"
              } transition-colors`}
            >
              <span>{getFileIcon()}</span>
              <span className="underline">{message.fileName || "Open file"}</span>
            </a>
            {message.content && message.content !== message.fileName && (
              <p className={`text-xs ${isOwnMessage ? "text-blue-200" : "text-gray-600"}`}>
                {message.content}
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm">{message.content}</p>
        )}
        
        <p
          className={`block mt-1 text-[10px] text-right ${
            isOwnMessage ? "text-blue-200" : "text-gray-500"
          }`}
        >
          {time}
        </p>
      </div>
    </div>
  );
}

export default MessageBubble;
