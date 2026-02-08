
export enum AppState {
  IDLE = 'IDLE',
  UPLOADING = 'UPLOADING',
  ANALYZING = 'ANALYZING',
  READY = 'READY',
  PLAYING = 'PLAYING'
}

export interface AudioMetadata {
  name: string;
  duration: number;
}
