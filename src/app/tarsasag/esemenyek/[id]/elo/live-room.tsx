"use client";

import "@livekit/components-styles";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Track } from "livekit-client";
import {
  ControlBar,
  GridLayout,
  LiveKitRoom,
  ParticipantTile,
  RoomAudioRenderer,
  StartAudio,
  useParticipants,
  useTracks,
} from "@livekit/components-react";
import { muteEveryone } from "./actions";

type Role = "host" | "speaker" | "viewer";

/** A LiveKit felülete A Társaság színeivel: erdőzöld alap, antik arany kiemelés, nyugodt mozgás. */
const THEME = {
  "--lk-bg": "#1c2520",
  "--lk-bg2": "#243029",
  "--lk-bg3": "#2c3a32",
  "--lk-bg4": "#34443b",
  "--lk-bg5": "#3d4f44",
  "--lk-fg": "#faf9f6",
  "--lk-border-color": "rgba(197,160,89,0.25)",
  "--lk-accent-bg": "#c5a059",
  "--lk-accent-fg": "#1c2520",
  "--lk-accent2": "#cfae6f",
  "--lk-accent3": "#d8bc85",
  "--lk-accent4": "#3d4f44",
  "--lk-danger": "#c97b6b",
  "--lk-border-radius": "0.375rem",
  "--lk-font-family": "inherit",
} as React.CSSProperties;

const HINT: Record<Role, string> = {
  host: "Házigazdaként kapcsolhatod be a kamerát, a mikrofont és a képernyőmegosztást. Belépéskor mindenki némítva érkezik.",
  speaker: "Némítva érkezel. A kamerát és a mikrofont a lenti gombokkal kapcsolhatod be, ha szeretnéd.",
  viewer: "Nézőként vagy jelen: látod és hallod az alkalmat. Kérdezni élőben a Belső Kör tagjai tudnak.",
};

export function LiveRoom({
  serverUrl,
  token,
  role,
  eventId,
  backHref,
}: {
  serverUrl: string;
  token: string;
  role: Role;
  eventId: string;
  backHref: string;
}) {
  const router = useRouter();
  return (
    <div data-lk-theme="default" style={THEME} className="overflow-hidden rounded-md border border-gold/30">
      <LiveKitRoom
        serverUrl={serverUrl}
        token={token}
        connect
        audio={false}
        video={false}
        onDisconnected={() => router.push(backHref)}
        className="flex h-[min(78vh,760px)] flex-col"
      >
        <Stage />
        <RoomAudioRenderer />
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gold/20 px-3 py-2">
          <p className="max-w-xl text-xs text-[#d9d4c7]">{HINT[role]}</p>
          <div className="flex items-center gap-2">
            {role === "host" && <MuteAll eventId={eventId} />}
            <ParticipantCount />
          </div>
        </div>
        <ControlBar variation="minimal" controls={{ chat: false, settings: false }} />
        <StartAudio label="Hang bekapcsolása" />
      </LiveKitRoom>
    </div>
  );
}

function Stage() {
  const tracks = useTracks(
    [
      { source: Track.Source.Camera, withPlaceholder: true },
      { source: Track.Source.ScreenShare, withPlaceholder: false },
    ],
    { onlySubscribed: false },
  );
  // A kamerát nem használó, csak hallgató résztvevők ne foglaljanak helyet a képen — kivéve, ha senki más nincs.
  const visible = tracks.filter((t) => t.publication || t.participant.permissions?.canPublish);
  return (
    <div className="min-h-0 flex-1">
      <GridLayout tracks={visible.length ? visible : tracks} className="h-full">
        <ParticipantTile />
      </GridLayout>
    </div>
  );
}

function ParticipantCount() {
  const n = useParticipants().length;
  return <span className="text-xs text-[#d9d4c7]">{n} fő van jelen</span>;
}

function MuteAll({ eventId }: { eventId: string }) {
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState("");
  return (
    <span className="flex items-center gap-2">
      {msg && <span className="text-xs text-[#d9d4c7]">{msg}</span>}
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          start(async () => {
            const res = await muteEveryone(eventId);
            setMsg(res.ok ? `${res.muted} mikrofon lenémítva` : "A lenémítás most nem sikerült");
          })
        }
        className="lk-button text-xs"
      >
        {pending ? "…" : "Mindenki lenémítása"}
      </button>
    </span>
  );
}
