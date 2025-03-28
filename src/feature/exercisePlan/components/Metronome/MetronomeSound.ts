/**
 * Handles the sound generation for the metronome
 */
class MetronomeSound {
  /**
   * Play a metronome sound using the Web Audio API
   * @param context The AudioContext instance
   */
  static play(context: AudioContext): void {
    // Create oscillator for click sound
    const oscillator = context.createOscillator();
    const gainNode = context.createGain();
    
    // Configure oscillator
    oscillator.type = 'sine';
    oscillator.frequency.value = 800;
    
    // Configure gain (volume envelope)
    gainNode.gain.value = 0;
    gainNode.gain.setValueAtTime(0, context.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.3, context.currentTime + 0.001);
    gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.1);
    
    // Connect nodes
    oscillator.connect(gainNode);
    gainNode.connect(context.destination);
    
    // Start and stop oscillator to create a short click
    oscillator.start(context.currentTime);
    oscillator.stop(context.currentTime + 0.1);
  }
}

export default MetronomeSound; 