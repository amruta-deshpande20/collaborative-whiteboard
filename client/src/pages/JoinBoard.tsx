import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { API_URL } from "../config";

function JoinBoard() {
  const { token: inviteToken } = useParams();
  const navigate = useNavigate();
  const [message, setMessage] = useState("Joining the shared board...");

  useEffect(() => {
    async function joinBoard() {
      const authToken = sessionStorage.getItem("gatherboard-token");

      if (!authToken) {
        sessionStorage.setItem("gatherboard-pending-invite", inviteToken || "");
        navigate("/", { replace: true });
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/api/boards/join/${inviteToken}`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Unable to join this board.");
        }

        sessionStorage.setItem("gatherboard-open-board", data.boardId);
        sessionStorage.setItem("gatherboard-page", "board");
        navigate("/", { replace: true });
        window.location.reload();
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "Something went wrong.",
        );
      }
    }

    void joinBoard();
  }, [inviteToken, navigate]);

  return <p style={{ padding: "2rem" }}>{message}</p>;
}

export default JoinBoard;
