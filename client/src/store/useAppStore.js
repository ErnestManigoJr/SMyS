import { create } from 'zustand';

export const useAppStore = create((set, get) => ({
  // Navigation
  screen: 'entrance',
  setScreen: (screen) => set({ screen }),

  // User identity
  userId: null,
  displayName: '',
  selfieDataUrl: '',
  voiceId: 'alloy',
  setIdentity: (data) => set(data),

  // Room
  roomId: null,
  roomToken: null,
  inviteRoomId: null,
  setRoomId: (roomId) => set({ roomId }),
  setRoomToken: (roomToken) => set({ roomToken }),
  setInviteRoomId: (inviteRoomId) => set({ inviteRoomId }),

  // Whisper queue
  whispers: [],
  addWhisper: (text, timing = 'hold') => set(s => ({
    whispers: [...s.whispers, { id: Date.now(), text, timing, used: false, createdAt: Date.now() }]
  })),
  markWhisperUsed: (id) => set(s => ({
    whispers: s.whispers.map(w => w.id === id ? { ...w, used: true } : w)
  })),
  clearWhispers: () => set({ whispers: [] }),

  // Recording — currentClip: { url, size, mimeType } | null
  isRecording: false,
  currentClip: null,
  setRecording: (isRecording) => set({ isRecording }),
  setClip: (clip) => set({ currentClip: clip }),

  // Room state
  participants: [],
  setParticipants: (participants) => set({ participants }),

  // Speaking detection (identity strings from LiveKit ActiveSpeakersChanged)
  speakingIds: [],
  setSpeakingIds: (speakingIds) => set({ speakingIds }),

  // Mute state
  isMuted: false,
  setMuted: (isMuted) => set({ isMuted }),

  // LMD — twin thought bubbles  { [identity]: string | null }
  twinThoughts: {},
  setTwinThought: (identity, text) => set(s => ({
    twinThoughts: { ...s.twinThoughts, [identity]: text || null },
  })),

  // Watch party
  watchUrl: null,
  watchHost: null,
  watchType: null, // 'mp4' | 'youtube'
  setWatchParty: (watchUrl, watchHost, watchType = 'mp4') => set({ watchUrl, watchHost, watchType }),
  clearWatchParty: () => set({ watchUrl: null, watchHost: null, watchType: null }),

  // Reset room state on leave
  resetRoom: () => set({
    roomId: null,
    roomToken: null,
    participants: [],
    speakingIds: [],
    isMuted: false,
    isRecording: false,
    currentClip: null,
    whispers: [],
    watchUrl: null,
    watchHost: null,
    watchType: null,
    twinThoughts: {},
  }),
}));
