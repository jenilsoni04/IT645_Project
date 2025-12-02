import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Paper,
  Typography,
  Grid,
  Card,
  CardContent,
  Button,
  CircularProgress,
  Divider,
  Stack,
} from "@mui/material";
import axios from "axios";
import { toast } from "react-toastify";
import Navbar from "../../components/Navbar";
import { useNavigate } from "react-router-dom";
import useNotifications from "../../context/useNotifications";

const Connections = () => {
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingMeetingId, setCreatingMeetingId] = useState(null);
  const navigate = useNavigate();
  const { meetingNotifications } = useNotifications();

  useEffect(() => {
    const fetchConnections = async () => {
      const token = localStorage.getItem("token");
      const userData = localStorage.getItem("user");

      if (!token || !userData) {
        toast.error("You must be logged in to view connections");
        return;
      }

      try {
        const user = JSON.parse(userData);
        const userId = user._id || user.id || user.userId;

        if (!userId) {
          toast.error("Invalid user data. Please log in again.");
          return;
        }

        const res = await axios.get("http://localhost:3000/connect/connections", {
          headers: { Authorization: `Bearer ${token}` },
        });

        setConnections(res.data.data || []);
      } catch (err) {
        console.error("Error fetching connections:", err);
        toast.error("Failed to fetch connections");
      } finally {
        setLoading(false);
      }
    };

    fetchConnections();
  }, []);

  const handleStartMeeting = async (inviteeId) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Please log in to start a meeting");
      return;
    }
    try {
      setCreatingMeetingId("creating");
      const res = await axios.post(
        "http://localhost:3000/meetings",
        { title: "", inviteeId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const meetingId = res.data?.meetingId;
      if (!meetingId) throw new Error("Failed to create meeting");
      navigate(`/meet/${meetingId}`);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to create meeting");
    } finally {
      setCreatingMeetingId(null);
    }
  };

  const getActiveMeetingForConnection = (connectionId) => {
    return Object.values(meetingNotifications).find(
      (notif) => notif.connectionId === connectionId
    );
  };

  if (loading)
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 10 }}>
        <CircularProgress />
      </Box>
    );

  return (
    <Box sx={{ backgroundColor: "#f8faf8", minHeight: "100vh" }}>
      <Navbar />
      <Container sx={{ mt: 6, pb: 6 }}>
        <Paper
          elevation={5}
          sx={{
            p: 5,
            borderRadius: 4,
            background: "linear-gradient(135deg, #ffffff, #f4faf5)",
            boxShadow: "0 4px 25px rgba(0, 0, 0, 0.05)",
          }}
        >
          <Typography
            variant="h5"
            gutterBottom
            sx={{
              fontWeight: 700,
              color: "#1b5e20",
              textAlign: "center",
              mb: 3,
            }}
          >
            🌿 Your Connections
          </Typography>

          <Divider sx={{ mb: 4 }} />

          {!connections.length ? (
            <Typography align="center" sx={{ color: "gray" }}>
              You haven’t connected with anyone yet 
            </Typography>
          ) : (
            <Grid container spacing={3}>
              {connections.map((conn) => (
                <Grid item xs={12} sm={6} md={4} key={conn._id}>
                  <Card
                    elevation={4}
                    sx={{
                      borderRadius: 4,
                      transition: "all 0.3s ease",
                      "&:hover": {
                        transform: "translateY(-5px)",
                        boxShadow: "0 8px 20px rgba(27, 94, 32, 0.1)",
                      },
                    }}
                  >
                    <CardContent>
                      <Typography
                        variant="h6"
                        fontWeight={600}
                        sx={{ color: "#2e7d32", mb: 1 }}
                      >
                        {conn.name}
                      </Typography>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mb: 1 }}
                      >
                        {conn.email}
                      </Typography>

                      <Typography variant="body2" sx={{ mt: 1 }}>
                        <strong>Skills Have:</strong>{" "}
                        {conn.skillsHave?.join(", ") || "N/A"}
                      </Typography>
                      <Typography variant="body2">
                        <strong>Skills Want:</strong>{" "}
                        {conn.skillsWant?.join(", ") || "N/A"}
                      </Typography>

                      <Stack direction="row" spacing={1.5} sx={{ mt: 2 }}>
                        <Button
                          variant="outlined"
                          size="small"
                          color="error"
                          sx={{
                            textTransform: "none",
                            borderRadius: 3,
                            px: 2,
                          }}
                          onClick={() => toast.info("Feature coming soon!")}
                        >
                          Remove
                        </Button>

                        {getActiveMeetingForConnection(conn._id) ? (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              textTransform: "none",
                              borderRadius: 3,
                              backgroundColor: "#4caf50",
                              "&:hover": { backgroundColor: "#388e3c" },
                            }}
                            onClick={() => {
                              const activeMeet =
                                getActiveMeetingForConnection(conn._id);
                              if (activeMeet) {
                                navigate(`/meet/${activeMeet.meetingId}`);
                              }
                            }}
                          >
                            Join Meet
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            size="small"
                            sx={{
                              textTransform: "none",
                              borderRadius: 3,
                              backgroundColor: "#1976d2",
                              "&:hover": { backgroundColor: "#1259a3" },
                            }}
                            onClick={() => handleStartMeeting(conn._id)}
                            disabled={creatingMeetingId === "creating"}
                          >
                            {creatingMeetingId === "creating"
                              ? "Starting..."
                              : "Meet"}
                          </Button>
                        )}
                      </Stack>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default Connections;
