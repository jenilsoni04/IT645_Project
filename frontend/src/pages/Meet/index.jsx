import React, { useState } from "react";
import { Box, Button, Container, Paper, Stack, TextField, Typography } from "@mui/material";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";

const extractMeetingId = (input) => {
  if (!input) return "";
  try {
    if (input.startsWith("http")) {
      const url = new URL(input);
      const parts = url.pathname.split("/").filter(Boolean);
      return parts[parts.length - 1] || "";
    }
  } catch (_) {
    console.warn("Invalid URL format");
  }
  return input.trim();
};

export default function MeetHome() {
  const navigate = useNavigate();
  const [joinValue, setJoinValue] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");

  const startMeeting = async () => {
    if (!token) {
      toast.error("Please log in to start a meeting");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      const res = await axios.post(
        "http://localhost:3000/meetings",
        { title: "" },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const meetingId = res.data?.meetingId;
      if (!meetingId) {
        throw new Error("Invalid response from server");
      }
      navigate(`/meet/${meetingId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to start meeting");
    } finally {
      setLoading(false);
    }
  };

  const joinMeeting = async () => {
    const id = extractMeetingId(joinValue);
    if (!id) {
      toast.error("Please enter a valid meeting link or ID");
      return;
    }
    if (!token) {
      toast.error("Please log in to join a meeting");
      navigate("/login");
      return;
    }
    try {
      setLoading(true);
      await axios.get(`http://localhost:3000/meetings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      navigate(`/meet/${id}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Meeting not found");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={2}
          sx={{
            p: { xs: 3, md: 4 },
            borderRadius: 3,
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Meet
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Start a new meeting or join with a link/ID.
          </Typography>

          <Stack spacing={2}>
            <Button
              variant="contained"
              size="large"
              onClick={startMeeting}
              disabled={loading}
              sx={{ textTransform: "none", borderRadius: 2 }}
            >
              {loading ? "Starting..." : "Start Meeting"}
            </Button>

            <Typography variant="overline" color="text.secondary" textAlign="center">
              OR
            </Typography>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                fullWidth
                placeholder="Enter meeting link or ID"
                value={joinValue}
                onChange={(e) => setJoinValue(e.target.value)}
              />
              <Button
                variant="outlined"
                onClick={joinMeeting}
                disabled={loading}
                sx={{ textTransform: "none", borderRadius: 2, minWidth: 140 }}
              >
                Join
              </Button>
            </Stack>
          </Stack>
        </Paper>
      </Container>
    </Box>
  );
}



