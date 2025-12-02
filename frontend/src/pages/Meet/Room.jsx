import React, { useEffect, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Box, Typography, IconButton, Stack, Paper, Tooltip } from "@mui/material";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import CallEndIcon from "@mui/icons-material/CallEnd";
import { getSocket } from "../../services/socket";
import useNotifications from "../../context/useNotifications";
import { toast } from "react-toastify";

const STUN_SERVERS = [{ urls: "stun:stun.l.google.com:19302" }];

export default function MeetingRoom() {
  const { id: roomId } = useParams();
  const localVideoRef = useRef(null);
  const [peers, setPeers] = useState({});
  const peersRef = useRef({}); 
  const candidateQueueRef = useRef({});
  const [localStream, setLocalStream] = useState(null);
  const [localUserName, setLocalUserName] = useState("");
  const socketRef = useRef(null);
  const navigate = useNavigate();
  const [micOn, setMicOn] = useState(true);
  const [camOn, setCamOn] = useState(true);
  const { removeMeetingNotification } = useNotifications();

  const ensureQueue = (socketId) => {
    if (!candidateQueueRef.current[socketId]) candidateQueueRef.current[socketId] = [];
    return candidateQueueRef.current[socketId];
  };

  const markRemoteReady = (socketId) => {
    if (peersRef.current[socketId]) {
      peersRef.current[socketId].remoteReady = true;
    }
    setPeers((prev) => ({
      ...prev,
      [socketId]: { ...(prev[socketId] || {}), remoteReady: true },
    }));
    const queue = ensureQueue(socketId);
    const pc = peersRef.current[socketId]?.pc;
    if (!pc) return;
    queue.forEach(async (cand) => {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(cand));
      } catch {
        console.error("Error adding queued ICE candidate");
      }
    });
    candidateQueueRef.current[socketId] = [];
  };

  const createPeerConnection = (targetSocketId) => {
    const pc = new RTCPeerConnection({ iceServers: STUN_SERVERS });
    if (localStream) {
      localStream.getTracks().forEach((track) => pc.addTrack(track, localStream));
    }
    pc.ontrack = (event) => {
      const [stream] = event.streams;
      if (peersRef.current[targetSocketId]) {
        peersRef.current[targetSocketId].stream = stream;
      }
      setPeers((prev) => ({
        ...prev,
        [targetSocketId]: { ...(prev[targetSocketId] || {}), stream, pc },
      }));
    };

    pc.onicecandidate = (e) => {
      if (e.candidate && socketRef.current) {
        socketRef.current.emit("rtc-ice-candidate", {
          targetSocketId,
          candidate: e.candidate,
          roomId,
        });
      }
    };
    peersRef.current[targetSocketId] = {
      pc,
      stream: null,
      remoteReady: false,
      userName: peersRef.current[targetSocketId]?.userName || "",
    };
    return pc;
  };

  useEffect(() => {
    if (!roomId) return;
    let mounted = true;

    const init = async () => {
      let computedLocalName = "User";
      try {
        const userData = localStorage.getItem("user");
        if (userData) {
          const user = JSON.parse(userData);
          computedLocalName = user.name || "User";
          setLocalUserName(computedLocalName);
        } else {
          setLocalUserName(computedLocalName);
        }
      } catch {
        setLocalUserName(computedLocalName);
      }

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (err) {
        console.warn("getUserMedia error:", err?.name, err?.message);
        if (err?.name === "NotReadableError" || err?.name === "TrackStartError") {
          toast.error("Camera is in use by another application or tab. Joining audio-only.");
          try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
            toast.info("Joined as audio-only because camera is busy.");
          } catch (err2) {
            console.error("Audio-only fallback failed:", err2);
            toast.error("Unable to access camera or microphone. Please close other apps/tabs and try again.");
          }
        } else {
          console.error("getUserMedia unexpected error:", err);
          toast.error("Unable to access camera or microphone. Please check permissions.");
        }
      }

      if (!mounted) return;
      if (stream) {
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      }

      const token = localStorage.getItem("token");
      const s = getSocket(token || "");
      socketRef.current = s;

      s.on("rtc-room-users", async ({ peers }) => {
        for (const targetSocketId of peers) {
          const pc = createPeerConnection(targetSocketId);
          peersRef.current[targetSocketId].pc = pc;

          const offer = await pc.createOffer();
          await pc.setLocalDescription(offer);
          s.emit("rtc-offer", { targetSocketId, description: offer, roomId });
        }
      });

      s.on("rtc-user-joined", async ({ socketId: targetSocketId }) => {
        if (!peersRef.current[targetSocketId]) {
          const pc = createPeerConnection(targetSocketId);
          peersRef.current[targetSocketId].pc = pc;
        }
        try {
          s.emit("rtc-user-info", { roomId, userName: computedLocalName });
        } catch (e) {
          console.log("Failed to send user info:", e.message);
        }
      });

      s.on("rtc-offer", async ({ fromSocketId, description }) => {
        let pc = peersRef.current[fromSocketId]?.pc;
        if (!pc) {
          pc = createPeerConnection(fromSocketId);
          peersRef.current[fromSocketId].pc = pc;
        }
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        markRemoteReady(fromSocketId);
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        s.emit("rtc-answer", { targetSocketId: fromSocketId, description: answer, roomId });
      });

      s.on("rtc-answer", async ({ fromSocketId, description }) => {
        const pc = peersRef.current[fromSocketId]?.pc;
        if (!pc) return;
        await pc.setRemoteDescription(new RTCSessionDescription(description));
        markRemoteReady(fromSocketId);
      });

      s.on("rtc-ice-candidate", async ({ fromSocketId, candidate }) => {
        const pc = peersRef.current[fromSocketId]?.pc;
        if (!pc || !candidate) return;
        const peerState = peersRef.current[fromSocketId];
        const isReady = peerState?.remoteReady;
        if (isReady) {
          try {
            await pc.addIceCandidate(new RTCIceCandidate(candidate));
          } catch {
            console.error("Error adding ICE candidate");
          }
        } else {
          ensureQueue(fromSocketId).push(candidate);
        }
      });

      s.on("rtc-peer-info", ({ socketId: otherSocketId, userName }) => {
        if (!otherSocketId) return;
        if (!peersRef.current[otherSocketId]) {
          peersRef.current[otherSocketId] = { pc: null, stream: null, remoteReady: false, userName: userName || "User" };
        } else {
          peersRef.current[otherSocketId].userName = userName || "User";
        }
        setPeers((prev) => ({
          ...prev,
          [otherSocketId]: { ...(prev[otherSocketId] || {}), userName: userName || "User" },
        }));
      });

      s.on("rtc-user-left", ({ socketId }) => {
        const pc = peersRef.current[socketId]?.pc;
        if (pc) {
          try { pc.close(); } catch {}
          delete peersRef.current[socketId];
        }
        setPeers((prev) => {
          const copy = { ...prev };
          delete copy[socketId];
          return copy;
        });
      });

      s.emit("rtc-join-room", { roomId });

      try {
        s.emit("rtc-user-info", { roomId, userName: computedLocalName });
      } catch (e) {
        console.log("Failed to send user info:", e.message);
      }
    };

    init();
    return () => {
      mounted = false;
      try {
        socketRef.current?.off("rtc-room-users");
        socketRef.current?.off("rtc-user-joined");
        socketRef.current?.off("rtc-offer");
        socketRef.current?.off("rtc-answer");
        socketRef.current?.off("rtc-ice-candidate");
        socketRef.current?.off("rtc-user-left");
      } catch(err) {console.log(err)}
      Object.values(peersRef.current).forEach((peerData) => {
        try { 
          if (peerData?.pc) {
            peerData.pc.close(); 
          }
        } catch {}
      });
      peersRef.current = {};
      if (localStream) {
        localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [roomId]);

  const toggleMic = () => {
    if (!localStream) return;
    const audioTracks = localStream.getAudioTracks();
    if (audioTracks.length) {
      const next = !micOn;
      audioTracks.forEach((t) => { t.enabled = next; });
      setMicOn(next);
    }
  };

  const toggleCam = () => {
    if (!localStream) return;
    const videoTracks = localStream.getVideoTracks();
    if (videoTracks.length) {
      const next = !camOn;
      videoTracks.forEach((t) => { t.enabled = next; });
      setCamOn(next);
    }
  };

  const leaveMeeting = () => {
    try {
      socketRef.current?.emit("rtc-leave-room", { roomId });
    } catch {
      console.log("Error emitting leave room");
    }
    
    Object.values(peersRef.current).forEach((peerData) => {
      try { 
        if (peerData?.pc) {
          peerData.pc.close();
        }
      } catch {
        console.log("Error closing peer connection");
      }
    });
    peersRef.current = {};
    setPeers({});
    if (localStream) {
      localStream.getTracks().forEach((t) => t.stop());
    }
    try {
      removeMeetingNotification(roomId);
    } catch (e) {
      console.error("Error removing meeting notification on leave:", e);
    }
    navigate("/connections");
  };

  if (!roomId) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography variant="h6">Invalid meeting ID</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ height: "calc(100vh - 80px)", display: "flex", flexDirection: "column" }}>
      <Box sx={{ flex: 1, display: "grid", gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" }, gap: 1, p: 1 }}>
        <Box sx={{ position: "relative", background: "#000", borderRadius: 2, overflow: "hidden" }}>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
          <Box
            sx={{
              position: "absolute",
              bottom: 10,
              left: 10,
              backgroundColor: "rgba(0, 0, 0, 0.6)",
              color: "white",
              px: 1.5,
              py: 0.5,
              borderRadius: 1,
              fontSize: "0.9rem",
              fontWeight: 500,
            }}
          >
            {localUserName} (You)
          </Box>
        </Box>

        {Object.entries(peers).map(([sid, p]) => (
          <Box
            key={sid}
            sx={{ position: "relative", background: "#000", borderRadius: 2, overflow: "hidden" }}
          >
            <video
              autoPlay
              playsInline
              ref={(el) => {
                if (el && p.stream && el.srcObject !== p.stream) {
                  el.srcObject = p.stream;
                }
              }}
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
            <Box
              sx={{
                position: "absolute",
                bottom: 10,
                left: 10,
                backgroundColor: "rgba(0, 0, 0, 0.6)",
                color: "white",
                px: 1.5,
                py: 0.5,
                borderRadius: 1,
                fontSize: "0.9rem",
                fontWeight: 500,
              }}
            >
              {p.userName || "User"}
            </Box>
          </Box>
        ))}
      </Box>
      <Paper
        elevation={3}
        sx={{
          p: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          borderRadius: 0,
        }}
      >
        <Tooltip title={micOn ? "Mute" : "Unmute"}>
          <IconButton
            onClick={toggleMic}
            sx={{
              backgroundColor: micOn ? "success.main" : "error.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
            }}
          >
            {micOn ? <MicIcon /> : <MicOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title={camOn ? "Turn off camera" : "Turn on camera"}>
          <IconButton
            onClick={toggleCam}
            sx={{
              backgroundColor: camOn ? "primary.main" : "warning.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
            }}
          >
            {camOn ? <VideocamIcon /> : <VideocamOffIcon />}
          </IconButton>
        </Tooltip>
        <Tooltip title="Leave meeting">
          <IconButton
            onClick={leaveMeeting}
            sx={{
              backgroundColor: "error.main",
              color: "#fff",
              "&:hover": { opacity: 0.9 },
              ml: 2,
            }}
          >
            <CallEndIcon />
          </IconButton>
        </Tooltip>
      </Paper>
    </Box>
  );
}


