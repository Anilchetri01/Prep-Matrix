import { useEffect, useRef } from 'react';
import { Camera, CameraOff, ShieldAlert } from 'lucide-react';

export type CameraStatus = 'idle' | 'requesting' | 'live' | 'denied' | 'error';

interface CameraPreviewProps {
  isDarkMode: boolean;
  status: CameraStatus;
  stream: MediaStream | null;
}

export function CameraPreview({ isDarkMode, status, stream }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) {
      return;
    }

    if (!stream) {
      videoElement.srcObject = null;
      return;
    }

    videoElement.srcObject = stream;
    console.log('[CameraPreview] stream:attached', {
      activeTracks: stream.getTracks().map((track) => ({
        enabled: track.enabled,
        kind: track.kind,
        label: track.label,
        readyState: track.readyState,
      })),
    });

    const playVideo = async () => {
      try {
        await videoElement.play();
      } catch (error) {
        console.warn('[CameraPreview] play:warning', error);
      }
    };

    void playVideo();

    return () => {
      if (videoElement.srcObject === stream) {
        videoElement.srcObject = null;
      }
    };
  }, [stream]);

  const frameClass = isDarkMode
    ? 'border-white/12 bg-slate-950/75 shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_24px_60px_rgba(2,6,23,0.28)]'
    : 'border-slate-200/80 bg-white/85 shadow-[0_0_0_1px_rgba(56,189,248,0.10),0_20px_52px_rgba(15,23,42,0.12)]';

  const stageClass = isDarkMode
    ? 'from-slate-900 via-slate-900 to-indigo-950'
    : 'from-slate-100 via-white to-indigo-100';

  const overlayTextClass = isDarkMode ? 'text-white/80' : 'text-slate-700';
  const overlaySubtleTextClass = isDarkMode ? 'text-white/60' : 'text-slate-500';
  const overlayCircleClass = isDarkMode
    ? 'border-white/10 bg-white/5'
    : 'border-white/80 bg-white/85 shadow-sm';

  const statusBadgeClass =
    status === 'live'
      ? isDarkMode
        ? 'border-emerald-400/20 bg-emerald-500/10 text-emerald-100'
        : 'border-emerald-200 bg-emerald-50 text-emerald-700'
      : status === 'requesting'
      ? isDarkMode
        ? 'border-amber-400/20 bg-amber-500/10 text-amber-100'
        : 'border-amber-200 bg-amber-50 text-amber-700'
      : status === 'denied'
      ? isDarkMode
        ? 'border-rose-400/20 bg-rose-500/10 text-rose-100'
        : 'border-rose-200 bg-rose-50 text-rose-700'
      : isDarkMode
      ? 'border-white/10 bg-white/6 text-white/75'
      : 'border-slate-200 bg-white text-slate-600';

  return (
    <div className={`relative min-w-0 max-w-full overflow-hidden rounded-[24px] border ${frameClass}`}>
      <div className={`aspect-[16/10] min-h-[190px] bg-gradient-to-br sm:min-h-[300px] md:min-h-[360px] lg:min-h-[440px] xl:min-h-[500px] ${stageClass}`}>
        <video
          ref={videoRef}
          autoPlay
          muted
          playsInline
          className={`h-full w-full object-cover transition-opacity duration-300 ${
            status === 'live' ? 'opacity-100 scale-x-[-1]' : 'opacity-0'
          }`}
        />

        {status !== 'live' && (
          <div
            className={`absolute inset-0 flex flex-col items-center justify-center gap-2.5 px-4 text-center sm:px-6 ${overlayTextClass}`}
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.12),transparent_46%)]" />
            <div
              className={`relative flex h-14 w-14 items-center justify-center rounded-full border ${overlayCircleClass} backdrop-blur`}
            >
              {status === 'idle' && (
                <span className="absolute inset-0 rounded-full border border-sky-400/30 animate-ping" />
              )}
              {status === 'denied' ? (
                <ShieldAlert className="h-6 w-6 text-rose-300" />
              ) : status === 'error' ? (
                <CameraOff className="h-6 w-6 text-amber-300" />
              ) : (
                <Camera className="h-6 w-6 text-cyan-300" />
              )}
            </div>
            <div className="space-y-1">
              <p className="break-words text-sm font-semibold">
                {status === 'requesting' && 'Requesting camera access'}
                {status === 'idle' && 'Camera ready'}
                {status === 'denied' && 'Camera permission blocked'}
                {status === 'error' && 'Camera unavailable'}
              </p>
              <p className={`break-words text-xs ${overlaySubtleTextClass}`}>
                {status === 'requesting' && 'Approve the browser prompt to start your live preview.'}
                {status === 'idle' && 'The camera will activate as soon as the interview begins.'}
                {status === 'denied' &&
                  'Allow camera access in your browser settings to enable live video.'}
                {status === 'error' &&
                  'No camera could be started. Check device availability and try again.'}
              </p>
            </div>
          </div>
        )}
      </div>

      <div
        className={`absolute left-3 top-3 inline-flex max-w-[calc(100%-1.5rem)] items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold backdrop-blur ${statusBadgeClass}`}
      >
        <span
          className={`h-2 w-2 rounded-full ${
            status === 'live'
              ? 'animate-pulse bg-emerald-300'
              : status === 'requesting'
              ? 'bg-amber-300'
              : status === 'denied'
              ? 'bg-rose-300'
              : isDarkMode
              ? 'bg-white/40'
              : 'bg-slate-300'
          }`}
        />
        {status === 'live'
          ? 'Camera active'
          : status === 'requesting'
          ? 'Requesting access'
          : status === 'denied'
          ? 'Permission blocked'
          : status === 'error'
          ? 'Unavailable'
          : 'Camera ready'}
      </div>
    </div>
  );
}
