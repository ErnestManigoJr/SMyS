// Simple audio state — speaks a line via browser TTS or Azure TTS audio if provided
export async function speakLine(text, audioBase64 = null) {
  if (audioBase64) {
    const audio = new Audio(audioBase64);
    await audio.play();
    return;
  }
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.rate = 0.95;
    u.pitch = 1;
    window.speechSynthesis.speak(u);
  }
}
