import React from "react";
import { Box, Typography } from "@mui/material";

function MessageBubble({ message, isOwnMessage }) {
  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isFile = message.type === "file" && message.fileUrl;

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: isOwnMessage ? "flex-end" : "flex-start",
        my: 0.5,
      }}
    >
      <Box
        sx={{
          maxWidth: "70%",
          px: 1.5,
          py: 1,
          borderRadius: 2,
          bgcolor: isOwnMessage ? "#1565c0" : "#ffffff",
          color: isOwnMessage ? "#ffffff" : "#000",
          boxShadow: 1,
          wordBreak: "break-word",
        }}
      >
        {isFile ? (
          <a
            href={message.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              textDecoration: "none",
              color: isOwnMessage ? "#ffffff" : "#1565c0",
              fontWeight: 500,
            }}
          >
            📎 {message.fileName || "Open file"}
          </a>
        ) : (
          <Typography sx={{ fontSize: 14 }}>
            {message.content}
          </Typography>
        )}
        
        <Typography
          sx={{
            display: "block",
            mt: 0.5,
            fontSize: 10,
            color: isOwnMessage ? "#bbdefb" : "#757575",
            textAlign: "right",
          }}
        >
          {time}
        </Typography>
      </Box>
    </Box>
  );
}

export default MessageBubble;
